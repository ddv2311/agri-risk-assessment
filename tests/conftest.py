"""Test configuration and fixtures."""
import os
import pytest
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app
from models.xgboost_model import RiskAssessmentModel
from data.preprocessing import DataPreprocessor
from data.storage import DataStorage

@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    app = create_app('testing')
    return app

@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    """Get authentication headers for protected routes."""
    response = client.post('/api/v1/login', json={
        'username': 'demo@ignosis.ai',
        'password': 'demo123'
    })
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def model():
    """Create a test model instance."""
    return RiskAssessmentModel()

@pytest.fixture
def preprocessor():
    """Create a test preprocessor instance."""
    return DataPreprocessor()

@pytest.fixture
def storage():
    """Create a test storage instance."""
    storage = DataStorage('test_data.db')
    yield storage
    # Cleanup after tests
    if os.path.exists('test_data.db'):
        os.remove('test_data.db') 