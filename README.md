---
title: QCrypt RNG
emoji: 🔐
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

**Upgrade roadmap:** [docs/UPGRADE_ROADMAP.md](docs/UPGRADE_ROADMAP.md)

**AI / Cursor session prompt:** [docs/CURSOR_OPERATOR_PROMPT.md](docs/CURSOR_OPERATOR_PROMPT.md)

---

## What it does

- **Quantum randomness** — Random bytes, keys, UUIDs, passwords, and session tokens with configurable qubit counts (8/12/16) and batch generation.
- **Quantum VRF** — Verifiable random function with a one-time quantum seed, Keccak-256 commitment (Ethereum-compatible), and commit–reveal flow; supports Ethereum, Polygon, BSC, Avalanche, Fantom.
- **Post-quantum cryptography** — Complete NIST-standardized PQC suite:
  - **Signatures**: DILITHIUM2/3/5, FALCON512/1024, SPHINCS+-SHA2-128f (FIPS 204, 205)
  - **Key Exchange**: KYBER512/768/1024, NTRU-HPS, SABER (FIPS 203)
  - Full KEM workflow: generate keypair, encapsulate, decapsulate
- **Data protection** — AES-256-GCM, AES-128-GCM, AES-256-CBC (quantum or user-supplied keys); file encryption; HMAC sign/verify; quantum-salted hashing (SHA3, PBKDF2, BLAKE2b).
- **Blockchain security** — Quantum-safe vs classical wallet comparison, Shor-based attack simulation, chain comparison, demo mining, and oracle randomness (single and batch).
- **On-chain oracle fulfillment** — Real blockchain integration for oracle requests with commit-reveal on Ethereum, Polygon, BSC, Avalanche, and Fantom.
- **Threat intelligence** — Algorithm vulnerability scanning, oracle benchmarking, and qubit-to-break estimates.
- **Quantum hardware** — Abstraction layer for real QRNG devices (ID Quantique Quantis, QuintessenceLabs qStream) with entropy quality checks.
- **Operations** — Health checks, entropy quality and hardware status, monitoring metrics; optional rate limiting and API key auth.

---

## Quick start

**Prerequisites:** Python 3.8+, Node.js 18+ (for the dashboard), pip.

**Backend:**

```bash
git clone <repository-url>
cd qcrypt-rng
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run_api.py
```

Use a **`.venv`** in the project root (not `venv/`). `scripts/start.py` also looks for `.venv/bin/python`.

API: http://localhost:9878 — Interactive docs: http://localhost:9878/docs

**Frontend:**

```bash
cd quantum-oracle-ui
npm install
npm run dev
```

Dashboard: **http://localhost:3980** by default (`quantum-oracle-ui/find-port.js` picks the next free port from 3980 upward — qcrypt-rng-specific so it avoids 3000/3040/3180 used by many stacks). Auto-discovers API on ports 9878–9882, or set `NEXT_PUBLIC_API_BASE_URL`. See `quantum-oracle-ui/env.example`.

**Production:** See [docs/PRODUCTION.md](docs/PRODUCTION.md). For Docker: `docker-compose up -d` or Kubernetes via `./deploy.sh`.

