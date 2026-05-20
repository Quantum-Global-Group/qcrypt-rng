# Milestones

**Purpose:** Phased roadmap with exit criteria and **Product Owner (PO)** assignment by **role title** (not individual names). Dates are relative; adjust to calendar once capacity is known.

| Milestone | Target window (suggested) | Primary PO role | Rolls up from sprints |
|-----------|---------------------------|-----------------|------------------------|
| **M1** — Foundation & single-path convergence | Q1 (relative) · Sprints **1–2** | Platform/API PO | S1, S2 |
| **M2** — Reliability, contracts & security defaults | Q1–Q2 · Sprints **3–4** | Security/Trust PO (co-own API with Platform/API PO) | S3, S4 |
| **M3** — Flagship scenarios & analyst UX | Q2 · Sprint **5** | UX/Scenario PO | S5 |
| **M4** — External demo & launch docs | Q2 · Sprint **6** | GTM/Docs PO (UX/Scenario PO for Gradio UX) | S6 |

See also [`BUILD_SCOPE.md`](./BUILD_SCOPE.md) for theme definitions and [`SPRINTS.md`](./SPRINTS.md) for sprint backlog slices.

---

## M1 — Foundation & single-path convergence

**Goal:** One credible primary developer path; CI lights green; Streamlit/Next/docker/docs contradictions removed or explicitly fenced.

### Deliverables (summary)

- Unified Next shell direction locked; legacy Streamlit path decision recorded.
- `PRODUCTION.md`, `docker-compose.yml`, README, and `Dockerfile` aligned for the primary stack (ports, env, entrypoints).
- Minimal CI: frontend check + Python tests (expand per [`BUILD_SCOPE.md`](./BUILD_SCOPE.md) T1).

### Exit criteria

- [ ] A new contributor can run API + dashboard following **one** documented path without hitting conflicting instructions.
- [ ] CI runs on PR and reports pass/fail for agreed jobs.
- [ ] Decision memo (short section in README or `docs/planning/` addendum): Streamlit **deprecated** vs **lab-only** vs **removed from compose**.

**PO owner (role):** **Platform/API PO**

**Supporting roles:** GTM/Docs PO (doc consistency), UX/Scenario PO (nav shell UX if early stub exists).

---

## M2 — Reliability, API contracts & security defaults

**Goal:** Safer defaults, documented keys, expanded automated verification (pytest + API contract tests).

### Deliverables (summary)

- API key and auth documentation tightened; examples audited for dev/prod.
- **pytest** expanded beyond “thin” baseline; contract tests against OpenAPI or golden HTTP responses for core routes (exact endpoints TBD from codebase).
- RNG / trust methodology draft linked from docs (full polish may continue into M3).

### Exit criteria

- [ ] No undocumented insecure default in quickstart examples.
- [ ] Test suite covers agreed **critical** API paths; breaking changes fail CI.
- [ ] Initial **RNG trust & transparency** page exists (can be `docs/` or site-linked).

**PO owner (role):** **Security/Trust PO** (shared decision rights on security defaults with **Platform/API PO** for compatibility).

**Supporting roles:** Platform/API PO (implementation sequencing), GTM/Docs PO (external messaging).

---

## M3 — Flagship scenarios & integrated UX

**Goal:** Prove / Protect / Randomize read as **one workflow**; lottery, sealed bid, and committee scenarios **demonstrable** with analyst-grade UI.

### Deliverables (summary)

- UX flows for three flagship scenarios ([`BUILD_SCOPE.md`](./BUILD_SCOPE.md)); exact routes verified in code.
- Blockchain tab Prove/Protect experiences meet randomness **clarity bar** (per [`AGENTS.md`](../../AGENTS.md)).

### Audit status (Sprint 5 — docs only)

| Criterion | Status |
|-----------|--------|
| Documented steps + verified UI/API mappings | **Done** in [`../scenarios/FLAGSHIP_SCENARIOS.md`](../scenarios/FLAGSHIP_SCENARIOS.md) and BUILD_SCOPE scenario sections |
| Demonstrable **per primitive** (VRF, encrypt/hash, roster attestation) | **Yes** — compose via `/` tabs + `/blockchain/*` |
| Single scenario wizard or one URL | **Gap** |
| Committee selection algorithm + UI | **Gap** |
| Sealed bid decrypt on `/blockchain/protect` | **Gap** (home protect tab can decrypt) |
| Consistent Prove/Protect/Randomize copy on home vs blockchain | **Partial gap** (oracle/protect/rng vs Prove/Protect/Randomize) |
| Internal user completes one scenario without engineering help | **Not yet** — needs guided shell or runbook walkthrough |

### Exit criteria

- [x] Each flagship scenario has **documented steps** + verified UI entry points (no placeholders in **internal** runbooks).
- [ ] Copy consistently labels Prove vs Protect vs Randomize along the flow.
- [ ] Usability snapshot: target user can complete one scenario without engineering help (internal test script).

**PO owner (role):** **UX/Scenario PO**

**Supporting roles:** Security/Trust PO (cryptographic accuracy of copy), Platform/API PO (endpoint readiness).

---

## M4 — Hugging Face Gradio slice & launch readiness

**Goal:** Dependency-light Gradio Space; Protect-gap documentation; production checklist current.

### Deliverables (summary)

- Gradio Space README + pinned behavior subset (not dashboard clone).
- **Protect-style** doc gaps closed: symmetric crypto, salted hashing, token generation ([`BUILD_SCOPE.md`](./BUILD_SCOPE.md) T6).
- Final pass on [`PRODUCTION.md`](../../PRODUCTION.md) and [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md) after M1–M3 changes.

### Exit criteria

- [ ] Space runs from documented instructions; scope limitations explicit.
- [ ] Protect primitives documented with working examples (curl or minimal script — see [`../PROTECT_API_GUIDE.md`](../PROTECT_API_GUIDE.md)).
- [ ] Launch checklist completed for agreed smoke scope ([`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md)).

**PO owner (role):** **GTM/Docs PO**

**Supporting roles:** UX/Scenario PO (Gradio UX), Platform/API PO (API compatibility for demo).

---

## Optional later phases (not committed in Sprints 1–6)

- Deeper adversarial review of RNG pipeline.
- Expanded SDK / contract coverage across **all** endpoints.
- Removal of Streamlit artifacts from repo if deprecation chosen in M1.
