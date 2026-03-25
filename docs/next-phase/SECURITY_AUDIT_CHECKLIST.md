# Security audit checklist (Phase 2 Task 6)

Internal pre-audit checklist. External audit recommended for production readiness.

**Audit date:** 2026-03-23
**Scope:** Blockchain integration, PQC key/signature handling, oracle fulfillment flow, smart contract

---

## 1. Blockchain integration

- [x] Key handling: secure storage, no plaintext in logs/config
  - Private keys passed via env vars or API params (masked in UI with `type="password"`)
  - `ChainConfig.private_key` is `Optional[str]`, never logged (verified in `oracle_service.py` and `ethereum.py`)
  - `.env.example` uses commented-out placeholders, not real keys
  - `.gitignore` excludes `.env`
  - **Note:** No HSM or KMS integration; acceptable for testnet, recommended for production

- [x] Replay protection: nonce, chain-specific safeguards
  - Nonce retrieved via `get_transaction_count('pending')` before each transaction (`ethereum.py:128`)
  - Chain ID included in all transactions (`ethereum.py:149`)
  - Solidity contract uses sequential `requestCounter` and checks `fulfilled` flag to prevent re-fulfillment

- [x] Gas: estimation, limits, failure handling
  - Gas estimation with 20% buffer (`ethereum.py:105`)
  - Configurable `gas_price_gwei` and `gas_limit` in `ChainConfig`
  - Default fallback of 100,000 gas if estimation fails
  - Contract uses `FULFILLMENT_GAS_LIMIT = 200000` for callback delivery

- [x] Transaction confirmation and retry logic
  - `wait_for_confirmation()` polls with configurable confirmations (default 3)
  - Deploy script waits for 5 confirmations
  - `retryFulfillment` API endpoint allows manual retry of failed requests
  - Failed fulfillments set `FulfillmentStatus.FAILED` with error message

---

## 2. PQC key and signature handling

- [x] Key generation: entropy source, side-channel considerations
  - Primary: liboqs `generate_keypair()` uses liboqs internal CSPRNG (OpenSSL-backed)
  - Fallback: Python `secrets.token_bytes()` (OS CSPRNG via `/dev/urandom`)
  - **Note:** Fallback keys are NOT cryptographically valid PQC keys (hash-derived), clearly documented as "NOT cryptographically secure - for testing only"
  - Quantum randomness from hardware backends (when available) feeds entropy pool

- [x] Signature verification: constant-time where applicable
  - liboqs `verify()` is constant-time (library-level guarantee)
  - Fallback verification uses `hashlib` comparison — not guaranteed constant-time
  - **Recommendation:** Add `hmac.compare_digest()` wrapper for fallback path if ever used in production

- [x] Key lifecycle: rotation, revocation, storage
  - Keys are ephemeral per API request (generated, used, not persisted)
  - No key rotation or revocation mechanism (not needed for stateless per-request model)
  - In-memory only; no key material written to disk
  - **Recommendation for production:** Add key caching with TTL and secure wiping

---

## 3. Oracle fulfillment flow

- [x] Manipulation: commit-reveal integrity
  - Two-phase commit-reveal enforced on-chain (`QuantumRandomnessOracle.sol`)
  - `submitCommitment()`: requires valid request, not fulfilled, no prior commitment
  - `fulfillRandomness()`: verifies `keccak256(abi.encodePacked(randomness)) == commitment`
  - `COMMIT_REVEAL_DELAY = 2` blocks between commit and reveal prevents front-running
  - `onlyOracleNode` modifier restricts commit/reveal to authorized address

- [x] Race conditions: concurrent requests, ordering
  - Python `OracleFulfillmentService` uses in-memory `Dict[str, OracleRequest]`
  - `asyncio.create_task()` for async fulfillment — no explicit locking
  - Python GIL provides thread safety for dict operations
  - **Risk:** Under high concurrency, nonce conflicts possible if multiple transactions submitted simultaneously
  - **Recommendation:** Add nonce manager with queue for production workloads

- [x] Input validation: request payloads, chain parameters
  - Chain name validated against supported list in `get_chain_adapter()` (`__init__.py:53-54`)
  - Contract addresses passed through Web3 checksum validation
  - API payloads validated via FastAPI/Pydantic type checking
  - Request IDs generated server-side (not user-controllable)

---

## 4. Smart contract review

- [x] Reentrancy analysis
  - `fulfillRandomness()` sets `request.fulfilled = true` BEFORE external calls
  - Callback uses `call{gas: FULFILLMENT_GAS_LIMIT}` (200,000 gas cap limits reentrancy surface)
  - **Finding F-001:** If callback reverts, refund path `requester.call{value}` executes — a malicious requester with a reverting `receive()` could trap the refund, but `fulfilled` is already true so no replay possible
  - **Severity:** Low (funds not at risk beyond the single request fee)

- [x] Access control
  - `onlyOwner` for admin functions (updateOracleNode, updateFee, withdrawFees)
  - `onlyOracleNode` for fulfillment functions (submitCommitment, fulfillRandomness)
  - No multi-sig or timelock — acceptable for testnet
  - **Recommendation for production:** Add multi-sig or governance for owner operations

- [x] Overflow/underflow protection
  - Solidity 0.8.19 has built-in overflow/underflow checks
  - No unchecked arithmetic blocks

- [x] Event emission
  - All state changes emit events (RandomnessRequested, CommitmentSubmitted, RandomnessFulfilled, OracleNodeUpdated, FeeUpdated)

---

## 5. Findings and remediations

| ID | Finding | Severity | File | Remediation | Status |
|----|---------|----------|------|-------------|--------|
| F-001 | Refund path in `fulfillRandomness` could revert if requester has reverting `receive()` | Low | `QuantumRandomnessOracle.sol:163-166` | Use pull-based refund pattern instead of push; or document that requester contracts must accept ETH | Documented |
| F-002 | Fallback PQC verification not constant-time | Low | `app/quantum/pqc.py` (fallback paths) | Use `hmac.compare_digest()` for comparisons in fallback mode | Documented |
| F-003 | No nonce manager for concurrent transactions | Low | `app/blockchain/ethereum.py:128` | Implement nonce queue/manager for high-throughput production use | Documented |
| F-004 | No HSM/KMS integration for private key storage | Medium | `app/blockchain/base.py:30` | Integrate AWS KMS, HashiCorp Vault, or hardware HSM for production | Documented |
| F-005 | Sequential requestCounter allows prediction | Info | `QuantumRandomnessOracle.sol:90` | Not exploitable (request creation is permissionless anyway) | N/A |
| F-006 | No multi-sig for contract admin operations | Info | `QuantumRandomnessOracle.sol:61-63` | Add Gnosis Safe or similar for production mainnet | Documented |

---

## 6. Summary

**Overall assessment:** The codebase is well-structured for testnet deployment with appropriate security controls. No critical or high-severity findings. Medium findings (F-004) and low findings (F-001, F-002, F-003) should be addressed before mainnet deployment.

**Recommendations for production:**
1. Integrate HSM/KMS for private key management
2. Add nonce manager for concurrent transaction handling
3. Implement pull-based refund pattern in smart contract
4. Add multi-sig governance for contract admin operations
5. Engage external security auditor for smart contract and backend review
6. Consider formal verification of the Solidity contract

**External audit:** Recommended before mainnet deployment. Scope should include smart contract, backend API, and key management.
