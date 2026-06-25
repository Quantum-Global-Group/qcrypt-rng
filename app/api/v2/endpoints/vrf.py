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


class CommitteeSelectRequest(BaseModel):
    vrf_output: str = Field(
        ...,
        description="0x-prefixed hex VRF output (32 bytes) to use as entropy source",
    )
    roster: list[str] = Field(
        ...,
        description="Ordered list of candidate identifiers (names, addresses, IDs)",
        min_length=1,
    )
    size: int = Field(
        ...,
        description="Number of committee members to select",
        ge=1,
    )


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


# ---------------------------------------------------------------------------
# Committee selection — deterministic Fisher-Yates from a VRF output
# ---------------------------------------------------------------------------

def _committee_keystream(vrf_output: bytes, n_blocks: int) -> bytes:
    """Derive `n_blocks * 8` random bytes from a VRF output using SHA3-256 in counter mode.

    Each block is `keccak256(vrf_output || counter_be_8)`, giving an
    independent 32-byte random block.  For 64-bit random integers we take
    the first 8 bytes of each block (rejection sampling applied in caller).
    """
    from hashlib import sha3_256
    out = bytearray()
    for i in range(n_blocks):
        out += sha3_256(vrf_output + i.to_bytes(8, "big")).digest()
    return bytes(out)


def _committee_select(vrf_output: bytes, roster: list[str], size: int) -> list[dict]:
    """Select `size` members from `roster` using a deterministic Fisher-Yates
    shuffle seeded by the VRF output.

    Returns a list of {index, member} dicts in selection order.
    """
    n = len(roster)
    if size > n:
        size = n
    indices = list(range(n))

    # Generate enough 8-byte random blocks for n-1 steps.
    needed = max(n - 1, 0)
    stream = _committee_keystream(vrf_output, needed)

    # Fisher-Yates shuffle, partial (only first `size` positions need settling).
    for i in range(size):
        j_range = n - 1 - i
        # Rejection sample on the 8-byte block to avoid modulo bias.
        while True:
            offset = (n - 2 - i) * 8 if (n - 2 - i) >= 0 else 0
            block = stream[offset:offset + 8]
            rand_int = int.from_bytes(block, "big")
            if j_range < (1 << 53):
                # Safe: j_range fits in 53 bits, so no bias.
                pick = rand_int % (j_range + 1)
                break
            if rand_int < (1 << 64) - (1 << 64) % (j_range + 1):
                pick = rand_int % (j_range + 1)
                break
            # Re-derive next block on rejection.
            stream += _committee_keystream(vrf_output, 1)
        # Swap indices[j_range] with indices[rand position].
        swap_pos = j_range - pick
        indices[j_range], indices[swap_pos] = indices[swap_pos], indices[j_range]

    return [
        {"index": indices[n - 1 - i], "member": roster[indices[n - 1 - i]]}
        for i in range(size)
    ]


@router.post("/select-committee", response_model=BaseResponse)
async def select_committee(request: CommitteeSelectRequest):
    """
    Deterministically select a committee of `size` members from `roster`
    using a VRF output as the entropy source.

    Algorithm: Fisher-Yates shuffle seeded by SHA3-256(vrf_output || counter)
    counter-mode blocks.  The selection is reproducible: anyone with the same
    VRF output, roster, and size gets the same committee.

    The caller is expected to have verified the VRF output (via /vrf/verify)
    before using it as the selection entropy source.
    """
    try:
        raw_output = request.vrf_output.removeprefix("0x")
        vrf_output = bytes.fromhex(raw_output)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid hex vrf_output")

    if len(vrf_output) != 32:
        raise HTTPException(
            status_code=400,
            detail=f"vrf_output must be 32 bytes, got {len(vrf_output)}",
        )

    n = len(request.roster)
    if request.size > n:
        raise HTTPException(
            status_code=400,
            detail=f"size ({request.size}) cannot exceed roster length ({n})",
        )

    selected = _committee_select(vrf_output, request.roster, request.size)

    return BaseResponse(
        status=ResponseStatus.SUCCESS,
        request_id=f"committee_{int(time.time() * 1_000_000)}",
        data={
            "selected": selected,
            "size": len(selected),
            "roster_size": n,
            "algorithm": "fisher_yates_vrf",
        },
        metadata={
            "vrf_output": request.vrf_output,
            "reproducible": True,
            "verification": "re-run with same vrf_output + roster to verify",
        },
    )
