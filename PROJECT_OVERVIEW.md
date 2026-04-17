# QCrypt RNG — Project Overview

A high-level explanation of what QCrypt RNG is, what it does, and how it is built.

---

## What Is QCrypt RNG?

**QCrypt RNG** is a platform for **quantum-enhanced randomness** and **post-quantum cryptography**. It exposes a REST API and web UI for:

- Generating cryptographically secure random data using quantum-style entropy
- Running NIST-standard post-quantum algorithms (signatures and key exchange)
- Providing a verifiable random function (VRF) for blockchains
- Encrypting and protecting data with quantum-derived keys

It is intended for developers, researchers, and teams building quantum-resistant or blockchain-facing applications.

---

## Core Capabilities

### 1. Quantum Random Number Generation (QRNG)

- **Random bytes** — Configurable length and qubit count (8/12/16)
- **Keys** — AES, RSA, ECDSA keys with quantum entropy
- **UUIDs** — RFC 4122 v4 UUIDs
- **Passwords** — Configurable length and character sets
- **Session tokens** — URL-safe, with optional expiry
- **Batch mode** — Multiple samples in parallel

**How it works:** The system uses a pluggable backend (simulation, Qrisp, or real hardware). Random values are obtained from a hardware abstraction layer, post-processed with SHA3-256, and mixed with system entropy. Results are stored in an entropy pool for quality checks (Shannon entropy, min-entropy, chi-square).

---

### 2. Post-Quantum Cryptography (PQC)

Supports NIST-standard algorithms via **liboqs** (with fallbacks when liboqs is not available).

**Signature schemes:**

- **DILITHIUM** — Level 2, 3, 5
- **FALCON** — 512 / 1024
- **SPHINCS+** — Hash-based variant (e.g., SHA2-128f)

**Key encapsulation (KEM):**

- **Kyber** — 512 / 768 / 1024
- **NTRU-HPS** — 2048-509, 2048-677
- **SABER** — LIGHTSABER, SABER, FIRESABER

The Kyber KEM flow includes:

1. Recipient generates a keypair
2. Sender encapsulates a shared secret with the recipient’s public key
3. Recipient decapsulates with their private key
4. Both derive the same shared secret for symmetric cryptography

---

### 3. Quantum VRF (Verifiable Random Function)

A VRF backed by quantum entropy with a **commit–reveal** flow:

1. **Seed** — 32-byte quantum seed is generated and committed via Keccak-256
2. **Prove** — For any input (alpha), output = Keccak256(seed || alpha)
3. **Reveal** — Seed is revealed so anyone can verify
4. **Verify** — Checks that commitment and output match the seed and alpha

The Keccak-256 format is compatible with Ethereum/Solidity.

---

### 4. On-Chain Oracle Fulfillment

Supports submit-and-fulfill oracle randomness on blockchains:

- **Chains:** Ethereum, Polygon, BSC, Avalanche, Fantom
- **Flow:** Configure chain (RPC, private key, explorer), create request, commit on-chain, reveal randomness
- **Status:** Track PENDING → COMMIT_SUBMITTED → REVEAL_CONFIRMED → COMPLETED
- **Retry:** Retry failed fulfillments

---

### 5. Data Protection

- **Encryption** — AES-256-GCM, AES-128-GCM, AES-256-CBC (quantum or user keys)
- **File encryption** — Up to 10 MB
- **Signing** — HMAC-SHA256, HMAC-SHA512
- **Hashing** — SHA3-256, SHA3-512, PBKDF2-SHA256, BLAKE2b-256
- **Salt** — Quantum-generated salts for hashing

---

### 6. Blockchain Security Tools

- **Wallet creation** — Compare classical (ECDSA) vs quantum-safe (DILITHIUM/KYBER) wallets
- **Attack simulation** — Simulate Shor’s algorithm on RSA, ECDSA, DILITHIUM, KYBER
- **Blockchain comparison** — Side-by-side vulnerable vs quantum-safe chain models
- **Demo mining** — Proof-of-work-style mining for both types

---

### 7. Threat Intelligence

- **Algorithm assessment** — “Qubits to break” and migration guidance for RSA, ECDSA, etc.
- **Oracle benchmark** — Latency and throughput
- **Entropy quality** — Shannon entropy, min-entropy, chi-square, autocorrelation

---

### 8. Quantum Hardware Abstraction

Pluggable backends for different sources:

