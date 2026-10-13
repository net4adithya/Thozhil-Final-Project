# Online Assessment Platform

Three projects, meant to run together:

| Folder | What it is | Default port |
|---|---|---|
| `assessment-backend` | Node.js/Express API — exams, questions, compiler integration, scoring, proctoring, bulk import, reports | 5000 |
| `assessment-admin` | Vue 3 admin dashboard — build exams, manage the question bank, invite candidates, watch progress, export reports | 5173 |
| `assessment-frontend` | Vue 3 candidate app — the actual timed exam-taking experience, proctored | 5173 (conflicts with admin — see below) |

Each folder has its own detailed README. This file is just the "how do these three talk to
each others" map.

## Quickest path to a working exam

```bash
# 1. Backend
cd assessment-backend
cp .env.example .env
# edit .env: MONGO_URI, JWT_SECRET, COMPILER_BASE_URL, COMPILER_API_KEY
npm install
npm run seed:admin -- "Your Name" you@example.com "StrongPassword123!"
npm run dev                      # → http://localhost:5000

# 2. Admin dashboard (new terminal)
cd assessment-admin
npm install
npm run dev -- --port 5174       # avoid clashing with the candidate app below
# → http://localhost:5174, log in with the seeded admin account
# → create questions (or bulk-import via the sample CSV in assessment-backend/sample-data/)
# → create an exam, attach questions, invite a candidate — copy the exam link it gives you

# 3. Candidate app (another new terminal)
cd assessment-frontend
npm install
npm run dev                      # → http://localhost:5173
# → paste the exam link/token from step 2
```

All three dev servers proxy `/api` (and `/socket.io`) to `http://localhost:5000` (see each
project's `vite.config.js`), so no CORS setup is needed in development.

## What's built

Full exam/question CRUD, compiler service integration with concurrency limiting,
visible/hidden test case scoring (plus optional per-question **custom checker
scripts**, run in the candidate's own submitted language), tokenized candidate links,
autosave, countdown timer with auto-submit, webcam/screen recording + **copy/paste and
devtools-open violation detection** with auto-submit at threshold, a Monaco-powered code
editor for coding questions, **file-upload answers** (multer disk storage + authenticated
admin download), CSV/XLSX/**JSON** bulk import with row-level validated preview, question
bank **export** (CSV/XLSX, round-trippable with import), Excel/PDF report export, a
**manual grading UI** for subjective/file-upload answers, **per-question pass-rate
analysis** across all candidates, and a **live-updating candidate progress dashboard**
(Socket.IO) backed by an optional Redis cache for the report data.

Redis is optional in dev — set `REDIS_URL` in `assessment-backend/.env` to enable
caching; without it the app just always computes report data fresh.

Each project's README has a "known trade-offs" section for anything still intentionally
deferred (e.g. recordings on local disk vs. object storage) — worth a skim before a
production deployment.
