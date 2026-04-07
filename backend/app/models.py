from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(String)
    looking_for = Column(String)
    bio = Column(Text, default="")
    location = Column(String, default="")
    photo_url = Column(Text, default="")  # base64 data URI or URL
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    quiz_completed = Column(Boolean, default=False)
    archetype = Column(String, default="")
    archetype_score = Column(Float, default=0.0)
    shadow_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    quiz_responses = relationship("QuizResponse", back_populates="user", uselist=False)
    sent_scores = relationship("CompatibilityScore", foreign_keys="CompatibilityScore.user_a_id", back_populates="user_a")
    received_scores = relationship("CompatibilityScore", foreign_keys="CompatibilityScore.user_b_id", back_populates="user_b")
    sanctuary = relationship("Sanctuary", foreign_keys="Sanctuary.user_id", back_populates="user", uselist=False)


class QuizResponse(Base):
    __tablename__ = "quiz_responses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    answers = Column(JSON, nullable=False)  # {question_id: answer_value (1-5)}
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
    breakdown = Column(JSON)  # per-category scores
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
