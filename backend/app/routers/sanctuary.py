from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import User, Sanctuary
from ..schemas import SanctuaryUpdate, SanctuaryResponse
from ..auth import get_current_user

router = APIRouter(prefix="/sanctuary", tags=["sanctuary"])


def _get_or_create(user_id: int, db: Session) -> Sanctuary:
    s = db.query(Sanctuary).filter(Sanctuary.user_id == user_id).first()
    if not s:
        s = Sanctuary(user_id=user_id)
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@router.get("", response_model=SanctuaryResponse)
def get_sanctuary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _get_or_create(current_user.id, db)


@router.patch("", response_model=SanctuaryResponse)
def update_sanctuary(payload: SanctuaryUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = _get_or_create(current_user.id, db)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(s, field, value)
    s.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(s)
    return s
