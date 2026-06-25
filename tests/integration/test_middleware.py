"""Integration tests for security middleware.

Covers API key validation, rate limiting, and body size limits from
app.utils.middleware.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def isolated_rate_limiter(tmp_path):
    """Use a temporary SQLite DB for rate limit state, isolated per test."""
    import os
    from app.utils.rate_limiting import rate_limiter
    original_path = rate_limiter.tracker.usage_db_path
    test_db = str(tmp_path / "test_usage.db")
    rate_limiter.tracker.usage_db_path = test_db
    rate_limiter.tracker._init_db()
    yield
    rate_limiter.tracker.usage_db_path = original_path
    if os.path.exists(test_db):
        os.remove(test_db)


class TestApiKeyMiddleware:
    """API key allow-list and length-fallback behavior."""

    def test_no_key_required_when_disabled(self, api_client: TestClient, isolated_rate_limiter):
        """When REQUIRE_API_KEY=false, requests pass without a key."""
        resp = api_client.get("/health")
        assert resp.status_code == 200

    def test_missing_key_returns_401_when_required(self, monkeypatch, isolated_rate_limiter):
        """When REQUIRE_API_KEY=true and no key is sent, return 401."""
        monkeypatch.setattr("app.config.settings.require_api_key", True)
        monkeypatch.setattr(
            "app.config.settings.valid_api_keys",
            "valid-key-aaaa1111bbbb2222,valid-key-cccc3333dddd4444",
        )
        import app.utils.middleware as mw
        mw._VALID_API_KEYS = mw._load_valid_api_keys()

        from app.main import app
        with TestClient(app) as client:
            resp = client.get("/health")
            assert resp.status_code == 401
            assert resp.json()["error"] == "api_key_required"

    def test_valid_key_passes_allowlist(self, monkeypatch, isolated_rate_limiter):
        """When REQUIRE_API_KEY=true and VALID_API_KEYS is set, a valid key passes."""
        monkeypatch.setattr("app.config.settings.require_api_key", True)
        monkeypatch.setattr(
            "app.config.settings.valid_api_keys",
            "valid-key-aaaa1111bbbb2222",
        )
        import app.utils.middleware as mw
        mw._VALID_API_KEYS = mw._load_valid_api_keys()

        from app.main import app
        with TestClient(app) as client:
            resp = client.get(
                "/health",
                headers={"X-API-Key": "valid-key-aaaa1111bbbb2222"},
            )
            assert resp.status_code == 200

    def test_invalid_key_returns_401(self, monkeypatch, isolated_rate_limiter):
        """When REQUIRE_API_KEY=true and key is not in allow-list, return 401."""
        monkeypatch.setattr("app.config.settings.require_api_key", True)
        monkeypatch.setattr(
            "app.config.settings.valid_api_keys",
            "valid-key-aaaa1111bbbb2222",
        )
        import app.utils.middleware as mw
        mw._VALID_API_KEYS = mw._load_valid_api_keys()

        from app.main import app
        with TestClient(app) as client:
            resp = client.get(
                "/health",
                headers={"X-API-Key": "not-a-valid-key"},
            )
            assert resp.status_code == 401
            assert resp.json()["error"] == "invalid_api_key"


class TestRequestBodySizeLimit:
    """Body size enforcement."""

    def test_oversized_request_rejected(self, api_client: TestClient, isolated_rate_limiter):
        """Requests larger than MAX_REQUEST_BODY_SIZE_BYTES return 413."""
        large_payload = "x" * (2 * 1024 * 1024)
        resp = api_client.post(
            "/api/v2/protect/hash",
            data={"data": large_payload, "algorithm": "SHA3-256"},
        )
        assert resp.status_code == 413
        assert resp.json()["error"] == "payload_too_large"


class TestSecurityHeaders:
    """Standard security response headers are present on every response."""

    def test_security_headers_present(self, api_client: TestClient):
        resp = api_client.get("/health")
        assert resp.status_code == 200
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"
        assert resp.headers.get("X-Frame-Options") == "DENY"
        assert "Referrer-Policy" in resp.headers
        assert "Permissions-Policy" in resp.headers
