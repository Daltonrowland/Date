"""Post-match calibration system.

Display formula: D_t = clamp(350, 850, B + A_t + P_t + O_t)
  B = base assessment score (never changes)
  A_t = explicit feedback adjustment, capped [-50, +50]
  P_t = passive chat adjustment, capped [-15, +15] (future)
  O_t = trust/safety override, usually 0
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from ..database import get_db
from ..models import User, CompatibilityScore, ChatCalibrationEvent, Message
from ..auth import get_current_user

router = APIRouter(prefix="/calibration", tags=["calibration"])

# Stage thresholds
STAGE_THRESHOLDS = {1: 20, 2: 40, 3: 80}
STAGE_MAX_EFFECT = {1: 15, 2: 30, 3: 50}


def _get_message_count(db: Session, user_a: int, user_b: int) -> int:
    return db.query(func.count(Message.id)).filter(
        ((Message.sender_id == user_a) & (Message.recipient_id == user_b)) |
        ((Message.sender_id == user_b) & (Message.recipient_id == user_a))
    ).scalar() or 0


def _get_current_stage(db: Session, user_id: int, match_id: int) -> int:
    """Determine which calibration stage the user is eligible for."""
    msg_count = _get_message_count(db, user_id, match_id)
    completed = db.query(ChatCalibrationEvent).filter(
        ChatCalibrationEvent.user_id == user_id,
        ChatCalibrationEvent.match_user_id == match_id,
    ).all()
    completed_stages = {e.stage for e in completed}

    if msg_count >= 80 and 3 not in completed_stages:
        return 3
    if msg_count >= 40 and 2 not in completed_stages:
        return 2
    if msg_count >= 20 and 1 not in completed_stages:
        return 1
    return 0


def _score_responses(responses: dict, stage: int) -> tuple[float, bool]:
    """Calculate raw adjustment from questionnaire responses. Returns (delta, safety_flagged)."""
    total = 0
    safety = False

    for key, value in responses.items():
        if isinstance(value, (int, float)):
            total += value
        elif isinstance(value, list):
            for v in value:
                if isinstance(v, (int, float)):
                    total += v
                elif v == "safety_interrupt":
                    safety = True

    # Normalize: raw total from ~[-500, +600] → capped to stage max
    max_effect = STAGE_MAX_EFFECT.get(stage, 15)
    # Scale: divide by 500 (max possible magnitude) and multiply by max_effect
    delta = max(-max_effect, min(max_effect, (total / 500) * max_effect))

    return round(delta, 1), safety


def _recalculate_dynamic_score(db: Session, user_id: int, match_id: int):
    """Recalculate the dynamic_score for a pair from all calibration events."""
    cs = db.query(CompatibilityScore).filter(
        CompatibilityScore.user_a_id == user_id,
        CompatibilityScore.user_b_id == match_id,
    ).first()
    if not cs:
        return

    base = cs.score
    events = db.query(ChatCalibrationEvent).filter(
        ChatCalibrationEvent.user_id == user_id,
        ChatCalibrationEvent.match_user_id == match_id,
        ChatCalibrationEvent.safety_flagged == False,
    ).all()

    a_t = sum(e.adjustment_delta for e in events)
    a_t = max(-50, min(50, a_t))

    # Safety override: if any event was flagged, force score down
    safety_events = db.query(ChatCalibrationEvent).filter(
        ChatCalibrationEvent.user_id == user_id,
        ChatCalibrationEvent.match_user_id == match_id,
        ChatCalibrationEvent.safety_flagged == True,
    ).first()
    o_t = -max(0, base - 399) if safety_events else 0

    dynamic = max(350, min(850, base + a_t + o_t))
    cs.dynamic_score = round(dynamic, 1)
    db.commit()


class CalibrationSubmit(BaseModel):
    responses: dict  # {q1: score, q2: score, q3: score, q4: [scores], q5: score, q6: score}
    note: Optional[str] = ""


@router.get("/{match_user_id}")
def get_calibration_status(match_user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    msg_count = _get_message_count(db, current_user.id, match_user_id)
    eligible_stage = _get_current_stage(db, current_user.id, match_user_id)
    completed = db.query(ChatCalibrationEvent).filter(
        ChatCalibrationEvent.user_id == current_user.id,
        ChatCalibrationEvent.match_user_id == match_user_id,
    ).all()

    cs = db.query(CompatibilityScore).filter(
        CompatibilityScore.user_a_id == current_user.id,
        CompatibilityScore.user_b_id == match_user_id,
    ).first()

    return {
        "message_count": msg_count,
        "eligible_stage": eligible_stage,
        "completed_stages": [e.stage for e in completed],
        "base_score": cs.score if cs else 0,
        "dynamic_score": cs.dynamic_score if cs else None,
        "can_submit": eligible_stage > 0,
    }


@router.post("/{match_user_id}")
def submit_calibration(match_user_id: int, payload: CalibrationSubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stage = _get_current_stage(db, current_user.id, match_user_id)
    if stage == 0:
        raise HTTPException(status_code=400, detail="No calibration stage available. Send more messages first.")

    delta, safety = _score_responses(payload.responses, stage)

    cs = db.query(CompatibilityScore).filter(
        CompatibilityScore.user_a_id == current_user.id,
        CompatibilityScore.user_b_id == match_user_id,
    ).first()
    base = cs.score if cs else 700

    event = ChatCalibrationEvent(
        user_id=current_user.id,
        match_user_id=match_user_id,
        stage=stage,
        trigger_message_count=_get_message_count(db, current_user.id, match_user_id),
        responses_json=payload.responses,
        raw_score=delta,
        adjusted_score=round(max(350, min(850, base + delta)), 1),
        adjustment_delta=delta,
        submitted_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(hours=72),
        confidence_level="single",
        safety_flagged=safety,
    )
    db.add(event)
    db.commit()

    _recalculate_dynamic_score(db, current_user.id, match_user_id)

    return {
        "status": "ok",
        "stage": stage,
        "adjustment": delta,
        "safety_flagged": safety,
        "new_dynamic_score": cs.dynamic_score if cs else None,
    }
