"""Base scraper class with common functionality."""
import logging
from datetime import datetime
import requests
from typing import Dict, Any, Optional
import time

class BaseScraper:
    def __init__(self, base_url: str, rate_limit: float = 1.0):
        self.base_url = base_url
        self.rate_limit = rate_limit
        self.last_request_time = 0
        self.session = requests.Session()
        
        # Setup logging
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.setLevel(logging.INFO)
        
    def _respect_rate_limit(self):
        """Ensure we don't exceed the rate limit."""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        if time_since_last_request < self.rate_limit:
            time.sleep(self.rate_limit - time_since_last_request)
        self.last_request_time = time.time()
    
    def make_request(self, endpoint: str, method: str = 'GET', 
                    params: Optional[Dict[str, Any]] = None, 
                    headers: Optional[Dict[str, Any]] = None) -> requests.Response:
        """Make an HTTP request with rate limiting and error handling."""
        self._respect_rate_limit()
        
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error making request to {url}: {str(e)}")
            raise
    
    def save_data(self, data: Dict[str, Any], category: str):
        """Save scraped data with timestamp."""
        timestamp = datetime.now().isoformat()
        # TODO: Implement data storage logic (database/file system)
        self.logger.info(f"Saved {category} data at {timestamp}")
        return data 