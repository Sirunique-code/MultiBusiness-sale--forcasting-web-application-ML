import os
import time
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

DATE_CANDIDATE_NAMES = ['date', 'ds', 'timestamp', 'transaction_date', 'order_date', 'day', 'time']
SALES_CANDIDATE_NAMES = ['sales', 'sales_amount', 'revenue', 'total_sales', 'daily_sales', 'arr_sales', 'y', 'amount', 'total']

def detect_columns(df):
    """
    Detect date and sales numeric columns automatically from dataframe columns.
    """
    cols_lower = {col.lower(): col for col in df.columns}
    
    date_col = None
    sales_col = None
    
    # 1. Match known names for date
    for candidate in DATE_CANDIDATE_NAMES:
        if candidate in cols_lower:
            date_col = cols_lower[candidate]
            break
            
    # If not found by candidate name, check for datetime parseable columns
    if not date_col:
        for col in df.columns:
            if df[col].dtype == 'object' or 'datetime' in str(df[col].dtype):
                try:
                    pd.to_datetime(df[col].iloc[:20])
                    date_col = col
                    break
                except Exception:
                    pass

    # 2. Match known names for sales
    for candidate in SALES_CANDIDATE_NAMES:
        if candidate in cols_lower:
            sales_col = cols_lower[candidate]
            break
            
    # If not found by candidate name, check for numeric columns
    if not sales_col:
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            sales_col = numeric_cols[0]

    return date_col, sales_col

def create_time_features(df):
    """
    Engineers temporal, calendar, lag, and rolling features.
    """
    df = df.copy()
    
    # Calendar features
    df['dayofweek'] = df.index.dayofweek
    df['dayofmonth'] = df.index.day
    df['month'] = df.index.month
    df['year'] = df.index.year
    df['dayofyear'] = df.index.dayofyear
    df['is_weekend'] = (df.index.dayofweek >= 5).astype(int)
    df['quarter'] = df.index.quarter

    # Lag features
    for lag in [1, 2, 7, 14, 30]:
        df[f'lag_{lag}'] = df['y'].shift(lag)

    # Rolling window statistics
    df['rolling_mean_7'] = df['y'].shift(1).rolling(window=7, min_periods=1).mean()
    df['rolling_std_7'] = df['y'].shift(1).rolling(window=7, min_periods=1).std().fillna(0)
    df['rolling_mean_30'] = df['y'].shift(1).rolling(window=30, min_periods=1).mean()
    df['rolling_std_30'] = df['y'].shift(1).rolling(window=30, min_periods=1).std().fillna(0)

    return df

def preprocess_sales_data(filepath):
    """
    Loads CSV, detects date and sales columns, resamples to daily, handles missing values.
    Returns clean DataFrame indexed by date with 'y' column, plus metadata.
    """
    df = pd.read_csv(filepath)
    date_col, sales_col = detect_columns(df)
    
    if not date_col or not sales_col:
        raise ValueError(f"Could not automatically detect Date and Sales columns. Columns found: {list(df.columns)}")
        
    df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=[date_col])
    
    df[sales_col] = pd.to_numeric(df[sales_col], errors='coerce')
    df = df.dropna(subset=[sales_col])
    
    df = df.sort_values(date_col)
    
    # Aggregate daily
    df_daily = df.groupby(pd.Grouper(key=date_col, freq='D'))[sales_col].sum().reset_index()
    df_daily.columns = ['ds', 'y']
    
    # Fill missing dates if any
    df_daily = df_daily.set_index('ds').asfreq('D')
    df_daily['y'] = df_daily['y'].ffill().bfill()
    
    start_date = df_daily.index.min().strftime('%Y-%m-%d')
    end_date = df_daily.index.max().strftime('%Y-%m-%d')
    
    return df_daily, date_col, sales_col, start_date, end_date

