"""
ai_provider.py – AI provider integration for Module 3: AI Reviewer Engine.

Sole responsibility: send a prompt to the configured AI provider and return
the raw text response.

All provider-specific SDK usage, authentication, and error handling is
isolated here. No prompt building or parsing is performed in this file.

Design principles:
  - BaseAIProvider defines the interface that every provider must implement.
    Switching providers (Gemini → OpenAI → Claude etc.) means adding a new
    concrete class here and updating AI_PROVIDER in .env — no other file
    changes required.
  - Domain exceptions (AIProviderError / AIProviderUnavailableError) are
    raised instead of HTTPException. HTTP concerns belong only in routes.py.
  - The Gemini client is a module-level singleton so authentication and HTTP
    session setup happen once at startup, not on every request.
  - The blocking SDK call is offloaded to a thread pool via asyncio.to_thread
    so the FastAPI event loop is never blocked.
"""

import asyncio
import logging
import time
from abc import ABC, abstractmethod

from config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Domain Exceptions
# ---------------------------------------------------------------------------

class AIProviderError(Exception):
    """Base class for all AI provider errors.

    Raised when the provider returns an unexpected or unusable response.
    routes.py catches this and converts it to HTTP 500.
    """


class AIProviderUnavailableError(AIProviderError):
    """Raised when the AI provider cannot be reached or is misconfigured.

    routes.py catches this and converts it to HTTP 503.
    """


# ---------------------------------------------------------------------------
# Provider Interface
# ---------------------------------------------------------------------------

class BaseAIProvider(ABC):
    """Protocol that every AI provider implementation must satisfy.

    Adding a new provider (e.g. OpenAIProvider) means subclassing this and
    implementing `generate`. No other files need to change.
    """

    @abstractmethod
    def generate(self, prompt: str) -> str:
        """Send *prompt* to the LLM and return the raw response text.

        This method is intentionally synchronous so it can be run in a thread
        pool by the async wrapper. Async SDKs should use asyncio.run() inside
        their implementation or be wrapped separately.

        Args:
            prompt: The fully-formed prompt produced by prompt_builder.

        Returns:
            Raw text string from the LLM.

        Raises:
            AIProviderUnavailableError: If the provider is unreachable or
                not configured.
            AIProviderError: For any other provider-side failure.
        """


# ---------------------------------------------------------------------------
# Gemini Provider
# ---------------------------------------------------------------------------

def _build_gemini_client():
    """Lazily import and instantiate the Gemini client.

    Deferred import keeps startup fast when Gemini is not the active provider
    and avoids polluting the module namespace with provider-specific symbols.

    Returns None if the google-genai package is not installed or the API key
    is missing — the provider's generate() method will raise on first call.
    """
    if not settings.GOOGLE_API_KEY:
        logger.warning(
            "GOOGLE_API_KEY is not set. GeminiProvider will raise on first call."
        )
        return None

    try:
        from google import genai  # noqa: PLC0415
        client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        logger.debug("Gemini client initialised (model: %s).", settings.AI_MODEL_NAME)
        return client
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to initialise Gemini client: %s", exc)
        return None


# Module-level singleton: created once at import time, shared across all requests.
_gemini_client = _build_gemini_client()

# Retry configuration for transient AI provider errors.
# 3 attempts with 1s → 2s → 4s exponential backoff.
_MAX_RETRIES: int = 3
_RETRY_BASE_DELAY_SECONDS: float = 1.0


