from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime


# ── Auth ─────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    age: int
    gender: str
    looking_for: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str


# ── User / Profile ────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    id: int
    name: str
    age: Optional[int]
    gender: Optional[str]
    looking_for: Optional[str]
    bio: Optional[str]
    location: Optional[str]
    quiz_completed: bool
    archetype: Optional[str]
    archetype_score: float
    shadow_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    bio: Optional[str] = None
    location: Optional[str] = None


# ── Quiz ──────────────────────────────────────────────────────────────────────

class QuizSubmit(BaseModel):
    answers: dict[str, int]  # {question_id: answer (1-5)}


class QuizResult(BaseModel):
    score: float
    tier: str
    tier_label: str
    tier_emoji: str
    breakdown: dict[str, Any]
    archetype_score: float
    shadow_score: float
    archetype: str
    percentage: float


# ── Compatibility ─────────────────────────────────────────────────────────────

class MatchResult(BaseModel):
    user_id: int
    name: str
    age: Optional[int]
    gender: Optional[str]
    bio: Optional[str]
    archetype: Optional[str]
    score: float
    tier: str
    tier_label: str
    percentage: float
    breakdown: dict[str, Any]


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
