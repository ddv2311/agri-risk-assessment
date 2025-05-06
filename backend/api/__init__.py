"""
API package for the Agricultural Risk Assessment Tool.
Contains Flask routes and endpoints for risk assessment,
data retrieval, and model predictions.
"""

from flask import Blueprint

# Create API blueprint
api_bp = Blueprint('api', __name__)

# Import routes after Blueprint creation to avoid circular imports
from api import routes

__all__ = ['api_bp']

# Version info
__version__ = '0.1.0'
