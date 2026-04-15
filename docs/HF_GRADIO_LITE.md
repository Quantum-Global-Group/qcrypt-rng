# Hugging Face Gradio lite — plan and status

## Goal

A **free-tier-friendly** Hugging Face Space that keeps **IBM Quantum Runtime** useful for researchers, sharing core *behavior* with the main product without shipping the whole surface area.

## Current implementation

| Item | Location |
|------|----------|
| Gradio UI | `hf_space/app.py` |
| Shared IBM logic | `app/quantum/ibm_runtime_core.py` |
| FastAPI wrapper (full API) | `app/api/v2/endpoints/ibm_runtime.py` |
| Lite dependencies | `hf_space/requirements.txt` |

The FastAPI routes under `/api/v2/ibm-runtime/*` delegate to `ibm_runtime_core` so behavior stays aligned with the Gradio demo.

## v1 scope

- **Must:** IBM Runtime — SDK check, connect / list backends sample, run minimal Bell circuit + proof digest (same semantics as the API).
- **Should:** Clear README for local + HF layout.

## Explicit exclusions (v1)

- Stripe / billing webhooks.
- Full blockchain / `web3` / multi-chain oracle fulfillment.
- Full monitoring / Prometheus stack.
- Next.js build inside the Gradio Space (use `Dockerfile.spaces` separately if you need full UI on HF).

## Later phases (optional)

- **v1.1:** One extra tab — e.g. a small **QRNG** or **PQC** demo using stable deps; avoid `liboqs` on HF until builds are verified on CPU Basic.
- **Reuse:** Keep extending `ibm_runtime_core`-style modules for any flow shared between API and Gradio.

## Dependencies (conceptual)

- `gradio`, `qiskit`, `qiskit-ibm-runtime`, `numpy` — see `hf_space/requirements.txt`.

## Links

- Main IBM UI: `quantum-oracle-ui` → `/research/ibm-runtime`.
- Fly / full container: `docs/FLY_IO.md`.
- Heavier HF pattern (Next + API): root `Dockerfile.spaces`, `start-spaces.sh`.
