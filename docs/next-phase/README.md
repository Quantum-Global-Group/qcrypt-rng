# Next-phase documentation

This folder holds phase-specific deliverables and the master map for the remainder of Phase 2. Canonical roadmaps and status live in the parent `docs/` folder.

---

## Roadmaps and status

| Document | Role |
|----------|------|
| [../NEXT_STEPS_PHASE2.md](../NEXT_STEPS_PHASE2.md) | Phase 2 task list and priorities |
| [../PHASE2_IMPLEMENTATION_SUMMARY.md](../PHASE2_IMPLEMENTATION_SUMMARY.md) | Completed vs remaining work, test coverage |
| [../DASHBOARD_MONITORING_PLAN.md](../DASHBOARD_MONITORING_PLAN.md) | Dashboard and monitoring implementation details |
| [../MONITORING_GUIDE.md](../MONITORING_GUIDE.md) | Metrics and observability concepts |
| [../../quantum-oracle/DEVELOPMENT_ROADMAP.md](../../quantum-oracle/DEVELOPMENT_ROADMAP.md) | Oracle product roadmap |

---

## Phase 2 task status

| Task | Status | Deliverable |
|------|--------|-------------|
| 1. Testing | Complete | 150+ unit and integration tests |
| 2. API documentation & README | Complete | Updated README, pytest.ini |
| 3. Dashboard integration | Complete | Kyber KEM UI, Oracle Fulfillment UI, docs page |
| 4. Monitoring & observability | Complete | 34 Prometheus metrics, Grafana dashboard, alerting rules |
| 5. Smart contracts & testnet deployment | Ready to deploy | [TESTNET_DEPLOYMENT.md](TESTNET_DEPLOYMENT.md) — awaiting funded testnet wallets |
| 6. Security audit | Complete (internal) | [SECURITY_AUDIT_CHECKLIST.md](SECURITY_AUDIT_CHECKLIST.md) |

Tasks 1-4 verified complete. Task 5 code is ready; deployment requires testnet funding. Task 6 internal audit complete; external audit recommended for production.

---

## New deliverables in this folder

- **[TESTNET_DEPLOYMENT.md](TESTNET_DEPLOYMENT.md)** — Testnet deployment steps, contract addresses, RPC/chain IDs, E2E validation (Task 5)
- **[SECURITY_AUDIT_CHECKLIST.md](SECURITY_AUDIT_CHECKLIST.md)** — Internal pre-audit checklist and findings/remediations (Task 6)

---

## Status alignment

[NEXT_STEPS_PHASE2.md](../NEXT_STEPS_PHASE2.md) and [PHASE2_IMPLEMENTATION_SUMMARY.md](../PHASE2_IMPLEMENTATION_SUMMARY.md) are kept in sync: Tasks 1–4 Complete, Task 5 Ready to Deploy, Task 6 Internal Audit Complete.
