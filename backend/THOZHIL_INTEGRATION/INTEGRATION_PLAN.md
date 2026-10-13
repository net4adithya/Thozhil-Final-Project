# Thozhil — Phased Integration Plan

This document outlines the step-by-step phased integration strategy for uniting the four independent projects into **Thozhil**.

---

## Architectural Principles

1. **No Blind Merging:** Specialized engines (resume screening, video interview turn gateway, project log review, static code analysis, Docker sandbox) will preserve their internal logic and be connected via structured interfaces.
2. **Single Product UX:** The final product behaves as ONE unified application with two primary roles:
   * **Admin (Recruiter / Authority / Manager):** Creates jobs/assignments, assigns interns, monitors assessment pipeline stages, and views unified AI-generated evaluation reports.
   * **Intern (Candidate / Contributor):** Logs in, views assigned work/assessments, completes applicable stages (resume upload, video interview, coding workspace, project log submission), and views results.
3. **Incremental Migration & Verification:** Each phase must be fully verified before proceeding to the next.
4. **Shell Baseline:** Project A is the initial candidate for the application shell (React + Express + Supabase + Auth + Jobs/Candidates/Interviews/Reports). This is a planning decision subject to revision during implementation.
5. **Docker Execution Deferral:** Docker code execution (Project D) is deferred to Phase 8 so that initial foundation phases do not require a local Docker daemon.

---

## Overview of Phases

| Phase | Title | Description |
| :--- | :--- | :--- |
| **Phase 0** | Documentation & Planning | System auditing, architecture mapping, and integration reference setup. |
| **Phase 1** | Unified Thozhil Foundation | Unified Auth, Admin & Intern dashboards, shared User/Job/Assignment database schemas. |
| **Phase 2** | Resume Screening Module | Integration of Project B AI Resume Screener (batch upload, TF-IDF / Gemini screening). |
| **Phase 3** | Video Interview Module | Integration of Project A AI Video & Voice Interviewer (WebSocket gateway, Sarvam voice). |
| **Phase 4** | Project Analysis Module | Integration of Project C LogLense (work descriptions, log submissions, multi-LLM review). |
| **Phase 5** | Coding Assessment Module | Integration of Project D Monaco IDE, question banks, test cases, 12-language static analysis. |
| **Phase 6** | Unified Admin Dashboard & Reports | Consolidated candidate profile, multi-stage report card, analytics, and hiring pipeline. |
| **Phase 7** | Cleanup & Consolidation | Elimination of redundant legacy servers, unused dependencies, and duplicate stores. |
| **Phase 8** | Docker Code Execution Sandbox | Integration of Project D multi-language Docker execution sandbox worker and Redis queue. |

---

## Phase Details

### Phase 0 — Documentation & Planning
* **Objective:** Establish persistent documentation and architecture specs for all 4 projects.
* **Functionality Integrated:** Audit of all repositories, database models, endpoints, and cross-project conflicts.
* **Preserved Functionality:** All existing codebases remain completely untouched in their original directories.
* **Expected Files/Modules Affected:** `THOZHIL_INTEGRATION/` (`PROJECT_STATUS.md`, `PROJECT_REPORT.md`, `INTEGRATION_PLAN.md`, `DECISIONS.md`).
* **Dependencies:** None.
* **Risks:** Incomplete documentation requiring later codebase re-inspections.
* **Completion Criteria:** All 4 documentation files created and aligned.

---

### Phase 1 — Unified Thozhil Foundation
* **Objective:** Build the core unified web application foundation with authentication, user roles, navigation layouts, and job/assignment management.
* **Functionality Integrated:**
  * Passport JWT Authentication (Access + Refresh tokens) + 6-character access codes.
  * Two unified user experiences: **Admin Portal** and **Intern Portal**.
  * Core database schema in Supabase PostgreSQL (`users`, `roles`, `jobs`, `assignments`).
* **Existing Functionality Preserved:** Project A UI shell layout, candidate management data structures.
* **Expected Files/Modules Affected:** `frontend/src/App.jsx`, `frontend/src/context/AuthContext.jsx`, `server/src/app.js`, `server/src/middleware/authMiddleware.js`, Supabase migrations.
* **Dependencies:** Phase 0 completion.
* **Risks:** Breaking existing Project A route guards during role consolidation.
* **Completion Criteria:** Admin and Intern can log in, view role-specific navigation sidebars, create job openings/assignments, and see active pipelines.

