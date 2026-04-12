"""
app/api/v2/endpoints/pqc_upgrades.py
──────────────────────────────────────
New PQC endpoints wiring the three upgrade modules:
  - /pqc/hybrid/*     Dilithium3 + Ed25519 hybrid signatures + CSR
  - /pqc/falcon/*     Falcon-512/1024 sign + verify (gas-optimised for oracle)
  - /pqc/hqc/*        HQC-128/192/256 KEM (code-based algorithm diversity)

Mount in app/main.py:
    from app.api.v2.endpoints import pqc_upgrades
    app.include_router(pqc_upgrades.router, prefix=f"{settings.api_prefix}/pqc", tags=["PQC Upgrades"])
"""

from __future__ import annotations

import base64
import time
from typing import Optional

from fastapi import APIRouter, Form, HTTPException
from loguru import logger

from app.api.v2.models import BaseResponse, ResponseStatus
from app.quantum.pqc_hybrid import get_hybrid_pqc, HybridKEMResult, HybridSignature
from app.quantum.pqc_falcon import FalconSigner, FALCON_PARAMS
from app.quantum.pqc_hqc    import HQCSuite, HQC_PARAMS, get_hqc

router = APIRouter()


# ════════════════════════════════════════════════════════════════════
#  HYBRID PQC  (Dilithium3 + Ed25519)
# ════════════════════════════════════════════════════════════════════

@router.post("/hybrid/generate", response_model=BaseResponse)
async def generate_hybrid_keypair():
    """
    Generate a hybrid Dilithium3 + Ed25519 key pair.

    Returns both public keys.  The hybrid signature is verifiable with
    either algorithm independently — enabling a gradual migration where
    classical verifiers use Ed25519 and PQC-aware verifiers use Dilithium3.
    """
    try:
        t0     = time.time()
        hybrid = get_hybrid_pqc()
        kp     = await hybrid.generate_hybrid_keypair()
        ms     = round((time.time() - t0) * 1000, 2)

        return BaseResponse(
            status     = ResponseStatus.SUCCESS,
            request_id = f"hybrid_gen_{int(time.time()*1_000_000)}",
            data = {
                "dilithium_pk": base64.b64encode(kp.dilithium_pk).decode(),
                "ed25519_pk":   base64.b64encode(kp.ed25519_pk).decode(),
                "algorithm":    kp.algorithm,
                "nist_level":   kp.nist_level,
                "key_sizes": {
                    "dilithium_pk_bytes": len(kp.dilithium_pk),
                    "dilithium_sk_bytes": len(kp.dilithium_sk),
                    "ed25519_pk_bytes":   len(kp.ed25519_pk),
                    "ed25519_sk_bytes":   len(kp.ed25519_sk),
                },
            },
            metadata = {
                "fips_standards":   ["FIPS 204 (ML-DSA)", "RFC 8037 (Ed25519)"],
                "migration_use":    "Sign with both; verify with either",
                "execution_time_ms": ms,
            },
        )
    except Exception as e:
        logger.error(f"Hybrid keygen error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hybrid/sign", response_model=BaseResponse)
