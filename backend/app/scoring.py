"""
Genesis OS v12 — Scientific Compatibility Scoring Engine.

Source of truth hierarchy:
  1. v12 scoring law (this file) — weights, gate, penalties, calibration
  2. v10 preserved assets — AnswerBank, AnswerPairQuantum, matrices, lookups
  3. Companion contracts for product behavior

v12 outer-layer weights:
  Stability/Readiness: 0.35
  Alignment/PatternFit: 0.45
  Chemistry/Polarity:   0.20

v12 piecewise calibration maps raw [0, ~0.65] → display [350, 850].
"""
from __future__ import annotations

import csv
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional

# ── v12 outer-layer weights ───────────────────────────────────────────────────
V12_STABILITY_WEIGHT = 0.35
V12_ALIGNMENT_WEIGHT = 0.45
V12_CHEMISTRY_WEIGHT = 0.20

# v10 component weight totals (for normalizing pair quantum components)
BEHAVIORAL_WEIGHT_TOTAL = 0.52
STABILITY_WEIGHT_TOTAL = 0.23
CHEMISTRY_WEIGHT_TOTAL = 0.13

# ── v12 gate coefficients ────────────────────────────────────────────────────
GATE_READ_MIN_COEFF = 0.25
GATE_RISK_INV_COEFF = 0.16
GATE_DRIFT_INV_COEFF = 0.11
GATE_READ_GAP_COEFF = 0.05
GATE_FLOOR = 0.45
GATE_CEIL = 1.00

# ── v12 explicit penalties ───────────────────────────────────────────────────
PEN_ANXIOUS_RECIPROCITY = 0.12
PEN_BOTH_VOLATILE = 0.13
PEN_ONE_VOLATILE = 0.05
PEN_SHADOW_HIGH = 0.023
PEN_READ_LOW = 0.014

# ── v12 trap thresholds ──────────────────────────────────────────────────────
ANXIOUS_RECIPROCITY_MIN = 0.56
GUARDED_RECIPROCITY_MAX = 0.62
ANXIOUS_CLUSTER_MIN = 0.15
ANXIOUS_READINESS_MAX = 0.60
VOLATILE_SHADOW_HIGH = 0.60
VOLATILE_SHADOW_MEDIUM = 0.55
VOLATILE_READINESS_MAX = 0.50
VOLATILE_PATTERN_HIGH = 0.13
VOLATILE_PATTERN_MEDIUM = 0.10
VOLATILE_CLUSTER_HIGH = 0.20

# ── v12 piecewise calibration breakpoints ────────────────────────────────────
CALIBRATION_POINTS = [
    (0.07881749859055168, 350),
    (0.1922322001861086,  500),
    (0.3275103341029847,  600),
    (0.4746223075950723,  700),
    (0.5286535995126718,  750),
    (0.6485076903777056,  850),
]

# ── v12 Tier rules — official labels from workbook ───────────────────────────
TIER_RULES = [
    ("Excellent match",       "excellent_match",   lambda s, st, ch: s >= 751),
    ("Good match",            "good_match",        lambda s, st, ch: s >= 701),
    ("Medium / workable",     "medium_workable",   lambda s, st, ch: s >= 601),
    ("Poor / unstable",       "poor_unstable",     lambda s, st, ch: s >= 501),
]
DEFAULT_TIER_LABEL = "Bad match"
DEFAULT_TIER_KEY = "bad_match"

TIER_EMOJI = {
    "excellent_match": "💜", "good_match": "✨", "medium_workable": "🌿",
    "poor_unstable": "⚡", "bad_match": "🚩",
}

# Legacy tier keys for backward compat (old cards still in DB)
LEGACY_TIER_EMOJI = {
    "soul_aligned": "💜", "strong_potential": "✨", "healthy_growing": "🌿",
    "magnetic_risky": "🔥", "possible_unstable": "⚡", "red_flag_zone": "🚩",
}
TIER_EMOJI.update(LEGACY_TIER_EMOJI)

