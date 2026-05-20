"""Shared pytest fixtures for API contract tests."""

from __future__ import annotations

import sys
from unittest.mock import AsyncMock, MagicMock

import pytest

# Avoid liboqs auto-install side effects when oqs-python is present but native lib is not.
if "oqs" not in sys.modules:
    _fake_oqs = MagicMock()
    _fake_oqs.get_enabled_sig_mechanisms.return_value = []
    _fake_oqs.get_enabled_kem_mechanisms.return_value = []
    sys.modules["oqs"] = _fake_oqs

from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def api_client() -> TestClient:
    """FastAPI TestClient — no external network."""
    with TestClient(app) as client:
        yield client


@pytest.fixture(autouse=True)
def _clear_vrf_store():
    """Isolate VRF tests from in-memory state."""
    from app.api.v2.endpoints import vrf

    vrf._vrf_store.clear()
    yield
    vrf._vrf_store.clear()


@pytest.fixture
def fixed_vrf_seed_bytes() -> bytes:
    return bytes.fromhex("aa" * 32)


@pytest.fixture
def mock_vrf_quantum_rng(monkeypatch, fixed_vrf_seed_bytes: bytes):
    """Deterministic quantum bytes for VRF seed creation."""
    mock_result = MagicMock()
    mock_result.data = fixed_vrf_seed_bytes
    mock_result.quantum_backend = "contract_test"
    mock_result.generation_time_ms = 0.1

    mock_qrng = MagicMock()
    mock_qrng.generate_bytes = AsyncMock(return_value=mock_result)

    monkeypatch.setattr(
        "app.api.v2.endpoints.vrf.get_quantum_rng",
        lambda: mock_qrng,
    )
    return mock_qrng
