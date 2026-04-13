"""Couples Mode — relationship activation, rooms, pulse, repair, memory, growth."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    User, CoupleContainer, CoupleConsent, CoupleRoom, PulseSession,
    RepairSession, CoupleGoal, CoupleArchiveItem, PrivateReflection,
    CompatibilityScore,
)
from ..auth import get_current_user

router = APIRouter(prefix="/couple", tags=["couples"])

ROOM_FAMILIES = [
    "home_room", "pulse_room", "repair_room", "memory_room",
    "growth_room", "sanctuary_bridge", "intimacy_room", "cooldown_room",
]
THEMES = ["classic_deep", "celestial", "warm_earth", "midnight_garden"]


def _get_active_couple(db: Session, user_id: int) -> Optional[CoupleContainer]:
    from sqlalchemy import or_
    return db.query(CoupleContainer).filter(
        or_(CoupleContainer.user_a_id == user_id, CoupleContainer.user_b_id == user_id),
        CoupleContainer.status.in_(["active_couple", "pending_dual_consent", "theme_selection"]),
    ).first()


def _get_partner_id(couple: CoupleContainer, user_id: int) -> int:
    return couple.user_b_id if couple.user_a_id == user_id else couple.user_a_id


# ── Relationship activation ──────────────────────────────────────────────────

class ProposeRequest(BaseModel):
    partner_rs_code: str

class AcceptRequest(BaseModel):
    partner_rs_code: str

class CoupleSetup(BaseModel):
    couple_handle: Optional[str] = None
    theme: Optional[str] = "classic_deep"


@router.post("/propose")
def propose_relationship(payload: ProposeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    partner = db.query(User).filter(User.rs_code == payload.partner_rs_code.upper()).first()
    if not partner:
        raise HTTPException(status_code=404, detail="No user found with that RS Code")
    if partner.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot enter relationship with yourself")

    existing = _get_active_couple(db, current_user.id)
    if existing:
        raise HTTPException(status_code=400, detail="You are already in a relationship")

    couple = CoupleContainer(user_a_id=current_user.id, user_b_id=partner.id, status="proposed")
    db.add(couple)
    db.commit()
    db.refresh(couple)

    # Notify partner
    try:
        from .notifications import create_notification
        create_notification(db, partner.id, "relationship_invite",
            f"{current_user.name} wants to start a relationship with you 💜", current_user.id)
    except Exception:
        pass

    current_user.relationship_state = "proposed"
    db.commit()

    return {"status": "proposed", "couple_id": couple.id, "partner_name": partner.name}


@router.post("/accept")
def accept_relationship(payload: AcceptRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    partner = db.query(User).filter(User.rs_code == payload.partner_rs_code.upper()).first()
    if not partner:
        raise HTTPException(status_code=404, detail="No user found with that RS Code")

    from sqlalchemy import or_, and_
    couple = db.query(CoupleContainer).filter(
        CoupleContainer.user_a_id == partner.id,
        CoupleContainer.user_b_id == current_user.id,
        CoupleContainer.status == "proposed",
    ).first()
    if not couple:
        raise HTTPException(status_code=404, detail="No pending relationship proposal from this user")

    couple.status = "pending_dual_consent"
    # Add consents
    for uid in [couple.user_a_id, couple.user_b_id]:
        db.add(CoupleConsent(couple_id=couple.id, user_id=uid, consent_type="shared_space"))

    current_user.relationship_state = "pending_consent"
    partner.relationship_state = "pending_consent"
    db.commit()

    return {"status": "pending_dual_consent", "couple_id": couple.id}


@router.post("/activate")
def activate_couple(payload: CoupleSetup, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = _get_active_couple(db, current_user.id)
    if not couple:
        raise HTTPException(status_code=404, detail="No pending couple to activate")
    if couple.status == "active_couple":
        raise HTTPException(status_code=400, detail="Already active")

    couple.couple_handle = payload.couple_handle or f"Couple #{couple.id}"
    couple.theme = payload.theme if payload.theme in THEMES else "classic_deep"
    couple.status = "active_couple"
    couple.updated_at = datetime.utcnow()

    # Create all 8 rooms
    for room in ROOM_FAMILIES:
        db.add(CoupleRoom(couple_id=couple.id, room_family=room))

    # Update both users
    for uid in [couple.user_a_id, couple.user_b_id]:
        user = db.query(User).filter(User.id == uid).first()
        if user:
            user.relationship_state = "active_couple"
            user.account_state = "in_relationship"

    # Snapshot compatibility
    cs = db.query(CompatibilityScore).filter(
        CompatibilityScore.user_a_id == couple.user_a_id,
        CompatibilityScore.user_b_id == couple.user_b_id,
    ).first()
    if cs:
        couple.compatibility_snapshot_id = cs.id

    db.commit()

    try:
        from .notifications import create_notification
        partner_id = _get_partner_id(couple, current_user.id)
        create_notification(db, partner_id, "relationship_activated",
            f"Your relationship with {current_user.name} is now active! 💜", current_user.id)
    except Exception:
        pass

    return {"status": "active_couple", "couple_id": couple.id, "handle": couple.couple_handle, "theme": couple.theme}


# ── Couple home ──────────────────────────────────────────────────────────────

@router.get("/home")
def couple_home(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = _get_active_couple(db, current_user.id)
    if not couple:
        return {"active": False}

    partner_id = _get_partner_id(couple, current_user.id)
    partner = db.query(User).filter(User.id == partner_id).first()
    rooms = db.query(CoupleRoom).filter(CoupleRoom.couple_id == couple.id).all()
    goals = db.query(CoupleGoal).filter(CoupleGoal.couple_id == couple.id).all()

    days_together = (datetime.utcnow() - (couple.created_at or datetime.utcnow())).days

    cs = db.query(CompatibilityScore).filter(
        CompatibilityScore.user_a_id == couple.user_a_id,
        CompatibilityScore.user_b_id == couple.user_b_id,
    ).first()

    return {
        "active": True,
        "couple_id": couple.id,
        "handle": couple.couple_handle,
        "theme": couple.theme,
        "status": couple.status,
        "partner": {"id": partner.id, "name": partner.name, "rs_code": partner.rs_code,
                     "profile_photo": partner.profile_photo or partner.photo_url or "",
                     "archetype": partner.archetype} if partner else None,
        "compatibility_score": cs.score if cs else None,
        "days_together": days_together,
        "rooms": [{"family": r.room_family, "state": r.state} for r in rooms],
        "goals": [{"id": g.id, "text": g.goal_text, "completed": g.completed} for g in goals],
    }


# ── Pulse Check ──────────────────────────────────────────────────────────────

class PulseResponse(BaseModel):
    responses: dict  # {connection: 1-5, tension: 1-5, support: 1-5, energy: 1-5, gratitude: 1-5}


@router.post("/pulse")
def submit_pulse(payload: PulseResponse, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = _get_active_couple(db, current_user.id)
    if not couple or couple.status != "active_couple":
        raise HTTPException(status_code=400, detail="Not in active relationship")

    # Find or create today's pulse session
    today = datetime.utcnow().date()
    session = db.query(PulseSession).filter(
        PulseSession.couple_id == couple.id,
    ).order_by(PulseSession.id.desc()).first()

    is_user_a = current_user.id == couple.user_a_id

    if not session or (session.completed_at and session.completed_at.date() < today):
        session = PulseSession(couple_id=couple.id)
        db.add(session)

    if is_user_a:
        session.response_a = payload.responses
    else:
        session.response_b = payload.responses

    # Check if both responded
    if session.response_a and session.response_b:
        # Compute alignment
        vals_a = list(session.response_a.values())
        vals_b = list(session.response_b.values())
        if vals_a and vals_b:
            delta = sum(abs(a - b) for a, b in zip(vals_a, vals_b)) / len(vals_a)
            session.alignment_delta = round(delta, 2)
            session.repair_flag = delta > 2.0
        session.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(session)

    both_done = session.response_a is not None and session.response_b is not None
    return {
        "status": "submitted",
        "both_completed": both_done,
        "alignment_delta": session.alignment_delta if both_done else None,
        "repair_suggested": session.repair_flag if both_done else None,
    }


@router.get("/pulse/latest")
def get_latest_pulse(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = _get_active_couple(db, current_user.id)
    if not couple:
        return {"active": False}
    session = db.query(PulseSession).filter(
        PulseSession.couple_id == couple.id,
    ).order_by(PulseSession.id.desc()).first()
    if not session:
        return {"active": True, "has_pulse": False}
    both_done = session.response_a is not None and session.response_b is not None
    return {
        "active": True, "has_pulse": True, "both_completed": both_done,
        "alignment_delta": session.alignment_delta if both_done else None,
        "repair_suggested": session.repair_flag if both_done else None,
        "completed_at": session.completed_at.isoformat() if session.completed_at else None,
    }


# ── Goals ────────────────────────────────────────────────────────────────────

class GoalCreate(BaseModel):
    goal_text: str

@router.post("/goals")
def add_goal(payload: GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = _get_active_couple(db, current_user.id)
    if not couple:
        raise HTTPException(status_code=400, detail="Not in relationship")
    goal = CoupleGoal(couple_id=couple.id, goal_text=payload.goal_text)
    db.add(goal)
    db.commit()
    return {"id": goal.id, "text": goal.goal_text, "completed": False}


@router.patch("/goals/{goal_id}/toggle")
def toggle_goal(goal_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(CoupleGoal).filter(CoupleGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404)
    goal.completed = not goal.completed
    db.commit()
    return {"id": goal.id, "completed": goal.completed}


# ── Memory / Archive ─────────────────────────────────────────────────────────

class ArchiveCreate(BaseModel):
    item_type: str  # milestone, memory, letter
    content: str
    tags: Optional[list] = []

@router.post("/archive")
def add_archive_item(payload: ArchiveCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = _get_active_couple(db, current_user.id)
    if not couple:
        raise HTTPException(status_code=400, detail="Not in relationship")
    item = CoupleArchiveItem(
        couple_id=couple.id, item_type=payload.item_type,
        content=payload.content, tags=payload.tags,
    )
    db.add(item)
    db.commit()
    return {"id": item.id, "type": item.item_type}


@router.get("/archive")
def get_archive(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = _get_active_couple(db, current_user.id)
    if not couple:
        return []
    items = db.query(CoupleArchiveItem).filter(CoupleArchiveItem.couple_id == couple.id).order_by(CoupleArchiveItem.created_at.desc()).all()
    return [{"id": i.id, "type": i.item_type, "content": i.content, "tags": i.tags, "created_at": i.created_at.isoformat() if i.created_at else ""} for i in items]


# ── Private Reflections (NEVER visible to partner) ───────────────────────────

class ReflectionCreate(BaseModel):
    content: str

@router.post("/reflections")
def add_reflection(payload: ReflectionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = _get_active_couple(db, current_user.id)
    ref = PrivateReflection(user_id=current_user.id, couple_id=couple.id if couple else None, content=payload.content)
    db.add(ref)
    db.commit()
    return {"id": ref.id}


@router.get("/reflections")
def get_reflections(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    refs = db.query(PrivateReflection).filter(PrivateReflection.user_id == current_user.id).order_by(PrivateReflection.created_at.desc()).limit(20).all()
    return [{"id": r.id, "content": r.content, "convertable": r.convertable_flag, "created_at": r.created_at.isoformat() if r.created_at else ""} for r in refs]


# ── Breakup ──────────────────────────────────────────────────────────────────

@router.post("/breakup")
def initiate_breakup(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = _get_active_couple(db, current_user.id)
    if not couple:
        raise HTTPException(status_code=400, detail="Not in relationship")

    couple.status = "archived"
    couple.updated_at = datetime.utcnow()

    for uid in [couple.user_a_id, couple.user_b_id]:
        user = db.query(User).filter(User.id == uid).first()
        if user:
            user.relationship_state = "post_breakup"
            user.account_state = "eligible_in_pool"

    db.commit()

    try:
        from .notifications import create_notification
        partner_id = _get_partner_id(couple, current_user.id)
        create_notification(db, partner_id, "relationship_ended",
            f"Your relationship has been archived. Take care of yourself. 🌿", current_user.id)
    except Exception:
        pass

    return {"status": "archived"}
