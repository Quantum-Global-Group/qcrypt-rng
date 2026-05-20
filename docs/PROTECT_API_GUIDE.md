# Protect API guide

**Purpose:** Analyst-grade reference for **Protect-style cryptography** on the FastAPI v2 surface — symmetric encrypt/decrypt, salted hashing, HMAC sign/verify, secure random values, and related **Randomize** token helpers. For scenario context (sealed bid, lottery manifest hashing), see [`scenarios/FLAGSHIP_SCENARIOS.md`](./scenarios/FLAGSHIP_SCENARIOS.md).

**Theme:** Program **T6** / milestone **M4** — launch-gap documentation ([`planning/BUILD_SCOPE.md`](./planning/BUILD_SCOPE.md)).

---

## Before you call the API

| Item | Detail |
|------|--------|
| Start server | From repo root: `python run_api.py` (activates `.venv` if you use one). |
| Default port | **8000**. If busy, `run_api.py` scans upward (8001, 8002, …) and prints the chosen port. |
| Base URL | `http://localhost:8000/api/v2` — replace the port if the startup banner shows another. |
| Prefix | `/api/v2` (`app/config.py` → `API_PREFIX`). |
| Interactive contract | `http://localhost:<port>/docs` (OpenAPI). |
| Content types | **Protect router** endpoints use **`multipart/form-data`** (`curl -F`). **Generate** token/password/bytes use **JSON** (`curl -H "Content-Type: application/json"`). |

All successful Protect/Generate responses share the same envelope:

```json
{
  "status": "success",
  "request_id": "enc_1730000000000000",
  "data": { },
  "metadata": { }
}
```

Errors return HTTP 4xx/5xx with a `detail` string (FastAPI default), not always the `BaseResponse` envelope.

---

## Endpoint map

| Operation | Method | Path | Body style |
|-----------|--------|------|------------|
| Encrypt text | POST | `/protect/encrypt` | form |
| Decrypt text | POST | `/protect/decrypt` | form |
| Encrypt file | POST | `/protect/encrypt-file` | multipart (file + fields) |
| Decrypt file | POST | `/protect/decrypt-file` | form |
| Hash (salted / PBKDF2) | POST | `/protect/hash` | form |
| Generate salt | POST | `/protect/salt` | form |
| HMAC sign | POST | `/protect/sign` | form |
| HMAC verify | POST | `/protect/verify` | form |
| Secure random | POST | `/protect/secure-random` | form |
| Session token | POST | `/generate/token` | JSON |
| Secure password | POST | `/generate/password` | JSON |
| Random bytes | POST | `/generate/bytes` | JSON |

Router source: `app/api/v2/endpoints/protect.py`, `app/api/v2/endpoints/generate.py`.

---

## 1. Symmetric encrypt and decrypt (text)

**Algorithms:** `AES-256-GCM` (default), `AES-128-GCM`, `AES-256-CBC` (CBC uses an HMAC tag over IV+ciphertext).

**Encrypt** — quantum-generated key and IV unless you pass `key` (base64):

```bash
curl -sS -X POST "http://localhost:8000/api/v2/protect/encrypt" \
  -F "data=sealed-bid-amount-42000" \
  -F "use_quantum_key=true" \
  -F "algorithm=AES-256-GCM"
```

Example `data` object (fields you need for decrypt):

```json
{
  "ciphertext": "<base64>",
  "iv": "<base64>",
  "tag": "<base64>",
  "key": "<base64>",
  "algorithm": "AES-256-GCM",
  "quantum_enhanced": true
}
```

**Decrypt** — paste values from the encrypt response:

```bash
curl -sS -X POST "http://localhost:8000/api/v2/protect/decrypt" \
  -F "ciphertext=REPLACE_CIPHERTEXT_B64" \
  -F "key=REPLACE_KEY_B64" \
  -F "iv=REPLACE_IV_B64" \
  -F "tag=REPLACE_TAG_B64" \
  -F "algorithm=AES-256-GCM"
```

Example decrypt `data`:

```json
{
  "plaintext": "sealed-bid-amount-42000",
  "verified": true
}
```

**Optional: supply your own key** (32 bytes for AES-256, base64-encoded):

```bash
# Example only — generate a real key in production; never commit secrets.
MY_KEY_B64="$(python3 -c 'import base64, os; print(base64.b64encode(os.urandom(32)).decode())')"

curl -sS -X POST "http://localhost:8000/api/v2/protect/encrypt" \
  -F "data=hello" \
  -F "use_quantum_key=false" \
  -F "key=${MY_KEY_B64}" \
  -F "algorithm=AES-256-GCM"
```

### Minimal Python (encrypt → decrypt)

