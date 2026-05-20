# QCrypt RNG - Production Deployment Guide

This guide describes how to deploy and operate QCrypt RNG in production. For program phasing and launch gates, see [`docs/planning/LAUNCH_CHECKLIST.md`](docs/planning/LAUNCH_CHECKLIST.md).

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Deployment surfaces](#deployment-surfaces)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)
- [Continuous Integration (CI)](#continuous-integration-ci)
- [Documentation index](#documentation-index)
- [Known limitations and gaps](#known-limitations-and-gaps)
- [Security Considerations](#security-considerations)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

QCrypt RNG is a monorepo with a FastAPI backend (`app/`) and a Next.js dashboard (`quantum-oracle-ui/`). Optional data stores (PostgreSQL, Redis) support persistence and rate limiting when configured.

| Component | Role |
|-----------|------|
| **API server** | FastAPI on `/api/v2` — randomness, oracle/VRF, Protect crypto, PQC |
| **Dashboard (primary)** | Next.js operator/research shell |
| **Gradio demo (`gradio-demo/`)** | Dependency-light researcher slice; HTTP client to the API only |
| **Legacy Streamlit (`dashboard.py`)** | **Lab-only** — not in default Compose, root Dockerfile, or CI; see [`docs/planning/STREAMLIT_DECISION.md`](docs/planning/STREAMLIT_DECISION.md) |
| **Database / cache** | PostgreSQL and Redis (optional for local dev; used in Compose) |
| **Quantum backend** | Simulated by default; real hardware via env-configured backends |

## Deployment surfaces

Two supported deployment patterns — do not conflate them.

### Full stack (operator product)

- **Image:** root [`Dockerfile`](Dockerfile) — Nginx + FastAPI + Next.js
- **Published port:** **7860** (Nginx fronts UI and proxies API)
- **Use when:** Hugging Face Spaces full product, `docker-compose up`, or any deployment needing the Next.js dashboard
- **OpenAPI:** `/swagger` on the same host (proxied through Nginx)

### Thin Gradio Space (researcher demo)

- **Image:** [`gradio-demo/Dockerfile`](gradio-demo/Dockerfile) — Gradio only, no bundled API or Next.js
- **Published port:** **7860** (Gradio listen port; HF Spaces sets `PORT`)
- **Use when:** Separate HF Space calling a **public API elsewhere**
- **Required env:** `QCRYPT_API_BASE_URL` → your deployed `/api/v2` prefix
- **Scope:** Randomize bytes, VRF chain, Protect encrypt — not dashboard parity; see [`gradio-demo/README.md`](gradio-demo/README.md)

```text
Full stack:     [Browser] → Nginx:7860 → Next.js + FastAPI
Gradio slice:   [Browser] → Gradio:7860 → HTTP → external API
Local dev:      run_api.py:8000 + npm run dev (dashboard auto-discovers API)
```

## Prerequisites

Before a production deployment:

- **Docker** (Compose or single-image) or **Kubernetes** cluster (v1.20+)
- **Domain name** and **TLS** for public endpoints
- **PostgreSQL** and **Redis** when using Compose or multi-service layouts
- **Quantum backend credentials** (optional — simulator works without them)

Legacy **Streamlit** is not a deployment target. To experiment locally: `pip install streamlit && streamlit run dashboard.py` (see [`docs/planning/STREAMLIT_DECISION.md`](docs/planning/STREAMLIT_DECISION.md)). Kubernetes manifests under `k8s/` may still reference a separate dashboard deployment — treat Streamlit there as **deprecated / lab-only** until removed.

## Environment Configuration

Settings are loaded from environment variables via [`app/config.py`](app/config.py). Below are the variables most relevant to production and cross-service wiring.

### API server

```bash
# Application
ENVIRONMENT=production
DEBUG=false
APP_NAME="QCrypt RNG Production"
APP_VERSION="2.0.0"

# Listen (direct uvicorn; Nginx stack uses internal binding)
API_HOST=0.0.0.0
API_PORT=8000
API_PREFIX=/api/v2
ALLOWED_ORIGINS=https://yourdomain.com,https://dashboard.yourdomain.com

# Security
SECRET_KEY=your-very-long-secret-key-here-at-least-32-chars   # required in production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
MAX_REQUEST_BODY_SIZE_BYTES=1048576

# API keys (see Known limitations)
REQUIRE_API_KEY=true
API_KEY_HEADER=X-API-Key
VALID_API_KEYS=key-aaaa1111bbbb2222,key-cccc3333dddd4444

# Data stores
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port/0

# Quantum backend
QUANTUM_BACKEND=qrisp_simulator   # or ibm_quantum, iqm_quantum, rigetti, etc.
IBM_QUANTUM_TOKEN=...             # when using IBM

# Rate limits and tiers
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_PERIOD=3600
FREE_TIER_MAX_BYTES=256
FREE_TIER_MAX_REQUESTS=100
PRO_TIER_MAX_BYTES=1024
PRO_TIER_MAX_REQUESTS=1000
ENTERPRISE_TIER_MAX_BYTES=10240
ENTERPRISE_TIER_MAX_REQUESTS=10000
ENABLE_USAGE_TRACKING=true

# Logging / audit
LOG_LEVEL=INFO
ENABLE_DETAILED_LOGGING=true
ENABLE_AUDIT_LOGGING=true
AUDIT_LOG_RETENTION_DAYS=365
FIPS_MODE=false
```

**Defaults worth noting:**

| Variable | Default | Production note |
|----------|---------|-----------------|
| `REQUIRE_API_KEY` | `false` | Root Dockerfile and HF Spaces image set `false` for open demo; Compose example uses `true` |
| `VALID_API_KEYS` | unset | When unset and keys are required, any key **≥ 10 characters** is accepted — not suitable for production |
| `ENVIRONMENT` | `development` | Set `production` to enforce stricter startup checks |

### Next.js dashboard

Build-time / runtime (see `quantum-oracle-ui/.env.example`):

```bash
# Full URL to API v2 prefix, or relative path when same-origin behind Nginx
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com/api/v2
# In the root Dockerfile / Spaces image, production build uses:
# NEXT_PUBLIC_API_BASE_URL=/api/v2
```

If unset locally, the dashboard auto-discovers the API on ports **8000–8004**.

### Gradio demo (`gradio-demo/`)

```bash
QCRYPT_API_BASE_URL=https://api.yourdomain.com/api/v2
PORT=7860
```

The Gradio app has **no API-key UI**. If the target API has `REQUIRE_API_KEY=true`, configure keys at the reverse proxy or use a demo-only key in server config.

### Legacy Streamlit (lab only)

```bash
API_BASE_URL=https://api.yourdomain.com/api/v2
STREAMLIT_SERVER_PORT=8501
STREAMLIT_SERVER_HEADLESS=true
```

## Deployment Options

### Option 1: Docker Compose (full stack)

Uses the root [`Dockerfile`](Dockerfile) and [`docker-compose.yml`](docker-compose.yml). Streamlit is **not** included.

```bash
docker-compose up -d
```

After startup: UI and proxied API at `http://localhost:7860` (health: `GET /health`, OpenAPI: `/swagger`).

Compose sets `REQUIRE_API_KEY=true` — supply `VALID_API_KEYS` or adjust for your environment.

### Option 2: Hugging Face Spaces — full product

Build from repo root [`Dockerfile`](Dockerfile). Port **7860**. Image ships with `REQUIRE_API_KEY=false` for frictionless demo access. For a locked-down Space, override secrets at build/runtime.

### Option 3: Hugging Face Spaces — Gradio researcher slice

Build from [`gradio-demo/`](gradio-demo/) only. Set Space secret **`QCRYPT_API_BASE_URL`** to your public API. Do **not** replace the full-stack Space with this image unless you intentionally drop Next.js.

See [`gradio-demo/README.md`](gradio-demo/README.md) for publish steps.

### Option 4: Kubernetes

Manifests live under `k8s/`. Update secrets and image references for your cluster, then deploy (e.g. `./deploy.sh` if present). Verify whether dashboard manifests target Streamlit — prefer routing users to the Next.js image from the root Dockerfile.

### Option 5: Local development (golden path)

Not production, but the reference for smoke tests:

```bash
# Terminal 1 — API (default port 8000, scans upward if busy)
python run_api.py

# Terminal 2 — dashboard
cd quantum-oracle-ui && npm run dev
```

OpenAPI: `http://localhost:8000/docs`.

## Continuous Integration (CI)

Baseline pipeline: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (M1 / T1).

| Job | What it runs |
|-----|----------------|
| **frontend** | `npm ci`, `npm run lint`, `npm run build` in `quantum-oracle-ui/` |
| **python-tests** | `pytest tests/ -v` with deps from `requirements.txt` (liboqs skipped if unavailable) |

Triggers on push/PR to `main` or `master` when paths under `app/`, `tests/`, `quantum-oracle-ui/`, `requirements.txt`, or the workflow file change.

**Not in CI today:** Gradio demo build, `docker-compose` smoke, Playwright/E2E, full OpenAPI contract suite against a live server. Pre-launch checks for those are in [`docs/planning/LAUNCH_CHECKLIST.md`](docs/planning/LAUNCH_CHECKLIST.md).

Local equivalents:

```bash
pytest tests/ -v
cd quantum-oracle-ui && npm run lint && npm run build
```

## Documentation index

| Topic | Location |
|-------|----------|
| Docs hub | [`docs/README.md`](docs/README.md) |
| RNG trust, backends, VRF audit path | [`docs/RNG_METHODOLOGY.md`](docs/RNG_METHODOLOGY.md) |
| Protect encrypt/hash/sign/random (curl) | [`docs/PROTECT_API_GUIDE.md`](docs/PROTECT_API_GUIDE.md) |
| Flagship scenarios (lottery, sealed bid, committee) | [`docs/scenarios/FLAGSHIP_SCENARIOS.md`](docs/scenarios/FLAGSHIP_SCENARIOS.md) |
| Program scope and themes | [`docs/planning/BUILD_SCOPE.md`](docs/planning/BUILD_SCOPE.md) |
| Streamlit stance | [`docs/planning/STREAMLIT_DECISION.md`](docs/planning/STREAMLIT_DECISION.md) |
| Gradio Space | [`gradio-demo/README.md`](gradio-demo/README.md) |
| Launch checklist | [`docs/planning/LAUNCH_CHECKLIST.md`](docs/planning/LAUNCH_CHECKLIST.md) |

## Known limitations and gaps

Honest constraints for operators and auditors (not a certification statement):

| Area | Limitation |
|------|------------|
| **VRF audit store** | `_vrf_store` in [`app/api/v2/endpoints/vrf.py`](app/api/v2/endpoints/vrf.py) is **in-memory** — commitments and reveal state are **lost on API restart** |
| **API keys** | Allow-list via comma-separated `VALID_API_KEYS` only; no DB/Redis rotation, scopes, or per-key tiers in middleware. If `VALID_API_KEYS` is unset while `REQUIRE_API_KEY=true`, keys need only length ≥ 10 |
| **HF full-stack image** | Ships with `REQUIRE_API_KEY=false` — fine for public demo, not for private production without overrides |
| **Scenario UX (M3)** | No single scenario wizard; home tabs use **oracle / protect / rng** vs blockchain **Prove / Protect / Randomize** naming — see [`docs/scenarios/FLAGSHIP_SCENARIOS.md`](docs/scenarios/FLAGSHIP_SCENARIOS.md) gap inventory |
| **Gradio demo** | Subset of API; no auth UI, no persistent VRF across API restarts |
| **Streamlit / k8s** | `dashboard.py` and some `k8s/` dashboard manifests are legacy; not on the primary path |

For entropy claims, backend fallbacks, and audit-hook fields, rely on [`docs/RNG_METHODOLOGY.md`](docs/RNG_METHODOLOGY.md).

## Security Considerations

### API security

- Use **HTTPS** in production.
- **CORS** is restricted to `ALLOWED_ORIGINS` — never use `*` with credentials.
- **Security headers** on every response: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; in production also `Strict-Transport-Security` and `Content-Security-Policy`.
- **Request body limit** enforced (default 1 MB via `MAX_REQUEST_BODY_SIZE_BYTES`) → HTTP 413 when exceeded.
- **`SECRET_KEY`** must be ≥ 32 characters in production; startup fails if the default placeholder is detected when `ENVIRONMENT=production`.

### API key management

- Set `REQUIRE_API_KEY=true` for private deployments.
- Set **`VALID_API_KEYS`** to a comma-separated allow-list; validation uses constant-time comparison. Raw keys are not logged (SHA-256 prefix hash in security logs).
- **Production hardening still needed:** database or Redis-backed keys, rotation, tier mapping, and rejecting the length-only fallback when no allow-list is configured (tracked as post-launch work — see launch checklist).
- Enable rate limiting and rotate secrets regularly.

### Audit logging

- Security events (missing/invalid keys, rate limits) → `logs/security_<date>.log`.
- Retention default 90 days in config (`AUDIT_LOG_RETENTION_DAYS`); PRODUCTION examples often use 365 — set explicitly.
- Sensitive values (API keys, raw randomness) are not logged.

### Data protection

- Encrypt data in transit and at rest; follow least privilege; plan backups and security reviews.

### Quantum backend security

- Protect hardware credentials; monitor backend access; keep dependencies patched.

## Monitoring and Maintenance

### Key metrics

- API latency and error rates
- Quantum generation performance
- Database and Redis health
- `GET /health`, `GET /health/ready`
- Entropy/stats: `GET /api/v2/quantum/entropy`, `GET /api/v2/quantum/stats` (see [`docs/RNG_METHODOLOGY.md`](docs/RNG_METHODOLOGY.md))

### Logging

- Centralize logs; alert on critical errors; rotate and archive per policy.

### Maintenance

- Security patches, DB maintenance, backend calibration, performance tuning.

## Troubleshooting

### API server not starting

- Verify env vars (`SECRET_KEY`, `DATABASE_URL`, `ENVIRONMENT`)
- Check database connectivity and application logs under `logs/`

### Slow quantum generation

- Review `QUANTUM_BACKEND` and qubit settings; check backend quotas and latency metrics.

### Dashboard not connecting to API

- Confirm `NEXT_PUBLIC_API_BASE_URL` or same-origin `/api/v2` behind Nginx
- Check CORS (`ALLOWED_ORIGINS`) and network path from browser to API

### Gradio demo cannot reach API

- Verify `QCRYPT_API_BASE_URL` includes the `/api/v2` prefix
- If API requires keys, ensure the demo client can send `X-API-Key` (today: configure at proxy or relax demo API key policy)

### Getting help

- Logs in `logs/`
- OpenAPI at `/docs` (direct API) or `/swagger` (Nginx stack)
- GitHub issues: [quantumGlobalGroup/qcrypt-rng](https://github.com/quantumGlobalGroup/qcrypt-rng)

## Upgrading

1. Backup database and configuration
2. Read release notes for breaking changes
3. Test in staging
4. Deploy and monitor health endpoints and error rates

---

For launch gates and pre-release smoke tests, use [`docs/planning/LAUNCH_CHECKLIST.md`](docs/planning/LAUNCH_CHECKLIST.md).
