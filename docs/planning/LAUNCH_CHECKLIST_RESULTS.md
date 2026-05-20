# Launch checklist — smoke results

**Date:** 2026-05-18  
**Runner:** automated M4 close-out (local, no production secrets)  
**Workspace:** `/home/roc/quantumGlobalGroup/qcrypt-rng`

## Summary

| Area | Result |
|------|--------|
| Python `pytest tests/ -v` | **PASS** (17/17) |
| Frontend `npm ci` / lint / build | **PASS** |
| QCrypt API live smoke (`run_api.py` / curl) | **PASS** (re-run) — see addendum; port scan used **8001** when **8000** busy |
| Gradio `py_compile` | **PASS** |
| HF publish / API keys / Compose / doc review | **SKIP** (human or out of scope) |

**Overall (automated local scope):** **PARTIAL PASS** — CI + QCrypt API smoke green; Gradio/HF/Compose still out of scope; native `liboqs` optional for real PQC.

---

## Results table

| Checklist item | Status | Notes |
|----------------|--------|-------|
| **§1 API health** (`curl /health`) | FAIL | QCrypt server did not stay up. `curl :8000/health` returned `{"status":"ok"}` from **another** app on 8000, not QCrypt v2. |
| **§1 API ready** (`/health/ready`) | FAIL | `404` on port 8000 (foreign app). QCrypt route is `/health/ready` when QCrypt is running. |
| **§1 OpenAPI loads** (`/docs`) | FAIL | HTTP 200 on 8000 but OpenAPI paths lacked `/api/v2/*` (wrong process). QCrypt `/docs` not verified. |
| **§1 Python tests** | PASS | `pytest tests/ -v` — 17 passed in ~1s |
| **§1 Frontend lint** | PASS | `npm run lint` (after `npm ci`) |
| **§1 Frontend build** | PASS | `npm run build` — Next.js 16.1.6 success |
| **§1 Contract / flagship tests** | PASS | Included in suite: `tests/contract/test_flagship_api.py` (VRF chain, protect encrypt/decrypt) |
| **§2 Gradio — API reachable** | SKIP | Depends on QCrypt API up |
| **§2 Gradio — pip install** | SKIP | Not run (compile-only smoke) |
| **§2 Gradio — run app + UI tabs** | SKIP | Manual; requires API |
| **§2 Gradio — Docker build** | SKIP | Not run (time/local docker) |
| **§3 HF Space publish** | SKIP | Human + secrets |
| **§4 docker-compose / :7860** | SKIP | Not run |
| **§5 Documentation review** | SKIP | Human review |
| **§6 Security / production honesty** | SKIP | Human acknowledgment |
| **§7 Post-launch parking lot** | SKIP | Tracking only |
| **Gradio py_compile** (`app.py`, `api_client.py`) | PASS | `python -m py_compile` |
| **Gradio httpx health (optional)** | SKIP | `httpx` to `:8000/health` hit foreign service; not QCrypt |

---

## Commands run

```bash
cd /home/roc/quantumGlobalGroup/qcrypt-rng && source .venv/bin/activate && pytest tests/ -v
cd quantum-oracle-ui && npm ci && npm run lint && npm run build
python run_api.py   # background — see failures below
curl -sf http://localhost:8000/health
curl -s http://localhost:8000/health/ready
curl -s http://localhost:8000/api/v2/quantum/stats
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs
python -m py_compile gradio-demo/app.py gradio-demo/api_client.py
python -c "from app.main import app"   # import smoke
```

---

## Failure details (last ~20 lines)

### QCrypt API — `from app.main import app` / `uvicorn app.main:app`

```
liboqs not found, installing it in /home/roc/_oqs
Installing in 5 seconds...
...
Cloning into 'liboqs'...
warning: Could not find remote branch 0.14.1 to clone.
fatal: Remote branch 0.14.1 not found in upstream origin
Error installing liboqs.
Traceback (most recent call last):
  File ".../oqs/oqs.py", line 240, in _load_liboqs
    liboqs = _load_shared_obj(
  File ".../oqs/oqs.py", line 139, in _load_shared_obj
    raise RuntimeError(msg)
RuntimeError: No oqs shared libraries found
```

**Mitigation for humans:** Install system `liboqs` per README/PRODUCTION, or uninstall/disable broken `oqs` auto-install; free port 8000 or rely on `run_api.py` port scan and curl the printed port.

### Live curl on 8000 (wrong process)

```
/health/ready → {"detail":"Not Found"} (HTTP 404)
/api/v2/quantum/stats → {"detail":"Not Found"} (HTTP 404)
```

---

## Human-only blockers

- Hugging Face Space create/update and `QCRYPT_API_BASE_URL` secret
- Production `VALID_API_KEYS`, CORS for Space origin, `REQUIRE_API_KEY` policy
- Full Gradio manual tab walkthrough and `docker-compose` / Gradio Docker build
- Documentation cold-reader sign-off (§5–§6)
- Sign-off table in [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md)

---

## Related updates

- [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md) — checkboxes updated only for §1 items verified here
- [`MILESTONES.md`](./MILESTONES.md) — M4 exit criteria left unchecked (API smoke incomplete)

---

## Addendum — API smoke re-run (2026-05-18)

**Fix:** `app/quantum/pqc.py` — skip `import oqs` when no native `liboqs` is on disk (avoids broken auto-install + `SystemExit`); catch `SystemExit` if load is attempted anyway.

| Check | Result | Notes |
|-------|--------|-------|
| `pytest tests/ -v` | **PASS** | 17/17 |
| `from app.main import app` | **PASS** | ~0.6s, no auto-install countdown |
| `python run_api.py` | **PASS** | Port **8001** (8000 occupied by `qgq-platform`) |
| `GET /health` | **PASS** | `status: degraded` (entropy_pool false in dev) |
| `GET /health/ready` | **PASS** | `{"status":"ready"}` |
| `GET /api/v2/quantum/stats` | **PASS** | `status: success`, `backend: qrisp_simulator` |
| `GET /docs` | **PASS** | HTTP 200 |

**Remaining:** Install native `liboqs` for real PQC (fallback simulation only); Gradio/HF/Compose smoke still human/out of scope.
