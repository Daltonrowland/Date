from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime, date


# ── Auth ─────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    age: int
    gender: str
    looking_for: str
    date_of_birth: Optional[str] = None   # YYYY-MM-DD
    sun_sign: Optional[str] = None        # zodiac sign


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    rs_code: str = ""


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    token: str


# ── User / Profile ────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    id: int
    rs_code: Optional[str] = ""
    name: str
    age: Optional[int]
    gender: Optional[str]
    looking_for: Optional[str]
    date_of_birth: Optional[date] = None
    sun_sign: Optional[str] = None
    life_path_number: Optional[int] = None
    bio: Optional[str]
    location: Optional[str]
    photo_url: Optional[str] = ""
    quiz_completed: bool
    # Genesis OS profile
    archetype: Optional[str]
    archetype_secondary: Optional[str] = ""
    shadow_type: Optional[str] = ""
    archetype_score: float
    shadow_score: float
    readiness_score: Optional[float] = 0.0
    readiness_forecast: Optional[str] = ""
    email_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    photo_url: Optional[str] = None
    sun_sign: Optional[str] = None
    date_of_birth: Optional[str] = None


class PhotoUpload(BaseModel):
    photo_data: str


# ── Quiz ──────────────────────────────────────────────────────────────────────

class QuizSubmit(BaseModel):
    answers: dict[str, Any]  # {question_id: answer_letter or 1-5}


class QuizResult(BaseModel):
    score: float
    tier: str
    tier_label: str
    tier_emoji: str
    breakdown: dict[str, Any]
    archetype_score: float
    shadow_score: float
    archetype: str
    archetype_secondary: Optional[str] = ""
    shadow_type: Optional[str] = ""
    readiness_score: Optional[float] = 0.0
    readiness_forecast: Optional[str] = ""
    percentage: float
    # Canonical diagnostics
    core_norm: Optional[float] = None
    stability_avg: Optional[float] = None
    chemistry_avg: Optional[float] = None
    behavioral_avg: Optional[float] = None
    zodiac_norm: Optional[float] = None
    numerology_norm: Optional[float] = None
    cosmic_overlay: Optional[float] = None


# ── Compatibility ─────────────────────────────────────────────────────────────

class MatchResult(BaseModel):
    user_id: int
    name: str
    rs_code: Optional[str] = ""
    age: Optional[int]
    gender: Optional[str]
    bio: Optional[str]
    archetype: Optional[str]
    shadow_type: Optional[str] = ""
    score: float
    tier: str
    tier_label: str
    percentage: float
    breakdown: dict[str, Any]
    # Diagnostics
    core_norm: Optional[float] = None
    stability_avg: Optional[float] = None
    chemistry_avg: Optional[float] = None
    cosmic_overlay: Optional[float] = None


# ── Sanctuary ─────────────────────────────────────────────────────────────────

class SanctuaryUpdate(BaseModel):
    couple_name: Optional[str] = None
    goals: Optional[list] = None
    milestones: Optional[list] = None
    notes: Optional[str] = None
    love_language: Optional[str] = None
    anniversary: Optional[str] = None
    partner_id: Optional[int] = None


class SanctuaryResponse(BaseModel):
    id: int
    user_id: int
    partner_id: Optional[int]
    couple_name: Optional[str]
    goals: Optional[list]
    milestones: Optional[list]
    notes: Optional[str]
    love_language: Optional[str]
    anniversary: Optional[str]

    class Config:
        from_attributes = True
