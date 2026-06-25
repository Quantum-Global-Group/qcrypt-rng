# Flagship scenarios — Prove / Protect / Randomize

**Purpose:** Verified mappings from the Sprint 5 (T4) audit: user-visible steps, Next.js routes, `/api/v2` endpoints, and explicit **gaps** where implementation is missing. Program scope and theme definitions live in [`../planning/BUILD_SCOPE.md`](../planning/BUILD_SCOPE.md).

**API prefix:** `/api/v2` (default in `app/config.py`; routers mounted in `app/main.py`).

**UI surfaces:** Primary dashboard at `/` (`quantum-oracle-ui/src/app/page.tsx` — tabs **Prove**, **Protect**, **Randomize**, threats, network); blockchain pillar pages under `/blockchain/prove`, `/blockchain/protect`, `/blockchain/randomize`. Pillar names are unified across both surfaces.

---

## API inventory (scenario-relevant)

| Area | Prefix | Key endpoints |
|------|--------|---------------|
| RNG | `/api/v2/generate` | `POST /bytes`, `/key`, `/token`, `/uuid`, `/password`, `/batch` |
| Protect | `/api/v2/protect` | `POST /encrypt`, `/decrypt`, `/encrypt-file`, `/decrypt-file`, `/sign`, `/verify`, `/hash`, `/salt`, `/secure-random` |
| Oracle + VRF | `/api/v2/oracle` | `POST /request`, `GET /status/{id}`, `POST /requests/batch`, `GET /network-info`; VRF: `POST /vrf/seed`, `/vrf/prove`, `/vrf/reveal`, `/vrf/verify` |
| PQC | `/api/v2/pqc` | `POST /sign`, `/verify`; KEM: `/kem/generate`, `/kem/encapsulate`, `/kem/decapsulate` |
| Quantum | `/api/v2/quantum` | `GET /entropy`, `/stats`, `/backend`; `POST /reseed` |

Client wiring: `quantum-oracle-ui/src/utils/api.ts`.

---

## Scenario A — Fair lottery with audit trail

**User-visible goal:** Run a fair draw with tamper-evident inputs and a traceable randomness record.

### Step mapping

| Step | Pillar | UI route | API endpoint(s) | Notes |
|------|--------|----------|-----------------|-------|
| Publish commitment to entropy before draw | Prove + Randomize | `/` → oracle tab (Quantum VRF); `/blockchain/randomize` | `POST /api/v2/oracle/vrf/seed` | Preferred credible draw path |
| Bind draw inputs (e.g. round ID) to committed seed | Prove | Same | `POST /api/v2/oracle/vrf/prove` | |
| Reveal secret + verify fairness | Prove | Same (+ verify on home oracle tab) | `POST /api/v2/oracle/vrf/reveal`, `POST /api/v2/oracle/vrf/verify` | |
| Seal or fingerprint participant list / ticket manifest | Protect (+ Prove) | `/` → protect tab; `/blockchain/protect` | `POST /api/v2/protect/hash`, `/sign`, `/encrypt` | |
| Alternative: many independent commitments | Randomize | `/` → rng tab (batch oracle) | `POST /api/v2/oracle/requests/batch` | |
| Alternative: raw random bytes | Randomize | `/` → rng tab | `POST /api/v2/generate/bytes`, `POST /api/v2/protect/secure-random` | |
| Trace request in network UI | Randomize (ops) | `/` → network tab | `GET /api/v2/oracle/network-info`, `GET /api/v2/oracle/status/{request_id}` | |
| **gap** — End-to-end lottery wizard | — | **No dedicated route** | — | Compose `/` + `/blockchain/randomize` manually |
| **gap** — Oracle request vs reveal store | Prove / Randomize | `/` → oracle tab | `POST /api/v2/oracle/request` | No persisted seed/randomness by `request_id` for consistent reveal (unlike VRF); status partly simulated |
| **gap** — Persistent audit trail | Prove | — | VRF in-memory store | **Lost on API restart** |

