import os
import pandas as pd
import numpy as np
import requests
import logging
from datetime import datetime, timedelta
import json
import time
from bs4 import BeautifulSoup
import re
from typing import Dict, List, Optional, Tuple
from config import get_config

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DataCollector:
    """
    Collects data from various sources for agricultural risk assessment:
    - Open Government Data Platform India (data.gov.in)
    - India Meteorological Department (mausam.imd.gov.in)
    - Agricultural Marketing Information Network (agmarknet.gov.in)
    """
    
    def __init__(self, config=None):
        """
        Initialize the data collector.
        
        Args:
            config: Configuration object. If None, uses default config.
        """
        self.config = config or get_config()
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.dataset_dir = os.path.join(self.base_dir, 'datasets')
        
        # Create datasets directory if it doesn't exist
        if not os.path.exists(self.dataset_dir):
            os.makedirs(self.dataset_dir)
            
        # API endpoints and URLs
        self.data_gov_api_base = "https://api.data.gov.in/resource"
        self.imd_base_url = "https://mausam.imd.gov.in"
        self.agmarknet_base_url = "https://agmarknet.gov.in"
        
        # API keys and credentials
        self.data_gov_api_key = os.environ.get('DATA_GOV_API_KEY', self.config.DATA_GOV_API_KEY)
        self.imd_api_key = os.environ.get('IMD_API_KEY', self.config.IMD_API_KEY)
        
        # Headers for making requests
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Authorization': f'Bearer {self.data_gov_api_key}'
        }
        
        # Cache for API responses
        self.cache = {}
        self.cache_timeout = timedelta(hours=1)
        
        # Default region and crop for MVP
        self.default_region = self.config.DEFAULT_REGION
        self.default_crop = self.config.DEFAULT_CROP
    
    def collect_weather_data(self, region=None, start_date=None, end_date=None, use_cache=True) -> pd.DataFrame:
        """
        Collect weather data from IMD (India Meteorological Department)
        
        Args:
            region: Name of the region (e.g., 'Gujarat')
            start_date: Start date for data collection
            end_date: End date for data collection
            use_cache: Whether to use cached data if available
            
        Returns:
            DataFrame containing weather data
        """
        region = region or self.default_region
        
        # File path for cached data
        cache_file = os.path.join(self.dataset_dir, f'{region.lower()}_weather.csv')
        
        # Check if we can use cached data
        if use_cache and os.path.exists(cache_file):
            # Check if the cache is recent (less than 24 hours old)
            file_time = os.path.getmtime(cache_file)
            if (time.time() - file_time) < 86400:  # 24 hours in seconds
                logger.info(f"Using cached weather data for {region}")
                return pd.read_csv(cache_file)
        
        try:
            # For MVP, we'll attempt to scrape the IMD website
            # This is a simplified approach - in production, you'd want to use their API if available
            
            # Convert region to state code for IMD
            state_code = self._get_state_code(region)
            
            # IMD's regional weather page
            url = f"{self.imd_base_url}/en/weather/regional/{state_code.lower()}"
            
            logger.info(f"Fetching weather data from IMD for {region} ({url})")
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                # Parse the HTML content
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Extract weather data from the table
                # This is a simplified approach - actual implementation will depend on IMD's HTML structure
                weather_data = self._parse_imd_weather_table(soup, region)
                
                # Save to cache
                weather_data.to_csv(cache_file, index=False)
                
                logger.info(f"Successfully collected weather data for {region}: {len(weather_data)} records")
                return weather_data
            else:
                logger.warning(f"Failed to fetch weather data from IMD (status code: {response.status_code})")
                # Fall back to simulated data if web scraping fails
                return self._generate_simulated_weather_data(region)
                
        except Exception as e:
            logger.error(f"Error collecting weather data: {str(e)}")
            # Fall back to simulated data
            logger.info("Falling back to simulated weather data")
            return self._generate_simulated_weather_data(region)
    
    def collect_crop_price_data(self, crop=None, region=None, start_date=None, end_date=None, use_cache=True) -> pd.DataFrame:
        """
        Collect crop price data from Agmarknet (Agricultural Marketing Information Network)
        
        Args:
            crop: Name of the crop (e.g., 'wheat')
            region: Name of the region (e.g., 'Gujarat')
            start_date: Start date for data collection
            end_date: End date for data collection
            use_cache: Whether to use cached data if available
            
        Returns:
            DataFrame containing crop price data
        """
        crop = crop or self.default_crop
        region = region or self.default_region
        
        # File path for cached data
        cache_file = os.path.join(self.dataset_dir, f'{crop.lower()}_{region.lower()}_prices.csv')
        
        # Check if we can use cached data
        if use_cache and os.path.exists(cache_file):
            # Check if the cache is recent (less than 24 hours old)
            file_time = os.path.getmtime(cache_file)
            if (time.time() - file_time) < 86400:  # 24 hours in seconds
                logger.info(f"Using cached price data for {crop} in {region}")
                return pd.read_csv(cache_file)
        
        try:
            # Agmarknet search URL for commodity prices
            url = f"{self.agmarknet_base_url}/SearchCmmMkt.aspx"
            
            # Set default dates if not provided
            if not start_date:
                start_date = datetime.now() - timedelta(days=30)  # Last 30 days
            if not end_date:
                end_date = datetime.now()
                
            # Format dates for Agmarknet's form
            from_date = start_date.strftime("%d-%b-%Y")
            to_date = end_date.strftime("%d-%b-%Y")
            
            # Get state and district codes for Agmarknet
            state_code = self._get_agmarknet_state_code(region)
            
            # Prepare form data for POST request
            form_data = {
                'cboState': state_code,
                'cboDistrict': 'ALL',
                'cboMarket': 'ALL',
                'cboCommodity': self._get_agmarknet_commodity_code(crop),
                'cboVariety': 'ALL',
                'dateFrom': from_date,
                'dateTo': to_date,
                'btnSubmit': 'Submit'
            }
            
            logger.info(f"Fetching price data from Agmarknet for {crop} in {region}")
            
            # This is where the actual web scraping would happen
            # For MVP, we'll simulate this since Agmarknet might require session handling
            # and more complex form submission
            
            # Fall back to simulated data for MVP
            logger.info("Using simulated price data for MVP")
            price_data = self._generate_simulated_price_data(crop, region)
            
            # Save to cache
            price_data.to_csv(cache_file, index=False)
            
            return price_data
                
        except Exception as e:
            logger.error(f"Error collecting price data: {str(e)}")
            # Fall back to simulated data
            logger.info("Falling back to simulated price data")
            return self._generate_simulated_price_data(crop, region)
    
    def collect_crop_yield_data(self, crop=None, region=None, use_cache=True) -> pd.DataFrame:
        """
        Collect crop yield data from data.gov.in
        
        Args:
            crop: Name of the crop (e.g., 'wheat')
            region: Name of the region (e.g., 'Gujarat')
            use_cache: Whether to use cached data if available
            
        Returns:
            DataFrame containing crop yield data
        """
        crop = crop or self.default_crop
        region = region or self.default_region
        
        # File path for cached data
        cache_file = os.path.join(self.dataset_dir, f'{crop.lower()}_{region.lower()}_yields.csv')
        
        # Check if we can use cached data
        if use_cache and os.path.exists(cache_file):
            # Cache for yield data can be longer since it doesn't change as frequently
            file_time = os.path.getmtime(cache_file)
            if (time.time() - file_time) < 604800:  # 7 days in seconds
                logger.info(f"Using cached yield data for {crop} in {region}")
                return pd.read_csv(cache_file)
        
        try:
            # Data.gov.in API for crop production
            # Resource ID for crop production dataset
            # This is a placeholder - you'll need to find the actual resource ID
            resource_id = "9ef84268-d588-465a-a308-a864a43d0070"
            
            # Construct API URL
            api_url = f"{self.data_gov_api_base}/{resource_id}/api/action/datastore_search"
            
            # Query parameters
            params = {
                'api-key': self.data_gov_api_key,
                'filters': json.dumps({
                    'State_Name': region,
                    'Crop': crop
                }),
                'limit': 100
            }
            
            logger.info(f"Fetching yield data from data.gov.in for {crop} in {region}")
            
            # For MVP, let's simulate this since we might not have an API key yet
            # In production, you would use:
            # response = requests.get(api_url, params=params, headers=self.headers)
            
            # Fall back to simulated data for MVP
            logger.info("Using simulated yield data for MVP")
            yield_data = self._generate_simulated_yield_data(crop, region)
            
            # Save to cache
            yield_data.to_csv(cache_file, index=False)
            
            return yield_data
                
        except Exception as e:
            logger.error(f"Error collecting yield data: {str(e)}")
            # Fall back to simulated data
            logger.info("Falling back to simulated yield data")
            return self._generate_simulated_yield_data(crop, region)
    
    def _parse_imd_weather_table(self, soup, region):
        """Parse weather data from IMD's HTML table"""
        # This is a placeholder implementation
        # Actual implementation would depend on IMD's HTML structure
        
        # For MVP, we'll return a simulated dataset
        return self._generate_simulated_weather_data(region)
    
    def _get_state_code(self, region):
        """Get state code for IMD website"""
        # Map region names to IMD's state codes
        state_codes = {
            'Gujarat': 'guj',
            'Maharashtra': 'mah',
            'Punjab': 'pun',
            'Haryana': 'har',
            'Uttar Pradesh': 'upr'
        }
        
        return state_codes.get(region, 'guj')  # Default to Gujarat
    
    def _get_agmarknet_state_code(self, region):
        """Get state code for Agmarknet website"""
        # Map region names to Agmarknet's state codes
        # These are placeholder values - you'd need to inspect Agmarknet's form to get actual codes
        state_codes = {
            'Gujarat': '10',
            'Maharashtra': '19',
            'Punjab': '28',
            'Haryana': '12',
            'Uttar Pradesh': '34'
        }
        
        return state_codes.get(region, '10')  # Default to Gujarat
    
    def _get_agmarknet_commodity_code(self, crop):
        """Get commodity code for Agmarknet website"""
        # Map crop names to Agmarknet's commodity codes
        # These are placeholder values - you'd need to inspect Agmarknet's form to get actual codes
        commodity_codes = {
            'wheat': '1',
            'rice': '2',
            'cotton': '31',
            'sugarcane': '99',
            'maize': '3'
        }
        
        return commodity_codes.get(crop.lower(), '1')  # Default to wheat
    
    def _generate_simulated_weather_data(self, region):
        """Generate simulated weather data for demo purposes"""
        # Create a date range for the past 5 years
        end_date = datetime.now()
        start_date = end_date - timedelta(days=5*365)
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        
        # Create simulated weather data
        data = {
            'date': date_range,
            'temperature': [round(20 + 10 * np.random.normal(0, 0.5), 1) for _ in range(len(date_range))],
            'rainfall': [max(0, round(5 + 10 * np.random.normal(0, 1), 1)) for _ in range(len(date_range))],
            'humidity': [round(60 + 20 * np.random.normal(0, 0.5), 1) for _ in range(len(date_range))]
        }
        
        # Convert to DataFrame and save to CSV
        df = pd.DataFrame(data)
        csv_file = os.path.join(self.dataset_dir, f'{region.lower()}_weather.csv')
        df.to_csv(csv_file, index=False)
        
        return df
    
    def _generate_simulated_price_data(self, crop, region):
        """Generate simulated crop price data for demo purposes"""
        # Create a date range for the past 5 years (monthly data)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=5*365)
        date_range = pd.date_range(start=start_date, end=end_date, freq='M')
        
        # Create simulated price data with seasonality and trend
        base_price = 1500  # Base price for wheat in INR per quintal
        if crop.lower() == 'rice':
            base_price = 1800
        elif crop.lower() == 'cotton':
            base_price = 5500
        elif crop.lower() == 'sugarcane':
            base_price = 300
        elif crop.lower() == 'maize':
            base_price = 1200
        
        # Add seasonality and random fluctuations
        month_effects = {1: 0.05, 2: 0.03, 3: 0.0, 4: -0.02, 5: -0.05, 
                         6: -0.03, 7: 0.0, 8: 0.02, 9: 0.03, 10: 0.05, 11: 0.02, 12: 0.0}
        
        prices = []
        for date in date_range:
            month = date.month
            year_effect = 0.03 * (date.year - start_date.year)  # 3% annual increase
            season_effect = month_effects[month]
            random_effect = np.random.normal(0, 0.05)
            
            price = base_price * (1 + year_effect + season_effect + random_effect)
            prices.append(round(price, 2))
        
        # Convert to DataFrame and save to CSV
        data = {
            'date': date_range,
            'price': prices
        }
        df = pd.DataFrame(data)
        csv_file = os.path.join(self.dataset_dir, f'{crop.lower()}_{region.lower()}_prices.csv')
        df.to_csv(csv_file, index=False)
        
        return df
    
    def _generate_simulated_yield_data(self, crop, region):
        """Generate simulated crop yield data for demo purposes"""
        # Create a date range for the past 5 years (yearly data)
        end_year = datetime.now().year
        start_year = end_year - 10
        years = list(range(start_year, end_year + 1))
        
        # Create simulated yield data with trend and random fluctuations
        base_yield = 30  # Base yield for wheat in quintals per hectare
        if crop.lower() == 'rice':
            base_yield = 25
        elif crop.lower() == 'cotton':
            base_yield = 15
        elif crop.lower() == 'sugarcane':
            base_yield = 700
        elif crop.lower() == 'maize':
            base_yield = 22
        
        yields = []
        for year in years:
            year_effect = 0.01 * (year - start_year)  # 1% annual increase due to technology
            random_effect = np.random.normal(0, 0.1)  # Random weather/pest effects
            
            yield_value = base_yield * (1 + year_effect + random_effect)
            yields.append(round(yield_value, 2))
        
        # Convert to DataFrame and save to CSV
        data = {
            'year': years,
            'yield': yields
        }
        df = pd.DataFrame(data)
        csv_file = os.path.join(self.dataset_dir, f'{crop.lower()}_{region.lower()}_yields.csv')
        df.to_csv(csv_file, index=False)
        
        return df