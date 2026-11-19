from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.models import db
import os

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['MODEL_FOLDER'], exist_ok=True)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.business import business_bp
    from app.routes.sales import sales_bp
    from app.routes.forecast import forecast_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(business_bp, url_prefix='/api/businesses')
    app.register_blueprint(sales_bp, url_prefix='/api/businesses')
    app.register_blueprint(forecast_bp, url_prefix='/api/businesses')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'system': 'Multi-Business Sales Forecasting API',
            'version': '1.0.0'
        }), 200

    with app.app_context():
        db.create_all()

    return app
