# QCrypt RNG: Technical Paper

**Quantum-Enhanced Random Number Generation, Post-Quantum Cryptography, and Blockchain Security Platform**

---

## Abstract

QCrypt RNG is a software platform that provides cryptographically secure randomness and quantum-resistant security primitives through a unified REST API and web dashboard. The system combines (1) quantum-backed random number generation via simulation and a hardware abstraction layer for real devices, (2) a verifiable random function (VRF) using a quantum seed and Keccak-256 commit–reveal compatible with Ethereum and other EVM chains, (3) NIST-standardized post-quantum cryptography (DILITHIUM, KYBER), (4) data protection (symmetric encryption, signing, hashing) using quantum entropy, and (5) threat intelligence and blockchain security tooling. This document describes the architecture, algorithms, and security properties of the platform.

**Keywords:** quantum random number generation, QRNG, post-quantum cryptography, PQC, verifiable random function, VRF, commit-reveal, blockchain oracle, Keccak-256, DILITHIUM, KYBER.

---

## 1. Introduction

### 1.1 Motivation

Cryptographic systems depend on high-quality randomness for keys, nonces, and seeds. Classical pseudorandom number generators (PRNGs) are deterministic and, if seeded weakly, can be predictable. Hardware random number generators (HRNGs) improve on this but may introduce bias or correlation. Quantum random number generators (QRNGs) exploit the inherent indeterminacy of quantum measurement to provide information-theoretically strong entropy. Deploying such entropy in practice requires a coherent stack: generation, post-processing, commitment schemes for oracles, and integration with post-quantum and classical cryptography.

At the same time, the threat of large-scale quantum computers motivates migration to post-quantum cryptography (PQC). NIST has standardized signature schemes (e.g., DILITHIUM) and key encapsulation mechanisms (e.g., KYBER). Applications that combine quantum entropy with PQC can strengthen both randomness and long-term confidentiality and authenticity.

Blockchain applications often need verifiable, unpredictable randomness (e.g., for consensus, lotteries, or NFT mints). A quantum-backed VRF with a commit–reveal flow provides verifiability and auditability while tying the entropy source to quantum measurement.

### 1.2 Scope

This paper covers the QCrypt RNG platform as implemented: quantum RNG (simulation and hardware abstraction), quantum VRF and randomness oracle, post-quantum cryptography, data protection, threat intelligence, and deployment model. It does not certify compliance with any particular standard or regulation.

---

## 2. System Architecture

### 2.1 Overview

The platform is split into:

- **Backend:** FastAPI application exposing REST endpoints under `/api/v2`, backed by Python modules for quantum RNG, commitments, PQC, and protection.
- **Frontend:** Next.js dashboard for interactive use and in-app documentation.
- **Deployment:** Single Docker image (Nginx reverse proxy, FastAPI, Next.js) for cloud or Hugging Face Spaces; optional Docker Compose and Kubernetes for self-hosted deployment.

Nginx listens on a single port (e.g., 7860), routing `/api/*` and `/health` to FastAPI and all other paths to the Next.js server.

### 2.2 Component Map

| Component        | Responsibility |
|-----------------|----------------|
| `app/quantum/qrng.py` | Core QRNG: simulation, hardware abstraction, entropy pool, post-processing, entropy analysis. |
| `app/quantum/commitment.py` | Keccak-256 commitments (Ethereum-compatible); VRF output computation. |
| `app/quantum/pqc.py` | Post-quantum crypto via liboqs (DILITHIUM, KYBER, etc.); fallback when liboqs unavailable. |
| `app/quantum/hardware_interface.py` | Abstract interface for photonic, superconducting, and simulated devices. |
| `app/api/v2/endpoints/vrf.py` | VRF seed, prove, reveal, verify. |
| `app/api/v2/endpoints/oracle.py` | Oracle randomness request (single and batch), status, benchmark. |
| `app/api/v2/endpoints/protect.py` | Encrypt/decrypt, sign/verify, hash, salt. |
| `app/api/v2/endpoints/pqc_endpoints.py` | PQC key generation, sign, verify, threat assessment. |

Configuration (backend, qubit limits, entropy pool size, rate limits, etc.) is centralized in `app/config.py` and driven by environment variables.

