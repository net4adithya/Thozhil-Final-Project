# python_backend/main.py

"""Entry point for the FastAPI backend.

This skeleton mirrors the NestJS application structure, exposing similar routes
and reading configuration from the same `.env` file. It uses SQLAlchemy for the
ORM and Pydantic models for request validation.
"""

import sys
import os
import uvicorn
from fastapi import FastAPI

# Add root directory to sys.path so modules like static_analysis, ai_review, and authority_review can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.routers import auth, users, roles, authorities, interns, assignments, dashboard, audit, submissions, resume_screener, interview_screener, project_screener
from app.editor import router as editor_router
from app.execution import router as execution_router
from app.sandbox import router as sandbox_router
from static_analysis.api.router import router as static_analysis_router
from authority_review.api.router import router as authority_review_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI Coding Review Platform API",
    description="Backend API for AI Coding Review Platform",
    version="1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers – each router mirrors a NestJS / FastAPI module.
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(roles.router, prefix="/roles", tags=["roles"])
app.include_router(authorities.router, prefix="/authorities", tags=["authorities"])
app.include_router(interns.router, prefix="/interns", tags=["interns"])
app.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(audit.router, prefix="/audit-logs", tags=["audit"])
app.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
app.include_router(resume_screener.router, prefix="/api/v1/resume", tags=["resume"])
app.include_router(interview_screener.router, prefix="/api/v1/interview", tags=["interview"])
app.include_router(project_screener.router, prefix="/api/v1/project", tags=["project"])
app.include_router(editor_router, prefix="/api/v1/editor", tags=["editor"])
app.include_router(execution_router, prefix="/api/v1/execution", tags=["execution"])
app.include_router(sandbox_router, prefix="/api/v1/sandbox", tags=["sandbox"])
app.include_router(static_analysis_router, prefix="/static-analysis", tags=["static-analysis"])
app.include_router(authority_review_router, prefix="/authority-review", tags=["authority-review"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to AI Coding Review Platform API",
        "docs": "/api/docs",
        "health": "/health"
    }

# Root health endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
