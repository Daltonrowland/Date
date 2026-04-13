"""
Import v12-specific data: question weights, shadow priors, polarity axes config,
polarity block structure, and record the v12 import version.

Run: cd backend && python -m scripts.import_v12_data
Or via API: POST /admin/import-v12?token=rs-admin-seed-2026
"""
from datetime import datetime
from sqlalchemy import text
import json


# ── v12 Question Weights ─────────────────────────────────────────────────────
V12_QUESTION_WEIGHTS = {
    # Q1-Q8: CommunicationHealth/EmotionalNeeds — weight 1.0
    **{i: 1.0 for i in range(1, 9)},
    # Q9-Q16: ConflictRepair/CommunicationHealth — weight 1.05
    **{i: 1.05 for i in range(9, 17)},
    # Q17-Q24: EmotionalRegulation/AttachmentSafety — weight 1.1
    **{i: 1.1 for i in range(17, 25)},
    # Q25-Q26: ValuesLifestyle/IntentAlignment — weight 1.1
    25: 1.1, 26: 1.1,
    # Q27-Q28: ValuesLifestyle/IntentAlignment — weight 1.15
    27: 1.15, 28: 1.15,
    # Q29-Q32: CommitmentPace — weight 1.15
    **{i: 1.15 for i in range(29, 33)},
    # Q33-Q40: CommitmentPace — weight 1.2
    **{i: 1.2 for i in range(33, 41)},
    # Q41-Q50: EmotionalNeeds — weight 1.25
    **{i: 1.25 for i in range(41, 51)},
    # Q100-Q109: Shadow questions — weight 1.3
    **{i: 1.3 for i in range(100, 110)},
}


# ── v12 Shadow Priors ────────────────────────────────────────────────────────
V12_SHADOW_PRIORS = {
    "None/Light": 0.05,
    "Regulated Grown-Up": 0.05,  # alias for None/Light
    "Self-Saboteur": 0.35,
    "Scorekeeper": 0.45,
    "Stonewaller": 0.50,
    "Chameleon": 0.55,
    "Love Bomber": 0.60,
    "Manipulator": 0.70,
}


# ── v12 Polarity Axes Config ─────────────────────────────────────────────────
V12_POLARITY_AXES = [
    {"axis_key": "initiation_axis",              "fit_function": "complement", "role_weight": 0.18, "attraction_weight": 0.0,  "balance_target": None},
    {"axis_key": "pursuit_axis",                 "fit_function": "complement", "role_weight": 0.14, "attraction_weight": 0.12, "balance_target": None},
    {"axis_key": "leadership_axis",              "fit_function": "complement", "role_weight": 0.12, "attraction_weight": 0.0,  "balance_target": None},
    {"axis_key": "surrender_safety_axis",        "fit_function": "similarity", "role_weight": 0.12, "attraction_weight": 0.28, "balance_target": None},
    {"axis_key": "calm_receptivity_axis",        "fit_function": "similarity", "role_weight": 0.12, "attraction_weight": 0.22, "balance_target": None},
    {"axis_key": "tension_attraction_axis",      "fit_function": "balance",    "role_weight": 0.10, "attraction_weight": 0.16, "balance_target": 0.45},
    {"axis_key": "structure_preference_axis",    "fit_function": "similarity", "role_weight": 0.08, "attraction_weight": 0.0,  "balance_target": None},
    {"axis_key": "flexibility_axis",             "fit_function": "similarity", "role_weight": 0.06, "attraction_weight": 0.0,  "balance_target": None},
    {"axis_key": "validation_dependency_axis",   "fit_function": "balance",    "role_weight": 0.04, "attraction_weight": 0.0,  "balance_target": 0.40},
    {"axis_key": "erotic_safety_alignment_axis", "fit_function": "similarity", "role_weight": 0.04, "attraction_weight": 0.22, "balance_target": None},
]


