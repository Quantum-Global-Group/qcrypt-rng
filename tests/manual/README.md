# Manual test scripts

These are **standalone scripts** (Rich, httpx, etc.), not pytest tests. Pytest is configured to collect only `tests/unit/` and `tests/integration/`.

Run from the **repository root** (so `app` imports work):

```bash
python tests/manual/test_qrng.py
python tests/manual/test_api.py    # requires API at http://localhost:9878
python tests/manual/test_demo.py
```