async def hybrid_sign(
    message:     str = Form(...),
    dilithium_sk: str = Form(..., description="Base64-encoded Dilithium3 private key"),
    ed25519_sk:   str = Form(..., description="Base64-encoded Ed25519 private key (32 bytes)"),
):
    """
    Sign a message with both Dilithium3 and Ed25519 simultaneously.
    Returns a combined signature (serialised) and both individual signatures.
    """
    try:
        from app.quantum.pqc_hybrid import HybridKeypair
        hybrid = get_hybrid_pqc()

        kp = HybridKeypair(
            dilithium_pk = b"",   # not needed for signing
            dilithium_sk = base64.b64decode(dilithium_sk),
            ed25519_pk   = b"",
            ed25519_sk   = base64.b64decode(ed25519_sk),
        )

        sig = await hybrid.hybrid_sign(message.encode(), kp)

        return BaseResponse(
            status     = ResponseStatus.SUCCESS,
            request_id = f"hybrid_sign_{int(time.time()*1_000_000)}",
            data = {
                "combined_signature":  sig.to_b64(),
                "dilithium_signature": base64.b64encode(sig.dilithium_sig).decode(),
                "ed25519_signature":   base64.b64encode(sig.ed25519_sig).decode(),
                "algorithm":           sig.algorithm,
                "dilithium_sig_bytes": len(sig.dilithium_sig),
                "ed25519_sig_bytes":   len(sig.ed25519_sig),
            },
            metadata = {"quantum_resistant": True, "classical_compatible": True},
        )
    except Exception as e:
        logger.error(f"Hybrid sign error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hybrid/verify", response_model=BaseResponse)
async def hybrid_verify(
    message:     str = Form(...),
    signature:   str = Form(..., description="Base64 combined hybrid signature"),
    dilithium_pk: str = Form(...),
    ed25519_pk:   str = Form(...),
    require_both: bool = Form(True),
):
    """
    Verify a hybrid signature against both Dilithium3 and Ed25519 public keys.
    With require_both=True (default), BOTH must pass.
    """
    try:
        hybrid = get_hybrid_pqc()
        sig    = HybridSignature.from_b64(signature)

        result = await hybrid.hybrid_verify(
            message.encode(),
            sig,
            base64.b64decode(dilithium_pk),
            base64.b64decode(ed25519_pk),
            require_both=require_both,
        )

        return BaseResponse(
            status     = ResponseStatus.SUCCESS,
            request_id = f"hybrid_verify_{int(time.time()*1_000_000)}",
            data       = result,
            metadata   = {"quantum_resistant": True},
        )
    except Exception as e:
        logger.error(f"Hybrid verify error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hybrid/csr", response_model=BaseResponse)
async def generate_csr(
    dilithium_pk: str = Form(..., description="Base64 Dilithium3 public key"),
    dilithium_sk: str = Form(..., description="Base64 Dilithium3 private key"),
    ed25519_pk:   str = Form(..., description="Base64 Ed25519 public key"),
    ed25519_sk:   str = Form(..., description="Base64 Ed25519 private key"),
    common_name:  str = Form("example.com"),
    organization: Optional[str] = Form(None),
    country:      Optional[str] = Form(None),
    state:        Optional[str] = Form(None),
):
    """
    Generate a Certificate Signing Request (CSR) for TLS migration.

    The CSR is signed with Ed25519 (compatible with all current CAs) and
    embeds the Dilithium3 public key as a FIPS 204 extension.  Once CAs
    support PQC, the Dilithium key can be promoted to the primary algorithm
    without re-issuing the certificate.
    """
    try:
        from app.quantum.pqc_hybrid import HybridKeypair
        hybrid = get_hybrid_pqc()

        kp = HybridKeypair(
            dilithium_pk = base64.b64decode(dilithium_pk),
            dilithium_sk = base64.b64decode(dilithium_sk),
            ed25519_pk   = base64.b64decode(ed25519_pk),
            ed25519_sk   = base64.b64decode(ed25519_sk),
        )

        subject: dict[str, str] = {"CN": common_name}
        if organization: subject["O"] = organization
        if country:      subject["C"] = country
        if state:        subject["ST"] = state

        result = await hybrid.generate_csr(kp, subject=subject)

        return BaseResponse(
            status     = ResponseStatus.SUCCESS,
            request_id = f"csr_gen_{int(time.time()*1_000_000)}",
            data       = result,
            metadata   = {
                "submit_to_ca": "Paste csr_pem into your CA's CSR submission page",
                "compatible_with": "Let's Encrypt, DigiCert, Sectigo, and all PKCS#10 CAs",
                "quantum_upgrade_path": "CA countersigns with Dilithium once FIPS 204 CA support ships",
            },
        )
    except Exception as e:
        logger.error(f"CSR generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hybrid/kem/generate", response_model=BaseResponse)
