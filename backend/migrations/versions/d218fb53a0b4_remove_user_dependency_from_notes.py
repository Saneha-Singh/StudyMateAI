
"""remove user dependency from notes

Revision ID: d218fb53a0b4
Revises: 2e1462aa5ff6
"""

from alembic import op
import sqlalchemy as sa


revision = 'd218fb53a0b4'
down_revision = '2e1462aa5ff6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # First remove the foreign key dependency from notes
    op.drop_index(
        op.f('ix_notes_user_id'),
        table_name='notes'
    )

    op.drop_constraint(
        op.f('notes_user_id_fkey'),
        'notes',
        type_='foreignkey'
    )

    op.drop_column('notes', 'user_id')

    # Now safely remove the users table
    op.drop_index(
        op.f('ix_users_email'),
        table_name='users'
    )

    op.drop_index(
        op.f('ix_users_id'),
        table_name='users'
    )

    op.drop_table('users')


def downgrade() -> None:
    # Recreate users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False
        ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index(
        op.f('ix_users_email'),
        'users',
        ['email'],
        unique=True
    )

    op.create_index(
        op.f('ix_users_id'),
        'users',
        ['id'],
        unique=False
    )

    # Restore user_id as nullable because old ownership data
    # cannot be recovered after the upgrade
    op.add_column(
        'notes',
        sa.Column('user_id', sa.Integer(), nullable=True)
    )

    op.create_foreign_key(
        op.f('notes_user_id_fkey'),
        'notes',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )

    op.create_index(
        op.f('ix_notes_user_id'),
        'notes',
        ['user_id'],
        unique=False
    )
