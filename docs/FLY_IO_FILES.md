# Files involved in a Fly.io deployment

This is a **checklist of everything** the Fly build and runtime need for the **single-container** stack (Nginx + FastAPI + Next.js) described in [`FLY_IO.md`](./FLY_IO.md). Paths are relative to the **repository root**.

---

## 1. Required: Fly app configuration (not fully in git by default)

| File | Role |
|------|------|
| **`fly.toml`** | Fly Machines config: `app` name, `primary_region`, `[build]` + **`NEXT_PUBLIC_API_BASE_URL`**, `[http_service]` **`internal_port = 7860`**, health checks. Usually created by `fly launch` then edited. |
| **`fly.toml.example`** | Committed template in this repo — copy or merge into your real `fly.toml` after `fly launch --no-deploy`. |

You **do not** commit secrets in `fly.toml`; use `fly secrets set` (see §5).

---

## 2. Required: Docker image definition (committed)

| File | Role |
|------|------|
| **[`Dockerfile`](../Dockerfile)** | Multi-stage build: Python 3.11 slim, Node 20, `pip install` from `requirements.txt`, `npm run build` in `quantum-oracle-ui` with `ARG NEXT_PUBLIC_API_BASE_URL`, copies `app/`, `nginx.spaces.conf`, `start-spaces.sh`. **`EXPOSE 7860`**. |
| **[`Dockerfile.spaces`](../Dockerfile.spaces)** | Kept in sync with `Dockerfile` for Hugging Face Spaces; **Fly uses `Dockerfile`** unless you change `[build] dockerfile`. |

---

## 3. Required: Container entrypoint and reverse proxy (committed)

| File | Role |
|------|------|
| **[`start-spaces.sh`](../start-spaces.sh)** | Starts **Uvicorn** on `127.0.0.1:8000`, **Next.js standalone** on `127.0.0.1:3000`, then **Nginx** in the foreground. |
| **[`nginx.spaces.conf`](../nginx.spaces.conf)** | Routes `/api/`, `/health`, `/openapi.json`, `/redoc`, `/swagger` → FastAPI; `/` → Next.js. **Public listen port: 7860.** |

---

## 4. Required: Backend source and Python deps (committed)

| Path | Role |
|------|------|
| **[`requirements.txt`](../requirements.txt)** | Python dependencies (`liboqs` line may be skipped in Docker; fallback still works). |
| **[`app/`](../app/)** | Entire FastAPI package — **must** be present for `uvicorn app.main:app`. |
| **[`run_api.py`](../run_api.py)** | Copied into the image by `Dockerfile` (local dev entrypoint; runtime uses `start-spaces.sh` + uvicorn). |

---

## 5. Required: Next.js UI (committed)

| Path | Role |
|------|------|
| **[`quantum-oracle-ui/package.json`](../quantum-oracle-ui/package.json)** | npm scripts and dependencies. |
| **[`quantum-oracle-ui/package-lock.json`](../quantum-oracle-ui/package-lock.json)** | Prefer committed for reproducible **`npm ci`** in Docker (optional but recommended). |
| **[`quantum-oracle-ui/`](../quantum-oracle-ui/)** (rest of tree) | Source, `next.config.ts` (**`output: 'standalone'`**), `public/`, etc. |

Build-time env that **must** match your public URL:

- **`NEXT_PUBLIC_API_BASE_URL`** = `https://<your-app>.fly.dev/api/v2` (or custom domain), set via **`[build.args]`** in `fly.toml` or `fly deploy --build-arg`.

---

## 6. Optional but common: runtime secrets (Fly, not files)

Set with **`fly secrets set`** — see [`app/config.py`](../app/config.py) for full list. Minimum for production:

| Secret / env | Purpose |
|--------------|---------|
| `SECRET_KEY` | Required in production (non-default). |
| `ALLOWED_ORIGINS` | Must include `https://<your-app>.fly.dev` (exact origin, no trailing slash). |
| `ENVIRONMENT`, `DEBUG`, `LOG_LEVEL` | Typical: `production`, `false`, `INFO`. |

Optional:

| Secret / env | Purpose |
|--------------|---------|
| `DATABASE_URL` | If using Postgres (e.g. `fly postgres attach`). |
| IBM / quantum provider tokens | Only if you use those API routes. |

**Redis:** not started inside the default image; attach external Redis or omit if unused.

---

## 7. Not used by this Fly image

| Path | Note |
|------|------|
| [`docker-compose.yml`](../docker-compose.yml) | Local/dev-style API + db + redis; different port story than Fly’s **7860** Nginx entrypoint. |
| [`hf_space/`](../hf_space/) | Gradio “lite” demo — separate from the Next + FastAPI bundle. |
| **`.env` / `.env.local`** | Local dev; production uses Fly secrets + build args. |

---

## 8. Minimal copy-paste inventory (repo files)

Everything below is what **`docker build -f Dockerfile .`** must be able to read from the build context:

```
Dockerfile
requirements.txt
app/
run_api.py
nginx.spaces.conf
start-spaces.sh
quantum-oracle-ui/
```

Plus Fly-side:

```
fly.toml          # you create / edit (see fly.toml.example)
```

---

## 9. Related docs

| Doc | Content |
|-----|---------|
| [`FLY_IO.md`](./FLY_IO.md) | Step-by-step deploy, secrets, troubleshooting. |
| [`HOSTING_ARCHITECTURE.md`](./HOSTING_ARCHITECTURE.md) | UI + backend architecture and ports. |
