"""Add observation_scopes column to memory_units table

Revision ID: z1u2v3w4x5y6
Revises: a1b2c3d4e5f6
Create Date: 2026-02-25

Adds observation_scopes JSONB column to memory_units to control how observations
are scoped during consolidation. Accepts "per_tag", "combined", or an explicit
list of tag-set lists for custom multi-pass consolidation.
"""

from collections.abc import Sequence

from alembic import context, op

revision: str = "z1u2v3w4x5y6"
down_revision: str | Sequence[str] | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _get_schema_prefix() -> str:
    """Get schema prefix for table names (required for multi-tenant support)."""
    schema = context.config.get_main_option("target_schema")
    return f'"{schema}".' if schema else ""


def upgrade() -> None:
    schema = _get_schema_prefix()
    op.execute(f"ALTER TABLE {schema}memory_units ADD COLUMN IF NOT EXISTS observation_scopes JSONB")


def downgrade() -> None:
    schema = _get_schema_prefix()
    op.execute(f"ALTER TABLE {schema}memory_units DROP COLUMN IF EXISTS observation_scopes")
