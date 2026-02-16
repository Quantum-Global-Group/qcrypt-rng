# QCrypt RNG - Quantum Security and Blockchain Resilience Platform

Enterprise-grade quantum-enhanced random number generation, post-quantum cryptography, blockchain security tools, and a verifiable random function (VRF) oracle -- with a real-time web dashboard and comprehensive REST API.

## Overview

QCrypt RNG provides cryptographically secure randomness using quantum simulation with pathways for real quantum hardware integration. The platform covers five areas:

- **Blockchain Security** -- Quantum-safe wallets, quantum VRF (verifiable random function) with commit-reveal, and multi-chain oracle support.
- **Data Protection** -- AES encryption (GCM/CBC) with quantum keys, file encryption, HMAC signing, quantum-salted hashing, and NIST post-quantum cryptography (DILITHIUM/KYBER).
- **Key and Entropy Tools** -- Random bytes, cryptographic keys, UUIDs, passwords, session tokens, and batch generation with configurable qubit counts.
- **Threat Intelligence** -- Algorithm vulnerability scanning, quantum attack simulation, blockchain comparison, and oracle benchmarking.
- **Network Status** -- Real-time health monitoring, entropy quality metrics, hardware device status, and oracle request tracking.

## Key Features

### Quantum Randomness
- Random bytes, keys, UUIDs, passwords, and session tokens with quantum-enhanced entropy
- Batch generation with parallel processing for high-volume use cases
- Configurable qubit counts (8/12/16) and output formats (hex, base64, array, PEM)

### Quantum VRF (Verifiable Random Function)
- One-time quantum seed with Keccak-256 commitment (Ethereum-compatible)
- Deterministic output per input (alpha) with full verifiability
- 3-step flow: seed, prove, reveal -- anyone can verify after reveal
- Multi-chain support: Ethereum, Polygon, BSC, Avalanche, Fantom

### Post-Quantum Cryptography
- DILITHIUM2/3/5 signatures and KYBER512/768/1024 key exchange (NIST-standardized)
- Generate, sign, and verify with quantum-resistant algorithms
- Algorithm threat assessment with qubits-to-break and migration recommendations

### Data Protection
- AES-256-GCM, AES-128-GCM, and AES-256-CBC encryption with quantum or custom keys
- File encryption up to 10 MB with original filename preservation
- HMAC-SHA256/SHA512 signing with standalone verification
- Quantum-salted hashing: SHA3-256, SHA3-512, PBKDF2-SHA256, BLAKE2b-256
- Password hashing with configurable iterations (10k-1M)

