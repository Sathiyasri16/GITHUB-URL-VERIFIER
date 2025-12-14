import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ""; // optional

const gh = axios.create({
  baseURL: "https://api.github.com",
  headers: GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}
});

function parseRepoUrl(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

app.post("/api/analyze", async (req, res) => {
  try {
    const { repoUrl } = req.body;
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      return res.status(400).json({ error: "Invalid GitHub repository URL" });
    }
    const { owner, repo } = parsed;

    const repoRes = await gh.get(`/repos/${owner}/${repo}`);
    const repoData = repoRes.data;

    const contentsRes = await gh.get(`/repos/${owner}/${repo}/contents`);
    const contents = contentsRes.data;

    const langsRes = await gh.get(`/repos/${owner}/${repo}/languages`);
    const languages = langsRes.data;

    const commitsRes = await gh.get(`/repos/${owner}/${repo}/commits`, {
      params: { per_page: 50 }
    });
    const commits = commitsRes.data;

    const branchesRes = await gh.get(`/repos/${owner}/${repo}/branches`);
    const branches = branchesRes.data;

    const prsRes = await gh.get(`/repos/${owner}/${repo}/pulls`, {
      params: { state: "all", per_page: 20 }
    });
    const prs = prsRes.data;

    let readmeText = "";
    try {
      const readmeRes = await gh.get(`/repos/${owner}/${repo}/readme`, {
        headers: { Accept: "application/vnd.github.raw+json" }
      });
      readmeText = readmeRes.data;
    } catch (e) {
      readmeText = "";
    }

    const files = contents.filter(item => item.type === "file");
    const folders = contents.filter(item => item.type === "dir");
    const hasSrc = folders.some(f => f.name.toLowerCase() === "src");
    const hasTestsFolder = folders.some(f => f.name.toLowerCase().includes("test"));
    const hasWorkflowFolder = folders.some(
      f => f.path.toLowerCase().includes(".github") || f.path.toLowerCase().includes("workflow")
    );
    const testFiles = files.filter(f => /test|spec/i.test(f.name));

    const hasReadme = !!readmeText;
    const readmeLength = readmeText.split(/\s+/).length;
    let documentationScore = 0;
    if (hasReadme) {
      if (readmeLength > 150) documentationScore = 18;
      else if (readmeLength > 60) documentationScore = 14;
      else documentationScore = 8;
    } else {
      documentationScore = 2;
    }
    if (/install|usage|getting started/i.test(readmeText)) {
      documentationScore += 2;
    }
    documentationScore = Math.min(documentationScore, 20);

    let testsScore = 0;
    if (hasTestsFolder || testFiles.length > 0) testsScore += 12;
    if (hasWorkflowFolder) testsScore += 4;
    if (/coverage|jest|pytest|mocha|cypress/i.test(readmeText)) testsScore += 4;
    testsScore = Math.min(testsScore, 20);

    const commitCount = commits.length;
    const branchCount = branches.length;
    const prCount = prs.length;

    let gitScore = 0;
    if (commitCount > 20) gitScore += 8;
    else if (commitCount > 5) gitScore += 5;
    else if (commitCount > 0) gitScore += 3;

    if (branchCount > 1) gitScore += 4;
    if (prCount > 0) gitScore += 4;

    const goodCommitMessages = commits.filter(c =>
      c.commit && /\bfix|feat|refactor|docs|test|chore/i.test(c.commit.message)
    ).length;
    if (goodCommitMessages > commitCount / 2) gitScore += 4;
    gitScore = Math.min(gitScore, 20);

    let structureScore = 0;
    if (hasSrc) structureScore += 8;
    if (folders.length > 3) structureScore += 6;
    if (files.length > 10) structureScore += 4;
    structureScore = Math.min(structureScore, 25);

    let relevanceScore = 0;
    const size = repoData.size;
    if (size > 3000) relevanceScore += 6;
    else if (size > 1000) relevanceScore += 4;
    if (/api|dashboard|ecommerce|auth|payment|ml|ai|chat/i.test(repoData.description || "")) {
      relevanceScore += 6;
    }
    if (repoData.stargazers_count > 0 || repoData.forks_count > 0) {
      relevanceScore += 3;
    }
    relevanceScore = Math.min(relevanceScore, 15);

    const totalScore = structureScore + documentationScore + testsScore + gitScore + relevanceScore;

    let rating;
    if (totalScore >= 80) rating = "Advanced";
    else if (totalScore >= 50) rating = "Intermediate";
    else rating = "Beginner";

    const summaryParts = [];
    if (structureScore >= 18) summaryParts.push("Project has a solid and well-organized folder structure.");
    else summaryParts.push("Project structure is basic and can be better organized into clear folders.");
    if (documentationScore >= 15) summaryParts.push("Documentation is reasonably detailed and helpful.");
    else summaryParts.push("Documentation is limited; README should better explain setup and usage.");
    if (testsScore >= 14) summaryParts.push("There is good focus on tests and automation.");
    else summaryParts.push("Automated tests and CI/CD are missing or minimal.");
    if (gitScore >= 14) summaryParts.push("Git usage shows consistent commits and use of branches/PRs.");
    else summaryParts.push("Git practices can be improved with more structured commits and branching.");

    const summary = summaryParts.join(" ");

    const roadmap = [];
    if (structureScore < 18) {
      roadmap.push("Refactor the folder structure into clear modules such as src/, components/, services/, and config/.");
    }
    if (!hasReadme || documentationScore < 15) {
      roadmap.push("Create or expand README.md with project overview, tech stack, setup steps, and usage examples.");
    }
    if (testsScore < 14) {
      roadmap.push("Add unit and integration tests for core modules and document how to run them.");
      roadmap.push("Set up a CI pipeline (for example, GitHub Actions) to run tests on every push or pull request.");
    }
    if (gitScore < 14) {
      roadmap.push("Adopt meaningful commit messages and follow a convention such as feat/fix/docs.");
      roadmap.push("Use feature branches and pull requests instead of committing everything directly to main.");
    }
    if (relevanceScore < 10) {
      roadmap.push("Clarify the real-world use case in the README and consider adding small features that mirror real scenarios.");
    }

    res.json({
      repo: `${owner}/${repo}`,
      score: totalScore,
      rating,
      summary,
      roadmap,
      metrics: {
        structureScore,
        documentationScore,
        testsScore,
        gitScore,
        relevanceScore,
        languages,
        commitCount,
        branchCount,
        prCount
      }
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to analyze repository" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
