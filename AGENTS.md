## Learned User Preferences

- Prefers Prove, Protect, and Randomize to read as integrated, scenario-driven workflows so the value is obvious—not as three disconnected feature areas.
- Wants a small set of flagship scenarios (for example fair lottery with audit trail, sealed bid, committee-style selection) each spelled out as user-visible steps with clear mapping to which APIs or modes belong to Prove vs Protect vs Randomize.
- Expects blockchain-tab Prove and Protect experiences to match the same “why this matters” bar as the randomness flows.
- Wants analyst- and researcher-grade presentation: generous structure, spacing, and hierarchy so serious users can scan and operate the tools quickly.
- Does not want a standalone guided tour as part of the product surface.
- Product direction is toward one primary platform: unify operator-style navigation with research/lab routes into a single shell and mental model rather than maintaining two parallel experiences long term.
- Plans a separate Hugging Face Space as a Gradio-based, dependency-light demo (researcher-facing slice), while the main product stays Next.js plus the full API—not a pixel-perfect mirror of the dashboard.

## Learned Workspace Facts

- Repo is a monorepo-style stack: FastAPI backend at the root, Next.js dashboard under `quantum-oracle-ui`, plus contracts and SDKs elsewhere in the tree.
- Typical local run: activate root `.venv`, install Python deps from `requirements.txt`, then `python run_api.py` (API defaults to port **9878**, OpenAPI at `/docs`; qcrypt-rng-specific to avoid clashing with other FastAPI apps on 8000/8780). Alternatively, `python scripts/start.py` from the repo root starts API and Next together with aligned env.
- Frontend: `cd quantum-oracle-ui`, `npm install` if needed, `npm run dev`; dev port is chosen by `find-port.js` starting from **3980** (scans upward if busy; avoids 3000/3040/3180 used by many templates).
- Point the UI at a non-default API with `NEXT_PUBLIC_API_BASE_URL` (see `quantum-oracle-ui/env.example`).
- Container option: `docker-compose up -d` from the repo root when using the Docker path from the README.
- Fly.io–oriented deployment for the bundled Nginx + FastAPI + Next image is documented in `docs/FLY_IO.md` (for example build-time `NEXT_PUBLIC_API_BASE_URL` and internal port **7860**).
- `liboqs` integration can fail to install in some dev environments (for example missing or renamed upstream branches); the stack may warn and fall back until `liboqs` is installed correctly.
