"""
Compatibility scoring engine.

Scale: 350 – 850 (mirrors credit score familiarity).
Algorithm:
  - For each of 60 questions compare user A and user B answers (1-5).
  - Points per question = 5 - abs(a - b)  → range 1–5
  - Raw total range: 60 (all opposite) – 300 (all identical)
  - Mapped score = 350 + ((raw - 60) / 240) * 500

Categories produce a breakdown dict plus archetype / shadow sub-scores.
"""

from .quiz_questions import QUESTIONS, CATEGORIES

TIERS = [
    (750, 851, "soul_aligned",    "Soul-Aligned",    "💜"),
    (650, 750, "deep_connection", "Deep Connection", "💗"),
    (550, 650, "strong_potential","Strong Potential", "✨"),
    (450, 550, "building_ground", "Building Ground",  "🌱"),
    (400, 450, "friction_zone",   "Friction Zone",    "⚡"),
    (350, 400, "red_flag_zone",   "Red Flag Zone",    "🚩"),
]


def get_tier(score: float) -> tuple[str, str, str]:
    for low, high, key, label, emoji in TIERS:
        if low <= score < high:
            return key, label, emoji
    return "red_flag_zone", "Red Flag Zone", "🚩"


def compute_compatibility(answers_a: dict, answers_b: dict) -> dict:
    """
    answers_a / answers_b: {str(question_id): int (1-5)}
    Returns full scoring payload.
    """
    category_raw = {i: 0 for i in range(len(CATEGORIES))}
    category_max = {i: 0 for i in range(len(CATEGORIES))}
    total_raw = 0
    total_max = 0

    for q in QUESTIONS:
        qid = str(q["id"])
        a = answers_a.get(qid) or answers_a.get(q["id"])
        b = answers_b.get(qid) or answers_b.get(q["id"])
        if a is None or b is None:
            continue
        pts = 5 - abs(int(a) - int(b))
        cat = q["category"]
        category_raw[cat] += pts
        category_max[cat] += 5
        total_raw += pts
        total_max += 5

    if total_max == 0:
        return {"score": 350, "tier": "red_flag_zone", "tier_label": "Red Flag Zone", "breakdown": {}}

    # Map to 350-850
    min_raw = total_max // 5  # all questions answered opposite (1 pt each)
    score = 350 + ((total_raw - min_raw) / max(total_max - min_raw, 1)) * 500
    score = round(min(850, max(350, score)))

    tier_key, tier_label, tier_emoji = get_tier(score)

    breakdown = {}
    for i, name in enumerate(CATEGORIES):
        if category_max[i] > 0:
            pct = round((category_raw[i] / category_max[i]) * 100)
        else:
            pct = 0
        breakdown[name] = pct

    # Archetype score: avg of categories 0, 2, 4 (Attachment, Values, Lifestyle)
    archetype_cats = [0, 2, 4]
    archetype_score = round(
        sum(breakdown[CATEGORIES[c]] for c in archetype_cats) / len(archetype_cats)
    )

    # Shadow score: avg of categories 1, 3, 5 (Communication, Love Lang, Conflict)
    shadow_cats = [1, 3, 5]
    shadow_score = round(
        sum(breakdown[CATEGORIES[c]] for c in shadow_cats) / len(shadow_cats)
    )

    return {
        "score": score,
        "tier": tier_key,
        "tier_label": tier_label,
        "tier_emoji": tier_emoji,
        "breakdown": breakdown,
        "archetype_score": archetype_score,
        "shadow_score": shadow_score,
        "percentage": round((score - 350) / 500 * 100),
    }


def compute_archetype(archetype_score: float, shadow_score: float) -> str:
    if archetype_score >= 70 and shadow_score >= 70:
        return "The Transformer"
    if archetype_score >= 70 and shadow_score < 70:
        return "The Visionary"
    if archetype_score < 70 and shadow_score >= 70:
        return "The Catalyst"
    return "The Seeker"
