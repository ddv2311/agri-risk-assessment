"""Database models for the application."""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.types import JSON
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    """User model for authentication and authorization."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), default='user')  # 'user' or 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class ScrapedData(db.Model):
    """Model for storing scraped data from various sources."""
    __tablename__ = 'scraped_data'
    
    id = db.Column(db.Integer, primary_key=True)
    source = db.Column(db.String(50), nullable=False)  # e.g., 'weather', 'market', 'soil'
    data_type = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100))
    timestamp = db.Column(db.DateTime, nullable=False)
    data = db.Column(JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.Index('idx_scraped_data_source_timestamp', 'source', 'timestamp'),
    )

class RiskPrediction(db.Model):
    """Model for storing risk assessment predictions."""
    __tablename__ = 'risk_predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    crop = db.Column(db.String(50), nullable=False)
    scenario = db.Column(db.String(20), nullable=False)
    risk_score = db.Column(db.Float, nullable=False)
    risk_category = db.Column(db.String(20), nullable=False)
    features = db.Column(JSON, nullable=False)
    explanation = db.Column(db.Text)
    model_version = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('predictions', lazy=True))

class ModelMetadata(db.Model):
    """Model for storing model metadata and versioning."""
    __tablename__ = 'model_metadata'
    
    id = db.Column(db.Integer, primary_key=True)
    version = db.Column(db.String(20), unique=True, nullable=False)
    features = db.Column(JSON, nullable=False)
    performance_metrics = db.Column(JSON, nullable=False)
    training_date = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<ModelMetadata {self.version}>' 