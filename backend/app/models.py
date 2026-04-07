from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    rs_code = Column(String(6), unique=True, index=True, nullable=False)  # 6-char RS Code
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)       # for numerology life path
    sun_sign = Column(String(20), nullable=True)       # zodiac sign
    gender = Column(String)
    looking_for = Column(String)
    age = Column(Integer)
    bio = Column(Text, default="")
    location = Column(String, default="")
    photo_url = Column(Text, default="")
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    quiz_completed = Column(Boolean, default=False)
    # Genesis OS profile outputs
    archetype = Column(String, default="")             # primary archetype (10 real)
    archetype_secondary = Column(String, default="")   # secondary archetype
    shadow_type = Column(String, default="")           # shadow (6 real)
    archetype_score = Column(Float, default=0.0)
    shadow_score = Column(Float, default=0.0)
    readiness_score = Column(Float, default=0.0)
    readiness_forecast = Column(String, default="")
    life_path_number = Column(Integer, nullable=True)  # computed from DOB
    created_at = Column(DateTime, default=datetime.utcnow)

    quiz_responses = relationship("QuizResponse", back_populates="user", uselist=False)
    sent_scores = relationship("CompatibilityScore", foreign_keys="CompatibilityScore.user_a_id", back_populates="user_a")
    received_scores = relationship("CompatibilityScore", foreign_keys="CompatibilityScore.user_b_id", back_populates="user_b")
    sanctuary = relationship("Sanctuary", foreign_keys="Sanctuary.user_id", back_populates="user", uselist=False)


class QuizResponse(Base):
    __tablename__ = "quiz_responses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    answers = Column(JSON, nullable=False)         # {question_id: answer_letter}
    answer_details = Column(JSON, nullable=True)   # [{question_number, answer_id, answer_text, phase}]
    scoring_version = Column(String, default="phase1.v1")
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="quiz_responses")


class CompatibilityScore(Base):
    __tablename__ = "compatibility_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_a_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_b_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Float, nullable=False)
    tier = Column(String, nullable=False)
    tier_label = Column(String, nullable=False)
    # Canonical diagnostics
    final_norm = Column(Float, nullable=True)
    core_norm = Column(Float, nullable=True)
    behavioral_avg = Column(Float, nullable=True)
    stability_avg = Column(Float, nullable=True)
    chemistry_avg = Column(Float, nullable=True)
    zodiac_norm = Column(Float, nullable=True)
    numerology_norm = Column(Float, nullable=True)
    cosmic_overlay = Column(Float, nullable=True)
    # Drivers and breakdown
    breakdown = Column(JSON)
    top_positive_drivers = Column(JSON, nullable=True)
    top_friction_drivers = Column(JSON, nullable=True)
    scoring_version = Column(String, default="phase1.v1")
    created_at = Column(DateTime, default=datetime.utcnow)

    user_a = relationship("User", foreign_keys=[user_a_id], back_populates="sent_scores")
    user_b = relationship("User", foreign_keys=[user_b_id], back_populates="received_scores")


class Sanctuary(Base):
    __tablename__ = "sanctuaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    partner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    couple_name = Column(String, default="")
    goals = Column(JSON, default=list)
    milestones = Column(JSON, default=list)
    notes = Column(Text, default="")
    love_language = Column(String, default="")
    anniversary = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], back_populates="sanctuary")
    partner = relationship("User", foreign_keys=[partner_id])
