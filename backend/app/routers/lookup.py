from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserLookupResult
from ..auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/lookup/{rs_code}", response_model=UserLookupResult)
def lookup_by_rs_code(rs_code: str, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.rs_code == rs_code.upper()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found with that RS Code")
    return UserLookupResult(
        id=user.id, rs_code=user.rs_code, name=user.name, age=user.age,
        gender=user.gender, profile_photo=user.profile_photo or user.photo_url or "",
        archetype=user.archetype or "", sun_sign=user.sun_sign or "",
    )


@router.get("/search")
def search_users(
    q: str = Query("", min_length=1),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(q) == 6 and q.isalnum():
        # Might be RS code
        user = db.query(User).filter(User.rs_code == q.upper()).first()
        if user:
            return [UserLookupResult(
                id=user.id, rs_code=user.rs_code, name=user.name, age=user.age,
                gender=user.gender, profile_photo=user.profile_photo or user.photo_url or "",
                archetype=user.archetype or "", sun_sign=user.sun_sign or "",
            )]
    # Name search
    users = db.query(User).filter(User.name.ilike(f"%{q}%")).limit(10).all()
    return [UserLookupResult(
        id=u.id, rs_code=u.rs_code, name=u.name, age=u.age,
        gender=u.gender, profile_photo=u.profile_photo or u.photo_url or "",
        archetype=u.archetype or "", sun_sign=u.sun_sign or "",
    ) for u in users]
