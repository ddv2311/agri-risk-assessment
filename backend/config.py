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
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Cache configuration
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes
    
    # API configuration
    API_VERSION = 'v1'
    API_BASE_URL = '/api/' + API_VERSION
    
    # Default region and crop
    DEFAULT_REGION = 'Gujarat'
    DEFAULT_CROP = 'wheat'
    
    # API Keys
    DATA_GOV_API_KEY = os.getenv('DATA_GOV_API_KEY')
    IMD_API_KEY = os.getenv('IMD_API_KEY')
    
    # Model Parameters
    MODEL_PARAMS = {
        'objective': 'binary:logistic',
        'max_depth': 6,
        'learning_rate': 0.1,
        'n_estimators': 100,
        'random_state': 42,
        'eval_metric': 'logloss',
        'use_label_encoder': False
    }
    
    # Risk Thresholds
    RISK_THRESHOLDS = {
        'low': 0.3,
        'medium': 0.6,
        'high': 0.9
    }
    
    # Features
    FEATURES = [
        'yield_variability',
        'rainfall_deviation',
        'temperature_anomaly',
        'price_volatility'
    ]
    
    # Error Handling
    ERROR_HANDLING = {
        'max_retries': 3,
        'retry_delay': 2,  # seconds
        'timeout': 30  # seconds
    }
    
    # Logging
    LOG_LEVEL = 'INFO'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = 'agri_risk.log'

def get_config():
    """Get the appropriate configuration based on environment."""
    env = os.getenv('FLASK_ENV', 'development')
    config_class = {
        'development': DevelopmentConfig,
        'testing': TestingConfig,
        'production': ProductionConfig
    }.get(env.lower(), Config)
    
    try:
        config = config_class()
        logger.info(f"Using {env} configuration")
        return config
    except Exception as e:
        logger.error(f"Failed to load configuration: {str(e)}")
        raise

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    TESTING = False
    
    # Use simulated data for development
    USE_SIMULATED_DATA = True
    
    # Development specific settings
    SQLALCHEMY_DATABASE_URI = 'sqlite:///agri_risk_dev.db'
    CACHE_TYPE = 'simple'  # Use simple cache for development
    LOG_LEVEL = 'DEBUG'

class TestingConfig(Config):
    """Testing configuration."""
    DEBUG = False
    TESTING = True
    
    # Use simulated data for testing
    USE_SIMULATED_DATA = True
    
    # Testing specific settings
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    CACHE_TYPE = 'null'  # No caching in tests
    LOG_LEVEL = 'INFO'

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False
    
    # Use real data in production
    USE_SIMULATED_DATA = False
    
    # Production specific settings
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    CACHE_TYPE = 'redis'
    LOG_LEVEL = 'WARNING'
    
    # Additional production settings
    MAX_REQUESTS_PER_MINUTE = 100
    RATE_LIMIT_WINDOW = 60  # seconds
    REQUEST_TIMEOUT = 10  # seconds
    
    # Security settings
    RATE_LIMIT_ENABLED = True
    CORS_ENABLED = True
    CORS_ORIGINS = ['*']  # In production, this should be restricted
    
    # Monitoring
    MONITORING_ENABLED = True
    METRICS_ENABLED = True
    
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
