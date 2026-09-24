# InterviewX AI — UI/UX Backend & Data Pipeline Audit

This document records any backend API, database, or data-pipeline issues discovered during the Master UI/UX transformation.

---

## 1. Executive Summary

- **Total Backend Pipelines Verified**: 7/7
- **Database (Supabase)**: All tables (`candidates`, `interviews`, `questions`, `answers`, `reports`, `proctoring_observations`) are functioning with real schema types and foreign keys.
- **AI Integrations (Sarvam AI)**: Live STT, TTS (voice: `kavya`), and Conversational Reasoning are 100% active with real API keys and no mock fallbacks.
- **WebSocket Gateway**: Real-time live room state machine is running cleanly at `/ws/live`.
- **Recording & Storage**: Media recording combines video and audio tracks and uploads to the Supabase `interview-recordings` bucket.

---

## 2. Pipeline Verification Summary

| Pipeline Component | Status | Real Data Source | Frontend Consumption |
|--------------------|--------|------------------|----------------------|
| **Recruiter Dashboard** | Operational | Supabase Analytics / KPIs | `RecruiterDashboard.jsx` |
| **Assessments / Jobs** | Operational | Supabase `interviews` & `questions` | `InterviewList.jsx`, `InterviewDetails.jsx` |
| **Candidate Directory** | Operational | Supabase `candidates` | `CandidateList.jsx` |
| **Resume Extraction & Question Generation** | Operational | Sarvam AI LLM + `resumes` bucket | `CreateInterview.jsx` |
| **Candidate Device Diagnostic** | Operational | WebRTC Hardware APIs | `CandidateDeviceCheck.jsx` |
| **Live AI Interview Room** | Operational | WebSocket `/ws/live` + Sarvam AI | `LiveInterview.jsx` |
| **Candidate Scorecard & Report** | Operational | Supabase `reports` + Sarvam Evaluation | `Report.jsx`, `CandidateCompleted.jsx` |
| **Recruiter Analytics** | Operational | Real Database Telemetry | `Analytics.jsx` |

---

## 3. Discovered Pipeline Notes & Resolutions

1. **Issue**: WebRTC Camera Locking on Multiple Requests
   - **Root Cause**: Two separate components independently requested `getUserMedia` on Windows, causing the recording hook to fall back to audio-only.
   - **Resolution**: Stream sharing implemented via `onStreamReady` and `sharedCameraStreamRef`. Single combined video + audio stream now feeds both the live preview and the `MediaRecorder`.

2. **Issue**: Evaluation Fallback for Non-Answers
   - **Root Cause**: Responses like *"i dot no the answer"* or *"I don't know"* were receiving fallback scores due to basic string length rules.
   - **Resolution**: Added strict non-answer detection in `answerEvaluationService.js`, assigning calibrated 0–5% scores and explicit *"Candidate stated they do not know"* feedback.
