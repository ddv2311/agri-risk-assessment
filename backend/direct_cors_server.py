"""
Direct HTTP server that handles CORS without Flask middleware.
This uses Python's built-in http.server to ensure headers are not modified.
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class CORSRequestHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        """Set CORS headers explicitly without any middleware interference."""
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:5173')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Content-Type', 'application/json')
    
    def do_OPTIONS(self):
        """Handle preflight OPTIONS requests."""
        logger.debug(f"Received OPTIONS request to {self.path}")
        logger.debug(f"Headers: {dict(self.headers)}")
        
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
        
        logger.debug("Sent OPTIONS response with CORS headers")
    
    def do_POST(self):
        """Handle POST requests."""
        logger.debug(f"Received POST request to {self.path}")
        logger.debug(f"Headers: {dict(self.headers)}")
        
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(post_data) if post_data else {}
            logger.debug(f"Received data: {data}")
            
            if self.path == '/api/v1/auth/signup':
                response_data = {
                    "access_token": "test_token_123",
                    "user": {
                        "email": data.get('username', 'test@example.com'),
                        "role": "user",
                        "id": "test-user-id"
                    },
                    "message": "Test signup successful"
                }
                self.send_response(201)
                
            elif self.path == '/api/v1/auth/login':
                # Check credentials
                if data.get('username') == 'test@example.com' and data.get('password') == 'password123':
                    response_data = {
                        "access_token": "test_token_123",
                        "user": {
                            "email": "test@example.com",
                            "role": "user",
                            "id": "test-user-id"
                        }
                    }
                    self.send_response(200)
                else:
                    response_data = {"error": "Invalid credentials"}
                    self.send_response(401)
            else:
                response_data = {"error": "Endpoint not found"}
                self.send_response(404)
            
            self._set_cors_headers()
            self.end_headers()
            
            response_json = json.dumps(response_data)
            self.wfile.write(response_json.encode('utf-8'))
            
            logger.debug(f"Sent response: {response_json}")
            
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            self.send_response(500)
            self._set_cors_headers()
            self.end_headers()
            
            error_response = json.dumps({"error": str(e)})
            self.wfile.write(error_response.encode('utf-8'))

def run_server(port=5000):
    """Run the HTTP server."""
    server_address = ('', port)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    print(f"Starting direct CORS server on http://localhost:{port}")
    print("Test credentials: test@example.com / password123")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
