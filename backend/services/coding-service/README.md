# Coding Service Adapter

## Overview
Exposes a RESTful microservice adapter (`POST /evaluate`, `GET /health`) wrapping the existing AI Coding Interviewer / Assessment Platform application.

## API Contracts
- `GET /health` -> `{"service": "coding-service", "status": "healthy"}`
- `POST /evaluate` -> Standardized evaluation response.

## Environment Variables
- `TARGET_SERVICE_URL`: Base URL of the underlying Assessment Platform API (default `http://localhost:5040`).
