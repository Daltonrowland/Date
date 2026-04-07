from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, QuizResponse, CompatibilityScore
from ..schemas import QuizSubmit, QuizResult
from ..auth import get_current_user
from ..quiz_questions import QUESTIONS, CATEGORIES
from ..scoring import compute_compatibility, compute_archetype

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.get("/questions")
def get_questions():
    return {"questions": QUESTIONS, "categories": CATEGORIES, "total": len(QUESTIONS)}


@router.post("/submit", response_model=QuizResult)
def submit_quiz(payload: QuizSubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if len(payload.answers) < 60:
        raise HTTPException(status_code=400, detail=f"All 60 questions required. Got {len(payload.answers)}.")

    # Validate answer range
    for qid, val in payload.answers.items():
        if val not in (1, 2, 3, 4, 5):
            raise HTTPException(status_code=400, detail=f"Answer for question {qid} must be 1-5")

    # Upsert quiz response
    existing = db.query(QuizResponse).filter(QuizResponse.user_id == current_user.id).first()
    if existing:
        existing.answers = payload.answers
    else:
        existing = QuizResponse(user_id=current_user.id, answers=payload.answers)
        db.add(existing)

    # Compute self-scores for archetype
    self_result = compute_compatibility(payload.answers, payload.answers)
    archetype = compute_archetype(self_result["archetype_score"], self_result["shadow_score"])

    current_user.quiz_completed = True
    current_user.archetype = archetype
    current_user.archetype_score = self_result["archetype_score"]
    current_user.shadow_score = self_result["shadow_score"]

    db.commit()

    # Compute and cache compatibility scores with all other completed users
    others = (
        db.query(User)
        .join(QuizResponse, QuizResponse.user_id == User.id)
        .filter(User.id != current_user.id, User.quiz_completed == True)
        .all()
    )

    for other in others:
        other_resp = db.query(QuizResponse).filter(QuizResponse.user_id == other.id).first()
        if not other_resp:
            continue
        result = compute_compatibility(payload.answers, other_resp.answers)

        # Upsert score A→B
        score_ab = db.query(CompatibilityScore).filter(
            CompatibilityScore.user_a_id == current_user.id,
            CompatibilityScore.user_b_id == other.id
        ).first()
        if score_ab:
            score_ab.score = result["score"]
            score_ab.tier = result["tier"]
            score_ab.tier_label = result["tier_label"]
            score_ab.breakdown = result["breakdown"]
        else:
            db.add(CompatibilityScore(
                user_a_id=current_user.id,
                user_b_id=other.id,
                score=result["score"],
                tier=result["tier"],
                tier_label=result["tier_label"],
                breakdown=result["breakdown"],
            ))

        # Upsert score B→A (same score, symmetric)
        score_ba = db.query(CompatibilityScore).filter(
            CompatibilityScore.user_a_id == other.id,
            CompatibilityScore.user_b_id == current_user.id
        ).first()
        if score_ba:
            score_ba.score = result["score"]
            score_ba.tier = result["tier"]
            score_ba.tier_label = result["tier_label"]
            score_ba.breakdown = result["breakdown"]
        else:
            db.add(CompatibilityScore(
                user_a_id=other.id,
                user_b_id=current_user.id,
                score=result["score"],
                tier=result["tier"],
                tier_label=result["tier_label"],
                breakdown=result["breakdown"],
            ))

    db.commit()

    return QuizResult(
        score=self_result["score"],
        tier=self_result["tier"],
        tier_label=self_result["tier_label"],
        tier_emoji=self_result.get("tier_emoji", ""),
        breakdown=self_result["breakdown"],
        archetype_score=self_result["archetype_score"],
        shadow_score=self_result["shadow_score"],
        archetype=archetype,
        percentage=self_result["percentage"],
    )
