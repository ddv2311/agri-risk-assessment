"""Tests for risk assessment endpoints."""
import pytest
from flask import json
from datetime import datetime

def test_risk_assessment_valid_request(client, auth_headers, test_model_metadata, test_scraped_data):
    """Test risk assessment with valid request."""
    response = client.post('/api/v1/risk-assessment', 
        headers=auth_headers,
        json={
            'location': 'Gujarat',
            'crop': 'wheat',
            'scenario': 'normal'
        }
    )
    assert response.status_code == 200
    assert 'risk_score' in response.json
    assert 'risk_category' in response.json
    assert 'explanation' in response.json

def test_risk_assessment_invalid_scenario(client, auth_headers):
    """Test risk assessment with invalid scenario."""
    response = client.post('/api/v1/risk-assessment',
        headers=auth_headers,
        json={
            'location': 'Gujarat',
            'crop': 'wheat',
            'scenario': 'invalid'
        }
    )
    assert response.status_code == 400

def test_risk_assessment_missing_data(client, auth_headers):
    """Test risk assessment with missing data."""
    response = client.post('/api/v1/risk-assessment',
        headers=auth_headers,
        json={
            'location': 'Gujarat'
        }
    )
    assert response.status_code == 400

def test_model_retrain(client, admin_headers, test_scraped_data):
    """Test model retraining endpoint."""
    response = client.post('/api/v1/model/retrain',
        headers=admin_headers
    )
    assert response.status_code == 200
    assert 'metrics' in response.json

def test_model_retrain_unauthorized(client, auth_headers):
    """Test model retraining with non-admin user."""
    response = client.post('/api/v1/model/retrain',
        headers=auth_headers
    )
    assert response.status_code == 403

def test_get_model_summary(client, auth_headers, test_model_metadata):
    """Test getting model summary."""
    response = client.get('/api/v1/model/summary',
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json['version'] == test_model_metadata.version

def test_risk_assessment_with_additional_features(client, auth_headers):
    """Test risk assessment with additional features."""
    response = client.post('/api/v1/risk-assessment',
        headers=auth_headers,
        json={
            'location': 'Gujarat',
            'crop': 'wheat',
            'scenario': 'normal',
            'additional_features': {
                'soil_ph': 6.5,
                'irrigation_coverage': 0.8
            }
        }
    )
    assert response.status_code == 200
    assert 'risk_score' in response.json 