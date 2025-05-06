"""Tests for authentication endpoints."""
import pytest
from flask import json

def test_login_success(client, test_user):
    """Test successful login."""
    response = client.post('/api/v1/auth/login', json={
        'username': 'testuser',
        'password': 'password123'
    })
    assert response.status_code == 200
    assert 'access_token' in response.json

def test_login_invalid_credentials(client, test_user):
    """Test login with invalid credentials."""
    response = client.post('/api/v1/auth/login', json={
        'username': 'testuser',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401

def test_protected_route_with_token(client, auth_headers):
    """Test accessing protected route with valid token."""
    response = client.get('/api/v1/users/me', headers=auth_headers)
    assert response.status_code == 200

def test_protected_route_without_token(client):
    """Test accessing protected route without token."""
    response = client.get('/api/v1/users/me')
    assert response.status_code == 401

def test_admin_route_with_admin_token(client, admin_headers):
    """Test accessing admin route with admin token."""
    response = client.get('/api/v1/admin/users', headers=admin_headers)
    assert response.status_code == 200

def test_admin_route_with_user_token(client, auth_headers):
    """Test accessing admin route with user token."""
    response = client.get('/api/v1/admin/users', headers=auth_headers)
    assert response.status_code == 403 