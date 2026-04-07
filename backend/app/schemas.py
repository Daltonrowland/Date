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
    date_of_birth: Optional[str] = None
    sun_sign: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    rs_code: str = ""
    is_verified: bool = True

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class VerifyEmailRequest(BaseModel):
    token: str

class VerifyCodeRequest(BaseModel):
    code: str

class ResendCodeRequest(BaseModel):
    email: EmailStr


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
    profile_photo: Optional[str] = ""
    profile_photos: Optional[list] = []
    quiz_completed: bool
    archetype: Optional[str]
    archetype_secondary: Optional[str] = ""
    shadow_type: Optional[str] = ""
    archetype_score: float
    shadow_score: float
    readiness_score: Optional[float] = 0.0
    readiness_forecast: Optional[str] = ""
    height: Optional[str] = ""
    occupation: Optional[str] = ""
    education: Optional[str] = ""
    dating_status: Optional[str] = ""
    relationship_state: Optional[str] = ""
    onboarding_completed: bool = False
    email_verified: bool = False
    is_verified: bool = False
    last_active: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    photo_url: Optional[str] = None
    profile_photo: Optional[str] = None
    profile_photos: Optional[list] = None
    sun_sign: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    looking_for: Optional[str] = None
    height: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    dating_status: Optional[str] = None
    relationship_state: Optional[str] = None
    onboarding_completed: Optional[bool] = None

class PhotoUpload(BaseModel):
    photo_data: str


# ── Quiz ──────────────────────────────────────────────────────────────────────
class QuizSubmit(BaseModel):
    answers: dict[str, Any]

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
    photo_url: Optional[str] = ""
    profile_photo: Optional[str] = ""
    archetype: Optional[str]
    archetype_secondary: Optional[str] = ""
    shadow_type: Optional[str] = ""
    sun_sign: Optional[str] = ""
    life_path_number: Optional[int] = None
    score: float
    tier: str
    tier_label: str
    percentage: float
    breakdown: dict[str, Any]
    core_norm: Optional[float] = None
    stability_avg: Optional[float] = None
    chemistry_avg: Optional[float] = None
    cosmic_overlay: Optional[float] = None
    zodiac_norm: Optional[float] = None
    numerology_norm: Optional[float] = None
    archetype_fit_label: Optional[str] = ""
    i_liked: bool = False      # current user liked this person
    they_liked: bool = False   # this person liked current user


# ── Messages ──────────────────────────────────────────────────────────────────
class MessageSend(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    content: str
    created_at: datetime
    read_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ConversationPreview(BaseModel):
    user_id: int
    name: str
    rs_code: str
    profile_photo: str
    last_message: str
    last_message_at: datetime
    unread_count: int


# ── Knocks ────────────────────────────────────────────────────────────────────
class KnockSend(BaseModel):
    message: Optional[str] = ""

class KnockResponse(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    status: str
    message: str
    created_at: datetime
    sender_name: Optional[str] = ""
    sender_rs_code: Optional[str] = ""
    sender_photo: Optional[str] = ""
    sender_score: Optional[float] = None
    class Config:
        from_attributes = True

class KnockAction(BaseModel):
    action: str


# ── Likes ─────────────────────────────────────────────────────────────────────
class LikeResponse(BaseModel):
    id: int
    liker_id: int
    liked_id: int
    mutual: bool = False
    class Config:
        from_attributes = True


# ── Sanctuary ─────────────────────────────────────────────────────────────────
class SanctuaryUpdate(BaseModel):
    couple_name: Optional[str] = None
    goals: Optional[list] = None
    milestones: Optional[list] = None
    notes: Optional[str] = None
    love_language: Optional[str] = None
    anniversary: Optional[str] = None
    partner_id: Optional[int] = None
    personal_reflections: Optional[list] = None
    emotional_state: Optional[str] = None
    personal_goals: Optional[list] = None

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
    personal_reflections: Optional[list] = []
    emotional_state: Optional[str] = ""
    personal_goals: Optional[list] = []
    class Config:
        from_attributes = True

class UserLookupResult(BaseModel):
    id: int
    rs_code: str
    name: str
    age: Optional[int]
    gender: Optional[str]
    profile_photo: Optional[str] = ""
    archetype: Optional[str] = ""
    sun_sign: Optional[str] = ""
