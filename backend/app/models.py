from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    businesses = db.relationship('Business', backref='owner', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Business(db.Model):
    __tablename__ = 'businesses'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    industry = db.Column(db.String(80), nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    datasets = db.relationship('SalesDataset', backref='business', lazy=True, cascade="all, delete-orphan")
    model_metrics = db.relationship('ModelMetric', backref='business', lazy=True, cascade="all, delete-orphan")
    forecasts = db.relationship('ForecastPrediction', backref='business', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'industry': self.industry or 'General',
            'description': self.description or '',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'datasets_count': len(self.datasets),
            'has_active_model': any(m for m in self.model_metrics)
        }

class SalesDataset(db.Model):
    __tablename__ = 'sales_datasets'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(512), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    row_count = db.Column(db.Integer, default=0)
    start_date = db.Column(db.String(20), nullable=True)
    end_date = db.Column(db.String(20), nullable=True)
    date_column = db.Column(db.String(80), nullable=True)
    sales_column = db.Column(db.String(80), nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'filename': self.filename,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'row_count': self.row_count,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'date_column': self.date_column,
            'sales_column': self.sales_column,
            'is_active': self.is_active
        }

class ModelMetric(db.Model):
    __tablename__ = 'model_metrics'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False, index=True)
    dataset_id = db.Column(db.Integer, db.ForeignKey('sales_datasets.id'), nullable=True)
    trained_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    model_path = db.Column(db.String(512), nullable=False)
    mae = db.Column(db.Float, nullable=False)
    rmse = db.Column(db.Float, nullable=False)
    r2_score = db.Column(db.Float, nullable=False)
    training_duration_sec = db.Column(db.Float, default=0.0)
    feature_importance_json = db.Column(db.Text, nullable=True)

    def to_dict(self):
        feature_importance = {}
        if self.feature_importance_json:
            try:
                feature_importance = json.loads(self.feature_importance_json)
            except Exception:
                feature_importance = {}

        return {
            'id': self.id,
            'business_id': self.business_id,
            'dataset_id': self.dataset_id,
            'trained_at': self.trained_at.isoformat() if self.trained_at else None,
            'mae': round(self.mae, 2) if self.mae is not None else 0,
            'rmse': round(self.rmse, 2) if self.rmse is not None else 0,
            'r2_score': round(self.r2_score, 4) if self.r2_score is not None else 0,
            'training_duration_sec': round(self.training_duration_sec, 2),
            'feature_importance': feature_importance
        }

class ForecastPrediction(db.Model):
    __tablename__ = 'forecast_predictions'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False, index=True)
    model_metric_id = db.Column(db.Integer, db.ForeignKey('model_metrics.id'), nullable=False)
    date = db.Column(db.String(20), nullable=False, index=True)
    yhat = db.Column(db.Float, nullable=False)  # Predicted sales
    yhat_lower = db.Column(db.Float, nullable=False)
    yhat_upper = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'model_metric_id': self.model_metric_id,
            'date': self.date,
            'yhat': round(self.yhat, 2),
            'yhat_lower': round(self.yhat_lower, 2),
            'yhat_upper': round(self.yhat_upper, 2),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
