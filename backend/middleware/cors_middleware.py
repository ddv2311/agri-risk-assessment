"""CORS middleware for handling cross-origin requests."""
from flask import request, make_response

def configure_cors_headers(response, origin="http://localhost:5173"):
    """Configure CORS headers for a response.
    
    Args:
        response: Flask response object
        origin: Allowed origin (default: http://localhost:5173)
        
    Returns:
        Response with CORS headers
    """
    response.headers.add('Access-Control-Allow-Origin', origin)
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Max-Age', '86400')
    return response

def cors_middleware(app):
    """Register CORS middleware with the Flask app.
    
    Args:
        app: Flask application instance
    """
    @app.after_request
    def add_cors_headers(response):
        # Add CORS headers to every response
        if request.method != 'OPTIONS':
            response = configure_cors_headers(response)
        return response
    
    @app.before_request
    def handle_preflight():
        # Handle OPTIONS preflight requests
        if request.method == 'OPTIONS':
            response = make_response()
            response = configure_cors_headers(response)
            return response, 200