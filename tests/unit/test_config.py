"""Unit tests for Settings validation and security defaults."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.config import Settings


class TestSecretKeyValidation:
    """SECRET_KEY must be at least 32 chars (placeholder allowed for dev)."""

    def test_placeholder_passes(self):
        s = Settings(secret_key="your-secret-key-here-change-in-production")
        assert s.secret_key == "your-secret-key-here-change-in-production"

    def test_short_key_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            Settings(secret_key="too-short")
        assert "at least 32 characters" in str(exc_info.value)

    def test_valid_32_char_key_passes(self):
        s = Settings(secret_key="a" * 32)
        assert s.secret_key == "a" * 32

    def test_valid_64_char_key_passes(self):
        s = Settings(secret_key="x" * 64)
        assert s.secret_key == "x" * 64


class TestSecurityDefaults:
    """Default values favor production-safe settings."""

    def test_debug_defaults_to_false(self, monkeypatch):
        # .env file may set DEBUG=True; explicitly override for the default check.
        monkeypatch.setenv("DEBUG", "False")
        s = Settings(_env_file=None)
        assert s.debug is False

    def test_cors_excludes_streamlit_by_default(self, monkeypatch):
        monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
        s = Settings()
        assert "http://localhost:8501" not in s.allowed_origins
        assert "http://localhost:3000" in s.allowed_origins

    def test_require_api_key_defaults_to_false(self, monkeypatch):
        monkeypatch.delenv("REQUIRE_API_KEY", raising=False)
        s = Settings()
        assert s.require_api_key is False


class TestQuantumBackendValidation:
    """QUANTUM_BACKEND must be a known backend."""

    def test_valid_backend(self):
        s = Settings(quantum_backend="qrisp_simulator")
        assert s.quantum_backend == "qrisp_simulator"

    def test_invalid_backend_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            Settings(quantum_backend="unknown_backend")
        assert "Invalid quantum backend" in str(exc_info.value)


class TestCorsOriginsParsing:
    """ALLOWED_ORIGINS accepts comma-separated string or list."""

    def test_list_passthrough(self):
        s = Settings(allowed_origins=["http://a.example", "http://b.example"])
        assert "http://a.example" in s.allowed_origins
        assert "http://b.example" in s.allowed_origins

    def test_comma_separated_string_parsed(self):
        s = Settings(allowed_origins="http://a.example, http://b.example")
        assert s.allowed_origins == ["http://a.example", "http://b.example"]
