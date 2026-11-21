import pandas as pd
import numpy as np
from app.services.ml_engine import detect_columns

def validate_csv_file(filepath):
    """
    Validates CSV file for sales forecasting suitability.
    Checks:
    - Readable CSV format
    - At least 10 rows
    - Presence of date and sales columns
    - Valid date formats
    - Non-negative sales values check
    Returns (is_valid, message, metadata)
    """
    try:
        df = pd.read_csv(filepath)
    except Exception as e:
        return False, f"Failed to parse CSV file: {str(e)}", {}

    if len(df) < 10:
        return False, f"Dataset must contain at least 10 rows. Found only {len(df)} rows.", {}

    date_col, sales_col = detect_columns(df)

    if not date_col:
        return False, f"Could not detect a valid Date column in CSV. Found columns: {list(df.columns)}", {}

    if not sales_col:
        return False, f"Could not detect a valid Sales/Revenue numeric column in CSV. Found columns: {list(df.columns)}", {}

    # Validate date column parseability
    valid_dates = pd.to_datetime(df[date_col], errors='coerce')
    null_dates = valid_dates.isna().sum()
    if null_dates > len(df) * 0.3:
        return False, f"More than 30% of dates in column '{date_col}' could not be parsed.", {}

    # Validate sales column numeric parseability
    valid_sales = pd.to_numeric(df[sales_col], errors='coerce')
    null_sales = valid_sales.isna().sum()
    if null_sales > len(df) * 0.3:
        return False, f"More than 30% of values in sales column '{sales_col}' are non-numeric.", {}

    min_date = valid_dates.min().strftime('%Y-%m-%d')
    max_date = valid_dates.max().strftime('%Y-%m-%d')

    metadata = {
        'row_count': len(df),
        'date_column': date_col,
        'sales_column': sales_col,
        'start_date': min_date,
        'end_date': max_date,
        'columns': list(df.columns),
        'preview': df.head(5).to_dict(orient='records')
    }

    return True, "CSV dataset validation successful.", metadata
