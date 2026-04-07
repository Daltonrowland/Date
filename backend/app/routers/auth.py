import secrets
import string
import random
import smtplib
import os
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, EmailVerificationCode
from ..schemas import (
    UserRegister, UserLogin, TokenResponse,
    PasswordResetRequest, PasswordResetConfirm,
    VerifyCodeRequest, ResendCodeRequest,
)
from ..auth import hash_password, verify_password, create_access_token
from ..rate_limit import check_rate_limit
from ..scoring import compute_life_path

# Helper: optional auth (doesn't require login)
from ..auth import decode_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

_bearer = HTTPBearer(auto_error=False)

def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
):
    if not credentials:
        return None
    user_id = decode_token(credentials.credentials)
    if user_id is None:
        return None
    return db.query(User).filter(User.id == user_id).first()


router = APIRouter(prefix="/auth", tags=["auth"])

RS_CODE_CHARS = string.ascii_uppercase + string.digits


def _generate_rs_code(db: Session) -> str:
    for _ in range(100):
        code = ''.join(secrets.choice(RS_CODE_CHARS) for _ in range(6))
        if not db.query(User).filter(User.rs_code == code).first():
            return code
    raise HTTPException(status_code=500, detail="Failed to generate unique RS Code")


def _generate_verification_code() -> str:
    return ''.join(random.choices(string.digits, k=6))


def _send_verification_email(email: str, code: str):
    """Try to send verification email via SMTP. Silently fails if not configured."""
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    if not all([smtp_host, smtp_user, smtp_pass]):
        return  # SMTP not configured — skip email
    try:
        msg = MIMEText(f"Your Relationship Scores verification code is: {code}\n\nThis code expires in 24 hours.")
        msg["Subject"] = f"Relationship Scores — Verification Code: {code}"
        msg["From"] = smtp_user
        msg["To"] = email
        with smtplib.SMTP(smtp_host, int(os.environ.get("SMTP_PORT", 587))) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
    except Exception:
        pass  # Don't block registration if email fails


@router.post("/register", response_model=TokenResponse, status_code=201,
             dependencies=[Depends(check_rate_limit)])
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    rs_code = _generate_rs_code(db)
    life_path = None
    dob = None
    if payload.date_of_birth:
        try:
            life_path = compute_life_path(payload.date_of_birth)
            dob = datetime.strptime(payload.date_of_birth, "%Y-%m-%d").date()
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
        date_of_birth=dob,
        sun_sign=payload.sun_sign,
        life_path_number=life_path,
        email_verified=True,
        is_verified=False,  # not code-verified yet
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate and store verification code
    code = _generate_verification_code()
    vc = EmailVerificationCode(
        user_id=user.id,
        code=code,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.add(vc)
    db.commit()

    _send_verification_email(user.email, code)

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token, user_id=user.id, name=user.name,
        rs_code=user.rs_code, is_verified=user.is_verified,
    )


@router.post("/verify-code")
def verify_code(payload: VerifyCodeRequest, current_user: User = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    """Verify email with 6-digit code. Accepts code from any logged-in user."""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Login required")
    vc = db.query(EmailVerificationCode).filter(
        EmailVerificationCode.user_id == current_user.id,
        EmailVerificationCode.code == payload.code,
    ).order_by(EmailVerificationCode.created_at.desc()).first()
    if not vc:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    if vc.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code expired")

    current_user.is_verified = True
    db.delete(vc)
    db.commit()
    return {"message": "Email verified successfully", "is_verified": True}


@router.post("/resend-code", dependencies=[Depends(check_rate_limit)])
def resend_code(current_user: User = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    if current_user is None:
        raise HTTPException(status_code=401, detail="Login required")
    # Delete old codes
    db.query(EmailVerificationCode).filter(EmailVerificationCode.user_id == current_user.id).delete()
    code = _generate_verification_code()
    vc = EmailVerificationCode(
        user_id=current_user.id,
        code=code,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.add(vc)
    db.commit()
    _send_verification_email(current_user.email, code)
    return {"message": "New verification code sent"}


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(check_rate_limit)])
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token, user_id=user.id, name=user.name,
        rs_code=user.rs_code or "", is_verified=user.is_verified or False,
    )


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