class GeminiProvider(BaseAIProvider):
    """Concrete AI provider backed by Google Gemini (google-genai SDK)."""

    def generate(self, prompt: str) -> str:
        """Send *prompt* to Gemini and return the raw text response.

        Retries up to _MAX_RETRIES times on transient failures using
        exponential backoff. Configuration/auth errors are not retried.

        Raises:
            AIProviderUnavailableError: If the client is not initialised or
                the API key is missing.
        """
    def generate_single(self, prompt: str) -> str:
        if _gemini_client is None:
            raise AIProviderUnavailableError(
                "Gemini client is not initialized. Check GOOGLE_API_KEY."
            )

        from google.genai import types  # noqa: PLC0415

        generation_config = types.GenerateContentConfig(
            temperature=settings.AI_TEMPERATURE,
            max_output_tokens=settings.MAX_OUTPUT_TOKENS,
        )

        response = _gemini_client.models.generate_content(
            model=settings.AI_MODEL_NAME,
            contents=prompt,
            config=generation_config,
        )

        raw_text: str = response.text
        logger.debug("Gemini returned %d characters.", len(raw_text))
        return raw_text

    def generate(self, prompt: str) -> str:
        """Single-thread fallback implementation of generate."""
        last_exc: Exception | None = None
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                return self.generate_single(prompt)
            except AIProviderUnavailableError:
                raise
            except Exception as exc:
                last_exc = exc
                if attempt < _MAX_RETRIES:
                    delay = _RETRY_BASE_DELAY_SECONDS * (2 ** (attempt - 1))
                    time.sleep(delay)
        raise AIProviderError(
            f"Gemini request failed after {_MAX_RETRIES} attempts."
        ) from last_exc


# ---------------------------------------------------------------------------
# Provider Registry
# ---------------------------------------------------------------------------

_PROVIDER_REGISTRY: dict[str, type[BaseAIProvider]] = {
    "gemini": GeminiProvider,
    # Future providers are registered here:
    # "openai":      OpenAIProvider,
    # "claude":      ClaudeProvider,
    # "ollama":      OllamaProvider,
    # "azure_openai": AzureOpenAIProvider,
}


# Provider instance singleton — created once, reused on every request.
# Avoids unnecessary object construction overhead per call.
_provider_singleton: BaseAIProvider | None = None


def _get_provider() -> BaseAIProvider:
    """Return the configured provider instance, creating it once on first call.

    Reads AI_PROVIDER from settings and looks it up in the registry.
    Unknown provider names raise a clear error rather than silently
    falling back to an unexpected default.

    Raises:
        AIProviderUnavailableError: If the configured provider is not registered.
    """
    global _provider_singleton
    if _provider_singleton is not None:
        return _provider_singleton

    provider_key = settings.AI_PROVIDER.lower().strip()
    provider_class = _PROVIDER_REGISTRY.get(provider_key)

    if provider_class is None:
        supported = ", ".join(sorted(_PROVIDER_REGISTRY.keys()))
        raise AIProviderUnavailableError(
            f"Unknown AI provider: '{provider_key}'. "
            f"Supported providers: {supported}. "
            f"Check the AI_PROVIDER setting in your .env file."
        )

    _provider_singleton = provider_class()
    return _provider_singleton


# ---------------------------------------------------------------------------
# Public Interface
# ---------------------------------------------------------------------------

async def call_ai(prompt: str) -> str:
    """Send *prompt* to the active AI provider and return raw response text.

    Selects the provider configured via AI_PROVIDER in settings, then runs the
    blocking SDK call in a thread pool executor. Non-blocking asyncio.sleep is
    used between retries to avoid starving thread pool workers.

    Args:
        prompt: The fully-formed prompt produced by prompt_builder.

    Returns:
        Raw text string from the AI model.

    Raises:
        AIProviderUnavailableError: If the provider is unreachable or not configured.
        AIProviderError: For any other provider-side failure.
    """
    provider = _get_provider()
    if isinstance(provider, GeminiProvider):
        last_exc: Exception | None = None
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                return await asyncio.to_thread(provider.generate_single, prompt)
            except AIProviderUnavailableError:
                raise
            except Exception as exc:
                last_exc = exc
                if attempt < _MAX_RETRIES:
                    delay = _RETRY_BASE_DELAY_SECONDS * (2 ** (attempt - 1))
                    logger.warning(
                        "Gemini attempt %d/%d failed: %s. Retrying in %.1fs (async).",
                        attempt, _MAX_RETRIES, exc, delay,
                    )
                    await asyncio.sleep(delay)
        logger.error("Gemini failed after %d attempts. Last error: %s", _MAX_RETRIES, last_exc)
        raise AIProviderError(f"Gemini request failed after {_MAX_RETRIES} attempts.") from last_exc

    return await asyncio.to_thread(provider.generate, prompt)
