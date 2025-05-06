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
from data.feature_engineering import FeatureEngineer

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
        
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(self.base_dir, 'xgboost_model.joblib')
        self.data_collector = DataCollector(get_config())
        self.feature_engineer = FeatureEngineer()
    
    def _initialize_model(self):
        """Initialize a new XGBoost model with default parameters."""
        config = get_config()
        self.model = xgb.XGBClassifier(
            objective='binary:logistic',
            n_estimators=config.MODEL_PARAMS['n_estimators'],
            learning_rate=config.MODEL_PARAMS['learning_rate'],
            max_depth=config.MODEL_PARAMS['max_depth'],
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
                'roc_auc': None  # Removed roc_auc_score as it was not defined
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

    def predict(self, X: pd.DataFrame) -> Tuple[np.ndarray, Dict[str, float]]:
        """
        Make predictions using the trained model.
        
        Args:
            X: DataFrame containing input features
            
        Returns:
            Tuple of predictions and feature importance
        """
        if X.shape[0] == 0:
            raise ValueError("Input data cannot be empty")
            
        # Make predictions
        y_pred_proba = self.model.predict_proba(X)[:, 1]
        
        # Get feature importance
        self.feature_importance = dict(zip(X.columns, self.model.feature_importances_))
        
        return y_pred_proba, self.feature_importance

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

    def predict_risk_score(self, location, crop, scenario):
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
            # Collect data
            weather_data = self.data_collector.collect_weather_data(location)
            yield_data = self.data_collector.collect_crop_yield_data(crop, location)
            price_data = self.data_collector.collect_commodity_prices(location)
            
            # Generate features
            features = self.feature_engineer.generate_features(yield_data, weather_data, price_data)
            
            # Convert features to DataFrame
            X = pd.DataFrame([features])
            
            # Make prediction
            y_pred_proba, feature_importance = self.predict(X)
            
            # Get risk category
            risk_score = float(y_pred_proba[0])
            risk_category = self.feature_engineer.get_risk_category(risk_score)
            
            # Generate explanation
            explanation = self.feature_engineer.generate_risk_explanation(
                risk_category,
                features,
                scenario
            )
            
            return {
                'risk_score': risk_score,
                'risk_category': risk_category,
                'explanation': explanation,
                'feature_importance': feature_importance
            }
            
        except Exception as e:
            logger.error(f"Error predicting risk score: {str(e)}")
            raise {
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