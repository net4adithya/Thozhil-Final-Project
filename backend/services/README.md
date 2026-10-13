# Thozhil Microservices Adapters

This directory contains light-weight microservice adapters wrapping each of the four existing Thozhil applications:

1. `resume-service` (Port 8001) -> Adapter for AI Resume Screener (`:5020`)
2. `project-service` (Port 8002) -> Adapter for AI Project Analyser / LogLense (`:5030`)
3. `coding-service` (Port 8003) -> Adapter for AI Coding Interviewer / Assessment Platform (`:5040`)
4. `video-service` (Port 8004) -> Adapter for AI Video Interviewer (`:5010`)

Each adapter provides normalized JSON request/response formats and `/health` probes while delegating all AI and business logic to the underlying applications.