async def generate_hybrid_kem_keypair(
    encoding: str = Form("base64", description="Output encoding: base64 or hex"),
):
    """
    Generate a hybrid Kyber768 + X25519 key pair.

    This exposes the existing hybrid KEM primitive for transport-layer and
    migration experiments where a combined shared secret is derived from both
    a post-quantum KEM and a classical X25519 exchange.
    """
    try:
        t0 = time.time()
        hybrid = get_hybrid_pqc()
        result = await hybrid.generate_hybrid_kem_keypair()
        ms = round((time.time() - t0) * 1000, 2)

        encode = (
            (lambda b: base64.b64encode(b).decode())
            if encoding == "base64"
            else (lambda b: b.hex())
        )

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"hybrid_kem_gen_{int(time.time()*1_000_000)}",
            data={
                "kyber_public_key": encode(result.kyber_pk),
                "kyber_private_key": encode(result.kyber_sk),
                "x25519_public_key": encode(result.x25519_pk),
                "x25519_private_key": encode(result.x25519_sk),
                "algorithm": result.algorithm,
                "encoding": encoding,
                "key_sizes": {
                    "kyber_public_key_bytes": len(result.kyber_pk),
                    "kyber_private_key_bytes": len(result.kyber_sk),
                    "x25519_public_key_bytes": len(result.x25519_pk),
                    "x25519_private_key_bytes": len(result.x25519_sk),
                },
            },
            metadata={
                "combiner": "HKDF-SHA256(kyber_ss || x25519_ss)",
                "migration_use": "Hybrid key exchange during PQC transition",
                "execution_time_ms": ms,
            },
        )
    except Exception as e:
        logger.error(f"Hybrid KEM keygen error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hybrid/kem/encapsulate", response_model=BaseResponse)
async def hybrid_kem_encapsulate(
    kyber_public_key: str = Form(..., description="Base64 or hex Kyber768 public key"),
    x25519_public_key: str = Form(..., description="Base64 or hex X25519 public key"),
    encoding: str = Form("base64", description="Input/output encoding: base64 or hex"),
):
    """
    Encapsulate to a hybrid Kyber768 + X25519 public key set.

    Returns both ciphertext/public-share outputs and the combined secret that
    existing hybrid KEM logic derives from them.
    """
    try:
        decode = (
            (lambda s: base64.b64decode(s))
            if encoding == "base64"
            else (lambda s: bytes.fromhex(s))
        )
        encode = (
            (lambda b: base64.b64encode(b).decode())
            if encoding == "base64"
            else (lambda b: b.hex())
        )

        hybrid = get_hybrid_pqc()
        result = await hybrid.hybrid_encapsulate(
            HybridKEMResult(
                kyber_pk=decode(kyber_public_key),
                kyber_sk=b"",
                x25519_pk=decode(x25519_public_key),
                x25519_sk=b"",
            )
        )

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"hybrid_kem_encap_{int(time.time()*1_000_000)}",
            data={
                "kyber_ciphertext": encode(result.kyber_ct),
                "x25519_ciphertext": encode(result.x25519_ct),
                "combined_secret": encode(result.shared_secret),
                "algorithm": result.algorithm,
                "encoding": encoding,
                "key_sizes": {
                    "kyber_ciphertext_bytes": len(result.kyber_ct),
                    "x25519_ciphertext_bytes": len(result.x25519_ct),
                    "combined_secret_bytes": len(result.shared_secret),
                },
            },
            metadata={
                "combiner": "HKDF-SHA256(kyber_ss || x25519_ss)",
                "security_model": "Secure unless both Kyber and X25519 are broken",
            },
        )
    except Exception as e:
        logger.error(f"Hybrid KEM encapsulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hybrid/kem/decapsulate", response_model=BaseResponse)
