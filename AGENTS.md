## Learned User Preferences

- Prefers Prove, Protect, and Randomize to read as integrated, scenario-driven workflows so the value is obvious—not as three disconnected feature areas.
- Wants a small set of flagship scenarios (for example fair lottery with audit trail, sealed bid, committee-style selection) each spelled out as user-visible steps with clear mapping to which APIs or modes belong to Prove vs Protect vs Randomize.
- Expects blockchain-tab Prove and Protect experiences to match the same “why this matters” bar as the randomness flows.
- Wants analyst- and researcher-grade presentation: generous structure, spacing, and hierarchy so serious users can scan and operate the tools quickly.
- Does not want a standalone guided tour as part of the product surface.
- Product direction is toward one primary platform: unify operator-style navigation with research/lab routes into a single shell and mental model rather than maintaining two parallel experiences long term.

## Learned Workspace Facts

- Repo is a monorepo-style stack: FastAPI backend at the root, Next.js dashboard under `quantum-oracle-ui`, plus contracts and SDKs elsewhere in the tree.
- Typical local run: activate root `.venv`, install Python deps from `requirements.txt`, then `python run_api.py` (API defaults to port 8000, OpenAPI at `/docs`).
- Frontend: `cd quantum-oracle-ui`, `npm install` if needed, `npm run dev`; dev port is chosen by `find-port.js` (often ~3040 when free, but another port such as 3000 may be used if busy or already bound).
- Point the UI at a non-default API with `NEXT_PUBLIC_API_BASE_URL` (see `quantum-oracle-ui/env.example`).
- Container option: `docker-compose up -d` from the repo root when using the Docker path from the README.
- `liboqs` integration can fail to install in some dev environments (for example missing or renamed upstream branches); the stack may warn and fall back until `liboqs` is installed correctly.
