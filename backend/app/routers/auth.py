import secrets
import string
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import (
    UserRegister, UserLogin, TokenResponse,
    PasswordResetRequest, PasswordResetConfirm, VerifyEmailRequest,
)
from ..auth import hash_password, verify_password, create_access_token
from ..rate_limit import check_rate_limit
from ..scoring import compute_life_path

router = APIRouter(prefix="/auth", tags=["auth"])

RS_CODE_CHARS = string.ascii_uppercase + string.digits  # A-Z 0-9


def _generate_rs_code(db: Session) -> str:
    """Generate a unique 6-character RS Code."""
    for _ in range(100):
        code = ''.join(secrets.choice(RS_CODE_CHARS) for _ in range(6))
        if not db.query(User).filter(User.rs_code == code).first():
            return code
    raise HTTPException(status_code=500, detail="Failed to generate unique RS Code")


@router.post("/register", response_model=TokenResponse, status_code=201,
             dependencies=[Depends(check_rate_limit)])
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    rs_code = _generate_rs_code(db)
    verification_token = secrets.token_urlsafe(32)

    # Compute life path from DOB if provided
    life_path = None
    if payload.date_of_birth:
        try:
            life_path = compute_life_path(payload.date_of_birth)
        except Exception:
            pass

    user = User(
        rs_code=rs_code,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        name=payload.name,
        age=payload.age,
        gender=payload.gender,
        looking_for=payload.looking_for,
        date_of_birth=datetime.strptime(payload.date_of_birth, "%Y-%m-%d").date() if payload.date_of_birth else None,
        sun_sign=payload.sun_sign,
        life_path_number=life_path,
        verification_token=verification_token,
        email_verified=True,  # auto-verify for now
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user_id=user.id, name=user.name, rs_code=user.rs_code)


@router.post("/login", response_model=TokenResponse,
             dependencies=[Depends(check_rate_limit)])
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user_id=user.id, name=user.name, rs_code=user.rs_code or "")


@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == payload.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    user.email_verified = True
    user.verification_token = None
    db.commit()
    return {"message": "Email verified successfully"}


@router.post("/forgot-password", dependencies=[Depends(check_rate_limit)])
def forgot_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        return {"message": "If that email is registered, a reset link has been sent."}

    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    return {"message": "If that email is registered, a reset link has been sent.", "reset_token": reset_token}


@router.post("/reset-password", dependencies=[Depends(check_rate_limit)])
def reset_password(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == payload.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token has expired")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user.hashed_password = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"message": "Password reset successfully. You can now log in."}
