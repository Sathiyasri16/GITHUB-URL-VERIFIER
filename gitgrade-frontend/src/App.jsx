import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await axios.post("http://localhost:4000/api/analyze", {
        repoUrl,
      });
      setResult(res.data);
    } catch (err) {
      setError("Failed to analyze repository. Check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>GitGrade – Repository Mirror</h1>

      <form onSubmit={handleAnalyze} className="form">
        <input
          type="url"
          placeholder="Paste public GitHub repository URL"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="card">
          <h2>{result.repo}</h2>
          <p>
            <strong>Score:</strong> {result.score} / 100 ({result.rating})
          </p>
          <p className="summary">{result.summary}</p>

          <h3>Personalized Roadmap</h3>
          <ul>
            {result.roadmap.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>

          <div className="metrics">
            <p>Structure: {result.metrics.structureScore} / 25</p>
            <p>Documentation: {result.metrics.documentationScore} / 20</p>
            <p>Tests & CI: {result.metrics.testsScore} / 20</p>
            <p>Git Practices: {result.metrics.gitScore} / 20</p>
            <p>Relevance: {result.metrics.relevanceScore} / 15</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
