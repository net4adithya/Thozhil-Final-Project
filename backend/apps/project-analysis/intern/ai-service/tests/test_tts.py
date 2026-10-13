"""
test_tts.py – Unit tests for tts.py.

Tests cover:
  - is_audio_supported
  - generate_speech (browser mode, empty/whitespace input)
  - BrowserTTSProvider.synthesize
  - _get_tts_provider registry lookup
  - TTSError on unknown provider
"""

import pytest
from unittest.mock import patch

from tts import (
    BrowserTTSProvider,
    TTSError,
    _get_tts_provider,
    _TTS_PROVIDER_REGISTRY,
    generate_speech,
    is_audio_supported,
)


# ---------------------------------------------------------------------------
# is_audio_supported
# ---------------------------------------------------------------------------

class TestIsAudioSupported:

    def test_returns_true_in_browser_mode(self):
        assert is_audio_supported() is True

    def test_return_type_is_bool(self):
        assert isinstance(is_audio_supported(), bool)


# ---------------------------------------------------------------------------
# BrowserTTSProvider
# ---------------------------------------------------------------------------

class TestBrowserTTSProvider:

    def test_synthesize_returns_none(self):
        provider = BrowserTTSProvider()
        result = provider.synthesize("Hello, this is a test.")
        assert result is None

    def test_synthesize_with_empty_string_returns_none(self):
        provider = BrowserTTSProvider()
        assert provider.synthesize("") is None

    def test_synthesize_with_long_text_returns_none(self):
        provider = BrowserTTSProvider()
        long_text = "word " * 500
        assert provider.synthesize(long_text) is None

    def test_synthesize_with_unicode_returns_none(self):
        provider = BrowserTTSProvider()
        assert provider.synthesize("héllo wörld ñoño") is None


# ---------------------------------------------------------------------------
# _get_tts_provider
# ---------------------------------------------------------------------------

class TestGetTTSProvider:

    def setup_method(self):
        """Reset the TTS provider singleton before each test so that patched
        settings are actually observed rather than using a cached instance."""
        import tts as tts_module
        tts_module._tts_provider_singleton = None

    def test_browser_provider_returned(self):
        with patch("tts.settings") as mock_settings:
            mock_settings.TTS_PROVIDER = "browser"
            provider = _get_tts_provider()
        assert isinstance(provider, BrowserTTSProvider)

    def test_unknown_provider_raises_tts_error(self):
        with patch("tts.settings") as mock_settings:
            mock_settings.TTS_PROVIDER = "nonexistent_provider"
            with pytest.raises(TTSError, match="Unknown TTS provider"):
                _get_tts_provider()

    def test_unknown_provider_error_mentions_supported_providers(self):
        with patch("tts.settings") as mock_settings:
            mock_settings.TTS_PROVIDER = "nonexistent"
            with pytest.raises(TTSError) as exc_info:
                _get_tts_provider()
        assert "browser" in str(exc_info.value)

    def test_provider_key_is_case_insensitive(self):
        with patch("tts.settings") as mock_settings:
            mock_settings.TTS_PROVIDER = "BROWSER"
            provider = _get_tts_provider()
        assert isinstance(provider, BrowserTTSProvider)

    def test_provider_key_strips_whitespace(self):
        with patch("tts.settings") as mock_settings:
            mock_settings.TTS_PROVIDER = "  browser  "
            provider = _get_tts_provider()
        assert isinstance(provider, BrowserTTSProvider)

    def test_provider_singleton_returns_same_instance(self):
        """Second call must return the exact same object (singleton)."""
        import tts as tts_module
        tts_module._tts_provider_singleton = None
        first = _get_tts_provider()
        second = _get_tts_provider()
        assert first is second


# ---------------------------------------------------------------------------
# generate_speech
# ---------------------------------------------------------------------------

class TestGenerateSpeech:

    def test_browser_mode_returns_none(self):
        result = generate_speech("You have done a great job on this project.")
        assert result is None

    def test_empty_string_returns_none(self):
        result = generate_speech("")
        assert result is None

    def test_whitespace_only_returns_none(self):
        result = generate_speech("   \n\t  ")
        assert result is None

    def test_normal_text_does_not_raise(self):
        # Should complete without exception in browser mode
        generate_speech("The auth dot py file uses JSON Web Tokens correctly.")

    def test_unicode_text_does_not_raise(self):
        generate_speech("The héllo wörld function is implemented correctly.")

    def test_long_text_does_not_raise(self):
        generate_speech("word " * 1000)


# ---------------------------------------------------------------------------
# Registry completeness
# ---------------------------------------------------------------------------

class TestTTSRegistry:

    def test_browser_in_registry(self):
        assert "browser" in _TTS_PROVIDER_REGISTRY

    def test_registry_values_are_browser_provider_subclasses(self):
        from tts import BaseTTSProvider
        for name, cls in _TTS_PROVIDER_REGISTRY.items():
            assert issubclass(cls, BaseTTSProvider), f"{name} is not a BaseTTSProvider subclass"
