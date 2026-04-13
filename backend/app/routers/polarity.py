"""32-question polarity test — 10 axes with v12 weights."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, UserPolaritySnapshot
from ..auth import get_current_user

router = APIRouter(prefix="/polarity", tags=["polarity"])

# v12 polarity axes with weights
POLARITY_AXES = [
    {"key": "initiation",              "weight": 0.18, "label": "Initiation"},
    {"key": "pursuit_preference",      "weight": 0.14, "label": "Pursuit Preference"},
    {"key": "leadership_comfort",      "weight": 0.12, "label": "Leadership Comfort"},
    {"key": "surrender_safety",        "weight": 0.12, "label": "Surrender Safety"},
    {"key": "calm_receptivity",        "weight": 0.12, "label": "Calm Receptivity"},
    {"key": "tension_attraction",      "weight": 0.10, "label": "Tension Attraction"},
    {"key": "structure_preference",    "weight": 0.08, "label": "Structure Preference"},
    {"key": "energetic_flexibility",   "weight": 0.06, "label": "Energetic Flexibility"},
    {"key": "validation_dependency",   "weight": 0.04, "label": "Validation Dependency"},
    {"key": "erotic_safety_alignment", "weight": 0.04, "label": "Erotic-Safety Alignment"},
]

# 32 polarity questions (3-4 per axis)
POLARITY_QUESTIONS = [
    # Initiation (3 questions)
    {"id": "P01", "axis": "initiation", "text": "When plans need to be made between you and someone you're seeing, who typically initiates?"},
    {"id": "P02", "axis": "initiation", "text": "In conversations, who usually brings up deeper topics or moves things forward?"},
    {"id": "P03", "axis": "initiation", "text": "When there's been silence between you and someone you care about, how long do you wait before reaching out?"},
    # Pursuit Preference (3)
    {"id": "P04", "axis": "pursuit_preference", "text": "Do you prefer to pursue someone or be pursued?"},
    {"id": "P05", "axis": "pursuit_preference", "text": "When someone pulls back, does that make them more or less attractive to you?"},
    {"id": "P06", "axis": "pursuit_preference", "text": "How do you feel when someone is very direct about wanting you?"},
    # Leadership Comfort (3)
    {"id": "P07", "axis": "leadership_comfort", "text": "In a relationship, how comfortable are you making decisions that affect both of you?"},
    {"id": "P08", "axis": "leadership_comfort", "text": "When a conflict needs to be resolved, who usually steers the conversation toward resolution?"},
    {"id": "P09", "axis": "leadership_comfort", "text": "How do you feel about being the one who holds the direction of the relationship?"},
    # Surrender Safety (3)
    {"id": "P10", "axis": "surrender_safety", "text": "How safe do you feel letting go of control in emotional moments?"},
    {"id": "P11", "axis": "surrender_safety", "text": "Can you let someone take care of you without feeling indebted?"},
    {"id": "P12", "axis": "surrender_safety", "text": "How do you respond to vulnerability — yours or someone else's?"},
    # Calm Receptivity (3)
    {"id": "P13", "axis": "calm_receptivity", "text": "After a stressful day, what kind of presence from a partner feels most grounding?"},
    {"id": "P14", "axis": "calm_receptivity", "text": "How do you distinguish between chemistry that excites you and chemistry that calms you?"},
    {"id": "P15", "axis": "calm_receptivity", "text": "When things are going well, do you feel at peace or anxious that it might end?"},
    # Tension Attraction (3)
    {"id": "P16", "axis": "tension_attraction", "text": "Does a little bit of tension or unpredictability make a connection more exciting?"},
    {"id": "P17", "axis": "tension_attraction", "text": "Have you ever confused drama for passion in a past relationship?"},
    {"id": "P18", "axis": "tension_attraction", "text": "If a relationship were completely smooth with no friction, how would that feel?"},
    # Structure Preference (4)
    {"id": "P19", "axis": "structure_preference", "text": "How important is it to you to define the relationship early?"},
    {"id": "P20", "axis": "structure_preference", "text": "Do you prefer scheduled quality time or spontaneous connection?"},
    {"id": "P21", "axis": "structure_preference", "text": "How do you feel about unspoken rules versus openly negotiated agreements?"},
    {"id": "P22", "axis": "structure_preference", "text": "When boundaries are set in a relationship, does that feel safe or restrictive?"},
    # Energetic Flexibility (3)
    {"id": "P23", "axis": "energetic_flexibility", "text": "How easily can you shift between leading and following in a relationship?"},
    {"id": "P24", "axis": "energetic_flexibility", "text": "When your partner needs you to show up differently than usual, how does that feel?"},
    {"id": "P25", "axis": "energetic_flexibility", "text": "Can you hold space for someone's emotional process even if it looks different from yours?"},
    # Validation Dependency (3)
    {"id": "P26", "axis": "validation_dependency", "text": "How much does your sense of self-worth depend on your partner's feedback?"},
    {"id": "P27", "axis": "validation_dependency", "text": "When your partner does not compliment or affirm you for a while, what happens internally?"},
    {"id": "P28", "axis": "validation_dependency", "text": "Can you feel confident in a relationship without regular verbal reassurance?"},
    # Erotic-Safety Alignment (4)
    {"id": "P29", "axis": "erotic_safety_alignment", "text": "Do you need to feel emotionally safe before you can be physically close?"},
    {"id": "P30", "axis": "erotic_safety_alignment", "text": "Can desire and safety coexist for you, or does one tend to override the other?"},
    {"id": "P31", "axis": "erotic_safety_alignment", "text": "How do you feel about the relationship between emotional vulnerability and physical closeness?"},
    {"id": "P32", "axis": "erotic_safety_alignment", "text": "When you feel truly safe with someone, does your attraction increase or stay the same?"},
]


@router.get("/questions")
def get_polarity_questions():
    return {"questions": POLARITY_QUESTIONS, "axes": POLARITY_AXES, "total": 32}


class PolaritySubmit(BaseModel):
    answers: dict  # {P01: 1-5, P02: 1-5, ...}


@router.post("/submit")
def submit_polarity(payload: PolaritySubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if len(payload.answers) < 32:
        raise HTTPException(status_code=400, detail=f"All 32 questions required. Got {len(payload.answers)}.")

    # Compute axis scores (average of answers per axis, normalized to 0-1)
    axis_scores = {}
    for axis_info in POLARITY_AXES:
        axis_key = axis_info["key"]
        axis_qs = [q for q in POLARITY_QUESTIONS if q["axis"] == axis_key]
        vals = []
        for q in axis_qs:
            v = payload.answers.get(q["id"])
            if v is not None:
                vals.append((int(v) - 1) / 4)  # normalize 1-5 → 0-1
        axis_scores[axis_key] = round(sum(vals) / len(vals), 4) if vals else 0.5

    # Save snapshot
    snapshot = UserPolaritySnapshot(
        user_id=current_user.id,
        axis_scores=axis_scores,
        scoring_version="v12",
    )
    db.add(snapshot)

    current_user.polarity_completed = True
    if current_user.account_state == "polarity_incomplete":
        current_user.account_state = "eligible_in_pool"

    db.commit()
    db.refresh(snapshot)

    return {
        "status": "completed",
        "axis_scores": axis_scores,
        "scoring_version": "v12",
    }


@router.get("/status")
def polarity_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    snapshot = db.query(UserPolaritySnapshot).filter(
        UserPolaritySnapshot.user_id == current_user.id
    ).order_by(UserPolaritySnapshot.id.desc()).first()

    return {
        "completed": current_user.polarity_completed or False,
        "axis_scores": snapshot.axis_scores if snapshot else None,
        "scoring_version": snapshot.scoring_version if snapshot else None,
    }
