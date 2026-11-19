import os
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, current_app
from app.models import db, Business, SalesDataset
from app.utils.auth import token_required
from app.services.data_processor import validate_csv_file

sales_bp = Blueprint('sales', __name__)

ALLOWED_EXTENSIONS = {'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@sales_bp.route('/<int:business_id>/datasets', methods=['POST'])
@token_required
def upload_dataset(current_user, business_id):
    if current_user.is_admin:
        business = Business.query.filter_by(id=business_id).first()
    else:
        business = Business.query.filter_by(id=business_id, user_id=current_user.id).first()
    if not business:
        return jsonify({'error': 'Business not found or access denied'}), 404

    if 'file' not in request.files:
        return jsonify({'error': 'No file field in request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Only CSV files are permitted.'}), 400

    # Save to uploads directory
    upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], f'business_{business.id}')
    os.makedirs(upload_dir, exist_ok=True)

    safe_filename = secure_filename(file.filename)
    filepath = os.path.join(upload_dir, safe_filename)
    file.save(filepath)

    # Validate CSV content
    is_valid, msg, metadata = validate_csv_file(filepath)
    if not is_valid:
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': msg}), 400

    # Mark previous datasets for this business as inactive if new active one is uploaded
    SalesDataset.query.filter_by(business_id=business.id).update({'is_active': False})

    # Save record
    dataset = SalesDataset(
        business_id=business.id,
        filename=safe_filename,
        filepath=filepath,
        row_count=metadata['row_count'],
        start_date=metadata['start_date'],
        end_date=metadata['end_date'],
        date_column=metadata['date_column'],
        sales_column=metadata['sales_column'],
        is_active=True
    )

    db.session.add(dataset)
    db.session.commit()

    return jsonify({
        'message': 'Dataset uploaded and validated successfully',
        'dataset': dataset.to_dict(),
        'validation': {
            'columns': metadata['columns'],
            'preview': metadata['preview']
        }
    }), 201

@sales_bp.route('/upload_new_business', methods=['POST'])
@token_required
def upload_new_business(current_user):
    name = request.form.get('name', '').strip()
    industry = request.form.get('industry', '').strip() or 'General'
    description = request.form.get('description', '').strip()

    if not name:
        return jsonify({'error': 'Business name is required.'}), 400

    if 'file' not in request.files:
        return jsonify({'error': 'No CSV file provided.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected.'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Only CSV files are permitted.'}), 400

    # 1. Create Business Profile
    business = Business(
        user_id=current_user.id,
        name=name,
        industry=industry,
        description=description
    )
    db.session.add(business)
    db.session.commit()

    # 2. Save file
    upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], f'business_{business.id}')
    os.makedirs(upload_dir, exist_ok=True)

    safe_filename = secure_filename(file.filename)
    filepath = os.path.join(upload_dir, safe_filename)
    file.save(filepath)

    # 3. Validate CSV
    is_valid, msg, metadata = validate_csv_file(filepath)
    if not is_valid:
        if os.path.exists(filepath):
            os.remove(filepath)
        db.session.delete(business)
        db.session.commit()
        return jsonify({'error': msg}), 400

    dataset = SalesDataset(
        business_id=business.id,
        filename=safe_filename,
        filepath=filepath,
        row_count=metadata['row_count'],
        start_date=metadata['start_date'],
        end_date=metadata['end_date'],
        date_column=metadata['date_column'],
        sales_column=metadata['sales_column'],
        is_active=True
    )
    db.session.add(dataset)
    db.session.commit()

    # 4. Auto-train ML model
    from app.services.ml_engine import train_and_forecast_model
    from app.models import ModelMetric, ForecastPrediction
    import json

    result = train_and_forecast_model(
        filepath=dataset.filepath,
        business_id=business.id,
        model_dir=current_app.config['MODEL_FOLDER'],
        forecast_days=90
    )

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

    return jsonify({
        'message': f'Business "{business.name}" created and Random Forest model trained successfully!',
        'business': business.to_dict(),
        'dataset': dataset.to_dict(),
        'metrics': result['metrics'],
        'forecast_count': len(result['forecast']),
        'validation': {
            'columns': metadata['columns'],
            'preview': metadata['preview']
        }
    }), 201


@sales_bp.route('/<int:business_id>/datasets', methods=['GET'])
@token_required
def get_datasets(current_user, business_id):
    if current_user.is_admin:
        business = Business.query.filter_by(id=business_id).first()
    else:
        business = Business.query.filter_by(id=business_id, user_id=current_user.id).first()
    if not business:
        return jsonify({'error': 'Business not found or access denied'}), 404

    datasets = SalesDataset.query.filter_by(business_id=business.id).order_by(SalesDataset.uploaded_at.desc()).all()
    return jsonify({'datasets': [d.to_dict() for d in datasets]}), 200

@sales_bp.route('/<int:business_id>/datasets/<int:dataset_id>/preview', methods=['GET'])
@token_required
def preview_dataset(current_user, business_id, dataset_id):
    if current_user.is_admin:
        business = Business.query.filter_by(id=business_id).first()
    else:
        business = Business.query.filter_by(id=business_id, user_id=current_user.id).first()
    if not business:
        return jsonify({'error': 'Business not found or access denied'}), 404

    dataset = SalesDataset.query.filter_by(id=dataset_id, business_id=business.id).first()
    if not dataset:
        return jsonify({'error': 'Dataset not found'}), 404

    if not os.path.exists(dataset.filepath):
        return jsonify({'error': 'Dataset file missing on disk'}), 404

    is_valid, msg, metadata = validate_csv_file(dataset.filepath)
    return jsonify({
        'dataset': dataset.to_dict(),
        'preview': metadata.get('preview', []),
        'columns': metadata.get('columns', [])
    }), 200
