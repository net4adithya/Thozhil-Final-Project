# Setup & Usage Guide

This walks through getting all three apps running locally, then how an **admin** and a
**candidate** actually use the finished product. For endpoint-level API reference, see
each project's own README.

## 1. Prerequisites

| Requirement | Needed for | Notes |
|---|---|---|
| Node.js 18+ | all three apps | |
| MongoDB | backend | local install or Atlas connection string |
| A running compiler/code-execution service | coding questions | must expose `POST {COMPILER_BASE_URL}/execute` accepting `{ language, version, code, stdin }` and returning `{ stdout, stderr, exitCode, timeMs, memoryKb }`, and check an `X-Compiler-Key` header. This is **your existing service** — the backend doesn't include one. |
| Redis | optional | only used to cache admin report reads for a few seconds and nothing else — the app runs fine without it |

## 2. Backend

```bash
cd assessment-backend
cp .env.example .env
```

Edit `.env`:

```
MONGO_URI=mongodb://localhost:27017/assessment-platform
JWT_SECRET=<any long random string>
COMPILER_BASE_URL=https://your-compiler-service.example.com
COMPILER_API_KEY=<your compiler service's key>
CORS_ORIGIN=http://localhost:5174

# Optional — leave as-is / unset to run without Redis
REDIS_URL=redis://127.0.0.1:6379
REPORT_CACHE_TTL_SECONDS=15
```

Then:

```bash
npm install
npm run seed:admin -- "Your Name" you@example.com "StrongPassword123!"
npm run dev
```

- Server: `http://localhost:5000`
- Health check: `GET /api/health`
- Uploaded recordings and file-upload answers land under `assessment-backend/src/uploads/` —
  make sure that path is writable and, in production, backed up / moved to object storage
  (see the backend README's trade-offs section).

If you skip Redis, you'll see one line in the server log the first time it tries to
connect and reconnect — that's expected and harmless; it just means caching is off.

## 3. Admin dashboard

```bash
cd assessment-admin
npm install
npm run dev -- --port 5174
```

Open `http://localhost:5174`, log in with the account you just seeded.

> **Port note:** the candidate app below defaults to the same port (5173) as this app's
> own default. Run the admin app on 5174 (as above) if you're running both at once.

## 4. Candidate app

```bash
cd assessment-frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`. Candidates won't normally type this URL directly — they
follow the per-candidate link the admin app generates (see below), which already has
`/exam/<token>` appended.

## 5. First run, end to end

1. **Log in** to the admin app.
2. **Build a question bank** — either:
   - `Question bank → New question`, one at a time, or
   - `Question bank → Bulk import`, uploading a `.csv`, `.xlsx`, or `.json` file. See
     `assessment-backend/sample-data/questions-import-template.csv` for the column
     contract. Every row gets a validated preview (errors shown inline) before anything
     is saved.
3. **Create an exam** — `Exams → New exam`. Set duration, proctoring requirements
   (webcam/screen recording, fullscreen, violation threshold), attach questions from the
   bank, save.
4. **Invite candidates** — on the exam's page, paste `Name, email` (one per line) into
   the invite box and send. You get back a tokenized link per candidate — copy it and
   send it to them however you normally would (email, Slack, etc.). There's no
   candidate login; the link *is* the credential.
5. **Candidate takes the exam** — they open their link in the candidate app, grant
   webcam/screen/fullscreen permissions on the readiness screen, and work through the
   questions. Progress autosaves as they go; the timer counts down server-side.
6. **Watch it happen live** — back in the admin app, `Exam → Candidates` updates in
   real time (no refresh needed) as candidates start, answer questions, trip a
   violation, or submit.
7. **Grade what needs a human** — once a candidate has submitted, click **Grade** on
   their row to open subjective/file-upload answers with the model answer alongside,
   enter marks + optional feedback, save. The total recalculates immediately.
8. **Review results** — the **Question analysis** tab shows pass rate per question
   across everyone (useful for spotting a broken or trivial question), and
   **Excel/PDF report** downloads give you the per-candidate breakdown to keep or share.

## 6. Day-to-day usage by role

### As an admin
- Question bank is reusable across exams — build it once, attach different subsets to
  different exams.
- Use **Export** on the question bank (CSV or XLSX) to back it up or hand a subset to a
  colleague — it re-imports unchanged, so it doubles as a bulk-edit workflow (export,
  edit in a spreadsheet, re-import).
- For coding questions, a **custom checker script** (optional, in the question editor)
  lets you accept multiple valid outputs — e.g. floating-point tolerance or unordered
  results — instead of requiring an exact string match. It runs in the same
  language/version the candidate submitted in.
- The candidates table's **Recordings** link shows webcam/screen segments for one
  candidate if proctoring was enabled for that exam.

### As a candidate
- Open your link, allow the requested camera/screen/fullscreen permissions (all
  requested up front so nothing interrupts you mid-exam).
- Answer at your own pace within the timer — everything autosaves as you go, so
  refreshing or losing connection briefly doesn't lose your work.
- For coding questions, use **Run** to test against the sample (visible) cases before
  moving on; hidden cases are only checked on final submit.
- Avoid switching tabs, exiting fullscreen, or opening devtools — these are logged as
  violations and, past a threshold set by the exam, will auto-submit your exam.
- **Submit** when done, or let the timer do it for you — either way you'll see a simple
  confirmation screen.

## 7. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Admin app can't reach the API | Backend not running, or wrong port in `assessment-admin/vite.config.js` proxy |
| Coding questions always fail | `COMPILER_BASE_URL`/`COMPILER_API_KEY` misconfigured, or your compiler service is down |
| No live updates on the candidates table | Socket.IO connection blocked — check the browser console; confirm `/socket.io` is reachable (same origin/proxy as `/api`) |
| Redis warnings in the server log | Expected if `REDIS_URL` is unset or Redis isn't running — purely cosmetic, caching just stays off |
| Candidate can't grant webcam/screen permission | Must be over `https://` (or `localhost`) — browsers block `getUserMedia`/`getDisplayMedia` on plain HTTP for non-localhost origins |
