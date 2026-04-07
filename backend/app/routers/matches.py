from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, CompatibilityScore
from ..schemas import MatchResult
from ..auth import get_current_user

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("", response_model=list[MatchResult])
def get_matches(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scores = (
        db.query(CompatibilityScore)
        .filter(CompatibilityScore.user_a_id == current_user.id)
        .order_by(CompatibilityScore.score.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    results = []
    for cs in scores:
        other = db.query(User).filter(User.id == cs.user_b_id).first()
        if not other:
            continue
        pct = round((cs.score - 350) / 500 * 100)
        results.append(MatchResult(
            user_id=other.id,
            name=other.name,
            age=other.age,
            gender=other.gender,
            bio=other.bio,
            archetype=other.archetype,
            score=cs.score,
            tier=cs.tier,
            tier_label=cs.tier_label,
            percentage=max(0, min(100, pct)),
            breakdown=cs.breakdown or {},
        ))

    return results


@router.get("/{user_id}", response_model=MatchResult)
def get_match_detail(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cs = db.query(CompatibilityScore).filter(
        CompatibilityScore.user_a_id == current_user.id,
        CompatibilityScore.user_b_id == user_id,
    ).first()

    if not cs:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No compatibility score found")

    other = db.query(User).filter(User.id == user_id).first()
    pct = round((cs.score - 350) / 500 * 100)

    return MatchResult(
        user_id=other.id,
        name=other.name,
        age=other.age,
        gender=other.gender,
        bio=other.bio,
        archetype=other.archetype,
        score=cs.score,
        tier=cs.tier,
        tier_label=cs.tier_label,
        percentage=max(0, min(100, pct)),
        breakdown=cs.breakdown or {},
    )
