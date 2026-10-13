# Assessment Platform — Admin Dashboard (Slice 3)

Vue 3 + Vite admin app: question bank (CRUD + bulk import), exam builder, candidate
invites, live progress/violations, and report export. Talks to the Slice 1/2 backend
(`assessment-backend`) — start that first and create an admin account:

```bash
cd assessment-backend
npm run seed:admin -- "Your Name" you@example.com "StrongPassword123!"
npm run dev
```

## Setup

```bash
npm install
npm run dev   # http://localhost:5173... wait, candidate app also uses 5173 — see note below
```

**Port note:** the candidate frontend (`assessment-frontend`) and this admin app share the
same default Vite port (5173). Running both at once: either run this one with
`npm run dev -- --port 5174`, or edit `vite.config.js`'s `server.port`.

## Pages

| Route | Purpose |
|---|---|
| `/login` | Admin sign-in (JWT, stored in `sessionStorage`) |
| `/` | Exam list, create new exam |
| `/exams/new`, `/exams/:id` | Exam builder: details, proctoring config, attach questions from the bank, invite candidates (paste `Name, email` lines → get back tokenized links) |
| `/exams/:id/candidates` | Live progress table (Socket.IO push, no refresh needed) — status, score, violation count, expandable recordings list, per-candidate manual grading dialog for subjective/file-upload answers, a "Question analysis" tab with per-question pass rates, and Excel/PDF report download |
| `/questions` | Question bank — search/filter, select-and-export (CSV/XLSX), delete |
| `/questions/new`, `/questions/:id` | Question editor covering all 7 types (MCQ, multi-select, true/false, fill-in-blank, subjective, coding with test cases + starter code per language + optional custom checker script, file upload) |
| `/questions/import` | Bulk CSV/XLSX/JSON import: upload → row-level validated preview (errors shown per row, nothing saved yet) → confirm to commit only the valid rows |

## Design

Built with **Vuetify 3** (Material Design components) themed to the same dark "focus
room" palette as the candidate frontend, so the two apps read as one product while the
admin app keeps a conventional sidebar-plus-content dashboard layout — the audience and
task shape (scanning tables, filling forms) is completely different from the candidate's
single-task timed exam view, so it earns its own layout rather than reusing ExamView's
structure.

## Report downloads (Excel/PDF)

These hit authenticated backend routes (`/api/exams/:id/report/xlsx` and `/pdf`) that
require the admin's Bearer token — a plain `<a href>` can't attach that header, so
`examsApi.downloadReportXlsx/Pdf` fetches the file as a blob through the authenticated
axios client and triggers the browser's save dialog from the resulting object URL.
Same pattern for recording downloads.

## What's intentionally NOT in this slice

- No role/permission management UI (single `admin`/`superadmin` role exists on the backend,
  but there's no screen to invite other admins — use `npm run seed:admin` or `POST /api/auth/register`)

## Known trade-offs to revisit before production

- Question bank list search debounces client-side but re-fetches the full filtered list on
  every change rather than paginating with infinite scroll — fine at hundreds of questions,
  worth revisiting at thousands.
- The candidate invite box is a plain textarea (`Name, email` per line) rather than a CSV
  upload — for large candidate lists, wiring the same bulk-import pattern used for questions
  (preview + confirm) onto `/api/exams/:id/candidates` would scale much better.
- `sessionStorage` for the admin JWT means logging in again is required per browser tab/session
  — deliberate (safer default for a proctoring admin tool on a shared machine), but worth an
  explicit "remember me" opt-in with `localStorage` if that's too aggressive for your team.
- Live updates (Socket.IO) run against a single backend process; scaling the API
  horizontally would need the `@socket.io/redis-adapter` wired onto the existing Redis
  client so events fan out across instances.
