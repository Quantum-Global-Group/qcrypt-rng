# Dashboard Integration and Monitoring Implementation Plan

**Source:** Dashboard + Monitoring Plan (Phase 2 Tasks 3–4)
**Status:** Both tasks COMPLETE (verified 2026-03-23; frontend builds successfully)

---

## Part 1: Dashboard Integration (Task 3)

### 1.1 API Layer Additions

**File:** `quantum-oracle-ui/src/utils/api.ts`

- **Kyber KEM:** `kemGenerate`, `kemEncapsulate`, `kemDecapsulate`
- **Oracle Fulfillment:** `configureFulfillmentChain`, `createFulfillmentRequest`, `getFulfillmentStatus`, `listFulfillmentRequests`, `getFulfillmentChains`, `retryFulfillment`

**File:** `quantum-oracle-ui/src/types/index.ts` — KEM and fulfillment response types

### 1.2 Kyber KEM UI in Protect.tsx

- Algorithm: KYBER512 / KYBER768 / KYBER1024
- Flow: Generate keypair → Sender encapsulate → Recipient decapsulate
- Copy/Download, InfoPopover for workflow explanation

### 1.3 Expanded PQC Algorithms in Protect.tsx

- Signatures: DILITHIUM2/3/5, FALCON512/1024, SPHINCS+-SHA2-128f
- KEM (keys only): KYBER, NTRU, SABER — show key gen, link to Kyber KEM section

### 1.4 Oracle Fulfillment UI in QuantumOracle.tsx

- Configure Chain (rpc_url, private_key, etc.) — security warning
- Create Request, Status Lookup, List Requests, Retry
- Collapsible, default collapsed

### 1.5 Docs Page

- Add Kyber KEM and Oracle Fulfillment endpoint docs

---

## Part 2: Monitoring (Task 4) — COMPLETED

34 Prometheus metrics implemented in `app/monitoring/metrics.py` across 7 categories: oracle fulfillment (7), PQC operations (6), QRNG generation (4), hardware devices (5), entropy quality (4), API performance (5), system (3). Grafana dashboard and alerting rules in `app/monitoring/`. All monitoring endpoints active in `app/api/v2/endpoints/monitoring.py`.

---

## Implementation Order

1. API layer: KEM + fulfillment methods - Done
2. Kyber KEM UI in Protect - Done
3. Expanded PQC dropdown + KEM-only mode - Done
4. Oracle Fulfillment UI in QuantumOracle - Done
5. Docs page update - Done

---

## Security Notes

- Oracle fulfillment: Never use production keys; demo/test only
- Mask private_key input (type="password")
