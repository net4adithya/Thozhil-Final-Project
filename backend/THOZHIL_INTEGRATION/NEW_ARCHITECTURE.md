# THOZHIL — New Integration Architecture

**Date:** 2026-09-30
**Status:** PLANNING ONLY. No implementation has been performed.
**Audit basis:** ARCHITECTURE_AUDIT.md

---

## Guiding Principle

> Preserve each application's existing functionality completely.
> The four original apps remain independently runnable.
> The integration layer is a SHELL — not a rewrite.

Do NOT merge databases.
Do NOT merge authentication systems.
Do NOT rewrite frontends.
Do NOT copy application code into the shell.

---

## Intended Directory Structure

THOZHIL/
  apps/
    admin-shell/          <-- NEW: lightweight navigation hub
    resume/               <-- SYMLINK or reference to project_b (Project B)
    interview/            <-- SYMLINK or reference to project_a (Project A)
    project-analysis/     <-- SYMLINK or reference to project_c_intern (Project C)
    coding/               <-- SYMLINK or reference to project_d (Project D)
  packages/
    (shared utilities in future phases, if needed)
  THOZHIL_INTEGRATION/
    ARCHITECTURE_AUDIT.md
    NEW_ARCHITECTURE.md
    (future: DECISIONS.md, PROJECT_STATUS.md)

The four original project directories remain UNTOUCHED in their original locations.
The apps/ directories initially contain only configuration/metadata pointing to them.

---

## Target Port Assignments (Non-Conflicting)

Service                          | Current Port(s)      | New Assigned Port
---------------------------------|----------------------|-----------------
Admin Shell (new)                | N/A                  | 3000
Project A — backend              | 5000                 | 5010
Project A — frontend             | 5173                 | 5011
Project B — full app (backend+UI)| 8000                 | 5020
Project C — Node backend         | 3000                 | 5030
Project C — Python AI service    | 8000                 | 5031
Project C — frontend             | 5173                 | 5032
Project D — Express backend      | 5000                 | 5040
Project D — admin frontend       | 5174                 | 5041
Project D — candidate frontend   | 5173                 | 5042

Each app changes ONLY its PORT env var / Vite server.port config.
No other changes are made to the applications.

---

## Integration Approach per Application

### Project A — AI Video Interviewer
Integration method: Full-page navigation from admin shell
Admin shell links: /apps/interview -> http://localhost:5011
Backend remains on: http://localhost:5010
WebSocket remains on: ws://localhost:5010/ws/live
Change required: server PORT=5010, frontend vite port 5011
Auth: Recruiter logs into Project A's own auth system independently

### Project B — AI Resume Screener
Integration method: Full-page navigation from admin shell
Admin shell links: /apps/resume -> http://localhost:5020
Backend + UI served from: http://localhost:5020
Change required: uvicorn port argument: --port 5020
Auth: None (public app), no change needed

### Project C — AI Project Analyser (LogLense)
Integration method: Full-page navigation from admin shell
Admin shell links: /apps/project-analysis -> http://localhost:5032
Node backend on: http://localhost:5030
Python AI service on: http://localhost:5031
Changes required:
  backend: PORT=5030 in .env
  ai-service: uvicorn --port 5031
  frontend: vite server.port = 5032, proxy target = http://localhost:5030
Auth: Role toggle (authority/intern) — no change to auth logic

### Project D — AI Coding Interviewer
Integration method: Full-page navigation from admin shell
Admin shell links:
  /apps/coding/admin     -> http://localhost:5041 (assessment-admin)
  /apps/coding/candidate -> http://localhost:5042 (assessment-frontend)
Express backend on: http://localhost:5040
Changes required:
  assessment-backend: PORT=5040 in .env
  assessment-admin: vite port 5041, proxy -> http://localhost:5040
  assessment-frontend: vite port 5042, proxy -> http://localhost:5040
Auth: JWT + access codes — no change to auth logic

---

## Admin Shell Design (apps/admin-shell)

### Purpose
A minimal, new web application that serves as the entry point for the
Thozhil platform. It does NOT contain any business logic from the four apps.

### Technology
Lightweight: plain HTML + CSS + JavaScript OR minimal React (no dependencies
on any of the four project frameworks). Decision to be made before Phase 1.

### Features (Phase 1)
- Navigation sidebar with 4 module cards:
    AI Resume Screener    -> opens http://localhost:5020
    AI Video Interviewer  -> opens http://localhost:5011
    AI Project Analyser   -> opens http://localhost:5032
    AI Coding Interviewer -> opens http://localhost:5041
- Status indicators showing which apps are running (health ping)
- No embedded iframes initially (full-page navigation preferred)

### Features (Future Phases)
- Shared SSO login (requires auth unification work)
- Embedded iframes if required
- Unified reporting across apps
- Shared candidate/intern profile

---

## What DOES NOT Change in Phase 1

- No database changes in any project
- No authentication changes in any project
- No API route changes in any project
- No rewriting of React/Vue components in any project
- No merging of package.json files
- No copying of source files between apps
- Project D is especially protected: ZERO modifications to its application code

---

## Port Change Strategy (Minimum Viable)

The only files that need to change per app are:

Project A:
  server/.env:            PORT=5010
  frontend/vite.config.js: (add) server: { port: 5011 }

Project B:
  Start command:          uvicorn app:app --port 5020 --reload

Project C:
  backend/.env:           PORT=5030
  ai-service start:       uvicorn app:app --port 5031 --reload
  frontend/vite.config.ts: server.port = 5032, proxy target = http://localhost:5030

Project D (assessment sub-apps only):
  assessment-backend/.env: PORT=5040
  assessment-admin/vite.config.js: server.port=5041, proxy -> :5040
  assessment-frontend/vite.config.js: server.port=5042, proxy -> :5040

These are the ONLY changes needed to make all four apps run simultaneously
without port collisions. Everything else is preserved.

---

## Implementation Phases

Phase 0 (Current): Architecture Audit — COMPLETE
Phase 1 (Next):    Port assignment + admin shell skeleton
Phase 2:           Admin shell navigation + health checks
Phase 3:           (Optional) Shared landing page / branding
Phase 4:           (Optional) Authentication unification
Phase 5:           (Optional) Database unification

Phases 3-5 are OUT OF SCOPE until Phase 1-2 are verified working.

---

## Risk Register

Risk                              | Severity | Mitigation
----------------------------------|----------|----------
Port changes break CORS settings  | Medium   | Update ALLOWED_ORIGINS in each .env
Project D NestJS vs FastAPI (3001)| Low      | Use only assessment-backend (Express) for now; NestJS/FastAPI are alternative backends
Project B SQLite data lost        | Low      | SQLite file stays in project_b/; port change does not affect it
WebSocket proxy misconfiguration  | Medium   | Project A WS must proxy correctly through any reverse proxy
MongoDB not running locally       | Medium   | Project D Express backend requires MongoDB; document prerequisite clearly
Docker not available              | Low      | Project D sandbox is already deferred; not needed for shell integration
