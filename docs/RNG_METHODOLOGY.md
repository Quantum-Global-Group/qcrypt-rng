# RNG methodology and audit narrative

**Purpose:** Describe how randomness is produced in this stack, which API surfaces support verifiable audit stories, and what the platform does **not** claim. This document is for researchers, integrators, and internal scenario authors — not a certification or compliance attestation.

**Related:** [`scenarios/FLAGSHIP_SCENARIOS.md`](./scenarios/FLAGSHIP_SCENARIOS.md) (lottery, sealed bid, committee flows), [`planning/BUILD_SCOPE.md`](./planning/BUILD_SCOPE.md) (theme **T3**), live contract at `http://localhost:8000/docs` after `python run_api.py`.

---

## Scope and framing

| In scope | Out of scope (unless separately funded) |
|----------|----------------------------------------|
| Entropy sources, backends, and fallbacks as implemented in `app/quantum/` | NIST SP 800-90B certification, Common Criteria, or “quantum-certified RNG” marketing |
| How `/api/v2/generate/*`, `/api/v2/quantum/*`, and oracle/VRF routes relate | On-chain oracle delivery, persistent VRF store, committee selection API |
| Commit–reveal VRF as the **credible** audit path for lottery/committee scenarios | Guarantee that production deployments use physical QRNG hardware |
| Honest limits of `POST /api/v2/oracle/request` and simulated status | Formal verification of cryptographic implementations |

Default deployments are **demo/research-grade**: quantum-inspired or simulated backends with statistical self-checks, not a regulated entropy appliance.

---

## Architecture overview

```text
Client (Next.js / scripts)
        │
        ▼
FastAPI  /api/v2/*
        │
        ├── generate/*  ──► get_quantum_rng()  ──► QuantumRNG.generate_bytes (etc.)
        ├── quantum/*   ──► entropy pool stats, reseed, backend info
        ├── protect/secure-random ──► get_quantum_rng() / quantum crypto helpers
        └── oracle/*
              ├── /request, /status/*, /requests/batch  (simulated oracle workflow)
              └── /vrf/seed|prove|reveal|verify         (in-memory commit–reveal store)
```

Core implementation modules:

| Module | Role |
|--------|------|
| `app/quantum/qrng.py` | `QuantumRNG` — byte generation, entropy pool, statistics, `analyze_entropy()` |
| `app/quantum/hardware_interface.py` | `QuantumHardwareManager`, `SimulatedQRNG`, photonic/superconducting stubs |
| `app/quantum/commitment.py` | Keccak-256 commitments and VRF output (`keccak256(seed \|\| alpha)`) |
| `app/api/v2/endpoints/generate.py` | User-facing RNG products (bytes, keys, tokens, UUIDs, passwords, batch) |
| `app/api/v2/endpoints/quantum.py` | Operational visibility (entropy, stats, reseed, backend) |
| `app/api/v2/endpoints/oracle.py` | Blockchain-oriented **simulation** of oracle requests |
| `app/api/v2/endpoints/vrf.py` | Quantum seed + commit–reveal VRF (`_vrf_store`) |

Configuration: `app/config.py` — `QUANTUM_BACKEND`, `ENTROPY_POOL_SIZE`, `MIN_ENTROPY_THRESHOLD`, tier byte limits.

---

## Entropy sources and backends

### Configured backend (`QUANTUM_BACKEND`)

Valid values (validator in `app/config.py`): `qrisp_simulator`, `ibm_quantum`, `iqm_quantum`, `rigetti`, `ionq`, `amazon_braket`. Each maps to a **named config block** (simulator or vendor-shaped settings); wiring to live cloud queues is environment-dependent and not guaranteed in every dev install.

**Default path:** `qrisp_simulator`.

### What actually runs on each request

`QuantumRNG.generate_bytes()` (`app/quantum/qrng.py`):

1. **Hardware abstraction path** — When `backend_instance` is `qrisp` or `hardware`, measurements come from `QuantumHardwareManager.measure_qubits()`. For `qrisp_simulator`, a `SimulatedQRNG("qrisp")` device is registered (`_add_default_device()`), which uses Qrisp circuits when importable, else falls back inside the simulator class.
2. **Simulation path** — For other configured backend names, `backend_instance` is `simulation` and `_generate_quantum_simulation()` uses `secrets.randbits` per qubit (classical CSPRNG standing in for measurement).
3. **Post-processing** — Every measurement is passed through `_post_process()`: SHA3-256 over quantum bytes, `secrets.token_bytes(16)`, and `time.time_ns()` mixing. This is **not** raw hardware output; it targets uniform, application-ready bytes.
4. **Entropy pool** — Measurements append to an in-process `entropy_pool` (cap `ENTROPY_POOL_SIZE`, default 1000) used only for **internal** statistical analysis, not as a DRBG block export API.

