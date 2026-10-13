# THOZHIL — Architecture Audit
**Date:** 2026-09-30
**Type:** READ-ONLY. No files were modified during this audit.
**Source Directories:** C:\Users\USER\Thozhil Final\

---

## Audit Summary Table

| # | Project | Role | Frontend | Backend | Frontend Port | Backend Port | DB | Auth |
|---|---------|------|----------|---------|--------------|-------------|-----|------|
| A | AI Video Interviewer | Interview + Voice | React 19 / Vite | Node Express (ESM) | 5173 | 5000 | Supabase PostgreSQL | Custom Bearer token |
| B | AI Resume Screener | Resume analysis | Vanilla HTML/CSS/JS served by backend | Python FastAPI | N/A (8000) | 8000 | SQLite | None |
| C | AI Project Analyser | Log review + AI feedback | React 19 TS / Vite | Node Express (CJS) + Python FastAPI | 5173 | 3000 (Node) + 8000 (FastAPI) | Supabase PostgreSQL | Role-toggle (no real auth) |
| D | AI Coding Interviewer | Coding assessment | Vue 3 (admin+candidate) + React 18 TS | NestJS 10 + Express (MongoDB) + Python FastAPI | 5173/5174 | 3001 (NestJS/FastAPI) + 5000 (Express) | PG (Prisma) + MongoDB + Redis | Passport JWT + refresh tokens + 6-char access code |

---

## Project A — AI Video Interviewer

**Path:** C:\Users\USER\Thozhil Final\project_a\

### 1. Frontend Framework
React 19, Vite 8, React Router DOM v7, Tailwind CSS 3, Framer Motion, Lucide React, Recharts, react-hook-form

### 2. Frontend Entry Point
frontend/src/main.jsx -> frontend/src/App.jsx

### 3. Backend Framework
Node.js Express 4 (ES Modules), ws (native WebSockets), Multer, Mammoth, pdf-parse, Joi, Helmet, Morgan

### 4. Backend Entry Point
server/src/server.js — creates HTTP server, attaches Express app, initialises WebSocket gateway via initLiveWebSocket(httpServer)

### 5. Current Frontend Port
5173 (Vite default; not hardcoded in vite.config.js)

### 6. Current Backend Port
5000 (Joi default: PORT: Joi.number().default(5000) in server/src/config/env.js)

### 7. Database
Supabase PostgreSQL (primary). Local JSON fallback: server/data/local_db.json

### 8. Authentication Mechanism
Custom Bearer token stored in localStorage as interviewx_auth_session.
Validated by server/src/middleware/authMiddleware.js.
Role headers: x-user-role, x-user-id.
Roles: recruiter (admin) / candidate

### 9. Important API Base URL
http://localhost:5000
Vite dev proxy: /api and /uploads -> http://127.0.0.1:5000

### 10. Important Frontend Routes
/ - Landing
/login - Login
/recruiter/dashboard - Recruiter dashboard
/recruiter/interviews - Interview list
/recruiter/interviews/create - Create interview
/recruiter/candidates - Candidate list
/recruiter/reports - Reports
/recruiter/analytics - Analytics
/candidate/dashboard - Candidate dashboard
/candidate/device-check - Camera/mic check
/candidate/interview/:id - Interview room
/candidate/live - Live interview room
/candidate/completed - Post-interview

### 11. Important Backend Routes
GET    /api/health
GET/POST /api/candidates
GET/PUT/DELETE /api/candidates/:id
GET/POST /api/jobs
GET/PUT/DELETE /api/jobs/:id
GET/POST /api/interviews
POST /api/interviews/:id/live/init
POST /api/interviews/:id/live/turn
POST /api/interviews/:id/live/complete
POST /api/interviews/:id/evaluate
GET  /api/interviews/:id/evaluation
POST/GET /api/interviews/:id/recordings
POST/GET /api/interviews/:id/proctoring-events
POST /api/resumes
GET/POST /api/reports
GET  /api/reports/analytics
POST /api/voice/transcribe   (Sarvam AI STT)
POST /api/voice/synthesize   (Sarvam AI TTS)
WS   ws://localhost:5000/ws/live  (Live WebSocket gateway)

