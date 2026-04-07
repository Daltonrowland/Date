"""
Genesis OS Phase 1 — Deterministic Compatibility Scoring Engine.

Uses 48,205 pre-computed answer-pair quanta from the workbook to produce:
  - CompatibilityScore (350–850)
  - CoreNorm, BehavioralAvg, StabilityAvg, ChemistryAvg diagnostics
  - ZodiacNorm, NumerologyNorm, CosmicOverlay
  - Tier assignment (6 tiers with stability+chemistry gates)
  - Archetype / shadow / readiness inference from answer patterns
  - Top positive and friction drivers per question

Diagnostic note (from MIGRATION_LEDGER):
  StabilityAvg and ChemistryAvg are normalized category diagnostics derived
  from weighted component averages divided by 0.23 and 0.13 respectively.
  CompatibilityScore itself uses workbook pair_norm_0_1 exactly.
"""
from __future__ import annotations

import csv
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional

# ── Weight totals (from workbook) ─────────────────────────────────────────────
BEHAVIORAL_WEIGHT_TOTAL = 0.52
STABILITY_WEIGHT_TOTAL = 0.23
CHEMISTRY_WEIGHT_TOTAL = 0.13

# ── Tier rules (evaluated in order) ──────────────────────────────────────────
TIER_RULES = [
    ("Soul-aligned match",    "soul_aligned",    lambda s, st, ch: s >= 760 and st >= 0.74 and ch >= 0.58),
    ("Strong potential",      "strong_potential", lambda s, st, ch: s >= 700 and st >= 0.62),
    ("Healthy but growing",   "healthy_growing",  lambda s, st, ch: s >= 650 and st >= 0.58),
    ("Magnetic but risky",    "magnetic_risky",   lambda s, st, ch: s >= 640 and st < 0.58 and ch >= 0.72),
    ("Possible but unstable", "possible_unstable",lambda s, st, ch: s >= 560 and st >= 0.40),
]
DEFAULT_TIER_LABEL = "Red flag zone"
DEFAULT_TIER_KEY = "red_flag_zone"

