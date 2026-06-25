"""
Ethereum-compatible commitment helpers for the Quantum Randomness Oracle.

The on-chain contract verifies:
    keccak256(abi.encodePacked(uint256 randomness)) == commitment

abi.encodePacked(uint256) produces the value as 32 bytes (big-endian,
zero-padded).  We replicate this exactly so commitments computed
off-chain match what Solidity expects.
"""

from Crypto.Hash import keccak


def compute_commitment(randomness_bytes: bytes) -> bytes:
    """Return keccak256(abi.encodePacked(uint256(randomness))) as raw bytes.

    ``randomness_bytes`` is the raw quantum output (typically 32 bytes).
    Input longer than 32 bytes is hashed with SHA3-256 first so it always
    fits the uint256 encoding.  Input ≤ 32 bytes is used directly as a
    big-endian unsigned integer.
    """
    if len(randomness_bytes) > 32:
        import hashlib
        randomness_bytes = hashlib.sha3_256(randomness_bytes).digest()
    randomness_int = int.from_bytes(randomness_bytes, "big")
    encoded = randomness_int.to_bytes(32, "big")
    k = keccak.new(digest_bits=256, data=encoded)
    return k.digest()


def compute_commitment_hex(randomness_bytes: bytes) -> str:
    """Same as ``compute_commitment`` but returns a ``0x``-prefixed hex string."""
    return "0x" + compute_commitment(randomness_bytes).hex()


def compute_vrf_output(seed_bytes: bytes, alpha: str) -> bytes:
    """Compute VRF output: keccak256(seed_bytes || alpha_bytes).

    This is a deterministic function of (seed, alpha) that can be
    independently reproduced by anyone who knows the seed.
    """
    alpha_bytes = alpha.encode("utf-8")
    k = keccak.new(digest_bits=256, data=seed_bytes + alpha_bytes)
    return k.digest()


def compute_vrf_output_hex(seed_bytes: bytes, alpha: str) -> str:
    """Same as ``compute_vrf_output`` but returns a ``0x``-prefixed hex string."""
    return "0x" + compute_vrf_output(seed_bytes, alpha).hex()
