"""Add notifications, reports, blocks tables + onboarding_completed, last_active

Revision ID: 006
Revises: 005
Create Date: 2026-04-07
"""
from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("read", sa.Boolean(), server_default="false"),
        sa.Column("reference_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_notifications_user", "notifications", ["user_id"])

    op.create_table("reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reporter_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reported_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("details", sa.Text(), nullable=True, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table("blocks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("blocker_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("blocked_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_blocks_blocker", "blocks", ["blocker_id"])

    op.add_column("users", sa.Column("onboarding_completed", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("users", sa.Column("last_active", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "last_active")
    op.drop_column("users", "onboarding_completed")
    op.drop_table("blocks")
    op.drop_table("reports")
    op.drop_table("notifications")
