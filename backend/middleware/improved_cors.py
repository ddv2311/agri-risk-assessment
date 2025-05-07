"""Improved CORS middleware for handling cross-origin requests."""
from flask import request, make_response, current_app
import logging
import os

logger = logging.getLogger(__name__)

# Get allowed origins - default is the React dev server
ALLOWED_ORIGINS = [os.getenv('FRONTEND_URL', 'http://localhost:5173')]

def configure_cors_headers(response):
    """Configure CORS headers for a response.

    Args:
        response: Flask response object

    Returns:
        Response with CORS headers
    """
    # Get the origin from the request
    origin = request.headers.get('Origin')
    
    # Only set the CORS headers if the origin is allowed
    if origin in ALLOWED_ORIGINS:
        # When using credentials, Access-Control-Allow-Origin must be a specific origin, not a wildcard
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    else:
        # If origin is not in our allowed list, log it but still allow for development
        logger.warning(f"Request from non-allowed origin: {origin}")
        # In development, we'll still allow it but log the warning
        response.headers['Access-Control-Allow-Origin'] = origin if origin else ALLOWED_ORIGINS[0]
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    
    # Set other CORS headers
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Access-Control-Allow-Credentials'
    response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization, Access-Control-Allow-Credentials'
    response.headers['Access-Control-Max-Age'] = '86400'  # Cache preflight requests for 1 day
    
    # Ensure we have a proper content type for preflight responses
    if request.method == 'OPTIONS' and not response.headers.get('Content-Type'):
        response.headers['Content-Type'] = 'text/plain'
    
    return response

def improved_cors_middleware(app):
    """Register improved CORS middleware with the Flask app.

    This middleware ensures proper CORS headers are set for all responses,
    including OPTIONS preflight requests, which is crucial for browser security.

    Args:
        app: Flask application instance
    """
    @app.after_request
    def add_cors_headers_after_request(response):
        # Skip if this is already a preflight response we created
        if getattr(response, '_is_cors_preflight', False):
            return response
            
        logger.info(f"Adding CORS headers to response with status code: {response.status_code} for {request.method} {request.path}")
        return configure_cors_headers(response)

    # Handle OPTIONS requests at the application level
    # This ensures we catch all preflight requests before they reach any route handlers
    @app.before_request
    def handle_preflight_options_request():
        if request.method == 'OPTIONS':
            logger.info(f"Handling OPTIONS preflight request for path: {request.path}")
            
            # Create a response object for the OPTIONS preflight
            response = make_response()
            response.status_code = 200
            response._is_cors_preflight = True  # Mark as preflight so after_request doesn't reprocess
            
            # Configure CORS headers
            return configure_cors_headers(response)

    return app