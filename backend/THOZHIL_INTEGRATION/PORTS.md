# THOZHIL — Development Ports Specification

**Date:** 2026-09-30  
**Browser Entry Origin:** `http://localhost:8080` (Gateway)  

---

## Service Port Map

| Service Name | Assigned Port | Type | Purpose | Start Command |
| :--- | :--- | :--- | :--- | :--- |
| **Thozhil Gateway** | `8080` | Express Proxy | Unified browser-facing reverse proxy origin | `cd packages/gateway && node server.js` |
| **Admin Shell** | `3000` | React / Vite | Host orchestrator application UI | `npx nx dev admin-shell` |
| **Project A Backend** | `5010` | Node.js Express ESM | AI Video Interviewer API & WebSocket gateway | `cd project_a/server && node src/server.js` |
| **Project A Frontend** | `5011` | React 19 / Vite | AI Video Interviewer Candidate/Recruiter UI | `cd project_a/frontend && npx vite --port 5011` |
| **Project B App** | `5020` | Python FastAPI | AI Resume Screener API & Static UI | `cd apps/resume/backend && uvicorn app:app --port 5020` |
| **Project C Node API** | `5030` | Node.js Express | AI Project Analyser Log Proxy API | `cd project_c/intern/backend && node server.js` |
| **Project C Python AI** | `5031` | Python FastAPI | AI Code Review Microservice | `cd project_c/intern/ai-service && uvicorn app:app --port 5031` |
| **Project C Frontend** | `5032` | React 19 TS / Vite | AI Project Analyser Intern/Authority UI | `cd project_c/intern/frontend && npx vite --port 5032` |
| **Project D Express API**| `5040` | Node.js Express | AI Coding Assessment Platform API | `cd assessment-platform/assessment-backend && node src/server.js` |
| **Project D Admin UI** | `5041` | Vue 3 / Vite | AI Coding Admin Dashboard | `npx nx run assessment-admin:dev` |
| **Project D Candidate UI**| `5042` | Vue 3 / Vite | AI Coding Candidate Workspace | `npx nx run assessment-frontend:dev` |
| **Project D NestJS Core**| `3001` | NestJS | Coding Core Enterprise API | `npm run start:dev` |

---

## Gateway Routing Map

- `/` $\rightarrow$ `http://localhost:3000` (Admin Shell)
- `/resume/*` $\rightarrow$ `http://localhost:5020` (Resume App)
- `/interview/*` $\rightarrow$ `http://localhost:5011` (Video Interview App)
- `/project-analysis/*` $\rightarrow$ `http://localhost:5032` (Project Analyser App)
- `/coding/*` $\rightarrow$ `http://localhost:5041` (Coding App)
- `/api/resumes/*` $\rightarrow$ `http://localhost:5020`
- `/api/interviews/*` $\rightarrow$ `http://localhost:5010`
- `/api/logs/*` $\rightarrow$ `http://localhost:5030`
- `/api/exams/*` $\rightarrow$ `http://localhost:5040`
