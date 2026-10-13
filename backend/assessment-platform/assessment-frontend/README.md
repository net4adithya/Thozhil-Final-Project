# Assessment Platform — Candidate Frontend (Slice 2)

Vue 3 + Vite app for the candidate exam-taking flow. Talks to the Slice 1 backend
(`assessment-backend`) — start that first.

## What's here

- **Token entry** — candidate pastes their one-time exam link/token, no login
- **Exam view** — question navigator, per-type renderers (MCQ/multi-select/true-false,
  subjective/fill-in-blank, coding, file upload), autosave (debounced 800ms per question)
- **Coding editor** — real Monaco editor (syntax highlighting, autocomplete) with language
  switch (only swaps in the starter template if you haven't typed anything), "Run code"
  against visible test cases only, results shown per case without ever exposing the hidden
  test cases or expected output
- **File-upload answers** — candidates attach a file (pdf/doc/xlsx/zip/image/etc., 25MB max)
  which uploads immediately to the backend and is stored per-candidate
- **Timer** — computed from the server's `candidate.startedAt` + `exam.durationMinutes`
  (not from the client clock, so it survives refresh and can't be extended by messing with
  local time), auto-submits when it hits zero and retries submission every 5s if the
  network call fails at that moment
- **Proctoring** — a pre-exam readiness screen requests webcam/screen-share/fullscreen
  permissions (gated behind a real button click, since browsers require a user gesture for
  `getUserMedia`/`getDisplayMedia`). Once running: fullscreen exit, tab switching,
  screen-share stopping, copy/paste/cut, and devtools being opened (via the outer/inner
  window-size heuristic) are all detected and logged as violations, shown to the candidate
  via a banner with a running count against the exam's threshold; hitting the threshold
  triggers the same auto-submit path as the timer expiring. A persistent "Recording"
  indicator sits next to the timer for the whole exam (pulsing dot + which stream(s) —
  Webcam/Screen — are currently active) so the candidate always has an unambiguous,
  in-app signal that they're being recorded, rather than relying only on the browser's
  own native recording icon; it switches to an amber "Recording interrupted" state if a
  required stream is lost mid-exam. Webcam/screen video records in rotating 60-second
  segments uploaded to the backend as it goes.
- **Submitted view** — simple confirmation

## Design

Dark, low-glare "focus room" palette built for sustained attention during a timed test,
not a marketing page. Sora for display/UI headings, Inter for body text, IBM Plex Mono for
code and the timer's tabular numerals. The signature element is the timer chip: a
tabular-number readout with a colored left edge that shifts green → amber → red as time
runs out, with a pulsing dot in the final minute — the one place motion is used
deliberately, because time pressure is the actual subject of the page.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to localhost:5000
```

Point a browser at `http://localhost:5173/exam/<candidate-access-token>` (the token comes
from the backend's `POST /api/exams/:id/candidates` response), or enter it on the landing
page.

## What's intentionally NOT in this slice

Proctoring UI (webcam/screen-share permission prompts, fullscreen enforcement, violation
warnings) and the admin dashboard (exam/question builder, candidate progress, reports).
Both build on top of this same design system as separate slices.

## Known trade-offs to revisit before production

- Autosave failures are currently silent (by design, so typing is never blocked) — worth
  adding a small "not saved" indicator so candidates get some signal if their connection drops.
- Segment rotation stops and restarts `MediaRecorder` every 60s, which causes a sub-second
  gap between segments. Fine for review purposes; if gapless recording matters, look at
  `MediaRecorder`'s `timeslice` option with continuous chunk upload instead of stop/restart.
- Devtools-open detection uses the outer/inner window-size heuristic — reliable for a
  docked panel, but a detached devtools window on a second monitor won't trigger it. The
  keydown/context-menu blocking is a deterrent only, never the actual detection mechanism.
