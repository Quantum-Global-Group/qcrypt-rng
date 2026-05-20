# Build scope

**Purpose:** Define what the program should build, how themes relate, and when work is “done.” For preferences and stack facts, see root [`AGENTS.md`](../../AGENTS.md). Historical implementation notes live under [`docs/archive/`](../archive/).

---

## Product north star

- **One primary shell:** Unify operator-style navigation and research/lab routes into a single Next.js experience (`quantum-oracle-ui`); retire or clearly fence alternate UIs (e.g. Streamlit `dashboard.py`) so there is one mental model long term.
- **Integrated workflows:** Prove, Protect, and Randomize surface as **scenario-driven flows** (not three disconnected feature silos).
- **Research-grade UI:** Analyst-friendly density, hierarchy, and spacing; **no standalone guided tour** as product surface.
- **Dual surface:** Full product = Next.js + FastAPI (`app/`); **separate** Hugging Face Gradio Space = dependency-light researcher slice (not a pixel-perfect dashboard clone).

---

## Themes and capabilities

### T1 — Unified platform & path reconciliation

| Capability | Description |
|------------|-------------|
| Single shell | One nav, shared layout, consistent tokens; lab/research routes first-class inside the same app. |
| Streamlit vs Next | Decision + migration: deprecate `dashboard.py` / `docker-compose` Streamlit service **or** document as legacy-only with explicit “not supported for new features.” Align README, `commands.md`, and compose with the chosen path. |
| PRODUCTION / compose / Dockerfile | Reconcile `PRODUCTION.md`, `docker-compose.yml`, and root `Dockerfile` so ports, env vars, and “happy paths” match (audit finding: drift). |
| CI baseline | Pipeline: lint/typecheck/build for `quantum-oracle-ui`; Python tests + optional API contract checks for FastAPI; fail PRs on regressions. |

**Definition of done (T1)**

- Documented golden path: local API (`run_api.py`, OpenAPI at `/docs`) + dashboard env (`NEXT_PUBLIC_API_BASE_URL`, commonly `/api/v2` prefix — verify in code).
- No contradictory run instructions across README, `PRODUCTION.md`, and compose for the **primary** UX.
- CI runs on default branch and PRs; green required to merge (policy as team agrees).

**Dependencies:** T1 unblocks honest testing and demos for all other themes.

---

### T2 — API hardening, keys, and contracts

| Capability | Description |
|------------|-------------|
| API key defaults & docs | Safe-by-default dev experience; documented rotation, scopes, and storage; no “silent insecure” examples. |
| Contract tests | OpenAPI-driven or golden-path HTTP tests for critical routes; catch breaking changes early. |
| Error & observability | Consistent error shapes and request IDs where applicable (as patterns exist today). |

**Definition of done (T2)**

- Security-sensitive defaults verified and documented.
- Contract or integration tests cover **core** v2 endpoints (exact list TBD from OpenAPI / router modules).
- Breaking API changes require test updates in the same change.

**Dependencies:** Builds on T1 CI; enables T3 scenario work without churn.

---

### T3 — Trust, transparency, and RNG narrative

| Capability | Description |
|------------|-------------|
| Methodology docs | Clear, verifiable description of entropy sources, mixing, health checks, and limitations (RNG trust/transparency). |
| Audit trail hooks | Where randomness is produced and logged, tie to scenario flows (lottery, committee, etc.). |
| Blockchain tab parity | Prove/Protect on chain-oriented surfaces meet the same “why this matters” bar as randomness flows (per [`AGENTS.md`](../../AGENTS.md)). |

**Definition of done (T3)**

- Published methodology (user- and auditor-facing) linked from product and/or `PRODUCTION.md` — see [`../RNG_METHODOLOGY.md`](../RNG_METHODOLOGY.md).
- Flagship scenarios reference **what is being proven** and **what evidence** is retained (UI copy + docs); lottery/committee sections link methodology from [`../scenarios/FLAGSHIP_SCENARIOS.md`](../scenarios/FLAGSHIP_SCENARIOS.md).

**Dependencies:** T2 for stable API surfaces; overlaps T4 for UI.

---

### T4 — Scenario-first UX (Prove / Protect / Randomize)

| Capability | Description |
|------------|-------------|
| Integrated flows | Wizards or guided panels that weave Prove, Protect, Randomize steps without siloed tabs-only thinking. |
| Flagship scenarios | End-to-end stories (below) with step lists and mapping to modes. |
| Analyst layout | Scannable sections, stable terminology, export/copy affordances where appropriate. |

**Definition of done (T4)**

