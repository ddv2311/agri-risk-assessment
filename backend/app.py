"""Main application module for the agricultural risk assessment API."""
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging

from api.auth import init_auth, auth_bp
from api.routes import api_bp

# Load environment variables
load_dotenv()

# Setup logging
log_level = os.getenv('LOG_LEVEL', 'INFO').upper()

# Create logs directory if it doesn't exist
os.makedirs('logs', exist_ok=True)

# Configure logging
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def create_app(config_name='development'):
    """Create and configure the Flask application.
    
    Args:
        config_name: Configuration name (development, testing, production)
        
    Returns:
        Configured Flask application
    """
    app = Flask(__name__)
    
    # Enable CORS for all routes
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Load configuration
    app.config.from_object(f'config.{config_name.capitalize()}Config')
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(api_bp, url_prefix='/api/v1')
    
    init_auth(app)
    
    # Add error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not found',
            'message': str(error)
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000)