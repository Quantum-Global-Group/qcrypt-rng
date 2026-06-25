"""Contract tests for committee selection endpoint (Scenario C — Committee selection).

Covers POST /api/v2/oracle/select-committee which maps a verified VRF
output to a deterministic subset of a roster.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

API_PREFIX = "/api/v2"


def _assert_success_envelope(body: dict) -> dict:
    assert body["status"] == "success"
    assert isinstance(body.get("request_id"), str)
    assert body["request_id"]
    assert isinstance(body.get("data"), dict)
    return body["data"]


# A fixed 32-byte VRF output for deterministic testing.
FIXED_VRF_OUTPUT = "0x" + "ab" * 32
ROSTER_5 = ["alice", "bob", "carol", "dave", "eve"]
ROSTER_10 = [f"member_{i}" for i in range(10)]


@pytest.mark.contract
class TestCommitteeSelect:
    """POST /oracle/select-committee — deterministic selection from VRF output."""

    def test_select_from_five(self, api_client: TestClient):
        resp = api_client.post(
            f"{API_PREFIX}/oracle/select-committee",
            json={
                "vrf_output": FIXED_VRF_OUTPUT,
                "roster": ROSTER_5,
                "size": 3,
            },
        )
        assert resp.status_code == 200
        data = _assert_success_envelope(resp.json())
        assert data["size"] == 3
        assert data["roster_size"] == 5
        assert data["algorithm"] == "fisher_yates_vrf"
        assert len(data["selected"]) == 3

        # No duplicate members
        members = [s["member"] for s in data["selected"]]
        assert len(members) == len(set(members))

        # All selected members are from the roster
        for m in members:
            assert m in ROSTER_5

        # Each entry has index + member
        for s in data["selected"]:
            assert "index" in s
            assert "member" in s
            assert 0 <= s["index"] < len(ROSTER_5)

    def test_reproducibility_same_output_same_selection(self, api_client: TestClient):
        """Same VRF output + same roster + same size → identical selection."""
        resp1 = api_client.post(
            f"{API_PREFIX}/oracle/select-committee",
            json={"vrf_output": FIXED_VRF_OUTPUT, "roster": ROSTER_10, "size": 4},
        )
        resp2 = api_client.post(
            f"{API_PREFIX}/oracle/select-committee",
            json={"vrf_output": FIXED_VRF_OUTPUT, "roster": ROSTER_10, "size": 4},
        )
        assert resp1.status_code == resp2.status_code == 200
        d1 = resp1.json()["data"]["selected"]
        d2 = resp2.json()["data"]["selected"]
        assert [s["member"] for s in d1] == [s["member"] for s in d2]

    def test_different_output_different_selection(self, api_client: TestClient):
        """Different VRF output → different selection (probabilistic check)."""
        other_output = "0x" + "cd" * 32
        resp1 = api_client.post(
            f"{API_PREFIX}/oracle/select-committee",
            json={"vrf_output": FIXED_VRF_OUTPUT, "roster": ROSTER_10, "size": 5},
        )
        resp2 = api_client.post(
            f"{API_PREFIX}/oracle/select-committee",
            json={"vrf_output": other_output, "roster": ROSTER_10, "size": 5},
        )
        s1 = [s["member"] for s in resp1.json()["data"]["selected"]]
        s2 = [s["member"] for s in resp2.json()["data"]["selected"]]
        assert s1 != s2

    def test_size_equals_roster_returns_all(self, api_client: TestClient):
        """When size == roster length, all members are selected (possibly reordered)."""
        resp = api_client.post(
            f"{API_PREFIX}/oracle/select-committee",
            json={
                "vrf_output": FIXED_VRF_OUTPUT,
                "roster": ROSTER_5,
                "size": 5,
            },
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["size"] == 5
        members = sorted(s["member"] for s in data["selected"])
        assert members == sorted(ROSTER_5)

    def test_invalid_hex_output(self, api_client: TestClient):
        resp = api_client.post(
            f"{API_PREFIX}/oracle/select-committee",
            json={
                "vrf_output": "0xZZZZ",
                "roster": ROSTER_5,
                "size": 2,
            },
        )
        assert resp.status_code == 400

    def test_wrong_length_output(self, api_client: TestClient):
        resp = api_client.post(
            f"{API_PREFIX}/oracle/select-committee",
            json={
                "vrf_output": "0xabcd",
                "roster": ROSTER_5,
                "size": 2,
            },
        )
        assert resp.status_code == 400

    def test_size_exceeds_roster(self, api_client: TestClient):
        resp = api_client.post(
            f"{API_PREFIX}/oracle/select-committee",
            json={
                "vrf_output": FIXED_VRF_OUTPUT,
                "roster": ROSTER_5,
                "size": 10,
            },
        )
        assert resp.status_code == 400

    def test_empty_roster_rejected(self, api_client: TestClient):
        resp = api_client.post(
            f"{API_PREFIX}/oracle/select-committee",
            json={
                "vrf_output": FIXED_VRF_OUTPUT,
                "roster": [],
                "size": 1,
            },
        )
        assert resp.status_code == 422


@pytest.mark.contract
class TestCommitteeIntegration:
    """End-to-end: VRF seed → prove → committee select from output."""

    def test_full_committee_flow(self, api_client: TestClient, mock_vrf_quantum_rng, fixed_vrf_seed_bytes):
        """VRF commit→prove→select-committee produces a valid selection."""
        from app.quantum.commitment import (
            compute_commitment_hex,
            compute_vrf_output_hex,
        )

        seed_resp = api_client.post(
            f"{API_PREFIX}/oracle/vrf/seed",
            json={"target_chain": "ethereum"},
        )
        assert seed_resp.status_code == 200
        seed_data = seed_resp.json()["data"]
        request_id = seed_data["request_id"]
        commitment = seed_data["commitment"]

        expected_commitment = compute_commitment_hex(fixed_vrf_seed_bytes)
        assert commitment == expected_commitment

        alpha = "round-42"
        prove_resp = api_client.post(
            f"{API_PREFIX}/oracle/vrf/prove",
            json={"request_id": request_id, "alpha": alpha},
        )
        assert prove_resp.status_code == 200
        vrf_output = prove_resp.json()["data"]["output"]

        expected_output = compute_vrf_output_hex(fixed_vrf_seed_bytes, alpha)
        assert vrf_output == expected_output

        roster = [f"juror_{i}" for i in range(20)]
        select_resp = api_client.post(
            f"{API_PREFIX}/oracle/select-committee",
            json={"vrf_output": vrf_output, "roster": roster, "size": 5},
        )
        assert select_resp.status_code == 200
        sel = select_resp.json()["data"]
        assert sel["size"] == 5
        members = [s["member"] for s in sel["selected"]]
        assert len(members) == 5
        assert len(set(members)) == 5
        for m in members:
            assert m in roster