```python
import requests

BASE = "http://localhost:8000/api/v2"
plain = "sealed-bid-amount-42000"

enc = requests.post(
    f"{BASE}/protect/encrypt",
    data={"data": plain, "algorithm": "AES-256-GCM"},
).json()
assert enc["status"] == "success"
pkg = enc["data"]

dec = requests.post(
    f"{BASE}/protect/decrypt",
    data={
        "ciphertext": pkg["ciphertext"],
        "key": pkg["key"],
        "iv": pkg["iv"],
        "tag": pkg["tag"],
        "algorithm": pkg["algorithm"],
    },
).json()
assert dec["data"]["plaintext"] == plain
```

**Contract test:** `tests/contract/test_flagship_api.py` → `TestProtectEncryptDecryptRoundTrip` (Scenario B — sealed bid). Run with `pytest tests/contract/test_flagship_api.py -m contract`.

---

## 2. File encrypt and decrypt

**Limits:** max **10 MB** per upload; returns base64 ciphertext in JSON (not a downloadable blob).

**Encrypt file:**

```bash
curl -sS -X POST "http://localhost:8000/api/v2/protect/encrypt-file" \
  -F "file=@./bid.txt;type=text/plain" \
  -F "algorithm=AES-256-GCM"
```

`data` includes `original_filename`, `original_size`, plus `ciphertext`, `iv`, `tag`, `key`, `algorithm`.

**Decrypt file** — same fields as text decrypt; response uses `content_base64` instead of `plaintext`:

```bash
curl -sS -X POST "http://localhost:8000/api/v2/protect/decrypt-file" \
  -F "ciphertext=REPLACE" \
  -F "key=REPLACE" \
  -F "iv=REPLACE" \
  -F "tag=REPLACE" \
  -F "algorithm=AES-256-GCM"
```

Decode locally: `echo "$CONTENT_B64" | base64 -d > bid-restored.txt`

---

## 3. Password and salted hashing

### Hash sensitive input

**Algorithms:** `SHA3-256`, `SHA3-512`, `PBKDF2-SHA256`, `BLAKE2b-256`. Salt is quantum-generated by default (`use_quantum_salt=true`).

```bash
curl -sS -X POST "http://localhost:8000/api/v2/protect/hash" \
  -F "data=demo-password-not-a-real-secret" \
  -F "algorithm=PBKDF2-SHA256" \
  -F "use_quantum_salt=true" \
  -F "iterations=100000"
```

Example `data`:

```json
{
  "hash": "<base64>",
  "salt": "<base64>",
  "algorithm": "PBKDF2-SHA256",
  "iterations": 100000,
  "quantum_salt": true,
  "entropy_bits": 256
}
```

**Gap:** There is **no** `/protect/verify-hash` or password-check endpoint. To verify, re-run PBKDF2 (or your chosen algorithm) client-side with the returned `salt`, or add a dedicated verify route in a future API slice.

**Docstring note:** `Argon2` is mentioned in the handler docstring but **not implemented** — only the algorithms above are accepted.

### Standalone salt

```bash
curl -sS -X POST "http://localhost:8000/api/v2/protect/salt" \
  -F "size=32" \
  -F "encoding=hex"
```

`encoding`: `hex`, `base64`, or `list` (byte array).

---

## 4. Random tokens and secure random values

### Session token (`/generate/token`) — JSON

```bash
curl -sS -X POST "http://localhost:8000/api/v2/generate/token" \
  -H "Content-Type: application/json" \
  -d '{"length": 32, "url_safe": true, "expires_in": 3600}'
```

Example `data`:

```json
{
  "token": "<url-safe string>",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expires_at": "2026-05-18T12:00:00.000000"
}
```

### Secure password (`/generate/password`) — JSON

```bash
curl -sS -X POST "http://localhost:8000/api/v2/generate/password" \
  -H "Content-Type: application/json" \
  -d '{
    "length": 20,
    "include_uppercase": true,
    "include_lowercase": true,
    "include_numbers": true,
    "include_symbols": true,
    "exclude_ambiguous": true
  }'
```

### Raw bytes (`/generate/bytes`) — JSON

```bash
curl -sS -X POST "http://localhost:8000/api/v2/generate/bytes" \
  -H "Content-Type: application/json" \
  -d '{"length": 32, "format": "hex", "quantum_bits": 8}'
```

### Typed secure random (`/protect/secure-random`) — form

Use for integers (e.g. lottery-style draws), floats, byte blobs, or UUIDs:

```bash
# One integer in [0, 99]
curl -sS -X POST "http://localhost:8000/api/v2/protect/secure-random" \
  -F "type=integer" \
  -F "min=0" \
  -F "max=99" \
  -F "count=1"

# Five UUIDs
curl -sS -X POST "http://localhost:8000/api/v2/protect/secure-random" \
  -F "type=uuid" \
  -F "count=5"
```

