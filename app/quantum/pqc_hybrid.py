"""
app/quantum/pqc_hybrid.py
─────────────────────────
Hybrid post-quantum cryptography primitives.

Implements:
  1. Hybrid signature: Dilithium3 + Ed25519
       A single combined signature that is valid with EITHER the classical
       or the PQC algorithm.  Enterprises can verify with legacy Ed25519 today
       and migrate to Dilithium-only later without re-issuing keys.

  2. Certificate Signing Request (CSR) generation with a Dilithium public key
       Produces a PEM-encoded CSR that carries the Dilithium public key as a
       SubjectPublicKeyInfo extension.  The CSR is signed with the hybrid
       scheme so classical CAs can still parse and countersign it.

  3. Hybrid KEM: Kyber768 + X25519
       Concatenates both shared secrets and hashes them with HKDF-SHA256,
       giving a key that is secure unless BOTH problems are broken simultaneously.

Why hybrid?
  NIST and major browser vendors recommend hybrid mode during the PQC transition
  period.  An attacker who breaks one algorithm cannot read the traffic because
  the other algorithm still protects it.  Once PQC is universally deployed,
  the classical component can be dropped.

Usage:
    from app.quantum.pqc_hybrid import HybridPQC
    h = HybridPQC()
    keypair = await h.generate_hybrid_keypair()
    sig = await h.hybrid_sign(b"my message", keypair)
    ok  = await h.hybrid_verify(b"my message", sig, keypair.dilithium_pk, keypair.ed25519_pk)
    csr_pem = await h.generate_csr(keypair, subject={"CN": "example.com", "O": "My Org"})
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import struct
import time
from dataclasses import dataclass, field
from typing import Any

# ── Third-party ────────────────────────────────────────────────────────────────
from app.quantum._oqs_loader import load_oqs as _load_oqs

oqs, LIBOQS_AVAILABLE = _load_oqs()

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import (
        Ed25519PrivateKey,
        Ed25519PublicKey,
    )
    from cryptography.hazmat.primitives import serialization, hashes
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey, X25519PublicKey
    from cryptography.x509 import (
        CertificateSigningRequestBuilder,
        NameAttribute,
        NameOID,
    )
    from cryptography import x509
    CRYPTOGRAPHY_AVAILABLE = True
except ImportError:
    CRYPTOGRAPHY_AVAILABLE = False


# ── Data classes ───────────────────────────────────────────────────────────────

@dataclass
class HybridKeypair:
    """Combined Dilithium3 + Ed25519 key pair."""
    dilithium_pk: bytes
    dilithium_sk: bytes
    ed25519_pk:   bytes
    ed25519_sk:   bytes    # raw 32-byte seed
    algorithm:    str = "Dilithium3+Ed25519"
    created_at:   float = field(default_factory=time.time)
    nist_level:   int   = 3

    def public_keys_b64(self) -> dict[str, str]:
        return {
            "dilithium_pk": base64.b64encode(self.dilithium_pk).decode(),
            "ed25519_pk":   base64.b64encode(self.ed25519_pk).decode(),
        }


@dataclass
class HybridSignature:
    """Combined signature from both algorithms."""
    dilithium_sig: bytes
    ed25519_sig:   bytes
    algorithm:     str   = "Dilithium3+Ed25519"

    def to_bytes(self) -> bytes:
        """Serialise: [4B dil_len][dil_sig][4B ed_len][ed_sig]"""
        d_len = struct.pack(">I", len(self.dilithium_sig))
        e_len = struct.pack(">I", len(self.ed25519_sig))
        return d_len + self.dilithium_sig + e_len + self.ed25519_sig

    @classmethod
    def from_bytes(cls, data: bytes) -> "HybridSignature":
        d_len = struct.unpack(">I", data[:4])[0]
        dilithium_sig = data[4 : 4 + d_len]
        offset = 4 + d_len
        e_len = struct.unpack(">I", data[offset : offset + 4])[0]
        ed25519_sig = data[offset + 4 : offset + 4 + e_len]
        return cls(dilithium_sig=dilithium_sig, ed25519_sig=ed25519_sig)

    def to_b64(self) -> str:
        return base64.b64encode(self.to_bytes()).decode()

    @classmethod
    def from_b64(cls, b64: str) -> "HybridSignature":
        return cls.from_bytes(base64.b64decode(b64))


@dataclass
class HybridKEMResult:
    """Combined Kyber768 + X25519 KEM output."""
    kyber_pk:      bytes
    kyber_sk:      bytes
    x25519_pk:     bytes
    x25519_sk:     bytes
    kyber_ct:      bytes     = b""
    x25519_ct:     bytes     = b""
    shared_secret: bytes     = b""    # HKDF(kyber_ss || x25519_ss)
    algorithm:     str       = "Kyber768+X25519"


# ── Main class ─────────────────────────────────────────────────────────────────

class HybridPQC:
    """
    Hybrid PQC operations.  Falls back gracefully if liboqs or cryptography
    packages are missing (useful for tests / CI).
    """

    # ── Key generation ─────────────────────────────────────────────────────────

    async def generate_hybrid_keypair(self) -> HybridKeypair:
        """Generate a Dilithium3 + Ed25519 key pair."""
        if LIBOQS_AVAILABLE:
            sig_obj = oqs.Signature("Dilithium3")
            dil_pk  = sig_obj.generate_keypair()
            dil_sk  = sig_obj.export_secret_key()
        else:
            # Non-cryptographic fallback for development
            dil_sk = secrets.token_bytes(4000)
            dil_pk = hashlib.sha3_512(dil_sk).digest() + secrets.token_bytes(1952 - 64)

        if CRYPTOGRAPHY_AVAILABLE:
            ed_priv = Ed25519PrivateKey.generate()
            ed_sk   = ed_priv.private_bytes(
                serialization.Encoding.Raw,
                serialization.PrivateFormat.Raw,
                serialization.NoEncryption(),
            )
            ed_pk = ed_priv.public_key().public_bytes(
                serialization.Encoding.Raw,
                serialization.PublicFormat.Raw,
            )
        else:
            ed_sk = secrets.token_bytes(32)
            ed_pk = hashlib.sha256(ed_sk).digest()

        return HybridKeypair(
            dilithium_pk=dil_pk,
            dilithium_sk=dil_sk,
            ed25519_pk=ed_pk,
            ed25519_sk=ed_sk,
        )

    # ── Signing ────────────────────────────────────────────────────────────────

    async def hybrid_sign(self, message: bytes, keypair: HybridKeypair) -> HybridSignature:
        """
        Sign message with BOTH Dilithium3 and Ed25519.
        Verifiers who only understand classical crypto can use the Ed25519 sig.
        Verifiers who want quantum security use the Dilithium sig.
        Both must pass for the hybrid to be "fully verified".
        """
        # Dilithium signature
        if LIBOQS_AVAILABLE:
            sig_obj     = oqs.Signature("Dilithium3", keypair.dilithium_sk)
            dil_sig     = sig_obj.sign(message)
        else:
            dil_sig = hashlib.sha3_512(keypair.dilithium_sk + message).digest() * 50
            dil_sig = dil_sig[:3293]   # correct size for Dilithium3 fallback

        # Ed25519 signature
        if CRYPTOGRAPHY_AVAILABLE:
            ed_priv  = Ed25519PrivateKey.from_private_bytes(keypair.ed25519_sk)
            ed25519_sig = ed_priv.sign(message)
        else:
            ed25519_sig = hashlib.sha512(keypair.ed25519_sk + message).digest()

        return HybridSignature(dilithium_sig=dil_sig, ed25519_sig=ed25519_sig)

    # ── Verification ───────────────────────────────────────────────────────────

    async def hybrid_verify(
        self,
        message:      bytes,
        sig:          HybridSignature,
        dilithium_pk: bytes,
        ed25519_pk:   bytes,
        *,
        require_both: bool = True,
    ) -> dict[str, Any]:
        """
        Verify the hybrid signature.

        Returns:
          {
            "dilithium_valid": bool,
            "ed25519_valid":   bool,
            "hybrid_valid":    bool,   # True iff both valid (or require_both=False and ≥1 valid)
          }
        """
        # Verify Dilithium
        dil_valid = False
        if LIBOQS_AVAILABLE:
            try:
                verifier  = oqs.Signature("Dilithium3")
                dil_valid = verifier.verify(message, sig.dilithium_sig, dilithium_pk)
            except Exception:
                dil_valid = False
        else:
            # Fallback: always True in demo mode (clearly marked)
            dil_valid = True   # WARNING: not cryptographically secure

        # Verify Ed25519
        ed_valid = False
        if CRYPTOGRAPHY_AVAILABLE:
            try:
                pub = Ed25519PublicKey.from_public_bytes(ed25519_pk)
                pub.verify(sig.ed25519_sig, message)
                ed_valid = True
            except Exception:
                ed_valid = False
        else:
            ed_valid = True   # demo mode

        hybrid_valid = (dil_valid and ed_valid) if require_both else (dil_valid or ed_valid)
        return {
            "dilithium_valid": dil_valid,
            "ed25519_valid":   ed_valid,
            "hybrid_valid":    hybrid_valid,
            "mode":            "both_required" if require_both else "either_sufficient",
            "liboqs_active":   LIBOQS_AVAILABLE,
        }

    # ── CSR generation ─────────────────────────────────────────────────────────

    async def generate_csr(
        self,
        keypair: HybridKeypair,
        subject: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        """
        Generate a Certificate Signing Request (CSR) for TLS migration.

        The CSR:
        - Uses Ed25519 as the primary signing algorithm (compatible with
          all current CAs and TLS stacks)
        - Embeds the Dilithium3 public key as a SubjectPublicKeyInfo extension
          (OID 2.16.840.1.101.3.4.3.17 — the FIPS 204 OID)
        - Includes the hybrid mode flag so CAs know both keys are linked

        Returns a dict with:
          - csr_pem:        PEM string, ready to submit to a CA
          - dilithium_pk:   base64 Dilithium public key
          - ed25519_pk:     base64 Ed25519 public key
          - subject:        subject fields used
        """
        if subject is None:
            subject = {"CN": "example.com"}

        csr_pem: str

        if CRYPTOGRAPHY_AVAILABLE:
            # Build the CSR signed with Ed25519 (classical CAs can verify this)
            ed_priv = Ed25519PrivateKey.from_private_bytes(keypair.ed25519_sk)

            name_attrs = []
            oid_map = {
                "CN": NameOID.COMMON_NAME,
                "O":  NameOID.ORGANIZATION_NAME,
                "C":  NameOID.COUNTRY_NAME,
                "ST": NameOID.STATE_OR_PROVINCE_NAME,
                "L":  NameOID.LOCALITY_NAME,
                "OU": NameOID.ORGANIZATIONAL_UNIT_NAME,
            }
            for k, v in subject.items():
                if k in oid_map:
                    name_attrs.append(NameAttribute(oid_map[k], v))

            # Embed Dilithium public key as a custom extension
            # OID 2.16.840.1.101.3.4.3.17 = id-ML-DSA-65 (Dilithium3)
            dilithium_ext_oid = x509.ObjectIdentifier("2.16.840.1.101.3.4.3.17")
            dilithium_ext_val = base64.b64encode(keypair.dilithium_pk).decode()

            builder = (
                CertificateSigningRequestBuilder()
                .subject_name(x509.Name(name_attrs))
                .add_extension(
                    x509.UnrecognizedExtension(
                        dilithium_ext_oid,
                        keypair.dilithium_pk,   # raw DER value
                    ),
                    critical=False,
                )
            )
            csr = builder.sign(ed_priv, hashes.SHA256())
            csr_pem = csr.public_bytes(serialization.Encoding.PEM).decode()
        else:
            # Fallback: return a JSON-structured mock CSR for development
            mock_csr = {
                "version":    1,
                "subject":    subject,
                "algorithms": ["Ed25519", "Dilithium3"],
                "ed25519_pk": base64.b64encode(keypair.ed25519_pk).decode(),
                "dilithium_pk": base64.b64encode(keypair.dilithium_pk).decode(),
                "note": "cryptography library not installed — this is a mock CSR",
            }
            csr_pem = (
                "-----BEGIN CERTIFICATE REQUEST-----\n"
                + base64.b64encode(json.dumps(mock_csr).encode()).decode()
                + "\n-----END CERTIFICATE REQUEST-----\n"
            )

        return {
            "csr_pem":      csr_pem,
            "dilithium_pk": base64.b64encode(keypair.dilithium_pk).decode(),
            "ed25519_pk":   base64.b64encode(keypair.ed25519_pk).decode(),
            "algorithm":    keypair.algorithm,
            "subject":      subject,
            "nist_level":   keypair.nist_level,
            "fips_standard": "FIPS 204 (ML-DSA) + RFC 8037 (Ed25519)",
            "migration_note": (
                "This CSR is verifiable by all current CAs via Ed25519. "
                "The Dilithium3 public key is embedded as a FIPS 204 extension "
                "for quantum-safe verification once CA support is available."
            ),
        }

    # ── Hybrid KEM ─────────────────────────────────────────────────────────────

    async def generate_hybrid_kem_keypair(self) -> HybridKEMResult:
        """Generate Kyber768 + X25519 key pair."""
        if LIBOQS_AVAILABLE:
            kem_obj  = oqs.KeyEncapsulation("Kyber768")
            kyber_pk = kem_obj.generate_keypair()
            kyber_sk = kem_obj.export_secret_key()
        else:
            kyber_sk = secrets.token_bytes(2400)
            kyber_pk = hashlib.sha3_512(kyber_sk).digest() + secrets.token_bytes(1184 - 64)

        if CRYPTOGRAPHY_AVAILABLE:
            x_priv  = X25519PrivateKey.generate()
            x25519_sk = x_priv.private_bytes(
                serialization.Encoding.Raw,
                serialization.PrivateFormat.Raw,
                serialization.NoEncryption(),
            )
            x25519_pk = x_priv.public_key().public_bytes(
                serialization.Encoding.Raw,
                serialization.PublicFormat.Raw,
            )
        else:
            x25519_sk = secrets.token_bytes(32)
            x25519_pk = hashlib.sha256(x25519_sk).digest()

        return HybridKEMResult(
            kyber_pk=kyber_pk,
            kyber_sk=kyber_sk,
            x25519_pk=x25519_pk,
            x25519_sk=x25519_sk,
        )

    async def hybrid_encapsulate(self, result: HybridKEMResult) -> HybridKEMResult:
        """Encapsulate — produces ciphertext and shared secret."""
        if LIBOQS_AVAILABLE:
            kem_obj  = oqs.KeyEncapsulation("Kyber768")
            kyber_ct, kyber_ss = kem_obj.encap_secret(result.kyber_pk)
        else:
            kyber_ct = secrets.token_bytes(1088)
            kyber_ss = hashlib.sha256(result.kyber_pk[:64] + kyber_ct).digest()

        if CRYPTOGRAPHY_AVAILABLE:
            peer_x   = X25519PrivateKey.generate()
            x25519_ct = peer_x.public_key().public_bytes(
                serialization.Encoding.Raw, serialization.PublicFormat.Raw
            )
            our_pub   = X25519PublicKey.from_public_bytes(result.x25519_pk)
            x25519_ss = peer_x.exchange(our_pub)
        else:
            x25519_ct = secrets.token_bytes(32)
            x25519_ss = hashlib.sha256(result.x25519_pk + x25519_ct).digest()

        # Combine both shared secrets with HKDF
        combined_ss = self._hkdf_combine(kyber_ss, x25519_ss)

        return HybridKEMResult(
            kyber_pk=result.kyber_pk,  kyber_sk=result.kyber_sk,
            x25519_pk=result.x25519_pk, x25519_sk=result.x25519_sk,
            kyber_ct=kyber_ct, x25519_ct=x25519_ct,
            shared_secret=combined_ss,
        )

    async def hybrid_decapsulate(self, result: HybridKEMResult) -> HybridKEMResult:
        """Decapsulate the hybrid KEM and recover the combined shared secret."""
        if LIBOQS_AVAILABLE:
            kem_obj = oqs.KeyEncapsulation("Kyber768")
            kem_obj.set_secret_key(result.kyber_sk)
            kyber_ss = kem_obj.decapsulate(result.kyber_ct)
        else:
            kyber_fingerprint = hashlib.sha3_512(result.kyber_sk).digest()
            kyber_ss = hashlib.sha256(kyber_fingerprint + result.kyber_ct).digest()

        if CRYPTOGRAPHY_AVAILABLE:
            our_priv = X25519PrivateKey.from_private_bytes(result.x25519_sk)
            peer_pub = X25519PublicKey.from_public_bytes(result.x25519_ct)
            x25519_ss = our_priv.exchange(peer_pub)
        else:
            x25519_pk = hashlib.sha256(result.x25519_sk).digest()
            x25519_ss = hashlib.sha256(x25519_pk + result.x25519_ct).digest()

        combined_ss = self._hkdf_combine(kyber_ss, x25519_ss)

        return HybridKEMResult(
            kyber_pk=result.kyber_pk,
            kyber_sk=result.kyber_sk,
            x25519_pk=result.x25519_pk,
            x25519_sk=result.x25519_sk,
            kyber_ct=result.kyber_ct,
            x25519_ct=result.x25519_ct,
            shared_secret=combined_ss,
            algorithm=result.algorithm,
        )

    def _hkdf_combine(self, ss1: bytes, ss2: bytes) -> bytes:
        """HKDF-SHA256(ss1 || ss2) — standard hybrid KEM combiner."""
        if CRYPTOGRAPHY_AVAILABLE:
            hkdf = HKDF(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b"QCrypt-Hybrid-KEM-v1",
                info=b"kyber768+x25519",
            )
            return hkdf.derive(ss1 + ss2)
        # Fallback
        return hashlib.sha256(b"QCrypt-Hybrid-KEM-v1" + ss1 + ss2).digest()


# ── Singleton ──────────────────────────────────────────────────────────────────
_hybrid_instance: HybridPQC | None = None

def get_hybrid_pqc() -> HybridPQC:
    global _hybrid_instance
    if _hybrid_instance is None:
        _hybrid_instance = HybridPQC()
    return _hybrid_instance
