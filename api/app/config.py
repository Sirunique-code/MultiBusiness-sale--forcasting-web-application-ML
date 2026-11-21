import os
import shutil

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
IS_VERCEL = bool(os.environ.get('VERCEL'))

if IS_VERCEL:
    # On Vercel serverless functions, the root filesystem is read-only.
    # Writable operations must target /tmp.
    DATA_DIR = '/tmp'
    os.makedirs(DATA_DIR, exist_ok=True)

    db_source = os.path.join(BASE_DIR, 'sales_forecasting.db')
    db_target = os.path.join(DATA_DIR, 'sales_forecasting.db')
    if os.path.exists(db_source) and not os.path.exists(db_target):
        try:
            shutil.copy2(db_source, db_target)
        except Exception:
            pass

    models_source = os.path.join(BASE_DIR, 'saved_models')
    models_target = os.path.join(DATA_DIR, 'saved_models')
    if os.path.exists(models_source) and not os.path.exists(models_target):
        try:
            shutil.copytree(models_source, models_target)
        except Exception:
            pass

    uploads_source = os.path.join(BASE_DIR, 'uploads')
    uploads_target = os.path.join(DATA_DIR, 'uploads')
    if os.path.exists(uploads_source) and not os.path.exists(uploads_target):
        try:
            shutil.copytree(uploads_source, uploads_target)
        except Exception:
            pass

    DB_PATH = db_target
    UPLOAD_FOLDER = os.path.join(DATA_DIR, 'uploads')
    MODEL_FOLDER = os.path.join(DATA_DIR, 'saved_models')
else:
    DB_PATH = os.path.join(BASE_DIR, 'sales_forecasting.db')
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MODEL_FOLDER = os.path.join(BASE_DIR, 'saved_models')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(MODEL_FOLDER, exist_ok=True)

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-antigravity-sales-forecaster')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f"sqlite:///{DB_PATH}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = UPLOAD_FOLDER
    MODEL_FOLDER = MODEL_FOLDER
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