`type` values: `integer`, `float`, `bytes`, `uuid`. For `count > 1`, `data.values` is an array; for `count=1`, `data.values` is a single value.

See also [`RNG_METHODOLOGY.md`](./RNG_METHODOLOGY.md) for entropy backends and limitations.

---

## 5. Sign and verify (HMAC)

These endpoints implement **HMAC-SHA256** or **HMAC-SHA512** with a quantum-generated key. They are **message-authentication codes**, not asymmetric digital signatures.

**Sign:**

```bash
curl -sS -X POST "http://localhost:8000/api/v2/protect/sign" \
  -F "data=manifest-v1-ticket-list" \
  -F "algorithm=HMAC-SHA256"
```

Example `data`:

```json
{
  "signature": "<base64>",
  "public_key": "<base64>",
  "algorithm": "HMAC-SHA256",
  "data_hash": "<sha256 hex of input>",
  "quantum_enhanced": true
}
```

The field `public_key` is the **HMAC key** (base64) required for verification — store it with the signature.

**Verify:**

```bash
curl -sS -X POST "http://localhost:8000/api/v2/protect/verify" \
  -F "data=manifest-v1-ticket-list" \
  -F "signature=REPLACE_SIG_B64" \
  -F "public_key=REPLACE_KEY_B64" \
  -F "algorithm=HMAC-SHA256"
```

Example `data`: `{ "valid": true, "algorithm": "HMAC-SHA256", "data_integrity": "intact" }`.

For **post-quantum** sign/verify, use `/api/v2/pqc/sign` and `/api/v2/pqc/verify` (separate router; not covered here).

---

## Scenario quick links

| Scenario step | Protect APIs |
|---------------|--------------|
| Seal bid ciphertext | `POST /protect/encrypt` |
| Open bid | `POST /protect/decrypt` |
| Fingerprint manifest | `POST /protect/hash`, `/sign` |
| Lottery integer draw (API-only) | `POST /protect/secure-random` (`type=integer`) |
| Session / API nonce | `POST /generate/token` |

Full step → UI → API tables: [`scenarios/FLAGSHIP_SCENARIOS.md`](./scenarios/FLAGSHIP_SCENARIOS.md).

---

## Demo-grade vs production-ready

| Area | Status | Notes |
|------|--------|--------|
| Encrypt/decrypt round-trip | **Works** | Verified in contract tests; suitable for integration demos. |
| Encrypt response includes `key` | **Demo-grade** | Server returns the AES key in the response. Production sealed-bid flows should use **client-held keys**, KMS, or key wrapping — not long-term key echo from the API. |
| HMAC `sign` / `verify` | **Demo-grade** | Fine for integrity demos; field name `public_key` is misleading. Not non-repudiation or third-party verification. |
| Password hashing | **Partial** | Hashing works; **no verify endpoint**. PBKDF2 iterations default to 100k — tune for your threat model. |
| Argon2 | **Not implemented** | Listed in docstring only. |
| File endpoints | **Demo-grade** | 10 MB cap; base64-in-JSON; no streaming or object storage integration. |
| Quantum entropy | **Environment-dependent** | May use simulated or hardware-backed RNG per deployment; see [`RNG_METHODOLOGY.md`](./RNG_METHODOLOGY.md). |
| Auth / API keys | **Out of scope (T2)** | Endpoints are open in default dev; production should gate with API keys or reverse-proxy auth. |
| Audit persistence | **Gap** | No server-side storage of encrypt/hash/sign operations for compliance trails. |
| UI parity | **Gap** | `/blockchain/protect` (`ProtectVault`) wires encrypt/hash/PQC sign but **not** decrypt — home protect tab has decrypt. |

---

## Related artifacts

| Doc | Use |
|-----|-----|
| [`README.md`](./README.md) | Documentation index |
| [`scenarios/FLAGSHIP_SCENARIOS.md`](./scenarios/FLAGSHIP_SCENARIOS.md) | Prove / Protect / Randomize flagship flows |
| [`RNG_METHODOLOGY.md`](./RNG_METHODOLOGY.md) | Entropy and randomness limitations |
| [`planning/BUILD_SCOPE.md`](./planning/BUILD_SCOPE.md) | T6 definition of done |
| OpenAPI `/docs` | Authoritative request field names and enums |

---

## Validation checklist (cold reader)

1. Start API; note printed port.
2. Run encrypt curl; copy `ciphertext`, `key`, `iv`, `tag`, `algorithm` from `data`.
3. Run decrypt curl; confirm `plaintext` matches.
4. Run `POST /protect/hash` with `PBKDF2-SHA256`; confirm `hash` and `salt` present.
5. Run `POST /generate/token`; confirm `token` and optional `expires_at`.
6. Optional: `pytest tests/contract/test_flagship_api.py -m contract -k Protect`.
