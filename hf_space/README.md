# Hugging Face Gradio lite (IBM Runtime)

Small **Gradio** UI that calls the same IBM Quantum Runtime logic as the main FastAPI API (`app/quantum/ibm_runtime_core.py`). It is **not** a copy of the Next.js dashboard.

## Run locally (monorepo)

From the **repository root**:

```bash
pip install -r hf_space/requirements.txt
python hf_space/app.py
```

Then open the URL Gradio prints (defaults to `http://127.0.0.1:7860`).

You need IBM Cloud **IAM API key** and **Quantum service instance CRN** (same inputs as `/research/ibm-runtime` in the full UI).

## Hugging Face Spaces

**Recommended:** Point the Space at this **whole repository** so `app/` imports work, and set the app entry to:

- **App file:** `hf_space/app.py`
- **Working directory:** repository root (parent of `hf_space/`)

If the Space UI only allows `app.py` at the repo root, symlink or copy:

- `cp hf_space/app.py ./app_gradio.py` and set **App file** to `app_gradio.py`, **or**
- Use a **Docker** Space with `WORKDIR` set to the repo root and `CMD ["python", "hf_space/app.py"]`.

See `docs/HF_GRADIO_LITE.md` for scope, exclusions, and phases.

## Security

Credentials are **typed into the UI only** and are **not** written to disk by this demo. Do not commit secrets. For production-style server-side keys, use Space **Secrets** only if you add that feature explicitly.
