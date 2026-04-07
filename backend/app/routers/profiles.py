from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserProfile, UserUpdate, PhotoUpload
from ..auth import get_current_user

router = APIRouter(prefix="/profiles", tags=["profiles"])

MAX_PHOTO_SIZE = 2 * 1024 * 1024  # 2MB base64 limit


@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserProfile)
def update_my_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/photo", response_model=UserProfile)
def upload_photo(
    payload: PhotoUpload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(payload.photo_data) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="Photo too large. Max 2MB.")
    if not payload.photo_data.startswith("data:image/"):
        raise HTTPException(status_code=400, detail="Invalid image format. Must be a data URI (data:image/...).")

    current_user.photo_url = payload.photo_data
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserProfile)
def get_profile(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
