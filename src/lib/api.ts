const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin?: boolean;
  created_at: string;
}

export interface Business {
  id: number;
  user_id: number;
  name: string;
  industry: string;
  description: string;
  created_at: string;
  datasets_count: number;
  has_active_model: boolean;
}

export interface SalesDataset {
  id: number;
  business_id: number;
  filename: string;
  uploaded_at: string;
  row_count: number;
  start_date: string;
  end_date: string;
  date_column: string;
  sales_column: string;
  is_active: boolean;
}

export interface ModelMetric {
  id: number;
  business_id: number;
  dataset_id: number;
  trained_at: string;
  mae: number;
  rmse: number;
  r2_score: number;
  training_duration_sec: number;
  feature_importance: Record<string, number>;
}

export interface ForecastPrediction {
  id: number;
  business_id: number;
  model_metric_id: number;
  date: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

export interface DashboardData {
  business: Business;
  dataset: SalesDataset | null;
  latest_metric: ModelMetric | null;
  summary: {
    total_historical_sales: number;
    total_forecasted_sales: number;
    historical_days_count: number;
    forecast_days_count: number;
  };
  historical_data: Array<{ date: string; actual: number }>;
  forecast_data: ForecastPrediction[];
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('forecast_auth_token') : null;
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An unexpected API error occurred');
  }

  return data as T;
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; full_name: string }) =>
      request<{ message: string; token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      request<{ message: string; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () => request<{ user: User }>('/auth/me'),
  },

  business: {
    list: () => request<{ businesses: Business[] }>('/businesses'),
    create: (data: { name: string; industry?: string; description?: string }) =>
      request<{ message: string; business: Business }>('/businesses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (id: number) => request<{ business: Business }>(`/businesses/${id}`),
    update: (id: number, data: Partial<Business>) =>
      request<{ message: string; business: Business }>(`/businesses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) => request<{ message: string }>(`/businesses/${id}`, { method: 'DELETE' }),
  },

  sales: {
    upload: (businessId: number, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return request<{ message: string; dataset: SalesDataset; validation: { columns: string[]; preview: Record<string, unknown>[] } }>(
        `/businesses/${businessId}/datasets`,
        {
          method: 'POST',
          body: formData,
        }
      );
    },
    uploadNewBusiness: (formData: FormData) => {
      return request<{
        message: string;
        business: Business;
        dataset: SalesDataset;
        metrics: ModelMetric;
        forecast_count: number;
        validation: { columns: string[]; preview: Record<string, unknown>[] };
      }>('/businesses/upload_new_business', {
        method: 'POST',
        body: formData,
      });
    },
    list: (businessId: number) =>
      request<{ datasets: SalesDataset[] }>(`/businesses/${businessId}/datasets`),
    preview: (businessId: number, datasetId: number) =>
      request<{ dataset: SalesDataset; preview: Record<string, unknown>[]; columns: string[] }>(
        `/businesses/${businessId}/datasets/${datasetId}/preview`
      ),
  },

  forecast: {
    train: (businessId: number, forecastDays: number = 90) =>
      request<{
        message: string;
        metrics: ModelMetric;
        forecast_count: number;
        dataset_info: Record<string, unknown>;
      }>(`/businesses/${businessId}/train`, {
        method: 'POST',
        body: JSON.stringify({ forecast_days: forecastDays }),
      }),

    getDashboard: (businessId: number) =>
      request<DashboardData>(`/businesses/${businessId}/dashboard`),

    getModelHistory: (businessId: number) =>
      request<{ model_history: ModelMetric[] }>(`/businesses/${businessId}/model-history`),
  },

  admin: {
    getOverview: () =>
      request<{
        kpis: {
          total_users: number;
          total_businesses: number;
          total_datasets: number;
          total_models_trained: number;
          avg_r2_score: number;
          avg_mae: number;
        };
        businesses: Array<{
          id: number;
          name: string;
          industry: string;
          description: string;
          created_at: string | null;
          owner: { id: number; full_name: string; email: string } | null;
          datasets_count: number;
          has_dataset: boolean;
          active_dataset_filename: string | null;
          model_evaluation: {
            id: number;
            trained_at: string | null;
            r2_score: number;
            mae: number;
            evaluation_grade: string;
            badge_color: string;
          } | null;
        }>;
        datasets_evaluation: Array<{
          dataset_id: number;
          filename: string;
          uploaded_at: string;
          row_count: number;
          start_date: string;
          end_date: string;
          date_column: string;
          sales_column: string;
          is_active: boolean;
          business: { id: number; name: string; industry: string } | null;
          owner: { id: number; full_name: string; email: string } | null;
          model_evaluation: {
            id: number;
            trained_at: string;
            mae: number;
            rmse: number;
            r2_score: number;
            duration_sec: number;
            feature_importance: Record<string, number>;
            evaluation_grade: string;
            badge_color: string;
            evaluation_summary: string;
          } | null;
        }>;
      }>('/admin/overview'),

    reEvaluateModel: (businessId: number) =>
      request<{
        message: string;
        business_name: string;
        metrics: ModelMetric;
        evaluation: { grade: string; badge_color: string; summary: string };
      }>(`/admin/re-evaluate/${businessId}`, {
        method: 'POST',
      }),
  },
};
