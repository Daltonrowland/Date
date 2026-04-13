"""v12 upgrade: couples mode, polarity, account_state, ghost_mode

Revision ID: 008
Revises: 007
Create Date: 2026-04-08
"""
from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Users table upgrades ──────────────────────────────────────────────
    op.add_column("users", sa.Column("polarity_completed", sa.Boolean(), server_default="false"))
    op.add_column("users", sa.Column("account_state", sa.String(), server_default="assessment_incomplete"))
    op.add_column("users", sa.Column("ghost_mode", sa.Boolean(), server_default="false"))

    # ── Polarity snapshots ────────────────────────────────────────────────
    op.create_table("user_polarity_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("axis_scores", sa.JSON(), nullable=False),
        sa.Column("role_seed_distribution", sa.JSON(), nullable=True),
        sa.Column("scoring_version", sa.String(), server_default="v12"),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )

    # ── Workbook import versions ──────────────────────────────────────────
    op.create_table("workbook_import_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("workbook_version", sa.String(), nullable=False),
        sa.Column("sheet_name", sa.String(), nullable=False),
        sa.Column("data_rows", sa.Integer(), nullable=False),
        sa.Column("source_checksum", sa.String(), nullable=True),
        sa.Column("imported_at", sa.DateTime(), nullable=True),
    )

    # ── Couple containers ─────────────────────────────────────────────────
    op.create_table("couple_containers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_a_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("user_b_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("couple_handle", sa.String(), nullable=True),
        sa.Column("theme", sa.String(), server_default="classic_deep"),
        sa.Column("status", sa.String(), server_default="proposed"),
        sa.Column("compatibility_snapshot_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # ── Couple consents ───────────────────────────────────────────────────
    op.create_table("couple_consents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("couple_id", sa.Integer(), sa.ForeignKey("couple_containers.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("consent_type", sa.String(), nullable=False),
        sa.Column("granted_at", sa.DateTime(), nullable=True),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
    )

    # ── Couple rooms ──────────────────────────────────────────────────────
    op.create_table("couple_rooms",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("couple_id", sa.Integer(), sa.ForeignKey("couple_containers.id"), nullable=False),
        sa.Column("room_family", sa.String(), nullable=False),
        sa.Column("visibility", sa.String(), server_default="both"),
        sa.Column("state", sa.String(), server_default="active"),
        sa.Column("skin_token", sa.String(), nullable=True),
    )

    # ── Pulse sessions ────────────────────────────────────────────────────
    op.create_table("pulse_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("couple_id", sa.Integer(), sa.ForeignKey("couple_containers.id"), nullable=False),
        sa.Column("prompt_set_id", sa.String(), nullable=True),
        sa.Column("response_a", sa.JSON(), nullable=True),
        sa.Column("response_b", sa.JSON(), nullable=True),
        sa.Column("alignment_delta", sa.Float(), nullable=True),
        sa.Column("repair_flag", sa.Boolean(), server_default="false"),
        sa.Column("support_prompt_id", sa.String(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )

    # ── Repair sessions ───────────────────────────────────────────────────
    op.create_table("repair_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("couple_id", sa.Integer(), sa.ForeignKey("couple_containers.id"), nullable=False),
        sa.Column("trigger_source", sa.String(), nullable=True),
        sa.Column("consent_state", sa.String(), server_default="pending"),
        sa.Column("issue_family", sa.String(), nullable=True),
        sa.Column("stage", sa.Integer(), server_default="1"),
        sa.Column("perspective_a", sa.Text(), nullable=True),
        sa.Column("perspective_b", sa.Text(), nullable=True),
        sa.Column("commitments", sa.JSON(), nullable=True),
        sa.Column("closure_state", sa.String(), server_default="open"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # ── Couple goals ──────────────────────────────────────────────────────
    op.create_table("couple_goals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("couple_id", sa.Integer(), sa.ForeignKey("couple_containers.id"), nullable=False),
        sa.Column("goal_text", sa.String(), nullable=False),
        sa.Column("completed", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # ── Couple archive ────────────────────────────────────────────────────
    op.create_table("couple_archive_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("couple_id", sa.Integer(), sa.ForeignKey("couple_containers.id"), nullable=False),
        sa.Column("item_type", sa.String(), nullable=False),
        sa.Column("scope", sa.String(), server_default="shared"),
        sa.Column("source_module", sa.String(), nullable=True),
        sa.Column("visibility", sa.String(), server_default="both"),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # ── Private reflections ───────────────────────────────────────────────
    op.create_table("private_reflections",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("couple_id", sa.Integer(), sa.ForeignKey("couple_containers.id"), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("convertable_flag", sa.Boolean(), server_default="true"),
        sa.Column("converted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("private_reflections")
    op.drop_table("couple_archive_items")
    op.drop_table("couple_goals")
    op.drop_table("repair_sessions")
    op.drop_table("pulse_sessions")
    op.drop_table("couple_rooms")
    op.drop_table("couple_consents")
    op.drop_table("couple_containers")
    op.drop_table("workbook_import_versions")
    op.drop_table("user_polarity_snapshots")
    op.drop_column("users", "ghost_mode")
    op.drop_column("users", "account_state")
    op.drop_column("users", "polarity_completed")
