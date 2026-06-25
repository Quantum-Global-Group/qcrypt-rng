"""Contract tests for /api/v2/protect/hash (Protect pillar)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

API_PREFIX = "/api/v2"


def _assert_success_envelope(body: dict) -> dict:
    assert body["status"] == "success"
    assert isinstance(body.get("request_id"), str)
    assert body["request_id"]
    assert isinstance(body.get("data"), dict)
    return body["data"]


@pytest.mark.contract
class TestProtectHash:
    """POST /protect/hash — quantum-salted hashing."""

    @pytest.fixture
    def mock_quantum_salt(self, monkeypatch):
        fixed_salt = bytes([0x55] * 32)
        mock_qcrypto = MagicMock()
        mock_qcrypto.generate_quantum_salt = AsyncMock(return_value=fixed_salt)

        monkeypatch.setattr(
            "app.api.v2.endpoints.protect.get_quantum_crypto",
            lambda: mock_qcrypto,
        )
        return mock_qcrypto

    def test_sha3_256_hash(self, api_client: TestClient, mock_quantum_salt):
        resp = api_client.post(
            f"{API_PREFIX}/protect/hash",
            data={
                "data": "hello-quantum",
                "algorithm": "SHA3-256",
                "use_quantum_salt": "true",
            },
        )
        assert resp.status_code == 200
        data = _assert_success_envelope(resp.json())
        assert "hash" in data
        assert "salt" in data
        assert data["algorithm"] == "SHA3-256"
        assert data["quantum_salt"] is True

    def test_pbkdf2_hash(self, api_client: TestClient, mock_quantum_salt):
        resp = api_client.post(
            f"{API_PREFIX}/protect/hash",
            data={
                "data": "password",
                "algorithm": "PBKDF2-SHA256",
                "use_quantum_salt": "true",
                "iterations": "1000",
            },
        )
        assert resp.status_code == 200
        data = _assert_success_envelope(resp.json())
        assert data["algorithm"] == "PBKDF2-SHA256"
        assert data["iterations"] == 1000

    def test_unsupported_algorithm(self, api_client: TestClient, mock_quantum_salt):
        resp = api_client.post(
            f"{API_PREFIX}/protect/hash",
            data={
                "data": "test",
                "algorithm": "MD5-INVALID",
                "use_quantum_salt": "false",
            },
        )
        assert resp.status_code == 500
