"""
tts.py – Text-to-Speech helper for Module 3: AI Reviewer Engine.

Sole responsibility: own all TTS-related logic and provide a stable interface
for speech generation regardless of where the synthesis actually happens.

Design principles:
  - Mirrors the provider abstraction used in ai_provider.py.
  - The public function generate_speech(speech_text) is the only surface
    exposed. Callers never care whether synthesis happens in the browser,
    via Google Cloud TTS, or ElevenLabs.
  - In the current "browser" mode, Module 3 does not generate audio bytes.
    Instead it returns the speech_text string to Module 4, which passes it
    to Module 2 (frontend). The frontend calls the Browser Speech API.
  - Future cloud TTS providers are added by implementing BaseTTSProvider,
    registering it in _TTS_PROVIDER_REGISTRY, and setting TTS_PROVIDER in .env.
  - No AI calls, no prompt building, and no HTTP concerns belong here.

Usage:
    from tts import generate_speech, is_audio_supported

    if is_audio_supported():
        audio = generate_speech(review.intern_review.speech_text)
        # audio is None in browser mode (frontend handles it)
        # audio is bytes in cloud mode (future)
"""

import logging
from abc import ABC, abstractmethod

from config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Domain Exception
# ---------------------------------------------------------------------------

class TTSError(Exception):
    """Raised when a cloud TTS provider fails to generate audio.

    Not raised in browser mode (synthesis is delegated to the frontend).
    """


# ---------------------------------------------------------------------------
# Provider Interface
# ---------------------------------------------------------------------------

class BaseTTSProvider(ABC):
    """Interface every TTS provider must implement.

    Adding a cloud provider (e.g. Google Cloud TTS, ElevenLabs) means:
      1. Subclassing BaseTTSProvider and implementing synthesize().
      2. Registering the class in _TTS_PROVIDER_REGISTRY.
      3. Setting TTS_PROVIDER=<name> in .env.
    No other files need to change.
    """

    @abstractmethod
    def synthesize(self, speech_text: str) -> bytes | None:
        """Convert *speech_text* to audio.

        Args:
            speech_text: The TTS-optimized text produced by the LLM.

        Returns:
            Audio bytes (e.g. MP3 or WAV) for cloud providers.
            None for browser mode — the frontend handles playback.

        Raises:
            TTSError: If the cloud provider returns an error.
        """


# ---------------------------------------------------------------------------
# Browser Provider (default)
# ---------------------------------------------------------------------------

class BrowserTTSProvider(BaseTTSProvider):
    """No-op provider for browser-based speech synthesis.

    Module 3 returns `speech_text` in the API response.
    Module 2 (frontend) reads it and calls the Browser Speech API:

        const utterance = new SpeechSynthesisUtterance(speech_text);
        window.speechSynthesis.speak(utterance);

    This provider does nothing server-side — synthesis is entirely the
    frontend's responsibility.
    """

    def synthesize(self, speech_text: str) -> None:
        logger.debug(
            "BrowserTTSProvider: synthesis delegated to frontend "
            "(%d chars ready for Browser Speech API).",
            len(speech_text),
        )
        return None


# ---------------------------------------------------------------------------
# Provider Registry
# ---------------------------------------------------------------------------

_TTS_PROVIDER_REGISTRY: dict[str, type[BaseTTSProvider]] = {
    "browser": BrowserTTSProvider,
    # Future providers are registered here:
    # "google_tts":  GoogleCloudTTSProvider,
    # "elevenlabs":  ElevenLabsTTSProvider,
    # "azure_tts":   AzureTTSProvider,
}


# TTS provider singleton — created once on first call, reused across requests.
# Mirrors the _provider_singleton pattern in ai_provider.py.
_tts_provider_singleton: BaseTTSProvider | None = None


def _get_tts_provider() -> BaseTTSProvider:
    """Return the configured TTS provider instance, creating it once on first call.

    Raises:
        TTSError: If the configured provider is not registered.
    """
    global _tts_provider_singleton
    if _tts_provider_singleton is not None:
        return _tts_provider_singleton

    provider_key = settings.TTS_PROVIDER.lower().strip()
    provider_class = _TTS_PROVIDER_REGISTRY.get(provider_key)

    if provider_class is None:
        supported = ", ".join(sorted(_TTS_PROVIDER_REGISTRY.keys()))
        raise TTSError(
            f"Unknown TTS provider: '{provider_key}'. "
            f"Supported providers: {supported}. "
            f"Check the TTS_PROVIDER setting in your .env file."
        )

    _tts_provider_singleton = provider_class()
    return _tts_provider_singleton


# ---------------------------------------------------------------------------
# Public Interface
# ---------------------------------------------------------------------------

def is_audio_supported() -> bool:
    """Return True if TTS is available for this request.

    In browser mode this is always True — speech_text is always generated
    by the LLM and the frontend can always activate the Browser Speech API.

    In future cloud modes, this may return False if the provider API key
    is missing or the provider is temporarily unavailable.
    """
    return True


def generate_speech(speech_text: str) -> bytes | None:
    """Synthesize *speech_text* using the configured TTS provider.

    This is the stable public interface that Module 4 (or future callers)
    should use. Provider details are completely hidden.

    Args:
        speech_text: The TTS-optimized text from InternReview.speech_text.
                     Generated by the LLM in prompt_builder — not the raw
                     feedback field.

    Returns:
        Audio bytes for cloud providers (MP3 or WAV).
        None for browser mode — the frontend performs synthesis.

    Raises:
        TTSError: If a cloud provider fails to synthesize audio.
    """
    if not speech_text or not speech_text.strip():
        logger.warning("generate_speech called with empty speech_text — skipping.")
        return None

    provider = _get_tts_provider()
    logger.debug(
        "TTS synthesis via '%s' (%d chars).",
        settings.TTS_PROVIDER,
        len(speech_text),
    )
    return provider.synthesize(speech_text)
