# Documentation index

Single entry point for **program planning**, **stack conventions**, **API discovery**, and **scenario** narrative. Product themes and owners live under [`planning/`](./planning/).

---

## Conventions and stack (implementing code)

- **[`../AGENTS.md`](../AGENTS.md)** — Monorepo layout (FastAPI `app/`, Next.js `quantum-oracle-ui`), local run defaults, env vars such as `NEXT_PUBLIC_API_BASE_URL`, deployment notes.

---

## Live API contract (OpenAPI)

After starting the API (`python run_api.py` from the repo root; default port **8000**):

- **Interactive docs:** `http://localhost:8000/docs`
- **Alternative UI:** `http://localhost:8000/redoc` (if enabled)

The dashboard typically targets the API under prefix **`/api/v2`**; confirm the mounted prefix in the FastAPI app and your `NEXT_PUBLIC_API_BASE_URL` when testing end-to-end.

For a static summary of route areas, see the **API reference** table in the root **[`README.md`](../README.md)**.

---

## Program planning (themes, milestones, sprints, owners)

| Artifact | Use it for |
|----------|------------|
| [`planning/BUILD_SCOPE.md`](./planning/BUILD_SCOPE.md) | Themes **T1–T6**, flagship scenarios (fair lottery, sealed bid, committee selection), definitions of done |
| [`planning/MILESTONES.md`](./planning/MILESTONES.md) | **M1–M4** phases, exit criteria, PO-by-role |
| [`planning/SPRINTS.md`](./planning/SPRINTS.md) | Six two-week sprints, backlog hints, risks |
| [`planning/PRODUCT_OWNERS.md`](./planning/PRODUCT_OWNERS.md) | RACI-lite, escalation, decision rights |
| [`planning/STREAMLIT_DECISION.md`](./planning/STREAMLIT_DECISION.md) | Streamlit vs Next.js vs Gradio — M1 stance and open questions |

---

## Scenario guides (Prove / Protect / Randomize)

Verified step → UI route → `/api/v2` endpoint mappings, composed user journeys, and explicit implementation gaps:

| Guide | Contents |
|-------|----------|
| **[`scenarios/FLAGSHIP_SCENARIOS.md`](./scenarios/FLAGSHIP_SCENARIOS.md)** | Full tables for fair lottery, sealed bid, and committee selection; recommended step order per scenario |
| [`planning/BUILD_SCOPE.md`](./planning/BUILD_SCOPE.md) | Condensed scenario tables inside program scope (themes T1–T6) |

Confirm request/response shapes in OpenAPI (`/docs`) when wiring UI or scripts.

---

## RNG trust and transparency (theme T3)

| Guide | Contents |
|-------|----------|
| **[`RNG_METHODOLOGY.md`](./RNG_METHODOLOGY.md)** | Entropy sources and backends, `/generate` vs `/quantum` vs oracle/VRF, commit–reveal audit path, health endpoints, honest limitations, audit-hook field map |

Linked from [`planning/BUILD_SCOPE.md`](./planning/BUILD_SCOPE.md) (T3) and [`../PRODUCTION.md`](../PRODUCTION.md).

---

## Protect-style cryptography (theme T6)

**Primary guide:** **[`PROTECT_API_GUIDE.md`](./PROTECT_API_GUIDE.md)** — copy-paste `curl` examples, optional Python snippets, request/response shapes, demo vs production notes, and links to contract tests (`tests/contract/test_flagship_api.py`).

Covers symmetric **encrypt/decrypt** (text and file), **salted / PBKDF2 hashing**, **HMAC sign/verify**, **secure-random** and **`/generate/*` token helpers**, with base URL `http://localhost:8000/api/v2` (port may increment if 8000 is busy — see startup banner from `python run_api.py`).

| Topic | Documented in |
|-------|----------------|
| Encrypt / decrypt (text + file) | [`PROTECT_API_GUIDE.md`](./PROTECT_API_GUIDE.md) §1–2 |
| Hash / salt | [`PROTECT_API_GUIDE.md`](./PROTECT_API_GUIDE.md) §3 |
| Tokens, passwords, secure random | [`PROTECT_API_GUIDE.md`](./PROTECT_API_GUIDE.md) §4 |
| HMAC sign / verify | [`PROTECT_API_GUIDE.md`](./PROTECT_API_GUIDE.md) §5 |
| Scenario mapping | [`scenarios/FLAGSHIP_SCENARIOS.md`](./scenarios/FLAGSHIP_SCENARIOS.md) |

Program scope: **T6** in [`planning/BUILD_SCOPE.md`](./planning/BUILD_SCOPE.md).

---

## Research demo — Gradio Hugging Face slice (theme T5)

| Artifact | Use it for |
|----------|------------|
| **[`../gradio-demo/README.md`](../gradio-demo/README.md)** | HF Space README, env vars (`QCRYPT_API_BASE_URL`), local run, scope vs full product |
| [`../gradio-demo/app.py`](../gradio-demo/app.py) | Gradio entrypoint (Randomize bytes, VRF chain, Protect encrypt) |
| [`../gradio-demo/Dockerfile`](../gradio-demo/Dockerfile) | Lightweight Docker Space build **without** Next.js |

The repo root [`Dockerfile`](../Dockerfile) is the **full operator stack** (Nginx + FastAPI + Next on port **7860**). Use `gradio-demo/` when publishing a dependency-light researcher Space that calls the API over HTTP.

Program scope: **T5** in [`planning/BUILD_SCOPE.md`](./planning/BUILD_SCOPE.md); milestone **M4** in [`planning/MILESTONES.md`](./planning/MILESTONES.md).

---

## Operations and deployment

- **[`../PRODUCTION.md`](../PRODUCTION.md)** — Production deployment guide (dual stack vs Gradio, env vars, CI, known gaps).
- **[`planning/LAUNCH_CHECKLIST.md`](./planning/LAUNCH_CHECKLIST.md)** — Sprint 6 / M4 pre-launch smoke and sign-off (API, UI, Gradio Space, Compose, docs).

---

## Historical / archived write-ups

Implementation-era summaries are kept under [`archive/`](./archive/) for reference; they are not the canonical planning source. Use **`planning/`** for current scope and phasing.