async def hybrid_kem_decapsulate(
    kyber_private_key: str = Form(..., description="Base64 or hex Kyber768 private key"),
    x25519_private_key: str = Form(..., description="Base64 or hex X25519 private key"),
    kyber_ciphertext: str = Form(..., description="Base64 or hex Kyber ciphertext"),
    x25519_ciphertext: str = Form(..., description="Base64 or hex X25519 peer public share"),
    encoding: str = Form("base64", description="Input/output encoding: base64 or hex"),
):
    """
    Decapsulate a hybrid Kyber768 + X25519 exchange using the receiver private keys.

    This reconstructs the receiver-side combined secret for a full sender/receiver
    migration flow.
    """
    try:
        decode = (
            (lambda s: base64.b64decode(s))
            if encoding == "base64"
            else (lambda s: bytes.fromhex(s))
        )
        encode = (
            (lambda b: base64.b64encode(b).decode())
            if encoding == "base64"
            else (lambda b: b.hex())
        )

        hybrid = get_hybrid_pqc()
        result = await hybrid.hybrid_decapsulate(
            HybridKEMResult(
                kyber_pk=b"",
                kyber_sk=decode(kyber_private_key),
                x25519_pk=b"",
                x25519_sk=decode(x25519_private_key),
                kyber_ct=decode(kyber_ciphertext),
                x25519_ct=decode(x25519_ciphertext),
            )
        )

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"hybrid_kem_decap_{int(time.time()*1_000_000)}",
            data={
                "combined_secret": encode(result.shared_secret),
                "algorithm": result.algorithm,
                "encoding": encoding,
                "key_sizes": {
                    "combined_secret_bytes": len(result.shared_secret),
                    "kyber_ciphertext_bytes": len(result.kyber_ct),
                    "x25519_ciphertext_bytes": len(result.x25519_ct),
                },
            },
            metadata={
                "combiner": "HKDF-SHA256(kyber_ss || x25519_ss)",
                "receiver_role": "Decapsulation performed with receiver private keys",
            },
        )
    except Exception as e:
        logger.error(f"Hybrid KEM decapsulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════════
#  FALCON  (FN-DSA)
# ════════════════════════════════════════════════════════════════════

@router.post("/falcon/sign", response_model=BaseResponse)
async def falcon_sign(
    message:   str = Form(...),
    private_key: str = Form(..., description="Base64-encoded Falcon private key"),
    algorithm: str = Form("Falcon-512"),
    encoding:  str = Form("base64"),
):
    """
    Sign a message with Falcon-512 or Falcon-1024.

    Falcon-512 is the recommended choice for on-chain signatures because
    its compact size (~666 bytes avg) reduces calldata gas costs by ~80%
    compared to Dilithium3 (3,293 bytes).
    """
    try:
        if algorithm not in FALCON_PARAMS:
            raise ValueError(f"Use Falcon-512 or Falcon-1024")

        signer  = FalconSigner(algorithm)
        sk      = base64.b64decode(private_key)
        result  = await signer.sign(message.encode(), sk)

        sig_encoded = (
            base64.b64encode(result.signature).decode()
            if encoding == "base64" else result.signature.hex()
        )

        return BaseResponse(
            status     = ResponseStatus.SUCCESS,
            request_id = f"falcon_sign_{int(time.time()*1_000_000)}",
            data = {
                "signature":          sig_encoded,
                "algorithm":          algorithm,
                "encoding":           encoding,
                "signature_bytes":    result.sig_bytes,
                "sign_time_ms":       result.sign_time_ms,
                "calldata_gas":       result.calldata_gas,
                "gas_savings_vs_dilithium": result.gas_savings_vs_dilithium,
            },
            metadata = {
                "fips_standard": FALCON_PARAMS[algorithm]["fips"],
                "nist_level":    FALCON_PARAMS[algorithm]["nist_level"],
                "oracle_note":   (
                    "Falcon-512 saves ~42,000 gas per oracle fulfillment vs Dilithium3. "
                    "At 10k fulfillments/day: ~$226k/year in gas savings."
                ),
            },
        )
    except Exception as e:
        logger.error(f"Falcon sign error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/falcon/verify", response_model=BaseResponse)
async def falcon_verify(
    message:    str = Form(...),
    signature:  str = Form(..., description="Base64 or hex Falcon signature"),
    public_key: str = Form(..., description="Base64 Falcon public key"),
    algorithm:  str = Form("Falcon-512"),
    encoding:   str = Form("base64"),
):
    """
    Verify a Falcon signature.  Returns detailed verification metadata
    including gas cost comparison — useful for research and audit logs.
    """
    try:
        signer  = FalconSigner(algorithm)
        pk      = base64.b64decode(public_key)
        sig_raw = base64.b64decode(signature) if encoding == "base64" else bytes.fromhex(signature)

        result = await signer.verify(message.encode(), sig_raw, pk)

        return BaseResponse(
            status     = ResponseStatus.SUCCESS,
            request_id = f"falcon_verify_{int(time.time()*1_000_000)}",
            data       = result,
        )
    except Exception as e:
        logger.error(f"Falcon verify error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/falcon/gas-report", response_model=BaseResponse)
async def falcon_gas_report(algorithm: str = "Falcon-512"):
    """
    Return a detailed gas cost comparison between Falcon and Dilithium3
    for oracle fulfillment transactions.
    """
    try:
        signer = FalconSigner(algorithm)
        report = signer.estimate_calldata_gas()
        return BaseResponse(
            status     = ResponseStatus.SUCCESS,
            request_id = f"gas_report_{int(time.time()*1_000_000)}",
            data       = report,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ════════════════════════════════════════════════════════════════════
#  HQC KEM  (Code-based — algorithm diversity)
# ════════════════════════════════════════════════════════════════════

@router.post("/hqc/generate", response_model=BaseResponse)
async def hqc_generate(
    variant:  str = Form("HQC-192", description="HQC-128, HQC-192, or HQC-256"),
    encoding: str = Form("base64"),
):
    """
    Generate an HQC keypair.

    HQC is a code-based KEM (NIST Round 4 candidate).  Use alongside ML-KEM
    (Kyber) for cryptographic agility: if lattice problems are broken, HQC
    remains secure.  If code-based problems are broken, Kyber remains secure.
    """
    try:
        t0   = time.time()
        hqc  = HQCSuite(variant)
        kp   = await hqc.generate_keypair()
        ms   = round((time.time() - t0) * 1000, 2)

        encode = (lambda b: base64.b64encode(b).decode()) if encoding == "base64" else (lambda b: b.hex())

        return BaseResponse(
            status     = ResponseStatus.SUCCESS,
            request_id = f"hqc_gen_{int(time.time()*1_000_000)}",
            data = {
                "public_key":  encode(kp.public_key),
                "private_key": encode(kp.private_key),
                "algorithm":   kp.algorithm,
                "nist_level":  kp.nist_level,
                "encoding":    encoding,
                "key_sizes": {
                    "public_key_bytes":  kp.pk_bytes,
                    "private_key_bytes": kp.sk_bytes,
                },
            },
            metadata = {
                **hqc.info(),
                "execution_time_ms": ms,
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"HQC keygen error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hqc/encapsulate", response_model=BaseResponse)
async def hqc_encapsulate(
    public_key: str = Form(...),
    variant:    str = Form("HQC-192"),
    encoding:   str = Form("base64"),
):
    """Encapsulate a shared secret using the recipient's HQC public key."""
    try:
        hqc = HQCSuite(variant)
        pk  = base64.b64decode(public_key)
        enc = await hqc.encapsulate(pk)

        encode = (lambda b: base64.b64encode(b).decode()) if encoding == "base64" else (lambda b: b.hex())

        return BaseResponse(
            status     = ResponseStatus.SUCCESS,
            request_id = f"hqc_encap_{int(time.time()*1_000_000)}",
            data = {
                "ciphertext":    encode(enc.ciphertext),
                "shared_secret": encode(enc.shared_secret),
                "algorithm":     enc.algorithm,
                "ct_bytes":      enc.ct_bytes,
                "ss_bytes":      enc.ss_bytes,
                "encap_time_ms": enc.encap_time_ms,
            },
        )
    except Exception as e:
        logger.error(f"HQC encapsulate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hqc/decapsulate", response_model=BaseResponse)
async def hqc_decapsulate(
    ciphertext:  str = Form(...),
    private_key: str = Form(...),
    variant:     str = Form("HQC-192"),
    encoding:    str = Form("base64"),
):
    """Recover the shared secret from ciphertext using the HQC private key."""
    try:
        hqc = HQCSuite(variant)
        ct  = base64.b64decode(ciphertext)
        sk  = base64.b64decode(private_key)
        ss  = await hqc.decapsulate(ct, sk)

        encode = (lambda b: base64.b64encode(b).decode()) if encoding == "base64" else (lambda b: b.hex())

        return BaseResponse(
            status     = ResponseStatus.SUCCESS,
            request_id = f"hqc_decap_{int(time.time()*1_000_000)}",
            data = {
                "shared_secret": encode(ss),
                "ss_bytes":      len(ss),
                "algorithm":     variant,
            },
        )
    except Exception as e:
        logger.error(f"HQC decapsulate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hqc/dual-kem", response_model=BaseResponse)
async def dual_kem(
    kyber_pk:      str = Form(..., description="Base64 Kyber768 public key"),
    hqc_pk:        str = Form(..., description="Base64 HQC-192 public key"),
    kyber_variant: str = Form("Kyber768"),
    hqc_variant:   str = Form("HQC-192"),
    encoding:      str = Form("base64"),
):
    """
    Dual-algorithm KEM: Kyber768 + HQC-192.

    Produces a combined shared secret that is secure unless an adversary
    simultaneously breaks Module-LWE (Kyber) AND Syndrome Decoding (HQC).
    This is the recommended approach for enterprise cryptographic agility.
    """
    try:
        result = await HQCSuite.dual_kem_encapsulate(
            base64.b64decode(kyber_pk),
            base64.b64decode(hqc_pk),
            kyber_variant,
            hqc_variant,
        )

        encode = (lambda b: base64.b64encode(b).decode()) if encoding == "base64" else (lambda b: b.hex())

        return BaseResponse(
            status     = ResponseStatus.SUCCESS,
            request_id = f"dual_kem_{int(time.time()*1_000_000)}",
            data = {
                "kyber_ciphertext":  encode(result.kyber_ct),
                "hqc_ciphertext":    encode(result.hqc_ct),
                "combined_secret":   encode(result.combined_secret),
                "algorithm":         result.algorithm,
                "total_ct_bytes":    result.total_ct_bytes,
                "combiner":          "HKDF-SHA256(label || kyber_ss || hqc_ss)",
            },
            metadata = {
                "security_argument": (
                    "Secure unless an adversary simultaneously breaks Module-LWE (Kyber) "
                    "AND the Syndrome Decoding Problem (HQC).  "
                    "No known classical or quantum algorithm achieves both."
                ),
                "nist_recommendation": "CISA / NCSC recommend dual-algorithm KEM during transition period",
            },
        )
    except Exception as e:
        logger.error(f"Dual KEM error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hqc/info", response_model=BaseResponse)
async def hqc_info(variant: str = "HQC-192"):
    """Return metadata and rationale for the specified HQC variant."""
    try:
        hqc = HQCSuite(variant)
        return BaseResponse(
            status     = ResponseStatus.SUCCESS,
            request_id = f"hqc_info_{int(time.time()*1_000_000)}",
            data       = hqc.info(),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
