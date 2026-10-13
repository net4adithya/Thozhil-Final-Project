# Project Service Adapter

## Overview
Exposes a RESTful microservice adapter (`POST /analyze`, `GET /health`) wrapping the existing AI Project Analyser / LogLense application.

## API Contracts
- `GET /health` -> `{"service": "project-service", "status": "healthy"}`
- `POST /analyze` -> Standardized evaluation response.

## Environment Variables
- `TARGET_SERVICE_URL`: Base URL of the underlying Project Analyser API (default `http://localhost:5030`).