**Hugging Face Spaces:** The root `Dockerfile` is built for Spaces (Nginx + FastAPI + Next.js on port 7860). Create a Docker Space, add the Space as a remote, and push `main`; use a [HF token](https://huggingface.co/settings/tokens) with write access when prompted. The app will be available at your Space URL after the build completes.

**Hugging Face Gradio lite (IBM Runtime slice):** smaller demo using Gradio and shared backend logic — [hf_space/README.md](hf_space/README.md), [docs/HF_GRADIO_LITE.md](docs/HF_GRADIO_LITE.md), [docs/VENTURE.md](docs/VENTURE.md).

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

### Quantum Randomness Generation

| Endpoint | Description |
|----------|-------------|
| `POST /generate/bytes` | Generate random bytes |
| `POST /generate/key` | Generate cryptographic key (AES-128/256) |
| `POST /generate/uuid` | Generate quantum UUID v4 |
| `POST /generate/password` | Generate random password |
| `POST /generate/token` | Generate session token |
| `POST /generate/batch` | Batch generation |

### Post-Quantum Cryptography

**Dilithium Signatures:**
| Endpoint | Description |
|----------|-------------|
| `POST /pqc/generate` | Generate DILITHIUM keypair |
| `POST /pqc/sign` | Sign message |
| `POST /pqc/verify` | Verify signature |

**Kyber KEM:**
| Endpoint | Description |
|----------|-------------|
| `POST /pqc/kem/generate` | Generate KYBER keypair |
| `POST /pqc/kem/encapsulate` | Encapsulate shared secret |
| `POST /pqc/kem/decapsulate` | Decapsulate shared secret |
| `GET /pqc/kem/info` | KEM documentation |

**FALCON Signatures:**
| Endpoint | Description |
|----------|-------------|
| `POST /pqc/falcon/generate` | Generate FALCON keypair |

**SPHINCS+ Signatures:**
| Endpoint | Description |
|----------|-------------|
| `POST /pqc/sphincs/generate` | Generate SPHINCS+ keypair |

**NTRU KEM:**
| Endpoint | Description |
|----------|-------------|
| `POST /pqc/ntru/generate` | Generate NTRU keypair |

**SABER KEM:**
| Endpoint | Description |
|----------|-------------|
| `POST /pqc/saber/generate` | Generate SABER keypair |

**General:**
| Endpoint | Description |
|----------|-------------|
| `GET /pqc/algorithms` | List supported algorithms |
| `GET /pqc/info` | PQC information |
| `POST /pqc/threat-assessment` | Assess quantum threat |

### Oracle & On-Chain Fulfillment

**Basic Oracle:**
| Endpoint | Description |
|----------|-------------|
| `POST /oracle/request` | Request quantum randomness |
| `POST /oracle/requests/batch` | Batch oracle requests |
| `GET /oracle/status/:id` | Get request status |
| `GET /oracle/network-info` | Network status |
| `GET /oracle/benchmark` | Benchmark oracle |

**On-Chain Fulfillment:**
| Endpoint | Description |
|----------|-------------|
| `POST /oracle/fulfillment/configure-chain` | Configure blockchain |
| `POST /oracle/fulfillment/request` | Create on-chain request |
| `GET /oracle/fulfillment/status/:id` | Fulfillment status |
| `GET /oracle/fulfillment/requests` | List all requests |
| `GET /oracle/fulfillment/chains` | Supported chains |
| `POST /oracle/fulfillment/retry/:id` | Retry failed request |

**VRF:**
| Endpoint | Description |
|----------|-------------|
| `POST /oracle/vrf/seed` | Generate VRF seed |
| `POST /oracle/vrf/prove` | Generate VRF proof |
| `POST /oracle/vrf/reveal` | Reveal VRF |
| `POST /oracle/vrf/verify` | Verify VRF |

### Data Protection

| Endpoint | Description |
|----------|-------------|
| `POST /protect/encrypt` | Encrypt data (AES) |
| `POST /protect/decrypt` | Decrypt data |
| `POST /protect/encrypt-file` | Encrypt file |
| `POST /protect/decrypt-file` | Decrypt file |
| `POST /protect/sign` | HMAC sign |
| `POST /protect/verify` | HMAC verify |
| `POST /protect/hash` | Quantum-salted hash |
| `POST /protect/salt` | Generate quantum salt |

### Blockchain Security

| Endpoint | Description |
|----------|-------------|
| `POST /blockchain/create-wallet` | Create quantum wallet |
| `POST /blockchain/sign-transaction` | Sign transaction |
| `POST /blockchain/simulate-attack` | Simulate Shor attack |
| `POST /blockchain/verify-quantum-safe` | Verify quantum-safe |
| `POST /blockchain/mine-block` | Demo mining |
| `GET /blockchain/compare-blockchains` | Compare chains |

### Hardware & System

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /quantum/entropy` | Entropy quality |
| `GET /quantum/stats` | Generation statistics |
| `POST /quantum/reseed` | Reseed entropy pool |
| `GET /hardware/devices` | List hardware devices |
| `GET /monitoring/metrics` | Prometheus metrics |

Full interactive API docs: http://localhost:9878/docs (or `/swagger` when running behind the bundled Nginx).

---

## Stack

- **Backend:** FastAPI, Uvicorn, Python 3.8+
- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS
- **Quantum:** QRisp-style simulation; hardware abstraction for photonic/superconducting devices
- **Quantum Hardware:** ID Quantique Quantis, QuintessenceLabs qStream adapters
- **Crypto:** PyCryptodome (Keccak-256), `cryptography` (AES/RSA/ECDSA), liboqs-python (DILITHIUM/KYBER/FALCON/SPHINCS+/NTRU/SABER)
- **Blockchain:** web3.py for Ethereum, Polygon, BSC, Avalanche, Fantom
- **Deployment:** Docker (single image for Spaces), Docker Compose, Kubernetes

---

## Quantum Hardware Backends

QCrypt RNG supports multiple quantum hardware backends for true random number generation:

| Backend | Environment Variable | Description |
|---------|---------------------|-------------|
| `qrisp_simulator` | `QUANTUM_BACKEND=qrisp_simulator` | Quantum circuit simulation (default) |
| `idq_quantis` | `QUANTUM_BACKEND=idq_quantis` | ID Quantique Quantis (USB/PCIe/Network) |
| `qlabs_qstream` | `QUANTUM_BACKEND=qlabs_qstream` | QuintessenceLabs qStream (TCP/IP) |
| `hardware_photonic` | `QUANTUM_BACKEND=hardware_photonic` | Generic photonic QRNG |
| `hardware_superconducting` | `QUANTUM_BACKEND=hardware_superconducting` | Generic superconducting QRNG |

### Hardware Configuration

**ID Quantique Quantis:**
```bash
QUANTUM_BACKEND=idq_quantis
IDQ_DEVICE_ADDRESS=usb://0
IDQ_DEVICE_TYPE=usb  # usb, pcie, or network
IDQ_CALIBRATION_FILE=/path/to/calibration.json
```

**QuintessenceLabs qStream:**
```bash
QUANTUM_BACKEND=qlabs_qstream
QLABS_DEVICE_ADDRESS=tcp://localhost:8888
QLABS_API_KEY=your-api-key
```

### Entropy Quality Checks

The system performs NIST SP 800-90B entropy estimation:
- Chi-square uniformity test
- Shannon entropy calculation
- Min-entropy estimation
- Overall quality assessment

Access via `GET /quantum/entropy` or the dashboard Network Status section.

---

## On-Chain Oracle Fulfillment

QCrypt RNG provides real blockchain integration for oracle requests:

### Supported Chains

| Chain | Chain ID | Explorer | Features |
|-------|----------|----------|----------|
| Ethereum | 1 | etherscan.io | Mainnet, Sepolia testnet |
| Polygon | 137 | polygonscan.com | Low fees, fast confirmation |
| BSC | 56 | bscscan.com | Low fees |
| Avalanche | 43114 | snowtrace.io | Fast finality |
| Fantom | 250 | ftmscan.com | Low fees, fast |

### Fulfillment Workflow

1. **Configure Chain:** `POST /oracle/fulfillment/configure-chain`
2. **Create Request:** `POST /oracle/fulfillment/request`
3. **Automatic Fulfillment:**
   - Generate quantum randomness
   - Create commitment (keccak256)
   - Submit commit transaction
   - Wait for confirmation
   - Submit reveal transaction
   - Mark as completed

### Fulfillment Status

| Status | Description |
|--------|-------------|
| `pending` | Request created |
| `commit_submitted` | Commit transaction sent |
| `commit_confirmed` | Commit confirmed on-chain |
| `reveal_submitted` | Reveal transaction sent |
| `reveal_confirmed` | Reveal confirmed on-chain |
| `completed` | Fulfillment complete |
| `failed` | Fulfillment failed (can retry) |

### Security Notes

⚠️ **Private Key Security:**
- Never commit private keys to version control
- Use hardware wallets or KMS in production
- Store keys in environment variables or secure vaults
- Rotate keys regularly

### Testnet Deployment

For testing and development, deploy the oracle contracts to testnets:

**Supported Testnets:**
- Ethereum Sepolia (Chain ID: 11155111)
- Polygon Amoy (Chain ID: 80002)
- BSC Testnet (Chain ID: 97)
- Avalanche Fuji (Chain ID: 43113)
- Fantom Testnet (Chain ID: 4002)

**Deployment Guide:** See [docs/next-phase/TESTNET_DEPLOYMENT.md](docs/next-phase/TESTNET_DEPLOYMENT.md)

```bash
# Deploy to all testnets
cd quantum-oracle/contracts
npx hardhat run scripts/deploy-all-testnets.js --network sepolia

# Validate deployments
npx hardhat run scripts/validate-deployment.js --network sepolia
```

**Contract Addresses:** After deployment, update `.env` with contract addresses:
```bash
ORACLE_CONTRACT_SEPOLIA=0x...
ORACLE_CONTRACT_POLYGON_AMOY=0x...
# etc.
```

---

## Repository layout

| Path | Contents |
|------|----------|
| `app/` | FastAPI backend (`/api/v2`) |
| `quantum-oracle-ui/` | Next.js 16 dashboard |
| `docs/` | Technical docs, [PRODUCTION.md](docs/PRODUCTION.md), upgrade roadmaps, guides (`docs/guides/`) |
| `examples/` | Standalone sample scripts (e.g. `quantum_randomness_oracle.py`) |
| `legacy/` | Deprecated Streamlit dashboard and static HTML demos |
| `scripts/` | Dev helpers (e.g. `scripts/start.py` — API + UI) |
| `tests/unit/`, `tests/integration/` | Pytest suites |
| `tests/manual/` | Interactive check scripts (run with `python`, not pytest) |
| `client_sdk/`, `quantum-oracle/`, `k8s/` | SDK, oracle node/contracts, Kubernetes |

Entry points: `python run_api.py` (API only), `python scripts/start.py` (API + Next.js).

---

## Documentation

- [docs/README.md](docs/README.md) — index of documentation in `docs/`
- [docs/UPGRADE_ROADMAP.md](docs/UPGRADE_ROADMAP.md) — product upgrade map (monetization, platform quality, oracle)
- In-app documentation: `/docs` in the web dashboard
- [docs/PRODUCTION.md](docs/PRODUCTION.md) — deployment and operations
- [Python SDK](client_sdk/python/README.md) — client library
- [docs/IMPLEMENTATION_SUMMARY_2026.md](docs/IMPLEMENTATION_SUMMARY_2026.md) — Phase 1 implementation details
- [docs/NEXT_STEPS_PHASE2.md](docs/NEXT_STEPS_PHASE2.md) — Phase 2 roadmap

---

## License

MIT License.
