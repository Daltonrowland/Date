"""Add Genesis OS blueprint fields: rs_code, DOB, sun_sign, diagnostics, scoring_version

Revision ID: 003
Revises: 002
Create Date: 2026-04-07

"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users table — RS Code, onboarding, Genesis OS profile
    op.add_column("users", sa.Column("rs_code", sa.String(6), nullable=True))
    op.add_column("users", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("users", sa.Column("sun_sign", sa.String(20), nullable=True))
    op.add_column("users", sa.Column("archetype_secondary", sa.String(), nullable=True, server_default=""))
    op.add_column("users", sa.Column("shadow_type", sa.String(), nullable=True, server_default=""))
    op.add_column("users", sa.Column("readiness_score", sa.Float(), nullable=True, server_default="0"))
    op.add_column("users", sa.Column("readiness_forecast", sa.String(), nullable=True, server_default=""))
    op.add_column("users", sa.Column("life_path_number", sa.Integer(), nullable=True))
    op.create_index("ix_users_rs_code", "users", ["rs_code"], unique=True)

    # Quiz responses — answer details, scoring version
    op.add_column("quiz_responses", sa.Column("answer_details", sa.JSON(), nullable=True))
    op.add_column("quiz_responses", sa.Column("scoring_version", sa.String(), nullable=True, server_default="phase1.v1"))

    # Compatibility scores — full diagnostics
    op.add_column("compatibility_scores", sa.Column("final_norm", sa.Float(), nullable=True))
    op.add_column("compatibility_scores", sa.Column("core_norm", sa.Float(), nullable=True))
    op.add_column("compatibility_scores", sa.Column("behavioral_avg", sa.Float(), nullable=True))
    op.add_column("compatibility_scores", sa.Column("stability_avg", sa.Float(), nullable=True))
    op.add_column("compatibility_scores", sa.Column("chemistry_avg", sa.Float(), nullable=True))
    op.add_column("compatibility_scores", sa.Column("zodiac_norm", sa.Float(), nullable=True))
    op.add_column("compatibility_scores", sa.Column("numerology_norm", sa.Float(), nullable=True))
    op.add_column("compatibility_scores", sa.Column("cosmic_overlay", sa.Float(), nullable=True))
    op.add_column("compatibility_scores", sa.Column("top_positive_drivers", sa.JSON(), nullable=True))
    op.add_column("compatibility_scores", sa.Column("top_friction_drivers", sa.JSON(), nullable=True))
    op.add_column("compatibility_scores", sa.Column("scoring_version", sa.String(), nullable=True, server_default="phase1.v1"))


def downgrade() -> None:
    op.drop_column("compatibility_scores", "scoring_version")
    op.drop_column("compatibility_scores", "top_friction_drivers")
    op.drop_column("compatibility_scores", "top_positive_drivers")
    op.drop_column("compatibility_scores", "cosmic_overlay")
    op.drop_column("compatibility_scores", "numerology_norm")
    op.drop_column("compatibility_scores", "zodiac_norm")
    op.drop_column("compatibility_scores", "chemistry_avg")
    op.drop_column("compatibility_scores", "stability_avg")
    op.drop_column("compatibility_scores", "behavioral_avg")
    op.drop_column("compatibility_scores", "core_norm")
    op.drop_column("compatibility_scores", "final_norm")
    op.drop_column("quiz_responses", "scoring_version")
    op.drop_column("quiz_responses", "answer_details")
    op.drop_index("ix_users_rs_code", "users")
    op.drop_column("users", "life_path_number")
    op.drop_column("users", "readiness_forecast")
    op.drop_column("users", "readiness_score")
    op.drop_column("users", "shadow_type")
    op.drop_column("users", "archetype_secondary")
    op.drop_column("users", "sun_sign")
    op.drop_column("users", "date_of_birth")
    op.drop_column("users", "rs_code")
