"""Contract tests for /api/v2/oracle/* endpoints (Randomize + Prove pillars)."""

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
class TestOracleRequest:
    """POST /oracle/request — single randomness request."""

    def test_successful_request(self, api_client: TestClient):
        resp = api_client.post(
            f"{API_PREFIX}/oracle/request",
            json={"num_bytes": 32, "num_qubits": 16},
        )
        assert resp.status_code == 200
        data = _assert_success_envelope(resp.json())
        assert data["status"] == "registered"
        assert "request_id" in data
        assert "commitment" in data
        assert "fee_required" in data

    def test_request_with_target_chain(self, api_client: TestClient):
        resp = api_client.post(
            f"{API_PREFIX}/oracle/request",
            json={
                "num_bytes": 32,
                "num_qubits": 8,
                "target_chain": "Ethereum",
                "commitment_required": True,
            },
        )
        assert resp.status_code == 200
        data = _assert_success_envelope(resp.json())
        assert data["commitment"] is not None


@pytest.mark.contract
class TestOracleBatchRequest:
    """POST /oracle/requests/batch — batch randomness."""

    def test_batch_of_three(self, api_client: TestClient):
        resp = api_client.post(
            f"{API_PREFIX}/oracle/requests/batch",
            json={"count": 3, "num_bytes": 32},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "success"
        assert isinstance(body.get("data"), dict)
        data = body["data"]
        assert "requests" in data
        assert "total" in data
        items = data["requests"]
        assert len(items) == 3
        for item in items:
            assert item["status"] == "registered"
            assert "request_id" in item
            assert "commitment" in item

    def test_batch_defaults_to_5(self, api_client: TestClient):
        resp = api_client.post(
            f"{API_PREFIX}/oracle/requests/batch",
            json={"num_bytes": 16},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body.get("data"), dict)
        items = body["data"]["requests"]
        assert len(items) == 5


@pytest.mark.contract
class TestOracleStatus:
    """GET /oracle/status/{request_id} — status lookup."""

    def test_status_endpoint_returns_200(self, api_client: TestClient):
        resp = api_client.get(f"{API_PREFIX}/oracle/status/test-request-123")
        assert resp.status_code == 200
        data = _assert_success_envelope(resp.json())
        assert data["request_id"] == "test-request-123"
        assert data["status"] in (
            "pending_commitment", "committed", "fulfilled", "expired"
        )


@pytest.mark.contract
class TestOracleNetworkInfo:
    """GET /oracle/network-info — network & hardware info."""

    def test_network_info(self, api_client: TestClient):
        resp = api_client.get(f"{API_PREFIX}/oracle/network-info")
        assert resp.status_code == 200
        data = _assert_success_envelope(resp.json())
        assert "network" in data
        assert "quantum_hardware" in data
        assert "performance" in data
        assert data["network"]["status"] == "operational"


@pytest.mark.contract
class TestOracleBenchmark:
    """GET /oracle/benchmark — performance benchmark."""

    def test_benchmark(self, api_client: TestClient):
        resp = api_client.get(f"{API_PREFIX}/oracle/benchmark")
        assert resp.status_code == 200
        data = _assert_success_envelope(resp.json())
        assert "benchmark" in data
        b = data["benchmark"]
        assert b["samples_generated"] == 10
        assert "avg_generation_time_ms" in b
        assert "throughput_samples_per_sec" in b