# ── v12 Polarity Block Structure ─────────────────────────────────────────────
V12_POLARITY_BLOCKS = {
    # Block 1: P01-P08
    **{f"P{i:02d}": {"block_id": 1, "block_multiplier": 1.0, "question_weight": 1.0} for i in range(1, 9)},
    # Block 2: P09-P16
    **{f"P{i:02d}": {"block_id": 2, "block_multiplier": 1.1, "question_weight": 1.1} for i in range(9, 17)},
    # Block 3: P17-P24
    **{f"P{i:02d}": {"block_id": 3, "block_multiplier": 1.15, "question_weight": 1.15} for i in range(17, 25)},
    # Block 4: P25-P32
    **{f"P{i:02d}": {"block_id": 4, "block_multiplier": 1.2, "question_weight": 1.2} for i in range(25, 33)},
}
# Specific overrides for block 3 and 4
V12_POLARITY_BLOCKS["P19"] = {"block_id": 3, "block_multiplier": 1.15, "question_weight": 1.21}
V12_POLARITY_BLOCKS["P22"] = {"block_id": 3, "block_multiplier": 1.15, "question_weight": 1.21}
V12_POLARITY_BLOCKS["P29"] = {"block_id": 4, "block_multiplier": 1.2, "question_weight": 1.26}
V12_POLARITY_BLOCKS["P32"] = {"block_id": 4, "block_multiplier": 1.2, "question_weight": 1.26}


# ── v12 Tier Labels ──────────────────────────────────────────────────────────
V12_TIER_LABELS = [
    (350, 500, "bad_match",      "Bad match"),
    (501, 600, "poor_unstable",  "Poor / unstable"),
    (601, 700, "medium_workable","Medium / workable"),
    (701, 750, "good_match",    "Good match"),
    (751, 850, "excellent_match","Excellent match"),
]


def import_v12(db_session):
    """Import all v12-specific data into the database."""
    results = {}

    # ── 1. Update question weights ────────────────────────────────────────
    print("Updating v12 question weights...")
    updated = 0
    for q_num, weight in V12_QUESTION_WEIGHTS.items():
        result = db_session.execute(text(
            "UPDATE question_catalog SET question_weight = :w WHERE question_number = :qn"
        ), {"w": weight, "qn": q_num})
        if result.rowcount > 0:
            updated += 1
    # Also update answer_bank weights
    for q_num, weight in V12_QUESTION_WEIGHTS.items():
        db_session.execute(text(
            "UPDATE answer_catalog SET question_weight_v3 = :w WHERE question_number_int = :qn"
        ), {"w": weight, "qn": q_num})
    db_session.commit()
    results["question_weights_updated"] = updated
    print(f"  ✅ {updated} question weights updated")

    # ── 2. Import shadow priors ───────────────────────────────────────────
    print("Importing v12 shadow priors...")
    db_session.execute(text("DELETE FROM shadow_priors"))
    for shadow, severity in V12_SHADOW_PRIORS.items():
        db_session.execute(text(
            "INSERT INTO shadow_priors (shadow_type, severity_prior) VALUES (:st, :sp)"
        ), {"st": shadow, "sp": severity})
    db_session.commit()
    results["shadow_priors"] = len(V12_SHADOW_PRIORS)
    print(f"  ✅ {len(V12_SHADOW_PRIORS)} shadow priors imported")

    # ── 3. Import polarity axes config ────────────────────────────────────
    print("Importing v12 polarity axes config...")
    db_session.execute(text("DELETE FROM polarity_axes_config"))
    for axis in V12_POLARITY_AXES:
        db_session.execute(text("""
            INSERT INTO polarity_axes_config (axis_key, fit_function, role_weight, attraction_weight, balance_target)
            VALUES (:ak, :ff, :rw, :aw, :bt)
        """), {
            "ak": axis["axis_key"], "ff": axis["fit_function"],
            "rw": axis["role_weight"], "aw": axis["attraction_weight"],
            "bt": axis["balance_target"],
        })
    db_session.commit()
    results["polarity_axes"] = len(V12_POLARITY_AXES)
    print(f"  ✅ {len(V12_POLARITY_AXES)} polarity axes imported")

    # ── 4. Record v12 import version ──────────────────────────────────────
    print("Recording v12 import version...")
    # Set all previous to inactive
    db_session.execute(text("UPDATE workbook_import_versions SET active = false WHERE active = true"))
    db_session.execute(text("""
        INSERT INTO workbook_import_versions (workbook_version, sheet_name, data_rows, imported_at, active, source_name, scoring_version_tag)
        VALUES (:wv, :sn, :dr, :ia, true, :src, :sv)
    """), {
        "wv": "v12",
        "sn": "full_v12_import",
        "dr": sum(results.values()),
        "ia": datetime.utcnow(),
        "src": "relationship_scores_genesis_scientific_workbook_v12",
        "sv": "v12",
    })
    db_session.commit()
    results["import_version"] = "v12"
    print(f"  ✅ v12 recorded as active scoring version")

    print(f"\n{'='*50}")
    print("V12 IMPORT COMPLETE")
    for k, v in results.items():
        print(f"  {k}: {v}")
    return results


if __name__ == "__main__":
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        import_v12(db)
    finally:
        db.close()
