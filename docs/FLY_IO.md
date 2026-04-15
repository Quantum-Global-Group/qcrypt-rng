# Deploying QCrypt RNG on Fly.io

This repository ships a **single container** that runs:

- **Nginx** on port **7860** (public entrypoint; TLS is terminated at Fly’s edge, then HTTP reaches the machine on `internal_port`)
- **FastAPI** on `127.0.0.1:8000` (paths under `/api/`, `/health`, `/openapi.json`, `/redoc`, `/swagger`)
- **Next.js** (standalone) on `127.0.0.1:3000` (everything else)

The image is defined by the root [`Dockerfile`](../Dockerfile) and started with [`start-spaces.sh`](../start-spaces.sh). Fly.io does not use Hugging Face–specific settings; you only need the correct **internal port**, **build-time** `NEXT_PUBLIC_API_BASE_URL`, and **runtime** secrets (CORS, DB, etc.).

**File manifest:** every path the Docker build and Fly config depend on is listed in [`FLY_IO_FILES.md`](./FLY_IO_FILES.md). A starter **`fly.toml.example`** lives at the [repository root](../fly.toml.example).

Official Fly references: [Launch](https://fly.io/docs/launch/), [App configuration (`fly.toml`)](https://fly.io/docs/reference/configuration/), [Health checks](https://fly.io/docs/reference/health-checks/), [Postgres](https://fly.io/docs/postgres/).

---

## Prerequisites

- A [Fly.io](https://fly.io) account and billing method (if required for your plan).
- [`flyctl`](https://fly.io/docs/hands-on/install-flyctl/) installed locally and logged in: `fly auth login`.

---

## 1. Choose an app name (important for the UI)

The browser bundle needs the **public API URL at build time** (`NEXT_PUBLIC_API_BASE_URL`). That URL is derived from your Fly app name:

`https://<app-name>.fly.dev/api/v2`

Pick `<app-name>` before the first production build (e.g. `qcrypt-rng`). You can change it later, but you must **rebuild** the image after any change so the Next.js client picks up the new base URL.

---

## 2. Configure the Docker build (UI → API)

The root `Dockerfile` supports:

```dockerfile
ARG NEXT_PUBLIC_API_BASE_URL=
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
```

Set this at **build** time to your canonical HTTPS origin + `/api/v2`, for example:

`https://qcrypt-rng.fly.dev/api/v2`

Without this, the dashboard code falls back to localhost port probing and will not talk to the API in production.

---

## 3. Create `fly.toml`

From the repository root, the fastest path is:

```bash
cd /path/to/qcrypt-rng
fly launch --no-deploy
```

Then edit the generated `fly.toml` so that:

1. **`internal_port` matches Nginx** — **7860** (not 8080).
2. **Build args** pass the public API base URL (adjust name to match your app):

```toml
[build]
  dockerfile = "Dockerfile"
  [build.args]
    NEXT_PUBLIC_API_BASE_URL = "https://YOUR-APP-NAME.fly.dev/api/v2"
```

3. **HTTP health check** hits the backend via Nginx (recommended path `/health`):

```toml
[http_service]
  internal_port = 7860
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[http_service.checks]]
  interval = "15s"
  timeout = "10s"
  grace_period = "45s"
  method = "GET"
  path = "/health"
```

4. **VM size** — This image builds Next.js and runs Python + Node + Nginx. If the machine OOMs or is slow to boot, raise memory in `fly.toml` (for example `[[vm]]` `memory = "2gb"` — exact keys depend on your `fly.toml` version; `fly launch` usually adds a `[[vm]]` block you can edit).

Validate configuration:

```bash
fly config validate
```

---

## 4. Secrets and environment (runtime)

Set secrets **after** the app exists (`fly launch` creates it):

```bash
# Strong random value in production
fly secrets set SECRET_KEY="$(openssl rand -base64 32)"

# CORS: allow your Fly hostname (comma-separated if multiple)
fly secrets set ALLOWED_ORIGINS="https://YOUR-APP-NAME.fly.dev"
```

Other settings from [`app/config.py`](../app/config.py) can be set similarly, for example:

```bash
fly secrets set ENVIRONMENT=production DEBUG=false LOG_LEVEL=INFO
```

If you use **Fly Postgres**, create and attach a cluster, then rely on the injected `DATABASE_URL` (see Fly’s Postgres docs). Point `DATABASE_URL` at that value if you manage it manually.

**Redis** is not in the default `Dockerfile` image; use Fly’s Redis/Upstash or omit if your deployment does not require it.

---

## 5. Deploy

```bash
fly deploy
```

Watch logs:

```bash
fly logs
```

Open the app:

```bash
fly open
```

Sanity checks:

- UI: `https://YOUR-APP-NAME.fly.dev`
- API docs (proxied): `https://YOUR-APP-NAME.fly.dev/swagger` (see [`nginx.spaces.conf`](../nginx.spaces.conf))
- Health: `https://YOUR-APP-NAME.fly.dev/health`

---

## 6. Custom domains

Add a certificate and hostname in the Fly dashboard or via `fly certs add`. After DNS is correct:

1. Update **`NEXT_PUBLIC_API_BASE_URL`** to `https://your-domain.example/api/v2` and **redeploy** so the Next.js client matches.
2. Append the custom origin to **`ALLOWED_ORIGINS`** (comma-separated).

---

## 7. Troubleshooting

| Symptom | Likely cause |
|--------|----------------|
| UI loads but shows “offline” or API errors | `NEXT_PUBLIC_API_BASE_URL` missing or wrong at **build** time; rebuild with correct `[build.args]` and redeploy. |
| CORS errors in the browser | `ALLOWED_ORIGINS` does not include your exact `https://` origin (no trailing slash). |
| Health check failures / 502 on deploy | Cold start too slow — increase `grace_period` or VM memory; confirm `internal_port = 7860`. |
| `/api/...` 404 | Traffic must hit Nginx on 7860; do not expose 8000 or 3000 separately unless you change the image. |

---

## 8. Optional: Postgres on Fly (outline)

1. `fly postgres create` — note cluster name and region (often same as `primary_region` in `fly.toml`).
2. `fly postgres attach --app YOUR-APP-NAME YOUR-POSTGRES-APP-NAME` — sets `DATABASE_URL` on the app.
3. Redeploy if migrations or schema are required for your environment.

---

## 9. Relationship to `docker-compose.yml`

Local [`docker-compose.yml`](../docker-compose.yml) maps host **9878** → container **8000** for API-only style testing. The **Fly** image is the **full stack** on **7860** via the root `Dockerfile`; do not assume the same port mapping as Compose when configuring Fly.

---

## Checklist

- [ ] `internal_port = 7860` in `fly.toml`
- [ ] `[build.args] NEXT_PUBLIC_API_BASE_URL = "https://<app>.fly.dev/api/v2"`
- [ ] `fly secrets set ALLOWED_ORIGINS="https://<app>.fly.dev"`
- [ ] `fly secrets set SECRET_KEY=...` (production)
- [ ] `[[http_service.checks]]` on `/health` with adequate `grace_period`
- [ ] Optional: Postgres attached and `DATABASE_URL` set
