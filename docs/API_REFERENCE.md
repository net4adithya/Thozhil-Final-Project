# InterviewX AI — API & WebSocket Event Reference

## 1. REST API Endpoints

### Candidates (`/api/candidates`)
- `GET /api/candidates` — List all candidates
- `GET /api/candidates/:id` — Retrieve candidate profile
- `POST /api/candidates` — Create candidate profile
- `PUT /api/candidates/:id` — Update candidate profile
- `DELETE /api/candidates/:id` — Remove candidate profile

### Interviews (`/api/interviews`)
- `GET /api/interviews` — List all scheduled & active interviews
- `GET /api/interviews/:id` — Retrieve interview details & settings
- `POST /api/interviews` — Create new interview assessment track
- `PUT /api/interviews/:id` — Update interview settings
- `DELETE /api/interviews/:id` — Delete interview
- `POST /api/interviews/:id/recordings` — Upload interview recording video/audio
- `GET /api/interviews/:id/recordings` — List recordings for interview
- `POST /api/interviews/:id/proctoring-events` — Log candidate proctoring events
- `GET /api/interviews/:id/proctoring-events` — Retrieve proctoring observation summary
- `POST /api/interviews/:id/evaluate` — Trigger AI evaluation and report upsert

### Reports & Analytics (`/api/reports`)
- `GET /api/reports` — List all reports
- `GET /api/reports/interview/:id` — Retrieve assessment report for specific interview
- `GET /api/reports/analytics` — Recruiter dashboard KPI metrics & score distribution

### Voice Engine (`/api/voice`)
- `POST /api/voice/tts` — Sarvam Speech Synthesis
- `POST /api/voice/stt` — Sarvam Speech-to-Text Transcription

---

## 2. Real-Time WebSocket Gateway (`/ws/live`)

### Client -> Server Events
- `session:init` — Initialize or attach to live interview session (`{ interviewId, candidateId }`)
- `session:ready` — Candidate media & audio stream ready, triggers AI introduction
- `session:reconnect` — Reconnect to active session without loss of turn state
- `interviewer:finished_speaking` — Browser finished playing AI TTS audio phrase
- `candidate:submit_answer` — Candidate answered question (`{ questionId, transcript, duration }`)
- `candidate:speech_stream` — Live candidate audio chunks
- `proctoring:event` — Real-time proctoring observations (`TAB_HIDDEN`, `FULLSCREEN_EXITED`, etc.)

### Server -> Client Events
- `connection:ack` — Connection established
- `session:initialized` — Session state machine initialized (`{ sessionId, status, currentQuestion }`)
- `ai:speaking` — AI audio phrase ready to play (`{ phraseType, text, audioBase64 }`)
- `candidate:turn` — Candidate speaking turn activated
- `ai:response` — Adaptive AI decision payload (`{ action, question, reason, topic, difficulty }`)
- `proctoring:ack` — Proctoring event recorded
- `session:completed` — Interview completed, report generated
