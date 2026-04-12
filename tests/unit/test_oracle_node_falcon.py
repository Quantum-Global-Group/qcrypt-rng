"""
Unit tests for Falcon audit-signing inside the standalone oracle node.
"""

from __future__ import annotations

import base64
import importlib.util
from pathlib import Path

import pytest
import web3.middleware

from app.quantum.pqc_falcon import get_oracle_falcon_signer


if not hasattr(web3.middleware, "geth_poa_middleware"):
    web3.middleware.geth_poa_middleware = lambda *args, **kwargs: None


MODULE_PATH = (
    Path(__file__).resolve().parents[2]
    / "quantum-oracle"
    / "oracle-node"
    / "src"
    / "oracle_service.py"
)
SPEC = importlib.util.spec_from_file_location("oracle_node_service", MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
oracle_node_service = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(oracle_node_service)
QuantumRandomnessOracleNode = oracle_node_service.QuantumRandomnessOracleNode


def test_build_falcon_payload_is_stable():
    node = QuantumRandomnessOracleNode.__new__(QuantumRandomnessOracleNode)

    payload = node._build_falcon_payload("commit", 17, "0xabc123")

    assert payload == b'{"phase":"commit","request_id":"17","value":"0xabc123"}'


@pytest.mark.asyncio
async def test_sign_falcon_payload_returns_base64_signature_and_public_key():
    node = QuantumRandomnessOracleNode.__new__(QuantumRandomnessOracleNode)
    node.falcon_signer = get_oracle_falcon_signer()

    signature_b64, public_key_b64 = await node._sign_falcon_payload("reveal", 21, "42")

    signature = base64.b64decode(signature_b64)
    public_key = base64.b64decode(public_key_b64)

    assert len(signature) > 0
    assert len(public_key) > 0
