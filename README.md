# GitGrade – GitHub URL Verifier

This project was built for the GitGrade Hackathon to evaluate any public GitHub repository and convert it into a Score, Summary, and Personalized Roadmap for the developer. [web:1]

## Project Overview

GitHub repositories are the real proof of a student’s coding skills, but most students do not know how their repos look to recruiters or mentors. This app acts as a “Repository Mirror” that analyzes a repo and provides honest, actionable feedback. [web:1]

## Features

- Accepts any **public GitHub repository URL** as input. [web:1]  
- Fetches repository data using the GitHub REST API: folder structure, files, languages, commits, branches, pull requests, README, and tests. [web:1]  
- Calculates a **0–100 score** and rating (Beginner / Intermediate / Advanced) based on:
  - Project structure and organization  
  - Documentation quality  
  - Tests and CI/CD indicators  
  - Git commit habits and branching  
  - Real‑world relevance and size [web:1]  
- Generates a **written summary** of the repo’s current quality. [web:1]  
- Produces a **personalized roadmap** with clear next steps (improve README, add tests, use branches/PRs, add CI, etc.). [web:1]  

## Tech Stack

- **Frontend:** React + Vite, Axios  
- **Backend:** Node.js, Express, Axios  
- **APIs:** GitHub REST API (public endpoints, optional personal access token) [web:1]  

## Folder Structure

- `gitgrade-backend/` – Node.js + Express API to analyze repositories.  
- `gitgrade-frontend/` – React UI where users paste the GitHub URL and view results.  

## How to Run Locally

1. Clone the repository:
git clone https://github.com/Sathiyasri16/GITHUB-URL-VERIFIER.git
cd GITHUB-URL-VERIFIER

2. Start the backend:
cd gitgrade-backend
npm install
npm start
The backend runs on `http://localhost:4000`. [web:1]

3. Start the frontend:
cd ../gitgrade-frontend
npm install
npm run dev
Open the URL shown in the terminal (usually `http://localhost:5173/`). [web:1]

4. Use the app:
- Paste any **public GitHub repository URL**.  
- Click **Analyze** to see the **score, summary, and personalized roadmap** for that repository. [web:1]  

## Submission

Repository name: **GITHUB-URL-VERIFIER**  
GitHub URL: `https://github.com/Sathiyasri16/GITHUB-URL-VERIFIER` [web:1]
Step 3: Commit and push
In terminal at project root:
git add README.md
git commit -m "Add README"
git push