### 12. Environment Variables Required
PORT=5000
NODE_ENV=development
SUPABASE_URL=<supabase-project-url>
SUPABASE_SECRET_KEY=<service-role-key>
SARVAM_API_KEY=<sarvam-ai-key>
MAX_FILE_SIZE=5242880
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
RATE_LIMIT_MAX=10000

### 13. Start Command
# Backend
cd "C:\Users\USER\Thozhil Final\project_a\server"
npm start         # node src/server.js
npm run dev       # nodemon src/server.js

# Frontend
cd "C:\Users\USER\Thozhil Final\project_a\frontend"
npm run dev

### 14. Build Command
cd "C:\Users\USER\Thozhil Final\project_a\frontend"
npm run build

### 15. Currently Runs Independently
YES. Backend and frontend are separate folders with independent package.json files.

### 16. External Dependencies
None. All imports are within project_a/ or npm packages.

---

## Project B — AI Resume Screener

**Path:** C:\Users\USER\Thozhil Final\project_b\

### 1. Frontend Framework
Vanilla HTML + CSS + JavaScript.
Single file: index.html + index.css served statically by the FastAPI backend.
No build step. No Node.js. No framework.

### 2. Frontend Entry Point
index.html (project root). JavaScript is inline within index.html.

### 3. Backend Framework
Python 3, FastAPI, Uvicorn, BackgroundTasks.
Libraries: pypdf, python-docx, reportlab, pydantic.

### 4. Backend Entry Point
app.py — FastAPI app instance.
Serves index.html and index.css as static GET routes.
The backend IS the complete web server (API + frontend).

### 5. Current Frontend Port
N/A — served by FastAPI on port 8000.

### 6. Current Backend Port
8000 (Uvicorn default)

### 7. Database
SQLite: database.db (project root).
Tables: jobs, candidates.
Accessed via Python sqlite3 built-in module.

### 8. Authentication Mechanism
None. Fully public. No login, no tokens, no roles.

### 9. Important API Base URL
http://localhost:8000

### 10. Important Frontend Routes
Single-page application with JavaScript routing — no URL-based routing.

### 11. Important Backend Routes
GET    /                          Serve index.html
GET/POST /api/jobs                Job CRUD
DELETE /api/jobs/{job_title}      Delete job
GET    /api/jobs/{job_title}/candidates   List candidates
GET    /api/jobs/{job_title}/analytics   Analytics
POST   /api/jobs/{job_title}/upload      Batch resume upload (PDF/DOCX)
POST   /api/jobs/{job_title}/screen      Trigger background screening
POST   /api/candidates/{id}/retry        Retry screening
PATCH  /api/candidates/{id}/status       Update candidate status
DELETE /api/candidates/{id}              Delete candidate
GET    /api/candidates/{id}/resume       View/download resume PDF
GET    /api/candidates/{id}/resume-info  Metadata + extracted text

### 12. Environment Variables Required
GEMINI_API_KEY=<google-gemini-key>
(No .env.example. Falls back to TF-IDF NLP if key absent.)

### 13. Start Command
cd "C:\Users\USER\Thozhil Final\project_b"
uvicorn app:app --reload

### 14. Build Command
None. Static HTML served directly.

### 15. Currently Runs Independently
YES. Single Python process. Requires only Python 3 + pip packages + optional .env.

### 16. External Dependencies
None. ai_screener_engine.py is in the same directory.

---

## Project C — AI Project Analyser (LogLense)

**Path:** C:\Users\USER\Thozhil Final\project_c_intern\
**All code under:** project_c_intern/intern/

### 1. Frontend Framework
React 19, TypeScript, Vite 8, React Router DOM v7, Tailwind CSS 3,
Framer Motion, TanStack React Query 5, Recharts, react-hook-form

### 2. Frontend Entry Point
intern/frontend/src/main.tsx -> intern/frontend/src/App.tsx

### 3. Backend Framework
Two separate processes:
1. Node.js Express (CommonJS) — data backend
   Libraries: @supabase/supabase-js, multer, cors
2. Python FastAPI — AI code review microservice
   Libraries: fastapi, uvicorn, google-genai, pydantic-settings, slowapi

