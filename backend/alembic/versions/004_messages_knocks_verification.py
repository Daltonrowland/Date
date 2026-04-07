"""Add messages, knocks, email_verification_codes tables + profile_photo, is_verified columns

Revision ID: 004
Revises: 003
Create Date: 2026-04-07
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users — new columns
    op.add_column("users", sa.Column("profile_photo", sa.Text(), nullable=True, server_default=""))
    op.add_column("users", sa.Column("is_verified", sa.Boolean(), nullable=True, server_default="false"))

    # Messages table
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("recipient_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("read_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_messages_id", "messages", ["id"])
    op.create_index("ix_messages_sender", "messages", ["sender_id"])
    op.create_index("ix_messages_recipient", "messages", ["recipient_id"])

    # Knocks table
    op.create_table(
        "knocks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("recipient_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("message", sa.Text(), nullable=True, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_knocks_id", "knocks", ["id"])

    # Email verification codes
    op.create_table(
        "email_verification_codes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("code", sa.String(6), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_email_verification_codes_id", "email_verification_codes", ["id"])


def downgrade() -> None:
    op.drop_table("email_verification_codes")
    op.drop_table("knocks")
    op.drop_table("messages")
    op.drop_column("users", "is_verified")
    op.drop_column("users", "profile_photo")
