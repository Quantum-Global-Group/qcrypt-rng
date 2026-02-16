---
title: QCrypt RNG
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# QCrypt RNG

**Quantum-enhanced random number generation, post-quantum cryptography, and blockchain security.**

QCrypt RNG is a platform for cryptographically secure randomness and quantum-resistant security. It provides a REST API and web dashboard for quantum-backed entropy, NIST-standard post-quantum algorithms, a verifiable random function (VRF) oracle for blockchains, data protection tools, and threat intelligence. The stack runs as a single Docker image and is deployable to cloud or Hugging Face Spaces.

**Live demo:** [Hugging Face Spaces](https://huggingface.co/spaces/rocRevyAreGoals15/qcrypt-rng)

---

## What it does

- **Quantum randomness** — Random bytes, keys, UUIDs, passwords, and session tokens with configurable qubit counts (8/12/16) and batch generation.
- **Quantum VRF** — Verifiable random function with a one-time quantum seed, Keccak-256 commitment (Ethereum-compatible), and commit–reveal flow; supports Ethereum, Polygon, BSC, Avalanche, Fantom.
- **Post-quantum cryptography** — DILITHIUM2/3/5 signatures and KYBER512/768/1024 key exchange with threat assessment and migration guidance.
- **Data protection** — AES-256-GCM, AES-128-GCM, AES-256-CBC (quantum or user-supplied keys); file encryption; HMAC sign/verify; quantum-salted hashing (SHA3, PBKDF2, BLAKE2b).
- **Blockchain security** — Quantum-safe vs classical wallet comparison, Shor-based attack simulation, chain comparison, demo mining, and oracle randomness (single and batch).
- **Threat intelligence** — Algorithm vulnerability scanning, oracle benchmarking, and qubit-to-break estimates.
- **Operations** — Health checks, entropy quality and hardware status, monitoring metrics; optional rate limiting and API key auth.

---

## Quick start

**Prerequisites:** Python 3.8+, Node.js 18+ (for the dashboard), pip.

**Backend:**

```bash
git clone <repository-url>
cd qcrypt-rng
pip install -r requirements.txt
python run_api.py
```

API: http://localhost:8000 — Interactive docs: http://localhost:8000/docs

**Frontend:**

```bash
cd quantum-oracle-ui
npm install
npm run dev
```

Dashboard: http://localhost:3000 (auto-discovers API on ports 8000–8004, or set `NEXT_PUBLIC_API_BASE_URL`).

**Production:** See [PRODUCTION.md](PRODUCTION.md). For Docker: `docker-compose up -d` or Kubernetes via `./deploy.sh`.

**Hugging Face Spaces:** The root `Dockerfile` is built for Spaces (Nginx + FastAPI + Next.js on port 7860). Create a Docker Space, add the Space as a remote, and push `main`; use a [HF token](https://huggingface.co/settings/tokens) with write access when prompted. The app will be available at your Space URL after the build completes.

---

## Web dashboard

The dashboard has five sections and an in-app Docs link:

| Section | Capabilities |
|--------|----------------|
| Blockchain Security | Wallet creation, VRF proof generation and verification, supported chains |
| Data Protection | Encrypt/decrypt (text and file), sign/verify, hash, PQC key generation and sign/verify |
| Key and Entropy Tools | Random bytes, keys, UUIDs, passwords, tokens, batch generation, oracle requests |
| Threat Intelligence | Algorithm scanning, attack simulation, blockchain comparison, benchmarks |
| Network Status | Platform health, entropy quality, hardware status, oracle request lookup |

Each card includes an info popover; collapsible sections are used for dense workflows.

---

## API reference

Base path: `/api/v2`.

| Area | Endpoints |
|------|-----------|
| **Generation** | `POST /generate/bytes`, `/generate/key`, `/generate/uuid`, `/generate/password`, `/generate/token`, `/generate/batch` |
| **Data Protection** | `POST /protect/encrypt`, `/protect/decrypt`, `/protect/encrypt-file`, `/protect/decrypt-file`, `/protect/sign`, `/protect/verify`, `/protect/hash`, `/protect/salt` |
| **Post-quantum** | `POST /pqc/generate`, `/pqc/sign`, `/pqc/verify`; `GET /pqc/algorithms`, `/pqc/info`; `POST /pqc/threat-assessment` |
| **Oracle and VRF** | `POST /oracle/request`, `/oracle/requests/batch`; `GET /oracle/status/:id`, `/oracle/network-info`, `/oracle/benchmark`; `POST /oracle/vrf/seed`, `/oracle/vrf/prove`, `/oracle/vrf/reveal`, `/oracle/vrf/verify` |
| **Blockchain** | `POST /blockchain/create-wallet`, `/blockchain/sign-transaction`, `/blockchain/simulate-attack`, `/blockchain/verify-quantum-safe`, `/blockchain/mine-block`; `GET /blockchain/compare-blockchains` |
| **System** | `GET /health`, `/quantum/entropy`, `/quantum/stats`; `POST /quantum/reseed`; `GET /hardware/devices`, `/monitoring/metrics` |

Full interactive API docs: http://localhost:8000/docs (or `/swagger` when running behind the bundled Nginx).

---

## Stack

- **Backend:** FastAPI, Uvicorn, Python 3.8+
- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS
- **Quantum:** QRisp-style simulation; hardware abstraction for photonic/superconducting devices
- **Crypto:** PyCryptodome (Keccak-256), `cryptography` (AES/RSA/ECDSA), liboqs-python (DILITHIUM/KYBER)
- **Deployment:** Docker (single image for Spaces), Docker Compose, Kubernetes

---

## Documentation

- In-app documentation: `/docs` in the web dashboard
- [PRODUCTION.md](PRODUCTION.md) — deployment and operations
- [Python SDK](client_sdk/python/README.md) — client library

---

## License

MIT License.
