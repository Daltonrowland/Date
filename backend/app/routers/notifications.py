from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, Column, Integer, String, Text, JSON
from ..database import get_db, Base
from ..models import User, Notification
from ..auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


def create_notification(db: Session, user_id: int, type: str, message: str, reference_id: int = None):
    n = Notification(user_id=user_id, type=type, message=message, reference_id=reference_id)
    db.add(n)
    db.commit()


@router.get("")
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(desc(Notification.created_at)).limit(20).all()
    return [{
        "id": n.id, "type": n.type, "message": n.message,
        "read": n.read, "reference_id": n.reference_id,
        "created_at": n.created_at.isoformat() if n.created_at else "",
    } for n in notifs]


@router.get("/unread-count")
def unread_count(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy import func
    count = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id, Notification.read == False
    ).scalar()
    return {"count": count or 0}


@router.patch("/{notif_id}/read")
def mark_read(notif_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if n:
        n.read = True
        db.commit()
    return {"status": "ok"}


@router.patch("/read-all")
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.read == False
    ).update({"read": True})
    db.commit()
    return {"status": "ok"}


# ── Push notification subscription ────────────────────────────────────────────
_push_subscriptions: dict[int, dict] = {}


class PushSubscription(BaseModel):
    endpoint: str
    keys: dict


@router.post("/push-subscribe")
def push_subscribe(payload: PushSubscription, current_user: User = Depends(get_current_user)):
    _push_subscriptions[current_user.id] = {"endpoint": payload.endpoint, "keys": payload.keys}
    return {"status": "ok"}
