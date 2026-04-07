#!/usr/bin/env python3
"""
Phase 1 deterministic compatibility engine for Genesis OS.

This engine reads exported workbook seed data and computes:
- CompatibilityScore (350-850)
- FinalNorm / CoreNorm
- StabilityAvg / ChemistryAvg diagnostics
- ZodiacNorm / NumerologyNorm
- Tier
- Top positive and friction drivers

Important implementation note:
AnswerPairQuantum stores weighted component contributions
(behavioral_component, stability_component, chemistry_component)
because those fields feed score law directly. The Phase 1 docs,
however, require StabilityAvg and ChemistryAvg as 0-1 diagnostics
and use those diagnostics in tier logic. To keep score law exact
while making diagnostics operational, this engine computes:

behavioral_avg = weighted_avg(behavioral_component) / 0.52
stability_avg  = weighted_avg(stability_component)  / 0.23
chemistry_avg  = weighted_avg(chemistry_component)  / 0.13

This preserves CompatibilityScore exactly, while surfacing diagnostics
on the documented 0-1 scale.
"""
from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple, Any

BEHAVIORAL_WEIGHT_TOTAL = 0.52
STABILITY_WEIGHT_TOTAL = 0.23
CHEMISTRY_WEIGHT_TOTAL = 0.13

TIER_RULES = [
    ("Soul-aligned match", lambda score, stability, chemistry: score >= 760 and stability >= 0.74 and chemistry >= 0.58),
    ("Strong potential", lambda score, stability, chemistry: score >= 700 and stability >= 0.62),
    ("Healthy but growing", lambda score, stability, chemistry: score >= 650 and stability >= 0.58),
    ("Magnetic but risky", lambda score, stability, chemistry: score >= 640 and stability < 0.58 and chemistry >= 0.72),
    ("Possible but unstable", lambda score, stability, chemistry: score >= 560 and stability >= 0.40),
]
DEFAULT_TIER = "Red flag zone"

@dataclass(frozen=True)
class WorkbookContext:
    weights: Dict[int, float]
    answer_lookup: Dict[Tuple[int, str], str]
    pair_lookup: Dict[str, Dict[str, Any]]
    zodiac_lookup: Dict[str, float]
    numerology_lookup: Dict[str, float]

def _read_csv(path: Path) -> List[Dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))

def load_seed_context(seed_dir: str | Path) -> WorkbookContext:
    seed_dir = Path(seed_dir)
    answer_bank_rows = _read_csv(seed_dir / "csv" / "answer_bank.csv")
    pair_rows = _read_csv(seed_dir / "csv" / "answer_pair_quantum.csv")
    zodiac_rows = _read_csv(seed_dir / "csv" / "zodiac_lookup.csv")
    numerology_rows = _read_csv(seed_dir / "csv" / "numerology_lookup.csv")

    weights: Dict[int, float] = {}
    answer_lookup: Dict[Tuple[int, str], str] = {}
    for row in answer_bank_rows:
        q = int(row["question_number_int"])
        weights.setdefault(q, float(row["question_weight_v3"]))
        answer_lookup[(q, row["answer_letter"])] = row["answer_id"]

    pair_lookup: Dict[str, Dict[str, Any]] = {}
    for row in pair_rows:
        # cast numeric columns once
        casted = dict(row)
        for k in [
            "q_a","q_b","archetype_fit","comm_fit","reg_fit","love_fit","readiness_fit","shadow_fit",
            "integrity_fit","cluster_fit","pace_fit","polarity_fit","pursuit_fit","forecast_fit",
            "risk_avg","risk_max","gate","rule_penalty","behavioral_component","stability_component",
            "chemistry_component","base_0_88","pair_norm_0_1"
        ]:
            casted[k] = float(row[k]) if row[k] != "" else 0.0
        pair_lookup[row["pair_key"]] = casted

    zodiac_lookup = {row["z_key"]: float(row["z_norm"]) for row in zodiac_rows}
    numerology_lookup = {row["n_key"]: float(row["n_norm"]) for row in numerology_rows}

    return WorkbookContext(
        weights=weights,
        answer_lookup=answer_lookup,
        pair_lookup=pair_lookup,
        zodiac_lookup=zodiac_lookup,
        numerology_lookup=numerology_lookup,
    )

def _pair_key(answer_id_a: str, answer_id_b: str) -> str:
    return f"{answer_id_a}|{answer_id_b}" if answer_id_a <= answer_id_b else f"{answer_id_b}|{answer_id_a}"

def _normalized_avg(raw_component_avg: float, divisor: float) -> float:
    if divisor <= 0:
        raise ValueError("divisor must be positive")
    return max(0.0, min(1.0, raw_component_avg / divisor))

def _tier_for(score: float, stability_avg: float, chemistry_avg: float) -> str:
    for tier_name, predicate in TIER_RULES:
        if predicate(score, stability_avg, chemistry_avg):
            return tier_name
    return DEFAULT_TIER