# ── v12 Shadow Severity Priors ───────────────────────────────────────────────
SHADOW_PRIORS = {
    "None/Light": 0.05,
    "Regulated Grown-Up": 0.05,
    "Self-Saboteur": 0.35,
    "Scorekeeper": 0.45,
    "Stonewaller": 0.50,
    "Chameleon": 0.55,
    "Love Bomber": 0.60,
    "Manipulator": 0.70,
}

ARCHETYPES = [
    "Analyzer", "Fixer", "Icebox", "Performer", "Phantom Seeker",
    "Quiet Exit", "Regulated Grown-Up", "Romantic Idealist", "Survivor", "Translator",
]
SHADOWS = [
    "Manipulator", "Stonewaller", "Love Bomber",
    "Chameleon", "Scorekeeper", "Self-Saboteur",
]

SEED_DIR = Path(__file__).parent / "seed_data" / "csv"


# ── Seed data loading (v10 assets preserved) ─────────────────────────────────

def _read_csv(path: Path) -> List[Dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


@dataclass(frozen=True)
class WorkbookContext:
    weights: Dict[int, float]
    answer_lookup: Dict[Tuple[int, str], str]
    answer_bank: List[Dict[str, str]]
    pair_lookup: Dict[str, Dict[str, Any]]
    zodiac_lookup: Dict[str, float]
    numerology_lookup: Dict[str, float]
    questions: List[Dict[str, str]]
    archetype_matrix: Dict[str, Dict[str, float]]
    shadow_matrix: Dict[str, Dict[str, float]]


@lru_cache(maxsize=1)
def load_seed_context() -> WorkbookContext:
    answer_bank_rows = _read_csv(SEED_DIR / "answer_bank.csv")
    pair_rows = _read_csv(SEED_DIR / "answer_pair_quantum.csv")
    zodiac_rows = _read_csv(SEED_DIR / "zodiac_lookup.csv")
    numerology_rows = _read_csv(SEED_DIR / "numerology_lookup.csv")
    question_rows = _read_csv(SEED_DIR / "questions.csv")
    archetype_rows = _read_csv(SEED_DIR / "archetype_matrix.csv")
    shadow_rows = _read_csv(SEED_DIR / "shadow_matrix.csv")

    weights: Dict[int, float] = {}
    answer_lookup: Dict[Tuple[int, str], str] = {}
    for row in answer_bank_rows:
        q = int(row["question_number_int"])
        weights.setdefault(q, float(row["question_weight_v3"]))
        answer_lookup[(q, row["answer_letter"])] = row["answer_id"]

    numeric_cols = [
        "behavioral_component", "stability_component", "chemistry_component",
        "pair_norm_0_1", "gate", "rule_penalty", "base_0_88",
        "archetype_fit", "comm_fit", "reg_fit", "love_fit",
        "readiness_fit", "shadow_fit", "integrity_fit", "cluster_fit",
        "pace_fit", "polarity_fit", "pursuit_fit", "forecast_fit",
        "risk_avg", "risk_max",
    ]
    pair_lookup: Dict[str, Dict[str, Any]] = {}
    for row in pair_rows:
        casted = dict(row)
        for k in numeric_cols:
            casted[k] = float(row[k]) if row.get(k, "") != "" else 0.0
        pair_lookup[row["pair_key"]] = casted

    zodiac_lookup = {row["z_key"]: float(row["z_norm"]) for row in zodiac_rows}
    numerology_lookup = {row["n_key"]: float(row["n_norm"]) for row in numerology_rows}

    arch_matrix: Dict[str, Dict[str, float]] = {}
    for row in archetype_rows:
        label = row["row_label"]
        arch_matrix[label] = {k: float(v) for k, v in row.items() if k != "row_label"}

    shadow_mat: Dict[str, Dict[str, float]] = {}
    for row in shadow_rows:
        label = row["row_label"]
        shadow_mat[label] = {k: float(v) for k, v in row.items() if k != "row_label"}

    return WorkbookContext(
        weights=weights, answer_lookup=answer_lookup, answer_bank=answer_bank_rows,
        pair_lookup=pair_lookup, zodiac_lookup=zodiac_lookup,
        numerology_lookup=numerology_lookup, questions=question_rows,
        archetype_matrix=arch_matrix, shadow_matrix=shadow_mat,
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _pair_key(a: str, b: str) -> str:
    return f"{a}|{b}" if a <= b else f"{b}|{a}"


def _norm(val: float, divisor: float) -> float:
    return max(0.0, min(1.0, val / divisor)) if divisor > 0 else 0.0


def _get_tier(score: float, stability: float, chemistry: float) -> Tuple[str, str, str]:
    for label, key, pred in TIER_RULES:
        if pred(score, stability, chemistry):
            return key, label, TIER_EMOJI.get(key, "")
    return DEFAULT_TIER_KEY, DEFAULT_TIER_LABEL, TIER_EMOJI[DEFAULT_TIER_KEY]


def compute_life_path(dob_str: str) -> int:
    digits = [int(d) for d in str(dob_str).replace("-", "") if d.isdigit()]
    total = sum(digits)
    while total > 9 and total not in (11, 22, 33):
        total = sum(int(d) for d in str(total))
    return total


def _piecewise_calibrate(raw: float) -> float:
    """v12 piecewise interpolation: raw → display score [350, 850]."""
    if raw <= CALIBRATION_POINTS[0][0]:
        return 350.0
    if raw >= CALIBRATION_POINTS[-1][0]:
        return 850.0
    for i in range(len(CALIBRATION_POINTS) - 1):
        r0, s0 = CALIBRATION_POINTS[i]
        r1, s1 = CALIBRATION_POINTS[i + 1]
        if r0 <= raw <= r1:
            t = (raw - r0) / (r1 - r0) if r1 != r0 else 0
            return s0 + t * (s1 - s0)
    return 350.0


# ── v12 User Readiness ───────────────────────────────────────────────────────

def _compute_user_readiness(answers: Dict[int, str], ctx: WorkbookContext) -> float:
    """R_u = clamp(0.7×AF + 0.3×CI - min(0.20, 0.12×Contrad + 0.08×Instab), 0, 1)"""
    af_sum = ci_sum = contrad_sum = instab_sum = wt = 0.0
    for row in ctx.answer_bank:
        q = int(row["question_number_int"])
        if answers.get(q) == row["answer_letter"]:
            w = float(row.get("question_weight_v3", 1.0))
            af_sum += w * float(row.get("readiness_norm", 0.5))
            integrity = float(row.get("integrity_penalty_norm", 0.0))
            cluster = float(row.get("cluster_penalty_norm", 0.0))
            ci_sum += w * (1 - (integrity + cluster) / 2)
            contrad_sum += w * cluster
            instab_sum += w * float(row.get("pattern_risk_norm", 0.0))
            wt += w
    if wt == 0:
        return 0.5
    af = af_sum / wt
    ci = ci_sum / wt
    contrad = contrad_sum / wt
    instab = instab_sum / wt
    penalty = min(0.20, 0.12 * contrad + 0.08 * instab)
    return max(0.0, min(1.0, 0.7 * af + 0.3 * ci - penalty))


# ── Archetype / Shadow inference ─────────────────────────────────────────────

def get_archetype_from_answers(answers: Dict[int, str], ctx: WorkbookContext) -> Tuple[str, str]:
    scores: Dict[str, float] = {a: 0.0 for a in ARCHETYPES}
    for row in ctx.answer_bank:
        q = int(row["question_number_int"])
        if answers.get(q) == row["answer_letter"]:
            arch = row.get("archetype", "").strip()
            if arch in scores:
                scores[arch] += float(row.get("question_weight_v3", 1.0))
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary = ranked[0][0] if ranked[0][1] > 0 else "Survivor"
    secondary = ranked[1][0] if len(ranked) > 1 and ranked[1][1] > 0 else "Translator"
    return primary, secondary


def get_shadow_from_answers(answers: Dict[int, str], ctx: WorkbookContext) -> str:
    risk = 0.0
    count = 0
    for row in ctx.answer_bank:
        q = int(row["question_number_int"])
        if answers.get(q) == row["answer_letter"]:
            risk += float(row.get("pattern_risk_norm", 0.0))
            count += 1
    avg = risk / count if count > 0 else 0.0
    if avg < 0.15: return "Regulated Grown-Up"
    if avg < 0.30: return "Scorekeeper"
    if avg < 0.45: return "Stonewaller"
    if avg < 0.60: return "Self-Saboteur"
    if avg < 0.75: return "Love Bomber"
    return "Manipulator"


def compute_readiness(answers: Dict[int, str], ctx: WorkbookContext) -> float:
    return round(_compute_user_readiness(answers, ctx) * 100, 1)


def readiness_forecast(score: float) -> str:
    if score >= 85: return "Strong outlook"
    if score >= 70: return "Stable outlook"
    if score >= 55: return "Mixed outlook"
    if score >= 40: return "Guarded outlook"
    return "Early signal only"


# ── v12 Main Compatibility Engine ────────────────────────────────────────────

def compute_compatibility(
    user_a_answers: Dict[int, str],
    user_b_answers: Dict[int, str],
    *,
    gender_a: str = "other",
    gender_b: str = "other",
    zodiac_a: str = "aries",
    zodiac_b: str = "aries",
    life_path_a: int = 1,
    life_path_b: int = 1,
) -> Dict[str, Any]:
    """v12 deterministic compatibility computation."""
    ctx = load_seed_context()

    all_qs = sorted(ctx.weights.keys())
    answered_qs = [q for q in all_qs if q in user_a_answers and q in user_b_answers]

    if not answered_qs:
        return _empty_result()

    # ── Phase 1: Accumulate pair quantum components ───────────────────────
    wpn = wb = ws = wc = tw = 0.0
    per_question = []

    for q in answered_qs:
        key_a = (q, user_a_answers[q])
        key_b = (q, user_b_answers[q])
        if key_a not in ctx.answer_lookup or key_b not in ctx.answer_lookup:
            continue
        aid_a = ctx.answer_lookup[key_a]
        aid_b = ctx.answer_lookup[key_b]
        pk = _pair_key(aid_a, aid_b)
        if pk not in ctx.pair_lookup:
            continue

        pr = ctx.pair_lookup[pk]
        w = ctx.weights[q]

        wpn += w * pr["pair_norm_0_1"]
        wb  += w * pr["behavioral_component"]
        ws  += w * pr["stability_component"]
        wc  += w * pr["chemistry_component"]
        tw  += w

        per_question.append({
            "question_number": q, "weight": w,
            "pair_norm_0_1": round(pr["pair_norm_0_1"], 4),
        })

    if tw == 0:
        return _empty_result()

    # ── Phase 2: Normalize to 0-1 diagnostics ────────────────────────────
    stability_avg = _norm(ws / tw, STABILITY_WEIGHT_TOTAL)
    alignment_avg = _norm(wb / tw, BEHAVIORAL_WEIGHT_TOTAL)  # alignment = behavioral
    chemistry_avg = _norm(wc / tw, CHEMISTRY_WEIGHT_TOTAL)
    core_norm = wpn / tw

    # ── Phase 3: v12 user readiness ──────────────────────────────────────
    read_a = _compute_user_readiness(user_a_answers, ctx)
    read_b = _compute_user_readiness(user_b_answers, ctx)
    read_min = min(read_a, read_b)
    read_gap = abs(read_a - read_b)

    # ── Phase 4: Risk signals from pair data ─────────────────────────────
    risk_avg_sum = risk_max_sum = 0.0
    shadow_max = 0.0
    for q in answered_qs:
        key_a = (q, user_a_answers[q])
        key_b = (q, user_b_answers[q])
        if key_a in ctx.answer_lookup and key_b in ctx.answer_lookup:
            pk = _pair_key(ctx.answer_lookup[key_a], ctx.answer_lookup[key_b])
            if pk in ctx.pair_lookup:
                pr = ctx.pair_lookup[pk]
                risk_avg_sum += pr.get("risk_avg", 0)
                risk_max_sum += pr.get("risk_max", 0)
                shadow_max = max(shadow_max, pr.get("shadow_fit", 0))
    n_pairs = max(len(answered_qs), 1)
    risk_avg = risk_avg_sum / n_pairs
    risk_inv = 1 - min(1, risk_avg)
    drift_inv = 1 - min(1, risk_max_sum / n_pairs)

    # ── Phase 5: v12 Base with outer-layer weights ───────────────────────
    v12_base = (
        V12_STABILITY_WEIGHT * stability_avg +
        V12_ALIGNMENT_WEIGHT * alignment_avg +
        V12_CHEMISTRY_WEIGHT * chemistry_avg
    )

    # ── Phase 6: v12 Gate ────────────────────────────────────────────────
    gate_raw = 1 - (
        GATE_READ_MIN_COEFF * (1 - read_min) +
        GATE_RISK_INV_COEFF * (1 - risk_inv) +
        GATE_DRIFT_INV_COEFF * (1 - drift_inv) +
        GATE_READ_GAP_COEFF * read_gap
    )
    gate = max(GATE_FLOOR, min(GATE_CEIL, gate_raw))

    # ── Phase 7: v12 Explicit penalties ──────────────────────────────────
    penalty = 0.0
    # Shadow severity
    if shadow_max >= VOLATILE_SHADOW_HIGH:
        penalty += PEN_SHADOW_HIGH
    # Readiness floor
    if read_min < 0.42:
        penalty += PEN_READ_LOW
    # Volatile-shadow trap
    pattern_a = sum(float(r.get("pattern_risk_norm", 0)) for r in ctx.answer_bank
                    if user_a_answers.get(int(r["question_number_int"])) == r["answer_letter"]) / max(1, len(answered_qs))
    pattern_b = sum(float(r.get("pattern_risk_norm", 0)) for r in ctx.answer_bank
                    if user_b_answers.get(int(r["question_number_int"])) == r["answer_letter"]) / max(1, len(answered_qs))
    vol_a = shadow_max >= VOLATILE_SHADOW_MEDIUM and pattern_a >= VOLATILE_PATTERN_MEDIUM
    vol_b = shadow_max >= VOLATILE_SHADOW_MEDIUM and pattern_b >= VOLATILE_PATTERN_MEDIUM
    if vol_a and vol_b:
        penalty += PEN_BOTH_VOLATILE
    elif vol_a or vol_b:
        penalty += PEN_ONE_VOLATILE

    # ── Phase 8: Raw score ───────────────────────────────────────────────
    raw = max(0.0, min(1.0, v12_base * gate - penalty))

    # ── Phase 9: Cosmic overlay (preserved from v10) ─────────────────────
    g_a, g_b = gender_a[0].upper(), gender_b[0].upper()
    z_key = f"{g_a}|{g_b}|{zodiac_a.lower()}|{zodiac_b.lower()}"
    zodiac_norm = ctx.zodiac_lookup.get(z_key, ctx.zodiac_lookup.get(
        f"{g_b}|{g_a}|{zodiac_b.lower()}|{zodiac_a.lower()}", 0.5))
    n_key = f"{min(life_path_a, life_path_b)}|{max(life_path_a, life_path_b)}"
    numerology_norm = ctx.numerology_lookup.get(n_key, 0.5)
    cosmic = (0.07 * zodiac_norm) + (0.05 * numerology_norm)

    # Apply cosmic as additive to raw before calibration
    raw_with_cosmic = max(0.0, min(1.0, raw + cosmic * 0.1))

    # ── Phase 10: v12 piecewise calibration → 350-850 ────────────────────
    score = round(_piecewise_calibrate(raw_with_cosmic), 1)
    score = max(350, min(850, score))

    tier_key, tier_label, tier_emoji = _get_tier(score, stability_avg, chemistry_avg)

    # ── Phase 11: Archetype + shadow inference ───────────────────────────
    arch_a, arch_a2 = get_archetype_from_answers(user_a_answers, ctx)
    arch_b, _ = get_archetype_from_answers(user_b_answers, ctx)
    shadow_a = get_shadow_from_answers(user_a_answers, ctx)
    shadow_b = get_shadow_from_answers(user_b_answers, ctx)

    # Archetype fit from matrix
    arch_fit = 0.5
    a_lower = arch_a.lower().replace(" ", "_")
    b_lower = arch_b.lower().replace(" ", "_")
    for row_label, cols in ctx.archetype_matrix.items():
        if row_label.lower().replace(" ", "_") == a_lower:
            arch_fit = cols.get(b_lower, 0.5)
            break

    # Shadow fit from matrix
    shadow_fit = 0.5
    for row_label, cols in ctx.shadow_matrix.items():
        if row_label.lower().replace(" ", "_").replace("-", "_") == shadow_a.lower().replace(" ", "_").replace("-", "_"):
            shadow_fit = cols.get(shadow_b.lower().replace(" ", "_").replace("-", "_"), 0.5)
            break

    # v12 Shadow Stability via priors
    shadow_severity_a = SHADOW_PRIORS.get(shadow_a, 0.3)
    shadow_severity_b = SHADOW_PRIORS.get(shadow_b, 0.3)
    shadow_stability = 1 - (shadow_severity_a + shadow_severity_b) / 2

    positive = sorted(per_question, key=lambda r: r["pair_norm_0_1"], reverse=True)[:5]
    friction = sorted(per_question, key=lambda r: r["pair_norm_0_1"])[:5]

    # v12 breakdown: Scientific score components + separate Vibe Overlay
    breakdown = {
        "StabilityReadiness": round(stability_avg * 100),
        "AlignmentPatternFit": round(alignment_avg * 100),
        "ChemistryPolarity": round(chemistry_avg * 100),
        "ShadowStability": round(shadow_stability * 100),
        "ArchetypeFit": round(arch_fit * 100),
    }

    # Vibe Overlay — separate from scientific score, does NOT move tier label
    vibe_overlay = {
        "ZodiacAlignment": round(zodiac_norm * 100),
        "NumerologyAlignment": round(numerology_norm * 100),
        "CosmicOverlay": round(cosmic * 100, 1),
    }

    return {
        "score": score,
        "tier": tier_key,
        "tier_label": tier_label,
        "tier_emoji": tier_emoji,
        "breakdown": breakdown,
        "vibe_overlay": vibe_overlay,
        "shadow_stability": round(shadow_stability, 4),
        "archetype_score": round(arch_fit * 100),
        "shadow_score": round(shadow_fit * 100),
        "archetype": arch_a,
        "archetype_secondary": arch_a2,
        "shadow_pattern": shadow_a,
        "shadow_pattern_b": shadow_b,
        "percentage": round((score - 350) / 500 * 100),
        "final_norm": round(raw_with_cosmic, 6),
        "core_norm": round(core_norm, 6),
        "stability_avg": round(stability_avg, 6),
        "chemistry_avg": round(chemistry_avg, 6),
        "behavioral_avg": round(alignment_avg, 6),
        "zodiac_norm": round(zodiac_norm, 6),
        "numerology_norm": round(numerology_norm, 6),
        "cosmic_overlay": round(cosmic, 6),
        "readiness_a": round(read_a * 100, 1),
        "readiness_b": round(read_b * 100, 1),
        "readiness_forecast_a": readiness_forecast(read_a * 100),
        "readiness_forecast_b": readiness_forecast(read_b * 100),
        "top_positive_drivers": positive,
        "top_friction_drivers": friction,
        "scoring_version": "v12",
        "v12_diagnostics": {
            "raw": round(raw, 6),
            "gate": round(gate, 4),
            "penalty": round(penalty, 4),
            "read_min": round(read_min, 4),
            "read_gap": round(read_gap, 4),
            "v12_base": round(v12_base, 4),
        },
    }


def _empty_result() -> Dict[str, Any]:
    return {
        "score": 350, "tier": DEFAULT_TIER_KEY, "tier_label": DEFAULT_TIER_LABEL,
        "tier_emoji": "🚩", "breakdown": {}, "archetype_score": 0, "shadow_score": 0,
        "archetype": "Unknown", "percentage": 0,
        "stability_avg": 0, "chemistry_avg": 0, "core_norm": 0,
        "zodiac_norm": 0, "numerology_norm": 0, "cosmic_overlay": 0,
        "readiness_a": 0, "readiness_b": 0, "scoring_version": "v12",
    }


def compute_archetype(archetype_score: float, shadow_score: float) -> str:
    """Legacy archetype label — backward compat."""
    if archetype_score >= 70 and shadow_score >= 70: return "The Transformer"
    if archetype_score >= 70: return "The Visionary"
    if shadow_score >= 70: return "The Catalyst"
    return "The Seeker"
