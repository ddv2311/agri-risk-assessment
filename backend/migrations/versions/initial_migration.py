"""Initial database migration."""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(80), unique=True, nullable=False),
        sa.Column('email', sa.String(120), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(128)),
        sa.Column('role', sa.String(20), server_default='user'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('last_login', sa.DateTime()),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create scraped_data table
    op.create_table(
        'scraped_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('source', sa.String(50), nullable=False),
        sa.Column('data_type', sa.String(50), nullable=False),
        sa.Column('location', sa.String(100)),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_scraped_data_source_timestamp', 'scraped_data', ['source', 'timestamp'])
    
    # Create risk_predictions table
    op.create_table(
        'risk_predictions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('location', sa.String(100), nullable=False),
        sa.Column('crop', sa.String(50), nullable=False),
        sa.Column('scenario', sa.String(20), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=False),
        sa.Column('risk_category', sa.String(20), nullable=False),
        sa.Column('features', sa.JSON(), nullable=False),
        sa.Column('explanation', sa.Text()),
        sa.Column('model_version', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create model_metadata table
    op.create_table(
        'model_metadata',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('version', sa.String(20), unique=True, nullable=False),
        sa.Column('features', sa.JSON(), nullable=False),
        sa.Column('performance_metrics', sa.JSON(), nullable=False),
        sa.Column('training_date', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('model_metadata')
    op.drop_table('risk_predictions')
    op.drop_index('idx_scraped_data_source_timestamp', 'scraped_data')
    op.drop_table('scraped_data')
    op.drop_table('users') 