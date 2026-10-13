# Resume Service Adapter

## Overview
Exposes a RESTful microservice adapter (`POST /screen`, `GET /health`) wrapping the existing AI Resume Screener application logic.

## API Contracts
- `GET /health` -> `{"service": "resume-service", "status": "healthy"}`
- `POST /screen` -> Standardized evaluation response.

## Environment Variables
- `TARGET_SERVICE_URL`: Base URL of the underlying Resume Screener API (default `http://localhost:5020`).
