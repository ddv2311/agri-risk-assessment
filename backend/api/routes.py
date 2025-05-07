"""API routes for the agricultural risk assessment tool."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from datetime import datetime
import pandas as pd

from models.xgboost_model import RiskAssessmentModel
from data.preprocessing import DataPreprocessor
from api.auth import admin_required

# Create blueprint
api_bp = Blueprint('api', __name__)
logger = logging.getLogger(__name__)

# Initialize model and preprocessor
try:
    model = RiskAssessmentModel()
    preprocessor = DataPreprocessor()
except Exception as e:
    logger.error(f"Failed to initialize model: {str(e)}")
    model = None
    preprocessor = None

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    })

@api_bp.route('/risk-assessment', methods=['POST'])
def assess_risk():
    """
    Assess credit risk for a farmer based on current agricultural data.
    
    Expected request body:
    {
        "location": "Gujarat",
        "crop": "wheat",
        "scenario": "normal"  // or "drought", "flood", etc.
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['location', 'crop', 'scenario']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Ensure model is loaded
        if model.model is None:
            try:
                model.load_model('models/xgboost_model.joblib')
            except Exception as e:
                logger.error(f"Error loading model: {str(e)}")
                return jsonify({
                    "error": "Model not available",
                    "message": "Please ensure the model is trained before making predictions"
                }), 503
        
        # Get risk assessment from model
        try:
            result = model.predict_risk_score(
                location=data['location'],
                crop=data['crop'],
                scenario=data['scenario']
            )
            
            return jsonify({
                "risk_score": result['score'],
                "risk_category": result['category'],
                "explanation": result['reason'],
                "contributing_factors": result['feature_contributions'],
                "metadata": {
                    "location": data['location'],
                    "crop": data['crop'],
                    "scenario": data['scenario'],
                    "timestamp": datetime.now().isoformat()
                }
            })
            
        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            return jsonify({
                "error": "Prediction failed",
                "message": str(e)
            }), 500
            
    except Exception as e:
        logger.error(f"Error in risk assessment: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@api_bp.route('/model/retrain', methods=['POST'])
@jwt_required()
@admin_required()
def retrain_model():
    """
    Retrain the model with latest data.
    Admin access required.
    """
    try:
        # Load all available data
        raw_data = preprocessor.load_latest_data(days_lookback=365)  # Use last year's data
        
        # Prepare features
        X, feature_names = preprocessor.prepare_features(raw_data)
        
        # For MVP, generate synthetic labels
        # In production, this would use actual historical default data
        y = _generate_synthetic_labels(X)
        
        # Train model
        metrics = model.train(X, y)
        
        # Save model
        model.save_model('models/risk_assessment_model.joblib')
        
        return jsonify({
            "message": "Model retrained successfully",
            "metrics": metrics,
            "feature_importance": model.feature_importance,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in model retraining: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@api_bp.route('/model/summary', methods=['GET'])
@jwt_required()
def get_model_summary():
    """Get current model configuration and performance summary."""
    try:
        summary = model.get_model_summary()
        return jsonify(summary)
        
    except Exception as e:
        logger.error(f"Error getting model summary: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@api_bp.route('/api-docs', methods=['GET'])
def api_documentation():
    """Return API documentation."""
    return jsonify({
        "version": "1.0.0",
        "endpoints": {
            "/risk-assessment": {
                "method": "POST",
                "description": "Calculate credit risk score",
                "parameters": {
                    "location": "string (e.g., 'Gujarat')",
                    "crop": "string (e.g., 'wheat')",
                    "scenario": "string (normal/drought/flood)"
                }
            },
            # ... other endpoints
        }
    })

def _generate_risk_explanation(risk_category: str, top_factors: list, scenario: str) -> str:
    """Generate human-readable explanation for risk assessment."""
    factor_explanations = {
        'avg_temp': 'temperature conditions',
        'temp_volatility': 'temperature variability',
        'rainfall_total': 'rainfall amount',
        'rainfall_deviation': 'rainfall patterns',
        'humidity_avg': 'humidity levels',
        'price_avg': 'market prices',
        'price_volatility': 'price stability',
        'price_trend': 'price trends',
        'volume_traded_avg': 'market activity',
        'yield_per_hectare': 'crop yield',
        'production_trend': 'production patterns',
        'area_cultivated': 'cultivation area',
        'soil_quality_score': 'soil conditions',
        'nutrient_balance_score': 'soil nutrient levels'
    }
    
    # Create explanation based on top factors
    factor_texts = []
    for factor, value in top_factors:
        if factor in factor_explanations:
            direction = "high" if value > 0 else "low"
            factor_texts.append(f"{direction} {factor_explanations[factor]}")
    
    # Combine factors into explanation
    if risk_category == "high":
        base_text = "High risk assessment due to"
    elif risk_category == "medium":
        base_text = "Medium risk level influenced by"
    else:
        base_text = "Low risk profile based on"
    
    explanation = f"{base_text} {', '.join(factor_texts[:-1])}"
    if len(factor_texts) > 1:
        explanation += f" and {factor_texts[-1]}"
    elif len(factor_texts) == 1:
        explanation += f" {factor_texts[0]}"
    
    # Add scenario context
    scenario_context = {
        "drought": " under drought conditions",
        "flood": " in flood-affected areas",
        "normal": " under normal conditions"
    }
    explanation += scenario_context.get(scenario, "")
    
    return explanation

def _generate_synthetic_labels(X: pd.DataFrame) -> pd.Series:
    """
    Generate synthetic labels for training.
    This is for MVP only - in production, use actual default data.
    """
    import numpy as np
    
    # Calculate risk scores based on feature combinations
    risk_scores = np.zeros(len(X))
    
    # Add risk based on each feature
    for column in X.columns:
        if 'volatility' in column or 'deviation' in column:
            # Higher volatility/deviation increases risk
            risk_scores += X[column] * 0.2
        elif 'trend' in column:
            # Negative trends increase risk
            risk_scores -= X[column] * 0.15
        elif 'avg' in column or 'total' in column:
            # Extremely low or high values increase risk
            risk_scores += np.abs(X[column]) * 0.1
    
    # Scale to [0, 1]
    risk_scores = 1 / (1 + np.exp(-risk_scores))
    
    # Convert to binary labels
    return (risk_scores > 0.5).astype(int)