### Fallback chain (summary)

| Condition | Behavior |
|-----------|----------|
| Qrisp not installed | Log: “Qrisp not available. Using quantum simulation.” Simulator or `_generate_quantum_simulation` path |
| `qrisp_simulator` | `SimulatedQRNG` → Qrisp if available, else classical simulation inside simulator |
| Non-`qrisp_simulator` / non-`hardware_*` backend name | `backend_instance = "simulation"` |
| IBM / Rigetti / etc. in config | Named in `GET /api/v2/quantum/backend` as *available*; generation still follows `QuantumRNG` init rules above unless explicitly integrated |

**Implication:** Metadata field `quantum_backend` on responses reflects **configuration**, not independent proof that a specific vendor device produced the bytes.

---

## `/api/v2/generate/*` vs `/api/v2/quantum/*`

### Generate (`app/api/v2/endpoints/generate.py`)

All routes call `get_quantum_rng()` and return structured responses with `request_id`, `metadata.quantum_backend`, timing, and qubit counts where applicable.

| Endpoint | Function |
|----------|----------|
| `POST /bytes` | Raw random bytes (`length`, `format`, `quantum_bits`) |
| `POST /key` | Algorithm-sized key material (AES/RSA/ECDSA) |
| `POST /token` | Session-style tokens |
| `POST /uuid` | RFC 4122 v4-style UUIDs from 16 quantum-sourced bytes |
| `POST /password` | Passwords with charset rules; uses `generate_bytes` + shuffle |
| `POST /batch` | Parallel or sequential multi-request byte generation |

These endpoints are the **direct RNG product surface**: suitable for keys, nonces, and sampling when a simple byte stream is enough. They do **not** by themselves provide a third-party verifiable commit–reveal story.

### Quantum operations (`app/api/v2/endpoints/quantum.py`)

| Endpoint | Function |
|----------|----------|
| `GET /entropy` | Shannon/min entropy, chi-square, autocorrelation, bit balance, `health_status` from `qrng.analyze_entropy()` (needs ≥100 pool samples or returns `insufficient_data`) |
| `GET /stats` | Bytes generated, generation count, avg time, pool size, backend name/status |
| `POST /reseed` | Clears pool, runs 100× `generate_bytes(32, 16)` to refill |
| `GET /backend` | `settings.quantum_backend`, config blob, advertised backend list, feature flags |

Use these for **ops and research visibility**, not as a public randomness beacon.

### Protect alternate (`POST /api/v2/protect/secure-random`)

`app/api/v2/endpoints/protect.py` — form-based integers, floats, bytes, or UUIDs using the same `get_quantum_rng()` / quantum crypto helpers. Useful for unbiased integers in committee-style workflows; still no built-in roster→index mapping.

---

## Oracle simulation vs VRF commit–reveal

Both live under prefix `/api/v2/oracle` (VRF router mounted on the same prefix in `app/main.py`).

### `POST /api/v2/oracle/request` — limited audit value

`app/api/v2/endpoints/oracle.py`:

- Generates bytes immediately via `qrng.generate_bytes()`.
- Computes `commitment = compute_commitment_hex(quantum_result.data)` (Ethereum-style `keccak256(abi.encodePacked(uint256))` per `app/quantum/commitment.py`).
- Returns a new `request_id` and metadata including `simulation_note`.
- Does **not** store seed or randomness keyed by `request_id` for a consistent later reveal.

`GET /api/v2/oracle/status/{request_id}` picks status from a **pseudo-random choice** seeded by `request_id` (`random.seed(request_id)`). Fulfilled responses may show synthetic `randomness` from `secrets.randbits`, not the bytes committed at request time.

`GET /api/v2/oracle/simulate-fulfillment/{request_id}` generates **fresh** quantum bytes and a new commitment — not tied to the original request’s secret.

**Use for:** UX demos, network tab tracing, batch commitment patterns (`POST /requests/batch`). **Do not use alone** as the audit story for fair lottery or committee selection.

### VRF flow — recommended audit path

`app/api/v2/endpoints/vrf.py` implements a **Keccak-256 commit–reveal** verifiable random function style workflow:

| Step | Endpoint | What happens |
|------|----------|--------------|
| 1. Commit | `POST /vrf/seed` | 32-byte `qrng.generate_bytes`; `commitment = keccak256(encodePacked(seed))`; seed stored in `_vrf_store[request_id]` |
| 2. Bind input | `POST /vrf/prove` | `output = keccak256(seed_bytes \|\| utf8(alpha))`; returns `output`, `commitment`, `alpha` |
| 3. Reveal | `POST /vrf/reveal` | Returns hex `seed`; marks `revealed` |
| 4. Verify | `POST /vrf/verify` | Checks commitment and output against supplied `seed`, `alpha`, `commitment`, `output` |

