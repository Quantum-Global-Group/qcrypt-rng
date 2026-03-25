# QCrypt RNG — Phase 2: Next Project

This document outlines the next prioritized development tasks following completion of the initial five tasks in NEXT_STEPS.md.

**Prerequisites:** Tasks 1–5 from NEXT_STEPS.md are complete (Kyber KEM, PRODUCTION.md, PQC expansion, hardware integration, on-chain fulfillment).

---

## 1. Testing

**Status:** Complete (2026-03-06)

**Tasks:**
- Add unit tests for Kyber KEM (`generate_kyber_keypair`, `encapsulate`, `decapsulate`)
- Add unit tests for FALCON, SPHINCS+, NTRU, SABER in `pqc.py`
- Add integration tests for `/pqc/kem/*` and expanded PQC endpoints
- Add tests for `OracleFulfillmentService` and chain adapters (mocked Web3)
- Add tests for hardware adapters (`IDQuantiqueQRNG`, `QuintessenceLabsQRNG`) with mocked I/O
- Add tests for `run_entropy_quality_checks()`

**Files:** `tests/` (create if needed), `pytest.ini` or `pyproject.toml` test config

**Effort:** Medium | **Impact:** High

---

## 2. API Documentation & README

**Status:** Complete (2026-03-06)

**Tasks:**
- Update README.md API reference with new PQC endpoints (Kyber KEM, FALCON, SPHINCS+, NTRU, SABER)
- Document oracle fulfillment endpoints (`/oracle/fulfillment/*`)
- Ensure OpenAPI schema reflects all new routes
- Add usage examples for Kyber encapsulate/decapsulate
- Document hardware backend selection (`QUANTUM_BACKEND`: `idq_quantis`, `qlabs_qstream`, etc.)
- Add hardware setup notes for ID Quantique and QuintessenceLabs

**Files:** `README.md`, `app/main.py` (OpenAPI metadata), `PRODUCTION.md`

**Effort:** Low | **Impact:** Medium

---

## 3. Dashboard Integration

**Status:** Complete (2026-03-23)

**Implemented:**
- Kyber KEM UI in `Protect.tsx`: KYBER512/768/1024 selection, generate/encapsulate/decapsulate workflow, copy/download, InfoPopover
- FALCON, SPHINCS+, NTRU, SABER algorithm UI with KEM-only mode for key encapsulation algorithms
- Oracle Fulfillment UI in `QuantumOracle.tsx`: configure chain (masked private key), create request, status lookup, list requests, retry; collapsible and default collapsed
- API layer in `api.ts`: kemGenerate, kemEncapsulate, kemDecapsulate, configureFulfillmentChain, createFulfillmentRequest, getFulfillmentStatus, listFulfillmentRequests, getFulfillmentChains, retryFulfillment
- Types in `types/index.ts`: KEM and Fulfillment response types
- Docs page updated with Kyber KEM and Oracle Fulfillment endpoint documentation

**Files:** `quantum-oracle-ui/src/components/Protect.tsx`, `quantum-oracle-ui/src/components/QuantumOracle.tsx`, `quantum-oracle-ui/src/utils/api.ts`, `quantum-oracle-ui/src/types/index.ts`, `quantum-oracle-ui/src/app/docs/page.tsx`

**Effort:** Medium | **Impact:** High

---

## 4. Monitoring & Observability

**Status:** Complete (2026-03-23)

**Implemented:**
- 34 Prometheus metrics across 7 categories: oracle fulfillment (7), PQC operations (6), QRNG generation (4), hardware devices (5), entropy quality (4), API performance (5), system (3)
- Metrics endpoint: `GET /api/v2/monitoring/metrics` (Prometheus exposition format)
- Health endpoints: `/monitoring/status`, `/monitoring/health/detailed`, `/monitoring/metrics/summary`
- Metric recording: `POST /monitoring/metrics/record/pqc`, `POST /monitoring/metrics/record/oracle`
- Grafana dashboard: `app/monitoring/grafana-dashboard.json`
- Alerting rules: `app/monitoring/alerting-rules.yml` (6 rules: fulfillment failure rate, entropy quality, hardware offline, API latency, CPU, memory)

**Files:** `app/monitoring/metrics.py`, `app/monitoring/__init__.py`, `app/monitoring/grafana-dashboard.json`, `app/monitoring/alerting-rules.yml`, `app/api/v2/endpoints/monitoring.py`

**Effort:** Medium | **Impact:** High (production readiness)

---

## 5. Smart Contracts & Testnet Deployment

**Status:** Ready to deploy (code complete, awaiting funded testnet wallets)

**Completed:**
- Solidity contract: `quantum-oracle/contracts/src/QuantumRandomnessOracle.sol` (commit-reveal, access control, fee management)
- Hardhat config: all 5 testnets configured (Sepolia, Polygon Amoy, BSC Testnet, Avalanche Fuji, Fantom Testnet) + mainnets
- Deploy scripts: `scripts/deploy.js` (single network), `scripts/deploy-all-testnets.js` (multi-network with verification)
- Validation script: `scripts/validate-deployment.js`
- Backend wiring: `app/config.py` has testnet RPC URLs, chain IDs, explorer URLs, contract address fields for all 5 networks
- `.env.example` documents all testnet env vars
- Chain adapters: `app/blockchain/` (Ethereum, Polygon, BSC, Avalanche, Fantom)
- Oracle fulfillment service: `app/blockchain/oracle_service.py`

**Remaining (user action):**
- Fund deployer wallet on each testnet
- Run `npx hardhat run scripts/deploy-all-testnets.js`
- Fill contract addresses in `.env` and `docs/next-phase/TESTNET_DEPLOYMENT.md`
- Run E2E validation checklist

**Files:** `quantum-oracle/contracts/`, `app/blockchain/*.py`, `app/config.py`, `docs/next-phase/TESTNET_DEPLOYMENT.md`

**Effort:** High | **Impact:** High (real-world validation)

---

## 6. Security Audit

**Status:** Internal audit complete (2026-03-23); external audit recommended for production

**Completed:**
- Internal review of blockchain integration: key handling, replay protection, gas estimation, transaction confirmation
- PQC key/signature handling review: entropy sources, liboqs vs fallback, key lifecycle
- Oracle fulfillment flow review: commit-reveal integrity, race conditions, input validation
- Smart contract review: reentrancy, access control, overflow protection
- Findings documented in `docs/next-phase/SECURITY_AUDIT_CHECKLIST.md`

**Remaining (recommended):**
- External third-party security audit before mainnet deployment
- Formal verification of smart contract (optional)

**Files:** `docs/next-phase/SECURITY_AUDIT_CHECKLIST.md`

**Effort:** High (external) | **Impact:** High

---

## Priority Order

| Order | Task | Effort | Impact | Status |
|-------|------|--------|--------|--------|
| 1 | Testing | Medium | High | Complete |
| 2 | API Documentation & README | Low | Medium | Complete |
| 3 | Dashboard Integration | Medium | High | Complete |
| 4 | Monitoring & Observability | Medium | High | Complete |
| 5 | Smart Contracts & Testnet | High | High | Ready to deploy |
| 6 | Security Audit | High | High | Internal complete |

---

## Reference

- **Completed work:** `docs/IMPLEMENTATION_SUMMARY_2026.md`
- **Original roadmap:** `docs/NEXT_STEPS.md`
- **Oracle roadmap:** `quantum-oracle/DEVELOPMENT_ROADMAP.md`

---

*Created: 2026-03-06*
