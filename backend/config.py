"""Configuration settings for different environments."""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration."""
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # Database settings
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///data/agricultural_data.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # API settings
    API_TITLE = 'Agricultural Risk Assessment API'
    API_VERSION = '1.0.0'
    
    # Model settings
    MODEL_PATH = os.getenv('MODEL_PATH', 'models/risk_assessment_model.joblib')
    
    # Data collection settings
    DEFAULT_REGION = 'Gujarat'
    DEFAULT_CROP = 'wheat'
    
    # API keys
    DATA_GOV_API_KEY = os.getenv('DATA_GOV_API_KEY', 'your-data-gov-api-key')
    IMD_API_KEY = os.getenv('IMD_API_KEY', 'your-imd-api-key')
    
    # Model parameters
    MODEL_PARAMS = {
        'n_estimators': 100,
        'learning_rate': 0.1,
        'max_depth': 3
    }
    
    # Feature engineering settings
    FEATURES = [
        'crop_yield_variability',
        'rainfall_deviation',
        'temperature_anomalies',
        'price_volatility'
    ]
    
    # Risk score thresholds
    RISK_THRESHOLDS = {
        'low': (0.0, 0.33),
        'medium': (0.33, 0.66),
        'high': (0.66, 1.0)
    }
    
    # Demo user
    DEMO_USER_USERNAME = os.getenv('DEMO_USER_USERNAME', 'demo@ignosis.ai')
    DEMO_USER_PASSWORD = os.getenv('DEMO_USER_PASSWORD', 'demo123')

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    TESTING = False

class TestingConfig(Config):
    """Testing configuration."""
    DEBUG = False
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test_data.db'
    MODEL_PATH = 'test_model.joblib'

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False
    LOG_LEVEL = 'WARNING'
    
    # Ensure secret keys are set in production
    @classmethod
    def init_app(cls, app):
        """Initialize production app."""
        if not os.getenv('SECRET_KEY'):
            raise ValueError("SECRET_KEY must be set in production")
        if not os.getenv('JWT_SECRET_KEY'):
            raise ValueError("JWT_SECRET_KEY must be set in production")
        if not os.getenv('DATABASE_URL'):
            raise ValueError("DATABASE_URL must be set in production")

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment."""
    env = os.getenv('FLASK_ENV', 'default')
    return config[env]
