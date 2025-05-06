import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

from backend.scrapers.base import BaseScraper
from backend.scrapers.weather import WeatherScraper
from backend.scrapers.market import MarketScraper
from backend.models.database import ScrapedData

class TestBaseScraper:
    """Test base scraper functionality."""
    
    def test_rate_limiting(self):
        """Test rate limiting mechanism."""
        scraper = BaseScraper()
        start_time = datetime.now()
        
        # Make multiple requests
        for _ in range(3):
            scraper._make_request('http://test.com')
        
        end_time = datetime.now()
        # Should take at least 2 seconds due to rate limiting
        assert (end_time - start_time).total_seconds() >= 2
    
    def test_error_handling(self):
        """Test error handling in requests."""
        scraper = BaseScraper()
        with pytest.raises(Exception):
            scraper._make_request('http://invalid-url')

class TestWeatherScraper:
    """Test weather data scraper."""
    
    @patch('requests.get')
    def test_fetch_weather_data(self, mock_get):
        """Test weather data fetching."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'temperature': 25.5,
            'humidity': 65,
            'rainfall': 0
        }
        mock_get.return_value = mock_response
        
        scraper = WeatherScraper()
        data = scraper.fetch_data('Gujarat')
        
        assert 'temperature' in data
        assert 'humidity' in data
        assert 'rainfall' in data
    
    def test_data_validation(self):
        """Test weather data validation."""
        scraper = WeatherScraper()
        with pytest.raises(ValueError):
            scraper._validate_weather_data({})

class TestMarketScraper:
    """Test market data scraper."""
    
    @patch('requests.get')
    def test_fetch_market_data(self, mock_get):
        """Test market data fetching."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'commodity': 'wheat',
            'price': 2500,
            'volume': 1000
        }
        mock_get.return_value = mock_response
        
        scraper = MarketScraper()
        data = scraper.fetch_data('wheat', 'Gujarat')
        
        assert 'price' in data
        assert 'volume' in data
    
    def test_price_validation(self):
        """Test price data validation."""
        scraper = MarketScraper()
        with pytest.raises(ValueError):
            scraper._validate_price_data({})

def test_data_storage(db_session):
    """Test storing scraped data in database."""
    data = ScrapedData(
        source='weather',
        data_type='daily',
        location='Gujarat',
        timestamp=datetime.utcnow(),
        data={
            'temperature': 25.5,
            'humidity': 65
        }
    )
    db_session.session.add(data)
    db_session.session.commit()
    
    stored_data = ScrapedData.query.filter_by(source='weather').first()
    assert stored_data is not None
    assert stored_data.data['temperature'] == 25.5

def test_data_retrieval(db_session, test_scraped_data):
    """Test retrieving scraped data."""
    data = ScrapedData.query.filter_by(
        source='weather',
        location='Gujarat'
    ).first()
    
    assert data is not None
    assert data.data['temperature'] == 25.5
    assert data.data['humidity'] == 65