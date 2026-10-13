# Thozhil — Technical Reference & Project Report

This document serves as the comprehensive technical reference for all four projects comprising the **Thozhil** platform suite. It contains architectural specifications, technology stacks, API surfaces, data models, and conflict analyses to eliminate the need for repeated codebase rescanning.

---

## 1. Project A — AI Video Interviewer

* **Project Path:** `C:\Users\USER\Thozhil Final\project_a`
* **Purpose:** AI-driven video and voice candidate interviewing, real-time audio turn processing, proctoring observation, and candidate performance evaluation.
* **Frontend Technology:** React 19, Vite 8, React Router DOM 7, Tailwind CSS 3, Framer Motion, Lucide React, Recharts.
* **Backend Technology:** Node.js (ES Modules), Express.js 4, WebSockets (`ws`), Multer, Mammoth, PDF-Parse, Joi, Helmet, CORS.
* **Database:** Supabase (PostgreSQL) with local in-memory JSON fallback ([`localDatabaseStore.js`](file:///C:/Users/USER/Thozhil%20Final/project_a/server/src/config/localDatabaseStore.js)).
* **Authentication:** Client-side token/session storage in `localStorage` (`interviewx_auth_session`), backend Authorization Bearer middleware ([`authMiddleware.js`](file:///C:/Users/USER/Thozhil%20Final/project_a/server/src/middleware/authMiddleware.js)), and scoped route guards.
* **Roles:** 
  1. `Recruiter / Recruiter Admin` (full administration, job creation, reports, analytics)
  2. `Candidate / Applicant` (device check, taking async or live video/voice interviews)
* **Main Features:**
  * Live & Async AI Video/Voice Interviews via WebSocket gateway (`ws://localhost:5000/ws/live`).
  * Multilingual Voice STT/TTS via Sarvam AI API.
  * Proctoring event logging (tab switching, focus loss, face detection alerts).
  * Automated report card generation with sub-score breakdowns (Technical, Communication, Problem Solving, Confidence).
* **Important APIs:**
  * `GET /api/health`
  * `GET/POST /api/candidates`, `GET/PUT/DELETE /api/candidates/:id`
  * `GET/POST /api/jobs`, `GET/PUT/DELETE /api/jobs/:id`
  * `GET/POST /api/interviews`, `GET/PUT/DELETE /api/interviews/:id`
  * `POST /api/interviews/:id/live/init`, `/turn`, `/complete`
  * `POST /api/interviews/:id/evaluate`, `GET /api/interviews/:id/evaluation`
  * `POST/GET /api/interviews/:id/recordings`, `POST/GET /api/interviews/:id/proctoring-events`
  * `POST /api/resumes`, `POST /api/resumes/:id/process`, `/screen`
  * `GET/POST /api/reports`, `GET /api/reports/analytics`
  * `POST /api/voice/transcribe`, `POST /api/voice/synthesize`
* **Environment Variables:** `PORT` (5000), `NODE_ENV`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SARVAM_API_KEY`, `ALLOWED_ORIGINS`, `RATE_LIMIT_MAX`, `MAX_FILE_SIZE`.
* **External Services:** Supabase Cloud, Sarvam AI, OpenAI / Gemini LLM.
* **Important Frontend Files:**
  * [`frontend/src/main.jsx`](file:///C:/Users/USER/Thozhil%20Final/project_a/frontend/src/main.jsx), [`frontend/src/App.jsx`](file:///C:/Users/USER/Thozhil%20Final/project_a/frontend/src/App.jsx)
  * [`frontend/src/context/AuthContext.jsx`](file:///C:/Users/USER/Thozhil%20Final/project_a/frontend/src/context/AuthContext.jsx)
  * [`frontend/src/pages/LiveInterview.jsx`](file:///C:/Users/USER/Thozhil%20Final/project_a/frontend/src/pages/LiveInterview.jsx), [`frontend/src/pages/Report.jsx`](file:///C:/Users/USER/Thozhil%20Final/project_a/frontend/src/pages/Report.jsx)
* **Important Backend Files:**
  * [`server/src/server.js`](file:///C:/Users/USER/Thozhil%20Final/project_a/server/src/server.js), [`server/src/app.js`](file:///C:/Users/USER/Thozhil%20Final/project_a/server/src/app.js)
  * [`server/src/config/supabase.js`](file:///C:/Users/USER/Thozhil%20Final/project_a/server/src/config/supabase.js), [`server/src/realtime/liveWebSocketGateway.js`](file:///C:/Users/USER/Thozhil%20Final/project_a/server/src/realtime/liveWebSocketGateway.js)
* **Important Database Models:** `jobs`, `candidates`, `interviews`, `questions`, `answers`, `resumes`, `reports`.
* **Ports:** HTTP: `5000`, WebSocket: `ws://localhost:5000/ws/live`, Frontend: `5173`.
* **Known Conflicts:** Overlaps with Project B port (8000 microservice), Project D port 5000 (Express assessment backend), and shared table names (`jobs`, `candidates`).
* **Functionality to Preserve:** Real-time WebSocket interview turn loop, Sarvam AI voice integration, video/audio recording uploads, proctoring observer, evaluation report structure.
* **Functionality to Replace/Remove:** Standalone auth mock storage (`authService.js`), fallback local database store.

---

## 2. Project B — AI Resume Screener

* **Project Path:** `C:\Users\USER\Thozhil Final\project_b`
* **Purpose:** High-throughput PDF/DOCX resume parsing, background asynchronous screening against job skill criteria, and analytics.
* **Frontend Technology:** Vanilla JavaScript (ES6+), HTML5, Tailwind CSS (via CDN), Google Material Symbols.
* **Backend Technology:** Python 3.x, FastAPI, Uvicorn, BackgroundTasks, `pypdf`, `python-docx`, `reportlab`, `pydantic`.
* **Database:** SQLite (`database.db`).
* **Authentication:** None (Public application).
* **Roles:** Single Implicit Role (`Recruiter / Hiring Manager`).
* **Main Features:**
  * Drag-and-drop batch upload of PDF/DOCX resumes (up to 5MB).
  * Asynchronous background screening via Gemini LLM or Local TF-IDF & Taxonomy NLP engine.
  * Dynamic PDF resume generation from candidate profile database records.
  * In-browser DOCX-to-PDF conversion for streaming inline preview.
  * Job candidate score analytics, hiring funnel, and skill match breakdown.
* **Important APIs:**
  * `GET/POST /api/jobs`, `DELETE /api/jobs/{job_title}`
  * `GET /api/jobs/{job_title}/candidates`, `GET /api/jobs/{job_title}/analytics`
  * `POST /api/jobs/{job_title}/upload`, `POST /api/jobs/{job_title}/screen`
  * `POST /api/candidates/{candidate_id}/retry`, `PATCH /api/candidates/{candidate_id}/status`, `DELETE /api/candidates/{candidate_id}`
  * `GET /api/candidates/{candidate_id}/resume`, `GET /api/candidates/{candidate_id}/resume-info`
* **Environment Variables:** `GEMINI_API_KEY`.
* **External Services:** Google Gemini API (`google.genai` / `google.generativeai`), Tailwind/Google Fonts CDNs.
* **Important Frontend Files:** [`index.html`](file:///C:/Users/USER/Thozhil%20Final/project_b/index.html), [`index.css`](file:///C:/Users/USER/Thozhil%20Final/project_b/index.css).
* **Important Backend Files:** [`app.py`](file:///C:/Users/USER/Thozhil%20Final/project_b/app.py), [`ai_screener_engine.py`](file:///C:/Users/USER/Thozhil%20Final/project_b/ai_screener_engine.py).
* **Important Database Models:** `jobs`, `candidates`.
* **Ports:** HTTP: `8000`.
* **Known Conflicts:** Port 8000 collision with Project C & D FastAPI servers; SQLite storage conflicts with PostgreSQL direction; missing auth layer; single-file HTML frontend structure.
* **Functionality to Preserve:** Advanced Local NLP TF-IDF screening fallback, taxonomy skill matching, dynamic ReportLab PDF generation, background screening worker queue.
* **Functionality to Replace/Remove:** SQLite database engine, `index.html` frontend shell, unauthenticated API routing.

---

## 3. Project C — AI Project Analyser (LogLense)

* **Project Path:** `C:\Users\USER\Downloads\Thozhil-Final-Project-main`
* **Purpose:** Internship and project work log review system, code attachment evaluation, AI-generated code quality & risk summaries, and manager dashboards.
* **Frontend Technology:** React 19, TypeScript, Vite 8, React Router DOM 7, Tailwind CSS 3, Framer Motion, TanStack React Query 5, Recharts.
* **Backend Technology:** 
  * Node.js Express Server (Database proxy on Port 3000)
  * Python FastAPI AI Service (Code review microservice on Port 8000)
* **Database:** Supabase (PostgreSQL) + Prisma ORM ([`schema.prisma`](file:///C:/Users/USER/Downloads/Thozhil-Final-Project-main/Thozhil-Final-Project-main/intern/prisma/schema.prisma)) with offline fallback JSON ([`mock_db.json`](file:///C:/Users/USER/Downloads/Thozhil-Final-Project-main/Thozhil-Final-Project-main/intern/backend/mock_db.json)).
* **Authentication:** Client-side role selection (`authority` vs `intern`) in [`AppContext.tsx`](file:///C:/Users/USER/Downloads/Thozhil-Final-Project-main/Thozhil-Final-Project-main/intern/frontend/src/context/AppContext.tsx) + string query header matching (`authorityId`).
* **Roles:**
  1. `Authority / Manager` (publish work descriptions, inspect intern logs, review risk summaries)
  2. `Intern / Contributor` (submit daily logs + code attachments, view AI evaluation cards, listen to audio feedback)
* **Main Features:**
  * Multipart code/work log submission with automated LLM code review (`POST /review`).
  * Multi-provider LLM support (Gemini, OpenAI, Ollama, Sarvam AI).
  * Web Speech API text-to-speech audio feedback.
  * Manager risk level assessment and intern growth suggestions.
* **Important APIs:**
  * Node Express (`:3000`): `POST /logs`, `GET /logs/:projectId`, `GET /logs/:id/review`, `POST/GET /work-descriptions`
  * Python FastAPI (`:8000`): `POST /review`, `GET /health`
* **Environment Variables:** `PORT` (3000), `SUPABASE_URL`, `SUPABASE_KEY`, `AI_SERVICE_URL` (`http://localhost:8000`), `GEMINI_API_KEY`, `OPENAI_API_KEY`, `SARVAM_API_KEY`, `OLLAMA_BASE_URL`.
* **External Services:** Supabase Cloud, Gemini, OpenAI, Ollama, Sarvam AI.
* **Important Frontend Files:**
  * [`intern/frontend/src/App.tsx`](file:///C:/Users/USER/Downloads/Thozhil-Final-Project-main/Thozhil-Final-Project-main/intern/frontend/src/App.tsx)
  * [`intern/frontend/src/context/AppContext.tsx`](file:///C:/Users/USER/Downloads/Thozhil-Final-Project-main/Thozhil-Final-Project-main/intern/frontend/src/context/AppContext.tsx)
  * [`intern/frontend/src/pages/AuthorityDashboard.tsx`](file:///C:/Users/USER/Downloads/Thozhil-Final-Project-main/Thozhil-Final-Project-main/intern/frontend/src/pages/AuthorityDashboard.tsx)
* **Important Backend Files:**
  * [`intern/backend/server.js`](file:///C:/Users/USER/Downloads/Thozhil-Final-Project-main/Thozhil-Final-Project-main/intern/backend/server.js)
  * [`intern/ai_provider.py`](file:///C:/Users/USER/Downloads/Thozhil-Final-Project-main/Thozhil-Final-Project-main/intern/ai_provider.py)
* **Important Database Models:** `WorkDescription`, `Log`, `Review`.
* **Ports:** Node Backend: `3000`, FastAPI AI Service: `8000`, Frontend: `5173`.
* **Known Conflicts:** Port 3000 collision with Project D NestJS; Port 8000 collision with Project B & D FastAPI; unauthenticated role toggle state; PascalCase table names.
* **Functionality to Preserve:** Code review prompt builder, multi-LLM provider abstraction, speech text feedback generation, work log assignment & review workflow.
* **Functionality to Replace/Remove:** Express server port 3000 proxy, standalone mock database fallback, unauthenticated role switcher.

---

## 4. Project D — AI Coding Interviewer & Sandbox Platform

* **Project Path:** `C:\Users\USER\Thozhil Final\project_d`
* **Purpose:** Multi-language coding assessments, isolated Docker code execution sandbox, static code AST analysis, and automated coding evaluation.
* **Frontend Technology:** 
  * `user-frontend`: React 19, TypeScript, Vite, Monaco Editor, Tailwind CSS.
  * `assessment-frontend`: Vue 3, Vite, Vue Router.
  * `assessment-admin`: Vue 3, Vite.
* **Backend Technology:** 
  * Enterprise Core: NestJS 10, TypeScript, Prisma ORM, Passport JWT (Port 3000).
  * Sandbox & AI Engine: Python 3.12, FastAPI, Docker SDK, Redis Queue & Worker (Port 8000).
  * Assessment Backend: Express.js, MongoDB (Mongoose), Socket.IO, Redis, Multer (Port 5000 / 5001).
* **Database:** PostgreSQL (via Prisma ORM), MongoDB (Mongoose for assessment-backend), Redis (sandbox job queue `sandbox:jobs`).
* **Authentication:** Passport JWT authentication with refresh token sessions (`Session` model), bcrypt hashing, and 6-character assessment access codes (`accessCode`).
* **Roles:**
  1. `Authority / Admin / Evaluator` (create assignments, question banks, test cases, publish access codes, view code static analysis)
  2. `Intern / Candidate` (login/access code entry, coding in Monaco IDE, running sandboxed code, submitting tests)
* **Main Features:**
  * Docker Execution Sandbox (Python 3.12, Node 20, GCC 13, OpenJDK 17) with 256MB RAM cap, 1 CPU quota, network isolation (`network_mode="none"`), and 10s SIGKILL timeouts.
  * Multi-language AST static analysis for 12 languages.
  * Monaco IDE coding workspace with stdin/stdout execution console and verdict badges (`ACCEPTED`, `WRONG_ANSWER`, `COMPILE_ERROR`, `RUNTIME_ERROR`, `TIME_LIMIT_EXCEEDED`).
  * 6-character random access code generator (`accessCode`) for candidate assessments.
  * Socket.IO real-time exam proctoring event streaming.
* **Important APIs:**
  * NestJS (`:3000`): `POST /auth/login`, `/refresh`, `GET/POST /assignments`, `GET/POST /questions`
  * FastAPI (`:8000`): `GET /api/v1/sandbox/languages`, `POST /api/v1/sandbox/execution/run`, `GET /jobs/{job_id}`, `POST /static-analysis/analyze`, `POST /authority-review/evaluate`
  * Express (`:5000`): `POST /api/admin/login`, `POST /api/candidate/login`, `GET/POST /api/exams`
* **Environment Variables:** `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GEMINI_API_KEY`, `DOCKER_HOST`, `PORT`.
* **External Services:** Docker Daemon (`/var/run/docker.sock`), Redis Server, PostgreSQL, MongoDB, Gemini API.
* **Important Frontend Files:**
  * [`assessment-platform/user-frontend/src/App.tsx`](file:///C:/Users/USER/Thozhil%20Final/project_d/assessment-platform/user-frontend/src/App.tsx)
  * Monaco Workspace components (`MonacoWorkspace.tsx`).
* **Important Backend Files:**
  * [`src/main.ts`](file:///C:/Users/USER/Thozhil%20Final/project_d/src/main.ts), [`python_backend/main.py`](file:///C:/Users/USER/Thozhil%20Final/project_d/python_backend/main.py)
  * [`python_backend/app/sandbox/executor.py`](file:///C:/Users/USER/Thozhil%20Final/project_d/python_backend/app/sandbox/executor.py)
* **Important Database Models:** `User`, `Assignment`, `Submission`, `QuestionBank`, `Question`, `TestCase`, `AuditLog`.
* **Ports:** NestJS: `3000`, FastAPI: `8000`, Express Assessment: `5000`/`5001`, User Frontend: `5173`.
* **Known Conflicts:** Port 3000 collision with Project C Node Backend; Port 5000 collision with Project A Express; Port 8000 collision with Project B & C FastAPI; MongoDB dependence; Vue 3 frontend components.
* **Functionality to Preserve:** Docker sandbox runner, test case evaluation harness, 12-language static analysis analyzers, access code generation logic, Monaco IDE component.
* **Functionality to Replace/Remove:** MongoDB assessment database, Vue 3 frontends (migrating to React), standalone NestJS server instance.

---

## 5. Cross-Project Conflicts Summary

### Frontend Technologies
* **Project A:** React 19 (JavaScript `.jsx`)
* **Project B:** Vanilla JavaScript + Single-file HTML (`index.html`)
* **Project C:** React 19 (TypeScript `.tsx`)
* **Project D:** React 19 TS (`user-frontend`) + Vue 3 (`assessment-frontend`, `assessment-admin`)
* **Resolution Strategy:** React 19 + TypeScript will be the unified frontend standard. Project B HTML and Project D Vue views will be ported to React JSX/TSX.

### Backend Frameworks
* **Project A:** Node.js Express (Port 5000)
* **Project B:** Python FastAPI (Port 8000)
* **Project C:** Node.js Express (Port 3000) + Python FastAPI (Port 8000)
* **Project D:** NestJS (Port 3000) + Python FastAPI (Port 8000) + Express (Port 5000)
* **Resolution Strategy:** Unified Node.js Express primary server for core APIs/Auth + modular Python FastAPI microservice for AI screening, static analysis, and Docker execution.

### Authentication & Authorization
* **Project A:** Custom Bearer tokens + identity headers (`x-user-role`, `x-user-id`).
* **Project B:** None.
* **Project C:** Role-selection toggle + `authorityId` string matching.
* **Project D:** Passport JWT + Refresh token sessions (`Session` table) + 6-character `accessCode`.
* **Resolution Strategy:** Project D's JWT + Refresh Token model (with access-code support) will form the unified identity baseline for Admin and Intern roles.

### Database Engines & Schemas
* **Project A:** Supabase PostgreSQL (`jobs`, `candidates`, `interviews`, `reports`)
* **Project B:** SQLite (`database.db` with `jobs`, `candidates`)
* **Project C:** Supabase PostgreSQL via Prisma (`WorkDescription`, `Log`, `Review`)
* **Project D:** PostgreSQL via Prisma + MongoDB + Redis
* **Resolution Strategy:** PostgreSQL (Supabase) will be the single database. Project B SQLite and Project D MongoDB tables will be migrated to PostgreSQL schemas.

### Port Allocations & Collisions

| Service / App | Project A | Project B | Project C | Project D | Unified Target Port |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Node API** | 5000 | — | 3000 | 3000 / 5000 | **5000** |
| **Python AI Microservice** | — | 8000 | 8000 | 8000 | **8000** |
| **Vite Frontend Dev** | 5173 | 8000 (Static) | 5173 | 5173 / 5174 / 5175 | **5173** |
| **Redis** | — | — | — | 6379 | **6379** |

### AI Providers & Wrappers
* **Project A:** Gemini LLM + Sarvam AI Voice (`aiProvider.js`)
* **Project B:** Gemini LLM + Local TF-IDF NLP (`ai_screener_engine.py`)
* **Project C:** Gemini / OpenAI / Ollama / Sarvam AI (`ai_provider.py`)
* **Project D:** Gemini LLM (`python_backend/ai_review/`)
* **Resolution Strategy:** Consolidate into a unified `AIProviderModule` supporting Gemini, Sarvam AI, OpenAI, and Ollama fallback.

### File Storage
* **Project A:** Supabase Storage (`resumes`, `interview-recordings`) + static `uploads/` folder.
* **Project B:** Local `uploads/` directory.
* **Project C:** Multer memory buffers + Supabase storage URL references.
* **Project D:** Express `uploads/` directory + Docker volume mounts.
* **Resolution Strategy:** Centralized file storage service directing persistent assets to Supabase Storage Buckets with local disk fallback.

### WebSockets & Real-time
* **Project A:** Native `ws` library for live interview streaming on `ws://localhost:5000/ws/live`.
* **Project D:** Socket.IO for assessment proctoring events.
* **Resolution Strategy:** Native `ws` WebSocket gateway on the primary Node backend handling both live interview turns and proctoring events.

### Redis & Docker Sandbox
* **Project D** requires Redis (Port 6379) and local Docker Daemon access (`/var/run/docker.sock`).
* **Deferred Strategy:** Docker execution will be isolated into Phase 8 so that early integration phases do not depend on Docker availability.
