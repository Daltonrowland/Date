"""Add likes table, profile fields, sanctuary personal tools

Revision ID: 005
Revises: 004
Create Date: 2026-04-07
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Likes table
    op.create_table(
        "likes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("liker_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("liked_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_likes_id", "likes", ["id"])
    op.create_index("ix_likes_liker", "likes", ["liker_id"])
    op.create_index("ix_likes_liked", "likes", ["liked_id"])

    # User profile fields
    op.add_column("users", sa.Column("profile_photos", sa.JSON(), nullable=True))
    op.add_column("users", sa.Column("height", sa.String(), nullable=True, server_default=""))
    op.add_column("users", sa.Column("occupation", sa.String(), nullable=True, server_default=""))
    op.add_column("users", sa.Column("education", sa.String(), nullable=True, server_default=""))
    op.add_column("users", sa.Column("dating_status", sa.String(), nullable=True, server_default=""))
    op.add_column("users", sa.Column("relationship_state", sa.String(), nullable=True, server_default=""))

    # Sanctuary personal tools
    op.add_column("sanctuaries", sa.Column("personal_reflections", sa.JSON(), nullable=True))
    op.add_column("sanctuaries", sa.Column("emotional_state", sa.String(), nullable=True, server_default=""))
    op.add_column("sanctuaries", sa.Column("personal_goals", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("sanctuaries", "personal_goals")
    op.drop_column("sanctuaries", "emotional_state")
    op.drop_column("sanctuaries", "personal_reflections")
    op.drop_column("users", "relationship_state")
    op.drop_column("users", "dating_status")
    op.drop_column("users", "education")
    op.drop_column("users", "occupation")
    op.drop_column("users", "height")
    op.drop_column("users", "profile_photos")
    op.drop_table("likes")
