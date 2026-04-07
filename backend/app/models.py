from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    rs_code = Column(String(6), unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    sun_sign = Column(String(20), nullable=True)
    gender = Column(String)
    looking_for = Column(String)
    age = Column(Integer)
    bio = Column(Text, default="")
    location = Column(String, default="")
    photo_url = Column(Text, default="")
    profile_photo = Column(Text, default="")
    profile_photos = Column(JSON, default=list)
    email_verified = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    quiz_completed = Column(Boolean, default=False)
    onboarding_completed = Column(Boolean, default=False)
    archetype = Column(String, default="")
    archetype_secondary = Column(String, default="")
    shadow_type = Column(String, default="")
    archetype_score = Column(Float, default=0.0)
    shadow_score = Column(Float, default=0.0)
    readiness_score = Column(Float, default=0.0)
    readiness_forecast = Column(String, default="")
    life_path_number = Column(Integer, nullable=True)
    height = Column(String, default="")
    occupation = Column(String, default="")
    education = Column(String, default="")
    dating_status = Column(String, default="")
    relationship_state = Column(String, default="")
    last_active = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    quiz_responses = relationship("QuizResponse", back_populates="user", uselist=False)
    sent_scores = relationship("CompatibilityScore", foreign_keys="CompatibilityScore.user_a_id", back_populates="user_a")
    received_scores = relationship("CompatibilityScore", foreign_keys="CompatibilityScore.user_b_id", back_populates="user_b")
    sanctuary = relationship("Sanctuary", foreign_keys="Sanctuary.user_id", back_populates="user", uselist=False)


class QuizResponse(Base):
    __tablename__ = "quiz_responses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    answers = Column(JSON, nullable=False)
    answer_details = Column(JSON, nullable=True)
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
    final_norm = Column(Float, nullable=True)
    core_norm = Column(Float, nullable=True)
    behavioral_avg = Column(Float, nullable=True)
    stability_avg = Column(Float, nullable=True)
    chemistry_avg = Column(Float, nullable=True)
    zodiac_norm = Column(Float, nullable=True)
    numerology_norm = Column(Float, nullable=True)
    cosmic_overlay = Column(Float, nullable=True)
    breakdown = Column(JSON)
    top_positive_drivers = Column(JSON, nullable=True)
    top_friction_drivers = Column(JSON, nullable=True)
    scoring_version = Column(String, default="phase1.v1")
    created_at = Column(DateTime, default=datetime.utcnow)
    user_a = relationship("User", foreign_keys=[user_a_id], back_populates="sent_scores")
    user_b = relationship("User", foreign_keys=[user_b_id], back_populates="received_scores")


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])


class Knock(Base):
    __tablename__ = "knocks"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")
    message = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])


class Like(Base):
    __tablename__ = "likes"
    id = Column(Integer, primary_key=True, index=True)
    liker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    liked_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    liker = relationship("User", foreign_keys=[liker_id])
    liked = relationship("User", foreign_keys=[liked_id])


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # mutual_match, new_message, knock_received, knock_accepted
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    reference_id = Column(Integer, nullable=True)  # related user_id or message_id
    created_at = Column(DateTime, default=datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reported_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=False)
    details = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class Block(Base):
    __tablename__ = "blocks"
    id = Column(Integer, primary_key=True, index=True)
    blocker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    blocked_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class EmailVerificationCode(Base):
    __tablename__ = "email_verification_codes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


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
    personal_reflections = Column(JSON, default=list)
    emotional_state = Column(String, default="")
    personal_goals = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", foreign_keys=[user_id], back_populates="sanctuary")
    partner = relationship("User", foreign_keys=[partner_id])
