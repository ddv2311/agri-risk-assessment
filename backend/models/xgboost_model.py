import os
import numpy as np
import pandas as pd
import xgboost as xgb
import logging
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
from typing import Dict, List, Tuple, Optional, Any
import json
from datetime import datetime

from config import get_config
from data.data_collector import DataCollector
from data.preprocessing import DataPreprocessor

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RiskAssessmentModel:
    """
    XGBoost model for predicting agricultural credit risk
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the XGBoost model for risk assessment.
        
        Args:
            model_path: Path to saved model file. If None, creates new model.
        """
        self.model = None
        self.feature_importance = {}
        self.feature_names = []
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            self._initialize_model()
        
        self.preprocessor = DataPreprocessor()
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(self.base_dir, 'xgboost_model.joblib')
        self.data_collector = DataCollector(get_config())
    
    def _initialize_model(self):
        """Initialize a new XGBoost model with default parameters."""
        self.model = xgb.XGBClassifier(
            objective='binary:logistic',
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )
    
    def train(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
        """
        Train the XGBoost model.
        
        Args:
            X: Feature matrix
            y: Target variable (0: no default, 1: default)
            
        Returns:
            Dictionary containing training metrics
        """
        try:
            self.feature_names = X.columns.tolist()
            logger.info(f"Training with features: {self.feature_names}")
            logger.info(f"Training X shape: {X.shape}, y: {y}")
            
            # Train the model
            self.model.fit(X, y)
            logger.info(f"Model fit complete. Model: {self.model}")
            
            # Calculate predictions and metrics
            y_pred = self.model.predict(X)
            y_pred_proba = self.model.predict_proba(X)[:, 1]
            
            metrics = {
                'accuracy': accuracy_score(y, y_pred),
                'precision': precision_score(y, y_pred),
                'recall': recall_score(y, y_pred),
                'roc_auc': roc_auc_score(y, y_pred_proba)
            }
            
            # Calculate feature importance
            self.feature_importance = dict(zip(
                self.feature_names,
                self.model.feature_importances_
            ))
            
            logger.info(f"Model trained successfully. Metrics: {metrics}")
            return metrics
            
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise

    def predict(self, data: Dict[str, pd.DataFrame]) -> Tuple[float, Dict[str, float]]:
        """
        Make risk prediction for new data.
        
        Args:
            data: Dictionary of DataFrames containing features
            
        Returns:
            Tuple of (risk_score, feature_contributions)
        """
        try:
            logger.info(f"Predict called. Model: {self.model}")
            logger.info(f"Feature names: {self.feature_names}")
            features = self._prepare_features(data)
            logger.info(f"Prediction features shape: {features.shape}, columns: {features.columns.tolist()}")
            if self.model is None:
                raise ValueError("Model not initialized. Train or load a model first.")
            
            # Make prediction
            risk_score = float(self.model.predict_proba(features)[0, 1])
            
            # Calculate feature contributions using SHAP values
            feature_contributions = self._calculate_feature_contributions(features)
            
            return risk_score, feature_contributions
            
        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            raise

    def _prepare_features(self, data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """
        Prepare features from raw data.
        
        Args:
            data: Dictionary of DataFrames containing raw data
            
        Returns:
            DataFrame of prepared features
        """
        # Combine relevant features from different data sources
        features = pd.DataFrame()
        
        # Add weather features
        if 'weather' in data and not data['weather'].empty:
            weather_features = data['weather'].select_dtypes(include=[np.number])
            features = pd.concat([features, weather_features], axis=1)
        
        # Add market features
        if 'market' in data and not data['market'].empty:
            market_features = data['market'].select_dtypes(include=[np.number])
            features = pd.concat([features, market_features], axis=1)
        
        # Add soil features
        if 'soil' in data and not data['soil'].empty:
            soil_features = data['soil'].select_dtypes(include=[np.number])
            features = pd.concat([features, soil_features], axis=1)
        
        # Ensure all required features are present
        missing_features = set(self.feature_names) - set(features.columns)
        if missing_features:
            for feature in missing_features:
                features[feature] = 0  # Fill missing features with zeros
        
        # Reorder columns to match training data
        features = features[self.feature_names]
        
        return features

    def _calculate_feature_contributions(self, features: pd.DataFrame) -> Dict[str, float]:
        """
        Calculate feature contributions using SHAP values.
        
        Args:
            features: DataFrame of features
            
        Returns:
            Dictionary of feature contributions
        """
        try:
            import shap
            
            # Calculate SHAP values
            explainer = shap.TreeExplainer(self.model)
            shap_values = explainer.shap_values(features)
            
            # Get mean absolute SHAP values for each feature
            contributions = dict(zip(
                self.feature_names,
                np.abs(shap_values).mean(axis=0)
            ))
            
            return contributions
            
        except ImportError:
            logger.warning("SHAP not available. Using feature importance instead.")
            return self.feature_importance

    def save_model(self, path: str):
        """
        Save the trained model to disk.
        
        Args:
            path: Path to save the model
        """
        try:
            dir_name = os.path.dirname(path)
            if dir_name:
                os.makedirs(dir_name, exist_ok=True)
            joblib.dump({
                'model': self.model,
                'feature_names': self.feature_names,
                'feature_importance': self.feature_importance
            }, path)
            logger.info(f"Model saved to {path}")
            
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise

    def load_model(self, path: str):
        """
        Load a trained model from disk.
        
        Args:
            path: Path to saved model file
        """
        try:
            saved_data = joblib.load(path)
            self.model = saved_data['model']
            self.feature_names = saved_data['feature_names']
            self.feature_importance = saved_data['feature_importance']
            logger.info(f"Model loaded from {path}")
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise

    def get_model_summary(self) -> Dict[str, Any]:
        """
        Get a summary of the model's configuration and performance.
        
        Returns:
            Dictionary containing model summary
        """
        return {
            'model_type': 'XGBoost',
            'feature_count': len(self.feature_names),
            'feature_importance': self.feature_importance,
            'parameters': self.model.get_params() if self.model else None
        }


# Helper function for the API to call
def predict_risk_score(location, crop, scenario):
    """
    Helper function to predict risk score for a given farmer
    
    Args:
        location (str): Farmer's location/region
        crop (str): Crop type
        scenario (str): Risk scenario
        
    Returns:
        dict: Risk assessment results
    """
    try:
        # Initialize model, config, and data handlers
        config = get_config()
        model = RiskAssessmentModel()
        data_collector = DataCollector(config)
        data_preprocessor = DataPreprocessor()
        
        # Collect data
        weather_data = data_collector.collect_weather_data(region=location)
        price_data = data_collector.collect_crop_price_data(crop=crop, region=location)
        yield_data = data_collector.collect_yield_data(crop=crop, region=location)
        
        # Process data into features
        features = data_preprocessor.create_features(
            weather=weather_data,
            price=price_data,
            yield_data=yield_data,
            crop=crop,
            scenario=scenario
        )
        
        # Convert to DataFrame with proper structure
        features_df = pd.DataFrame([features])
        
        # Load model if not already loaded
        if model.model is None:
            model.train_model(force_retrain=False)
        
        # Make prediction
        return model.predict(features_df)
        
    except Exception as e:
        logger.error(f"Error in risk score prediction: {str(e)}")
        return {
            'error': str(e),
            'score': 0.5,  # Default medium risk 
            'category': 'unknown',
            'reason': f"Unable to calculate risk due to error: {str(e)}"
        }


if __name__ == "__main__":
    # Example of running the model directly
    model = RiskAssessmentModel()
    model.train_model(force_retrain=True)
    
    # Generate sample input for testing
    test_features = {
        'avg_temperature': 26.5,
        'temp_variability': 2.3,
        'extreme_temp_days': 8,
        'total_rainfall': 950,
        'rainfall_deviation': -0.15,
        'max_consecutive_dry_days': 12,
        'avg_humidity': 68,
        'avg_price': 1580,
        'price_volatility': 0.3,
        'price_trend': -0.01,
        'recent_price_movement': -0.05,
        'avg_yield': 28.5,
        'yield_variability': 0.35,
        'yield_trend': 0.005
    }
    
    # Run prediction on test data
    test_df = pd.DataFrame([test_features])
    result = model.predict(test_df)
    
    # Print results
    logger.info("Risk Assessment Results:")
    logger.info(f"Risk Score: {result['score']:.4f}")
    logger.info("Feature Contributions:")
    
    # Sort features by contribution
    sorted_contributions = sorted(
        result['feature_contributions'].items(), 
        key=lambda x: x[1], 
        reverse=True
    )
    
    for feature, contribution in sorted_contributions[:5]:
        logger.info(f"  - {feature}: {contribution:.4f}")
        
    # Example of using the helper function
    logger.info("\nTesting helper function:")
    sample_result = predict_risk_score(
        location="Central Valley", 
        crop="corn", 
        scenario="normal"
    )
    logger.info(f"Sample Risk Score: {sample_result['score']:.4f}")
    logger.info(f"Sample Risk Category: {sample_result['category']}")
    logger.info(f"Sample Reason: {sample_result['reason']}")