### 4. Backend Entry Point
Node:   intern/backend/server.js
Python: intern/ai-service/ (routes in routes.py via FastAPI APIRouter)

### 5. Current Frontend Port
5173 (hardcoded in intern/frontend/vite.config.ts)

### 6. Current Backend Port
Node Express:     3000 (const PORT = 3000 in server.js)
Python AI service: 8000 (Uvicorn default; confirmed by ALLOWED_ORIGINS in config.py)

### 7. Database
Supabase PostgreSQL via @supabase/supabase-js.
Tables (PascalCase): WorkDescription, Log, Review.
Offline fallback: intern/backend/mock_db.json.
Note: Prisma schema exists at intern/prisma/schema.prisma but runtime code
      uses Supabase client directly — Prisma is NOT the active ORM.

### 8. Authentication Mechanism
None (role toggle only).
AppContext.tsx stores role: 'authority' | 'intern' | 'none' in React state.
Backend requires authorityId string but cannot cryptographically verify it.
Roles: authority (manager) / intern

### 9. Important API Base URL
Node backend:   http://localhost:3000
AI service:     http://localhost:8000
Vite dev proxy strips /api prefix: /api/* -> http://localhost:3000/*

### 10. Important Frontend Routes
/           Landing + role selection
/authority  Manager (Authority) dashboard
/intern     Intern dashboard + log submission
/history    Submission history

### 11. Important Backend Routes
Node Express (:3000):
POST /logs                            Submit work log + code files
GET  /logs/:projectId                 Fetch logs (requires authorityId)
GET  /logs/:id/review                 Fetch AI review for log
POST /work-descriptions               Create work description
GET  /work-descriptions/:projectId    Get work description

Python FastAPI AI Service (:8000):
POST /review   Submit code for Gemini AI review
GET  /health   Health check

### 12. Environment Variables Required
Node backend (intern/backend/.env):
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=<anon-key>
AI_SERVICE_URL=http://localhost:8000
GOOGLE_API_KEY=<gemini-key>
AI_PROVIDER=gemini
USE_MOCK_REVIEWER=false
FRONTEND_URL=http://localhost:5173

Python AI service (intern/ai-service/.env):
GOOGLE_API_KEY=<gemini-key>
AI_PROVIDER=gemini
AI_MODEL_NAME=gemini-2.0-flash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

### 13. Start Command
# Node backend
cd "C:\Users\USER\Thozhil Final\project_c_intern\intern\backend"
npm start

# Python AI service
cd "C:\Users\USER\Thozhil Final\project_c_intern\intern\ai-service"
uvicorn app:app --reload --port 8000

# Frontend
cd "C:\Users\USER\Thozhil Final\project_c_intern\intern\frontend"
npm run dev

### 14. Build Command
cd "C:\Users\USER\Thozhil Final\project_c_intern\intern\frontend"
npm run build    # tsc -b && vite build

### 15. Currently Runs Independently
YES (3 processes required). Fully self-contained within project_c_intern/intern/.

### 16. External Dependencies
None.

---

## Project D — AI Coding Interviewer

**Path:** C:\Users\USER\Thozhil Final\project_d\

PROTECTED — No files were modified during this audit.

Project D contains SIX separate runnable sub-applications:

Sub-app              | Framework                      | Port | Language
---------------------|-------------------------------|------|----------
NestJS backend       | NestJS 10 + Passport JWT + Prisma | 3001 | TypeScript
Python FastAPI backend | FastAPI + SQLAlchemy          | 3001 | Python (CONFLICTS with NestJS)
assessment-backend   | Express + MongoDB + Socket.IO  | 5000 | Node.js CJS
assessment-admin     | Vue 3 + Vuetify 3              | 5174 | JavaScript
assessment-frontend  | Vue 3 + Monaco Editor          | 5173 | JavaScript
user-frontend        | React 18 TS + Monaco + Supabase | 5173 | TypeScript (CONFLICTS with assessment-frontend)

CRITICAL INTERNAL CONFLICT: Both src/main.ts (NestJS) and python_backend/app/config.py (FastAPI)
declare PORT=3001. They are mutually exclusive alternative backend implementations.

### Sub-App 1: NestJS Backend
Entry:  src/main.ts
Port:   3001
Global prefix: /api
Auth:   Passport JWT + Refresh Tokens, bcrypt hashing, Session table
DB:     PostgreSQL via Prisma ORM (prisma/schema.prisma). SQLite fallback: prisma/dev.db
Routes: /api/assessments and auth endpoints

Start:
cd "C:\Users\USER\Thozhil Final\project_d"
npm run start:dev

Build: npm run build

### Sub-App 2: Python FastAPI Backend
Entry:  python_backend/main.py
Port:   3001 (from settings.PORT) — CANNOT co-run with NestJS
Routes:
  /api/auth, /api/users, /api/roles, /api/authorities, /api/interns
  /api/assignments, /api/dashboard, /api/audit, /api/submissions
  /api/editor       (Monaco editor content)
  /api/execution    (code execution routing)
  /api/v1/sandbox   (Docker sandbox runner)
  /static-analysis  (12-language AST static analysis)
  /authority-review (Gemini AI code review)

Start:
cd "C:\Users\USER\Thozhil Final\project_d"
python python_backend/main.py

Note: python_backend/main.py adds project root to sys.path to import:
  static_analysis/, ai_review/, authority_review/ (all within project_d/)

### Sub-App 3: Express Assessment Backend
Entry:  assessment-platform/assessment-backend/src/server.js
Port:   5000 (default from env.port)
Auth:   JWT (jsonwebtoken) + bcryptjs. 6-char accessCode for candidate access.
DB:     MongoDB (MONGO_URI) + optional Redis
RT:     Socket.IO on same HTTP server

Required env vars:
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/assessment_platform
JWT_SECRET=<secret>
COMPILER_BASE_URL=<url>
COMPILER_API_KEY=<key>
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
REDIS_URL=redis://127.0.0.1:6379

Start:
cd "C:\Users\USER\Thozhil Final\project_d\assessment-platform\assessment-backend"
npm start

### Sub-App 4: Vue 3 Admin Frontend (assessment-admin)
Port:  5174 (hardcoded in vite.config.js)
Proxy: /api -> :5000, /uploads -> :5000, /socket.io (ws) -> :5000
Framework: Vue 3, Vuetify 3, Vue Router 4, axios, socket.io-client

Start:
cd "C:\Users\USER\Thozhil Final\project_d\assessment-platform\assessment-admin"
npm run dev

### Sub-App 5: Vue 3 Candidate Frontend (assessment-frontend)
Port:  5173 (hardcoded in vite.config.js)
Proxy: /api -> :5000, /uploads -> :5000
Framework: Vue 3, Vue Router 4, Monaco Editor (npm), axios

Start:
cd "C:\Users\USER\Thozhil Final\project_d\assessment-platform\assessment-frontend"
npm run dev

### Sub-App 6: React 18 User Frontend (user-frontend)
Port:  5173 (hardcoded in vite.config.ts) — CONFLICTS with assessment-frontend
Framework: React 18 (NOT 19), TypeScript, Vite 5, Monaco Editor, Tailwind CSS,
           Supabase JS, Lucide React, react-router-dom v6

Env vars:
VITE_SUPABASE_URL=<supabase-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_API_BASE_URL=http://localhost:8000

### Project D Combined Env Vars (root .env)
PORT=3001
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=<secret>
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=<secret>
JWT_REFRESH_EXPIRATION=7d
REDIS_HOST=localhost
REDIS_PORT=6379
GEMINI_API_KEY=<key>
GEMINI_MODEL=gemini-1.5-flash
REDIS_URL=redis://localhost:6379/0
SANDBOX_QUEUE_NAME=sandbox:jobs
SANDBOX_TIMEOUT_SECONDS=10
SANDBOX_MEMORY_LIMIT=256m
IMAGE_PYTHON=python:3.12-slim
IMAGE_JAVASCRIPT=node:20-slim
IMAGE_CPP=gcc:13
IMAGE_JAVA=eclipse-temurin:17-jdk-alpine
MONGO_URI=mongodb://127.0.0.1:27017/assessment_platform
COMPILER_BASE_URL=<url>
COMPILER_API_KEY=<key>

### 15. Currently Runs Independently
assessment-backend + assessment-admin + assessment-frontend: YES (requires MongoDB)
NestJS backend: YES (uses SQLite fallback)
Python FastAPI backend: YES (alternative to NestJS, same port 3001)
NestJS + Python backend simultaneously: NO (same port)

### 16. External Dependencies
python_backend/main.py imports static_analysis/, ai_review/, authority_review/
— all within project_d/ root. No outside-project dependencies.

---

## Port Collision Map (All Four Projects Running Simultaneously)

Port  | Project A      | Project B   | Project C Node | Project C FastAPI | Project D NestJS | Project D FastAPI | Project D Express | Project D Admin | Project D Candidate
------|----------------|-------------|----------------|-------------------|------------------|-------------------|-------------------|-----------------|--------------------
3000  |                |             | BACKEND        |                   |                  |                   |                   |                 |
3001  |                |             |                |                   | BACKEND          | BACKEND (conflict)|                   |                 |
5000  | BACKEND        |             |                |                   |                  |                   | BACKEND (conflict)|                 |
5173  | FRONTEND       |             | FRONTEND (conf)|                   |                  |                   |                   |                 | FRONTEND (conflict)
5174  |                |             |                |                   |                  |                   |                   | ADMIN           |
8000  |                | ALL (app)   |                | AI SERVICE (conf) |                  |                   |                   |                 |

CRITICAL CONFLICTS (two apps cannot run simultaneously without changing ports):
1. Port 5000  — Project A backend vs Project D Express backend
2. Port 5173  — Project A frontend, Project C frontend, Project D candidate frontend
3. Port 8000  — Project B (full app) vs Project C AI service
4. Port 3001  — Project D NestJS vs Project D Python FastAPI (internal to D)

---

## Technology / Dependency Conflicts

Area            | Conflict                      | Detail
----------------|-------------------------------|-------
React version   | A vs D user-frontend          | A: React 19, D user-frontend: React 18
Frontend FW     | A, C vs D admin/candidate     | A + C: React. D admin + candidate: Vue 3
Node module sys | A vs C backend                | A: ES Modules, C: CommonJS
Database        | All four                      | A: Supabase PG; B: SQLite; C: Supabase PG; D: PG + MongoDB + Redis
Authentication  | All four                      | A: Custom Bearer; B: None; C: Role toggle; D: Passport JWT
Compiler        | D Express backend only        | Requires external COMPILER_BASE_URL service
Docker sandbox  | D Python backend only         | Requires local Docker daemon (/var/run/docker.sock)
React Router v  | A, C: v7 vs D user-frontend: v6 | Minor compatibility difference

---

## Recommended Integration Boundaries

### Principle: Preserve, do not merge
Each application stays internally intact. The integration layer is a navigation
shell that routes to each app — not a rewrite of the apps themselves.

### Step 1: Assign non-conflicting ports
App                          | Recommended Dev Port
-----------------------------|---------------------
Project A backend            | 5010
Project A frontend           | 5011
Project B (full app)         | 5020
Project C Node backend       | 5030
Project C AI service         | 5031
Project C frontend           | 5032
Project D Express backend    | 5040
Project D admin frontend     | 5041
Project D candidate frontend | 5042
Admin Shell (new)            | 3000

### Step 2: Build a new lightweight admin-shell
A new apps/admin-shell (simple HTML page or minimal React app) acting as
a navigation hub with links/iframes to each app at its assigned port.
No source code from any of the four projects is copied into it initially.

### Step 3: Do NOT merge databases initially
Each app's database works and is self-contained.
Database unification is a separate long-term concern.

### Step 4: Do NOT merge authentication initially
Three completely different auth systems exist.
Forcing shared auth before the shell is stable will break all apps.
The shell can introduce SSO in a later phase if required.

### Integration boundary per app
Project A: iframe or full-page link at its assigned port. WebSocket gateway
           must stay on Project A's own backend (ws:// on :5010).
Project B: iframe or full-page link at :5020. Completely standalone.
Project C: frontend iframe/link at :5032. Backend on :5030 + :5031.
Project D: admin iframe at :5041, candidate iframe at :5042. Backend on :5040.