---

## 3. Quantum Random Number Generation

### 3.1 Backends

The RNG supports multiple backends:

- **qrisp_simulator:** When the Qrisp library is available, qubits are modeled with a `QuantumFloat`, Hadamard gates put them in uniform superposition, and measurement yields a random integer. This simulates ideal quantum measurement.
- **Hardware:** When configured for `hardware_photonic` or `hardware_superconducting`, the hardware abstraction layer is used. Real devices would be connected via the same interface; the current codebase provides simulated hardware implementations for development and testing.
- **Simulation fallback:** If neither Qrisp nor hardware is used, a classical simulation produces one random bit per “qubit” via `secrets.randbits(1)`, then combines them into an integer. This is not quantum but provides strong randomness for local and demo use.

### 3.2 Generation Pipeline

For each request the system:

1. Validates byte count (capped by tier) and qubit count (e.g., 1–16).
2. Produces random bytes by repeatedly:
   - Obtaining a quantum (or simulated) measurement of `num_qubits` bits from the hardware manager.
   - Post-processing the value with SHA3-256, mixing in system entropy and a timestamp, to obtain 32 bytes per iteration.
   - Appending to the output until the requested length is reached.
3. Updates an internal entropy pool with the raw measurements for later analysis.
4. Formats the result as hex, base64, array, or raw bytes.

Post-processing ensures uniform distribution and reduces bias or correlation that might come from a real device. The use of SHA3-256 and extra entropy aligns with common practice for cryptographic RNG output.

### 3.3 Entropy Pool and Analysis

Measurements are stored in a ring buffer (entropy pool) of configurable size (e.g., 1000). The pool is used for:

- **Entropy analysis:** Shannon entropy, min-entropy, chi-square test, autocorrelation, and bit balance. Results are exposed via `/quantum/entropy` and used in health checks.
- **Health status:** The pool is marked as having insufficient data until a minimum number of samples (e.g., 100) is available; thereafter a status such as “excellent” or “good” is derived from the statistical tests.

Reseeding clears the pool and refills it with fresh generations to support operational recovery and testing.

### 3.4 Derived Primitives

The same core `generate_bytes` is used to implement:

- **Keys:** AES/RSA/ECDSA key sizes; bytes generated and returned in the requested format (e.g., hex, PEM for RSA/ECDSA).
- **UUIDs:** 16 quantum random bytes formatted as UUID v4 (version and variant bits set correctly).
- **Passwords:** Configurable length and character set; strength metrics are derived from entropy (e.g., bits of entropy).
- **Session tokens:** Random bytes in base64 or hex, optionally URL-safe.
- **Batch generation:** Multiple byte-generation requests in parallel for throughput.

All of these are exposed via the Generation API and the dashboard.

---

## 4. Quantum VRF and Commit–Reveal

### 4.1 Design

The quantum VRF provides:

- A **one-time quantum seed** (32 bytes) generated by the QRNG.
- A **commitment** to that seed using Keccak-256, in a form compatible with Solidity `abi.encodePacked(uint256)` so that on-chain verification matches.
- A **deterministic output** for a given input (alpha): `output = Keccak256(seed || alpha)`.
- **Verification** after reveal: anyone with the seed can check that the commitment and the output match the seed and alpha.

The seed is stored server-side keyed by a `request_id` until the client calls reveal. After reveal, the seed is still stored so that historical proofs can be verified via the verify endpoint.

### 4.2 Commitment Format

In `app/quantum/commitment.py`:

- **Commitment:** The 32-byte seed is interpreted as a big-endian unsigned integer, re-encoded as 32 bytes big-endian, then hashed with Keccak-256. This matches the Solidity expression `keccak256(abi.encodePacked(uint256(randomness)))`.
- **VRF output:** `Keccak256(seed_bytes || alpha_utf8_bytes)`. Alpha is an arbitrary string (e.g., round ID, nonce).

Both commitment and VRF output are exposed as `0x`-prefixed hex strings for use in contracts and tooling.

### 4.3 API Flow

