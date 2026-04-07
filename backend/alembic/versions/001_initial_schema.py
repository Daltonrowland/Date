"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-06

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("gender", sa.String(), nullable=True),
        sa.Column("looking_for", sa.String(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True, default=""),
        sa.Column("location", sa.String(), nullable=True, default=""),
        sa.Column("quiz_completed", sa.Boolean(), default=False),
        sa.Column("archetype", sa.String(), nullable=True, default=""),
        sa.Column("archetype_score", sa.Float(), default=0.0),
        sa.Column("shadow_score", sa.Float(), default=0.0),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_id", "users", ["id"])

    op.create_table(
        "quiz_responses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_quiz_responses_id", "quiz_responses", ["id"])

    op.create_table(
        "compatibility_scores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_a_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("user_b_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("tier", sa.String(), nullable=False),
        sa.Column("tier_label", sa.String(), nullable=False),
        sa.Column("breakdown", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_compatibility_scores_id", "compatibility_scores", ["id"])

    op.create_table(
        "sanctuaries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("partner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("couple_name", sa.String(), nullable=True, default=""),
        sa.Column("goals", sa.JSON(), nullable=True),
        sa.Column("milestones", sa.JSON(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True, default=""),
        sa.Column("love_language", sa.String(), nullable=True, default=""),
        sa.Column("anniversary", sa.String(), nullable=True, default=""),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_sanctuaries_id", "sanctuaries", ["id"])


def downgrade() -> None:
    op.drop_table("sanctuaries")
    op.drop_table("compatibility_scores")
    op.drop_table("quiz_responses")
    op.drop_table("users")
