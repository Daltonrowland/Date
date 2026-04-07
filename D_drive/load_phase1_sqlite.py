#!/usr/bin/env python3
"""
Load exported Phase 1 workbook seed files into SQLite.

This is a working local loader for validation and parity testing.
It does not replace a production PostgreSQL loader, but it gives
Claude Code and human developers a deterministic local truth source.
"""
from __future__ import annotations

import argparse
import csv
import json
import sqlite3
from pathlib import Path
from typing import Dict, Iterable, List

TABLE_FILE_MAP = {
    "questions": "questions.csv",
    "answer_bank": "answer_bank.csv",
    "answer_pair_quantum": "answer_pair_quantum.csv",
    "archetype_matrix": "archetype_matrix.csv",
    "shadow_matrix": "shadow_matrix.csv",
    "zodiac_lookup": "zodiac_lookup.csv",
    "numerology_lookup": "numerology_lookup.csv",
    "schema_weights": "schema_weights.csv",
    "feedback_data_fields": "feedback_data_fields.csv",
    "polarity_axes_v10": "polarity_axes_v10.csv",
    "polarity_role_seeds_v10": "polarity_role_seeds_v10.csv",
    "polarity_question_map_v10": "polarity_question_map_v10.csv",
    "polarity_answer_bank_v10": "polarity_answer_bank_v10.csv",
    "rewrite_rules_v10": "rewrite_rules_v10.csv",
}

def load_csv(path: Path) -> List[Dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))

def insert_rows(conn: sqlite3.Connection, table: str, rows: List[Dict[str, str]]) -> None:
    if not rows:
        return
    cols = list(rows[0].keys())
    placeholders = ",".join(["?"] * len(cols))
    quoted_cols = ",".join([f'"{c}"' for c in cols])
    sql = f'INSERT OR REPLACE INTO "{table}" ({quoted_cols}) VALUES ({placeholders})'
    conn.executemany(sql, [[row.get(c) for c in cols] for row in rows])

def load_pair_engine(conn: sqlite3.Connection, pair_engine_json_path: Path) -> None:
    payload = json.loads(pair_engine_json_path.read_text(encoding="utf-8"))
    rows = []
    for axis in payload["axes"]:
        rows.append({
            "dimension": axis["dimension"],
            "fit_formula_type": axis["fit_formula_type"],
            "fit_formula_excel": axis["fit_formula_excel"],
            "example_user_a_value": axis["user_a_example_value"],
            "example_user_b_value": axis["user_b_example_value"],
        })
    insert_rows(conn, "polarity_pair_engine_v10", rows)

def main() -> None:
    parser = argparse.ArgumentParser(description="Load Genesis OS Phase 1 workbook seed exports into SQLite.")
    parser.add_argument("--seed-dir", required=True, help="Directory containing csv/ and json/ exports.")
    parser.add_argument("--schema-sql", required=True, help="SQLite DDL file for import tables.")
    parser.add_argument("--db-path", required=True, help="Destination SQLite database path.")
    args = parser.parse_args()

    seed_dir = Path(args.seed_dir)
    db_path = Path(args.db_path)
    schema_sql = Path(args.schema_sql).read_text(encoding="utf-8")

    if db_path.exists():
        db_path.unlink()

    conn = sqlite3.connect(db_path)
    conn.executescript(schema_sql)

    for table, filename in TABLE_FILE_MAP.items():
        rows = load_csv(seed_dir / "csv" / filename)
        insert_rows(conn, table, rows)

    load_pair_engine(conn, seed_dir / "json" / "polarity_pair_engine_v10.json")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    main()
