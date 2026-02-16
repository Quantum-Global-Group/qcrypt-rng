"""
QCrypt RNG API - Quantum VRF (Verifiable Random Function) Endpoints
Quantum-backed VRF using quantum seed + Keccak-256 commit-reveal scheme.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict
import time
import secrets

from app.quantum.qrng import get_quantum_rng
from app.quantum.commitment import (
    compute_commitment,
    compute_commitment_hex,
    compute_vrf_output_hex,
    compute_vrf_output,
)
from app.api.v2.models.responses import BaseResponse, ResponseStatus
from app.utils.logging import logger

router = APIRouter()

# ---------------------------------------------------------------------------
# In-memory VRF seed store (keyed by request_id)
# ---------------------------------------------------------------------------
_vrf_store: Dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class VrfSeedRequest(BaseModel):
    target_chain: Optional[str] = Field(None, description="Target blockchain (metadata only)")


class VrfProveRequest(BaseModel):
    request_id: str = Field(..., description="VRF request ID returned by /vrf/seed")
    alpha: str = Field(..., description="Input value (e.g. round ID, nonce)")


class VrfRevealRequest(BaseModel):
    request_id: str = Field(..., description="VRF request ID to reveal")


class VrfVerifyRequest(BaseModel):
    commitment: str = Field(..., description="0x-prefixed hex commitment")
    alpha: str = Field(..., description="Input value used during prove")
    output: str = Field(..., description="0x-prefixed hex VRF output")
    seed: str = Field(..., description="Hex-encoded seed (no 0x prefix or with)")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/vrf/seed", response_model=BaseResponse)
async def create_vrf_seed(request: VrfSeedRequest = VrfSeedRequest()):
    """
    Create a quantum VRF seed.

    Generates a 32-byte quantum random seed and publishes a Keccak-256
    commitment.  The seed is held privately until revealed.
    """
    try:
        qrng = get_quantum_rng()
        result = await qrng.generate_bytes(32, 16, "raw")
        seed_bytes: bytes = result.data

        commitment_hex = compute_commitment_hex(seed_bytes)
        request_id = f"vrf_{int(time.time() * 1_000_000)}_{secrets.token_hex(4)}"

        _vrf_store[request_id] = {
            "seed": seed_bytes,
            "commitment": commitment_hex,
            "revealed": False,
            "created_at": time.time(),
        }

        logger.info(f"VRF seed created: {request_id}")

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=request_id,
            data={
                "request_id": request_id,
                "commitment": commitment_hex,
            },
            metadata={
                "quantum_backend": result.quantum_backend,
                "generation_time_ms": result.generation_time_ms,
                **({"target_chain": request.target_chain} if request.target_chain else {}),
            },
        )
    except Exception as e:
        logger.error(f"VRF seed error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"VRF seed creation failed: {e}")


@router.post("/vrf/prove", response_model=BaseResponse)
async def vrf_prove(request: VrfProveRequest):
    """
    Compute a VRF proof for a given input (alpha).

    Returns the deterministic output = keccak256(seed || alpha) together
    with the commitment so any verifier can later check correctness once
    the seed is revealed.
    """
    entry = _vrf_store.get(request.request_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="VRF request_id not found")

    seed_bytes = entry["seed"]
    output_hex = compute_vrf_output_hex(seed_bytes, request.alpha)

    return BaseResponse(
        status=ResponseStatus.SUCCESS,
        request_id=request.request_id,
        data={
            "request_id": request.request_id,
            "alpha": request.alpha,
            "output": output_hex,
            "commitment": entry["commitment"],
        },
    )


@router.post("/vrf/reveal", response_model=BaseResponse)
async def vrf_reveal(request: VrfRevealRequest):
    """
    Reveal the quantum seed so third parties can verify proofs.

    After reveal the seed is marked as disclosed but kept in the store
    so existing proofs can still be verified through /vrf/verify.
    """
    entry = _vrf_store.get(request.request_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="VRF request_id not found")

    entry["revealed"] = True
    seed_hex = entry["seed"].hex()

    logger.info(f"VRF seed revealed: {request.request_id}")

    return BaseResponse(
        status=ResponseStatus.SUCCESS,
        request_id=request.request_id,
        data={
            "request_id": request.request_id,
            "seed": seed_hex,
            "commitment": entry["commitment"],
        },
    )


@router.post("/vrf/verify", response_model=BaseResponse)
async def vrf_verify(request: VrfVerifyRequest):
    """
    Verify a quantum VRF proof.

    Checks:
      1. commitment == keccak256(seed)
      2. output    == keccak256(seed || alpha)
    """
    try:
        raw_seed = request.seed.removeprefix("0x")
        seed_bytes = bytes.fromhex(raw_seed)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid hex seed")

    expected_commitment = compute_commitment_hex(seed_bytes)
    expected_output = compute_vrf_output_hex(seed_bytes, request.alpha)

    commitment_ok = expected_commitment == request.commitment
    output_ok = expected_output == request.output
    valid = commitment_ok and output_ok

    return BaseResponse(
        status=ResponseStatus.SUCCESS if valid else ResponseStatus.ERROR,
        request_id=f"vrf_verify_{int(time.time() * 1_000_000)}",
        data={
            "valid": valid,
            "commitment_valid": commitment_ok,
            "output_valid": output_ok,
        },
    )
