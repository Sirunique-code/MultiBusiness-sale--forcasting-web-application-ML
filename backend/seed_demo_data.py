import os
import shutil
from app import create_app
from app.models import db, User, Business, SalesDataset, ModelMetric, ForecastPrediction
from app.services.data_processor import validate_csv_file
from app.services.ml_engine import train_and_forecast_model
import json

app = create_app()

DEMO_USER = {
    'email': 'demo@forecaster.com',
    'password': 'password123',
    'full_name': 'Thaddeaus Administrator'
}

DEMO_BUSINESSES = [
    {
        'name': 'Apex Fashion Retail',
        'industry': 'Apparel & Fashion',
        'description': 'Boutique clothing store with strong holiday seasonality.',
        'sample_csv': 'sample_data/retail_clothing_sales.csv'
    },
    {
        'name': 'Artisan Oven Bakery',
        'industry': 'Food & Beverage',
        'description': 'Artisanal bakery and coffee shop with weekend spikes.',
        'sample_csv': 'sample_data/cafe_bakery_sales.csv'
    },
    {
        'name': 'TechSphere Electronics',
        'industry': 'Consumer Electronics',
        'description': 'Electronics retailer with product launch and Black Friday surges.',
        'sample_csv': 'sample_data/electronics_tech_sales.csv'
    },
    {
        'name': 'Wellness Care Pharmacy',
        'industry': 'Healthcare & Pharmacy',
        'description': 'Community pharmacy with winter flu season demand.',
        'sample_csv': 'sample_data/pharmacy_health_sales.csv'
    },
    {
        'name': 'CloudScale SaaS',
        'industry': 'Software & E-commerce',
        'description': 'B2B subscription software business with quarter-end boosts.',
        'sample_csv': 'sample_data/saas_ecommerce_sales.csv'
    }
]

def seed():
    with app.app_context():
        print("Cleaning up database...")
        db.drop_all()
        db.create_all()

        print(f"Creating demo user {DEMO_USER['email']}...")
        user = User(email=DEMO_USER['email'], full_name=DEMO_USER['full_name'], is_admin=True)
        user.set_password(DEMO_USER['password'])
        db.session.add(user)
        db.session.commit()

        for b_info in DEMO_BUSINESSES:
            print(f"\nProcessing business: {b_info['name']}...")
            business = Business(
                user_id=user.id,
                name=b_info['name'],
                industry=b_info['industry'],
                description=b_info['description']
            )
            db.session.add(business)
            db.session.commit()

            # Resolve sample CSV relative to project root
            root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            csv_src = os.path.abspath(os.path.join(root_dir, b_info['sample_csv']))
            if not os.path.exists(csv_src):
                print(f"Warning: {csv_src} not found, skipping upload.")
                continue

            upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], f'business_{business.id}')
            os.makedirs(upload_dir, exist_ok=True)
            filename = os.path.basename(csv_src)
            dest_filepath = os.path.join(upload_dir, filename)
            shutil.copyfile(csv_src, dest_filepath)

            is_valid, msg, metadata = validate_csv_file(dest_filepath)
            if not is_valid:
                print(f"Validation error for {filename}: {msg}")
                continue

            dataset = SalesDataset(
                business_id=business.id,
                filename=filename,
                filepath=dest_filepath,
                row_count=metadata['row_count'],
                start_date=metadata['start_date'],
                end_date=metadata['end_date'],
                date_column=metadata['date_column'],
                sales_column=metadata['sales_column'],
                is_active=True
            )
            db.session.add(dataset)
            db.session.commit()

            print(f"Training ML model for {business.name}...")
            result = train_and_forecast_model(
                filepath=dataset.filepath,
                business_id=business.id,
                model_dir=app.config['MODEL_FOLDER'],
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

            print(f"  -> Model R2: {result['metrics']['r2_score']:.4f}, MAE: {result['metrics']['mae']:.2f}, Forecasted 90 days.")

        print("\nSeed completed successfully!")

if __name__ == '__main__':
    seed()
