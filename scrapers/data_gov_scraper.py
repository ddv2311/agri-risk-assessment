"""Data.gov.in API scraper for agricultural data."""
from .base_scraper import BaseScraper
from typing import Dict, Any, List, Optional
import pandas as pd
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

class DataGovScraper(BaseScraper):
    def __init__(self):
        super().__init__(base_url="https://api.data.gov.in/resource")
        self.api_key = os.getenv("DATA_GOV_API_KEY")
        if not self.api_key:
            raise ValueError("DATA_GOV_API_KEY environment variable is required")
        
        self.headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

    def get_crop_production(self, state: str = "Gujarat", crop: str = "wheat", 
                          year: Optional[int] = None) -> Dict[str, Any]:
        """
        Fetch crop production data from data.gov.in
        """
        try:
            params = {
                "api-key": self.api_key,
                "format": "json",
                "filters[state]": state,
                "filters[crop]": crop,
                "limit": 100
            }
            if year:
                params["filters[year]"] = year

            response = self.make_request(
                endpoint="/crop_production",  # Example endpoint
                params=params,
                headers=self.headers
            )
            
            data = response.json()
            
            production_data = {
                "timestamp": datetime.now().isoformat(),
                "state": state,
                "crop": crop,
                "year": year,
                "records": self._process_production_data(data)
            }
            
            return self.save_data(production_data, "crop_production")
            
        except Exception as e:
            self.logger.error(f"Error fetching crop production data: {str(e)}")
            raise

    def get_soil_health(self, state: str = "Gujarat", district: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch soil health data from data.gov.in
        """
        try:
            params = {
                "api-key": self.api_key,
                "format": "json",
                "filters[state]": state,
                "limit": 100
            }
            if district:
                params["filters[district]"] = district

            response = self.make_request(
                endpoint="/soil_health",  # Example endpoint
                params=params,
                headers=self.headers
            )
            
            data = response.json()
            
            soil_data = {
                "timestamp": datetime.now().isoformat(),
                "state": state,
                "district": district,
                "records": self._process_soil_data(data)
            }
            
            return self.save_data(soil_data, "soil_health")
            
        except Exception as e:
            self.logger.error(f"Error fetching soil health data: {str(e)}")
            raise

    def _process_production_data(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process and clean crop production data."""
        records = []
        try:
            for record in data.get("records", []):
                processed_record = {
                    "year": record.get("year"),
                    "production": float(record.get("production", 0)),
                    "area": float(record.get("area", 0)),
                    "yield": float(record.get("yield", 0))
                }
                records.append(processed_record)
        except Exception as e:
            self.logger.error(f"Error processing production data: {str(e)}")
        
        return records

    def _process_soil_data(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process and clean soil health data."""
        records = []
        try:
            for record in data.get("records", []):
                processed_record = {
                    "ph_value": float(record.get("ph_value", 0)),
                    "organic_carbon": float(record.get("organic_carbon", 0)),
                    "nitrogen": float(record.get("nitrogen", 0)),
                    "phosphorus": float(record.get("phosphorus", 0)),
                    "potassium": float(record.get("potassium", 0))
                }
                records.append(processed_record)
        except Exception as e:
            self.logger.error(f"Error processing soil data: {str(e)}")
        
        return records 