# Thozhil — Architectural Decision Log

This document records key architectural, integration, and design decisions made for the **Thozhil** platform integration.

---

## Initial Core Integration Principles

1. **No Blind Code Merging:** The four projects will NOT be blindly merged into a single codebase folder without structure. Specialized engines (resume screening, video turn gateway, project log reviewer, static code analyzer, Docker sandbox) will preserve their core logic and be connected via clean modular interfaces.
2. **Preservation of Specialized Functionality:** Existing specialized algorithms (such as Project B's TF-IDF taxonomy matcher, Project A's WebSocket voice gateway, Project C's speech text generator, and Project D's AST static analysis) must be preserved during migration.
3. **Primary Roles:** The final product has two primary user roles:
   * **Admin (Recruiter / Authority / Manager):** Creates jobs and assignments, assigns interns, monitors candidate progress across assessment stages, and reviews unified AI-generated results.
   * **Intern (Candidate / Contributor):** Logs in, views assigned work and assessments, completes applicable evaluation stages (resume, video interview, coding, project logs), and submits work.
4. **Unified User Experience:** The final product should present ONE seamless web application interface rather than a collection of disconnected portals.
5. **React as Common Frontend Standard:** React (19 with TypeScript/JSX) will be the eventual common frontend framework. Non-React view components (such as Project B's single-file HTML and Project D's Vue 3 views) will be systematically ported to React.
6. **PostgreSQL / Supabase as Common Database Direction:** Supabase PostgreSQL is the intended single database engine. Non-PostgreSQL database stores (Project B's SQLite and Project D's MongoDB) will be migrated to PostgreSQL schemas.
7. **Modular Engine Isolation:** Existing specialized execution engines may remain separate internal services (e.g. Node.js primary backend on port 5000 and Python FastAPI AI microservice on port 8000) during migration.
8. **Deferred Docker Execution:** Docker code execution (Project D) is deferred to a later phase (Phase 8) so that initial foundation and documentation phases do not require a running Docker daemon on the developer machine.
9. **One Module at a Time:** Future implementation will proceed strictly one module/phase at a time, followed by runtime verification before advancing.
10. **Approval Required for Major Rewrites:** No project-wide rewrite or breaking architectural change should happen without explicit approval.
11. **Incremental Migration & Verification:** Existing functionality must be migrated incrementally and empirically verified after each phase.

---

## Decision History Log

| Date | Decision | Reason | Affected Projects | Status |
| :--- | :--- | :--- | :--- | :--- |
| **2026-09-25** | Adopt Project A as initial baseline candidate for application shell | Project A already contains React 19 + Express + Supabase + authentication + Jobs/Candidates/Interviews/Reports data models. | Project A, B, C, D | **Approved (Planning Decision)** |
| **2026-09-25** | Defer Docker sandbox code execution to Phase 8 | Docker daemon may not be installed or active on all local development environments during early foundation phases. | Project D | **Approved** |
| **2026-09-25** | Standardize backend architecture to Node Express (Port 5000) + Python FastAPI (Port 8000) | Node handles web API, auth, database, and WebSockets; FastAPI handles LLM evaluations, static analysis, and Docker execution. | Project A, B, C, D | **Approved** |
| **2026-09-25** | Adopt Passport JWT + Refresh Tokens (Project D) for unified identity | Provides enterprise-grade authentication, refresh session persistence, role guards, and candidate access-code support. | Project A, B, C, D | **Approved** |
| **2026-09-29** | Complete Phase 5 Coding Assessment integration with Docker DEFERRED | Integrated Monaco IDE, 12-language static analysis, Gemini code review, test case management, and submission locking while keeping Docker execution explicitly deferred to Phase 8. | Project D, Thozhil App | **Approved** |
| **2026-09-29** | Complete Phase 6 Unified Admin Dashboard & Multi-Stage Reports | Integrated unified statistics cards, stage pipeline progress tracker, multi-stage report card (Resume + Interview + Project + Coding), admin decision controls, and intern assessment history. | All Projects (Thozhil App) | **Approved** |
| **2026-09-29** | Complete Phase 7 Cleanup & Consolidation | Validated dual-frontend architecture (Admin Vue on :5001, Candidate Vue Monaco on :5002), unified Node Express backend (:5000) + Python FastAPI (:8000), standardized role labels to Admin/Intern, and updated environment strategy. | All Projects (Thozhil App) | **Approved** |
| **2026-09-29** | Complete Phase 7B Functional Frontend Integration (Single Tab) | Reorganized Admin sidebar to strictly expose Dashboard, Modules (AI Resume Screener, AI Video Interviewer, AI Project Analyser, AI Coding Interviewer), and Intern Details. All modules run inside the SAME browser tab with full original functionality connected via Vue Router and Express/FastAPI APIs. | All Projects (Thozhil App) | **Approved** |
