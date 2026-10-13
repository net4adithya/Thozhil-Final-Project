# THOZHIL — Unified Intern Identity Architecture Document

**Date:** 2026-09-30  
**Identity Mapping:** Canonical `internId` Mapping Engine  

---

## 1. Canonical Identity Model

The platform uses a canonical identifier **`internId`** (e.g. `INT-901`) to map and aggregate an intern's performance across all four standalone modules:

```
Canonical Intern Record (`internId = INT-901`)
  ├── Resume Screener   ──> `candidateId = cand-b-101` (Score: 94% Match)
  ├── Video Interview   ──> `candidateId = cand-a-201` (Evaluation: 88%)
  ├── Project Analyser  ──> `userId = user-c-301`      (Risk: Low Risk)
  └── Coding Interviewer──> `userId = user-d-401`      (Test Cases: 8/8 Passed)
```

---

## 2. API Surface

- `GET /api/interns` — Returns list of candidate records aggregated from underlying backend services.
- `GET /api/interns/:id` — Returns full candidate profile with sub-score breakdowns across all 4 modules.
- `PATCH /api/interns/:id/decision` — Saves administrative hiring decision (`APPROVE`, `REJECT`, `RESUBMISSION_REQUESTED`, `PENDING_REVIEW`) and private admin notes.

---

## 3. Data Integrity & Non-Destructive Storage

- No existing database tables were dropped or modified.
- No destructive migrations (`prisma migrate reset`) were run.
- Existing database records in Supabase PostgreSQL, SQLite, and MongoDB remain untouched.