1. **POST /oracle/vrf/seed** — Server generates 32-byte quantum seed, computes commitment, stores seed under a new `request_id`, returns `request_id` and `commitment`.
2. **POST /oracle/vrf/prove** — Client sends `request_id` and `alpha`; server returns `output = Keccak256(seed || alpha)` and the stored `commitment`.
3. **POST /oracle/vrf/reveal** — Client sends `request_id`; server returns the seed (hex) and marks it revealed.
4. **POST /oracle/vrf/verify** — Client sends `commitment`, `alpha`, `output`, and `seed`; server checks that the commitment and output match the seed and alpha and returns a validity flag.

This gives a full commit–prove–reveal–verify cycle suitable for oracles and smart contracts that consume the VRF output and optionally verify the commitment on-chain.

---

## 5. Quantum Randomness Oracle

### 5.1 Single Request

The oracle endpoint **POST /oracle/request** simulates a blockchain-oriented randomness request:

- The server generates quantum randomness (configurable bytes and qubits).
- It computes the same Ethereum-compatible Keccak-256 commitment as in the VRF.
- It returns a `request_id`, commitment (if requested), estimated completion blocks, fee, and status. In a production deployment this would be wired to an actual chain (e.g., submit a transaction, fulfill via callback).

Optional parameters include `target_chain` and `scheduled_delivery_block` for multi-chain and timing semantics.

### 5.2 Batch Requests

**POST /oracle/requests/batch** accepts a count, byte length, qubit count, and optional chain/block. The server generates that many quantum samples and returns a list of request identifiers and commitments (and optionally full randomness). This supports use cases such as fair mints or lotteries that need multiple independent random values.

### 5.3 Status and Benchmark

- **GET /oracle/status/:id** — Returns fulfillment status and, when available, the revealed randomness for a given request ID.
- **GET /oracle/benchmark** — Returns performance metrics (e.g., latency, throughput) for the oracle path.

---

## 6. Post-Quantum Cryptography

### 6.1 Algorithms

The PQC module uses liboqs when available. Supported algorithms include:

- **Signatures:** DILITHIUM2/3/5, FALCON512/1024, SPHINCS+-SHA2-128f.
- **Key encapsulation:** KYBER512/768/1024, NTRU-HPS variants, SABER variants.

Each algorithm has an associated NIST security level and key/signature size. The implementation exposes key generation, signing, and verification (and KEM operations where applicable).

### 6.2 Fallback

If liboqs is not installed or fails to load, the code falls back to a simulated implementation (e.g., random “keys” and hash-based “signatures”) so that the API and dashboard remain usable. This fallback is not cryptographically secure and is intended only for development and demos.

### 6.3 Threat Assessment

The API can perform a threat assessment for a given algorithm (or set of algorithms), reporting approximate “qubits to break” and migration guidance. This supports planning for post-quantum migration.

---

## 7. Data Protection

### 7.1 Encryption

Data protection uses quantum-generated or user-supplied keys:

- **Symmetric encryption:** AES-256-GCM, AES-128-GCM, AES-256-CBC. For GCM, the ciphertext is (IV, ciphertext, tag). For CBC, PKCS7 padding is applied and an HMAC-SHA256 tag over IV and ciphertext is stored for integrity.
- **Key and IV:** Either generated by the QRNG or supplied by the client (e.g., bring-your-own-key).
- **File encryption:** Same algorithms applied to uploaded files (e.g., up to 10 MB), with original filename preserved in metadata where applicable.

Decryption requires the same key, IV, and tag (and algorithm) and validates integrity where supported.

### 7.2 Signing and Hashing

- **Signing:** HMAC-SHA256 or HMAC-SHA512 with quantum-generated or user-supplied keys. A verify endpoint checks signatures without requiring the full protection flow.
- **Hashing:** SHA3-256, SHA3-512, PBKDF2-SHA256, BLAKE2b-256. Salts are generated by the QRNG when not supplied. Iterations for PBKDF2 are configurable (e.g., 10k–1M). Supports both “data hash” and “password” modes for key derivation and password hashing.

These primitives are exposed under `/protect/*` and are intended for integration with applications that need confidentiality, integrity, and quantum-salted hashing.

---

## 8. Blockchain Security and Threat Intelligence

### 8.1 Blockchain Tooling

