"""
Feature engineering module for agricultural risk assessment.
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from config import get_config

config = get_config()

class FeatureEngineer:
    """
    Class for generating features from raw data.
    """
    
    def __init__(self):
        """
        Initialize the feature engineer.
        """
        self.config = config
        self.features = self.config.FEATURES
        self.risk_thresholds = self.config.RISK_THRESHOLDS
        
    def calculate_yield_variability(self, yield_data: pd.DataFrame) -> float:
        """
        Calculate crop yield variability.
        
        Args:
            yield_data: DataFrame containing yield data with columns ['year', 'yield']
            
        Returns:
            float: Coefficient of variation of yields
        """
        yields = yield_data['yield']
        mean_yield = yields.mean()
        std_yield = yields.std()
        
        # Calculate coefficient of variation (CV)
        cv = (std_yield / mean_yield) * 100
        return cv
    
    def calculate_rainfall_deviation(self, weather_data: pd.DataFrame) -> float:
        """
        Calculate rainfall deviation from historical average.
        
        Args:
            weather_data: DataFrame containing weather data with columns ['date', 'rainfall']
            
        Returns:
            float: Standardized rainfall deviation
        """
        # Calculate monthly rainfall
        monthly_rainfall = weather_data.groupby(weather_data['date'].dt.to_period('M'))['rainfall'].sum()
        
        # Calculate historical average and standard deviation
        avg_rainfall = monthly_rainfall.mean()
        std_rainfall = monthly_rainfall.std()
        
        # Calculate standardized deviation for the most recent month
        recent_rainfall = monthly_rainfall.iloc[-1]
        deviation = (recent_rainfall - avg_rainfall) / std_rainfall
        
        return deviation
    
    def calculate_temperature_anomalies(self, weather_data: pd.DataFrame) -> float:
        """
        Calculate temperature anomalies.
        
        Args:
            weather_data: DataFrame containing weather data with columns ['date', 'temperature']
            
        Returns:
            float: Temperature anomaly score
        """
        # Calculate monthly average temperatures
        monthly_temps = weather_data.groupby(weather_data['date'].dt.to_period('M'))['temperature'].mean()
        
        # Calculate historical average and standard deviation
        avg_temp = monthly_temps.mean()
        std_temp = monthly_temps.std()
        
        # Calculate standardized anomaly for the most recent month
        recent_temp = monthly_temps.iloc[-1]
        anomaly = (recent_temp - avg_temp) / std_temp
        
        return anomaly
    
    def calculate_price_volatility(self, price_data: pd.DataFrame) -> float:
        """
        Calculate commodity price volatility.
        
        Args:
            price_data: DataFrame containing price data with columns ['date', 'price']
            
        Returns:
            float: Price volatility score
        """
        # Calculate monthly prices
        monthly_prices = price_data.groupby(price_data['date'].dt.to_period('M'))['price'].mean()
        
        # Calculate percentage change
        returns = monthly_prices.pct_change()
        
        # Calculate volatility (standard deviation of returns)
        volatility = returns.std() * np.sqrt(12)  # Annualize monthly volatility
        
        return volatility
    
    def generate_features(self, 
                         yield_data: pd.DataFrame, 
                         weather_data: pd.DataFrame, 
                         price_data: pd.DataFrame) -> Dict[str, float]:
        """
        Generate all features for risk assessment.
        
        Args:
            yield_data: DataFrame containing yield data
            weather_data: DataFrame containing weather data
            price_data: DataFrame containing price data
            
        Returns:
            dict: Dictionary of feature names and values
        """
        features = {
            'crop_yield_variability': self.calculate_yield_variability(yield_data),
            'rainfall_deviation': self.calculate_rainfall_deviation(weather_data),
            'temperature_anomalies': self.calculate_temperature_anomalies(weather_data),
            'price_volatility': self.calculate_price_volatility(price_data)
        }
        
        return features
    
    def get_risk_category(self, risk_score: float) -> str:
        """
        Convert risk score to category.
        
        Args:
            risk_score: Float between 0 and 1
            
        Returns:
            str: Risk category (low, medium, high)
        """
        for category, (low, high) in self.risk_thresholds.items():
            if low <= risk_score < high:
                return category
        return 'high'  # Default to high risk if score is exactly 1.0
    
    def generate_risk_explanation(self, 
                                 risk_category: str, 
                                 features: Dict[str, float], 
                                 scenario: str) -> str:
        """
        Generate human-readable explanation for risk assessment.
        
        Args:
            risk_category: Risk category (low, medium, high)
            features: Dictionary of feature values
            scenario: Risk scenario (e.g., 'drought', 'normal')
            
        Returns:
            str: Risk explanation
        """
        explanations = []
        
        # Analyze features
        if features['crop_yield_variability'] > 30:  # High yield variability
            explanations.append("High yield variability indicates unstable production")
        
        if features['rainfall_deviation'] < -1:  # Significant rainfall deficit
            explanations.append("Significant rainfall deficit")
        elif features['rainfall_deviation'] > 1:  # Excessive rainfall
            explanations.append("Excessive rainfall")
        
        if features['temperature_anomalies'] > 1:  # High temperature
            explanations.append("Higher than normal temperatures")
        elif features['temperature_anomalies'] < -1:  # Low temperature
            explanations.append("Lower than normal temperatures")
        
        if features['price_volatility'] > 0.1:  # High price volatility
            explanations.append("High price volatility")
        
        # Add scenario-specific context
        if scenario == 'drought':
            explanations.append("Drought conditions are expected")
        elif scenario == 'flood':
            explanations.append("Flood conditions are expected")
        
        # Generate final explanation
        explanation = f"{risk_category.title()} risk due to: {', '.join(explanations)}"
        return explanation
