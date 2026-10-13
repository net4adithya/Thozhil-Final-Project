# Video Service Adapter

## Overview
Exposes a RESTful microservice adapter (`POST /evaluate`, `GET /health`) wrapping the existing AI Video Interviewer application.

## API Contracts
- `GET /health` -> `{"service": "video-service", "status": "healthy"}`
- `POST /evaluate` -> Standardized evaluation response.

## Environment Variables
- `TARGET_SERVICE_URL`: Base URL of the underlying AI Video Interviewer API (default `http://localhost:5010`).
