"""Contract tests for /api/v2/generate/* endpoints (Randomize pillar)."""

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
class TestGenerateBytes:
    """POST /generate/bytes — quantum random bytes."""

    @pytest.fixture
    def mock_qrng(self, monkeypatch):
        fixed = bytes(range(32))
        mock_result = MagicMock()
        mock_result.data = fixed
        mock_result.quantum_backend = "contract_test"
        mock_result.generation_time_ms = 0.1
        mock_result.request_id = "gen-bytes-test"
        mock_result.length = 32
        mock_result.qubits_used = 8
        mock_result.entropy_bits = 256
        mock_result.format = "hex"
        mock_result.measurement_count = 1

        mock_qrng = MagicMock()
        mock_qrng.generate_bytes = AsyncMock(return_value=mock_result)

        monkeypatch.setattr(
            "app.api.v2.endpoints.generate.get_quantum_rng",
            lambda: mock_qrng,
        )
        return mock_qrng

    def test_generate_bytes_hex(self, api_client: TestClient, mock_qrng):
        resp = api_client.post(
            f"{API_PREFIX}/generate/bytes",
            json={"length": 32, "format": "hex", "quantum_bits": 8},
        )
        assert resp.status_code == 200
        data = _assert_success_envelope(resp.json())
        assert "bytes" in data
        assert data["length"] == 32
        assert data["format"] == "hex"

    def test_generate_bytes_invalid_length(self, api_client: TestClient, mock_qrng):
        resp = api_client.post(
            f"{API_PREFIX}/generate/bytes",
            json={"length": 0, "format": "hex"},
        )
        assert resp.status_code == 422


@pytest.mark.contract
class TestGenerateKey:
    """POST /generate/key — cryptographic keys."""

    @pytest.fixture
    def mock_qrng_key(self, monkeypatch):
        fixed = bytes([0xAB]) * 32
        mock_result = MagicMock()
        mock_result.data = {"key": fixed.hex(), "algorithm": "AES", "key_size": 256}
        mock_result.quantum_backend = "contract_test"
        mock_result.generation_time_ms = 0.1
        mock_result.request_id = "gen-key-test"

        mock_qrng = MagicMock()
        mock_qrng.generate_key = AsyncMock(return_value=mock_result)

        monkeypatch.setattr(
            "app.api.v2.endpoints.generate.get_quantum_rng",
            lambda: mock_qrng,
        )
        return mock_qrng

    def test_generate_aes_256_key(self, api_client: TestClient, mock_qrng_key):
        resp = api_client.post(
            f"{API_PREFIX}/generate/key",
            json={"algorithm": "AES", "key_size": 256, "format": "hex"},
        )
        assert resp.status_code == 200
        data = _assert_success_envelope(resp.json())
        assert "key" in data
        assert data["algorithm"] == "AES"
        assert data["key_size"] == 256

    def test_generate_aes_invalid_key_size(self, api_client: TestClient, mock_qrng_key):
        resp = api_client.post(
            f"{API_PREFIX}/generate/key",
            json={"algorithm": "AES", "key_size": 999, "format": "hex"},
        )
        assert resp.status_code == 422
