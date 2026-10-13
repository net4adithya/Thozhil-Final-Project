# Assessment Platform — Backend (Slice 1)

Core slice: **exam/question management + your self-hosted compiler service integration +
test-case scoring**. This is the highest-value, riskiest part of the platform, so it's
built and working first, before proctoring, bulk import, or reporting.

## What's here

- Admin auth (JWT)
- Question bank: MCQ, multi-select, true/false, fill-in-blank, subjective, coding, file upload
- Exams: create, attach questions, invite candidates via one-time tokenized links
- Candidate flow: fetch exam (hidden test cases/answer keys stripped), autosave answers,
  run code against **visible** test cases only, final submit grades against **all** test cases
- Compiler integration: calls your existing `POST {COMPILER_BASE_URL}/execute` service with
  the `X-Compiler-Key` header, through a concurrency-limited queue (`p-queue`) so a submission
  storm at exam end can't overwhelm your compiler VPS
- Per-candidate rate limiting on `/run` and `/submit` (keyed by exam token, not IP — several
  candidates can share a NAT'd IP)
- Hidden test cases are never serialized to the candidate: `Question.toCandidateSafeJSON()`
  strips them, and graded results for hidden cases only ever return `passed: true/false`,
  never stdout/stderr/expected output
- **Proctoring**: violation logging (fullscreen exit, tab switch, screen-share stopped, webcam
  lost) with automatic grading + submission once an exam's configured violation threshold is
  hit — reusing the exact same grading path as the "Submit exam" button (`finalizeSubmission`)
  so results can't diverge between the two. Webcam/screen recordings upload as segmented
  `.webm` files to `src/uploads/recordings/<candidateId>/`, tracked in a `Recording` collection,
  downloadable by admins.
- **Bulk import**: CSV/XLSX upload → row-level validated preview (nothing saved yet, every
  row reports its own errors: missing columns, bad type, mismatched test case counts, in-file
  and existing-DB duplicate titles) → confirm commits only the rows the client sends back.
  See `sample-data/questions-import-template.csv` for the column contract.
- **Reports**: per-candidate score/percentage/time-spent/violation-count, exportable as
  `.xlsx` (via SheetJS) or `.pdf` (via PDFKit) — both built from the same `buildReportRows()`
  so the two formats can't disagree with each other.

## Bulk import API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/questions/bulk-import/preview` | Multipart `file` (.csv/.xlsx/.xls) → `{ rows: [{row, data, errors}], summary }`. Nothing persisted. |
| POST | `/api/questions/bulk-import/confirm` | `{ questions: [<data from preview rows with no errors>] }` → creates them, returns created IDs + any that still failed validation at the DB layer. |

Column contract (see `sample-data/questions-import-template.csv`): `type, title, statement,
constraints, marks, negativeMarks, difficulty, tags, options, correctOptions, expectedAnswer,
testCaseInputs, testCaseOutputs, testCaseHidden, allowedLanguages, languageVersion,
timeLimitMs, memoryLimitKb`. Multi-value cells are pipe-separated (`options: Paris|London|Berlin`,
`correctOptions: 1` as a 1-based index, `2` and `2|4` for multi-select). **Quote any cell that
itself contains a comma** (standard CSV quoting) — an unquoted comma inside e.g. `constraints`
will shift every column after it.

## Reports API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/exams/:id/report` | JSON rows for the admin progress table (Redis-cached a few seconds if `REDIS_URL` is set). |
| GET | `/api/exams/:id/report/questions` | Per-question pass-rate/attempts/avg-marks breakdown across all candidates. |
| GET | `/api/exams/:id/report/xlsx` | Download as Excel. |
| GET | `/api/exams/:id/report/pdf` | Download as PDF. |

## Manual grading API (subjective / file-upload answers)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/exams/:id/candidates/:candidateId/submission` | Full submission with question text/model-answer for grading. |
| POST | `/api/exams/:id/candidates/:candidateId/submission/grade` | `{ questionId, marksAwarded, feedback }` — clamps to the question's max marks, recomputes the submission total. |
| GET | `/api/exams/:id/candidates/:candidateId/submission/answers/:questionId/download` | Download a candidate's uploaded file answer. |

## Question bank export/import API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/questions/export?format=xlsx\|csv&ids=...` | Export the question bank (or a selected subset) — same column shape as bulk import, so it re-imports unchanged. |
| POST | `/api/questions/bulk-import/preview` | Multipart `file` (.csv/.xlsx/.xls/.json) → validated row-level preview. |
| POST | `/api/questions/bulk-import/confirm` | Commits the valid rows. |

JSON import accepts either an array of flat rows (same shape as CSV columns) or
`{ "questions": [...] }`, and lets `options`/`testCases` be real arrays/objects instead
of pipe-separated strings.

## Real-time & caching

- **Socket.IO** (`/admin` namespace, JWT-authed): the admin dashboard joins
  `exam:<id>` rooms and receives `candidate-update` events (`status`, `progress`,
  `violation`, `submitted`, `graded`) as they happen — no polling needed.
- **Redis** (optional — set `REDIS_URL`): caches report/question-analysis reads for
  `REPORT_CACHE_TTL_SECONDS` (default 15s), invalidated automatically on any
  submission/violation/grading change. Without Redis configured, the app just always
  computes fresh — nothing breaks.

## Proctoring API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/exam/:token/violations` | Candidate-facing. Log a violation `{ type, meta }`. Auto-submits at threshold. |
| POST | `/api/exam/:token/recordings` | Candidate-facing. Multipart upload of one recording segment `{ type, startedAt, endedAt, file }`. |
| GET  | `/api/exams/:examId/candidates/:candidateId/recordings` | Admin. List a candidate's recording segments. |
| GET  | `/api/recordings/:id/download` | Admin. Stream/download one recording file. |

Violation `type` must be one of: `fullscreen_exit`, `tab_hidden`, `screen_share_stopped`,
`webcam_denied`, `copy_paste`, `devtools`. Recording `type` must be `webcam`, `screen`, or `audio`.
Threshold and which signals are required come from `exam.proctoring` (`webcam`, `screenShare`,
`fullscreenRequired`, `maxViolations`), set when you create/update the exam.

## Setup

```bash
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, COMPILER_BASE_URL, COMPILER_API_KEY

npm install
npm run seed:admin -- "Your Name" you@example.com "StrongPassword123!"
npm run dev
```

Server starts on `http://localhost:5000`. Health check: `GET /api/health`.

## API reference

### Admin (requires `Authorization: Bearer <token>` from `/api/auth/login`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an admin account |
| POST | `/api/auth/login` | Get a JWT |
| GET  | `/api/auth/me` | Current admin profile |
| POST | `/api/questions` | Create a question |
| GET  | `/api/questions` | List/search questions (`?type=&tag=&difficulty=&search=`) |
| GET/PUT/DELETE | `/api/questions/:id` | Read/update/delete a question |
| POST | `/api/exams` | Create an exam |
| GET  | `/api/exams` | List your exams |
| GET/PUT | `/api/exams/:id` | Read/update an exam |
| POST | `/api/exams/:id/questions` | Attach questions `{ questionIds: [...] }` |
| POST | `/api/exams/:id/candidates` | Invite candidates `{ candidates: [{name,email}] }` → returns tokenized links |
| GET  | `/api/exams/:id/candidates` | Candidate progress overview |

### Candidate (no login — the URL token IS the credential)

| Method | Path | Purpose |
|---|---|---|
| GET  | `/api/exam/:token` | Fetch exam + candidate-safe questions |
| POST | `/api/exam/:token/run` | Run code against visible test cases (not scored) |
| POST | `/api/exam/:token/answers` | Autosave one answer |
| POST | `/api/exam/:token/submit` | Finalize — grades everything, locks submission |

## Example: creating a coding question

```bash
curl -X POST http://localhost:5000/api/questions \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "type": "coding",
    "title": "Sum of Two Numbers",
    "statement": "Read two integers from stdin and print their sum.",
    "marks": 10,
    "allowedLanguages": ["python", "javascript"],
    "starterCode": [
      { "language": "python", "version": "3.12.0", "code": "a, b = map(int, input().split())\nprint(a + b)" },
      { "language": "javascript", "version": "18.15.0", "code": "// read stdin, print sum" }
    ],
    "testCases": [
      { "input": "2 3", "expectedOutput": "5", "isHidden": false, "points": 1 },
      { "input": "10 -4", "expectedOutput": "6", "isHidden": true, "points": 1 },
      { "input": "0 0", "expectedOutput": "0", "isHidden": true, "points": 1 }
    ]
  }'
```

## What's intentionally NOT in this slice

Proctoring (webcam/screen recording, violation detection), bulk CSV/Excel import,
PDF/Excel reporting, and the frontend. These build cleanly on top of this backend as
separate slices — happy to build the next one when you're ready.

## Known trade-offs to revisit before production

- No queue/worker (e.g. BullMQ) yet for the actual submit grading loop — for large
  exams with many test cases per candidate, move `submitExam`'s grading loop to a
  background job so the HTTP request doesn't block on N sequential compiler calls.
- Recordings and file-upload answers are stored on local disk under `src/uploads/`.
  Fine for a single VPS deployment; move to S3/object storage (swap `multer.diskStorage`
  for `multer-s3`) before scaling past one server or wanting durability independent of
  the app server's disk.
- Recording segments rotate every 60s client-side (see frontend `useProctoring.js`), so a
  segment is lost only if the tab crashes mid-segment, not the whole session — but there's no
  server-side alert yet if a candidate's recordings stop arriving mid-exam.
- Custom checker scripts run in the same language/version as the candidate's own
  submission (see `judgeService.runCustomChecker`) — there's no separate
  "checker language" field on `Question`. A checker that errors or times out is
  treated as FAIL, never as a silent pass.
- Redis (`REDIS_URL`) and Socket.IO only cache/push report data for a single Node
  process. Horizontal scaling would need the `@socket.io/redis-adapter` package
  wired onto the same Redis client in `config/redis.js`.