### Blockchain Security
- Classical vs quantum-safe wallet comparison (ECDSA vs DILITHIUM)
- Quantum attack simulation (Shor's algorithm on RSA/ECDSA)
- Side-by-side blockchain comparison and demo mining
- Oracle randomness requests with commit-reveal and batch support

### Hardware Integration
- Hardware abstraction layer for photonic and superconducting quantum devices
- Same API for both simulation and real hardware modes
- Device status monitoring and performance benchmarking

### Enterprise Features
- Rate limiting (Free/Pro/Enterprise tiers), API key management, usage tracking
- Real-time monitoring and analytics
- Docker and Kubernetes deployment ready

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+ (for the web dashboard)
- pip package manager

### Backend (API Server)

```bash
git clone <repository-url>
cd qcrypt-rng
pip install -r requirements.txt
python run_api.py
```

The API server starts on http://localhost:8000. Interactive API docs at http://localhost:8000/docs.

### Frontend (Web Dashboard)

```bash
cd quantum-oracle-ui
npm install
npm run dev
```

The dashboard starts on http://localhost:3000. It auto-discovers the API on ports 8000-8004, or set `NEXT_PUBLIC_API_BASE_URL`.

### Production Deployment

```bash
docker-compose up -d
# or Kubernetes
./deploy.sh
```

See [PRODUCTION.md](PRODUCTION.md) for full deployment instructions.

## Web Dashboard

The dashboard at `/` has five tabs with a "Docs" link in the header for in-app documentation:

| Tab | What it does |
|-----|-------------|
| **Blockchain Security** | Create wallets, generate/verify VRF proofs, supported chains display |
| **Data Protection** | Encrypt/decrypt (text + file), sign/verify, hash, PQC key gen + sign/verify |
| **Key and Entropy Tools** | Random bytes, keys, UUIDs, passwords, tokens, batch generation, oracle requests |
| **Threat Intelligence** | Algorithm scanning, attack simulation, blockchain comparison, benchmarks |
| **Network Status** | Platform health, entropy quality, hardware status, oracle request lookup |

Every card has an **(i)** info popover with a description and use cases. Collapsible sections keep the interface clean.

## API Reference

All endpoints are under `/api/v2`.

### Generation
| Endpoint | Description |
|----------|-------------|
| `POST /generate/bytes` | Random bytes (hex/base64/array) |
| `POST /generate/key` | AES/RSA/ECDSA keys (base64/hex/pem) |
| `POST /generate/uuid` | Quantum UUIDs (up to 50) |
| `POST /generate/password` | Configurable passwords with strength analysis |
| `POST /generate/token` | Session tokens with expiry |
| `POST /generate/batch` | Batch random bytes (parallel) |

### Data Protection
| Endpoint | Description |
|----------|-------------|
| `POST /protect/encrypt` | AES encrypt text (GCM/CBC, custom key) |
| `POST /protect/decrypt` | AES decrypt text |
| `POST /protect/encrypt-file` | AES encrypt file (up to 10 MB) |
| `POST /protect/decrypt-file` | Decrypt file |
| `POST /protect/sign` | HMAC-SHA256/512 sign |
| `POST /protect/verify` | HMAC verify |
| `POST /protect/hash` | Quantum-salted hash (SHA3/PBKDF2/BLAKE2b) |
| `POST /protect/salt` | Generate quantum salt |

### Post-Quantum Cryptography
| Endpoint | Description |
|----------|-------------|
| `POST /pqc/generate` | DILITHIUM/KYBER key pairs |
| `POST /pqc/sign` | PQC signature |
| `POST /pqc/verify` | PQC verification |
| `GET /pqc/algorithms` | List supported algorithms |
| `POST /pqc/threat-assessment` | Algorithm risk assessment |
| `GET /pqc/info` | PQC system info |

### Oracle and VRF
| Endpoint | Description |
|----------|-------------|
| `POST /oracle/request` | Request quantum randomness (with target_chain) |
| `POST /oracle/requests/batch` | Batch oracle requests |
| `GET /oracle/status/:id` | Check request fulfillment |
| `GET /oracle/network-info` | Oracle network status |
| `GET /oracle/benchmark` | Performance benchmark |
| `POST /oracle/vrf/seed` | Create quantum VRF seed |
| `POST /oracle/vrf/prove` | Compute VRF output |
| `POST /oracle/vrf/reveal` | Reveal seed for verification |
| `POST /oracle/vrf/verify` | Verify VRF proof |

### Blockchain
| Endpoint | Description |
|----------|-------------|
| `POST /blockchain/create-wallet` | Classical + quantum-safe wallets |
| `POST /blockchain/sign-transaction` | Sign with ECDSA and DILITHIUM |
| `POST /blockchain/simulate-attack` | Shor's algorithm simulation |
| `POST /blockchain/verify-quantum-safe` | Verify PQC signature |
| `GET /blockchain/compare-blockchains` | Security comparison |
| `POST /blockchain/mine-block` | Demo block mining |

### System
| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /quantum/entropy` | Entropy analysis |
| `GET /quantum/stats` | Generation statistics |
| `POST /quantum/reseed` | Reseed entropy pool |
| `GET /hardware/devices` | Quantum hardware status |
| `GET /monitoring/metrics` | System metrics |

## Technology Stack

- **Backend**: FastAPI, Uvicorn, Python 3.8+
- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Quantum**: QRisp simulation, hardware abstraction layer
- **Cryptography**: PyCryptodome (Keccak-256), cryptography (AES/RSA/ECDSA), liboqs-python (DILITHIUM/KYBER)
- **Deployment**: Docker, Kubernetes, Docker Compose

## Documentation

- **In-App Docs**: Available at `/docs` in the web dashboard
- **[Production Guide](PRODUCTION.md)**: Deployment instructions
- **[API Documentation](http://localhost:8000/docs)**: Interactive Swagger UI
- **[Python SDK](client_sdk/python/README.md)**: Python client library

## License

This project is licensed under the MIT License.
