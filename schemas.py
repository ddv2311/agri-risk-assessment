"""Schema definitions for request/response validation."""
from marshmallow import Schema, fields, validate, ValidationError

class UserSchema(Schema):
    """Schema for user data."""
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=6))
    role = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    last_login = fields.DateTime(dump_only=True)

class LoginSchema(Schema):
    """Schema for login requests."""
    username = fields.Str(required=True)
    password = fields.Str(required=True, load_only=True)

class RiskAssessmentRequestSchema(Schema):
    """Schema for risk assessment requests."""
    location = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    crop = fields.Str(required=True, validate=validate.Length(min=2, max=50))
    scenario = fields.Str(required=True, validate=validate.OneOf(['normal', 'drought', 'flood']))
    additional_features = fields.Dict(keys=fields.Str(), values=fields.Float(), required=False)

class RiskPredictionSchema(Schema):
    """Schema for risk prediction responses."""
    id = fields.Int(dump_only=True)
    location = fields.Str()
    crop = fields.Str()
    scenario = fields.Str()
    risk_score = fields.Float()
    risk_category = fields.Str()
    explanation = fields.Str()
    features = fields.Dict(keys=fields.Str(), values=fields.Float())
    model_version = fields.Str()
    created_at = fields.DateTime(dump_only=True)

class ModelMetadataSchema(Schema):
    """Schema for model metadata."""
    version = fields.Str(required=True)
    features = fields.Dict(keys=fields.Str(), values=fields.Str())
    performance_metrics = fields.Dict(keys=fields.Str(), values=fields.Float())
    training_date = fields.DateTime()
    is_active = fields.Boolean()

class ScrapedDataSchema(Schema):
    """Schema for scraped data."""
    source = fields.Str(required=True)
    data_type = fields.Str(required=True)
    location = fields.Str()
    timestamp = fields.DateTime(required=True)
    data = fields.Dict(required=True)

# Error response schema
class ErrorResponseSchema(Schema):
    """Schema for error responses."""
    error = fields.Str(required=True)
    message = fields.Str(required=True)
    details = fields.Dict(keys=fields.Str(), values=fields.List(fields.Str()), required=False)

# Initialize schemas
user_schema = UserSchema()
users_schema = UserSchema(many=True)
login_schema = LoginSchema()
risk_assessment_request_schema = RiskAssessmentRequestSchema()
risk_prediction_schema = RiskPredictionSchema()
risk_predictions_schema = RiskPredictionSchema(many=True)
model_metadata_schema = ModelMetadataSchema()
scraped_data_schema = ScrapedDataSchema()
error_response_schema = ErrorResponseSchema() 