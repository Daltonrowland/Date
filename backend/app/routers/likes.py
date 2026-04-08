from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..database import get_db
from ..models import User, Like
from ..schemas import LikeResponse
from ..auth import get_current_user

router = APIRouter(prefix="/likes", tags=["likes"])


@router.post("/{user_id}", response_model=LikeResponse, status_code=201)
def like_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot like yourself")
    existing = db.query(Like).filter(Like.liker_id == current_user.id, Like.liked_id == user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already liked")
    like = Like(liker_id=current_user.id, liked_id=user_id)
    db.add(like)
    db.commit()
    db.refresh(like)
    # Check if mutual
    mutual = db.query(Like).filter(Like.liker_id == user_id, Like.liked_id == current_user.id).first() is not None

    # Create notifications
    from .notifications import create_notification
    other = db.query(User).filter(User.id == user_id).first()
    if mutual and other:
        create_notification(db, user_id, "mutual_match", f"It's a match! You and {current_user.name} liked each other 💜", current_user.id)
        create_notification(db, current_user.id, "mutual_match", f"It's a match! You and {other.name} liked each other 💜", user_id)
        # Award coins for mutual match
        try:
            from .economy import award_coins, award_badge
            award_coins(db, current_user.id, "mutual_match", f"match_{user_id}")
            award_coins(db, user_id, "mutual_match", f"match_{current_user.id}")
            award_badge(db, current_user.id, "connected")
            award_badge(db, user_id, "connected")
        except Exception:
            pass

    return LikeResponse(id=like.id, liker_id=like.liker_id, liked_id=like.liked_id, mutual=mutual)


@router.delete("/{user_id}")
def unlike_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    like = db.query(Like).filter(Like.liker_id == current_user.id, Like.liked_id == user_id).first()
    if not like:
        raise HTTPException(status_code=404, detail="Like not found")
    db.delete(like)
    db.commit()
    return {"status": "ok"}


@router.get("", response_model=list[LikeResponse])
def get_my_likes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    likes = db.query(Like).filter(Like.liker_id == current_user.id).all()
    results = []
    for l in likes:
        mutual = db.query(Like).filter(Like.liker_id == l.liked_id, Like.liked_id == current_user.id).first() is not None
        results.append(LikeResponse(id=l.id, liker_id=l.liker_id, liked_id=l.liked_id, mutual=mutual))
    return results


@router.get("/mutual", response_model=list[LikeResponse])
def get_mutual_likes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    my_likes = db.query(Like.liked_id).filter(Like.liker_id == current_user.id).subquery()
    mutual = db.query(Like).filter(
        Like.liker_id.in_(my_likes),
        Like.liked_id == current_user.id,
    ).all()
    return [LikeResponse(id=l.id, liker_id=l.liker_id, liked_id=l.liked_id, mutual=True) for l in mutual]


@router.get("/who-liked-me")
def who_liked_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    likes = db.query(Like).filter(Like.liked_id == current_user.id).all()
    return [{"user_id": l.liker_id, "created_at": l.created_at} for l in likes]
