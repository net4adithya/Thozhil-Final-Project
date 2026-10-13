# Thozhil Orchestrator

## Overview
FastAPI orchestrator service for managing recruitment pipeline workflows across four microservice adapters (Resume, Project, Coding, Video).

## Endpoints
- `GET /health`: Health probe and service configuration
- `POST /candidates`: Register a candidate
- `GET /candidates/{id}`: Fetch candidate record
- `GET /candidates/{id}/state`: Fetch current pipeline state
- `POST /candidates/{id}/pipeline/start`: Execute pipeline across stages
- `POST /candidates/{id}/pipeline/resume`: Resume or retry pipeline execution
- `GET /candidates/{id}/report`: Aggregate candidate evaluation report

## State Machine
- `CREATED` -> `RESUME_SUBMITTED` -> (`RESUME_PASSED` / `RESUME_REJECTED`) -> (`PROJECT_ANALYZED` / `PROJECT_REJECTED` / `PROJECT_PASSED`) -> (`CODING_COMPLETED` / `CODING_REJECTED` / `CODING_PASSED`) -> (`VIDEO_COMPLETED` / `VIDEO_REJECTED` / `VIDEO_PASSED`) -> `EVALUATION_REPORT` / `FAILED`.

## Environment Variables
- `RESUME_SERVICE_URL`: Service URL for resume adapter (default `http://localhost:8001`)
- `PROJECT_SERVICE_URL`: Service URL for project adapter (default `http://localhost:8002`)
- `CODING_SERVICE_URL`: Service URL for coding adapter (default `http://localhost:8003`)
- `VIDEO_SERVICE_URL`: Service URL for video adapter (default `http://localhost:8004`)
- `RESUME_MIN_SCORE`: Minimum gating score for resume stage (default `60.0`)
- `PROJECT_MIN_SCORE`: Minimum gating score for project stage (default `60.0`)
- `CODING_MIN_SCORE`: Minimum gating score for coding stage (default `60.0`)
- `VIDEO_MIN_SCORE`: Minimum gating score for video stage (default `60.0`)
- `ORCHESTRATOR_PORT`: Service port (default `8000`)
