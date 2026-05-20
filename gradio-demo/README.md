---
title: QCrypt RNG Research Demo
emoji: 🔬
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# QCrypt RNG — Research Demo (Gradio)

Dependency-light **researcher-facing slice** of the [QCrypt RNG](https://github.com/Quantum-Global-Group/qcrypt-rng) platform. This Space is a thin HTTP client to the FastAPI `/api/v2` surface — not a mirror of the Next.js dashboard.

## What is included

| Tab | API | Pillar |
|-----|-----|--------|
| **Randomize — bytes** | `POST /generate/bytes` | Randomize |
| **Prove — VRF audit trail** | `POST /oracle/vrf/seed` → `prove` → `reveal` → `verify` | Prove + Randomize |
| **Protect — encrypt** | `POST /protect/encrypt` | Protect |

## What is not included

- API key / auth UI (production deployments may require keys — see main repo `PRODUCTION.md`)
- Scenario wizards, blockchain tab, billing, PQC KEM, file encrypt/decrypt, oracle batch, ops/monitoring
- Persistent VRF store (API keeps VRF state **in memory**; lost on API restart)

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `QCRYPT_API_BASE_URL` | `http://localhost:8000/api/v2` | FastAPI v2 prefix (with or without trailing `/api/v2`) |
| `PORT` | `7860` | Gradio listen port (HF Spaces sets this) |

### Deployment patterns

1. **Gradio Space + API elsewhere** — Deploy this `gradio-demo/` Docker Space and set `QCRYPT_API_BASE_URL` to your public API (Fly.io, self-hosted, etc.).
2. **Local dev** — Run API and Gradio on the same machine (see below).
3. **Full product on HF** — The repo root [`Dockerfile`](../Dockerfile) builds Nginx + FastAPI + Next.js on port **7860**; that is the **operator dashboard**, not this Gradio slice. Use this folder when you want a separate, minimal Space.

## Run locally

From the **monorepo root**, start the API:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run_api.py
```

In another terminal, run the Gradio demo:

```bash
cd gradio-demo
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export QCRYPT_API_BASE_URL=http://localhost:8000/api/v2
python app.py
```

Open `http://localhost:7860`. Use **Check API health** before generating.

### Docker (Gradio only)

```bash
docker build -t qcrypt-gradio-demo ./gradio-demo
docker run --rm -p 7860:7860 \
  -e QCRYPT_API_BASE_URL=http://host.docker.internal:8000/api/v2 \
  qcrypt-gradio-demo
```

On Linux, replace `host.docker.internal` with your host IP or run API in the same Docker network.

## Documentation links

- [RNG methodology](../docs/RNG_METHODOLOGY.md) — entropy sources, VRF audit path, limitations
- [Protect API guide](../docs/PROTECT_API_GUIDE.md) — encrypt/decrypt, hash, secure-random
- [Flagship scenarios](../docs/scenarios/FLAGSHIP_SCENARIOS.md) — lottery, sealed bid, committee flows
- [Build scope T5](../docs/planning/BUILD_SCOPE.md) — program definition of done

## Publishing as a Hugging Face Space

Option A — **Separate Docker Space** (recommended for this folder):

1. Create a Docker Space on Hugging Face.
2. Point the Space repo at `gradio-demo/` (subfolder push or dedicated repo mirroring these files).
3. Set `QCRYPT_API_BASE_URL` in Space secrets/settings to your deployed API.
4. Build uses [`gradio-demo/Dockerfile`](./Dockerfile).

Option B — **SDK Gradio Space**: copy `app.py`, `api_client.py`, and `requirements.txt` to the Space root; set `sdk: gradio` in README front matter instead of `sdk: docker`.

The existing monorepo Space at the root uses the **full-stack** Dockerfile; do not replace it with this image unless you intentionally want API-only + Gradio without Next.js.
