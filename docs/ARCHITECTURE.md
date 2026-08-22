# InterviewX AI — System Architecture & Data Flow

## 1. Modular Overview
```
InterviewX AI
├── frontend/     Client Single-Page Application (React 19, TailwindCSS, WebRTC/MediaStream, WebSockets)
├── server/       Backend API Server & Real-time Live Gateway (Express, WebSocket Gateway, Sarvam AI Provider)
│   └── tests/    Modular test suites for all sprints and E2E flows
├── database/     PostgreSQL Database Migrations & Schemas
└── docs/         Architecture specifications and API contracts
```

---

## 2. Real-Time Adaptive Live Interview Architecture
```
Candidate Browser (Client)               Express WebSocket Gateway (/ws/live)              Sarvam AI Engine
        │                                             │                                         │
        │── session:init ────────────────────────────►│ (Create/Restore LiveSession)             │
        │◄── session:initialized ─────────────────────│                                         │
        │── session:ready ───────────────────────────►│ (State -> INTRODUCTION)                 │
        │◄── ai:speaking (Intro Audio) ───────────────│                                         │
        │                                             │                                         │
        │── interviewer:finished_speaking ───────────►│ (State -> AI_SPEAKING: Ask Question 1)  │
        │◄── ai:speaking (Question Audio) ────────────│                                         │
        │── interviewer:finished_speaking ───────────►│ (State -> LISTENING)                    │
        │                                             │                                         │
        │── candidate:submit_answer ─────────────────►│ (State -> AI_THINKING)                  │
        │   (transcript / audio stream)               │── Transcribe & Evaluate ───────────────►│
        │                                             │◄── Decision (FOLLOW_UP, CLARIFY, etc.)──│
        │◄── ai:response (Adaptive Decision) ─────────│── Synthesize Speech ───────────────────►│
        │◄── ai:speaking (Follow-up Audio) ───────────│◄── Audio Payload (Base64 WAV) ──────────│
```

---

## 3. Asynchronous Interview Architecture
```
Candidate Browser (Async)                 Backend REST API (/api)                        Supabase Storage
        │                                            │                                          │
        │── Upload Video Answer ────────────────────►│── Upload to 'interview-recordings' ─────►│
        │                                            │◄── Return Public Video URL ──────────────│
        │── Log Proctoring Events (Tab/Fullscreen) ──►│── Persist in interview.settings JSONB ──│
        │── POST /api/interviews/:id/evaluate ───────►│── AI Centralized Evaluation Engine ─────│
        │◄── Finalized Recruiter Report ─────────────│── Idempotent Upsert to 'reports' table ──│
```
