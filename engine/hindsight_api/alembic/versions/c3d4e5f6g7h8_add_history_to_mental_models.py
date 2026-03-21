"""Add history column to mental_models

Revision ID: c3d4e5f6g7h8
Revises: a2b3c4d5e6f7, a2b3c4d5e6f8
Create Date: 2026-03-06
"""

from collections.abc import Sequence

from alembic import context, op

revision: str = "c3d4e5f6g7h8"
down_revision: str | Sequence[str] | None = ("a2b3c4d5e6f7", "a2b3c4d5e6f8")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _get_schema_prefix() -> str:
    schema = context.config.get_main_option("target_schema")
    return f'"{schema}".' if schema else ""


def upgrade() -> None:
    schema = _get_schema_prefix()
    op.execute(f"ALTER TABLE {schema}mental_models ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb")


def downgrade() -> None:
    schema = _get_schema_prefix()
    op.execute(f"ALTER TABLE {schema}mental_models DROP COLUMN IF EXISTS history")
