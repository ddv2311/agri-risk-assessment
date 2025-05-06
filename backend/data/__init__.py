"""
Data management package for Agricultural Risk Assessment.
Handles data storage, preprocessing, and access to scraped
agricultural, weather, and market data.
"""

from .storage import DataStorage
from .data_collector import DataCollector
from .preprocessing import DataPreprocessor

__all__ = [
    'DataStorage',
    'DataCollector',
    'DataPreprocessor'
]

# Version info
__version__ = '0.1.0'

# Data configuration
DEFAULT_DATA_CONFIG = {
    'storage_format': 'json',
    'data_retention_days': 30,  # How long to keep historical data
    'backup_enabled': True,
    'compression_enabled': True
}
