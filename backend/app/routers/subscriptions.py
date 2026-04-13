"""Subscription tier system — Free, Tier 1, Tier 2, Tier 3.

Tiers:
  Free:  10 matches/day, 3 msgs/match, basic features
  Tier1: $9.99/mo — unlimited matches, ExsAnonymous, expanded Sanctuary
  Tier2: $19.99/mo — Couples Space, shared tools (covers partner)
  Tier3: $34.99/mo — coaching AI, guided check-ins, premium growth

Subscriptions and coins NEVER affect compatibility scores or match ranking.
"""
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..auth import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])

STRIPE_SECRET = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://date-production-5ca0.up.railway.app")

# Tier definitions
TIERS = {
    "free": {"name": "Free", "price": 0, "features": ["10 matches/day", "3 msgs/match", "Basic Sanctuary"]},
    "tier1": {"name": "Self & Insight", "price": 999, "price_display": "$9.99/mo", "features": [
        "Unlimited match browsing", "ExsAnonymous access", "Expanded Sanctuary", "Chat Insight", "Songs feature"]},
    "tier2": {"name": "Couple & Shared Space", "price": 1999, "price_display": "$19.99/mo", "features": [
        "Everything in Tier 1", "Full Couples Space", "Shared Sanctuary", "Date Night Corner",
        "Scoreboard growth", "Couple tools", "Covers partner"]},
    "tier3": {"name": "Relationship & Coaching", "price": 3499, "price_display": "$34.99/mo", "features": [
        "Everything in Tier 2", "AI relationship coach", "Guided check-ins",
        "Advanced conflict support", "Premium growth paths"]},
}

TIER_HIERARCHY = ["free", "tier1", "tier2", "tier3"]


def check_tier_access(user: User, required_tier: str) -> bool:
    """Check if user's current tier meets the required tier."""
    current = user.subscription_tier or "free"
    if current not in TIER_HIERARCHY:
        current = "free"
    return TIER_HIERARCHY.index(current) >= TIER_HIERARCHY.index(required_tier)


@router.get("/tiers")
def get_tiers():
    return TIERS


@router.get("/subscription-status")
def subscription_status(current_user: User = Depends(get_current_user)):
    return {
        "tier": current_user.subscription_tier or "free",
        "status": current_user.subscription_status or "none",
        "expires_at": current_user.subscription_expires_at.isoformat() if current_user.subscription_expires_at else None,
        "features": TIERS.get(current_user.subscription_tier or "free", TIERS["free"])["features"],
    }


@router.post("/create-subscription")
def create_subscription(tier: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if tier not in ["tier1", "tier2", "tier3"]:
        raise HTTPException(status_code=400, detail="Invalid tier")

    if not STRIPE_SECRET:
        # No Stripe configured — simulate for demo
        current_user.subscription_tier = tier
        current_user.subscription_status = "active"
        db.commit()
        return {"status": "demo_activated", "tier": tier, "message": "Stripe not configured — tier activated for demo"}

    try:
        import stripe
        stripe.api_key = STRIPE_SECRET

        # Get or create Stripe customer
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(email=current_user.email, name=current_user.name)
            current_user.stripe_customer_id = customer.id
            db.commit()

        # Create checkout session
        tier_info = TIERS[tier]
        session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            mode="subscription",
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": f"Relationship Scores — {tier_info['name']}"},
                    "recurring": {"interval": "month"},
                    "unit_amount": tier_info["price"],
                },
                "quantity": 1,
            }],
            success_url=f"{FRONTEND_URL}/subscription?success=true&tier={tier}",
            cancel_url=f"{FRONTEND_URL}/subscription?cancelled=true",
            metadata={"user_id": str(current_user.id), "tier": tier},
        )

        return {"checkout_url": session.url, "session_id": session.id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cancel-subscription")
def cancel_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.subscription_id:
        current_user.subscription_tier = "free"
        current_user.subscription_status = "none"
        db.commit()
        return {"status": "cancelled"}

    if STRIPE_SECRET:
        try:
            import stripe
            stripe.api_key = STRIPE_SECRET
            stripe.Subscription.modify(current_user.subscription_id, cancel_at_period_end=True)
        except Exception:
            pass

    current_user.subscription_status = "cancelled"
    db.commit()
    return {"status": "cancelled", "message": "Subscription will cancel at end of billing period"}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not STRIPE_SECRET or not STRIPE_WEBHOOK_SECRET:
        return {"status": "webhook_disabled"}

    import stripe
    stripe.api_key = STRIPE_SECRET

    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        tier = session.get("metadata", {}).get("tier", "tier1")
        sub_id = session.get("subscription")

        if user_id:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                user.subscription_tier = tier
                user.subscription_status = "active"
                user.subscription_id = sub_id
                db.commit()

    elif event["type"] in ("customer.subscription.updated", "customer.subscription.deleted"):
        sub = event["data"]["object"]
        sub_id = sub["id"]
        user = db.query(User).filter(User.subscription_id == sub_id).first()
        if user:
            if sub["status"] == "active":
                user.subscription_status = "active"
            elif sub["status"] in ("canceled", "unpaid"):
                user.subscription_status = "cancelled"
                user.subscription_tier = "free"
            db.commit()

    return {"status": "ok"}
