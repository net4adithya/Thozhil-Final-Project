# THOZHIL INTEGRATION — FRONTEND MOUNTING ANALYSIS

## Executive Summary
This document analyzes the frontend mounting, routing, static asset resolution, API proxying, and WebSocket behaviors across the four Thozhil microservices when accessed through the unified Gateway (`http://localhost:8080/`).

Project A (AI Video Interviewer) served as the **working reference implementation**, while Project B (AI Resume Screener), Project C (AI Project Analyser), and Project D (AI Coding Interviewer) exhibited distinct root cause integration failures under gateway proxying.

---

## 1. Concrete Module Comparison Table

| Module | Working? | Root Path Assumptions | Asset Path Issue | Router Issue | API Issue | WebSocket Issue | Required Fix |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **Project A: AI Video Interviewer** | **YES (Reference)** | Assumed `/` or `/interview/` with standard Vite dev proxy | Handled via Referer header and Vite client proxying | React Router single-page navigation | Direct proxy to `:5010` for `/api/interviews`, `/api/candidates`, `/api/voice` | Native WebSocket `/ws/live` on port `:5010` | None (Reference implementation preserved) |
| **Project B: AI Resume Screener** | **FIXED** | Server expected `frontend/index.html` relative to CWD instead of absolute `apps/resume` root | Static file paths broke when requested via relative path without CWD scoping | Single-page HTML/JS layout with modal views | Candidate API route collision (`/api/candidates/*/status`) routed to Project A instead of B | N/A (REST / SSE only) | Fixed `BASE_DIR`/`FRONTEND_DIR` in `app.py`, updated Gateway candidate API disambiguation & static asset resolution |
| **Project C: AI Project Analyser** | **FIXED** | Vite proxy defaulted to port `3000` instead of port `5030`; Backend restricted CORS | Dev server Vite assets (`/src/main.tsx`) fell through to Admin Shell | React Router navigation | Backend restricted `ALLOWED_ORIGINS` causing CORS errors for `:8080` and `:5032` | N/A | Updated `vite.config.ts` target to `:5030`, added `localhost:8080` and `localhost:5032` to CORS `ALLOWED_ORIGINS` |
| **Project D: AI Coding Interviewer** | **FIXED** | Vite dev server proxied to `:5000` instead of `:5040`; Gateway Socket.IO missing | Vuetify / Vue JS assets fell back to Admin Shell without Referer proxying | Vue Router history mode | Backend API port mismatch (`:5000` vs `:5040`) | Gateway upgrade handler echoed packets (`socket.pipe(socket)`) instead of proxying Socket.IO | Updated Vite proxies to `:5040`, added `/socket.io` Gateway proxying, implemented real Node HTTP upgrade forwarding |

---

## 2. Detailed Root Cause Analysis

### 2.1 Project A (AI Video Interviewer) — Reference Architecture
- **Vite Configuration**: Runs on Vite dev server on port `5011`.
- **Backend API**: Express backend on port `5010`.
- **WebSocket Protocol**: `/ws/live` native WebSocket on port `5010`.
- **Why It Worked**: Gateway correctly routed `/api/interviews`, `/api/candidates`, and `/api/voice` to port `5010`, and routed `/interview/*` UI requests to port `5011`.

### 2.2 Project B (AI Resume Screener) — Python FastAPI Failure
- **Root Cause**: In `apps/resume/backend/app.py`, static endpoints returned `FileResponse(os.path.join("frontend", "index.html"))`. When executed from the workspace root, `os.path.join` looked for `c:\...\frontend\index.html` (which did not exist), throwing a `FileNotFoundError` (HTTP 500).
- **Candidate Route Collision**: Project B endpoints like `/api/candidates/{id}/status`, `/api/candidates/{id}/resume`, `/api/candidates/{id}/retry` clashed with Project A's `/api/candidates` route in the Gateway, causing 404s when status or preview was fetched.
- **Fix**: Redefined `BASE_DIR = os.path.dirname(os.path.abspath(__file__))` and `PROJECT_ROOT = os.path.dirname(BASE_DIR)` so `FRONTEND_DIR` points to `apps/resume/frontend`. Updated Gateway `getUpstreamTarget` to route candidate status/resume requests to Project B (`:5020`).

### 2.3 Project C (AI Project Analyser) — CORS & Vite Proxy Mismatch
- **Root Cause 1**: `apps/project-analysis/intern/frontend/vite.config.ts` had hardcoded proxy target `http://localhost:3000` instead of `http://localhost:5030`.
- **Root Cause 2**: In `apps/project-analysis/intern/backend/server.js`, `ALLOWED_ORIGINS` only allowed `localhost:5173`, `localhost:4173`, and `localhost:3000`. Requests originating from Gateway (`localhost:8080`) or Vite (`localhost:5032`) failed with `CORS: origin not allowed`.
- **Fix**: Corrected Vite proxy target to `http://localhost:5030` and added `localhost:8080` & `localhost:5032` to backend `ALLOWED_ORIGINS`.

### 2.4 Project D (AI Coding Interviewer) — Socket.IO & Upgrade Proxying
- **Root Cause 1**: Admin UI (`:5041`) and Candidate UI (`:5042`) `vite.config.js` proxied to port `:5000` instead of port `:5040`.
- **Root Cause 2**: Gateway `packages/gateway/server.js` lacked `/socket.io` routing for HTTP polling, and its `server.on('upgrade')` handler echoed socket bytes (`socket.pipe(socket)`) rather than forwarding upgrade headers to the target service.
- **Fix**: Updated Vite proxy target to `:5040`, added `/socket.io` to Gateway API target list, and implemented full HTTP 101 Switching Protocols proxying in Gateway `server.on('upgrade')`.

---

## 3. Integrated Gateway Routing Matrix

```
[Browser Request: http://localhost:8080]
  │
  ├── /resume/* ─────────────────► Project B Backend/App (:5020)
  ├── /interview/* ──────────────► Project A UI (:5011)
  ├── /project-analysis/* ───────► Project C UI (:5032)
  ├── /coding/* ─────────────────► Project D UI (:5041)
  │
  ├── /api/resumes, /api/jobs ───► Project B Backend (:5020)
  ├── /api/interviews, /api/voice ► Project A Backend (:5010)
  ├── /api/logs, /api/review ────► Project C Node API (:5030)
  ├── /api/exams, /socket.io ────► Project D API (:5040)
  │
  └── /ws/live, /socket.io [WS] ─► Native Upgrade Proxy to Upstream
```

---

## 4. Verification Status
All four applications have been verified to load their initial HTML, compile/resolve JS and CSS assets, connect to their respective backend API services, and maintain same-tab navigation under `http://localhost:8080/`.
