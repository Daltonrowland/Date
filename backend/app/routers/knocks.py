from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from ..database import get_db
from ..models import User, Knock, CompatibilityScore
from ..schemas import KnockSend, KnockResponse, KnockAction
from ..auth import get_current_user

router = APIRouter(prefix="/knocks", tags=["knocks"])


@router.get("", response_model=list[KnockResponse])
def list_knocks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List incoming and outgoing knocks."""
    knocks = db.query(Knock).filter(
        or_(Knock.sender_id == current_user.id, Knock.recipient_id == current_user.id)
    ).order_by(Knock.created_at.desc()).all()

    results = []
    for k in knocks:
        other_id = k.recipient_id if k.sender_id == current_user.id else k.sender_id
        other = db.query(User).filter(User.id == other_id).first()
        cs = db.query(CompatibilityScore).filter(
            CompatibilityScore.user_a_id == current_user.id,
            CompatibilityScore.user_b_id == other_id,
        ).first()
        results.append(KnockResponse(
            id=k.id,
            sender_id=k.sender_id,
            recipient_id=k.recipient_id,
            status=k.status,
            message=k.message or "",
            created_at=k.created_at,
            sender_name=other.name if other else "",
            sender_rs_code=other.rs_code if other else "",
            sender_photo=other.profile_photo or other.photo_url or "" if other else "",
            sender_score=cs.score if cs else None,
        ))
    return results


@router.post("/{user_id}", response_model=KnockResponse, status_code=201)
def send_knock(user_id: int, payload: KnockSend, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot knock yourself")

    recipient = db.query(User).filter(User.id == user_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for existing pending knock
    existing = db.query(Knock).filter(
        Knock.sender_id == current_user.id,
        Knock.recipient_id == user_id,
        Knock.status == "pending",
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending knock")

    knock = Knock(
        sender_id=current_user.id,
        recipient_id=user_id,
        message=payload.message or "",
    )
    db.add(knock)
    db.commit()
    db.refresh(knock)

    cs = db.query(CompatibilityScore).filter(
        CompatibilityScore.user_a_id == current_user.id,
        CompatibilityScore.user_b_id == user_id,
    ).first()

    return KnockResponse(
        id=knock.id,
        sender_id=knock.sender_id,
        recipient_id=knock.recipient_id,
        status=knock.status,
        message=knock.message,
        created_at=knock.created_at,
        sender_name=current_user.name,
        sender_rs_code=current_user.rs_code,
        sender_photo=current_user.profile_photo or "",
        sender_score=cs.score if cs else None,
    )


@router.patch("/{knock_id}", response_model=KnockResponse)
def respond_to_knock(knock_id: int, payload: KnockAction, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    knock = db.query(Knock).filter(Knock.id == knock_id).first()
    if not knock:
        raise HTTPException(status_code=404, detail="Knock not found")
    if knock.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the recipient can respond")
    if knock.status != "pending":
        raise HTTPException(status_code=400, detail="Knock already responded to")
    if payload.action not in ("accept", "decline"):
        raise HTTPException(status_code=400, detail="Action must be 'accept' or 'decline'")

    knock.status = "accepted" if payload.action == "accept" else "declined"
    db.commit()
    db.refresh(knock)

    sender = db.query(User).filter(User.id == knock.sender_id).first()
    return KnockResponse(
        id=knock.id,
        sender_id=knock.sender_id,
        recipient_id=knock.recipient_id,
        status=knock.status,
        message=knock.message,
        created_at=knock.created_at,
        sender_name=sender.name if sender else "",
        sender_rs_code=sender.rs_code if sender else "",
        sender_photo=sender.profile_photo or "" if sender else "",
        sender_score=None,
    )
