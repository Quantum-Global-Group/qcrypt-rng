# QCrypt RNG — Upgrade Roadmap (Master Map)

This document is the **single entry point** for planned upgrades: product (API + oracle), monetization, and production quality. Detailed build steps live in linked files under `docs/`.

---

## Goals

| Track | Outcome |
|--------|---------|
| **Product** | API + oracle as a coherent offering with clear tiers and limits |
| **Monetization** | API key → tier mapping, billing integration, and usage-based enforcement |
| **Platform** | Tests, monitoring, security posture, and contract/testnet validation |

---

## Dependency Map

```
┌─────────────────────────────────────────────────────────────────┐
│  Foundation (Phase A)                                            │
│  • API key → real tier lookup (replace hash pseudo-tier)        │
│  • Enforce limits per tier in rate_limiting + middleware        │
└───────────────────────────────┬───────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐  ┌────────────────────────┐  ┌──────────────────┐
│ Phase B       │  │ Phase C                  │  │ Phase D         │
│ Monetization  │  │ Platform & quality       │  │ Oracle product  │
│ (billing,     │  │ (tests, monitoring,      │  │ (metering,      │
│  Stripe, UI)  │  │  docs, audit)            │  │  testnet)       │
└───────────────┘  └────────────────────────┘  └──────────────────┘
```

**Rule:** Phases B–D can be parallelized after Phase A; B (monetization) depends most on A.

---

## Document Index

| Document | Purpose |
|----------|---------|
| **[UPGRADE_ROADMAP.md](UPGRADE_ROADMAP.md)** (this file) | Overview, priorities, dependencies |
| **[BUILD_MONETIZATION.md](BUILD_MONETIZATION.md)** | API + oracle monetization (tiers, billing, usage) |
| **[BUILD_PLATFORM_AND_QUALITY.md](BUILD_PLATFORM_AND_QUALITY.md)** | Testing, monitoring, docs, security, testnet |
| [NEXT_STEPS.md](NEXT_STEPS.md) | Original Phase 1 tasks (historical) |
| [NEXT_STEPS_PHASE2.md](NEXT_STEPS_PHASE2.md) | Phase 2 backlog (partially superseded by this roadmap) |
| [PRODUCTION.md](PRODUCTION.md) | Deployment and operations |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Architecture and capabilities |

---

## Priority Order (Recommended)

| Order | Focus | Deliverable |
|-------|--------|-------------|
| **1** | **Phase A — Foundation** | Tier lookup from DB/config; `rate_limits.tier` or `api_keys` table; remove MD5 pseudo-tier in `app/utils/rate_limiting.py` |
| **2** | **Stripe / billing** (subset of B) | Checkout → webhook → set tier; optional metered usage from `usage_logs` |
| **3** | **Testing** | Critical path: PQC KEM, oracle fulfillment (mocked), middleware |
| **4** | **Monitoring** | Prometheus metrics for oracle fulfillment, PQC, entropy (see [MONITORING_GUIDE.md](MONITORING_GUIDE.md)) |
| **5** | **Oracle product** | Per-endpoint metering; testnet contract deploy + documented addresses |
| **6** | **Security audit** | External or internal checklist before high-trust production |

---

## Key Code Touchpoints

| Area | Primary files |
|------|----------------|
| Tier + usage | `app/utils/rate_limiting.py`, `app/config.py`, `app/utils/middleware.py` |
| Billing (future) | New `app/billing/` or `app/subscriptions/` + Stripe webhooks |
| Oracle | `app/api/v2/endpoints/oracle.py`, `app/blockchain/oracle_service.py` |
| Dashboard | `quantum-oracle-ui/` — pricing, usage, upgrade CTAs |

---

## Definition of Done (Upgrade v1)

- [ ] Every API key resolves to a **real** tier (free / pro / enterprise), not hash-based.
- [ ] **Usage** is attributable per key for billing (`usage_logs` or equivalent).
- [ ] **Monetization path** exists: Stripe or documented manual tier assignment (minimum for launch).
- [ ] **Oracle** endpoints counted or limited per tier (or explicit “oracle add-on” plan).
- [ ] **CI** runs tests; critical paths covered.
- [ ] **PRODUCTION.md** and README aligned with current deployment and env vars.

---

*Last updated: 2026-03-23*
