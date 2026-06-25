"""Contract tests for /api/v2/pqc/* endpoints (Prove pillar)."""

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
class TestPqcGenerate:
    """POST /pqc/generate — keypair generation."""

    @pytest.fixture
    def mock_pqc(self, monkeypatch):
        mock_handler = MagicMock()
        mock_kp = MagicMock()
        mock_kp.public_key = bytes([0xAA] * 32)
        mock_kp.private_key = bytes([0xBB] * 64)
        mock_kp.algorithm = "DILITHIUM3"
        mock_kp.nist_level = 3
        mock_handler.generate_dilithium_keypair = AsyncMock(return_value=mock_kp)
        monkeypatch.setattr(
            "app.api.v2.endpoints.pqc_endpoints.get_pqc",
            lambda: mock_handler,
        )
        return mock_handler

    def test_generate_dilithium3_default(self, api_client: TestClient, mock_pqc):
        resp = api_client.post(
            f"{API_PREFIX}/pqc/generate",
            data={"algorithm": "DILITHIUM3", "encoding": "hex"},
        )
        assert resp.status_code == 200
        data = _assert_success_envelope(resp.json())
        assert "public_key" in data
        assert "private_key" in data
        assert data["algorithm"] == "DILITHIUM3"
        assert data["nist_level"] == 3
        assert data["type"] == "signature"

    def test_generate_invalid_algorithm(self, api_client: TestClient):
        resp = api_client.post(
            f"{API_PREFIX}/pqc/generate",
            data={"algorithm": "FAKE-ALGO", "encoding": "hex"},
        )
        assert resp.status_code == 500


@pytest.mark.contract
class TestPqcAlgorithms:
    """GET /pqc/algorithms — list supported algorithms."""

    def test_list_algorithms(self, api_client: TestClient):
        resp = api_client.get(f"{API_PREFIX}/pqc/algorithms")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)
        assert "data" in data
        assert "signatures" in data["data"]
        assert "key_exchange" in data["data"]


@pytest.mark.contract
class TestPqcInfo:
    """GET /pqc/info — detailed algorithm info."""

    def test_info_shape(self, api_client: TestClient):
        resp = api_client.get(f"{API_PREFIX}/pqc/info")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)


@pytest.mark.contract
class TestPqcThreatAssessment:
    """POST /pqc/threat-assessment — vulnerability analysis."""

    def test_threat_assessment(self, api_client: TestClient):
        resp = api_client.post(
            f"{API_PREFIX}/pqc/threat-assessment",
            data={"algorithm": "RSA-2048"},
        )
        assert resp.status_code == 200
        data = _assert_success_envelope(resp.json())
        assert "assessment" in data
        assert data["algorithm"] == "RSA-2048"