### Composed user journey (recommended order)

1. **Fingerprint the draw pool** — On `/blockchain/protect` or `/` protect tab, hash or sign the participant/ticket manifest (`POST /api/v2/protect/hash` or `/sign`). *Pillar: Protect + Prove.*
2. **Commit to entropy** — On `/blockchain/randomize` or `/` oracle tab, run Quantum VRF: `seed` → `prove` with round/draw parameters bound in the proof input. *Pillar: Prove + Randomize.*
3. **Execute and verify the draw** — `reveal` then `verify` on the same surface; retain commitment, proof, and verification output for audit. *Pillar: Prove.*
4. **Optional ops trace** — Use `/` network tab + `GET /api/v2/oracle/status/{request_id}` if also using batch oracle requests. *Pillar: Randomize.*

**Demonstrability today:** Primitives work per step; **not** a single guided flow. Credible audit story is the **VRF** path, not `POST /oracle/request` alone.

**RNG methodology:** Entropy backends, VRF commit–reveal vs simulated oracle, in-memory store limits, and verifiable response fields — [`../RNG_METHODOLOGY.md`](../RNG_METHODOLOGY.md).

---

## Scenario B — Sealed bid

**User-visible goal:** Collect bids that stay confidential until open, then reveal verifiably.

### Step mapping

| Step | Pillar | UI route | API endpoint(s) | Notes |
|------|--------|----------|-----------------|-------|
| Encrypt bid (confidential until open) | Protect | `/` → protect tab; `/blockchain/protect` (encrypt) | `POST /api/v2/protect/encrypt` (optional `/encrypt-file`) | |
| Publish ciphertext / commitment only | Prove + Protect | Same + hash/sign | `POST /api/v2/protect/hash`, `/sign`; `POST /api/v2/pqc/sign` | |
| PQ-safe channel (optional) | Protect | `/` → protect tab | `POST /api/v2/pqc/kem/generate`, `/kem/encapsulate`, `/kem/decapsulate` | UI exposure varies |
| Open round / decrypt | Protect | `/` → protect tab decrypt | `POST /api/v2/protect/decrypt`, `/decrypt-file` | API ready |
| Verify integrity / signature | Prove | `/` → protect tab verify; `/blockchain/prove` | `POST /api/v2/protect/verify`, `POST /api/v2/pqc/verify` | |
| **gap** — Auction-round model | — | — | — | No round IDs, deadlines, or open phase in API/UI |
| **gap** — Time-lock / conditional reveal | Protect | — | — | No scheduled or conditional open |
| **gap** — Blockchain Protect decrypt loop | Protect | `/blockchain/protect` (`ProtectVault`) | `POST /api/v2/protect/decrypt` | **ProtectVault** does not wire decrypt or full verify |

### Composed user journey (recommended order)

1. **Seal each bid** — Encrypt on `/` protect tab (`POST /api/v2/protect/encrypt`); distribute only ciphertext. *Pillar: Protect.*
2. **Commit publicly** — Hash or sign the ciphertext (or a Merkle root) via `/protect/hash` or `/sign`; optional PQC signature for long-term integrity. *Pillar: Prove + Protect.*
3. **Close collection** — Operational step (no product support): record deadline and published commitments off-platform or in runbook.
4. **Open and verify** — Decrypt on `/` protect tab (`POST /api/v2/protect/decrypt`); verify with `/protect/verify` or `/blockchain/prove`. *Pillar: Protect + Prove.*

**Demonstrability today:** Full loop possible on **home protect tab**; **blockchain Protect** page is a partial demo (encrypt/hash/sign only).

---

## Scenario C — Committee-style selection

**User-visible goal:** Unbiased selection of a subset (e.g. jurors, reviewers) with auditability.

### Step mapping

