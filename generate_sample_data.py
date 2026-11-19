import os
import pandas as pd
import numpy as np

os.makedirs('sample_data', exist_ok=True)

np.random.seed(42)

def generate_retail_clothing():
    # 2 years of daily data
    dates = pd.date_range(start='2024-01-01', end='2025-12-31', freq='D')
    n = len(dates)
    
    # Base trend (in NGN, ~1,500 NGN/USD equivalent)
    trend = np.linspace(750000, 1800000, n)
    
    # Day of week seasonality (Weekend higher)
    day_of_week_effect = np.array([0.8, 0.9, 0.95, 1.0, 1.3, 1.7, 1.4])
    dow_factor = np.array([day_of_week_effect[d.dayofweek] for d in dates])
    
    # Yearly seasonality (Summer boost, November/December holiday spike)
    month_effect = np.array([0.7, 0.75, 0.9, 1.0, 1.1, 1.25, 1.2, 0.95, 1.05, 1.15, 1.6, 2.1])
    month_factor = np.array([month_effect[d.month - 1] for d in dates])
    
    noise = np.random.normal(1.0, 0.08, n)
    
    sales = trend * dow_factor * month_factor * noise
    
    df = pd.DataFrame({
        'Date': dates.strftime('%Y-%m-%d'),
        'Sales_Amount': np.round(sales, 2),
        'Transactions': np.random.randint(15, 80, n),
        'Category': 'Apparel & Fashion'
    })
    df.to_csv('sample_data/retail_clothing_sales.csv', index=False)
    print(f"Generated retail_clothing_sales.csv with {len(df)} rows")

def generate_cafe_bakery():
    dates = pd.date_range(start='2024-01-01', end='2025-12-31', freq='D')
    n = len(dates)
    
    trend = np.linspace(1200000, 2100000, n)
    # Weekday vs Weekend (Bakery peaks Fri-Sun)
    day_of_week_effect = np.array([0.85, 0.88, 0.92, 0.98, 1.3, 1.85, 1.75])
    dow_factor = np.array([day_of_week_effect[d.dayofweek] for d in dates])
    
    # Mild weather / season effect (Winter coffee peak, summer iced drinks)
    month_effect = np.array([1.1, 1.05, 1.0, 0.95, 0.95, 1.0, 1.05, 1.0, 0.98, 1.02, 1.1, 1.2])
    month_factor = np.array([month_effect[d.month - 1] for d in dates])
    
    noise = np.random.normal(1.0, 0.05, n)
    sales = trend * dow_factor * month_factor * noise
    
    df = pd.DataFrame({
        'date': dates.strftime('%Y-%m-%d'),
        'revenue': np.round(sales, 2),
        'customer_count': np.random.randint(80, 250, n)
    })
    df.to_csv('sample_data/cafe_bakery_sales.csv', index=False)
    print(f"Generated cafe_bakery_sales.csv with {len(df)} rows")

def generate_electronics_store():
    dates = pd.date_range(start='2024-01-01', end='2025-12-31', freq='D')
    n = len(dates)
    
    trend = np.linspace(3000000, 5700000, n)
    dow_factor = np.array([0.9, 0.9, 0.95, 1.0, 1.2, 1.6, 1.45])[np.array([d.dayofweek for d in dates])]
    
    # Big surge in Sept (Back to school / new tech) and Nov-Dec (Black Friday & Christmas)
    month_effect = np.array([0.8, 0.85, 0.9, 0.92, 0.95, 1.0, 1.05, 1.2, 1.35, 1.1, 1.8, 2.3])
    month_factor = np.array([month_effect[d.month - 1] for d in dates])
    
    noise = np.random.normal(1.0, 0.1, n)
    sales = trend * dow_factor * month_factor * noise
    
    df = pd.DataFrame({
        'Transaction_Date': dates.strftime('%Y-%m-%d'),
        'Total_Sales': np.round(sales, 2),
        'Items_Sold': np.random.randint(10, 60, n)
    })
    df.to_csv('sample_data/electronics_tech_sales.csv', index=False)
    print(f"Generated electronics_tech_sales.csv with {len(df)} rows")

def generate_pharmacy_health():
    dates = pd.date_range(start='2024-01-01', end='2025-12-31', freq='D')
    n = len(dates)
    
    # Stable essential demand
    trend = np.linspace(2250000, 3300000, n)
    dow_factor = np.array([1.1, 1.15, 1.1, 1.05, 1.05, 0.85, 0.7])[np.array([d.dayofweek for d in dates])] # Weekdays higher for prescription refills
    
    # Flu season peak in winter (Jan, Feb, Nov, Dec)
    month_effect = np.array([1.3, 1.25, 1.1, 0.95, 0.9, 0.85, 0.85, 0.9, 1.0, 1.05, 1.2, 1.35])
    month_factor = np.array([month_effect[d.month - 1] for d in dates])
    
    noise = np.random.normal(1.0, 0.04, n)
    sales = trend * dow_factor * month_factor * noise
    
    df = pd.DataFrame({
        'date': dates.strftime('%Y-%m-%d'),
        'daily_sales': np.round(sales, 2),
        'prescriptions_filled': np.random.randint(50, 140, n)
    })
    df.to_csv('sample_data/pharmacy_health_sales.csv', index=False)
    print(f"Generated pharmacy_health_sales.csv with {len(df)} rows")

def generate_saas_ecommerce():
    dates = pd.date_range(start='2024-01-01', end='2025-12-31', freq='D')
    n = len(dates)
    
    # Strong growth trend
    trend = np.linspace(1500000, 6750000, n)
    dow_factor = np.array([1.2, 1.25, 1.2, 1.15, 1.1, 0.6, 0.5])[np.array([d.dayofweek for d in dates])] # B2B weekday renewals
    
    # End of quarter boosts (Mar, Jun, Sep, Dec)
    month_effect = np.array([0.9, 0.95, 1.2, 0.95, 1.0, 1.25, 0.9, 0.95, 1.3, 1.0, 1.1, 1.4])
    month_factor = np.array([month_effect[d.month - 1] for d in dates])
    
    noise = np.random.normal(1.0, 0.06, n)
    sales = trend * dow_factor * month_factor * noise
    
    df = pd.DataFrame({
        'Date': dates.strftime('%Y-%m-%d'),
        'ARR_Sales': np.round(sales, 2),
        'New_Signups': np.random.randint(5, 35, n)
    })
    df.to_csv('sample_data/saas_ecommerce_sales.csv', index=False)
    print(f"Generated saas_ecommerce_sales.csv with {len(df)} rows")

if __name__ == '__main__':
    generate_retail_clothing()
    generate_cafe_bakery()
    generate_electronics_store()
    generate_pharmacy_health()
    generate_saas_ecommerce()
