import os
import numpy as np
import pandas as pd
import xgboost as xgb
import logging
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score
from sklearn.preprocessing import StandardScaler
import joblib
from typing import Dict, Tuple, Optional, Any
import json
from datetime import datetime
from pathlib import Path
import pickle

from config import get_config
from data.data_collector import DataCollector
from data.feature_engineering import FeatureEngineer

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RiskAssessmentModel:
    """
    XGBoost model for predicting agricultural credit risk
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.feature_importance = {}
        self.feature_names = []
        self.scaler = None
        self.metrics = {}

        self.base_dir = Path(__file__).parent
        self.model_path = self.base_dir / 'xgboost_model.joblib'
        self.scaler_path = self.base_dir / 'scaler.pkl'
        self.metrics_path = self.base_dir / 'model_metrics.json'

        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            self._initialize_model()

        self.data_collector = DataCollector(get_config())
        self.feature_engineer = FeatureEngineer()

    def _initialize_model(self):
        """Initialize a new XGBoost model with default parameters.
        
        Returns:
            None
        """
        config = get_config()
        self.model = xgb.XGBClassifier(
            objective='binary:logistic',
            max_depth=config.MODEL_PARAMS['max_depth'],
            learning_rate=config.MODEL_PARAMS['learning_rate'],
            n_estimators=config.MODEL_PARAMS['n_estimators'],
            random_state=config.MODEL_PARAMS['random_state'],
            eval_metric='logloss',
            use_label_encoder=False,
            n_jobs=-1
        )
        self.scaler = StandardScaler()

    def train_model(self, force_retrain: bool = False) -> Dict[str, float]:
        """Train the XGBoost model using collected and engineered data.
        
        Args:
            force_retrain: If True, retrain even if model exists
            
        Returns:
            Dictionary of training metrics
        """
        config = get_config()
        data = self.data_collector.collect_all_data()
        features, target = self.feature_engineer.prepare_training_data(data)

        X = pd.DataFrame(features)
        y = pd.Series(target)

        X_scaled = self.scaler.fit_transform(X)

        self.feature_names = X.columns.tolist()
        logger.info(f"Training with features: {self.feature_names}")

        self.model.fit(X_scaled, y)

        y_pred = self.model.predict(X_scaled)
        y_pred_proba = self.model.predict_proba(X_scaled)[:, 1]

        metrics = {
            'accuracy': accuracy_score(y, y_pred),
            'precision': precision_score(y, y_pred),
            'recall': recall_score(y, y_pred),
            'roc_auc': None  # Placeholder for ROC-AUC if needed
        }

        self.feature_importance = dict(zip(self.feature_names, self.model.feature_importances_))
        logger.info(f"Training complete. Metrics: {metrics}")

        # Save model and scaler
        self.save_model(str(self.model_path))
        with open(self.scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)

        with open(self.metrics_path, 'w') as f:
            json.dump(metrics, f)

        return metrics

    def predict(self, X: pd.DataFrame) -> Tuple[np.ndarray, Dict[str, float]]:
        """Make predictions using the trained model.
        
        Args:
            X: Feature matrix as pandas DataFrame
            
        Returns:
            Tuple of (prediction probabilities, feature importance dictionary)
        """
        if X.shape[0] == 0:
            raise ValueError("Input data cannot be empty")

        X_scaled = self.scaler.transform(X)
        y_pred_proba = self.model.predict_proba(X_scaled)[:, 1]
        self.feature_importance = dict(zip(X.columns, self.model.feature_importances_))

        return y_pred_proba, self.feature_importance

    def save_model(self, path: str):
        """Save the trained model to disk.
        
        Args:
            path: Path to save the model
            
        Returns:
            None
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
        """Load a trained model from disk.
        
        Args:
            path: Path to saved model file
            
        Returns:
            None
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
        """Get a summary of the model's configuration and performance.
        
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
        """Predict risk score for a given farmer.
        
        Args:
            location: Farmer's location/region
            crop: Type of crop
            scenario: Risk scenario (e.g., 'normal', 'drought')
            
        Returns:
            Dictionary containing risk assessment results
        """
        try:
            weather_data = self.data_collector.collect_weather_data(location)
            yield_data = self.data_collector.collect_crop_yield_data(crop, location)
            price_data = self.data_collector.collect_commodity_prices(location)

            features = self.feature_engineer.generate_features(yield_data, weather_data, price_data)
            X = pd.DataFrame([features])
            y_pred_proba, feature_importance = self.predict(X)

            risk_score = float(y_pred_proba[0])
            risk_category = self.feature_engineer.get_risk_category(risk_score)
            explanation = self.feature_engineer.generate_risk_explanation(
                risk_category, features, scenario
            )

            return {
                'score': risk_score,
                'category': risk_category,
                'reason': explanation,
                'feature_contributions': feature_importance
            }
        except Exception as e:
            logger.error(f"Error predicting risk score: {str(e)}")
            return {
                'score': 0.5,
                'category': 'unknown',
                'reason': f"Unable to calculate risk due to error: {str(e)}",
                'feature_contributions': {}
            }

if __name__ == "__main__":
    model = RiskAssessmentModel()
    model.train_model(force_retrain=True)

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

    test_df = pd.DataFrame([test_features])
    y_pred_proba, feature_importance = model.predict(test_df)

    logger.info("Risk Assessment Results:")
    logger.info(f"Risk Score: {y_pred_proba[0]:.4f}")
    logger.info("Top Feature Contributions:")
    sorted_contributions = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
    for feature, contribution in sorted_contributions[:5]:
        logger.info(f"  - {feature}: {contribution:.4f}")

    logger.info("\nTesting helper function:")
    sample_result = model.predict_risk_score(
        location="Central Valley",
        crop="corn",
        scenario="normal"
    )
    logger.info(f"Sample Risk Score: {sample_result['score']:.4f}")
    logger.info(f"Sample Risk Category: {sample_result['category']}")
    logger.info(f"Sample Reason: {sample_result['reason']}")
