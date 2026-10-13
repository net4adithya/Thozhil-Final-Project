# THOZHIL PLATFORM — INTEGRATION & SESSION CHECKPOINT

**Timestamp:** October 1, 2026 — 22:08 IST  
**Current Conversation ID:** `b55a13e3-1b40-4bd3-9a89-500e461ee982`  
**Prior Integration Conversation ID:** `868cf36f-d992-42ba-a7a8-168345113f5d`  
**Status:** **100% OPERATIONAL & VERIFIED ON PORT 8080**  

---

## 1. Primary Entry Point

- **Application URL:** [http://localhost:8080/](http://localhost:8080/)
- **Orchestrator:** Project Analyzer (`apps/project-analysis/intern/frontend`) via Thozhil Gateway (`packages/gateway/server.js`)
- **Key Navigation Rule:** Always navigate through `http://localhost:8080/`. Accessing individual microservice UI ports directly (e.g. `:5032`) causes relative iframe links (`/coding/`, `/interview/`, `/resume/`) to fail or recurse.

---

## 2. Active Microservices & Port Matrix

| Service | Port | Directory | Start Command | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Thozhil Gateway** | `8080` | `packages/gateway` | `cmd.exe /c "set PROJECT_D_API_URL=http://localhost:5000 && node server.js"` | **RUNNING (200)** |
| **Project Analyzer UI** | `5032` | `apps/project-analysis/intern/frontend` | `cmd.exe /c "node node_modules/vite/bin/vite.js --port 5032"` | **RUNNING (200)** |
| **Coding Admin UI** | `5041` | `assessment-platform/assessment-admin` | `cmd.exe /c "npx vite --port 5041"` | **RUNNING (200)** |
| **Coding Candidate UI** | `5042` | `assessment-platform/assessment-frontend` | `cmd.exe /c "npx vite --port 5042"` | **RUNNING (200)** |
| **Coding Platform API** | `5000` | `assessment-platform/assessment-backend` | `cmd.exe /c "node src/server.js"` | **RUNNING (200)** |
| **Video Interview Frontend** | `5011` | `apps/interview/frontend` | `cmd.exe /c "npx vite --port 5011"` | **RUNNING (200)** |
| **Video Interview API** | `5010` | `apps/interview/server` | `cmd.exe /c "set PORT=5010 && node src/server.js"` | **RUNNING (200)** |
| **Resume Screener API & UI** | `5020` | `apps/resume/backend` | `python -m uvicorn app:app --host 0.0.0.0 --port 5020` | **RUNNING (200)** |
| **Python Sandbox Execution API** | `8000` | `python_backend` | `cmd.exe /c "python -m uvicorn main:app --host 0.0.0.0 --port 8000"` | **RUNNING (200)** |

---

## 3. Verified Route Flows (via Gateway :8080)

1. **Manager / Authority Flow:**
   - URL: `http://localhost:8080/` -> Click **Manager Panel** (or navigate to `/authority`).
   - Persistent dark sidebar displays:
     - `Dashboard / Project Analyser` (`/authority`)
     - `Intern Details` (`/interns`)
     - `AI Resume Screener` (`/resume-module` -> proxies `/resume/` to port `5020`)
     - `AI Coding Interviewer` (`/coding-module` -> proxies `/coding/` to port `5041`)
     - `AI Video Interviewer` (`/interview-module` -> proxies `/interview/` to port `5011`)
   - All modules embed cleanly with zero recursive sidebars.

2. **Intern Project Dashboard Flow:**
   - URL: `http://localhost:8080/` -> Click **Intern Space** (or navigate to `/intern`).
   - Enters email/ID authorization (`ananya.iyer@example.com`, `arjun.patel@example.com`, `rohan.das@example.com`, etc.).
   - Sidebar displays only intern-relevant items:
     - `Intern Project Dashboard` (`/intern`)
     - `My Intern Profile` (`/interns`)

3. **Candidate Assessment Flows (Isolated Full-Screen, No Sidebar):**
   - **Coding Assessment:** `http://localhost:8080/coding-candidate-module`
     - Candidate Email Login -> 6-digit access code entry -> Full-screen assessment workspace.
   - **Video Assessment:** `http://localhost:8080/interview-candidate-module`
     - Full-screen Video Interview room.

---

## 4. Antigravity History & Logs Location

- **Current Session Transcript:**  
  `C:\Users\USER\.gemini\antigravity-ide\brain\b55a13e3-1b40-4bd3-9a89-500e461ee982\.system_generated\logs\transcript.jsonl`
- **Prior Session Transcript:**  
  `C:\Users\USER\.gemini\antigravity-ide\brain\868cf36f-d992-42ba-a7a8-168345113f5d\.system_generated\logs\transcript.jsonl`
- **Session Task Output Logs:**  
  `C:\Users\USER\.gemini\antigravity-ide\brain\b55a13e3-1b40-4bd3-9a89-500e461ee982\.system_generated\tasks\`
