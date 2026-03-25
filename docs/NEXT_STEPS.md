# QCrypt RNG — Next Steps

This document outlines prioritized development tasks to advance the QCrypt RNG platform toward production readiness.

---

## 1. Implement Kyber KEM in pqc.py and the PQC endpoints

**Status:** Kyber is advertised in the README but currently returns simulated (random) keys, not real key encapsulation/decapsulation.

**Tasks:**
- Add `oqs.KeyEncapsulation` support in `app/quantum/pqc.py` for KYBER512, KYBER768, KYBER1024 when liboqs is available
- Implement `generate_keypair()`, `encapsulate()`, and `decapsulate()` for Kyber KEM
- Add or update API endpoints (e.g. `/pqc/kem/encapsulate`, `/pqc/kem/decapsulate`) to expose KEM operations
- Provide a fallback when liboqs is unavailable (clearly marked as non-cryptographic)
- Update API docs and OpenAPI schema to reflect KEM endpoints

**Files:** `app/quantum/pqc.py`, `app/api/v2/endpoints/pqc_endpoints.py`

---

## 2. Update PRODUCTION.md to describe the Next.js dashboard

**Status:** PRODUCTION.md references a "Streamlit-based web interface"; the actual dashboard is Next.js 16 in `quantum-oracle-ui/`.

**Tasks:**
- Replace Streamlit references with Next.js dashboard
- Document `quantum-oracle-ui` build and serving (e.g. `npm run build`, `npm run start`)
- Update environment variables (e.g. `NEXT_PUBLIC_API_BASE_URL`, `API_BASE_URL`)
- Align with the single-Docker deployment (Nginx + FastAPI + Next.js)
- Ensure dashboard deployment section matches `Dockerfile` and `deploy.sh` behavior

**Files:** `PRODUCTION.md`

---

## 3. Expand PQC support (FALCON/SPHINCS+/NTRU/SABER) or narrow advertised algorithms

**Status:** `pqc.py` lists FALCON512/1024, SPHINCS+-SHA2-128f, NTRU, and SABER in `self.algorithms`, but only Dilithium has concrete implementation.

**Option A — Expand support:**
- Implement FALCON and SPHINCS+ signing via liboqs `oqs.Signature`
- Implement NTRU and SABER KEM via liboqs `oqs.KeyEncapsulation`
- Extend PQC endpoints to handle all listed algorithms
- Add algorithm-specific response metadata (signature/KEM sizes, NIST level)

**Option B — Narrow advertised algorithms:**
- Remove or mark as "planned" unsupported algorithms from docs and `get_supported_algorithms()`
- Clarify in README and API docs which algorithms are fully implemented vs simulated

**Recommendation:** Prefer Option A where liboqs supports the algorithm; otherwise use Option B to avoid misleading users.

**Files:** `app/quantum/pqc.py`, `app/api/v2/endpoints/pqc_endpoints.py`, README.md

---

## 4. Integrate real quantum hardware through the existing abstraction

**Status:** The hardware abstraction layer exists (`app/quantum/hardware_interface.py`); current backends are simulation or mock hardware.

**Tasks:**
- Implement device adapters for real QRNG hardware (e.g. ID Quantique, QuintessenceLabs, other vendors)
- Add configuration for hardware selection (`QUANTUM_BACKEND`, vendor-specific env vars)
- Document hardware requirements, setup, and calibration
- Add entropy quality checks and validation for hardware output
- Consider certification or compliance notes for hardware-backed entropy

**Files:** `app/quantum/hardware_interface.py`, `app/config.py`, PRODUCTION.md, docs

---

## 5. Add on-chain fulfillment for oracle requests

**Status:** Oracle endpoints (`/oracle/request`, `/oracle/requests/batch`) simulate fulfillment; no real blockchain submission.

**Tasks:**
- Implement chain-specific fulfillment (e.g. Ethereum, Polygon, BSC, Avalanche, Fantom)
- Add wallet/keys management and secure storage for oracle operator
- Implement transaction submission (commit, reveal) and retry logic
- Add status tracking for on-chain fulfillment (confirmations, success/failure)
- Support configurable chains via config or environment
- Document gas requirements, network setup, and security assumptions

**Files:** `app/api/v2/endpoints/oracle.py`, new modules for chain adapters, `app/config.py`, PRODUCTION.md

---

## Priority Order

| Order | Task | Effort | Impact |
|-------|------|--------|--------|
| 1 | Kyber KEM implementation | Medium | High — matches advertised feature |
| 2 | PRODUCTION.md dashboard update | Low | Medium — avoids deployment confusion |
| 3 | PQC expansion or narrowing | Medium | High — correctness and trust |
| 4 | Real quantum hardware integration | High | High — production differentiation |
| 5 | On-chain fulfillment | High | High — enables real oracle use cases |

---

*Last updated: 2025-03-06*