# Venture overview

## Product

- **Primary product:** Next.js dashboard (`quantum-oracle-ui`) plus the full FastAPI backend—one platform framing Prove, Protect, and Randomize as integrated, scenario-driven workflows (see `AGENTS.md`).
- **Research / operator UX:** Long-term direction is a **single shell** combining operator-style navigation and research/lab routes, not two parallel products.

## Complementary offering

- **Hugging Face Space (in build):** A **Gradio**-based, **dependency-light**, researcher-facing **demo slice**—not a pixel-perfect copy of the dashboard. The main product remains **Next.js + full API**.

## Deployment references

- **Fly.io (full stack container):** `docs/FLY_IO.md` — e.g. build-time `NEXT_PUBLIC_API_BASE_URL`, internal port `7860`.
- **Local dev (unified):** `python scripts/start.py` from the repo root starts API + Next with aligned env; API-only: `python run_api.py` (default port `9878`).

## Non-goals for the HF lite

- Parity with every router in `app/main.py` (billing, full blockchain/oracle surface, etc.) unless explicitly phased in.
- Treating the Gradio demo as a second “product” UI—it's a **narrow** research terminal.

## See also

- `docs/HF_GRADIO_LITE.md` — scope and implementation plan for the Space.
- `docs/ARCHITECTURE_SPLIT.md` — full app vs lite diagram and boundaries.
- `hf_space/README.md` — how to run the Gradio app locally and on Spaces.
