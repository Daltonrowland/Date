from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, CompatibilityScore, Like
from ..schemas import MatchResult
from ..auth import get_current_user
from ..scoring import load_seed_context

router = APIRouter(prefix="/matches", tags=["matches"])

ARCHETYPE_PAIRINGS = {
    ("Analyzer", "Romantic Idealist"): "Logic meets heart — deep balance when both feel safe.",
    ("Analyzer", "Fixer"): "Two doers who may forget to feel. Needs intentional softness.",
    ("Analyzer", "Icebox"): "Two walls can create quiet respect — or permanent distance.",
    ("Fixer", "Romantic Idealist"): "Action meets vision. Beautiful when aligned, exhausting when not.",
    ("Fixer", "Survivor"): "Care meets resilience. Watch for over-functioning.",
    ("Icebox", "Romantic Idealist"): "Fire meets ice. High chemistry, hard repair.",
    ("Icebox", "Performer"): "Stillness meets intensity. Intriguing but volatile.",
    ("Regulated Grown-Up", "Romantic Idealist"): "Grounded love meets dreamy depth. Strong foundation.",
    ("Regulated Grown-Up", "Survivor"): "Secure meets resilient. One of the strongest pairings.",
    ("Translator", "Icebox"): "The bridge and the wall. Translator can reach what others can't.",
    ("Phantom Seeker", "Romantic Idealist"): "Two dreamers. Beautiful orbit, hard landing.",
    ("Quiet Exit", "Fixer"): "One leaves, one chases. Classic pursuer-withdrawer tension.",
}


def _get_archetype_fit_label(arch_a: str, arch_b: str) -> str:
    label = ARCHETYPE_PAIRINGS.get((arch_a, arch_b)) or ARCHETYPE_PAIRINGS.get((arch_b, arch_a))
    if label:
        return label
    ctx = load_seed_context()
    a_lower = arch_a.lower().replace(" ", "_")
    b_lower = arch_b.lower().replace(" ", "_")
    fit = 0.5
    for row_label, cols in ctx.archetype_matrix.items():
        if row_label.lower().replace(" ", "_") == a_lower:
            fit = cols.get(b_lower, 0.5)
            break
    if fit >= 0.75: return f"{arch_a} and {arch_b} have strong natural alignment."
    elif fit >= 0.60: return f"{arch_a} and {arch_b} can build something solid with effort."
    elif fit >= 0.45: return f"{arch_a} and {arch_b} bring contrasting energy — growth potential."
    else: return f"{arch_a} and {arch_b} require intentional work to bridge differences."


def _build_match(cs, other, my_archetype, i_liked, they_liked):
    pct = round((cs.score - 350) / 500 * 100)
    return MatchResult(
        user_id=other.id, name=other.name, rs_code=other.rs_code or "",
        age=other.age, gender=other.gender, bio=other.bio,
        photo_url=other.photo_url or "", profile_photo=other.profile_photo or "",
        archetype=other.archetype, archetype_secondary=other.archetype_secondary or "",
        shadow_type=other.shadow_type or "", sun_sign=other.sun_sign or "",
        life_path_number=other.life_path_number,
        score=cs.score, tier=cs.tier, tier_label=cs.tier_label,
        percentage=max(0, min(100, pct)), breakdown=cs.breakdown or {},
        core_norm=cs.core_norm, stability_avg=cs.stability_avg,
        chemistry_avg=cs.chemistry_avg, cosmic_overlay=cs.cosmic_overlay,
        zodiac_norm=cs.zodiac_norm, numerology_norm=cs.numerology_norm,
        archetype_fit_label=_get_archetype_fit_label(my_archetype, other.archetype or "Survivor"),
        i_liked=i_liked, they_liked=they_liked,
    )


@router.get("", response_model=list[MatchResult])
def get_matches(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    gender_filter: str = Query("", description="Filter by gender"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get like sets for this user
    my_likes = {l.liked_id for l in db.query(Like).filter(Like.liker_id == current_user.id).all()}
    liked_me = {l.liker_id for l in db.query(Like).filter(Like.liked_id == current_user.id).all()}

    scores = (
        db.query(CompatibilityScore)
        .filter(CompatibilityScore.user_a_id == current_user.id)
        .order_by(CompatibilityScore.score.desc())
        .all()
    )
    results = []
    for cs in scores:
        other = db.query(User).filter(User.id == cs.user_b_id).first()
        if not other:
            continue
        # Gender filter
        if gender_filter and gender_filter.lower() not in ("", "everyone"):
            other_gender = (other.gender or "").lower()
            if gender_filter.lower() == "women" and other_gender not in ("woman", "women", "female"):
                continue
            elif gender_filter.lower() == "men" and other_gender not in ("man", "men", "male"):
                continue
            elif gender_filter.lower() == "non-binary" and other_gender not in ("non-binary", "nonbinary"):
                continue
        results.append(_build_match(
            cs, other, current_user.archetype or "Survivor",
            other.id in my_likes, other.id in liked_me,
        ))
    return results[offset:offset + limit]


@router.get("/{user_id}", response_model=MatchResult)
def get_match_detail(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cs = db.query(CompatibilityScore).filter(
        CompatibilityScore.user_a_id == current_user.id,
        CompatibilityScore.user_b_id == user_id,
    ).first()
    if not cs:
        raise HTTPException(status_code=404, detail="No compatibility score found")
    other = db.query(User).filter(User.id == user_id).first()
    i_liked = db.query(Like).filter(Like.liker_id == current_user.id, Like.liked_id == user_id).first() is not None
    they_liked = db.query(Like).filter(Like.liker_id == user_id, Like.liked_id == current_user.id).first() is not None
    return _build_match(cs, other, current_user.archetype or "Survivor", i_liked, they_liked)
