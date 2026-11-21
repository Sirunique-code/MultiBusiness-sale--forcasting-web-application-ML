'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api, DashboardData } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SalesForecastChart from '@/components/SalesForecastChart';
import FeatureImportanceBar from '@/components/FeatureImportanceBar';
import UploadCard from '@/components/UploadCard';
import { 
  TrendingUp, 
  Banknote, 
  Target, 
  Activity, 
  Loader2, 
  Play, 
  Sparkles, 
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import BusinessModal from '@/components/BusinessModal';

export default function DashboardPage() {
  const { user, activeBusiness, loading: authLoading } = useAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState<boolean>(false);

  const fetchDashboard = useCallback(async () => {
    if (!activeBusiness) {
      setDashboardData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.forecast.getDashboard(activeBusiness.id);
      setDashboardData(data);
    } catch (err) {
      const errorObj = err as Error;
      console.error('Failed to load dashboard:', err);
      setError(errorObj.message || 'Could not fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      if (authLoading) return;
      if (!activeBusiness) {
        if (isSubscribed) {
          setDashboardData(null);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await api.forecast.getDashboard(activeBusiness.id);
        if (isSubscribed) {
          setDashboardData(data);
          setError(null);
        }
      } catch (err) {
        if (isSubscribed) {
          const errorObj = err as Error;
          console.error('Failed to load dashboard:', err);
          setError(errorObj.message || 'Could not fetch dashboard metrics.');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [authLoading, activeBusiness]);

  const handleRetrain = async () => {
    if (!activeBusiness) return;
    setIsTraining(true);
    try {
      await api.forecast.train(activeBusiness.id, 90);
      await fetchDashboard();
    } catch (err) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Retraining failed.');
    } finally {
      setIsTraining(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 space-x-2">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Initializing session...</span>
      </div>
    );
  }

  const metric = dashboardData?.latest_metric;
  const summary = dashboardData?.summary;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-50 via-white to-purple-50 border border-indigo-100 p-6 rounded-3xl shadow-xs">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="h-4 w-4" />
                <span>Executive Dashboard</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                {activeBusiness ? activeBusiness.name : 'Select or Create a Business'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {activeBusiness?.description || 'Train business-isolated machine learning models to forecast future revenue.'}
              </p>
            </div>

            {activeBusiness && dashboardData?.dataset && (
              <button
                onClick={handleRetrain}
                disabled={isTraining}
                className="flex items-center space-x-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 self-start sm:self-auto"
              >
                {isTraining ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Retraining Model...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>Retrain ML Model</span>
                  </>
                )}
              </button>
            )}
          </div>

          {!user ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xs max-w-2xl mx-auto my-8">
              <div className="h-16 w-16 rounded-3xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900">Welcome to Sales Forecasting</h2>
                <p className="text-sm text-slate-500 max-w-lg mx-auto">
                  Sign in or create an account to access machine learning sales predictions, interactive forecast charts, and automated CSV validation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                >
                  Sign In to Account
                </Link>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
                >
                  Register Free Account
                </Link>
              </div>
            </div>
          ) : !activeBusiness ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
              <div className="h-16 w-16 rounded-3xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">No Business Profile Selected</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {user.is_admin
                    ? 'Create a business profile or select an existing profile from the top dropdown to view predictions.'
                    : 'Please select an available business profile from the top dropdown to view sales predictions and forecasting analytics.'}
                </p>
              </div>
              {user.is_admin && (
                <button
                  onClick={() => setIsBusinessModalOpen(true)}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all inline-block"
                >
                  Create New Business
                </button>
              )}
            </div>
          ) : loading ? (
            <div className="py-20 flex justify-center items-center text-slate-500 space-x-2">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="text-sm font-medium">Loading sales analytics & forecast model...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
              {error}
            </div>
          ) : (
            <>
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Historical Sales Card */}
                <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
                    <span>Total Historical Sales</span>
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <Banknote className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ₦{summary ? summary.total_historical_sales.toLocaleString('en-US') : 0}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Over {summary?.historical_days_count || 0} recorded daily transactions
                  </p>
                </div>

                {/* 90-Day Forecast Revenue Card */}
                <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
                    <span>90-Day Forecast Revenue</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600">
                    ₦{summary ? summary.total_forecasted_sales.toLocaleString('en-US') : 0}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Predicted revenue over next 90 days
                  </p>
                </div>

                {/* Model Accuracy R2 Card */}
                <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
                    <span>Model Accuracy (R² Score)</span>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                      <Target className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-purple-600">
                    {metric ? `${(metric.r2_score * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Random Forest variance score
                  </p>
                </div>

                {/* MAE Error Metric Card */}
                <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
                    <span>Mean Absolute Error (MAE)</span>
                    <div className="p-2 rounded-xl bg-pink-50 text-pink-600">
                      <Activity className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-pink-600">
                    {metric ? `₦${metric.mae.toLocaleString()}` : 'N/A'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    RMSE: {metric ? `₦${metric.rmse.toLocaleString()}` : 'N/A'}
                  </p>
                </div>

              </div>

              {/* Main Sales & Forecast Chart */}
              {dashboardData?.forecast_data && dashboardData.forecast_data.length > 0 ? (
                <SalesForecastChart
                  historicalData={dashboardData.historical_data}
                  forecastData={dashboardData.forecast_data}
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-xs">
                  <FileSpreadsheet className="h-10 w-10 text-indigo-600 mx-auto" />
                  <h3 className="font-bold text-slate-800">No ML Forecast Generated Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Upload a CSV sales dataset to automatically fit an isolated Random Forest regression model.
                  </p>
                </div>
              )}

              {/* Grid: Feature Importance & Quick Upload */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {metric?.feature_importance && (
                  <FeatureImportanceBar featureImportance={metric.feature_importance} />
                )}
                <UploadCard onSuccess={fetchDashboard} />
              </div>
            </>
          )}

        </main>
      </div>

      <BusinessModal isOpen={isBusinessModalOpen} onClose={() => setIsBusinessModalOpen(false)} />
    </div>
  );
}

