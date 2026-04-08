"""Add calibration, economy, badge tables + dynamic_score on compatibility_scores

Revision ID: 007
Revises: 006
Create Date: 2026-04-08
"""
from alembic import op
import sqlalchemy as sa

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # dynamic_score on compatibility_scores
    op.add_column("compatibility_scores", sa.Column("dynamic_score", sa.Float(), nullable=True))

    # Calibration events
    op.create_table("chat_calibration_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("match_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("stage", sa.Integer(), nullable=False),
        sa.Column("trigger_message_count", sa.Integer(), server_default="0"),
        sa.Column("responses_json", sa.JSON(), nullable=False),
        sa.Column("raw_score", sa.Float(), server_default="0"),
        sa.Column("adjusted_score", sa.Float(), server_default="0"),
        sa.Column("adjustment_delta", sa.Float(), server_default="0"),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("confidence_level", sa.String(), server_default="single"),
        sa.Column("safety_flagged", sa.Boolean(), server_default="false"),
    )

    # Coin accounts
    op.create_table("coin_accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_type", sa.String(), server_default="user"),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("current_balance", sa.Integer(), server_default="0"),
        sa.Column("reserved_balance", sa.Integer(), server_default="0"),
        sa.Column("lifetime_earned", sa.Integer(), server_default="0"),
        sa.Column("lifetime_spent", sa.Integer(), server_default="0"),
        sa.Column("last_reconciled_at", sa.DateTime(), nullable=True),
        sa.Column("economy_version", sa.String(), server_default="v1"),
    )

    # Coin transaction ledger
    op.create_table("coin_transaction_ledger",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("owner_type", sa.String(), server_default="user"),
        sa.Column("tx_type", sa.String(), nullable=False),
        sa.Column("direction", sa.String(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("currency_code", sa.String(), server_default="RS_COIN"),
        sa.Column("source_event_type", sa.String(), nullable=True),
        sa.Column("source_event_id", sa.String(), nullable=True),
        sa.Column("status", sa.String(), server_default="posted"),
        sa.Column("idempotency_key", sa.String(), nullable=True, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("posted_at", sa.DateTime(), nullable=True),
    )

    # Badge definitions
    op.create_table("badge_definitions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("badge_key", sa.String(), unique=True, nullable=False),
        sa.Column("family", sa.String(), server_default="foundation"),
        sa.Column("tier", sa.String(), server_default="bronze"),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), server_default=""),
        sa.Column("icon", sa.String(), server_default="🏅"),
        sa.Column("unlock_logic", sa.String(), server_default=""),
    )

    # User badges
    op.create_table("user_badges",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("badge_key", sa.String(), nullable=False),
        sa.Column("awarded_at", sa.DateTime(), nullable=True),
        sa.Column("source_event_id", sa.String(), nullable=True),
    )

    # Scoreboard
    op.create_table("scoreboard_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("board_type", sa.String(), server_default="global"),
        sa.Column("period_key", sa.String(), server_default="all_time"),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("points", sa.Integer(), server_default="0"),
        sa.Column("rank", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("scoreboard_entries")
    op.drop_table("user_badges")
    op.drop_table("badge_definitions")
    op.drop_table("coin_transaction_ledger")
    op.drop_table("coin_accounts")
    op.drop_table("chat_calibration_events")
    op.drop_column("compatibility_scores", "dynamic_score")
