"""Coins, badges, and economy system.

NON-NEGOTIABLE: Coins, badges, themes, and scoreboard prestige NEVER alter
compatibility score, readiness score, rank eligibility, or matching.
"""
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import User, CoinAccount, CoinTransaction, BadgeDefinition, UserBadge, ScoreboardEntry
from ..auth import get_current_user

router = APIRouter(tags=["economy"])

# ── Earn Events ──────────────────────────────────────────────────────────────
EARN_EVENTS = {
    "account_created":              {"amount": 50,  "one_time": True},
    "onboarding_completed":         {"amount": 100, "one_time": True},
    "assessment_completed":         {"amount": 200, "one_time": True},
    "profile_photo_uploaded":       {"amount": 25,  "one_time": True},
    "bio_completed":                {"amount": 25,  "one_time": True},
    "sanctuary_session_completed":  {"amount": 10,  "daily_cap": 30},
    "relationship_created":         {"amount": 150, "one_time": True},
    "pulse_check_completed":        {"amount": 20,  "weekly_cap": 60},
    "repair_module_completed":      {"amount": 50,  "weekly_cap": 100},
    "game_completed":               {"amount": 5,   "daily_cap": 15},
    "mutual_match":                 {"amount": 25,  "one_time": False},
    "first_message_sent":           {"amount": 10,  "one_time": True},
}

# ── Spend SKUs ───────────────────────────────────────────────────────────────
SPEND_SKUS = {
    "profile_badge_frame":     100,
    "rs_code_flourish":        150,
    "sanctuary_journal_skin":  75,
    "scoreboard_card_theme":   200,
}

# ── Foundation Badges ────────────────────────────────────────────────────────
FOUNDATION_BADGES = [
    {"badge_key": "first_step",         "name": "First Step",          "icon": "👣", "description": "Account created"},
    {"badge_key": "assessed",           "name": "Assessed",            "icon": "🧬", "description": "Quiz completed"},
    {"badge_key": "blueprint_ready",    "name": "Blueprint Ready",     "icon": "📋", "description": "Onboarding completed"},
    {"badge_key": "soul_searcher",      "name": "Soul Searcher",       "icon": "🏛️", "description": "First Sanctuary session"},
    {"badge_key": "connected",          "name": "Connected",           "icon": "💜", "description": "First mutual match"},
    {"badge_key": "conversation_starter","name": "Conversation Starter","icon": "💬", "description": "First message sent"},
    {"badge_key": "open_book",          "name": "Open Book",           "icon": "📖", "description": "Bio and photo both complete"},
]


def _get_or_create_account(db: Session, user_id: int) -> CoinAccount:
    acct = db.query(CoinAccount).filter(CoinAccount.owner_id == user_id, CoinAccount.owner_type == "user").first()
    if not acct:
        acct = CoinAccount(owner_id=user_id, owner_type="user")
        db.add(acct)
        db.commit()
        db.refresh(acct)
    return acct


def award_coins(db: Session, user_id: int, event_type: str, event_id: str = None):
    """Award coins for an event. Checks one_time and daily/weekly caps."""
    config = EARN_EVENTS.get(event_type)
    if not config:
        return 0

    # One-time check
    if config.get("one_time"):
        existing = db.query(CoinTransaction).filter(
            CoinTransaction.owner_id == user_id,
            CoinTransaction.source_event_type == event_type,
        ).first()
        if existing:
            return 0

    # Daily cap check
    if "daily_cap" in config:
        today = date.today()
        earned_today = db.query(func.coalesce(func.sum(CoinTransaction.amount), 0)).filter(
            CoinTransaction.owner_id == user_id,
            CoinTransaction.source_event_type == event_type,
            func.date(CoinTransaction.created_at) == today,
        ).scalar()
        if earned_today >= config["daily_cap"]:
            return 0

    # Weekly cap check
    if "weekly_cap" in config:
        from datetime import timedelta
        week_start = datetime.utcnow() - timedelta(days=7)
        earned_week = db.query(func.coalesce(func.sum(CoinTransaction.amount), 0)).filter(
            CoinTransaction.owner_id == user_id,
            CoinTransaction.source_event_type == event_type,
            CoinTransaction.created_at >= week_start,
        ).scalar()
        if earned_week >= config["weekly_cap"]:
            return 0

    amount = config["amount"]
    acct = _get_or_create_account(db, user_id)
    acct.current_balance += amount
    acct.lifetime_earned += amount

    tx = CoinTransaction(
        owner_id=user_id, owner_type="user", tx_type="earn", direction="credit",
        amount=amount, source_event_type=event_type, source_event_id=event_id or "",
    )
    db.add(tx)
    db.commit()
    return amount


