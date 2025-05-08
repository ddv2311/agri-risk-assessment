"""Main application module for the agricultural risk assessment API."""
from flask import Flask, jsonify, request, Response
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging
import requests

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
    
    # Enable CORS for Vite dev server only
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})
    
    # Load configuration
    app.config.from_object(f'config.{config_name.capitalize()}Config')
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(api_bp, url_prefix='/api')
    
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
    
    @app.route('/api/translate', methods=['POST'])
    def proxy_translate():
        data = request.get_json()
        if not data or 'q' not in data or 'target' not in data:
            return {"error": "Missing required fields"}, 400

        r = requests.post(
            'https://libretranslate.com/translate',
            json={
                "q": data["q"],
                "source": data.get("source", "en"),
                "target": data["target"],
                "format": data.get("format", "text")
            },
            headers={'Content-Type': 'application/json'}
        )
        return Response(r.content, status=r.status_code, content_type=r.headers.get('Content-Type'))
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000)