- Three flagship scenarios reachable as documented flows with verified UI routes and `/api/v2` mappings (see [Flagship scenarios](#flagship-scenarios-23) and [`../scenarios/FLAGSHIP_SCENARIOS.md`](../scenarios/FLAGSHIP_SCENARIOS.md)).
- UX copy maps steps to **Prove** vs **Protect** vs **Randomize** consistently (today: partial — home dashboard uses **oracle / protect / rng**; blockchain subtree uses **Prove / Protect / Randomize**).

**Dependencies:** T1 shell; T2 APIs; T3 trust narrative for credibility.

---

### T5 — Hugging Face Gradio slice

| Capability | Description |
|------------|-------------|
| Scoped demo | Gradio app exposing a **researcher-facing subset** (e.g. sample randomness, one Protect operation, one Prove-lite path) — not full dashboard parity. |
| Thin dependencies | Install and run path suitable for Spaces README. |

**Definition of done (T5)**

- Public or internal Space README matches pinned deps and entrypoint — see [`../../gradio-demo/README.md`](../../gradio-demo/README.md).
- Clear statement of what is **not** in the demo vs main product (documented in that README and in-app accordion).
- Separate **`gradio-demo/`** entrypoint so HF can build a Gradio-only image without the Next.js stack (root `Dockerfile` remains the full Nginx + API + Next product on port **7860**).

**Dependencies:** T3 narrative (short version in Space); optional reuse of API client patterns.

---

### T6 — Documentation gaps (Protect-style crypto)

| Capability | Description |
|------------|-------------|
| Protect coverage | Launch-gap docs explicitly cover **symmetric encrypt/decrypt**, **password or salted hashing**, **random token generation** — not only oracle, billing, PQC, API-key storage. |
| Cross-links | Point to OpenAPI and scenario guides from one index. |

**Definition of done (T6)**

- Gap analysis doc updated with Protect primitives and examples — see [`../PROTECT_API_GUIDE.md`](../PROTECT_API_GUIDE.md).
- Docs tested by a cold reader following steps (internal validation).

**Dependencies:** T2/T4 for accurate endpoint names and examples.

---

## Flagship scenarios (2–3)

Verified against `app/main.py` (API prefix `/api/v2` from `app/config.py`) and `quantum-oracle-ui` App Router pages (Sprint 5 audit). Full step tables, composed journeys, and gap inventory: [`../scenarios/FLAGSHIP_SCENARIOS.md`](../scenarios/FLAGSHIP_SCENARIOS.md).

**Cross-cutting gaps (all scenarios):** No single scenario wizard route; users compose flows across `/` dashboard tabs and `/blockchain/*` pages. Home labels (**oracle / protect / rng**) do not match blockchain pillar names (**Prove / Protect / Randomize**). VRF state is **in-memory** (`vrf.py`) — audit trail weakens on API restart.

### Scenario A — Fair lottery with audit trail

**User-visible goal:** Run a fair draw with tamper-evident inputs and a traceable randomness record.

| Step | Pillar | UI route | API endpoint(s) | Notes |
|------|--------|----------|-----------------|-------|
| Publish commitment to entropy before draw | Prove + Randomize | `/` → oracle tab (Quantum VRF); `/blockchain/randomize` | `POST /api/v2/oracle/vrf/seed` | Credible lottery path uses VRF, not raw bytes alone |
| Bind draw inputs (e.g. round ID) to committed seed | Prove | Same | `POST /api/v2/oracle/vrf/prove` | |
| Reveal secret + verify fairness | Prove | Same (+ verify on home oracle tab) | `POST /api/v2/oracle/vrf/reveal`, `POST /api/v2/oracle/vrf/verify` | |
| Seal or fingerprint participant list / ticket manifest | Protect (+ Prove) | `/` → protect tab; `/blockchain/protect` | `POST /api/v2/protect/hash`, `POST /api/v2/protect/sign`, `POST /api/v2/protect/encrypt` | |
| Alternative: many independent commitments | Randomize | `/` → rng tab (batch oracle) | `POST /api/v2/oracle/requests/batch` | |
| Alternative: raw random bytes | Randomize | `/` → rng tab | `POST /api/v2/generate/bytes`, `POST /api/v2/protect/secure-random` | |
| Trace request in network UI | Randomize (ops) | `/` → network tab | `GET /api/v2/oracle/network-info`, `GET /api/v2/oracle/status/{request_id}` | |
| **gap** — End-to-end lottery wizard | — | **No dedicated route** | — | User composes `/` + `/blockchain/randomize` manually |
| **gap** — Oracle request vs reveal store | Prove / Randomize | `/` → oracle tab | `POST /api/v2/oracle/request` | Generates commitment but does **not** persist seed/randomness by `request_id` for consistent reveal (unlike VRF store); status partly simulated |
| **gap** — Persistent audit trail | Prove | — | VRF `_vrf_store` in-memory | **Lost on API restart** |

---

### Scenario B — Sealed bid

**User-visible goal:** Collect bids that stay confidential until open, then reveal verifiably.

| Step | Pillar | UI route | API endpoint(s) | Notes |
|------|--------|----------|-----------------|-------|
| Encrypt bid (confidential until open) | Protect | `/` → protect tab; `/blockchain/protect` (encrypt) | `POST /api/v2/protect/encrypt` (optional `/encrypt-file`) | |
| Publish ciphertext / commitment only | Prove + Protect | Same + hash/sign sections | `POST /api/v2/protect/hash`, `POST /api/v2/protect/sign`; `POST /api/v2/pqc/sign` | |
| PQ-safe channel (optional) | Protect | `/` → protect tab (if KEM exposed) | `POST /api/v2/pqc/kem/generate`, `/kem/encapsulate`, `/kem/decapsulate` | |
| Open round / decrypt | Protect | `/` → protect tab decrypt | `POST /api/v2/protect/decrypt`, `/decrypt-file` | API exists; see gap row |
| Verify integrity / signature | Prove | `/` → protect tab verify; `/blockchain/prove` | `POST /api/v2/protect/verify`, `POST /api/v2/pqc/verify` | |
| **gap** — Auction-round model | — | — | — | No API/UI for round IDs, deadlines, or open phase |
| **gap** — Time-lock / conditional reveal | Protect | — | — | Encrypt-only demo; no scheduled open |
| **gap** — Blockchain Protect decrypt loop | Protect | `/blockchain/protect` (`ProtectVault`) | `POST /api/v2/protect/decrypt` | **ProtectVault** wires encrypt/hash/PQC sign only — **no decrypt** or full verify loop |

---

### Scenario C — Committee-style selection

**User-visible goal:** Unbiased selection of a subset (e.g. jurors, reviewers) with auditability.

| Step | Pillar | UI route | API endpoint(s) | Notes |
|------|--------|----------|-----------------|-------|
| Canonical roster / fingerprint | Prove (+ Protect) | `/blockchain/prove`; `/blockchain/protect` (hash); `/` protect tab | `POST /api/v2/protect/hash`; `POST /api/v2/pqc/sign`, `/pqc/verify` | |
| Agreed random seed bound to round | Randomize + Prove | `/`; `/blockchain/randomize` (Quantum VRF) | `POST /api/v2/oracle/vrf/seed` … `prove` / `reveal` / `verify` | |
| Optional unbiased integer sampling | Randomize | Backend via protect API | `POST /api/v2/protect/secure-random` (`type=integer`) | No dedicated committee UI |
| Deterministic ordering / sampling from seed | Prove (algorithm) | **gap** | **gap** | No `POST …/select-committee` or documented server-side shuffle; consumer derives permutation locally from VRF `output` or `POST /api/v2/generate/bytes` |
| **gap** — Selection algorithm + UI | Prove | — | — | Mapping VRF output → committee slots is **undocumented** and not a first-class flow |
| **gap** — Pillar naming on home | — | `/` uses **oracle / protect / rng** | — | Blockchain subtree aligns with Prove/Protect/Randomize; copy bridge needed for M3 |

---

## Out of scope (near term)

- Pixel-perfect parity between Next.js dashboard and Gradio Space.
- Standalone productized “tour” feature (per product direction).
- Replacing FastAPI with another backend without explicit program decision.
- Full formal verification of cryptographic implementations (unless separately funded); **scope** is methodology, tests, and docs proportionate to risk.

---

## Cross-theme dependency sketch

```text
T1 (shell + paths + CI)
 ├── T2 (API + keys + contracts)
 │     ├── T3 (trust / RNG narrative)
 │     └── T4 (scenario UX)
 │           └── T6 (docs gaps)
 └── T5 (Gradio) ←—— T3 (short trust copy)
```

---

## Related artifacts

- [`../RNG_METHODOLOGY.md`](../RNG_METHODOLOGY.md) — Entropy sources, VRF audit path, limitations (T3)
- [`../README.md`](../README.md) — Documentation index (OpenAPI entry points, scenario links, T6 Protect-style pointers).
- [`../PROTECT_API_GUIDE.md`](../PROTECT_API_GUIDE.md) — Protect encrypt/hash/sign/random curl reference (T6).
- [`../scenarios/FLAGSHIP_SCENARIOS.md`](../scenarios/FLAGSHIP_SCENARIOS.md) — Verified step → UI → API → pillar tables and composed user journeys (lottery, sealed bid, committee).
- [`../../PRODUCTION.md`](../../PRODUCTION.md) — Deployment surfaces, env vars, CI baseline, known gaps (T1 / M4).
- [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md) — Pre-launch smoke and doc sign-off (Sprint 6 / M4).
- [`STREAMLIT_DECISION.md`](./STREAMLIT_DECISION.md) — M1 stance: Streamlit lab-only; Next primary; Gradio external demo (T1 / T5).
- [`MILESTONES.md`](./MILESTONES.md) — Phasing and exit criteria.
- [`SPRINTS.md`](./SPRINTS.md) — Two-week execution slices.
- [`PRODUCT_OWNERS.md`](./PRODUCT_OWNERS.md) — PO ownership and RACI-lite.