def compute_match(
    ctx: WorkbookContext,
    *,
    user_a_answers: Dict[int, str],
    user_b_answers: Dict[int, str],
    gender_a: str,
    gender_b: str,
    zodiac_a: str,
    zodiac_b: str,
    life_path_a: int,
    life_path_b: int,
    top_n_drivers: int = 5,
) -> Dict[str, Any]:
    missing_q = [q for q in sorted(ctx.weights) if q not in user_a_answers or q not in user_b_answers]
    if missing_q:
        raise ValueError(f"missing answer letters for questions: {missing_q[:10]}")

    weighted_pair_norm_sum = 0.0
    weighted_behavioral_sum = 0.0
    weighted_stability_sum = 0.0
    weighted_chemistry_sum = 0.0
    total_weight = 0.0
    per_question: List[Dict[str, Any]] = []

    for q in sorted(ctx.weights):
        a_letter = user_a_answers[q]
        b_letter = user_b_answers[q]
        answer_id_a = ctx.answer_lookup[(q, a_letter)]
        answer_id_b = ctx.answer_lookup[(q, b_letter)]
        pair_key = _pair_key(answer_id_a, answer_id_b)
        pair_row = ctx.pair_lookup[pair_key]
        weight = ctx.weights[q]

        weighted_pair_norm_sum += weight * pair_row["pair_norm_0_1"]
        weighted_behavioral_sum += weight * pair_row["behavioral_component"]
        weighted_stability_sum += weight * pair_row["stability_component"]
        weighted_chemistry_sum += weight * pair_row["chemistry_component"]
        total_weight += weight

        per_question.append({
            "question_number": q,
            "weight": weight,
            "a_letter": a_letter,
            "b_letter": b_letter,
            "a_answer_id": answer_id_a,
            "b_answer_id": answer_id_b,
            "pair_key": pair_key,
            "pair_norm_0_1": round(pair_row["pair_norm_0_1"], 12),
            "behavioral_component": round(pair_row["behavioral_component"], 12),
            "stability_component": round(pair_row["stability_component"], 12),
            "chemistry_component": round(pair_row["chemistry_component"], 12),
            "gate": round(pair_row["gate"], 12),
            "rule_penalty": round(pair_row["rule_penalty"], 12),
        })

    core_norm = weighted_pair_norm_sum / total_weight
    behavioral_component_avg = weighted_behavioral_sum / total_weight
    stability_component_avg = weighted_stability_sum / total_weight
    chemistry_component_avg = weighted_chemistry_sum / total_weight

    behavioral_avg = _normalized_avg(behavioral_component_avg, BEHAVIORAL_WEIGHT_TOTAL)
    stability_avg = _normalized_avg(stability_component_avg, STABILITY_WEIGHT_TOTAL)
    chemistry_avg = _normalized_avg(chemistry_component_avg, CHEMISTRY_WEIGHT_TOTAL)

    zodiac_key = f"{gender_a}|{gender_b}|{zodiac_a.lower()}|{zodiac_b.lower()}"
    numerology_key = f"{min(life_path_a, life_path_b)}|{max(life_path_a, life_path_b)}"

    zodiac_norm = ctx.zodiac_lookup[zodiac_key]
    numerology_norm = ctx.numerology_lookup[numerology_key]
    cosmic_overlay = (0.07 * zodiac_norm) + (0.05 * numerology_norm)

    final_norm = max(0.0, min(1.0, core_norm + cosmic_overlay))
    compatibility_score = 350 + (500 * final_norm)
    tier = _tier_for(compatibility_score, stability_avg, chemistry_avg)

    sorted_positive = sorted(per_question, key=lambda r: (r["pair_norm_0_1"], r["weight"]), reverse=True)
    sorted_friction = sorted(per_question, key=lambda r: (r["pair_norm_0_1"], -r["weight"]))

    return {
        "compatibility_score": round(compatibility_score, 6),
        "final_norm": round(final_norm, 12),
        "core_norm": round(core_norm, 12),
        "behavioral_component_avg_raw": round(behavioral_component_avg, 12),
        "stability_component_avg_raw": round(stability_component_avg, 12),
        "chemistry_component_avg_raw": round(chemistry_component_avg, 12),
        "behavioral_avg": round(behavioral_avg, 12),
        "stability_avg": round(stability_avg, 12),
        "chemistry_avg": round(chemistry_avg, 12),
        "zodiac_norm": round(zodiac_norm, 12),
        "numerology_norm": round(numerology_norm, 12),
        "cosmic_overlay": round(cosmic_overlay, 12),
        "tier": tier,
        "question_count": len(per_question),
        "question_weight_total": round(total_weight, 12),
        "top_positive_drivers": sorted_positive[:top_n_drivers],
        "top_friction_drivers": sorted_friction[:top_n_drivers],
        "per_question": per_question,
    }

def main() -> None:
    parser = argparse.ArgumentParser(description="Compute a deterministic Phase 1 compatibility score from exported workbook seeds.")
    parser.add_argument("--seed-dir", required=True, help="Directory containing seed_exports/csv files.")
    parser.add_argument("--input-json", required=True, help="Path to a JSON file with user A/B answer letters and identity fields.")
    parser.add_argument("--output-json", help="Optional path to write the computed output JSON.")
    args = parser.parse_args()

    with open(args.input_json, "r", encoding="utf-8") as f:
        raw_payload = json.load(f)
    payload = raw_payload.get("input", raw_payload)

    ctx = load_seed_context(args.seed_dir)
    result = compute_match(
        ctx,
        user_a_answers={int(k): v for k, v in payload["user_a_answers"].items()},
        user_b_answers={int(k): v for k, v in payload["user_b_answers"].items()},
        gender_a=payload["gender_a"],
        gender_b=payload["gender_b"],
        zodiac_a=payload["zodiac_a"],
        zodiac_b=payload["zodiac_b"],
        life_path_a=int(payload["life_path_a"]),
        life_path_b=int(payload["life_path_b"]),
    )

    output = {"input": payload, "result": result}
    if args.output_json:
        with open(args.output_json, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2)
    else:
        print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
