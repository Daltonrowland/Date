from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Report, Block
from ..auth import get_current_user

router = APIRouter(tags=["safety"])


class ReportCreate(BaseModel):
    reason: str
    details: Optional[str] = ""


@router.post("/reports/{user_id}")
def report_user(user_id: int, payload: ReportCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")
    r = Report(reporter_id=current_user.id, reported_id=user_id, reason=payload.reason, details=payload.details or "")
    db.add(r)
    db.commit()
    return {"status": "ok", "message": "Report submitted"}


@router.get("/blocks")
def get_blocks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    blocks = db.query(Block).filter(Block.blocker_id == current_user.id).all()
    return [{"id": b.id, "blocked_id": b.blocked_id, "created_at": b.created_at} for b in blocks]


@router.post("/blocks/{user_id}")
def block_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    existing = db.query(Block).filter(Block.blocker_id == current_user.id, Block.blocked_id == user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already blocked")
    db.add(Block(blocker_id=current_user.id, blocked_id=user_id))
    db.commit()
    return {"status": "ok", "message": "User blocked"}


@router.delete("/blocks/{user_id}")
def unblock_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    block = db.query(Block).filter(Block.blocker_id == current_user.id, Block.blocked_id == user_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Not blocked")
    db.delete(block)
    db.commit()
    return {"status": "ok"}
