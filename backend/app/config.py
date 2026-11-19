import os

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-antigravity-sales-forecaster')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f"sqlite:///{os.path.join(BASE_DIR, 'sales_forecasting.db')}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MODEL_FOLDER = os.path.join(BASE_DIR, 'saved_models')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
