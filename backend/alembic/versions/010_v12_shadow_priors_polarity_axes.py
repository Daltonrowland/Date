"""v12 shadow priors, polarity axes config, workbook_import_versions active flag

Revision ID: 010
Revises: 009
Create Date: 2026-04-08
"""
from alembic import op
import sqlalchemy as sa

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Shadow priors table
    op.create_table("shadow_priors",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("shadow_type", sa.String(), unique=True, nullable=False),
        sa.Column("severity_prior", sa.Float(), nullable=False),
    )

    # Polarity axes config table
    op.create_table("polarity_axes_config",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("axis_key", sa.String(), unique=True, nullable=False),
        sa.Column("fit_function", sa.String(), nullable=False),  # similarity, complement, balance@0.45
        sa.Column("role_weight", sa.Float(), nullable=False),
        sa.Column("attraction_weight", sa.Float(), server_default="0"),
        sa.Column("balance_target", sa.Float(), nullable=True),
    )

    # Active flag on workbook_import_versions
    op.add_column("workbook_import_versions", sa.Column("active", sa.Boolean(), server_default="false"))
    op.add_column("workbook_import_versions", sa.Column("source_name", sa.String(), nullable=True))
    op.add_column("workbook_import_versions", sa.Column("scoring_version_tag", sa.String(), nullable=True))

    # Block structure on polarity questions
    op.add_column("question_catalog", sa.Column("block_id", sa.Integer(), nullable=True))
    op.add_column("question_catalog", sa.Column("block_multiplier", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("question_catalog", "block_multiplier")
    op.drop_column("question_catalog", "block_id")
    op.drop_column("workbook_import_versions", "scoring_version_tag")
    op.drop_column("workbook_import_versions", "source_name")
    op.drop_column("workbook_import_versions", "active")
    op.drop_table("polarity_axes_config")
    op.drop_table("shadow_priors")
