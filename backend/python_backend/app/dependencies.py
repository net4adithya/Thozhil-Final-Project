# python_backend/app/dependencies.py
"""Common FastAPI dependencies (e.g. database session, authentication)."""

from fastapi import Depends, HTTPException, status
from pydantic import BaseModel

class UserContext(BaseModel):
    id: int = 1
    email: str = "user@example.com"
    role: str = "INTERN"

async def get_current_user() -> UserContext:
    """Mock dependency returning current authenticated user context."""
    return UserContext(id=1, email="user@example.com", role="INTERN")