- **Simulation** — Classical fallback for dev/demo
- **Qrisp** — Quantum simulation when available
- **ID Quantique Quantis** — Photonic QRNG (USB, PCIe, network)
- **QuintessenceLabs qStream** — Photonic QRNG over TCP/IP

Includes entropy quality checks (NIST SP 800-90B–style analysis).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js Dashboard (quantum-oracle-ui)                       │
│  Port 3000 (dev) / served by Nginx (prod)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FastAPI Backend (app/)                                      │
│  Port 8000 | Base path: /api/v2                              │
├─────────────────────────────────────────────────────────────┤
│  Endpoints:                                                  │
│  - /generate/*    Quantum RNG                                │
│  - /protect/*     Encryption, signing, hashing               │
│  - /pqc/*         Post-quantum crypto (incl. KEM)            │
│  - /oracle/*      VRF, oracle requests, fulfillment         │
│  - /blockchain/*  Wallets, attack sim, mining                │
│  - /quantum/*     Entropy, stats, reseed                     │
│  - /hardware/*    Device list, benchmark, connect            │
│  - /monitoring/*  Metrics, analytics                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Core Modules (app/quantum/, app/blockchain/)                │
│  - qrng.py            Quantum RNG engine                     │
│  - commitment.py      Keccak-256 commitments                 │
│  - pqc.py             liboqs PQC (Dilithium, Kyber, etc.)    │
│  - hardware_interface │ Photonic, superconducting, simulated │
│  - oracle_service.py  On-chain fulfillment                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer        | Technology                                      |
|-------------|--------------------------------------------------|
| Backend     | Python 3.8+, FastAPI, Uvicorn                    |
| Frontend    | Next.js 16, React, TypeScript, Tailwind CSS      |
| Quantum     | Qrisp (optional), custom hardware abstraction   |
| Crypto      | PyCryptodome (Keccak), cryptography, liboqs     |
| Deployment  | Docker (single image), Compose, Kubernetes       |
| Monitoring  | Prometheus metrics, analytics service            |

---

## Project Layout

```
qcrypt-rng/
├── app/                    # FastAPI backend
│   ├── api/v2/endpoints/   # REST routes
│   ├── quantum/            # QRNG, PQC, commitment, hardware
│   ├── blockchain/         # Chain adapters, oracle service
│   ├── utils/              # Logging, monitoring, middleware
│   └── config.py
├── quantum-oracle-ui/       # Next.js dashboard
│   └── src/
│       ├── app/            # Pages
│       ├── components/     # Protect, QuantumOracle, etc.
│       ├── utils/          # API client
│       └── types/
├── tests/                  # Unit and integration tests
├── docs/                   # Technical paper, plan, overview
├── quantum-oracle/          # Oracle node, contracts, SDKs
├── client_sdk/python/      # Python client library
├── k8s/                    # Kubernetes manifests
├── run_api.py              # Start API server
├── requirements.txt
└── Dockerfile              # Single image for production
```

---

## Running the Project

**Backend:**
```bash
pip install -r requirements.txt
python run_api.py
```
→ API at http://localhost:8000, docs at http://localhost:8000/docs

**Dashboard:**
```bash
cd quantum-oracle-ui && npm install && npm run dev
```
→ Dashboard at http://localhost:3000 (uses API on 8000–8004 by default)

**Production:** `docker-compose up -d` or `./deploy.sh` (Kubernetes)

**Hugging Face Spaces:** Use root `Dockerfile` for a Docker Space on port 7860.

---

## Security Notes

- Simulation and classical fallback are for development/demo only.
- Use a validated QRNG or trusted HRNG in production.
- VRF seeds are kept in memory; consider hardened storage for high assurance.
- Private keys for on-chain fulfillment must be stored and handled securely (no production keys in demos).
- Enable rate limiting and API key auth in production.

---

## Related Documents

- [README.md](../README.md) — Quick start and API summary
- [TECHNICAL_PAPER.md](TECHNICAL_PAPER.md) — Architecture and algorithms
- [PRODUCTION.md](../PRODUCTION.md) — Deployment and operations
- [NEXT_STEPS.md](NEXT_STEPS.md) — Completed roadmap
- [NEXT_STEPS_PHASE2.md](NEXT_STEPS_PHASE2.md) — Phase 2 roadmap
- [DASHBOARD_MONITORING_PLAN.md](DASHBOARD_MONITORING_PLAN.md) — UI and monitoring plan

---

*Last updated: 2026-03-06*
