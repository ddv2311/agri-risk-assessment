"""Authentication module for the API."""
from functools import wraps
from flask import request, jsonify, Blueprint
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
    JWTManager
)
import logging
from datetime import timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logger = logging.getLogger(__name__)

# Initialize JWT Manager
jwt = JWTManager()

# Mock user database for MVP
# In production, this would be a proper database
USERS = {
    os.getenv('DEMO_USER_USERNAME', 'demo@ignosis.ai'): {
        "password": os.getenv('DEMO_USER_PASSWORD', 'demo123'),
        "role": "analyst"
    }
}

def init_auth(app):
    """Initialize authentication settings."""
    # JWT Configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    jwt.init_app(app)

def authenticate_user(email: str, password: str):
    """Authenticate a user and return an access token."""
    try:
        if email in USERS and USERS[email]["password"] == password:
            access_token = create_access_token(
                identity=email,
                additional_claims={"role": USERS[email]["role"]}
            )
            return {
                "access_token": access_token,
                "user": {
                    "email": email,
                    "role": USERS[email]["role"]
                }
            }
        return None
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return None

def admin_required():
    """Decorator to check if user has admin role."""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user = get_jwt_identity()
            if current_user not in USERS or USERS[current_user]["role"] != "admin":
                return jsonify({"msg": "Admin access required"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    """Look up user from JWT data."""
    identity = jwt_data["sub"]
    if identity in USERS:
        return {
            "email": identity,
            "role": USERS[identity]["role"]
        }
    return None

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    """Handle expired tokens."""
    return jsonify({
        "message": "Token has expired",
        "error": "token_expired"
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    """Handle invalid tokens."""
    return jsonify({
        "message": "Signature verification failed",
        "error": "invalid_token"
    }), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    """Handle missing tokens."""
    return jsonify({
        "message": "Request does not contain an access token",
        "error": "authorization_required"
    }), 401

# Create blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user and issue JWT token
    """
    try:
        if not request.is_json:
            return jsonify({"msg": "Missing JSON in request"}), 400
            
        username = request.json.get('username', None)
        password = request.json.get('password', None)
        
        # Check if username and password provided
        if not username:
            return jsonify({"msg": "Missing username parameter"}), 400
        if not password:
            return jsonify({"msg": "Missing password parameter"}), 400
        
        # Authenticate user
        auth_result = authenticate_user(username, password)
        if auth_result:
            logger.info(f"User {username} logged in successfully")
            return jsonify(auth_result), 200
        else:
            logger.warning(f"Failed login attempt for user {username}")
            return jsonify({"msg": "Invalid credentials"}), 401
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"msg": "Internal server error"}), 500

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    """
    Example of protected route
    """
    try:
        current_user = get_jwt_identity()
        return jsonify({"logged_in_as": current_user}), 200
    except Exception as e:
        logger.error(f"Protected route error: {str(e)}")
        return jsonify({"msg": "Internal server error"}), 500