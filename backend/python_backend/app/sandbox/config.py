# python_backend/app/sandbox/config.py
"""
Sandbox configuration — all limits and image names read from environment
variables so nothing is hardcoded or requires modification of source code.
"""

from pydantic_settings import BaseSettings
from pydantic import ConfigDict
import os


class SandboxSettings(BaseSettings):
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    SANDBOX_QUEUE_NAME: str = "sandbox:jobs"
    SANDBOX_RESULT_TTL: int = 300  # seconds result kept in Redis

    # Execution limits
    SANDBOX_TIMEOUT_SECONDS: int = 10
    SANDBOX_MEMORY_LIMIT: str = "256m"
    SANDBOX_CPU_QUOTA: int = 100_000   # 100% of one CPU
    SANDBOX_CPU_PERIOD: int = 100_000

    # Docker images (server-controlled whitelist — never from user input)
    IMAGE_PYTHON: str = "python:3.12-slim"
    IMAGE_JAVASCRIPT: str = "node:20-slim"
    IMAGE_CPP: str = "gcc:13"
    IMAGE_JAVA: str = "eclipse-temurin:17-jdk-alpine"

    model_config = ConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"),
        env_file_encoding="utf-8",
        extra="allow",
    )


sandbox_settings = SandboxSettings()
