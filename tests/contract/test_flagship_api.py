"""
Contract tests for flagship-critical /api/v2 routes.

Covers Scenario A (VRF lottery audit trail) and Scenario B (sealed bid encrypt/decrypt)
mappings from docs/scenarios/FLAGSHIP_SCENARIOS.md.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.quantum.commitment import compute_commitment_hex, compute_vrf_output_hex

API_PREFIX = "/api/v2"
VRF_ALPHA = "lottery-round-1"
PLAINTEXT = "sealed-bid-contract-test"


def _assert_success_envelope(body: dict) -> dict:
    assert body["status"] == "success"
    assert isinstance(body.get("request_id"), str)
    assert body["request_id"]
    assert isinstance(body.get("data"), dict)
    return body["data"]


@pytest.mark.contract
class TestVrfHappyPathChain:
    """POST /oracle/vrf/seed → prove → reveal → verify."""

    def test_vrf_full_chain(
        self,
        api_client: TestClient,
        mock_vrf_quantum_rng,
        fixed_vrf_seed_bytes: bytes,
    ):
        expected_commitment = compute_commitment_hex(fixed_vrf_seed_bytes)
        expected_output = compute_vrf_output_hex(fixed_vrf_seed_bytes, VRF_ALPHA)
        expected_seed_hex = fixed_vrf_seed_bytes.hex()

        seed_resp = api_client.post(
            f"{API_PREFIX}/oracle/vrf/seed",
            json={"target_chain": "ethereum"},
        )
        assert seed_resp.status_code == 200
        seed_data = _assert_success_envelope(seed_resp.json())
        request_id = seed_data["request_id"]
        assert seed_data["commitment"] == expected_commitment

        prove_resp = api_client.post(
            f"{API_PREFIX}/oracle/vrf/prove",
            json={"request_id": request_id, "alpha": VRF_ALPHA},
        )
        assert prove_resp.status_code == 200
        prove_data = _assert_success_envelope(prove_resp.json())
        assert prove_data["alpha"] == VRF_ALPHA
        assert prove_data["output"] == expected_output
        assert prove_data["commitment"] == expected_commitment

        reveal_resp = api_client.post(
            f"{API_PREFIX}/oracle/vrf/reveal",
            json={"request_id": request_id},
        )
        assert reveal_resp.status_code == 200
        reveal_data = _assert_success_envelope(reveal_resp.json())
        assert reveal_data["seed"] == expected_seed_hex
        assert reveal_data["commitment"] == expected_commitment

        verify_resp = api_client.post(
            f"{API_PREFIX}/oracle/vrf/verify",
            json={
                "commitment": expected_commitment,
                "alpha": VRF_ALPHA,
                "output": expected_output,
                "seed": expected_seed_hex,
            },
        )
        assert verify_resp.status_code == 200
        verify_body = verify_resp.json()
        verify_data = _assert_success_envelope(verify_body)
        assert verify_data["valid"] is True
        assert verify_data["commitment_valid"] is True
        assert verify_data["output_valid"] is True

    def test_vrf_prove_unknown_request_id_returns_404(
        self,
        api_client: TestClient,
        mock_vrf_quantum_rng,
    ):
        resp = api_client.post(
            f"{API_PREFIX}/oracle/vrf/prove",
            json={"request_id": "vrf_nonexistent", "alpha": VRF_ALPHA},
        )
        assert resp.status_code == 404


@pytest.mark.contract
class TestProtectEncryptDecryptRoundTrip:
    """POST /protect/encrypt + /protect/decrypt round-trip."""

    @pytest.fixture
    def mock_protect_quantum_crypto(self, monkeypatch):
        fixed_key = bytes([0x11] * 32)
        fixed_iv = bytes([0x22] * 16)

        mock_qcrypto = MagicMock()
        mock_qcrypto.generate_quantum_key = AsyncMock(return_value=fixed_key)
        mock_qcrypto.generate_quantum_iv = AsyncMock(return_value=fixed_iv)

        monkeypatch.setattr(
            "app.api.v2.endpoints.protect.get_quantum_crypto",
            lambda: mock_qcrypto,
        )
        return mock_qcrypto

    def test_encrypt_decrypt_round_trip(
        self,
        api_client: TestClient,
        mock_protect_quantum_crypto,
    ):
        enc_resp = api_client.post(
            f"{API_PREFIX}/protect/encrypt",
            data={
                "data": PLAINTEXT,
                "use_quantum_key": "true",
                "algorithm": "AES-256-GCM",
            },
        )
        assert enc_resp.status_code == 200
        enc_data = _assert_success_envelope(enc_resp.json())
        for field in ("ciphertext", "iv", "tag", "key", "algorithm"):
            assert field in enc_data

        dec_resp = api_client.post(
            f"{API_PREFIX}/protect/decrypt",
            data={
                "ciphertext": enc_data["ciphertext"],
                "key": enc_data["key"],
                "iv": enc_data["iv"],
                "tag": enc_data["tag"],
                "algorithm": enc_data["algorithm"],
            },
        )
        assert dec_resp.status_code == 200
        dec_data = _assert_success_envelope(dec_resp.json())
        assert dec_data["plaintext"] == PLAINTEXT
        assert dec_data["verified"] is True
