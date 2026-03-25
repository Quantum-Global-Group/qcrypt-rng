# Legacy components

These are **not** part of the primary product path. The supported dashboard is **Next.js** in `quantum-oracle-ui/`.

| Path | Description |
|------|-------------|
| `streamlit/dashboard.py` | Old Streamlit UI; run from repo root: `streamlit run legacy/streamlit/dashboard.py` |
| `streamlit/.streamlit/` | Streamlit config |
| `demo_showcase.py` | Rich/aiohttp demo against a running API |
| `ui_server.py` | Serves static HTML from `legacy/static/` (e.g. `quantum_oracle_ui.html`) on port 8080 |
| `static/*.html` | Legacy static pages |
