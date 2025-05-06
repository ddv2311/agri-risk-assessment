"""Scheduler for running scrapers periodically."""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging
from typing import Dict, Any
import json
from datetime import datetime
import os

from .weather_scraper import IMDWeatherScraper
from .agmarknet_scraper import AgmarknetScraper
from .data_gov_scraper import DataGovScraper

class ScraperScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        
        # Initialize scrapers
        self.weather_scraper = IMDWeatherScraper()
        self.agmarknet_scraper = AgmarknetScraper()
        self.data_gov_scraper = DataGovScraper()
        
        # Create data directory if it doesn't exist
        self.data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        os.makedirs(self.data_dir, exist_ok=True)

    def start(self):
        """Start the scheduler with predefined jobs."""
        try:
            # Weather data - every 3 hours
            self.scheduler.add_job(
                self._fetch_weather_data,
                CronTrigger(hour='*/3'),
                name='weather_scraper'
            )
            
            # Commodity prices - twice daily (market opening and closing)
            self.scheduler.add_job(
                self._fetch_commodity_prices,
                CronTrigger(hour='9,17'),
                name='price_scraper'
            )
            
            # Crop production and soil health - daily
            self.scheduler.add_job(
                self._fetch_agricultural_data,
                CronTrigger(hour=0),
                name='agricultural_data_scraper'
            )
            
            self.scheduler.start()
            self.logger.info("Scheduler started successfully")
            
        except Exception as e:
            self.logger.error(f"Error starting scheduler: {str(e)}")
            raise

    def stop(self):
        """Stop the scheduler."""
        self.scheduler.shutdown()
        self.logger.info("Scheduler stopped")

    def _fetch_weather_data(self):
        """Fetch weather data for configured regions."""
        try:
            regions = ["Gujarat"]  # Add more regions as needed
            for region in regions:
                data = self.weather_scraper.get_weather_data(region=region)
                self._save_to_file(data, f"weather_{region.lower()}")
        except Exception as e:
            self.logger.error(f"Error in weather data job: {str(e)}")

    def _fetch_commodity_prices(self):
        """Fetch commodity prices for configured items."""
        try:
            commodities = ["wheat"]  # Add more commodities as needed
            state = "Gujarat"  # Add more states as needed
            for commodity in commodities:
                data = self.agmarknet_scraper.get_commodity_prices(
                    commodity=commodity,
                    state=state
                )
                self._save_to_file(data, f"prices_{commodity.lower()}")
        except Exception as e:
            self.logger.error(f"Error in commodity prices job: {str(e)}")

    def _fetch_agricultural_data(self):
        """Fetch agricultural data from data.gov.in."""
        try:
            # Fetch crop production data
            production_data = self.data_gov_scraper.get_crop_production(
                state="Gujarat",
                crop="wheat"
            )
            self._save_to_file(production_data, "crop_production")
            
            # Fetch soil health data
            soil_data = self.data_gov_scraper.get_soil_health(
                state="Gujarat"
            )
            self._save_to_file(soil_data, "soil_health")
            
        except Exception as e:
            self.logger.error(f"Error in agricultural data job: {str(e)}")

    def _save_to_file(self, data: Dict[str, Any], prefix: str):
        """Save scraped data to JSON file with timestamp."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{prefix}_{timestamp}.json"
        filepath = os.path.join(self.data_dir, filename)
        
        try:
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
            self.logger.info(f"Data saved to {filepath}")
        except Exception as e:
            self.logger.error(f"Error saving data to {filepath}: {str(e)}")

# Singleton instance
scheduler = ScraperScheduler() 