The platform includes demo/simulation endpoints for:

- **Wallet creation:** Classical (ECDSA) and quantum-safe (e.g., DILITHIUM) wallet profiles for comparison.
- **Transaction signing:** Signing with ECDSA or PQC for demonstration.
- **Attack simulation:** Simulating Shor’s algorithm against RSA/ECDSA to illustrate quantum threat (e.g., qubit counts to break).
- **Blockchain comparison:** Side-by-side comparison of a “vulnerable” chain (classical) and a “quantum-safe” chain (PQC).
- **Mining demo:** A minimal proof-of-work style mining step for education.

These are in-memory or simulated and are not connected to live networks.

### 8.2 Threat Intelligence

Threat intelligence features include:

- **Algorithm scanning:** Assessing algorithms for quantum vulnerability and reporting qubits-to-break and recommendations.
- **Oracle benchmark:** Measuring latency and throughput of the oracle path.
- **Entropy quality:** Exposing entropy analysis (Shannon, min-entropy, chi-square, etc.) for operational monitoring.

Results are available via API and the dashboard (e.g., collapsible sections, download/copy).

---

## 9. Deployment and API Summary

### 9.1 Deployment

- **Local:** Run FastAPI (e.g., `python run_api.py` or `uvicorn app.main:app`) and the Next.js dev server; dashboard and API run on separate ports.
- **Docker:** The root `Dockerfile` builds a single image with Nginx, FastAPI, and the Next.js standalone app. Nginx listens on port 7860 (configurable), suitable for Hugging Face Spaces or any host that expects a single port.
- **Kubernetes / Compose:** Optional manifests and Compose files for multi-replica or multi-service deployment.

Configuration is environment-based (e.g., `REQUIRE_API_KEY`, `QUANTUM_BACKEND`, `ENTROPY_POOL_SIZE`).

### 9.2 API Base and Documentation

- All v2 endpoints are under `/api/v2` (e.g., `/api/v2/generate/bytes`, `/api/v2/oracle/vrf/seed`).
- OpenAPI schema at `/openapi.json`; interactive docs at `/docs` (or `/swagger` when behind the bundled Nginx).
- Health: `GET /health` includes entropy pool and backend checks.

---

## 10. Security Considerations

- **Entropy source:** In production, randomness should come from a validated QRNG or a mix of quantum and trusted HRNG; simulation and classical fallback are for development and demonstration only.
- **VRF seed storage:** VRF seeds are held in process memory. For high-assurance deployments, consider hardened storage, access control, and audit logging.
- **Commitment binding:** The commit–reveal scheme binds the server to the revealed seed; verification is possible only after reveal. Use of a TEE or multi-party computation could strengthen the model.
- **PQC:** Algorithm selection and key lifecycle should follow current NIST and organizational guidance; the platform provides the primitives, not a certified implementation.
- **Keys and secrets:** API keys, encryption keys, and tokens must be managed and rotated according to policy; the platform does not implement a full HSM or key-management system.
- **Rate limiting and auth:** Optional rate limiting and API key checks can be enabled to reduce abuse and enforce tier limits.

---

## 11. Conclusion and Future Work

QCrypt RNG provides an integrated platform for quantum-backed randomness, a Keccak-256-based VRF and oracle, post-quantum cryptography, and data protection, with a web dashboard and REST API suitable for demos, development, and deployment to cloud or Spaces.

Possible future work includes: integration with real quantum hardware and certification of entropy quality; on-chain integration (e.g., verified fulfillment on specific L1/L2); formal verification of the VRF and commitment logic; and expanded PQC and threat-assessment coverage.

---

## References

1. NIST FIPS 203, 204, 205 (Module-Lattice-Based Key Encapsulation and Signatures).
2. Ethereum Yellow Paper / EVM semantics for `abi.encodePacked` and Keccak-256.
3. NIST SP 800-90 series (Recommendations for Random Number Generation).
4. QRisp: https://qrisp.eu/ (quantum simulation framework).
5. Open Quantum Safe (liboqs): https://openquantumsafe.org/.

---

*Document version: 1.0. Last updated to match the QCrypt RNG codebase as of the technical review date.*
