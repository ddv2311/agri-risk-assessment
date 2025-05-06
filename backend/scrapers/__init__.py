"""
Data scraping package for agricultural and weather data.
Provides scrapers for IMD weather data, Agmarknet commodity prices,
and data.gov.in agricultural datasets.
"""

from .base_scraper import BaseScraper
from .weather_scraper import IMDWeatherScraper
from .agmarknet_scraper import AgmarknetScraper
from .data_gov_scraper import DataGovScraper
from .scheduler import scheduler

__all__ = [
    'BaseScraper',
    'IMDWeatherScraper',
    'AgmarknetScraper',
    'DataGovScraper',
    'scheduler'
]

# Version info
__version__ = '0.1.0' 