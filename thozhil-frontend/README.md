# THOZHIL — Unified Enterprise Platform Frontend

This directory (`thozhil-frontend/`) is the dedicated parent frontend for the **THOZHIL** platform.

## Architecture

THOZHIL is the parent application, orchestrating four independent microservices/modules:

```
                          THOZHIL PLATFORM
                                 |
                 +---------------+---------------+
                 |                               |
       [ Admin / Employer Portal ]     [ Candidate / Intern Portal ]
                 |                               |
                 +---------------+---------------+
                                 |
        +------------------------+------------------------+
        |                        |                        |
     Module 1                 Module 2                 Module 3                 Module 4
     LogLense                InterviewX            Resume Screener         Coding Assessments
 (Port 3000 / Express)   (Port 5000 / Express)   (Port 8000 / FastAPI)      (Docker Sandbox)
```

## Platform Entry Routes

- `/` — THOZHIL Platform Entry / Landing Page
- `/login` — Unified THOZHIL Dual-Role Platform Login (`admin` or `candidate`)
- `/employer` — THOZHIL Employer Command Center & Module Launcher
- `/employer/loglense` — Integrated Module 1 (LogLense)
- `/employer/interviewx` — Integrated Module 2 (InterviewX)
- `/employer/resume-screener` — Integrated Module 3 (Resume Screener)
- `/employer/coding-assessments` — Integrated Module 4 (Coding Assessments)
- `/candidate` — THOZHIL Candidate Assessment Hub
- `/candidate/loglense` — Candidate Work Log & Code Review submission
- `/candidate/interviewx` — Candidate AI Voice & Video Interview room
- `/candidate/resume-check` — Candidate Resume vs. Job Spec matching
- `/candidate/coding-workspace` — Candidate Monaco IDE test challenges

## Running Locally

```bash
cd thozhil-frontend
npm run dev
```

Server runs on: `http://localhost:5173/`

## Microservices Proxied via Vite

- `/api/screener/*` ➔ `http://127.0.0.1:8000` (Resume Screener FastAPI)
- `/api/intern-logs/*`, `/api/review` ➔ `http://127.0.0.1:3000` (LogLense Express)
- `/api/*`, `/ws/live` ➔ `http://127.0.0.1:5000` (InterviewX Express & WebSocket)