TIER_EMOJI = {
    "soul_aligned": "💜", "strong_potential": "✨", "healthy_growing": "🌿",
    "magnetic_risky": "🔥", "possible_unstable": "⚡", "red_flag_zone": "🚩",
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

# ── Seed data loading ─────────────────────────────────────────────────────────

def _read_csv(path: Path) -> List[Dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


@dataclass(frozen=True)
class WorkbookContext:
    weights: Dict[int, float]
    answer_lookup: Dict[Tuple[int, str], str]      # (q_num, letter) → answer_id
    answer_bank: List[Dict[str, str]]
    pair_lookup: Dict[str, Dict[str, Any]]          # pair_key → row (numeric)
    zodiac_lookup: Dict[str, float]                 # z_key → z_norm
    numerology_lookup: Dict[str, float]             # n_key → n_norm
    questions: List[Dict[str, str]]
    archetype_matrix: Dict[str, Dict[str, float]]   # row → col → fit
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

    pair_lookup: Dict[str, Dict[str, Any]] = {}
    numeric_cols = [
        "behavioral_component", "stability_component", "chemistry_component",
        "pair_norm_0_1", "gate", "rule_penalty", "base_0_88",
        "archetype_fit", "comm_fit", "reg_fit", "love_fit",
        "readiness_fit", "shadow_fit", "integrity_fit", "cluster_fit",
        "pace_fit", "polarity_fit", "pursuit_fit", "forecast_fit",
        "risk_avg", "risk_max",
    ]
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
        weights=weights,
        answer_lookup=answer_lookup,
        answer_bank=answer_bank_rows,
        pair_lookup=pair_lookup,
        zodiac_lookup=zodiac_lookup,
        numerology_lookup=numerology_lookup,
        questions=question_rows,
        archetype_matrix=arch_matrix,
        shadow_matrix=shadow_mat,
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _pair_key(a: str, b: str) -> str:
    return f"{a}|{b}" if a <= b else f"{b}|{a}"


def _norm(val: float, divisor: float) -> float:
    return max(0.0, min(1.0, val / divisor))


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


# ── Archetype / Shadow inference from individual answers ──────────────────────

def get_archetype_from_answers(answers: Dict[int, str], ctx: WorkbookContext) -> Tuple[str, str]:
    scores: Dict[str, float] = {a: 0.0 for a in ARCHETYPES}
    for row in ctx.answer_bank:
        q = int(row["question_number_int"])
        letter = answers.get(q)
        if letter and row["answer_letter"] == letter:
            arch = row.get("archetype", "").strip()
            if arch in scores:
                w = float(row.get("question_weight_v3", 1.0))
                scores[arch] += w
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
    total = 0.0
    wt = 0.0
    for row in ctx.answer_bank:
        q = int(row["question_number_int"])
        if answers.get(q) == row["answer_letter"]:
            total += float(row.get("readiness_norm", 0.5)) * float(row.get("question_weight_v3", 1.0))
            wt += float(row.get("question_weight_v3", 1.0))
    raw = total / wt if wt > 0 else 0.5
    return round(max(0.0, min(100.0, raw * 100)), 1)


def readiness_forecast(score: float) -> str:
    if score >= 85: return "Strong outlook"
    if score >= 70: return "Stable outlook"
    if score >= 55: return "Mixed outlook"
    if score >= 40: return "Guarded outlook"
    return "Early signal only"


# ── Main compatibility engine ─────────────────────────────────────────────────

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
    """
    Compute compatibility between two users using the Genesis OS workbook engine.
    Returns score (350-850), tier, diagnostics, and top drivers.
    """
    ctx = load_seed_context()

    # Collect all question numbers that both users answered
    all_qs = sorted(ctx.weights.keys())
    answered_qs = [q for q in all_qs if q in user_a_answers and q in user_b_answers]

    if not answered_qs:
        return {
            "score": 350, "tier": DEFAULT_TIER_KEY, "tier_label": DEFAULT_TIER_LABEL,
            "tier_emoji": "🚩", "breakdown": {}, "archetype_score": 0, "shadow_score": 0,
            "archetype": "Unknown", "percentage": 0,
            "stability_avg": 0, "chemistry_avg": 0, "core_norm": 0,
            "zodiac_norm": 0, "numerology_norm": 0, "cosmic_overlay": 0,
            "readiness_a": 0, "readiness_b": 0,
        }

    wpn = wb = ws = wc = tw = 0.0
    per_question = []

    for q in answered_qs:
        a_letter = user_a_answers[q]
        b_letter = user_b_answers[q]
        key_a = (q, a_letter)
        key_b = (q, b_letter)

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
            "question_number": q,
            "weight": w,
            "pair_norm_0_1": round(pr["pair_norm_0_1"], 4),
        })

    if tw == 0:
        tw = 1.0

    core_norm = wpn / tw
    behavioral_avg = _norm(wb / tw, BEHAVIORAL_WEIGHT_TOTAL)
    stability_avg  = _norm(ws / tw, STABILITY_WEIGHT_TOTAL)
    chemistry_avg  = _norm(wc / tw, CHEMISTRY_WEIGHT_TOTAL)

    # Cosmic overlay — zodiac + numerology
    g_a, g_b = gender_a[0].upper(), gender_b[0].upper()
    z_a, z_b = zodiac_a.lower(), zodiac_b.lower()
    z_key = f"{g_a}|{g_b}|{z_a}|{z_b}"
    zodiac_norm = ctx.zodiac_lookup.get(z_key, ctx.zodiac_lookup.get(f"{g_b}|{g_a}|{z_b}|{z_a}", 0.5))

    n_key = f"{min(life_path_a, life_path_b)}|{max(life_path_a, life_path_b)}"
    numerology_norm = ctx.numerology_lookup.get(n_key, 0.5)

    cosmic_overlay = (0.07 * zodiac_norm) + (0.05 * numerology_norm)
    final_norm = max(0.0, min(1.0, core_norm + cosmic_overlay))
    score = round(350 + (500 * final_norm), 1)

    tier_key, tier_label, tier_emoji = _get_tier(score, stability_avg, chemistry_avg)

    # Archetype inference
    arch_a_primary, arch_a_secondary = get_archetype_from_answers(user_a_answers, ctx)
    arch_b_primary, _ = get_archetype_from_answers(user_b_answers, ctx)

    # Archetype fit from matrix
    arch_fit = 0.5
    a_lower = arch_a_primary.lower().replace(" ", "_")
    b_lower = arch_b_primary.lower().replace(" ", "_")
    for row_label, cols in ctx.archetype_matrix.items():
        if row_label.lower().replace(" ", "_") == a_lower:
            arch_fit = cols.get(b_lower, 0.5)
            break

    # Shadow inference
    shadow_a = get_shadow_from_answers(user_a_answers, ctx)
    shadow_b = get_shadow_from_answers(user_b_answers, ctx)

    # Shadow fit from matrix
    shadow_fit = 0.5
    sa_lower = shadow_a.lower().replace(" ", "_").replace("-", "_")
    sb_lower = shadow_b.lower().replace(" ", "_").replace("-", "_")
    for row_label, cols in ctx.shadow_matrix.items():
        if row_label.lower().replace(" ", "_").replace("-", "_") == sa_lower:
            shadow_fit = cols.get(sb_lower, 0.5)
            break

    # Readiness
    readiness_a = compute_readiness(user_a_answers, ctx)
    readiness_b = compute_readiness(user_b_answers, ctx)

    # Top drivers
    positive = sorted(per_question, key=lambda r: r["pair_norm_0_1"], reverse=True)[:5]
    friction = sorted(per_question, key=lambda r: r["pair_norm_0_1"])[:5]

    # ── Blueprint-canonical breakdown ────────────────────────────────────────
    # The pair_quantum CSV encodes the full score law:
    #   BehavioralComponent = 0.16*archetype_fit + 0.10*comm_fit + 0.10*reg_fit + 0.06*love_fit + 0.10*readiness_fit
    #   StabilityComponent = 0.09*shadow_fit + 0.07*integrity_fit + 0.04*cluster_fit + 0.03*pace_fit
    #   ChemistryComponent = 0.08*polarity_fit + 0.05*pursuit_fit
    #   base_0_88 = Behavioral + Stability + Chemistry
    #   gate = 1 - (0.55*risk_avg + 0.20*risk_max)
    #   pair_norm_0_1 = clamp((base_0_88 * gate) - rule_penalty, 0, 1)
    #
    # We expose the NORMALIZED diagnostics (divided by weight totals → 0-1 range):
    breakdown = {
        "BehavioralComponent": round(behavioral_avg * 100),   # normalized /0.52
        "StabilityComponent": round(stability_avg * 100),     # normalized /0.23
        "ChemistryComponent": round(chemistry_avg * 100),     # normalized /0.13
        "CosmicOverlay": round(cosmic_overlay * 100, 1),      # zodiac 7% + numerology 5%
        "ArchetypeFit": round(arch_fit * 100),
        "ShadowFit": round(shadow_fit * 100),
        "ZodiacAlignment": round(zodiac_norm * 100),
        "NumerologyAlignment": round(numerology_norm * 100),
    }

    return {
        "score": score,
        "tier": tier_key,
        "tier_label": tier_label,
        "tier_emoji": tier_emoji,
        "breakdown": breakdown,
        "archetype_score": round(arch_fit * 100),
        "shadow_score": round(shadow_fit * 100),
        "archetype": arch_a_primary,
        "archetype_secondary": arch_a_secondary,
        "shadow_pattern": shadow_a,
        "shadow_pattern_b": shadow_b,
        "percentage": round((score - 350) / 500 * 100),
        "final_norm": round(final_norm, 6),
        "core_norm": round(core_norm, 6),
        "stability_avg": round(stability_avg, 6),
        "chemistry_avg": round(chemistry_avg, 6),
        "behavioral_avg": round(behavioral_avg, 6),
        "zodiac_norm": round(zodiac_norm, 6),
        "numerology_norm": round(numerology_norm, 6),
        "cosmic_overlay": round(cosmic_overlay, 6),
        "readiness_a": readiness_a,
        "readiness_b": readiness_b,
        "readiness_forecast_a": readiness_forecast(readiness_a),
        "readiness_forecast_b": readiness_forecast(readiness_b),
        "top_positive_drivers": positive,
        "top_friction_drivers": friction,
        "scoring_version": "phase1.v1",
    }


def compute_archetype(archetype_score: float, shadow_score: float) -> str:
    """Legacy archetype label — kept for backward compatibility."""
    if archetype_score >= 70 and shadow_score >= 70:
        return "The Transformer"
    if archetype_score >= 70:
        return "The Visionary"
    if shadow_score >= 70:
        return "The Catalyst"
    return "The Seeker"
