from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import User
from ..schemas import UserProfile, UserUpdate, PhotoUpload
from ..auth import get_current_user
from ..scoring import compute_life_path

router = APIRouter(prefix="/profiles", tags=["profiles"])

MAX_PHOTO_SIZE = 2 * 1024 * 1024


@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserProfile)
def update_my_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude_none=True)
    # Handle DOB → life path
    if "date_of_birth" in data and data["date_of_birth"]:
        try:
            current_user.date_of_birth = datetime.strptime(data["date_of_birth"], "%Y-%m-%d").date()
            current_user.life_path_number = compute_life_path(data["date_of_birth"])
        except Exception:
            pass
        del data["date_of_birth"]
    # Set primary photo from photos list if provided
    if "profile_photos" in data and data["profile_photos"]:
        current_user.profile_photo = data["profile_photos"][0]
    for field, value in data.items():
        if hasattr(current_user, field):
            setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/photo", response_model=UserProfile)
def upload_photo(payload: PhotoUpload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if len(payload.photo_data) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="Photo too large. Max 2MB.")
    if not payload.photo_data.startswith("data:image/"):
        raise HTTPException(status_code=400, detail="Invalid image format.")
    current_user.profile_photo = payload.photo_data
    # Also add to photos list
    photos = current_user.profile_photos or []
    if len(photos) < 6:
        photos.append(payload.photo_data)
    else:
        photos[0] = payload.photo_data
    current_user.profile_photos = photos
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserProfile)
def get_profile(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
