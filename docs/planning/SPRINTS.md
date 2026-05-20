# Sprints (6 × two weeks)

**Purpose:** Execution slices with goals, backlog hints, **milestone mapping**, readiness/done definitions, and risks. All sprints roll up to milestones in [`MILESTONES.md`](./MILESTONES.md).

**Cadence:** 2 weeks per sprint (adjust if team uses different rhythm; keep milestone mapping intact).

| Sprint | Milestone | PO sponsor (role) |
|--------|-----------|-------------------|
| Sprint 1 | **M1** | Platform/API PO |
| Sprint 2 | **M1** | Platform/API PO |
| Sprint 3 | **M2** | Security/Trust PO |
| Sprint 4 | **M2** | Security/Trust PO |
| Sprint 5 | **M3** | UX/Scenario PO |
| Sprint 6 | **M4** | GTM/Docs PO |

---

## Definition of Ready (DoR) — all sprints

- Ticket has clear **user or system outcome**, acceptance bullets, and **owner**.
- Dependencies identified (API vs UI vs docs); blocked items flagged.
- Security-sensitive work has **Security/Trust PO** awareness if touching auth, crypto, or RNG claims.

## Definition of Done (DoD) — all sprints

- Merged to mainline behind agreed checks (**CI** jobs from M1 onward).
- Tests updated/added when behavior or contracts change.
- User-visible changes have **docs or in-app copy** updated (owner: GTM/Docs PO or delegate).
- No known **P0** regressions; P1s documented as follow-ups.

---

## Sprint 1 — **M1** · Path audit & CI skeleton

**Goal:** Inventory contradictions (Streamlit `dashboard.py` / `docker-compose` vs `quantum-oracle-ui`); stand up minimal CI; document interim golden path.

**Prioritized backlog slices**

- Reconcile README vs `PRODUCTION.md` vs compose for ports and services (8501 Streamlit vs 3000 Next vs 8000 API — verify).
- Add CI workflow: e.g. `npm ci` + lint/build in `quantum-oracle-ui`; `pytest` at repo root (scope minimal → expand Sprint 2).
- Decision draft: Streamlit legacy fence vs removal (no full removal required this sprint if risky).

**Maps to milestone:** **M1** (exit: CI exists; single primary path documented).

**Risks**

- Flaky installs (e.g. `liboqs` per [`AGENTS.md`](../../AGENTS.md)) — gate CI on optional jobs or mocks.
- Unclear API base URL env — document `NEXT_PUBLIC_API_BASE_URL` with verified prefix.

---

## Sprint 2 — **M1** · Compose/PRODUCTION alignment & Streamlit decision

**Goal:** Close **docker-compose / Dockerfile / PRODUCTION** drift; finalize Streamlit stance; widen CI slightly.

**Prioritized backlog slices**

- Apply **documented** decision on Streamlit (deprecate / lab-only / remove from compose).
- Update `docker-compose.yml` and `PRODUCTION.md` to match **primary** dev and deploy story.
- CI: add Python test job coverage target (e.g. fail under threshold **TBD** by team).

**Maps to milestone:** **M1** (exit: no major doc/compose conflicts; decision recorded).

**Risks**

- Fly/HF/Nginx nuances — coordinate with Platform/API PO; avoid one-off secrets in repo.

---

## Sprint 3 — **M2** · API keys, defaults, and test expansion

**Goal:** Tighten API key and dev defaults; grow **pytest** beyond thin baseline; enumerate contract-test targets from OpenAPI.

**Prioritized backlog slices**

- Audit quickstart for insecure defaults; patch + document rotation.
- Add tests for highest-value modules (entropy/RNG plumbing **TBD** by code audit).
- Spike: OpenAPI diff or golden-file tests for **N** critical routes (`N` TBD).

**Maps to milestone:** **M2** (early exit criteria: documented keys; more tests).

**Risks**

- Test env without hardware entropy — define mocks/fixtures.

---

## Sprint 4 — **M2** · Contract tests & RNG transparency v1

**Goal:** Land API **contract** tests for agreed endpoints; publish **v1** RNG trust/transparency doc; Security/Trust review gate.

**Prioritized backlog slices**

- Implement contract tests (subset of v2 API).
- Author methodology page: sources, limitations, verification expectations.
- Blockchain-tab copy review for Prove/Protect parity with randomness clarity.

**Maps to milestone:** **M2** (exit: CI enforces contracts; methodology linkable).

**Risks**

- Over-scoping all endpoints — keep **MVP list** ≤ 10 routes for v1 contracts (adjust per eng estimate).

---

## Sprint 5 — **M3** · Flagship scenarios in product

**Goal:** Ship **integrated** UX for **fair lottery**, **sealed bid**, and **committee selection** ([`BUILD_SCOPE.md`](./BUILD_SCOPE.md)); verify routes/endpoints in code (replace TBDs).

**Prioritized backlog slices**

- Map each scenario step to real UI routes and API calls; fix gaps.
- Analyst-grade layout pass: hierarchy, spacing, export/copy.
- Internal validation script / checklist for UAT.

**Maps to milestone:** **M3** (exit: three scenarios demonstrable without engineering hand-holding).

**Risks**

- Backend gaps discovered late — reserve buffer for small API additions; escalate to Platform/API PO early.

---

## Sprint 6 — **M4** · Gradio Space + Protect docs + launch hardening

**Goal:** Hugging Face Gradio slice (subset); close **Protect-style** documentation gaps; final production checklist pass.

**Prioritized backlog slices**

- Gradio: minimal flows + README; pin deps for Spaces.
- Docs: symmetric encrypt/decrypt, salted/password hashing, random tokens — with examples.
- Refresh `PRODUCTION.md` post M1–M3; ensure AGENTS/stack facts still true.

**Maps to milestone:** **M4** (exit: Space runnable; Protect docs complete; launch checklist updated).

**Risks**

- Scope creep toward “mini-dashboard” — **GTM/Docs PO** enforces subset; reject parity requests for this sprint.

---

## Parking lot (not sprint-committed)

- Full Streamlit removal from repo (if not done in M1).
- Playwright or heavier E2E (add when shell stable).
- Internationalization / localization.

---

## Related

- [`BUILD_SCOPE.md`](./BUILD_SCOPE.md) — Themes and flagship scenario detail.
- [`MILESTONES.md`](./MILESTONES.md) — Phase exit criteria and PO per milestone.
- [`PRODUCT_OWNERS.md`](./PRODUCT_OWNERS.md) — RACI and escalation.
