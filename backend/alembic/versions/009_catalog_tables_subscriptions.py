"""Add catalog tables for workbook data + subscription tier fields

Revision ID: 009
Revises: 008
Create Date: 2026-04-08
"""
from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Subscription fields on users ──────────────────────────────────────
    op.add_column("users", sa.Column("subscription_tier", sa.String(), server_default="free"))
    op.add_column("users", sa.Column("subscription_status", sa.String(), server_default="none"))
    op.add_column("users", sa.Column("subscription_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("subscription_expires_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("matches_viewed_today", sa.Integer(), server_default="0"))
    op.add_column("users", sa.Column("matches_viewed_reset_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(), nullable=True))

    # ── Answer catalog (310 rows from AnswerBank) ─────────────────────────
    op.create_table("answer_catalog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("answer_id", sa.String(), unique=True, nullable=False),
        sa.Column("qa_key", sa.String()),
        sa.Column("question_number_int", sa.Integer()),
        sa.Column("phase", sa.String()),
        sa.Column("question_weight_v3", sa.Float()),
        sa.Column("dimension_primary", sa.String()),
        sa.Column("dimension_secondary", sa.String()),
        sa.Column("answer_letter", sa.String()),
        sa.Column("answer_text", sa.Text()),
        sa.Column("archetype", sa.String()),
        sa.Column("shadow_type", sa.String()),
        sa.Column("comm_health_norm", sa.Float()),
        sa.Column("reg_health_norm", sa.Float()),
        sa.Column("love_relational_norm", sa.Float()),
        sa.Column("readiness_norm", sa.Float()),
        sa.Column("pacing_norm", sa.Float()),
        sa.Column("attachment_risk_norm", sa.Float()),
        sa.Column("centered_polarity_norm", sa.Float()),
        sa.Column("reciprocity_signal_norm", sa.Float()),
        sa.Column("integrity_penalty_norm", sa.Float()),
        sa.Column("cluster_penalty_norm", sa.Float()),
        sa.Column("pattern_risk_norm", sa.Float()),
        sa.Column("forecast_norm", sa.Float()),
        sa.Column("pos_agg", sa.Float()),
        sa.Column("chem_agg", sa.Float()),
        sa.Column("risk_agg", sa.Float()),
        sa.Column("risk_band", sa.String()),
        sa.Column("pos_band", sa.String()),
        sa.Column("chem_band", sa.String()),
        sa.Column("access_style_label_v8", sa.String()),
        sa.Column("conflict_style_label_v8", sa.String()),
        sa.Column("repair_style_label_v8", sa.String()),
        sa.Column("attachment_style_label_v8", sa.String()),
        sa.Column("nervous_system_bias_label_v8", sa.String()),
        sa.Column("selection_gap_flag_v8", sa.String()),
    )
    op.create_index("ix_answer_catalog_answer_id", "answer_catalog", ["answer_id"])
    op.create_index("ix_answer_catalog_question", "answer_catalog", ["question_number_int", "answer_letter"])

    # ── Pair quantum catalog (48,205 rows) ────────────────────────────────
    op.create_table("pair_quantum_catalog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pair_key", sa.String(), nullable=False),
        sa.Column("ans_a_id", sa.String()),
        sa.Column("ans_b_id", sa.String()),
        sa.Column("archetype_fit", sa.Float()),
        sa.Column("comm_fit", sa.Float()),
        sa.Column("reg_fit", sa.Float()),
        sa.Column("love_fit", sa.Float()),
        sa.Column("readiness_fit", sa.Float()),
        sa.Column("shadow_fit", sa.Float()),
        sa.Column("integrity_fit", sa.Float()),
        sa.Column("cluster_fit", sa.Float()),
        sa.Column("pace_fit", sa.Float()),
        sa.Column("polarity_fit", sa.Float()),
        sa.Column("pursuit_fit", sa.Float()),
        sa.Column("forecast_fit", sa.Float()),
        sa.Column("risk_avg", sa.Float()),
        sa.Column("risk_max", sa.Float()),
        sa.Column("gate", sa.Float()),
        sa.Column("rule_penalty", sa.Float()),
        sa.Column("behavioral_component", sa.Float()),
        sa.Column("stability_component", sa.Float()),
        sa.Column("chemistry_component", sa.Float()),
        sa.Column("base_0_88", sa.Float()),
        sa.Column("pair_norm_0_1", sa.Float()),
    )
    op.create_index("ix_pair_quantum_pair_key", "pair_quantum_catalog", ["pair_key"])

    # ── Archetype matrix (10x10) ──────────────────────────────────────────
    op.create_table("archetype_matrix_catalog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("archetype_a", sa.String(), nullable=False),
        sa.Column("archetype_b", sa.String(), nullable=False),
        sa.Column("fit_value", sa.Float(), nullable=False),
    )

    # ── Shadow matrix (6x6) ──────────────────────────────────────────────
    op.create_table("shadow_matrix_catalog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("shadow_a", sa.String(), nullable=False),
        sa.Column("shadow_b", sa.String(), nullable=False),
        sa.Column("stability_value", sa.Float(), nullable=False),
    )

    # ── Zodiac lookup (577 rows) ─────────────────────────────────────────
    op.create_table("zodiac_lookup_catalog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("z_key", sa.String(), unique=True, nullable=False),
        sa.Column("gender_a", sa.String()),
        sa.Column("gender_b", sa.String()),
        sa.Column("sun_sign_a", sa.String()),
        sa.Column("sun_sign_b", sa.String()),
        sa.Column("zodiac_norm", sa.Float()),
    )

    # ── Numerology lookup (67 rows) ──────────────────────────────────────
    op.create_table("numerology_lookup_catalog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("n_key", sa.String(), unique=True, nullable=False),
        sa.Column("life_path_a", sa.Integer()),
        sa.Column("life_path_b", sa.Integer()),
        sa.Column("numerology_norm", sa.Float()),
    )

    # ── Question catalog (60+32 questions) ────────────────────────────────
    op.create_table("question_catalog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("question_number", sa.Integer(), unique=True, nullable=False),
        sa.Column("question_id", sa.String()),
        sa.Column("family", sa.String()),
        sa.Column("phase", sa.String()),
        sa.Column("dimension_primary", sa.String()),
        sa.Column("dimension_secondary", sa.String()),
        sa.Column("question_weight", sa.Float()),
        sa.Column("answer_count", sa.Integer()),
        sa.Column("available_letters", sa.String()),
    )

    # ── Polarity answer catalog ───────────────────────────────────────────
    op.create_table("polarity_answer_catalog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("question_id", sa.String()),
        sa.Column("answer_letter", sa.String()),
        sa.Column("axis_key", sa.String()),
        sa.Column("score_value", sa.Float()),
        sa.Column("data", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("polarity_answer_catalog")
    op.drop_table("question_catalog")
    op.drop_table("numerology_lookup_catalog")
    op.drop_table("zodiac_lookup_catalog")
    op.drop_table("shadow_matrix_catalog")
    op.drop_table("archetype_matrix_catalog")
    op.drop_table("pair_quantum_catalog")
    op.drop_table("answer_catalog")
    op.drop_column("users", "stripe_customer_id")
    op.drop_column("users", "matches_viewed_reset_at")
    op.drop_column("users", "matches_viewed_today")
    op.drop_column("users", "subscription_expires_at")
    op.drop_column("users", "subscription_id")
    op.drop_column("users", "subscription_status")
    op.drop_column("users", "subscription_tier")