| Step | Pillar | UI route | API endpoint(s) | Notes |
|------|--------|----------|-----------------|-------|
| Canonical roster / fingerprint | Prove (+ Protect) | `/blockchain/prove`; `/blockchain/protect` (hash); `/` protect tab | `POST /api/v2/protect/hash`; `POST /api/v2/pqc/sign`, `/pqc/verify` | |
| Agreed random seed bound to round | Randomize + Prove | `/`; `/blockchain/randomize` | `POST /api/v2/oracle/vrf/seed` … `prove` / `reveal` / `verify` | |
| Optional unbiased integer sampling | Randomize | — (API only) | `POST /api/v2/protect/secure-random` (`type=integer`) | |
| Deterministic selection from seed | Prove (algorithm) | `/` oracle tab (via select-committee) | `POST /api/v2/oracle/select-committee` | Fisher-Yates from VRF output; reproducible |
| **resolved** — Output → committee slots | Prove | — | `POST /api/v2/oracle/select-committee` | M3 fix: documented algorithm, deterministic, auditable |
| **resolved** — Home pillar naming | — | `/` (**Prove / Protect / Randomize**) ↔ `/blockchain/*` (**Prove / Protect / Randomize**) | — | M3 fix: unified naming, `PillarBridgeCallout` updated |

### Composed user journey (recommended order)

1. **Attest the pool** — Hash and optionally PQC-sign the roster on `/blockchain/prove` or protect surfaces. *Pillar: Prove (+ Protect).*
2. **Bind randomness to the round** — VRF `seed` → `prove` with round ID in proof input on `/blockchain/randomize`. *Pillar: Randomize + Prove.*
3. **Reveal and verify** — `reveal` + `verify` to obtain auditable output. *Pillar: Prove.*
4. **Select committee members** — Call `POST /api/v2/oracle/select-committee` with the verified VRF `output`, the roster, and desired size. The endpoint runs a deterministic Fisher-Yates shuffle seeded by the VRF output and returns the selected members plus their original indices. *Pillar: Prove (algorithm).*

**Demonstrability today:** Full end-to-end flow is in product — roster attestation → VRF beacon → reproducible committee selection.

**RNG methodology:** Binding randomness (`/oracle/vrf/*`), optional `POST /protect/secure-random`, and committee audit limits — [`../RNG_METHODOLOGY.md`](../RNG_METHODOLOGY.md).

---

## Cross-scenario gaps (M3 status)

| Gap | Affects | Status |
|-----|---------|--------|
| No scenario wizard or single URL | A, B, C | **Partial** — `/scenarios/{slug}` pages exist with step lists; interactive guided wizard not yet shipped |
| VRF / oracle persistence | A, C | **Open** — VRF in-memory only; `/oracle/request` not paired with stored reveal |
| Committee selection API/UI | C | **Resolved (M3)** — `POST /api/v2/oracle/select-committee` ships deterministic Fisher-Yates from VRF output |
| ProtectVault missing decrypt | B | **Open** — blockchain sealed-bid story still partial |
| Home vs blockchain pillar naming | A, B, C | **Resolved (M3)** — home tabs now use **Prove / Protect / Randomize** |

---

## Related artifacts

- [`../PROTECT_API_GUIDE.md`](../PROTECT_API_GUIDE.md) — Protect encrypt/hash/sign/random curl reference (T6)
- [`../RNG_METHODOLOGY.md`](../RNG_METHODOLOGY.md) — Entropy sources, VRF vs oracle simulation, audit hooks
- [`../planning/BUILD_SCOPE.md`](../planning/BUILD_SCOPE.md) — Themes T1–T6 and condensed scenario tables
- [`../planning/MILESTONES.md`](../planning/MILESTONES.md) — M3 exit criteria and audit status
- [`../README.md`](../README.md) — Documentation index and OpenAPI entry points
- Live contract: `http://localhost:8000/docs` after `python run_api.py`
