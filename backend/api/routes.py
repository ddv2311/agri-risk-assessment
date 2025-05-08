"""API routes for the agricultural risk assessment tool."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import requests
from bs4 import BeautifulSoup
import os
from google.cloud import dialogflow_v2 as dialogflow
from google.api_core.exceptions import InvalidArgument
# Handle different versions of langchain imports
try:
    # Try importing Groq provider
    from langchain_groq import ChatGroq
except ImportError:
    # If Groq is not installed as a dedicated provider, fall back to a generic provider
    try:
        from langchain_community.chat_models.groq import ChatGroq
    except ImportError:
        ChatGroq = None
        logger.error("Groq integration not available. Install with: pip install langchain-groq")
from langchain.prompts import PromptTemplate

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

# Load API keys from environment variables instead of hardcoding
NEWSAPI_KEY = os.environ.get("NEWSAPI_KEY", "")
DIALOGFLOW_PROJECT_ID = os.environ.get("DIALOGFLOW_PROJECT_ID", "")
DIALOGFLOW_LANGUAGE_CODE = 'en'
DIALOGFLOW_KEY_PATH = os.environ.get("DIALOGFLOW_KEY_PATH", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

# Initialize session client only if key path is available
SESSION_CLIENT = None
if os.path.exists(DIALOGFLOW_KEY_PATH):
    try:
        SESSION_CLIENT = dialogflow.SessionsClient.from_service_account_file(DIALOGFLOW_KEY_PATH)
    except Exception as e:
        logger.error(f"Failed to initialize Dialogflow client: {str(e)}")

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
        if not data:
            return jsonify({
                "error": "Invalid JSON"
            }), 400
        
        # Validate required fields
        required_fields = ['location', 'crop', 'scenario']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Ensure model is loaded
        if model is None or model.model is None:
            try:
                if model is None:
                    model = RiskAssessmentModel()
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
        
        # Generate synthetic labels for training
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
        if model is None:
            return jsonify({
                "error": "Model not initialized"
            }), 503
            
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
            "/health": {
                "method": "GET",
                "description": "Health check endpoint"
            },
            "/risk-assessment": {
                "method": "POST",
                "description": "Calculate credit risk score",
                "parameters": {
                    "location": "string (e.g., 'Gujarat')",
                    "crop": "string (e.g., 'wheat')",
                    "scenario": "string (normal/drought/flood)"
                }
            },
            "/model/retrain": {
                "method": "POST",
                "description": "Retrain the risk assessment model",
                "auth_required": "Admin only"
            },
            "/model/summary": {
                "method": "GET",
                "description": "Get model configuration and performance summary",
                "auth_required": "Yes"
            },
            "/historical-risk": {
                "method": "GET",
                "description": "Get historical risk data",
                "parameters": {
                    "location": "string (e.g., 'Gujarat')",
                    "crop": "string (e.g., 'wheat')",
                    "months": "integer (6 or 12)"
                }
            },
            "/region-news": {
                "method": "GET",
                "description": "Get agricultural news by region",
                "parameters": {
                    "region": "string (e.g., 'Maharashtra')"
                }
            },
            "/news": {
                "method": "GET",
                "description": "Get categorized news for a region",
                "parameters": {
                    "region": "string (e.g., 'India')",
                    "category": "string (weather/market/schemes/general)"
                }
            },
            "/chatbot": {
                "method": "POST",
                "description": "LLM-powered agricultural chatbot",
                "parameters": {
                    "message": "string (user's message)",
                    "sender": "string (user identifier)"
                }
            }
        }
    })

@api_bp.route('/historical-risk', methods=['GET'])
def get_historical_risk():
    """
    Get historical risk assessment data for a specific location and crop.
    
    Query parameters:
    - location: The location to get data for
    - crop: The crop type
    - months: Number of months to look back (6 or 12)
    """
    try:
        # Get query parameters
        location = request.args.get('location')
        crop = request.args.get('crop')
        months = int(request.args.get('months', 6))
        
        # Validate parameters
        if not location or not crop:
            return jsonify({
                "error": "Missing required parameters: location and crop"
            }), 400
            
        if months not in [6, 12]:
            return jsonify({
                "error": "Invalid months parameter. Must be 6 or 12"
            }), 400
        
        # Generate dates for the requested period
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30 * months)
        dates = pd.date_range(start=start_date, end=end_date, freq='M')
        
        # For MVP, generate synthetic historical data
        # In production, this would fetch from a database
        risk_scores = []
        for date in dates:
            # Generate a base risk score with some randomness
            base_score = 0.3 + np.random.normal(0, 0.1)  # Random score around 0.3
            
            # Add seasonal variations
            month = date.month
            if month in [6, 7, 8]:  # Summer months
                base_score += 0.1  # Higher risk in summer
            elif month in [12, 1, 2]:  # Winter months
                base_score -= 0.05  # Lower risk in winter
                
            # Add location-specific variations
            location_factors = {
                'Maharashtra': 0.05,
                'Punjab': -0.05,
                'Haryana': -0.03,
                'Uttar Pradesh': 0.03,
                'Karnataka': 0.02,
                'Tamil Nadu': 0.04,
                'Andhra Pradesh': 0.06,
                'Gujarat': 0.01,
                'West Bengal': 0.07,
                'Madhya Pradesh': -0.02
            }
            base_score += location_factors.get(location, 0)
            
            # Add crop-specific variations
            crop_factors = {
                'Rice': 0.04,
                'Wheat': -0.03,
                'Cotton': 0.05,
                'Sugarcane': 0.02,
                'Maize': -0.02,
                'Pulses': 0.01,
                'Oilseeds': 0.03,
                'Vegetables': -0.04,
                'Fruits': -0.05,
                'Spices': 0.02
            }
            base_score += crop_factors.get(crop.capitalize(), 0)
            
            # Ensure score is between 0 and 1
            risk_scores.append(max(0, min(1, base_score)))
        
        # Format dates for chart labels
        labels = [date.strftime('%b %Y') for date in dates]
        
        return jsonify({
            "labels": labels,
            "datasets": [{
                "label": "Risk Score",
                "data": risk_scores,
                "fill": True,
                "backgroundColor": "rgba(255, 193, 7, 0.1)",
                "borderColor": "#ffc107",
                "tension": 0.4,
                "pointBackgroundColor": "#ffc107",
                "pointBorderColor": "#fff",
                "pointBorderWidth": 2,
                "pointRadius": 4,
                "pointHoverRadius": 6
            }]
        })
        
    except Exception as e:
        logger.error(f"Error in historical risk data: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@api_bp.route('/region-news')
def region_news():
    """
    Get region-specific agricultural alerts and news.
    
    Query parameters:
    - region: The region to get news for (default: Maharashtra)
    """
    region = request.args.get('region', 'Maharashtra').lower()
    alerts = []

    # 1. Weather Alerts (IMD)
    try:
        url = 'https://mausam.imd.gov.in/mausam/latest-warning'
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'html.parser')
            for item in soup.select('.warning-table tr'):
                cols = item.find_all('td')
                if cols:
                    row_text = ' '.join(col.text.lower() for col in cols)
                    if region in row_text:
                        alerts.append({
                            'title': cols[0].text.strip(),
                            'description': cols[1].text.strip() if len(cols) > 1 else '',
                            'source': 'IMD',
                            'date': datetime.now().strftime('%Y-%m-%d'),
                            'type': 'weather',
                            'priority': 'high'
                        })
    except Exception as e:
        logger.error(f"Weather scraping failed: {str(e)}")

    # 2. Market Prices (Agmarknet) - Example: scrape or use mock data
    try:
        # For demo, use mock data. Replace with real scraping if needed.
        market_mock = {
            'maharashtra': [
                {'commodity': 'Wheat', 'price': '₹2,200/qtl', 'market': 'Pune', 'date': '2024-03-21'},
                {'commodity': 'Onion', 'price': '₹1,000/qtl', 'market': 'Nashik', 'date': '2024-03-21'}
            ],
            'punjab': [
                {'commodity': 'Wheat', 'price': '₹2,250/qtl', 'market': 'Ludhiana', 'date': '2024-03-21'}
            ],
            'gujarat': [
                {'commodity': 'Cotton', 'price': '₹5,800/qtl', 'market': 'Ahmedabad', 'date': '2024-03-21'},
                {'commodity': 'Groundnut', 'price': '₹4,750/qtl', 'market': 'Rajkot', 'date': '2024-03-21'}
            ],
            'karnataka': [
                {'commodity': 'Coffee', 'price': '₹18,500/qtl', 'market': 'Hassan', 'date': '2024-03-21'},
                {'commodity': 'Ragi', 'price': '₹3,100/qtl', 'market': 'Bengaluru', 'date': '2024-03-21'}
            ]
            # Add more as needed
        }
        for entry in market_mock.get(region, []):
            alerts.append({
                'title': f"{entry['commodity']} Price Update",
                'description': f"{entry['commodity']} is trading at {entry['price']} in {entry['market']}.",
                'source': 'Agmarknet',
                'date': entry['date'],
                'type': 'market',
                'priority': 'medium'
            })
    except Exception as e:
        logger.error(f"Market data processing failed: {str(e)}")

    # 3. Government Schemes (agriculture.gov.in) - Example: use mock data
    try:
        scheme_mock = {
            'maharashtra': [
                {'title': 'PM-KISAN Installment', 'desc': 'Next PM-KISAN installment to be credited soon.', 'date': '2024-03-20'}
            ],
            'punjab': [
                {'title': 'Crop Insurance Update', 'desc': 'New insurance scheme for wheat farmers.', 'date': '2024-03-19'}
            ],
            'gujarat': [
                {'title': 'Soil Health Card', 'desc': 'Last date for Soil Health Card applications extended.', 'date': '2024-03-18'}
            ],
            'karnataka': [
                {'title': 'Subsidy for Sprinklers', 'desc': 'New subsidy scheme for sprinkler irrigation systems.', 'date': '2024-03-21'}
            ]
            # Add more as needed
        }
        for entry in scheme_mock.get(region, []):
            alerts.append({
                'title': entry['title'],
                'description': entry['desc'],
                'source': 'agriculture.gov.in',
                'date': entry['date'],
                'type': 'scheme',
                'priority': 'medium'
            })
    except Exception as e:
        logger.error(f"Scheme data processing failed: {str(e)}")

    return jsonify(alerts)

@api_bp.route('/news', methods=['GET'])
def region_news_proxy():
    """
    Get news articles for a specific region and category.
    
    Query parameters:
    - region: The region to get news for (default: India)
    - category: News category (weather/market/schemes/general)
    """
    region = request.args.get('region', 'India')
    category = request.args.get('category', 'general')
    
    if not NEWSAPI_KEY:
        # Return mock data if NewsAPI key is not configured
        mock_news = {
            'weather': [
                {
                    'title': f'Weather Update for {region}',
                    'description': 'Temperature expected to remain moderate with chances of light rain.',
                    'url': '#',
                    'publishedAt': datetime.now().isoformat()
                }
            ],
            'market': [
                {
                    'title': f'Market Prices in {region}',
                    'description': 'Current mandi prices show stable trends for major crops.',
                    'url': '#',
                    'publishedAt': datetime.now().isoformat()
                }
            ],
            'schemes': [
                {
                    'title': f'Government Schemes for {region}',
                    'description': 'New agricultural subsidy schemes announced for farmers.',
                    'url': '#',
                    'publishedAt': datetime.now().isoformat()
                }
            ],
            'general': [
                {
                    'title': f'Agricultural News from {region}',
                    'description': 'Latest updates on farming practices and crop management.',
                    'url': '#',
                    'publishedAt': datetime.now().isoformat()
                }
            ]
        }
        return jsonify({"articles": mock_news.get(category, mock_news['general'])})
    
    queries = {
        'weather': f"{region} weather agriculture",
        'market': f"{region} mandi market price agriculture",
        'schemes': f"{region} government agriculture scheme subsidy"
    }
    q = queries.get(category, f"{region} agriculture")
    
    url = (
        f"https://newsapi.org/v2/everything?"
        f"q={requests.utils.quote(q)}"
        f"&language=en"
        f"&sortBy=publishedAt"
        f"&apiKey={NEWSAPI_KEY}"
        f"&pageSize=10"
    )
    try:
        resp = requests.get(url, timeout=5)
        data = resp.json()
        if data.get("status") != "ok":
            return jsonify({"articles": [], "error": data.get("message", "Failed to fetch news")}), 502
        return jsonify({"articles": data.get("articles", [])})
    except Exception as e:
        logger.error(f"News API request failed: {str(e)}")
        return jsonify({"articles": [], "error": str(e)}), 500

@api_bp.route('/chatbot', methods=['POST'])
def chatbot_langchain():
    """
    LLM-powered agricultural chatbot using Groq.
    
    Expected request body:
    {
        "message": "user's message",
        "sender": "user identifier" (optional)
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify([{"text": "Invalid request format"}]), 400
            
        user_message = data.get('message', '')
        if not user_message:
            return jsonify([{"text": "Please provide a message"}]), 400
            
        sender_id = data.get('sender', 'anonymous')
        
        if not GROQ_API_KEY:
            return jsonify([{"text": "Chatbot service is not configured"}]), 503
        
        if ChatGroq is None:
            return jsonify([{"text": "Groq integration is not available. Please install the required packages."}]), 503
            
        try:
            # Try with model_name parameter (newer API)
            llm = ChatGroq(api_key=GROQ_API_KEY, model_name="gemma2-9b-it")
        except TypeError:
            try:
                # Fall back to model parameter (older API)
                llm = ChatGroq(api_key=GROQ_API_KEY, model="gemma2-9b-it")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {str(e)}")
                return jsonify([{"text": "Failed to initialize chatbot. Please check configuration."}]), 503
        
        agri_prompt = PromptTemplate(
            input_variables=["user_message"],
            template=(
                "You are Agri Assistant, a helpful, region-aware chatbot for Indian farmers. "
                "You can explain agricultural risk assessment results, suggest optimal crops for a given region and season, "
                "provide weather and mandi (market) price updates, and answer questions about government schemes. "
                "Always answer in simple, clear language suitable for farmers. "
                "If the user asks about risk, explain what a high, medium, or low risk means for their farm. "
                "If the user asks for crop suggestions, consider the region, season, and common crops. "
                "If the user asks about weather or market prices, give general advice or tell them where to check official updates. "
                "If the user asks about government schemes, mention PM-KISAN, crop insurance, or subsidies if relevant. "
                "If you don't know the answer, politely say so and suggest where the user can find more information. "
                "User: {user_message}\n"
                "Agri Assistant:"
            )
        )
        prompt = agri_prompt.format(user_message=user_message)
        
        try:
            # Try invoke method (newer API)
            response = llm.invoke(prompt)
            response_text = getattr(response, 'content', str(response))
        except AttributeError:
            try:
                # Fall back to __call__ (older API)
                response = llm(prompt)
                response_text = str(response)
            except Exception as e:
                logger.error(f"Failed to get response from Groq: {str(e)}")
                return jsonify([{"text": "Failed to get a response from the chatbot."}]), 503
                
        return jsonify([{"text": response_text}])
    except Exception as e:
        logger.error(f"Chatbot error: {str(e)}")
        return jsonify([{"text": "Sorry, the assistant is currently unavailable."}]), 503

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
    
    # Convert to binary labels (default/no default)
    return (risk_scores > 0.5).astype(int)