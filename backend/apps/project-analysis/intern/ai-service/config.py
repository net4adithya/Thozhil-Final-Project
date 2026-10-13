"""
config.py – Runtime configuration for Module 3: AI Reviewer Engine.

All settings are loaded from environment variables (or a .env file in
development). pydantic-settings provides free type coercion and validation so
that a missing or malformed variable is caught at startup rather than at
runtime.

Never hardcode secrets or configuration values here.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration object.

    Every attribute is read from the matching environment variable.
    Pydantic-settings handles type coercion, required-field enforcement, and
    .env file loading automatically.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------
    # AI Provider
    # ------------------------------------------------------------------

    # Which provider to use. Supported values: "gemini"
    # Future values: "openai", "claude", "ollama", "azure_openai"
    # Changing this value (and supplying the matching API key) is the only
    # step required to switch LLM providers.
    AI_PROVIDER: str = "gemini"

    GOOGLE_API_KEY: str = ""
    AI_MODEL_NAME: str = "gemini-2.0-flash"

    # Temperature closer to 0 → more deterministic, consistent JSON output.
    AI_TEMPERATURE: float = 0.2

    # Hard cap on response length to prevent runaway / expensive outputs.
    MAX_OUTPUT_TOKENS: int = 4096

    # Maximum seconds to wait for the AI provider before returning 504.
    # Prevents hung AI calls from exhausting the FastAPI worker pool.
    AI_REQUEST_TIMEOUT_SECONDS: int = 60

    # ------------------------------------------------------------------
    # Application
    # ------------------------------------------------------------------
    APP_TITLE: str = "AI Reviewer Engine"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = (
        "Module 3 – Evaluates intern project submissions using AI and returns structured feedback."
    )
    DEBUG: bool = False

    # Comma-separated list of allowed CORS origins.
    # Restrict to specific domains in production (e.g. "http://localhost:3000", "http://localhost:5173").
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Maximum accepted request body size in bytes.
    # 512KB is generous for 10 text files; prevents memory exhaustion attacks.
    MAX_REQUEST_SIZE_BYTES: int = 524_288  # 512 KB

    # Maximum number of review requests allowed per minute per client IP.
    # Prevents cost-amplification DoS attacks against the AI API.
    RATE_LIMIT_PER_MINUTE: int = 10

    # ------------------------------------------------------------------
    # Text-to-Speech
    # ------------------------------------------------------------------

    # Controls where speech synthesis happens.
    # "browser"    – Module 3 returns speech_text; the frontend (Module 2)
    #                speaks it via the Browser Speech API. No server-side
    #                audio is generated. This is the default and recommended
    #                mode for the internship project.
    # "google_tts" – Future: Module 3 calls Google Cloud Text-to-Speech and
    #                returns audio bytes or a signed URL.
    # "elevenlabs" – Future: Module 3 calls ElevenLabs for high-quality audio.
    #
    # Changing this value is the only step needed to switch TTS providers.
    TTS_PROVIDER: str = "browser"


# Singleton instance imported by all other modules.
settings = Settings()
