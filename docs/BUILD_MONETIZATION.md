# Build Map — Monetization (API + Oracle)

Step-by-step plan to add **paid tiers**, **billing**, and **oracle-specific metering** on top of QCrypt RNG. Assumes prerequisites in [UPGRADE_ROADMAP.md](UPGRADE_ROADMAP.md) (Phase A foundation).

---

## Current State (Baseline)

| Capability | Location | Gap |
|------------|----------|-----|
| Tier limits (free/pro/enterprise) | `app/config.py` — `get_tier_limits()` | OK |
| Usage logging | `usage_logs` in `app/utils/rate_limiting.py` | OK for analytics |
| Rate limiting per key | `UsageTracker.check_rate_limit()` | **Tier from `_get_tier()` is MD5 hash pseudo-tier** — must replace |
| API keys | `VALID_API_KEYS` + `api_key_middleware` | No link to Stripe/customer |
| Oracle `fee_required` | `app/api/v2/endpoints/oracle.py` | Placeholder; not tied to billing |

---

## Phase A — Foundation (Required First)

**Goal:** Map each API key to a tier authoritatively.

### Tasks

1. **Data model**
   - Option A: Extend `rate_limits` (already has `tier`) — ensure `tier` is set on key creation and read in `_get_tier()`.
   - Option B: New table `api_keys` with columns: `key_hash` (never store raw key), `tier`, `customer_id`, `created_at`, `revoked_at`.

2. **Replace `_get_tier()`** in `app/utils/rate_limiting.py`
   - Remove hash-based pseudo assignment.
   - Lookup: `SELECT tier FROM rate_limits WHERE api_key = ?` or `api_keys` equivalent.
   - Default: `free` if unknown key (or reject if `require_api_key` is true).

3. **Key lifecycle**
   - Admin script or endpoint to create key + set tier (or sync from Stripe webhook).
   - Migration: backfill existing keys from `VALID_API_KEYS` into `rate_limits` with tier `pro` or `enterprise` as needed.

4. **Oracle-specific counters (optional in A, required for hybrid plans)**
   - Add `oracle_fulfillments_count` or track via `usage_logs` filtered by `endpoint LIKE '/oracle/%'`.

### Acceptance criteria

- [ ] Two keys with same tier get **identical** limits (no randomness by MD5).
- [ ] Changing tier in DB updates limits within one window (or on next request).

---

## Phase B — Subscription Billing (Stripe)

**Goal:** Paid plans update tier automatically.

### Tasks

1. **Stripe setup**
   - Products: e.g. Free (no price), Pro (monthly), Enterprise (custom).
   - Customer Portal for subscription management.

2. **Backend**
   - New module e.g. `app/billing/stripe_webhooks.py`:
     - `checkout.session.completed` → create API key + set tier.
     - `customer.subscription.updated` / `deleted` → update tier or revoke key.
   - Store `stripe_customer_id` ↔ internal user/key mapping (PostgreSQL recommended; see `DATABASE_URL` in config).

3. **Secrets**
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs in env.

4. **Dashboard (`quantum-oracle-ui`)**
   - Pricing page (Free / Pro / Enterprise).
   - “Upgrade” → Stripe Checkout link.
   - Post-login: show API key + usage (read from new `/billing/usage` or `/monitoring` API).

### Acceptance criteria

- [ ] Test mode: subscribe → tier becomes `pro`; cancel → downgrade or revoke per policy.

---

## Phase C — Usage-Based / Metered (Optional)

**Goal:** Bill overage or pure usage (API bytes + oracle calls).

### Tasks

1. **Aggregation**
   - Daily/monthly job: `SUM(bytes_processed)`, `COUNT(*)` from `usage_logs` per `api_key`.
   - Filter oracle: `endpoint` in (`/oracle/fulfillment/request`, `/oracle/vrf/prove`, …).

2. **Stripe metered billing** (if used)
   - Report usage to Stripe Usage Records API.
   - Align billing period with subscription invoice.

3. **429 / quota responses**
   - Return clear JSON: `error`, `tier`, `limit`, `reset_at`.

### Acceptance criteria

- [ ] Usage report matches raw `usage_logs` for a test key.

---

## Phase D — Oracle Product Packaging

**Goal:** Sell **API + oracle** as combined or add-on SKUs.

### Tasks

1. **Define limits**
   - Example: Free — 0 on-chain fulfillments; Pro — 50/month; Enterprise — unlimited + SLA.

2. **Enforcement**
   - Middleware or dependency on oracle routes: check oracle quota before `OracleFulfillmentService`.
   - Increment counter after successful fulfillment (or after request, per policy).

3. **Pricing surface**
   - Document gas vs service fee (user pays chain gas; you charge service fee or subscription).
   - Align `fee_required` in API responses with marketing copy or hide in subscription-only.

### Acceptance criteria

- [ ] Exceeding oracle quota returns **402** or **429** with upgrade hint.

---

## File / Module Checklist

| New or changed | Purpose |
|----------------|---------|
| `app/utils/rate_limiting.py` | Real `_get_tier()`; optional oracle quota |
| `app/integrations/stripe.py` (new) | Stripe client + webhook verification |
| `app/api/v2/endpoints/billing.py` (new) | Usage summary, portal link (if needed) |
| `app/config.py` | `STRIPE_*`, `ORACLE_*` quota env vars |
| `quantum-oracle-ui/src/app/pricing/` or page | Pricing + upgrade |
| `docs/PRODUCTION.md` | Document billing env vars |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Raw API keys in DB | Store only HMAC-SHA256 or bcrypt of key; compare on request |
| Webhook forgery | Verify Stripe signature |
| SQLite at scale | Move `usage_logs` / `rate_limits` to PostgreSQL for multi-instance |

---

*See also: [BUILD_PLATFORM_AND_QUALITY.md](BUILD_PLATFORM_AND_QUALITY.md) for tests and monitoring that support billing SLAs.*
