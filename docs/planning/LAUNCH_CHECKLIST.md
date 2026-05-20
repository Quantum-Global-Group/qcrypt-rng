# Launch checklist (Sprint 6 / M4)

**Purpose:** Pre-release smoke tests and doc gates before publishing the Gradio researcher Space and declaring launch docs current. Complements [`../../PRODUCTION.md`](../../PRODUCTION.md).

**PO (role):** GTM/Docs PO · **Supporting:** Platform/API PO, UX/Scenario PO

---

## 1. Pre-launch smoke — local / CI parity

- [ ] **API health** — `python run_api.py`; `curl -sf http://localhost:8000/health` (adjust port if busy)
- [ ] **API ready** — `curl -sf http://localhost:8000/health/ready`
- [ ] **OpenAPI loads** — `http://localhost:8000/docs`
- [x] **Python tests** — from repo root: `pytest tests/ -v` (matches CI)
- [x] **Frontend lint** — `cd quantum-oracle-ui && npm run lint`
- [x] **Frontend build** — `cd quantum-oracle-ui && npm run build`
- [x] **Contract / flagship tests** — `pytest tests/contract/ -v` if present and API-independent

---

## 2. Gradio demo — local smoke

- [ ] API running with reachable `/api/v2`
- [ ] `cd gradio-demo && pip install -r requirements.txt`
- [ ] `export QCRYPT_API_BASE_URL=http://localhost:8000/api/v2 && python app.py`
- [ ] Open `http://localhost:7860` — **Check API health** succeeds
- [ ] **Randomize — bytes** returns data
- [ ] **Prove — VRF** chain: seed → prove → reveal → verify
- [ ] **Protect — encrypt** returns ciphertext
- [ ] **Docker build** — `docker build -t qcrypt-gradio-demo ./gradio-demo` succeeds

---

## 3. Hugging Face Space — Gradio slice publish

- [ ] Create or update **Docker Space** pointing at `gradio-demo/` (not root Dockerfile)
- [ ] Set Space secret **`QCRYPT_API_BASE_URL`** to public API (include `/api/v2`)
- [ ] Confirm target API **CORS / network** allows Space origin (or same-site proxy)
- [ ] If API uses `REQUIRE_API_KEY=true`, document demo key or proxy bypass for Space
- [ ] Space README matches [`../../gradio-demo/README.md`](../../gradio-demo/README.md) scope (included vs not included)
- [ ] Post-deploy: health check + one tab per pillar (Randomize, Prove/VRF, Protect)

---

## 4. Full stack — Compose / port 7860

- [ ] `docker-compose up -d --build` from repo root
- [ ] `curl -sf http://localhost:7860/health`
- [ ] Dashboard loads at `http://localhost:7860`
- [ ] OpenAPI via `http://localhost:7860/swagger`
- [ ] Home dashboard tabs reach API (oracle, protect, rng)
- [ ] `/blockchain/*` routes load (prove, protect, randomize)
- [ ] **Not expected:** Streamlit in this stack ([`STREAMLIT_DECISION.md`](./STREAMLIT_DECISION.md))

---

## 5. Documentation review

- [ ] [`../README.md`](../README.md) — golden path matches `run_api.py` + `npm run dev`
- [ ] [`../../PRODUCTION.md`](../../PRODUCTION.md) — dual deployment, env vars, CI, gaps current
- [ ] [`../RNG_METHODOLOGY.md`](../RNG_METHODOLOGY.md) — entropy sources and VRF limitations accurate
- [ ] [`../PROTECT_API_GUIDE.md`](../PROTECT_API_GUIDE.md) — curl examples run against local API
- [ ] [`../scenarios/FLAGSHIP_SCENARIOS.md`](../scenarios/FLAGSHIP_SCENARIOS.md) — step → UI → API tables match code
- [ ] [`../../gradio-demo/README.md`](../../gradio-demo/README.md) — env vars and HF publish steps
- [ ] [`BUILD_SCOPE.md`](./BUILD_SCOPE.md) T5/T6 and M4 exit criteria reflect shipped state
- [ ] Cold reader can follow Protect guide + one flagship scenario without engineering help (note gaps explicitly)

---

## 6. Security and production honesty

- [ ] Production deploy plan sets `REQUIRE_API_KEY=true` and **`VALID_API_KEYS`** (not length-only fallback)
- [ ] `SECRET_KEY` rotated from placeholder; `ENVIRONMENT=production`
- [ ] Team acknowledges **VRF in-memory store** — audit trail lost on restart ([`../RNG_METHODOLOGY.md`](../RNG_METHODOLOGY.md))
- [ ] Team acknowledges **API key system** is allow-list env vars only — no DB/Redis rotation ([`../../PRODUCTION.md`](../../PRODUCTION.md#known-limitations-and-gaps))
- [ ] HF full-stack demo vs locked-down prod key policy documented for stakeholders

---

## 7. Post-launch / parking lot (not blockers)

- [ ] API key hardening — DB/Redis lookup, rotation, tier binding (M2 carryover)
- [ ] Persistent VRF store (survive restart)
- [ ] M3 UX gaps — scenario wizard, pillar naming bridge, committee selection UI
- [ ] CI: add Gradio build or compose smoke job (optional)
- [ ] Remove or update legacy Streamlit references in `k8s/` manifests
- [ ] Playwright or E2E when shell stabilizes

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| GTM/Docs PO | | | Docs + checklist |
| Platform/API PO | | | API + deploy smoke |
| UX/Scenario PO | | | Gradio UX + scenario walkthrough |
| Security/Trust PO | | | Key policy + methodology review |

---

## Related

- [`MILESTONES.md`](./MILESTONES.md) — M4 exit criteria
- [`SPRINTS.md`](./SPRINTS.md) — Sprint 6 backlog
- [`BUILD_SCOPE.md`](./BUILD_SCOPE.md) — T5 Gradio, T6 Protect docs
