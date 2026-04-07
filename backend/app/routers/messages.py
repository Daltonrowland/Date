from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc
from ..database import get_db
from ..models import User, Message, Knock, CompatibilityScore
from ..schemas import MessageSend, MessageResponse, ConversationPreview
from ..auth import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])

KNOCK_THRESHOLD = 550  # scores below this require a knock first


def _can_message(db: Session, user_a_id: int, user_b_id: int) -> bool:
    """Check if two users can message. Requires score >= 550 OR an accepted knock."""
    cs = db.query(CompatibilityScore).filter(
        CompatibilityScore.user_a_id == user_a_id,
        CompatibilityScore.user_b_id == user_b_id,
    ).first()
    if cs and cs.score >= KNOCK_THRESHOLD:
        return True
    # Check for accepted knock in either direction
    knock = db.query(Knock).filter(
        or_(
            and_(Knock.sender_id == user_a_id, Knock.recipient_id == user_b_id),
            and_(Knock.sender_id == user_b_id, Knock.recipient_id == user_a_id),
        ),
        Knock.status == "accepted",
    ).first()
    return knock is not None


@router.get("/conversations", response_model=list[ConversationPreview])
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all conversations with last message preview."""
    # Get all unique users we've exchanged messages with
    sent = db.query(Message.recipient_id).filter(Message.sender_id == current_user.id).distinct()
    received = db.query(Message.sender_id).filter(Message.recipient_id == current_user.id).distinct()
    partner_ids = set(r[0] for r in sent.all()) | set(r[0] for r in received.all())

    conversations = []
    for pid in partner_ids:
        partner = db.query(User).filter(User.id == pid).first()
        if not partner:
            continue
        last_msg = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.recipient_id == pid),
                and_(Message.sender_id == pid, Message.recipient_id == current_user.id),
            )
        ).order_by(desc(Message.created_at)).first()
        unread = db.query(func.count(Message.id)).filter(
            Message.sender_id == pid,
            Message.recipient_id == current_user.id,
            Message.read_at.is_(None),
        ).scalar()
        if last_msg:
            conversations.append(ConversationPreview(
                user_id=pid,
                name=partner.name,
                rs_code=partner.rs_code or "",
                profile_photo=partner.profile_photo or partner.photo_url or "",
                last_message=last_msg.content[:80],
                last_message_at=last_msg.created_at,
                unread_count=unread or 0,
            ))

    conversations.sort(key=lambda c: c.last_message_at, reverse=True)
    return conversations


@router.get("/unread-count")
def unread_count(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(func.count(Message.id)).filter(
        Message.recipient_id == current_user.id,
        Message.read_at.is_(None),
    ).scalar()
    return {"unread_count": count or 0}


@router.get("/{user_id}", response_model=list[MessageResponse])
def get_conversation(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.recipient_id == user_id),
            and_(Message.sender_id == user_id, Message.recipient_id == current_user.id),
        )
    ).order_by(Message.created_at).all()
    return messages


@router.post("/{user_id}", response_model=MessageResponse, status_code=201)
def send_message(user_id: int, payload: MessageSend, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    recipient = db.query(User).filter(User.id == user_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="User not found")

    if not _can_message(db, current_user.id, user_id):
        raise HTTPException(status_code=403, detail="Score below 550 — send a Knock first to unlock messaging")

    msg = Message(sender_id=current_user.id, recipient_id=user_id, content=payload.content.strip())
    db.add(msg)
    db.commit()

    # Notification for recipient
    try:
        from .notifications import create_notification
        create_notification(db, user_id, "new_message", f"New message from {current_user.name}", current_user.id)
    except Exception:
        pass
    db.refresh(msg)
    return msg


@router.patch("/{user_id}/read")
def mark_read(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Message).filter(
        Message.sender_id == user_id,
        Message.recipient_id == current_user.id,
        Message.read_at.is_(None),
    ).update({"read_at": datetime.utcnow()})
    db.commit()
    return {"status": "ok"}
