import os
import pandas as pd
import numpy as np
from models.xgboost_model import RiskAssessmentModel
from data.data_collector import DataCollector
from data.feature_engineering import FeatureEngineer
import logging
from config import get_config

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def train_model():
    """Train the XGBoost model with your data."""
    try:
        # Initialize components
        config = get_config()
        model = RiskAssessmentModel()
        data_collector = DataCollector(config)
        feature_engineer = FeatureEngineer()

        # Collect training data
        logger.info("Collecting training data...")
        data = data_collector.collect_all_data()
        
        # Prepare features and target
        logger.info("Preparing features...")
        features, target = feature_engineer.prepare_training_data(data)
        
        # Train the model
        logger.info("Training model...")
        metrics = model.train_model(force_retrain=True)
        
        logger.info(f"Training complete. Metrics: {metrics}")
        logger.info("Model saved successfully.")
        
        return metrics
        
    except Exception as e:
        logger.error(f"Error training model: {str(e)}")
        raise

if __name__ == "__main__":
    train_model() 