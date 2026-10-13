import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    RESUME_SERVICE_URL: str = os.getenv("RESUME_SERVICE_URL", "http://localhost:8001")
    PROJECT_SERVICE_URL: str = os.getenv("PROJECT_SERVICE_URL", "http://localhost:8002")
    CODING_SERVICE_URL: str = os.getenv("CODING_SERVICE_URL", "http://localhost:8003")
    VIDEO_SERVICE_URL: str = os.getenv("VIDEO_SERVICE_URL", "http://localhost:8004")

    RESUME_MIN_SCORE: float = float(os.getenv("RESUME_MIN_SCORE", "60.0"))
    PROJECT_MIN_SCORE: float = float(os.getenv("PROJECT_MIN_SCORE", "60.0"))
    CODING_MIN_SCORE: float = float(os.getenv("CODING_MIN_SCORE", "60.0"))
    VIDEO_MIN_SCORE: float = float(os.getenv("VIDEO_MIN_SCORE", "60.0"))

    ORCHESTRATOR_PORT: int = int(os.getenv("ORCHESTRATOR_PORT", "8000"))
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "orchestrator.db")

settings = Settings()
