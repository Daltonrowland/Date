"""
Master import runner — loads all workbook seed CSV data into database catalog tables.

Run: cd backend && python -m scripts.run_all_imports
Or via API: POST /admin/run-imports?token=rs-admin-seed-2026
"""
import csv
from pathlib import Path
from datetime import datetime
from sqlalchemy import text

SEED_DIR = Path(__file__).parent.parent / "app" / "seed_data" / "csv"


def _read_csv(filename):
    path = SEED_DIR / filename
    if not path.exists():
        print(f"  SKIP: {filename} not found")
        return []
    with path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def _safe_float(val, default=0.0):
    try:
        return float(val) if val and val.strip() else default
    except (ValueError, TypeError):
        return default


def import_all(db_session):
    """Import all seed data into catalog tables. Returns summary."""
    results = {}

    # ── 1. Answer Bank (310 rows) ────────────────────────────────────────
    print("Importing AnswerBank...")
    db_session.execute(text("DELETE FROM answer_catalog"))
    rows = _read_csv("answer_bank.csv")
    for row in rows:
        db_session.execute(text("""
            INSERT INTO answer_catalog (answer_id, qa_key, question_number_int, phase,
                question_weight_v3, dimension_primary, dimension_secondary, answer_letter,
                answer_text, archetype, shadow_type, comm_health_norm, reg_health_norm,
                love_relational_norm, readiness_norm, pacing_norm, attachment_risk_norm,
                centered_polarity_norm, reciprocity_signal_norm, integrity_penalty_norm,
                cluster_penalty_norm, pattern_risk_norm, forecast_norm, pos_agg, chem_agg,
                risk_agg, risk_band, pos_band, chem_band, access_style_label_v8,
                conflict_style_label_v8, repair_style_label_v8, attachment_style_label_v8,
                nervous_system_bias_label_v8, selection_gap_flag_v8)
            VALUES (:aid, :qa, :qn, :ph, :qw, :dp, :ds, :al, :at, :ar, :st,
                :ch, :rh, :lr, :rn, :pn, :arn, :cpn, :rsn, :ipn, :cpn2, :prn, :fn,
                :pa, :ca, :ra, :rb, :pb, :cb, :asl, :csl, :rsl, :asl2, :nsb, :sgf)
        """), {
            "aid": row.get("answer_id", ""),
            "qa": row.get("qa_key", ""),
            "qn": int(row.get("question_number_int", 0)),
            "ph": row.get("phase", ""),
            "qw": _safe_float(row.get("question_weight_v3")),
            "dp": row.get("dimension_primary", ""),
            "ds": row.get("dimension_secondary", ""),
            "al": row.get("answer_letter", ""),
            "at": row.get("answer_text", ""),
            "ar": row.get("archetype", ""),
            "st": row.get("shadow_type", ""),
            "ch": _safe_float(row.get("comm_health_norm")),
            "rh": _safe_float(row.get("reg_health_norm")),
            "lr": _safe_float(row.get("love_relational_norm")),
            "rn": _safe_float(row.get("readiness_norm")),
            "pn": _safe_float(row.get("pacing_norm")),
            "arn": _safe_float(row.get("attachment_risk_norm")),
            "cpn": _safe_float(row.get("centered_polarity_norm")),
            "rsn": _safe_float(row.get("reciprocity_signal_norm")),
            "ipn": _safe_float(row.get("integrity_penalty_norm")),
            "cpn2": _safe_float(row.get("cluster_penalty_norm")),
            "prn": _safe_float(row.get("pattern_risk_norm")),
            "fn": _safe_float(row.get("forecast_norm")),
            "pa": _safe_float(row.get("pos_agg")),
            "ca": _safe_float(row.get("chem_agg")),
            "ra": _safe_float(row.get("risk_agg")),
            "rb": row.get("risk_band", ""),
            "pb": row.get("pos_band", ""),
            "cb": row.get("chem_band", ""),
            "asl": row.get("access_style_label_v8", ""),
            "csl": row.get("conflict_style_label_v8", ""),
            "rsl": row.get("repair_style_label_v8", ""),
            "asl2": row.get("attachment_style_label_v8", ""),
            "nsb": row.get("nervous_system_bias_label_v8", ""),
            "sgf": row.get("selection_gap_flag_v8", ""),
        })
    db_session.commit()
    results["answer_catalog"] = len(rows)
    print(f"  ✅ {len(rows)} answers imported")

    # ── 2. Archetype Matrix (10x10 = 100 values) ────────────────────────
    print("Importing ArchetypeMatrix...")
    db_session.execute(text("DELETE FROM archetype_matrix_catalog"))
    rows = _read_csv("archetype_matrix.csv")
    count = 0
    for row in rows:
        label = row.get("row_label", "")
        for col, val in row.items():
            if col == "row_label":
                continue
            db_session.execute(text(
                "INSERT INTO archetype_matrix_catalog (archetype_a, archetype_b, fit_value) VALUES (:a, :b, :v)"
            ), {"a": label, "b": col, "v": _safe_float(val, 0.5)})
            count += 1
    db_session.commit()
    results["archetype_matrix"] = count
    print(f"  ✅ {count} archetype pairs imported")

    # ── 3. Shadow Matrix (6x6 = 36 values) ──────────────────────────────
    print("Importing ShadowMatrix...")
    db_session.execute(text("DELETE FROM shadow_matrix_catalog"))
    rows = _read_csv("shadow_matrix.csv")
    count = 0
    for row in rows:
        label = row.get("row_label", "")
        for col, val in row.items():
            if col == "row_label":
                continue
            db_session.execute(text(
                "INSERT INTO shadow_matrix_catalog (shadow_a, shadow_b, stability_value) VALUES (:a, :b, :v)"
            ), {"a": label, "b": col, "v": _safe_float(val, 0.5)})
            count += 1
    db_session.commit()
    results["shadow_matrix"] = count
    print(f"  ✅ {count} shadow pairs imported")

    # ── 4. Zodiac Lookup (577 rows) ──────────────────────────────────────
    print("Importing ZodiacLookup...")
    db_session.execute(text("DELETE FROM zodiac_lookup_catalog"))
    rows = _read_csv("zodiac_lookup.csv")
    for row in rows:
        db_session.execute(text(
            "INSERT INTO zodiac_lookup_catalog (z_key, gender_a, gender_b, sun_sign_a, sun_sign_b, zodiac_norm) VALUES (:zk, :ga, :gb, :sa, :sb, :zn)"
        ), {
            "zk": row.get("z_key", ""),
            "ga": row.get("gender_a", ""),
            "gb": row.get("gender_b", ""),
            "sa": row.get("sun_sign_1", row.get("sun_sign_a", "")),
            "sb": row.get("sun_sign_2", row.get("sun_sign_b", "")),
            "zn": _safe_float(row.get("z_norm", row.get("zodiac_norm"))),
        })
    db_session.commit()
    results["zodiac_lookup"] = len(rows)
    print(f"  ✅ {len(rows)} zodiac rows imported")

    # ── 5. Numerology Lookup (67 rows) ───────────────────────────────────
    print("Importing NumerologyLookup...")
    db_session.execute(text("DELETE FROM numerology_lookup_catalog"))
    rows = _read_csv("numerology_lookup.csv")
    for row in rows:
        db_session.execute(text(
            "INSERT INTO numerology_lookup_catalog (n_key, life_path_a, life_path_b, numerology_norm) VALUES (:nk, :la, :lb, :nn)"
        ), {
            "nk": row.get("n_key", ""),
            "la": int(row.get("lp_a", 0)),
            "lb": int(row.get("lp_b", 0)),
            "nn": _safe_float(row.get("n_norm", row.get("numerology_norm"))),
        })
    db_session.commit()
    results["numerology_lookup"] = len(rows)
    print(f"  ✅ {len(rows)} numerology rows imported")

    # ── 6. Questions (60 core + polarity) ────────────────────────────────
    print("Importing Questions...")
    db_session.execute(text("DELETE FROM question_catalog"))
    rows = _read_csv("questions.csv")
    for row in rows:
        db_session.execute(text(
            "INSERT INTO question_catalog (question_number, question_id, family, phase, dimension_primary, dimension_secondary, question_weight, answer_count, available_letters) VALUES (:qn, :qi, :f, :p, :dp, :ds, :qw, :ac, :al)"
        ), {
            "qn": int(row.get("question_number_int", 0)),
            "qi": row.get("question_id", ""),
            "f": "core" if int(row.get("question_number_int", 0)) < 100 else "shadow",
            "p": row.get("phase", ""),
            "dp": row.get("dimension_primary", ""),
            "ds": row.get("dimension_secondary", ""),
            "qw": _safe_float(row.get("question_weight_v3")),
            "ac": int(row.get("answer_count", 5)),
            "al": row.get("available_letters", "ABCDE"),
        })
    db_session.commit()
    results["questions"] = len(rows)
    print(f"  ✅ {len(rows)} questions imported")

    # ── 7. Pair Quantum (48,205 rows — batch insert) ────────────────────
    print("Importing PairQuantum (48,205 rows — this may take a moment)...")
    db_session.execute(text("DELETE FROM pair_quantum_catalog"))
    db_session.commit()

    rows = _read_csv("answer_pair_quantum.csv")
    batch = []
    BATCH_SIZE = 500
    inserted = 0

    for row in rows:
        batch.append({
            "pk": row.get("pair_key", ""),
            "aa": row.get("ans_a_id", ""),
            "ab": row.get("ans_b_id", ""),
            "af": _safe_float(row.get("archetype_fit")),
            "cf": _safe_float(row.get("comm_fit")),
            "rf": _safe_float(row.get("reg_fit")),
            "lf": _safe_float(row.get("love_fit")),
            "rdf": _safe_float(row.get("readiness_fit")),
            "sf": _safe_float(row.get("shadow_fit")),
            "if_": _safe_float(row.get("integrity_fit")),
            "clf": _safe_float(row.get("cluster_fit")),
            "pf": _safe_float(row.get("pace_fit")),
            "plf": _safe_float(row.get("polarity_fit")),
            "puf": _safe_float(row.get("pursuit_fit")),
            "ff": _safe_float(row.get("forecast_fit")),
            "ra": _safe_float(row.get("risk_avg")),
            "rm": _safe_float(row.get("risk_max")),
            "g": _safe_float(row.get("gate")),
            "rp": _safe_float(row.get("rule_penalty")),
            "bc": _safe_float(row.get("behavioral_component")),
            "sc": _safe_float(row.get("stability_component")),
            "cc": _safe_float(row.get("chemistry_component")),
            "b88": _safe_float(row.get("base_0_88")),
            "pn": _safe_float(row.get("pair_norm_0_1")),
        })

        if len(batch) >= BATCH_SIZE:
            for b in batch:
                db_session.execute(text("""
                    INSERT INTO pair_quantum_catalog (pair_key, ans_a_id, ans_b_id,
                        archetype_fit, comm_fit, reg_fit, love_fit, readiness_fit,
                        shadow_fit, integrity_fit, cluster_fit, pace_fit, polarity_fit,
                        pursuit_fit, forecast_fit, risk_avg, risk_max, gate, rule_penalty,
                        behavioral_component, stability_component, chemistry_component,
                        base_0_88, pair_norm_0_1)
                    VALUES (:pk, :aa, :ab, :af, :cf, :rf, :lf, :rdf, :sf, :if_, :clf,
                        :pf, :plf, :puf, :ff, :ra, :rm, :g, :rp, :bc, :sc, :cc, :b88, :pn)
                """), b)
            db_session.commit()
            inserted += len(batch)
            if inserted % 5000 == 0:
                print(f"    ...{inserted}/{len(rows)} rows")
            batch = []

    # Flush remaining
    for b in batch:
        db_session.execute(text("""
            INSERT INTO pair_quantum_catalog (pair_key, ans_a_id, ans_b_id,
                archetype_fit, comm_fit, reg_fit, love_fit, readiness_fit,
                shadow_fit, integrity_fit, cluster_fit, pace_fit, polarity_fit,
                pursuit_fit, forecast_fit, risk_avg, risk_max, gate, rule_penalty,
                behavioral_component, stability_component, chemistry_component,
                base_0_88, pair_norm_0_1)
            VALUES (:pk, :aa, :ab, :af, :cf, :rf, :lf, :rdf, :sf, :if_, :clf,
                :pf, :plf, :puf, :ff, :ra, :rm, :g, :rp, :bc, :sc, :cc, :b88, :pn)
        """), b)
    db_session.commit()
    inserted += len(batch)
    results["pair_quantum"] = inserted
    print(f"  ✅ {inserted} pair quantum rows imported")

    # ── 8. Log import version ────────────────────────────────────────────
    for table, count in results.items():
        db_session.execute(text(
            "INSERT INTO workbook_import_versions (workbook_version, sheet_name, data_rows, imported_at) VALUES (:wv, :sn, :dr, :ia)"
        ), {"wv": "v10_polarity", "sn": table, "dr": count, "ia": datetime.utcnow()})
    db_session.commit()

    print(f"\n{'='*50}")
    print("IMPORT COMPLETE")
    for k, v in results.items():
        print(f"  {k}: {v} rows")
    print(f"{'='*50}")

    return results


if __name__ == "__main__":
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        import_all(db)
    finally:
        db.close()