---

### Phase 2 — Resume Screening Module Integration
* **Objective:** Integrate Project B's AI Resume Screener into the unified Thozhil Admin and Intern portals.
* **Functionality Integrated:**
  * Intern: Drag-and-drop PDF/DOCX resume upload during job application.
  * Admin: Batch resume upload, background resume screening queue, candidate match score calculation, skill breakdown, ReportLab PDF generator.
  * Backend: Port FastAPI resume screening routes & TF-IDF / Gemini engine ([`ai_screener_engine.py`](file:///C:/Users/USER/Thozhil%20Final/project_b/ai_screener_engine.py)) into the Python AI microservice (`:8000`).
* **Existing Functionality Preserved:** Project B's taxonomy-aware skill matching, local TF-IDF fallback engine, and ReportLab PDF generator.
* **Expected Files/Modules Affected:** `python_backend/`, `server/src/routes/resumeRoutes.js`, `frontend/src/pages/`.
* **Dependencies:** Phase 1 foundation.
* **Risks:** SQLite schema mismatch when migrating candidate records to PostgreSQL.
* **Completion Criteria:** Resumes uploaded by Interns or Admins are screened by the background worker, producing match scores and skill lists in the unified dashboard.

---

### Phase 3 — Video Interview Module Integration
* **Objective:** Integrate Project A's AI Video & Voice Interviewer into the unified pipeline.
* **Functionality Integrated:**
  * Intern: Device readiness check, live video/voice interview room, WebSockets turn-taking gateway (`ws://localhost:5000/ws/live`), Sarvam AI voice integration, async interview room.
  * Admin: Interview template creation, question bank setup, video recording playback, proctoring observation log review.
* **Existing Functionality Preserved:** Real-time WebSocket audio streaming, Sarvam AI STT/TTS synthesis, proctoring event logger.
* **Expected Files/Modules Affected:** `server/src/realtime/liveWebSocketGateway.js`, `frontend/src/pages/LiveInterview.jsx`, `server/src/services/voice/`.
* **Dependencies:** Phase 1 foundation.
* **Risks:** WebSocket connection drops or browser media device permission handling on diverse devices.
* **Completion Criteria:** Candidate can complete a live AI voice/video interview with real-time turn-taking, and Admin can view recordings and proctoring logs.

---

### Phase 4 — Project Analysis Module Integration (LogLense)
* **Objective:** Integrate Project C's work description and intern log review system into Thozhil.
* **Functionality Integrated:**
  * Admin: Work description publishing, team intern assignment, manager risk assessment review, intern progress tracking.
  * Intern: Log submission with source code attachments, receiving structured AI feedback cards (strengths, weaknesses, suggestions), Web Speech audio feedback.
  * Backend: Port Project C prompt builder and multi-LLM provider service (`ai_provider.py`) into Python AI microservice.
* **Existing Functionality Preserved:** Prompt builder formatting, speech text generation, multi-provider LLM fallback (Gemini/OpenAI/Ollama/Sarvam).
* **Expected Files/Modules Affected:** `server/src/routes/logRoutes.js`, `python_backend/ai_review/`, `frontend/src/pages/ProjectAnalysis.jsx`.
* **Dependencies:** Phase 1 foundation.
* **Risks:** Differences in LLM JSON parsing models between Project C and Project A.
* **Completion Criteria:** Interns can submit work logs with attached code, receive AI score reviews and audio playback, and Admins can view manager risk summaries.

---

### Phase 5 — Coding Assessment Module Integration (COMPLETE)
* **Objective:** Integrate Project D's Monaco IDE workspace, question banks, test cases, 12-language static code analysis, and Gemini AI review.
* **Functionality Integrated:**
  * Intern: Monaco IDE coding workspace, problem statement view, client-side draft autosave, submission locking, static code analysis feedback, submission version history.
  * Admin: Question bank creation, test case definition (public vs hidden), assignment publishing to Interns, static analysis inspection, automated AI review report view.
  * Backend: Mounted 12-language AST static analysis analyzers ([`static_analysis/analyzers`](file:///C:/Users/USER/Thozhil%20Final/project_d/static_analysis/analyzers)) in Python microservice (`:8000`), Gemini AI review service in Node Express backend (`:5000`).
* **Existing Functionality Preserved:** Monaco Editor configuration, 12 AST static analysis analyzers, automated AI code review calculation, submission version tracking.
* **Expected Files/Modules Affected:** `assessment-platform/assessment-frontend/`, `assessment-platform/assessment-admin/`, `python_backend/static_analysis/`, `assessment-platform/assessment-backend/src/controllers/submissionController.js`.
* **Dependencies:** Phase 1 foundation.
* **Risks:** Docker container execution dependency. (Mitigated: Docker execution explicitly DEFERRED to Phase 8).
* **Completion Criteria:** Candidate can open a coding assignment in Monaco IDE, run static code analysis, save drafts, and submit solutions; Admin can view code versions, static analysis, and automated AI code review. (COMPLETED)

---

### Phase 6 — Unified Admin Dashboard & Reports (COMPLETE)
* **Objective:** Build a single, comprehensive candidate report card and multi-stage hiring dashboard on top of completed Phases 1–5.
* **Functionality Integrated:**
  * Consolidated Admin Overview Cards: Real-time metrics for Total Interns, Active Assignments, Pending Assessments, Completed Assessments, Pending Reviews, Approved, Rejected, and Resubmission Requested.
  * Assessment Pipeline Table: Visual progress tracker per Intern through Resume Screening, Video Interview, Project Analysis, and Coding Assessment.
  * Unified Multi-Stage Report: Aggregates Stage 1 Resume scores, Stage 2 Interview scores/summary/transcript, Stage 3 Project Log correctness/risk, and Stage 4 Coding submitted source code, static AST analysis, and Gemini AI code review.
  * Admin Workflow Decisions: APPROVE, REJECT, REQUEST RESUBMISSION, and private internal notes.
  * Intern Assessment History: Admin view of intern profiles and complete multi-assignment history.
* **Existing Functionality Preserved:** Phase 1 Auth, Phase 2 Resume Screener, Phase 3 Video/Voice Interviewer, Phase 4 LogLense, Phase 5 Monaco IDE & 12-language AST static analysis.
* **Expected Files/Modules Affected:** `assessment-platform/assessment-backend/src/controllers/adminController.js`, `routes/adminRoutes.js`, `assessment-admin/src/views/Dashboard.vue`, `UnifiedReport.vue`, `InternHistory.vue`.
* **Dependencies:** Phases 1 through 5.
* **Completion Criteria:** Admin can view live statistics, track candidate pipeline progress across all stages, view unified multi-stage reports, record decisions/private notes, and inspect intern assignment history. (COMPLETED)

---

### Phase 7 — Cleanup & Consolidation (COMPLETE)
* **Objective:** Audit and consolidate architecture across backend services, frontends, database models, environment strategies, and port mappings.
* **Functionality Integrated:**
  * Architecture Audit: Documented single Node Express backend (`:5000`), Python FastAPI AI microservice (`:8000`), Admin Vue 3 frontend (`:5001`), and Intern Vue 3 Monaco frontend (`:5002`).
  * Database Consolidation: Verified single Prisma ORM with Supabase PostgreSQL schema and local SQLite (`dev.db`) fallback.
  * Role Standardization: Standardized UI labels to `Admin` and `Intern` while maintaining Prisma schema backward compatibility (`AUTHORITY`, `INTERN`).
  * Service & Port Consolidation: Fixed `python_backend/main.py` entrypoint and updated `.env.example` with complete service configuration parameters.
* **Existing Functionality Preserved:** All 6 completed modules (Auth, Resume Screener, Video/Voice Interviewer, LogLense, Monaco Coding Assessment, Unified Admin Reports).
* **Expected Files/Modules Affected:** `python_backend/main.py`, `.env.example`, `THOZHIL_INTEGRATION/`.
* **Dependencies:** Phases 1 through 6.
* **Completion Criteria:** Architecture audited, frontends built cleanly, backend services verified, environment strategy documented, and zero regressions across Phases 1-6. (COMPLETED)

---

### Phase 7B — Functional Frontend Integration (COMPLETE)
* **Objective:** Reorganize the Admin frontend to expose all 4 original specialized evaluation modules (AI Resume Screener, AI Video Interviewer, AI Project Analyser, AI Coding Interviewer) and Intern Details in full functionality inside the **SAME Admin browser tab**.
* **Functionality Integrated:**
  * Main Dashboard (`/dashboard` or `/`): Real-time statistics overview cards (8 metrics), Assessment Pipeline progress tracker, Quick Access cards to the 4 modules (navigating within the same tab), Intern Performance table, Recent Activity, and Pending Admin Actions.
  * Strict Admin Sidebar (`AdminShell.vue`):
    * Dashboard (`/dashboard`)
    * Modules (Subheader):
      1. AI Resume Screener (`/resume`)
      2. AI Video Interviewer (`/interview`)
      3. AI Project Analyser (`/project-analysis`)
      4. AI Coding Interviewer (`/coding`)
    * Intern Details (`/interns`)
  * Full Functional Module Components (Same-Tab Vue Router views):
    * `ResumeScreenerModule.vue` (`/resume`): Job criteria configuration, multi-format (PDF/DOCX/TXT) resume file uploader, background TF-IDF + Gemini AI match engine, match score cards, skill breakdown, candidate management table.
    * `VideoInterviewModule.vue` (`/interview`): Video interview evaluations list, interview score, technical/communication/confidence breakdown, transcript & AI summary viewer, recommendation status.
    * `ProjectAnalysisModule.vue` (`/project-analysis`): Work description selector, intern project log submission reviews, LogLense multi-LLM review cards (correctness, quality, risk score), AI summary, manager risk notes editor.
    * `CodingInterviewerModule.vue` (`/coding`): Question Bank and Exam editor navigation, coding assignment cards with access codes, language badges, submission counts, and report links.
  * Intern Management (`InternsManagement.vue` at `/interns`): Search toolbar, intern list table with email, institution, assigned/completed assessment counts, and single-tab detail view navigation (`/interns/:id`).
* **Existing Functionality Preserved:** All 4 underlying backend microservices and evaluation engines (Resume Screener TF-IDF/Gemini, Video Interviewer voice turn-taking, LogLense Project Analyser, Monaco Coding IDE with 12 AST analyzers).
* **Expected Files/Modules Affected:** `assessment-admin/src/components/AdminShell.vue`, `src/views/Dashboard.vue`, `src/router/index.js`, `src/views/*Module.vue`, `src/views/InternsManagement.vue`.
* **Dependencies:** Phases 1 through 7.
* **Completion Criteria:** Admin can navigate all 4 assessment modules and intern details inside the SAME browser tab without new window popups, manage interns and assignments, view live pipeline analytics, and review multi-stage AI reports. (COMPLETED)

---

### Phase 8 — Docker Code Execution Sandbox Integration
* **Objective:** Integrate Project D's multi-language Docker code execution container runner and Redis worker queue.
* **Functionality Integrated:**
  * Synchronous and asynchronous sandboxed compilation/execution for Python, JavaScript, C++, and Java inside isolated Docker containers.
  * Hardened execution security: 256MB RAM cap, 1 CPU quota, `network_mode="none"`, `user="nobody"`, `cap_drop=["ALL"]`, 10s SIGKILL timeout.
  * Redis job queue (`sandbox:jobs`) and worker daemon (`sandbox-worker`).
* **Existing Functionality Preserved:** Project D `executor.py`, Dockerfile worker, language compilation specs.
* **Expected Files/Modules Affected:** `python_backend/app/sandbox/`, `docker-compose.yml`, `Dockerfile.sandbox-worker`.
* **Dependencies:** Phase 5 completion + host Docker daemon availability.
* **Risks:** Host environment lacking Docker daemon or permission errors accessing `/var/run/docker.sock`.
* **Completion Criteria:** Code submitted in Monaco IDE compiles and executes inside isolated Docker containers, returning verdict states (`ACCEPTED`, `WRONG_ANSWER`, `COMPILE_ERROR`, `TIME_LIMIT_EXCEEDED`).
