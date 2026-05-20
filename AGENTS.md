## Learned User Preferences

- Prefers Prove, Protect, and Randomize to read as integrated, scenario-driven workflows so the value is obvious—not as three disconnected feature areas.
- Wants a small set of flagship scenarios (for example fair lottery with audit trail, sealed bid, committee-style selection) each spelled out as user-visible steps with clear mapping to which APIs or modes belong to Prove vs Protect vs Randomize.
- Expects blockchain-tab Prove and Protect experiences to match the same “why this matters” bar as the randomness flows.
- Wants analyst- and researcher-grade presentation: generous structure, spacing, and hierarchy so serious users can scan and operate the tools quickly.
- Does not want a standalone guided tour as part of the product surface.
- Product direction is toward one primary platform: unify operator-style navigation with research/lab routes into a single shell and mental model rather than maintaining two parallel experiences long term.
- Plans a separate Hugging Face Space as a Gradio-based, dependency-light demo (researcher-facing slice), while the main product stays Next.js plus the full API—not a pixel-perfect mirror of the dashboard.
- Wants launch-gap / incomplete-feature documentation to explicitly cover Protect-style cryptography (symmetric encrypt/decrypt, password or salted hashing, random token generation), not only oracle, billing, PQC, or API-key storage topics.
- Drives product implementation incrementally from `docs/planning/` (milestones, sprints, build scope) rather than ad-hoc feature lists.
- After subagent delegation, prefers a brief third-person completion confirmation only—do not re-summarize subagent output unless asked.

## Learned Workspace Facts

- Repo is a monorepo-style stack: FastAPI backend (`app/` at the root), Next.js dashboard under `quantum-oracle-ui`, plus contracts and SDKs elsewhere in the tree.
- Typical local API run: activate root `.venv`, install Python deps from `requirements.txt`, then `python run_api.py` (defaults to port **8000** and scans upward if the port is busy; OpenAPI at `/docs`).
- Frontend: `cd quantum-oracle-ui`, `npm install` if needed, `npm run dev`; dev port is chosen by `find-port.js` starting from **3000** (scans upward if busy).
- Configure the dashboard’s API origin with environment variables (for example `NEXT_PUBLIC_API_BASE_URL`) so the UI targets the running FastAPI prefix (commonly `/api/v2`).
- Container option: `docker-compose` from the repo root when using the Docker path from the README; the root `Dockerfile` builds a single image (Nginx + FastAPI + Next) suitable for Hugging Face Spaces and similar hosts (public app port **7860** per README).
- See `PRODUCTION.md` for production deployment notes.
- `liboqs` integration can fail to install in some dev environments (for example missing or renamed upstream branches); the stack may warn and fall back until `liboqs` is installed correctly.
- On Fly.io, if an app has no Machines yet, `flyctl` may be unable to infer app config from existing Machines; use an explicit root `fly.toml` aligned with the `Dockerfile` (and build-time public API URL) instead of relying on inference alone.
- Program planning artifacts live under `docs/planning/` (`BUILD_SCOPE.md`, `MILESTONES.md`, `PRODUCT_OWNERS.md`, `SPRINTS.md`, plus decision memos such as `STREAMLIT_DECISION.md`).
- Streamlit `dashboard.py` is lab-only legacy UI; primary web surface is Next.js (`quantum-oracle-ui`); Streamlit is not on the default Docker Compose or Hugging Face Spaces image path (see `STREAMLIT_DECISION.md`).
- CI baseline: `.github/workflows/ci.yml` runs frontend lint/build and root `pytest`; `make test` only runs `test_qrng.py`.
- QA without UI e2e: use root `pytest`, `quantum-oracle-ui` `npm run lint`/`build`, and `test_api.py` with API up; no Playwright/Cypress in the UI package.
