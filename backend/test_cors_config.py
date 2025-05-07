"""Test script to verify CORS configuration is working properly."""
import requests
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Base URL for the API
BASE_URL = 'http://localhost:5000'

def test_preflight_request(endpoint):
    """Test OPTIONS preflight request to check CORS headers."""
    url = f"{BASE_URL}{endpoint}"
    logger.info(f"Testing preflight request to {url}")
    
    # Send OPTIONS request
    headers = {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
    
    response = requests.options(url, headers=headers)
    
    # Log response details
    logger.info(f"Status code: {response.status_code}")
    logger.info("Response headers:")
    for key, value in response.headers.items():
        logger.info(f"  {key}: {value}")
    
    # Check for CORS headers
    cors_headers = [
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Credentials',
        'Access-Control-Max-Age'
    ]
    
    missing_headers = [header for header in cors_headers if header not in response.headers]
    
    if missing_headers:
        logger.error(f"Missing CORS headers: {', '.join(missing_headers)}")
    else:
        logger.info("All required CORS headers are present")
    
    return response.status_code == 200 and not missing_headers

def test_post_request(endpoint, data):
    """Test POST request to check if CORS is working properly."""
    url = f"{BASE_URL}{endpoint}"
    logger.info(f"Testing POST request to {url}")
    
    headers = {
        'Origin': 'http://localhost:5173',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    # Log response details
    logger.info(f"Status code: {response.status_code}")
    logger.info("Response headers:")
    for key, value in response.headers.items():
        logger.info(f"  {key}: {value}")
    
    if response.status_code in (200, 201):
        logger.info(f"Response body: {json.dumps(response.json(), indent=2)}")
    else:
        logger.error(f"Request failed with status code {response.status_code}")
    
    return response.status_code in (200, 201)

def run_tests():
    """Run all CORS tests."""
    logger.info("=== Starting CORS Configuration Tests ===")
    
    # Test endpoints
    endpoints = [
        '/api/v1/auth/login',
        '/api/v1/auth/signup'
    ]
    
    test_data = {
        '/api/v1/auth/login': {
            'username': 'test@example.com',
            'password': 'password123'
        },
        '/api/v1/auth/signup': {
            'username': 'new@example.com',
            'password': 'newpassword123',
            'email': 'new@example.com'
        }
    }
    
    all_tests_passed = True
    
    for endpoint in endpoints:
        logger.info(f"\n=== Testing endpoint: {endpoint} ===")
        
        # Test preflight request
        preflight_passed = test_preflight_request(endpoint)
        
        # Test POST request
        post_passed = test_post_request(endpoint, test_data[endpoint])
        
        if preflight_passed and post_passed:
            logger.info(f"✅ All tests PASSED for {endpoint}")
        else:
            logger.error(f"❌ Tests FAILED for {endpoint}")
            all_tests_passed = False
    
    logger.info("\n=== CORS Configuration Test Summary ===")
    if all_tests_passed:
        logger.info("✅ All CORS tests PASSED!")
    else:
        logger.error("❌ Some CORS tests FAILED!")

if __name__ == '__main__':
    run_tests()