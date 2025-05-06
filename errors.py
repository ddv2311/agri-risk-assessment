"""Error handling for the application."""
from flask import jsonify
from marshmallow import ValidationError

class APIError(Exception):
    """Base error class for API exceptions."""
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = {
            'error': self.__class__.__name__,
            'message': self.message
        }
        if self.payload:
            rv['details'] = self.payload
        return rv

class AuthenticationError(APIError):
    """Raised when authentication fails."""
    def __init__(self, message="Authentication failed", payload=None):
        super().__init__(message, status_code=401, payload=payload)

class AuthorizationError(APIError):
    """Raised when user doesn't have required permissions."""
    def __init__(self, message="Insufficient permissions", payload=None):
        super().__init__(message, status_code=403, payload=payload)

class ResourceNotFoundError(APIError):
    """Raised when requested resource is not found."""
    def __init__(self, message="Resource not found", payload=None):
        super().__init__(message, status_code=404, payload=payload)

class ModelError(APIError):
    """Raised when there's an error with the ML model."""
    def __init__(self, message="Model error occurred", payload=None):
        super().__init__(message, status_code=500, payload=payload)

class ScraperError(APIError):
    """Raised when there's an error with data scraping."""
    def __init__(self, message="Scraper error occurred", payload=None):
        super().__init__(message, status_code=500, payload=payload)

class ValidationError(APIError):
    """Raised when request validation fails."""
    def __init__(self, message="Validation failed", payload=None):
        super().__init__(message, status_code=400, payload=payload)

def register_error_handlers(app):
    """Register error handlers with the Flask app."""
    
    @app.errorhandler(APIError)
    def handle_api_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response
    
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify({
            'error': 'ValidationError',
            'message': 'Invalid request data',
            'details': error.messages
        }), 400
    
    @app.errorhandler(404)
    def handle_404(error):
        return jsonify({
            'error': 'NotFound',
            'message': 'Resource not found'
        }), 404
    
    @app.errorhandler(500)
    def handle_500(error):
        return jsonify({
            'error': 'InternalServerError',
            'message': 'An internal server error occurred'
        }), 500
    
    @app.errorhandler(Exception)
    def handle_generic_error(error):
        # Log the error here
        return jsonify({
            'error': 'InternalServerError',
            'message': 'An unexpected error occurred'
        }), 500 