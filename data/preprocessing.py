"""Data preprocessing module for agricultural risk assessment."""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any
from datetime import datetime, timedelta
import os
import json
from sklearn.preprocessing import StandardScaler, LabelEncoder
import logging

logger = logging.getLogger(__name__)

class DataPreprocessor:
    """Handles data preprocessing for agricultural risk assessment."""
    
    def __init__(self, data_dir: str = None):
        """
        Initialize the DataPreprocessor.
        
        Args:
            data_dir: Directory containing the scraped data files
        """
        if data_dir is None:
            data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        self.data_dir = data_dir
        self.logger = logging.getLogger(__name__)
        
        # Initialize scalers and encoders
        self.scalers = {
            'weather': StandardScaler(),
            'prices': StandardScaler(),
            'production': StandardScaler()
        }
        self.label_encoders = {
            'region': LabelEncoder(),
            'crop': LabelEncoder()
        }
        self.feature_scalers = {}
        self.categorical_encoders = {}
        self.feature_names = []

    def load_latest_data(self, days_lookback: int = 30) -> Dict[str, pd.DataFrame]:
        """
        Load the latest data files for each category within the lookback period.
        """
        data_frames = {
            'weather': [],
            'prices': [],
            'production': [],
            'soil': []
        }
        
        cutoff_date = datetime.now() - timedelta(days=days_lookback)
        
        try:
            for filename in os.listdir(self.data_dir):
                if not filename.endswith('.json'):
                    continue
                    
                file_path = os.path.join(self.data_dir, filename)
                file_date = datetime.strptime(filename.split('_')[-1].split('.')[0], "%Y%m%d_%H%M%S")
                
                if file_date < cutoff_date:
                    continue
                
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                if 'weather' in filename:
                    data_frames['weather'].append(pd.json_normalize(data))
                elif 'prices' in filename:
                    data_frames['prices'].append(pd.json_normalize(data))
                elif 'crop_production' in filename:
                    data_frames['production'].append(pd.json_normalize(data))
                elif 'soil_health' in filename:
                    data_frames['soil'].append(pd.json_normalize(data))
        
        except Exception as e:
            self.logger.error(f"Error loading data: {str(e)}")
            raise
        
        # Combine data frames for each category
        return {
            category: pd.concat(frames) if frames else pd.DataFrame()
            for category, frames in data_frames.items()
        }

    def prepare_features(self, raw_data: Dict[str, pd.DataFrame]) -> Tuple[pd.DataFrame, List[str]]:
        """
        Prepare features for the XGBoost model.
        
        Args:
            raw_data: Dictionary containing DataFrames for each data category
            
        Returns:
            Tuple of (feature_matrix, feature_names)
        """
        try:
            features = []
            feature_names = []
            
            # Weather features
            if not raw_data['weather'].empty:
                weather_features = self._process_weather_features(raw_data['weather'])
                features.append(weather_features)
                feature_names.extend([
                    'avg_temp', 'temp_volatility', 'rainfall_total',
                    'rainfall_deviation', 'humidity_avg'
                ])
            
            # Price features
            if not raw_data['prices'].empty:
                price_features = self._process_price_features(raw_data['prices'])
                features.append(price_features)
                feature_names.extend([
                    'price_avg', 'price_volatility', 'price_trend',
                    'volume_traded_avg'
                ])
            
            # Production features
            if not raw_data['production'].empty:
                prod_features = self._process_production_features(raw_data['production'])
                features.append(prod_features)
                feature_names.extend([
                    'yield_per_hectare', 'production_trend',
                    'area_cultivated'
                ])
            
            # Soil health features
            if not raw_data['soil'].empty:
                soil_features = self._process_soil_features(raw_data['soil'])
                features.append(soil_features)
                feature_names.extend([
                    'soil_quality_score', 'nutrient_balance_score'
                ])
            
            # Combine all features
            feature_matrix = pd.concat(features, axis=1)
            
            # Handle missing values
            feature_matrix = self._handle_missing_values(feature_matrix)
            
            # Store feature names
            self.feature_names = feature_matrix.columns.tolist()
            
            return feature_matrix, self.feature_names
            
        except Exception as e:
            self.logger.error(f"Error preparing features: {str(e)}")
            raise

    def _process_weather_features(self, weather_df: pd.DataFrame) -> pd.DataFrame:
        """Process weather data into features."""
        features = pd.DataFrame()
        
        try:
            # Average temperature
            features['avg_temp'] = weather_df['temperature.current'].mean()
            
            # Temperature volatility (standard deviation)
            features['temp_volatility'] = weather_df['temperature.current'].std()
            
            # Total rainfall
            features['rainfall_total'] = weather_df['rainfall.daily'].sum()
            
            # Rainfall deviation from normal
            features['rainfall_deviation'] = (
                weather_df['rainfall.daily'] - weather_df['rainfall.daily'].mean()
            ).std()
            
            # Average humidity
            features['humidity_avg'] = weather_df['humidity'].mean()
            
            # Scale features
            features = pd.DataFrame(
                self.scalers['weather'].fit_transform(features),
                columns=features.columns
            )
            
        except Exception as e:
            self.logger.error(f"Error processing weather features: {str(e)}")
            features = pd.DataFrame(columns=[
                'avg_temp', 'temp_volatility', 'rainfall_total',
                'rainfall_deviation', 'humidity_avg'
            ])
        
        return features

    def _process_price_features(self, price_df: pd.DataFrame) -> pd.DataFrame:
        """Process price data into features."""
        features = pd.DataFrame()
        
        try:
            # Average price
            features['price_avg'] = price_df['market_prices'].apply(
                lambda x: np.mean([p['modal_price'] for p in x])
            )
            
            # Price volatility
            features['price_volatility'] = price_df['market_prices'].apply(
                lambda x: np.std([p['modal_price'] for p in x])
            )
            
            # Price trend (positive or negative)
            features['price_trend'] = price_df['price_trends.price_change_percent']
            
            # Average volume traded
            features['volume_traded_avg'] = price_df['price_trends.volume_traded']
            
            # Scale features
            features = pd.DataFrame(
                self.scalers['prices'].fit_transform(features),
                columns=features.columns
            )
            
        except Exception as e:
            self.logger.error(f"Error processing price features: {str(e)}")
            features = pd.DataFrame(columns=[
                'price_avg', 'price_volatility', 'price_trend',
                'volume_traded_avg'
            ])
        
        return features

    def _process_production_features(self, prod_df: pd.DataFrame) -> pd.DataFrame:
        """Process production data into features."""
        features = pd.DataFrame()
        
        try:
            # Yield per hectare
            features['yield_per_hectare'] = prod_df.apply(
                lambda x: x['records'][0]['yield']
                if x['records'] else 0, axis=1
            )
            
            # Production trend
            features['production_trend'] = prod_df.apply(
                lambda x: (x['records'][-1]['production'] - x['records'][0]['production'])
                / x['records'][0]['production']
                if len(x['records']) > 1 else 0, axis=1
            )
            
            # Area cultivated
            features['area_cultivated'] = prod_df.apply(
                lambda x: x['records'][0]['area']
                if x['records'] else 0, axis=1
            )
            
            # Scale features
            features = pd.DataFrame(
                self.scalers['production'].fit_transform(features),
                columns=features.columns
            )
            
        except Exception as e:
            self.logger.error(f"Error processing production features: {str(e)}")
            features = pd.DataFrame(columns=[
                'yield_per_hectare', 'production_trend', 'area_cultivated'
            ])
        
        return features

    def _process_soil_features(self, soil_df: pd.DataFrame) -> pd.DataFrame:
        """Process soil health data into features."""
        features = pd.DataFrame()
        
        try:
            # Calculate soil quality score
            features['soil_quality_score'] = soil_df.apply(
                lambda x: np.mean([
                    r['ph_value'],
                    r['organic_carbon'] * 10,  # Scale up organic carbon
                    r['nitrogen'] / 100,  # Scale down nitrogen
                    r['phosphorus'] / 100,  # Scale down phosphorus
                    r['potassium'] / 100  # Scale down potassium
                ]) for r in x['records']
            )
            
            # Calculate nutrient balance score
            features['nutrient_balance_score'] = soil_df.apply(
                lambda x: np.std([
                    r['nitrogen'] / 100,
                    r['phosphorus'] / 100,
                    r['potassium'] / 100
                ]) for r in x['records']
            )
            
        except Exception as e:
            self.logger.error(f"Error processing soil features: {str(e)}")
            features = pd.DataFrame(columns=[
                'soil_quality_score', 'nutrient_balance_score'
            ])
        
        return features

    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the feature matrix."""
        # Fill missing values with mean for numerical columns
        df = df.fillna(df.mean())
        
        # If entire column is NaN, fill with zeros
        df = df.fillna(0)
        
        return df

    def get_feature_importance_map(self, feature_names: List[str], importance_scores: np.ndarray) -> Dict[str, float]:
        """
        Create a mapping of feature names to their importance scores.
        """
        return dict(zip(feature_names, importance_scores)) 