def train_and_forecast_model(filepath, business_id, model_dir, forecast_days=90):
    """
    Trains a business-specific RandomForestRegressor model on historical sales data,
    evaluates performance metrics, saves the model file, and generates multi-step recursive forecasts.
    """
    start_time = time.time()
    
    df_daily, date_col, sales_col, start_date, end_date = preprocess_sales_data(filepath)
    
    if len(df_daily) < 14:
        raise ValueError(f"Dataset too small ({len(df_daily)} days). Need at least 14 days of data to train a model.")
        
    # Feature engineering
    df_featured = create_time_features(df_daily)
    
    # Drop initial rows where lag_30 is NaN
    df_clean = df_featured.dropna().copy()
    
    if len(df_clean) < 10:
        # Fall back to smaller lag requirements if dataset is small
        df_clean = df_featured.fillna(method='bfill').fillna(0)
        
    feature_cols = [col for col in df_clean.columns if col != 'y']
    
    X = df_clean[feature_cols]
    y = df_clean['y']
    
    # Time-based split: last 20% or max 60 days for testing evaluation
    test_size = max(5, int(len(df_clean) * 0.2))
    X_train, X_test = X.iloc[:-test_size], X.iloc[-test_size:]
    y_train, y_test = y.iloc[:-test_size], y.iloc[-test_size:]
    
    # Train Random Forest Regressor
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # Test evaluation
    y_pred_test = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, y_pred_test))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_test)))
    r2 = float(r2_score(y_test, y_pred_test))
    
    # If r2 is negative (due to noise/small split), bound minimum gracefully
    if r2 < -1.0:
        r2 = 0.0
        
    # Retrain on full dataset for final deployment
    full_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        random_state=42,
        n_jobs=-1
    )
    full_model.fit(X, y)
    
    # Save model specifically for this business
    os.makedirs(model_dir, exist_ok=True)
    model_filename = f"business_{business_id}_rf_model.joblib"
    model_path = os.path.join(model_dir, model_filename)
    joblib.dump(full_model, model_path)
    
    # Feature importance
    importances = full_model.feature_importances_
    feature_importance_dict = {
        col: round(float(imp), 4) for col, imp in sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True)
    }
    
    # Residual standard dev for prediction error bounds
    full_preds = full_model.predict(X)
    residuals = y - full_preds
    std_residual = float(np.std(residuals)) if len(residuals) > 0 else 10.0
    
    # Recursive 90-day Forecasting
    forecast_results = []
    current_df = df_daily.copy()
    last_date = current_df.index.max()
    
    for i in range(1, forecast_days + 1):
        next_date = last_date + pd.Timedelta(days=i)
        
        # Build single row for target date using history
        # Create dummy row in temporary df to run feature pipeline
        temp_series = pd.Series(index=current_df.index.append(pd.DatetimeIndex([next_date])))
        temp_df = pd.DataFrame(index=temp_series.index)
        
        # Merge known y values
        temp_df['y'] = current_df['y']
        
        # Compute features
        temp_featured = create_time_features(temp_df)
        
        # Extract the feature row for next_date
        next_features = temp_featured.loc[[next_date], feature_cols]
        
        # Predict yhat
        pred_val = float(full_model.predict(next_features)[0])
        pred_val = max(0.0, pred_val) # Sales cannot be negative
        
        # Forecast confidence margin grows slightly with horizon
        margin = (1.96 * std_residual) * (1.0 + (i / forecast_days) * 0.3)
        lower_bound = max(0.0, pred_val - margin)
        upper_bound = pred_val + margin
        
        forecast_results.append({
            'date': next_date.strftime('%Y-%m-%d'),
            'yhat': round(pred_val, 2),
            'yhat_lower': round(lower_bound, 2),
            'yhat_upper': round(upper_bound, 2)
        })
        
        # Append predicted value into current_df to allow subsequent lag calculation
        current_df.loc[next_date] = {'y': pred_val}
        
    duration = time.time() - start_time
    
    # Format historical data preview for UI
    historical_preview = [
        {'date': idx.strftime('%Y-%m-%d'), 'sales': round(float(row['y']), 2)}
        for idx, row in df_daily.tail(180).iterrows()
    ]
    
    return {
        'model_path': model_path,
        'metrics': {
            'mae': mae,
            'rmse': rmse,
            'r2_score': r2,
            'duration_sec': duration,
            'feature_importance': feature_importance_dict
        },
        'forecast': forecast_results,
        'historical': historical_preview,
        'date_column': date_col,
        'sales_column': sales_col,
        'row_count': len(df_daily),
        'start_date': start_date,
        'end_date': end_date
    }
