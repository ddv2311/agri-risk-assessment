"""Test script for API endpoints."""
import unittest
import json
import os
import sys
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models.xgboost_model import RiskAssessmentModel
from data.preprocessing import DataPreprocessor
from data.storage import DataStorage

class TestAPI(unittest.TestCase):
    """Test cases for API endpoints."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment."""
        # Create test app
        cls.app = create_app('testing')
        cls.client = cls.app.test_client()
        
        # Initialize components
        cls.model = RiskAssessmentModel()
        cls.preprocessor = DataPreprocessor()
        cls.storage = DataStorage('test_data.db')
        
        # Generate test data
        cls._generate_test_data()
    
    @classmethod
    def tearDownClass(cls):
        """Clean up test environment."""
        # Remove test database
        if os.path.exists('test_data.db'):
            os.remove('test_data.db')
    
    @classmethod
    def _generate_test_data(cls):
        """Generate test data for the database."""
        # Generate weather data
        dates = pd.date_range(
            end=datetime.now(),
            periods=30,
            freq='D'
        )
        weather_data = pd.DataFrame({
            'date': dates,
            'avg_temp': np.random.normal(25, 5, 30),
            'max_temp': np.random.normal(30, 5, 30),
            'min_temp': np.random.normal(20, 5, 30),
            'rainfall': np.random.gamma(2, 2, 30),
            'humidity': np.random.normal(60, 10, 30),
            'wind_speed': np.random.normal(10, 3, 30)
        })
        cls.storage.save_weather_data(weather_data, 'TestLocation')
        
        # Generate market data
        market_data = pd.DataFrame({
            'date': dates,
            'price': np.random.normal(100, 10, 30),
            'volume': np.random.normal(1000, 200, 30),
            'demand': np.random.normal(800, 100, 30),
            'supply': np.random.normal(900, 150, 30)
        })
        cls.storage.save_market_data(market_data, 'TestLocation', 'wheat')
        
        # Generate soil data
        soil_data = pd.DataFrame({
            'location': ['TestLocation'],
            'ph': [6.5],
            'nitrogen': [40],
            'phosphorus': [30],
            'potassium': [200],
            'organic_matter': [2.5],
            'moisture': [25]
        })
        cls.storage.save_soil_data(soil_data, 'TestLocation')
    
    def test_health_check(self):
        """Test health check endpoint."""
        response = self.client.get('/api/v1/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('timestamp', data)
    
    def test_login(self):
        """Test login endpoint."""
        response = self.client.post('/api/v1/login', json={
            'username': 'demo@ignosis.ai',
            'password': 'demo123'
        })
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('access_token', data)
        self.assertIn('user', data)
    
    def test_protected_route(self):
        """Test protected route with authentication."""
        # First login to get token
        login_response = self.client.post('/api/v1/login', json={
            'username': 'demo@ignosis.ai',
            'password': 'demo123'
        })
        token = json.loads(login_response.data)['access_token']
        
        # Test protected route
        response = self.client.get(
            '/api/v1/protected',
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('logged_in_as', data)
    
    def test_risk_assessment(self):
        """Test risk assessment endpoint."""
        # First login to get token
        login_response = self.client.post('/api/v1/login', json={
            'username': 'demo@ignosis.ai',
            'password': 'demo123'
        })
        token = json.loads(login_response.data)['access_token']
        
        # Test risk assessment
        response = self.client.post(
            '/api/v1/risk-assessment',
            json={
                'location': 'TestLocation',
                'crop': 'wheat',
                'scenario': 'normal'
            },
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('risk_score', data)
        self.assertIn('risk_category', data)
        self.assertIn('explanation', data)
        self.assertIn('contributing_factors', data)
        self.assertIn('metadata', data)
    
    def test_model_summary(self):
        """Test model summary endpoint."""
        # First login to get token
        login_response = self.client.post('/api/v1/login', json={
            'username': 'demo@ignosis.ai',
            'password': 'demo123'
        })
        token = json.loads(login_response.data)['access_token']
        
        # Test model summary
        response = self.client.get(
            '/api/v1/model/summary',
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('model_type', data)
        self.assertIn('feature_count', data)
        self.assertIn('feature_importance', data)
        self.assertIn('parameters', data)
    
    def test_api_docs(self):
        """Test API documentation endpoint."""
        response = self.client.get('/api/v1/api-docs')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('version', data)
        self.assertIn('endpoints', data)

if __name__ == '__main__':
    unittest.main() 