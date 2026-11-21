import json
from flask import Blueprint, request, jsonify, current_app
from app.models import db, Business, SalesDataset, ModelMetric, ForecastPrediction
from app.utils.auth import token_required
from app.services.ml_engine import train_and_forecast_model, preprocess_sales_data

forecast_bp = Blueprint('forecast', __name__)

@forecast_bp.route('/<int:business_id>/train', methods=['POST'])
@token_required
def train_model(current_user, business_id):
    if current_user.is_admin:
        business = Business.query.filter_by(id=business_id).first()
    else:
        business = Business.query.filter_by(id=business_id, user_id=current_user.id).first()
    if not business:
        return jsonify({'error': 'Business not found or access denied'}), 404

    dataset = SalesDataset.query.filter_by(business_id=business.id, is_active=True).first()
    if not dataset:
        # Pick the latest uploaded dataset if none active
        dataset = SalesDataset.query.filter_by(business_id=business.id).order_by(SalesDataset.uploaded_at.desc()).first()

    if not dataset:
        return jsonify({'error': 'No dataset available. Please upload a CSV dataset first.'}), 400

    forecast_days = request.json.get('forecast_days', 90) if request.is_json and request.json else 90
    try:
        forecast_days = int(forecast_days)
        if forecast_days < 7 or forecast_days > 90:
            forecast_days = 90
    except ValueError:
        forecast_days = 90

    try:
        result = train_and_forecast_model(
            filepath=dataset.filepath,
            business_id=business.id,
            model_dir=current_app.config['MODEL_FOLDER'],
            forecast_days=forecast_days
        )

        # Clear existing forecasts for this business
        ForecastPrediction.query.filter_by(business_id=business.id).delete()

        # Save new model metric record
        model_metric = ModelMetric(
            business_id=business.id,
            dataset_id=dataset.id,
            model_path=result['model_path'],
            mae=result['metrics']['mae'],
            rmse=result['metrics']['rmse'],
            r2_score=result['metrics']['r2_score'],
            training_duration_sec=result['metrics']['duration_sec'],
            feature_importance_json=json.dumps(result['metrics']['feature_importance'])
        )

        db.session.add(model_metric)
        db.session.flush()

        # Store predictions
        predictions_to_insert = [
            ForecastPrediction(
                business_id=business.id,
                model_metric_id=model_metric.id,
                date=item['date'],
                yhat=item['yhat'],
                yhat_lower=item['yhat_lower'],
                yhat_upper=item['yhat_upper']
            )
            for item in result['forecast']
        ]

        db.session.bulk_save_objects(predictions_to_insert)
        db.session.commit()

        return jsonify({
            'message': f'Model successfully trained and {forecast_days}-day forecast generated!',
            'metrics': model_metric.to_dict(),
            'forecast_count': len(result['forecast']),
            'dataset_info': {
                'filename': dataset.filename,
                'row_count': result['row_count'],
                'start_date': result['start_date'],
                'end_date': result['end_date'],
                'date_column': result['date_column'],
                'sales_column': result['sales_column']
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Model training failed: {str(e)}'}), 500

@forecast_bp.route('/<int:business_id>/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user, business_id):
    if current_user.is_admin:
        business = Business.query.filter_by(id=business_id).first()
    else:
        business = Business.query.filter_by(id=business_id, user_id=current_user.id).first()
    if not business:
        return jsonify({'error': 'Business not found or access denied'}), 404

    active_dataset = SalesDataset.query.filter_by(business_id=business.id, is_active=True).first()
    latest_metric = ModelMetric.query.filter_by(business_id=business.id).order_by(ModelMetric.trained_at.desc()).first()

    # Get predictions
    forecast_preds = ForecastPrediction.query.filter_by(business_id=business.id).order_by(ForecastPrediction.date.asc()).all()
    forecast_data = [p.to_dict() for p in forecast_preds]

    historical_data = []
    if active_dataset and active_dataset.filepath:
        try:
            df_daily, _, _, _, _ = preprocess_sales_data(active_dataset.filepath)
            # Take last 180 days of historical data for chart performance
            historical_data = [
                {
                    'date': idx.strftime('%Y-%m-%d'),
                    'actual': round(float(row['y']), 2)
                }
                for idx, row in df_daily.tail(180).iterrows()
            ]
        except Exception:
            historical_data = []

    # Calculated summary metrics
    total_historical_sales = sum(item['actual'] for item in historical_data)
    total_forecasted_sales = sum(item['yhat'] for item in forecast_data)

    return jsonify({
        'business': business.to_dict(),
        'dataset': active_dataset.to_dict() if active_dataset else None,
        'latest_metric': latest_metric.to_dict() if latest_metric else None,
        'summary': {
            'total_historical_sales': round(total_historical_sales, 2),
            'total_forecasted_sales': round(total_forecasted_sales, 2),
            'historical_days_count': len(historical_data),
            'forecast_days_count': len(forecast_data)
        },
        'historical_data': historical_data,
        'forecast_data': forecast_data
    }), 200

@forecast_bp.route('/<int:business_id>/model-history', methods=['GET'])
@token_required
def get_model_history(current_user, business_id):
    if current_user.is_admin:
        business = Business.query.filter_by(id=business_id).first()
    else:
        business = Business.query.filter_by(id=business_id, user_id=current_user.id).first()
    if not business:
        return jsonify({'error': 'Business not found or access denied'}), 404

    metrics = ModelMetric.query.filter_by(business_id=business.id).order_by(ModelMetric.trained_at.desc()).all()
    return jsonify({'model_history': [m.to_dict() for m in metrics]}), 200
