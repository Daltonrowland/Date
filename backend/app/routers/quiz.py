from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, QuizResponse, CompatibilityScore
from ..schemas import QuizSubmit, QuizResult
from ..auth import get_current_user
from ..quiz_questions import get_questions, CATEGORIES
from ..scoring import (
    compute_compatibility, compute_archetype, load_seed_context,
    get_archetype_from_answers, get_shadow_from_answers,
    compute_readiness, readiness_forecast, compute_life_path,
)

router = APIRouter(prefix="/quiz", tags=["quiz"])

SCORING_VERSION = "phase1.v1"


@router.get("/questions")
def get_quiz_questions():
    questions = get_questions()
    return {"questions": questions, "categories": CATEGORIES, "total": len(questions)}


@router.post("/submit", response_model=QuizResult)
def submit_quiz(payload: QuizSubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    questions = get_questions()
    valid_ids = {str(q["id"]) for q in questions}

    # Normalize answers: convert numeric 1-5 → letters A-E
    normalized: dict[str, str] = {}
    for qid, val in payload.answers.items():
        if qid not in valid_ids:
            continue
        if isinstance(val, int) or (isinstance(val, str) and val.isdigit()):
            idx = int(val) - 1
            normalized[qid] = "ABCDE"[min(max(idx, 0), 4)]
        else:
            normalized[qid] = str(val).upper()

    if len(normalized) < len(questions):
        raise HTTPException(status_code=400, detail=f"All {len(questions)} questions required. Got {len(normalized)}.")

    ctx = load_seed_context()

    # Build answer_details for audit trail
    answer_details = []
    for qid, letter in normalized.items():
        q_num = int(qid)
        answer_id = ctx.answer_lookup.get((q_num, letter), "")
        # Find the answer text
        answer_text = ""
        phase = ""
        for row in ctx.answer_bank:
            if int(row["question_number_int"]) == q_num and row["answer_letter"] == letter:
                answer_text = row["answer_text"]
                phase = row["phase"]
                break
        answer_details.append({
            "question_number": q_num,
            "answer_id": answer_id,
            "answer_letter": letter,
            "answer_text": answer_text[:200],
            "phase": phase,
            "scoring_version": SCORING_VERSION,
            "submitted_at": datetime.utcnow().isoformat(),
        })

    # Upsert quiz response with full details
    existing = db.query(QuizResponse).filter(QuizResponse.user_id == current_user.id).first()
    if existing:
        existing.answers = normalized
        existing.answer_details = answer_details
        existing.scoring_version = SCORING_VERSION
        existing.completed_at = datetime.utcnow()
    else:
        existing = QuizResponse(
            user_id=current_user.id,
            answers=normalized,
            answer_details=answer_details,
            scoring_version=SCORING_VERSION,
        )
        db.add(existing)

    int_answers = {int(k): v for k, v in normalized.items()}

    # Compute self-score for archetype/shadow/readiness
    self_result = compute_compatibility(
        int_answers, int_answers,
        gender_a=current_user.gender or "other",
        gender_b=current_user.gender or "other",
        zodiac_a=current_user.sun_sign or "aries",
        zodiac_b=current_user.sun_sign or "aries",
        life_path_a=current_user.life_path_number or 1,
        life_path_b=current_user.life_path_number or 1,
    )

    # Update user profile with Genesis OS outputs
    arch_primary, arch_secondary = get_archetype_from_answers(int_answers, ctx)
    shadow = get_shadow_from_answers(int_answers, ctx)
    readiness = compute_readiness(int_answers, ctx)

    current_user.quiz_completed = True
    current_user.archetype = arch_primary
    current_user.archetype_secondary = arch_secondary
    current_user.shadow_type = shadow
    current_user.archetype_score = self_result["archetype_score"]
    current_user.shadow_score = self_result["shadow_score"]
    current_user.readiness_score = readiness
    current_user.readiness_forecast = readiness_forecast(readiness)
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

        other_int = {int(k): v for k, v in (other_resp.answers or {}).items()}
        result = compute_compatibility(
            int_answers, other_int,
            gender_a=current_user.gender or "other",
            gender_b=other.gender or "other",
            zodiac_a=current_user.sun_sign or "aries",
            zodiac_b=other.sun_sign or "aries",
            life_path_a=current_user.life_path_number or 1,
            life_path_b=other.life_path_number or 1,
        )

        def _upsert_score(a_id, b_id):
            cs = db.query(CompatibilityScore).filter(
                CompatibilityScore.user_a_id == a_id,
                CompatibilityScore.user_b_id == b_id,
            ).first()
            if cs:
                cs.score = result["score"]
                cs.tier = result["tier"]
                cs.tier_label = result["tier_label"]
                cs.final_norm = result["final_norm"]
                cs.core_norm = result["core_norm"]
                cs.behavioral_avg = result["behavioral_avg"]
                cs.stability_avg = result["stability_avg"]
                cs.chemistry_avg = result["chemistry_avg"]
                cs.zodiac_norm = result["zodiac_norm"]
                cs.numerology_norm = result["numerology_norm"]
                cs.cosmic_overlay = result["cosmic_overlay"]
                cs.breakdown = result["breakdown"]
                cs.top_positive_drivers = result["top_positive_drivers"]
                cs.top_friction_drivers = result["top_friction_drivers"]
                cs.scoring_version = SCORING_VERSION
            else:
                db.add(CompatibilityScore(
                    user_a_id=a_id, user_b_id=b_id,
                    score=result["score"], tier=result["tier"], tier_label=result["tier_label"],
                    final_norm=result["final_norm"], core_norm=result["core_norm"],
                    behavioral_avg=result["behavioral_avg"], stability_avg=result["stability_avg"],
                    chemistry_avg=result["chemistry_avg"], zodiac_norm=result["zodiac_norm"],
                    numerology_norm=result["numerology_norm"], cosmic_overlay=result["cosmic_overlay"],
                    breakdown=result["breakdown"],
                    top_positive_drivers=result["top_positive_drivers"],
                    top_friction_drivers=result["top_friction_drivers"],
                    scoring_version=SCORING_VERSION,
                ))

        _upsert_score(current_user.id, other.id)
        _upsert_score(other.id, current_user.id)

    db.commit()

    # Fire real-time notifications
    try:
        from ..main import notify_new_match
        for other in others:
            cs = db.query(CompatibilityScore).filter(
                CompatibilityScore.user_a_id == other.id,
                CompatibilityScore.user_b_id == current_user.id,
            ).first()
            if cs:
                notify_new_match(other.id, current_user.name, cs.score, cs.tier_label)
    except Exception:
        pass

    # Award coins + badge for quiz completion
    try:
        from .economy import award_coins, award_badge
        award_coins(db, current_user.id, "assessment_completed")
        award_badge(db, current_user.id, "assessed")
    except Exception:
        pass

    return QuizResult(
        score=self_result["score"],
        tier=self_result["tier"],
        tier_label=self_result["tier_label"],
        tier_emoji=self_result.get("tier_emoji", ""),
        breakdown=self_result["breakdown"],
        archetype_score=self_result["archetype_score"],
        shadow_score=self_result["shadow_score"],
        archetype=arch_primary,
        archetype_secondary=arch_secondary,
        shadow_type=shadow,
        readiness_score=readiness,
        readiness_forecast=readiness_forecast(readiness),
        percentage=self_result["percentage"],
        core_norm=self_result["core_norm"],
        stability_avg=self_result["stability_avg"],
        chemistry_avg=self_result["chemistry_avg"],
        behavioral_avg=self_result["behavioral_avg"],
        zodiac_norm=self_result["zodiac_norm"],
        numerology_norm=self_result["numerology_norm"],
        cosmic_overlay=self_result["cosmic_overlay"],
    )
