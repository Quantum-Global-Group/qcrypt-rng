# Build Map — Platform & Quality

Testing, monitoring, documentation, security, and **on-chain validation** for QCrypt RNG. Complements [UPGRADE_ROADMAP.md](UPGRADE_ROADMAP.md) and [BUILD_MONETIZATION.md](BUILD_MONETIZATION.md).

---

## 1. Testing

**Status:** In progress (see `tests/`, `pytest.ini`).

### Unit tests

| Target | Files / symbols | Notes |
|--------|-------------------|--------|
| Kyber KEM | `app/quantum/pqc.py` — `generate_kyber_keypair`, `encapsulate`, `decapsulate` | Requires liboqs |
| Expanded PQC | FALCON, SPHINCS+, NTRU, SABER in `pqc.py` | Mock or skip if liboqs missing |
| Oracle fulfillment | `OracleFulfillmentService`, chain adapters | **Mock Web3** — no network |
| Hardware adapters | `IDQuantiqueQRNG`, `QuintessenceLabsQRNG` | Mock I/O |
| Entropy | `run_entropy_quality_checks()` | Deterministic fixtures |

### Integration tests

| Target | Routes |
|--------|--------|
| PQC | `/pqc/kem/*`, expanded `/pqc/*` |
| Oracle | `/oracle/*`, `/oracle/fulfillment/*` |
| Middleware | API key + rate limit (test client with headers) |

### Build steps

1. Run `pytest` from repo root; fix CI to run on PR.
2. Add coverage threshold for `app/quantum/`, `app/blockchain/`, `app/utils/middleware.py` (optional).
3. Document `pytest -m "not slow"` if slow tests are added.

### Acceptance criteria

- [ ] CI green on default branch.
- [ ] Oracle/chain tests do not require live RPC.

---

## 2. Monitoring & Observability

**References:** [MONITORING_GUIDE.md](MONITORING_GUIDE.md), [DASHBOARD_MONITORING_PLAN.md](DASHBOARD_MONITORING_PLAN.md), `app/monitoring/metrics.py`.

### Metrics to add or verify

| Area | Metric idea | Consumer |
|------|-------------|----------|
| Oracle fulfillment | Latency, success/failure, chain label | Prometheus + alerts |
| PQC | Keygen/sign/KEM counts per algorithm | Capacity planning |
| Entropy | Quality score from `run_entropy_quality_checks()` | Dashboard + alert if below threshold |
| API | Request rate, 4xx/5xx by route | Grafana |

### Build steps

1. Wire counters/histograms in `app/monitoring/metrics.py` for fulfillment paths.
2. Expose `/monitoring/metrics` (or merge with existing) — align with [PRODUCTION.md](PRODUCTION.md).
3. Optional: Grafana dashboard JSON in `docs/` or `k8s/`.

### Acceptance criteria

- [ ] Failed fulfillments visible in metrics within 1 minute.

---

## 3. API Documentation & README

**Status:** Partially done; keep in sync with code.

### Tasks

1. **README.md** — Full list of `/pqc/*`, `/oracle/fulfillment/*`, hardware env vars.
2. **OpenAPI** — FastAPI `app/main.py` tags/descriptions for new routes.
3. **Examples** — Kyber encapsulate/decapsulate curl; one fulfillment flow.

### Files

| File | Action |
|------|--------|
| `README.md` | API tables + links |
| `docs/PRODUCTION.md` | Next.js dashboard, env vars (no Streamlit references) |
| `app/main.py` | OpenAPI metadata |

---

## 4. Smart Contracts & Testnets

**Goal:** Provable end-to-end oracle path.

### Tasks

1. Deploy contracts from `quantum-oracle/contracts/` to:
   - Ethereum Sepolia
   - Polygon Amoy (optional)
   - BSC testnet (optional)
2. Record addresses in `docs/` or `app/config.py` (env-driven).
3. E2E test: API → adapter → testnet (or mocked tx in CI).

### Acceptance criteria

- [ ] Documented contract addresses + explorer links.
- [ ] One testnet flow verified manually or in CI (with secrets in CI only).

---

## 5. Security

### Internal checklist (before external audit)

| Topic | Check |
|-------|--------|
| Blockchain | Private keys, KMS, no keys in repo |
| PQC | Key material zeroization where possible; no keys in logs |
| Oracle | Replay, race conditions, gas limits |
| API | Rate limits, body size, CORS, `SECRET_KEY` in production |

### External audit

- Scope: `app/blockchain/`, `app/quantum/pqc.py`, oracle fulfillment, middleware.
- Deliverable: findings + remediation tracking.

---

## 6. Dashboard (UI)

**Already aligned** with Phase 2 dashboard work (Kyber UI, oracle fulfillment section).

### Remaining for “product”

- Usage widget (calls remaining, resets) — needs API from [BUILD_MONETIZATION.md](BUILD_MONETIZATION.md).
- Pricing page — Stripe links.
- Monitoring section — optional embed or link to Grafana.

---

## Execution Order (Suggested)

| Week | Focus |
|------|--------|
| 1 | Tests + tier fix (foundation) |
| 2 | Monitoring + README/OpenAPI |
| 3 | Testnet deploy + doc addresses |
| 4 | Security review + Stripe (parallel with monetization doc) |

---

*Cross-reference: [NEXT_STEPS_PHASE2.md](NEXT_STEPS_PHASE2.md) — original task list; this file supersedes priority ordering for platform work.*
