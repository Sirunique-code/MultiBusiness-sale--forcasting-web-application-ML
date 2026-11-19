from flask import Blueprint, jsonify, request, current_app
from app.models import db, User, Business, SalesDataset, ModelMetric, ForecastPrediction
from app.utils.auth import token_required
from app.services.ml_engine import train_and_forecast_model
import json

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    def wrapper(current_user, *args, **kwargs):
        if not current_user.is_admin:
            return jsonify({'error': 'Administrator privileges required.'}), 403
        return f(current_user, *args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

def evaluate_model_performance(r2_score, mae):
    """Categorize and provide evaluation diagnostics based on R2 score."""
    if r2_score >= 0.8:
        return {
            'grade': 'Excellent',
            'badge_color': 'emerald',
            'summary': 'High predictive power ($R^2 \ge 0.8$). Excellent fit for automated forecasting.'
        }
    elif r2_score >= 0.6:
        return {
            'grade': 'Good',
            'badge_color': 'indigo',
            'summary': 'Reliable accuracy ($0.6 \le R^2 < 0.8$). Captures primary trend and seasonality patterns.'
        }
    elif r2_score >= 0.4:
        return {
            'grade': 'Fair',
            'badge_color': 'amber',
            'summary': 'Moderate fit ($0.4 \le R^2 < 0.6$). Captures baseline trends; additional historical data recommended.'
        }
    else:
        return {
            'grade': 'Needs Improvement',
            'badge_color': 'rose',
            'summary': 'Low accuracy ($R^2 < 0.4$). High variance or noise in dataset. Uploading more daily rows is recommended.'
        }

@admin_bp.route('/overview', methods=['GET'])
@token_required
@admin_required
def get_admin_overview(current_user):
    total_users = User.query.count()
    total_businesses = Business.query.count()
    total_datasets = SalesDataset.query.count()
    total_models = ModelMetric.query.count()

    all_metrics = ModelMetric.query.all()
    avg_r2 = sum(m.r2_score for m in all_metrics) / len(all_metrics) if all_metrics else 0.0
    avg_mae = sum(m.mae for m in all_metrics) / len(all_metrics) if all_metrics else 0.0

    # Build comprehensive audit list of datasets & trained ML models
    datasets_evaluation = []
    datasets = SalesDataset.query.order_by(SalesDataset.uploaded_at.desc()).all()

    for ds in datasets:
        business = ds.business
        owner = business.owner if business else None
        metric = ModelMetric.query.filter_by(business_id=ds.business_id, dataset_id=ds.id)\
                                  .order_by(ModelMetric.trained_at.desc()).first()
        if not metric:
            # Fallback to latest business metric if dataset_id link is not set
            metric = ModelMetric.query.filter_by(business_id=ds.business_id)\
                                      .order_by(ModelMetric.trained_at.desc()).first()

        eval_info = evaluate_model_performance(metric.r2_score, metric.mae) if metric else None

        datasets_evaluation.append({
            'dataset_id': ds.id,
            'filename': ds.filename,
            'uploaded_at': ds.uploaded_at.isoformat() if ds.uploaded_at else None,
            'row_count': ds.row_count,
            'start_date': ds.start_date,
            'end_date': ds.end_date,
            'date_column': ds.date_column,
            'sales_column': ds.sales_column,
            'is_active': ds.is_active,
            'business': {
                'id': business.id,
                'name': business.name,
                'industry': business.industry
            } if business else None,
            'owner': {
                'id': owner.id,
                'full_name': owner.full_name,
                'email': owner.email
            } if owner else None,
            'model_evaluation': {
                'id': metric.id,
                'trained_at': metric.trained_at.isoformat() if metric.trained_at else None,
                'mae': round(metric.mae, 2),
                'rmse': round(metric.rmse, 2),
                'r2_score': round(metric.r2_score, 4),
                'duration_sec': round(metric.training_duration_sec, 2),
                'feature_importance': metric.to_dict().get('feature_importance', {}),
                'evaluation_grade': eval_info['grade'],
                'badge_color': eval_info['badge_color'],
                'evaluation_summary': eval_info['summary']
            } if metric else None
        })

    # Build list of all business profiles with dataset & model status
    businesses_list = []
    all_businesses = Business.query.order_by(Business.created_at.desc()).all()
    for b in all_businesses:
        owner = b.owner
        active_ds = SalesDataset.query.filter_by(business_id=b.id, is_active=True).first()
        if not active_ds:
            active_ds = SalesDataset.query.filter_by(business_id=b.id).order_by(SalesDataset.uploaded_at.desc()).first()

        latest_metric = ModelMetric.query.filter_by(business_id=b.id).order_by(ModelMetric.trained_at.desc()).first()
        eval_info = evaluate_model_performance(latest_metric.r2_score, latest_metric.mae) if latest_metric else None

        ds_count = SalesDataset.query.filter_by(business_id=b.id).count()

        businesses_list.append({
            'id': b.id,
            'name': b.name,
            'industry': b.industry,
            'description': b.description,
            'created_at': b.created_at.isoformat() if b.created_at else None,
            'owner': {
                'id': owner.id,
                'full_name': owner.full_name,
                'email': owner.email
            } if owner else None,
            'datasets_count': ds_count,
            'has_dataset': bool(active_ds),
            'active_dataset_filename': active_ds.filename if active_ds else None,
            'model_evaluation': {
                'id': latest_metric.id,
                'trained_at': latest_metric.trained_at.isoformat() if latest_metric.trained_at else None,
                'r2_score': round(latest_metric.r2_score, 4),
                'mae': round(latest_metric.mae, 2),
                'evaluation_grade': eval_info['grade'],
                'badge_color': eval_info['badge_color']
            } if latest_metric else None
        })

    return jsonify({
        'kpis': {
            'total_users': total_users,
            'total_businesses': total_businesses,
            'total_datasets': total_datasets,
            'total_models_trained': total_models,
            'avg_r2_score': round(avg_r2, 4),
            'avg_mae': round(avg_mae, 2)
        },
        'businesses': businesses_list,
        'datasets_evaluation': datasets_evaluation
    }), 200

@admin_bp.route('/re-evaluate/<int:business_id>', methods=['POST'])
@token_required
@admin_required
def admin_re_evaluate_model(current_user, business_id):
    business = Business.query.filter_by(id=business_id).first()
    if not business:
        return jsonify({'error': 'Business not found'}), 404

    dataset = SalesDataset.query.filter_by(business_id=business.id, is_active=True).first()
    if not dataset:
        dataset = SalesDataset.query.filter_by(business_id=business.id).order_by(SalesDataset.uploaded_at.desc()).first()

    if not dataset:
        return jsonify({'error': 'No dataset found for this business profile.'}), 400

    try:
        result = train_and_forecast_model(
            filepath=dataset.filepath,
            business_id=business.id,
            model_dir=current_app.config['MODEL_FOLDER'],
            forecast_days=90
        )

        ForecastPrediction.query.filter_by(business_id=business.id).delete()

        metric = ModelMetric(
            business_id=business.id,
            dataset_id=dataset.id,
            model_path=result['model_path'],
            mae=result['metrics']['mae'],
            rmse=result['metrics']['rmse'],
            r2_score=result['metrics']['r2_score'],
            training_duration_sec=result['metrics']['duration_sec'],
            feature_importance_json=json.dumps(result['metrics']['feature_importance'])
        )
        db.session.add(metric)
        db.session.flush()

        predictions = [
            ForecastPrediction(
                business_id=business.id,
                model_metric_id=metric.id,
                date=p['date'],
                yhat=p['yhat'],
                yhat_lower=p['yhat_lower'],
                yhat_upper=p['yhat_upper']
            )
            for p in result['forecast']
        ]
        db.session.bulk_save_objects(predictions)
        db.session.commit()

        eval_info = evaluate_model_performance(metric.r2_score, metric.mae)

        return jsonify({
            'message': f'Admin re-evaluation completed for "{business.name}".',
            'business_name': business.name,
            'metrics': metric.to_dict(),
            'evaluation': eval_info
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Re-evaluation failed: {str(e)}'}), 500