Cryptographic definitions: `app/quantum/commitment.py` (`compute_commitment_hex`, `compute_vrf_output_hex`).

**Credible lottery / committee narrative:** Publish `commitment` before the draw → bind round ID as `alpha` in `prove` → `reveal` seed → anyone runs `verify` or recomputes hashes offline. Fingerprint rosters separately via `POST /api/v2/protect/hash` or sign (see [Audit hooks](#audit-hooks-verifiable-artifacts)).

### Critical limitation: in-memory VRF store

```python
_vrf_store: Dict[str, dict] = {}  # app/api/v2/endpoints/vrf.py
```

- Survives only for the lifetime of the API process.
- **Lost on restart**; no PostgreSQL/Redis persistence in current code.
- Third-party auditors must **export and retain** `request_id`, `commitment`, `alpha`, `output`, and revealed `seed` themselves.

---

## Health and monitoring endpoints

| Endpoint | Prefix | Notes |
|----------|--------|-------|
| `GET /health` | `/health` | Aggregates API, quantum backend, entropy pool checks (`app/api/v2/endpoints/health.py`) |
| `GET /health/live` | `/health` | Liveness only |
| `GET /health/ready` | `/health` | Requires `backend_status == "operational"` |
| `GET /api/v2/quantum/entropy` | `/api/v2/quantum` | Statistical health of in-process pool |
| `GET /api/v2/oracle/network-info` | `/api/v2/oracle` | Network/hardware **demo** metrics |

Production checklist: [`../PRODUCTION.md`](../PRODUCTION.md). Database/cache checks in `/health` are placeholders unless wired in deployment.

---

## Audit hooks (verifiable artifacts)

Retain these fields from API responses (or recompute offline with the same functions in `app/quantum/commitment.py`):

| Artifact | Typical source | Verifier action |
|----------|----------------|-----------------|
| VRF commitment | `POST …/vrf/seed` → `data.commitment` | `keccak256(abi.encodePacked(uint256(seed)))` matches hex |
| VRF output | `POST …/vrf/prove` → `data.output` | `keccak256(seed \|\| alpha)` matches for revealed seed |
| VRF validity | `POST …/vrf/verify` | `data.valid`, `commitment_valid`, `output_valid` |
| Revealed seed | `POST …/vrf/reveal` → `data.seed` | Re-run verify; do not trust server-only after restart |
| Oracle commitment (weak) | `POST …/oracle/request` → `data.commitment` | Only meaningful if you also stored the preimage bytes returned at generation time (not persisted by API) |
| Manifest fingerprint | `POST …/protect/hash` | Compare digest of participant list / bid ciphertext |
| Integrity attestation | `POST …/protect/sign`, `POST …/pqc/sign` | `POST …/protect/verify`, `POST …/pqc/verify` |
| Raw entropy sample | `POST …/generate/bytes` | `metadata.quantum_backend`, `request_id`, `entropy_bits` for logging — not commit–reveal |

**Scenario mapping:** Fair lottery and committee selection — VRF path + Protect hash/sign; see [`scenarios/FLAGSHIP_SCENARIOS.md`](./scenarios/FLAGSHIP_SCENARIOS.md). Sealed bid — Protect encrypt/hash/sign; randomness optional for tie-breaks via `secure-random` or VRF.

---

## What we do not claim

- **Certified entropy:** No statement that output meets a named certification program or that `QUANTUM_BACKEND=ibm_quantum` implies live IBM hardware without your own integration proof.
- **Tamper-proof audit log:** VRF and oracle state are in-process; restarts and multi-instance deployments break continuity unless clients persist artifacts.
- **On-chain finality:** Oracle routes document simulation; chain delivery and fee fields are illustrative.
- **Unbiased committee pick:** No server-side `select-committee`; mapping VRF `output` to roster indices is application responsibility.
- **Oracle request consistency:** Status and fulfillment endpoints are not a trustworthy commit–reveal protocol.

---

## Suggested reading order for scenario authors

1. This document — pick **VRF** vs **generate** vs **oracle/request**.
2. [`scenarios/FLAGSHIP_SCENARIOS.md`](./scenarios/FLAGSHIP_SCENARIOS.md) — step → UI → API tables.
3. OpenAPI `/docs` — request/response schemas for your integration version.

---

## Document history

| Version | Notes |
|---------|--------|
| 2026-05 | Initial T3 / M2 methodology slice aligned with `app/quantum/*` and v2 oracle/VRF endpoints |
