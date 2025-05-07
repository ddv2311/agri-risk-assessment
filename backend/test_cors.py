"""
Simple Flask app to test CORS configuration.
This will replace our main app.py temporarily to isolate and fix the CORS issue.
"""
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Basic CORS setup - we'll manually handle the headers to ensure they're set correctly
CORS(app)

@app.route('/api/v1/auth/signup', methods=['POST', 'OPTIONS'])
def signup():
    """Test signup endpoint that properly handles CORS."""
    logger.debug(f"Received {request.method} request to /api/v1/auth/signup")
    logger.debug(f"Headers: {dict(request.headers)}")
    
    # Handle OPTIONS preflight request
    if request.method == 'OPTIONS':
        logger.debug("Handling OPTIONS preflight request")
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        logger.debug(f"Response headers: {dict(response.headers)}")
        return response, 200
    
    # Handle POST request
    logger.debug("Handling POST request")
    try:
        data = request.get_json()
        logger.debug(f"Received data: {data}")
        
        # Always return success for testing
        response = jsonify({
            "access_token": "test_token_123",
            "user": {
                "email": data.get('username', 'test@example.com'),
                "role": "user",
                "id": "test-user-id"
            },
            "message": "Test signup successful"
        })
        
        # Manually add CORS headers
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        logger.debug(f"Response headers: {dict(response.headers)}")
        return response, 201
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        response = jsonify({"error": str(e)})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 500

@app.route('/api/v1/auth/login', methods=['POST', 'OPTIONS'])
def login():
    """Test login endpoint that properly handles CORS."""
    logger.debug(f"Received {request.method} request to /api/v1/auth/login")
    
    # Handle OPTIONS preflight request
    if request.method == 'OPTIONS':
        logger.debug("Handling OPTIONS preflight request")
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
    
    # Handle POST request
    try:
        data = request.get_json()
        
        # Check for test credentials
        if data.get('username') == 'test@example.com' and data.get('password') == 'password123':
            response = jsonify({
                "access_token": "test_token_123",
                "user": {
                    "email": "test@example.com",
                    "role": "user",
                    "id": "test-user-id"
                }
            })
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 200
        else:
            response = jsonify({"error": "Invalid credentials"})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 401
    except Exception as e:
        response = jsonify({"error": str(e)})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 500

if __name__ == '__main__':
    print("Starting test CORS server on http://localhost:5000")
    print("Test credentials: test@example.com / password123")
    app.run(host='0.0.0.0', port=5000)
