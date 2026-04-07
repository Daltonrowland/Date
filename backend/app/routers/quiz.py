from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, QuizResponse, CompatibilityScore
from ..schemas import QuizSubmit, QuizResult
from ..auth import get_current_user
from ..quiz_questions import get_questions, CATEGORIES, DIMENSION_LABELS
from ..scoring import compute_compatibility, compute_archetype, load_seed_context, get_archetype_from_answers

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.get("/questions")
def get_quiz_questions():
    questions = get_questions()
    return {"questions": questions, "categories": CATEGORIES, "total": len(questions)}


@router.post("/submit", response_model=QuizResult)
def submit_quiz(payload: QuizSubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    questions = get_questions()
    valid_ids = {str(q["id"]) for q in questions}

    # Accept both letter answers (A-E) and numeric answers (1-5)
    # Convert numeric 1-5 to letters A-E for backward compatibility
    normalized: dict[str, str] = {}
    for qid, val in payload.answers.items():
        if qid not in valid_ids:
            continue
        if isinstance(val, int) or (isinstance(val, str) and val.isdigit()):
            # Convert 1→A, 2→B, 3→C, 4→D, 5→E
            idx = int(val) - 1
            letters = "ABCDE"
            normalized[qid] = letters[min(idx, 4)] if 0 <= idx < 5 else "A"
        else:
            normalized[qid] = str(val).upper()

    if len(normalized) < len(questions):
        raise HTTPException(
            status_code=400,
            detail=f"All {len(questions)} questions required. Got {len(normalized)}."
        )

    # Save quiz response
    existing = db.query(QuizResponse).filter(QuizResponse.user_id == current_user.id).first()
    if existing:
        existing.answers = normalized
    else:
        existing = QuizResponse(user_id=current_user.id, answers=normalized)
        db.add(existing)

    # Build int-keyed answer dict for scoring engine
    int_answers = {int(k): v for k, v in normalized.items()}

    # Compute self-compatibility (used for archetype/readiness)
    self_result = compute_compatibility(
        int_answers, int_answers,
        gender_a=current_user.gender or "other",
        gender_b=current_user.gender or "other",
        zodiac_a="aries", zodiac_b="aries",
        life_path_a=1, life_path_b=1,
    )

    archetype_label = compute_archetype(self_result["archetype_score"], self_result["shadow_score"])

    current_user.quiz_completed = True
    current_user.archetype = self_result.get("archetype", archetype_label)
    current_user.archetype_score = self_result["archetype_score"]
    current_user.shadow_score = self_result["shadow_score"]
    db.commit()

    # Compute compatibility with all other quiz-completed users
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

        other_answers = {int(k): v for k, v in (other_resp.answers or {}).items()}

        result = compute_compatibility(
            int_answers, other_answers,
            gender_a=current_user.gender or "other",
            gender_b=other.gender or "other",
            zodiac_a="aries", zodiac_b="aries",
            life_path_a=1, life_path_b=1,
        )

        # Upsert A→B
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
                user_a_id=current_user.id, user_b_id=other.id,
                score=result["score"], tier=result["tier"],
                tier_label=result["tier_label"], breakdown=result["breakdown"],
            ))

        # Upsert B→A (symmetric)
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
                user_a_id=other.id, user_b_id=current_user.id,
                score=result["score"], tier=result["tier"],
                tier_label=result["tier_label"], breakdown=result["breakdown"],
            ))

    db.commit()

    # Fire real-time notifications for both users
    from ..main import notify_new_match
    for other in others:
        other_resp = db.query(QuizResponse).filter(QuizResponse.user_id == other.id).first()
        if other_resp:
            cs = db.query(CompatibilityScore).filter(
                CompatibilityScore.user_a_id == other.id,
                CompatibilityScore.user_b_id == current_user.id,
            ).first()
            if cs:
                notify_new_match(other.id, current_user.name, cs.score, cs.tier_label)

    return QuizResult(
        score=self_result["score"],
        tier=self_result["tier"],
        tier_label=self_result["tier_label"],
        tier_emoji=self_result.get("tier_emoji", ""),
        breakdown=self_result["breakdown"],
        archetype_score=self_result["archetype_score"],
        shadow_score=self_result["shadow_score"],
        archetype=self_result.get("archetype", archetype_label),
        percentage=self_result["percentage"],
    )