def award_badge(db: Session, user_id: int, badge_key: str, event_id: str = None):
    """Award a badge if not already held."""
    existing = db.query(UserBadge).filter(UserBadge.user_id == user_id, UserBadge.badge_key == badge_key).first()
    if existing:
        return False
    db.add(UserBadge(user_id=user_id, badge_key=badge_key, source_event_id=event_id or ""))
    db.commit()
    return True


# ── API Endpoints ────────────────────────────────────────────────────────────

@router.get("/wallet/summary")
def wallet_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    acct = _get_or_create_account(db, current_user.id)
    recent_txs = db.query(CoinTransaction).filter(
        CoinTransaction.owner_id == current_user.id
    ).order_by(CoinTransaction.created_at.desc()).limit(20).all()

    return {
        "balance": acct.current_balance,
        "lifetime_earned": acct.lifetime_earned,
        "lifetime_spent": acct.lifetime_spent,
        "transactions": [{
            "id": tx.id, "type": tx.tx_type, "direction": tx.direction,
            "amount": tx.amount, "event": tx.source_event_type,
            "created_at": tx.created_at.isoformat() if tx.created_at else "",
        } for tx in recent_txs],
        "earn_events": {k: v["amount"] for k, v in EARN_EVENTS.items()},
        "spend_skus": SPEND_SKUS,
    }


@router.get("/badges/my")
def my_badges(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    badges = db.query(UserBadge).filter(UserBadge.user_id == current_user.id).all()
    all_defs = {b["badge_key"]: b for b in FOUNDATION_BADGES}
    return [{
        "badge_key": b.badge_key,
        "name": all_defs.get(b.badge_key, {}).get("name", b.badge_key),
        "icon": all_defs.get(b.badge_key, {}).get("icon", "🏅"),
        "description": all_defs.get(b.badge_key, {}).get("description", ""),
        "awarded_at": b.awarded_at.isoformat() if b.awarded_at else "",
    } for b in badges]


@router.get("/badges/all")
def all_badges(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    owned = {b.badge_key for b in db.query(UserBadge).filter(UserBadge.user_id == current_user.id).all()}
    return [{**b, "owned": b["badge_key"] in owned} for b in FOUNDATION_BADGES]


@router.post("/wallet/spend")
def spend_coins(sku: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if sku not in SPEND_SKUS:
        raise HTTPException(status_code=400, detail="Invalid SKU")
    cost = SPEND_SKUS[sku]
    acct = _get_or_create_account(db, current_user.id)
    if acct.current_balance < cost:
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Need {cost}, have {acct.current_balance}")
    acct.current_balance -= cost
    acct.lifetime_spent += cost
    db.add(CoinTransaction(
        owner_id=current_user.id, owner_type="user", tx_type="spend", direction="debit",
        amount=cost, source_event_type=f"purchase_{sku}",
    ))
    db.commit()
    return {"status": "ok", "new_balance": acct.current_balance, "item": sku}


@router.get("/scoreboard/global")
def global_scoreboard(db: Session = Depends(get_db)):
    entries = db.query(ScoreboardEntry).filter(
        ScoreboardEntry.board_type == "global"
    ).order_by(ScoreboardEntry.points.desc()).limit(20).all()
    results = []
    for e in entries:
        user = db.query(User).filter(User.id == e.owner_id).first()
        results.append({
            "rank": e.rank, "points": e.points,
            "name": user.name if user else "Unknown",
            "rs_code": user.rs_code if user else "",
        })
    return results
