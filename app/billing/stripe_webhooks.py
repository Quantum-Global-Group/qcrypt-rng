"""
Stripe webhook handler for subscription lifecycle events.

Listens for:
  - checkout.session.completed  -> register new key with the purchased tier
  - customer.subscription.updated -> upgrade / downgrade tier
  - customer.subscription.deleted -> revoke key (or downgrade to free)

All tier mutations go through UsageTracker so the rate-limiter
picks them up immediately.
"""

import hashlib
import hmac
import json
import logging
import secrets
from typing import Dict, Optional

from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import JSONResponse

from app.config import settings
from app.utils.rate_limiting import UsageTracker, VALID_TIERS

logger = logging.getLogger(__name__)
router = APIRouter()

_tracker: Optional[UsageTracker] = None


def _get_tracker() -> UsageTracker:
    global _tracker
    if _tracker is None:
        _tracker = UsageTracker()
    return _tracker


PRICE_TO_TIER: Dict[str, str] = {}


def _build_price_map() -> Dict[str, str]:
    """Map Stripe price IDs to internal tier names (rebuilt on first call)."""
    if PRICE_TO_TIER:
        return PRICE_TO_TIER
    if settings.stripe_price_id_pro:
        PRICE_TO_TIER[settings.stripe_price_id_pro] = "pro"
    if settings.stripe_price_id_enterprise:
        PRICE_TO_TIER[settings.stripe_price_id_enterprise] = "enterprise"
    return PRICE_TO_TIER


def _verify_stripe_signature(payload: bytes, sig_header: str, secret: str) -> dict:
    """Verify Stripe webhook signature and return the parsed event.

    Implements Stripe v1 HMAC-SHA256 verification so we don't require
    the stripe Python package at runtime.  If the stripe package is
    installed it will be preferred.
    """
    try:
        import stripe
        stripe.api_key = settings.stripe_secret_key
        return stripe.Webhook.construct_event(payload, sig_header, secret)
    except ImportError:
        pass

    parts_raw = sig_header.split(",")
    timestamp = ""
    expected_sigs = []
    for part in parts_raw:
        key, _, val = part.partition("=")
        if key.strip() == "t":
            timestamp = val.strip()
        elif key.strip() == "v1":
            expected_sigs.append(val.strip())

    signed_payload = f"{timestamp}.".encode() + payload
    computed = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()

    if not any(hmac.compare_digest(computed, sig) for sig in expected_sigs):
        raise ValueError("Webhook signature verification failed")

    return json.loads(payload)


def _tier_from_subscription(subscription: dict) -> str:
    """Extract the tier from a Stripe subscription object."""
    price_map = _build_price_map()
    items = subscription.get("items", {}).get("data", [])
    for item in items:
        price_id = item.get("price", {}).get("id", "")
        if price_id in price_map:
            return price_map[price_id]
    return "free"


def _generate_api_key() -> str:
    return "qcrng_" + secrets.token_urlsafe(32)


@router.post("/stripe/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="Stripe-Signature"),
):
    """Handle incoming Stripe webhook events."""
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Billing not configured")

    payload = await request.body()

    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    try:
        event = _verify_stripe_signature(payload, stripe_signature, settings.stripe_webhook_secret)
    except Exception as exc:
        logger.warning("Stripe signature verification failed: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    event_type = event.get("type", "")
    data_object = event.get("data", {}).get("object", {})
    tracker = _get_tracker()

    if event_type == "checkout.session.completed":
        customer_id = data_object.get("customer", "")
        subscription = data_object.get("subscription")
        tier = "pro"
        if subscription and isinstance(subscription, dict):
            tier = _tier_from_subscription(subscription)

        existing_key = tracker.get_key_by_customer(customer_id)
        if existing_key:
            tracker.set_tier(existing_key, tier)
            logger.info("Upgraded existing key for customer %s to %s", customer_id, tier)
        else:
            new_key = _generate_api_key()
            tracker.register_key(new_key, tier=tier, customer_id=customer_id)
            logger.info("Created key for new customer %s (tier=%s)", customer_id, tier)

    elif event_type == "customer.subscription.updated":
        customer_id = data_object.get("customer", "")
        tier = _tier_from_subscription(data_object)
        api_key = tracker.get_key_by_customer(customer_id)
        if api_key:
            tracker.set_tier(api_key, tier)
            logger.info("Subscription updated for %s -> %s", customer_id, tier)

    elif event_type == "customer.subscription.deleted":
        customer_id = data_object.get("customer", "")
        api_key = tracker.get_key_by_customer(customer_id)
        if api_key:
            tracker.set_tier(api_key, "free")
            logger.info("Subscription cancelled for %s, downgraded to free", customer_id)

    else:
        logger.debug("Ignoring Stripe event: %s", event_type)

    return JSONResponse({"received": True})


@router.get("/billing/usage")
async def billing_usage(request: Request):
    """Return usage summary for the calling API key (for dashboard display)."""
    api_key = request.headers.get(settings.api_key_header, "")
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")

    tracker = _get_tracker()
    tier = tracker._get_tier(api_key)
    limits = settings.get_tier_limits(tier)
    requests_used, bytes_used, reset_time = tracker._get_current_usage(api_key)

    return {
        "tier": tier,
        "limits": limits,
        "usage": {
            "requests_used": requests_used,
            "bytes_used": bytes_used,
            "reset_time": reset_time.isoformat() if reset_time else None,
        },
    }


@router.post("/billing/keys/register")
async def admin_register_key(request: Request):
    """Admin endpoint to manually register or update an API key tier.

    Expects JSON: {"api_key": "...", "tier": "pro", "customer_id": "cus_..."}

    Protected: only callable when REQUIRE_API_KEY is false (dev) or
    the calling key is enterprise-tier.
    """
    caller_key = request.headers.get(settings.api_key_header, "")
    tracker = _get_tracker()

    if settings.require_api_key:
        caller_tier = tracker._get_tier(caller_key)
        if caller_tier != "enterprise":
            raise HTTPException(status_code=403, detail="Enterprise key required for admin operations")

    body = await request.json()
    api_key = body.get("api_key", "")
    tier = body.get("tier", "free")
    customer_id = body.get("customer_id")

    if not api_key or len(api_key) < 10:
        raise HTTPException(status_code=400, detail="api_key must be >= 10 characters")
    if tier not in VALID_TIERS:
        raise HTTPException(status_code=400, detail=f"tier must be one of {VALID_TIERS}")

    tracker.register_key(api_key, tier=tier, customer_id=customer_id)
    return {"status": "ok", "api_key_prefix": api_key[:8] + "...", "tier": tier}
