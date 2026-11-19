You are a senior full-stack software engineer and machine-learning engineer.

Your task is to build the COMPLETE production-quality MVP of a multi-business sales forecasting web application from scratch.

DO NOT just create a prototype or mock UI.

Implement the complete working system including:
- Next.js frontend
- Flask Python backend
- SQLite database
- Authentication
- Business management
- CSV upload
- CSV validation
- Data preprocessing
- Feature engineering
- Per-business Random Forest regression models
- Model evaluation
- 90-day sales forecasting
- Prediction storage
- Interactive dashboard
- Charts
- Model metrics
- Business data isolation
- Model persistence
- Upload history
- Error handling
- Loading states
- Testing
- Documentation
- Five realistic test datasets

The final application must actually work end-to-end.

==================================================
1. PROJECT OBJECTIVE
==================================================

Build a web-based sales prediction and analytics platform for multiple businesses.

The system allows a business owner to:

1. Register and log in.
2. Create/manage their business profile.
3. Upload historical sales data as a CSV file.
4. Have the system automatically validate and preprocess the data.
5. Train a machine-learning model specifically for that business.
6. Evaluate the model using MAE, RMSE and R².
7. Generate up to 90 days of future sales predictions.
8. Save the trained model.
9. Save generated predictions.
10. View historical sales, analytics, model performance and future forecasts on an interactive dashboard.
11. Upload updated datasets and retrain their business-specific model.
12. View their previous uploads and model training history.

CRITICAL:
Each business must have its OWN model trained ONLY on that business's data.

Do NOT create one global model trained using all businesses' data.

Example:

Business A → Dataset A → Model A → Predictions A
Business B → Dataset B → Model B → Predictions B
Business C → Dataset C → Model C → Predictions C

Business A must NEVER be able to access Business B's:
- datasets
- predictions
- model
- analytics
- business information

==================================================
2. TECHNOLOGY STACK
==================================================

Use the following architecture.

FRONTEND:
- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts for data visualization

BACKEND:
- Python
- Flask
- Flask REST API
- Flask-CORS

DATABASE:
- SQLite
- SQLAlchemy or another clean ORM approach

AUTHENTICATION:
- JWT-based authentication
- bcrypt/password hashing
- Protected backend routes

MACHINE LEARNING:
- Python
- Pandas
- NumPy
- Scikit-learn
- RandomForestRegressor

MODEL STORAGE:
- joblib or pickle

FILE STORAGE:
- Local uploads directory for development
- Local trained-model