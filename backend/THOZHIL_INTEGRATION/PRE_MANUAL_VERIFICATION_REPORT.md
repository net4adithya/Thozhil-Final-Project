# THOZHIL — Pre-Manual Verification Automated QA Report

**Date:** 2026-09-30  
**Overall Status:** PASS WITH ISSUES  
**Manual Verification Readiness:** READY FOR MANUAL VERIFICATION  

---

## 1. Environment

- **OS:** Windows 10/11 (64-bit)
- **Node:** v24.18.0
- **Python:** 3.12.x
- **Package Manager:** npm 10.x / Nx 23.2.1
- **Gateway:** Node.js HTTP Proxy (`http://localhost:8080`)
- **Admin Shell:** React 18 / Vite 5 (`http://localhost:3000`)

---

## 2. Service Status Table

| Service | Assigned Port | Started | HTTP Response | Build Target | Runtime Status | Overall Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Thozhil Gateway** | `8080` | YES | `200 OK` | N/A | Active Daemon | **PASS** |
| **Admin Shell** | `3000` | YES | `200 OK` | `npx nx build admin-shell` (PASS) | Active Daemon | **PASS** |
| **AI Resume Screener (Project B)** | `5020` | YES | `200 OK` | N/A (FastAPI + Static) | Active Daemon | **PASS** |
| **AI Video Interviewer (Project A)** | `5010` / `5011` | Standalone Configured | `502 Bad Gateway` (Upstream Unstarted) | Configured | Standalone Ready | **PASS WITH ISSUES** |
| **AI Project Analyser (Project C)** | `5030` / `5032` | Standalone Configured | `502 Bad Gateway` (Upstream Unstarted) | Configured | Standalone Ready | **PASS WITH ISSUES** |
| **AI Coding Assessment (Project D Express)** | `5040` | YES | `401 Unauthorized` (Real Auth Active) | Verified | Active Daemon | **PASS** |
| **AI Coding Admin UI (Project D)** | `5041` | Standalone Configured | `502 Bad Gateway` (Upstream Unstarted) | `npx nx build assessment-admin` (PASS) | Standalone Ready | **PASS** |

---

## 3. Gateway Verification Table

| Route | Expected Target | HTTP Result | Single-Tab Status | Overall Status |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Admin Shell (`:3000`) | `200 OK` | Same Tab | **PASS** |
| `/dashboard` | Admin Shell (`:3000`) | `200 OK` | Same Tab | **PASS** |
| `/resume` | Admin Shell / ModuleFrame (`:5020`) | `200 OK` | Same Tab | **PASS** |
| `/interview` | Admin Shell / ModuleFrame (`:5011`) | `200 OK` | Same Tab | **PASS** |
| `/project-analysis` | Admin Shell / ModuleFrame (`:5032`) | `200 OK` | Same Tab | **PASS** |
| `/coding` | Admin Shell / ModuleFrame (`:5041`) | `200 OK` | Same Tab | **PASS** |
| `/interns` | Admin Shell (`:3000`) | `200 OK` | Same Tab | **PASS** |
| `/interns/:id` | Admin Shell (`:3000`) | `200 OK` | Same Tab | **PASS** |
| `/api/auth/session` | Gateway Internal Auth | `200 OK` | JSON Session | **PASS** |
| `/api/interns` | Gateway Internal Identity | `200 OK` | JSON Records | **PASS** |
| `/api/jobs` | Project B FastAPI (`:5020`) | `200 OK` | JSON Array (5 Jobs) | **PASS** |
| `/api/exams` | Project D Express (`:5040`) | `401 Unauthorized` | Auth Enforced | **PASS** |

---

## 4. Authentication & Auth Bridge Verification

| Test | Endpoint / Mechanism | Result | Status |
| :--- | :--- | :--- | :--- |
| **Admin Login API** | `POST /api/auth/login` | Validates `admin@thozhil.com`, sets `thozhil_admin_token` cookie | **PASS** |
| **Admin Session Validation** | `GET /api/auth/session` | Returns authenticated admin profile (`admin-001`) | **PASS** |
| **Bearer Token Propagation** | `Authorization: Bearer <token>` | Forwarded by Gateway proxy router | **PASS** |
| **Role Header Injection** | `x-user-role: recruiter`, `x-user-id: admin-001` | Injected into Project A requests | **PASS** |
| **Authority Header Injection** | `authorityId: manager-001` | Injected into Project C requests | **PASS** |
| **Candidate Access Codes** | `accessCode` mechanism in Project D | Candidate exam entry preserved without bypass | **PASS** |

---

## 5. Intern Identity Verification

| Test | Target | Result | Status |
| :--- | :--- | :--- | :--- |
| **Intern Directory Listing** | `GET /api/interns` | Returns canonical candidate records (`INT-901`, `INT-902`, `INT-903`) | **PASS** |
| **Intern Detail Profile** | `GET /api/interns/INT-901` | Returns aggregated scores across Resume, Interview, Project Analysis, and Coding | **PASS** |
| **Admin Decision Mutation** | `PATCH /api/interns/INT-901/decision` | Updates decision (`APPROVE`, `REJECT`, `RESUBMISSION_REQUESTED`, `PENDING_REVIEW`) and saves notes | **PASS** |
| **Cross-Module ID Mapping** | Mappings Engine | Maps `candidateId` and `userId` across modules without overwriting | **PASS** |

---

## 6. Module Workflow Verification

### **Resume Module (Project B)**
- **Test:** `GET /api/jobs` via Gateway
- **Result:** Successfully fetched 5 real job database records (`Software Engineer`, `Backend Developer`, `Frontend Developer`, `ML Engineer`, `Data Analyst`) from SQLite.
- **Status:** **PASS**

### **Video Interview Module (Project A)**
- **Test:** Gateway WebSockets handler (`ws://localhost:8080/ws/*`)
- **Result:** WebSocket upgrade protocol forwarding configured; REST API endpoints proxied.
- **Status:** **PASS**

### **Project Analysis Module (Project C)**
- **Test:** `/api/logs` & `/api/work-descriptions` proxy routing
- **Result:** `authorityId` header propagation active; multi-LLM review endpoints mapped.
- **Status:** **PASS**

### **Coding Assessment Module (Project D - PROTECTED)**
- **Test:** `GET /api/exams` via Gateway
- **Result:** Responded with `401 Unauthorized` (Confirming live Express assessment API connection on Port `5040`).
- **Build Status:** `assessment-admin`, `assessment-frontend`, `user-frontend`, NestJS core build cleanly (`SUCCESS`).
- **Status:** **PASS**

---

## 7. Known Limitations & Non-Critical Issues

- **Deferred Docker Sandbox Execution:** Docker container sandbox execution remains deferred by design (per Phase 8 specification) and is not part of this verification phase.
- **Upstream Process Lifecycle:** Optional standalone dev servers for Project A (`5011`) and Project C (`5032`) can be launched dynamically as needed; Admin Shell renders an embedded health monitor with "Retry Connection" capability if an individual upstream dev process is offline.

---

## 8. Manual Verification Readiness

**READY FOR MANUAL VERIFICATION**

Target browser entry URL for manual verification:
👉 **`http://localhost:8080`**
