'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { api, ForecastPrediction } from '@/lib/api';
import { 
  TrendingUp, 
  Download, 
  Loader2, 
  Calendar, 
  Filter
} from 'lucide-react';

export default function ForecastPage() {
  const { activeBusiness } = useAuth();
  const [predictions, setPredictions] = useState<ForecastPrediction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [horizon, setHorizon] = useState<number>(90);

  useEffect(() => {
    async function loadForecast() {
      if (!activeBusiness) {
        setPredictions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await api.forecast.getDashboard(activeBusiness.id);
        setPredictions(res.forecast_data || []);
      } catch (err) {
        const errorObj = err as Error;
        setError(errorObj.message || 'Failed to load forecast data.');
      } finally {
        setLoading(false);
      }
    }

    loadForecast();
  }, [activeBusiness]);

  const visiblePredictions = predictions.slice(0, horizon);

  const downloadCSV = () => {
    if (visiblePredictions.length === 0 || !activeBusiness) return;

    const headers = ['Date', 'Forecasted_Sales', 'Confidence_Lower', 'Confidence_Upper'];
    const rows = visiblePredictions.map((p) => [
      p.date,
      p.yhat.toFixed(2),
      p.yhat_lower.toFixed(2),
      p.yhat_upper.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${activeBusiness.name.toLowerCase().replace(/\s+/g, '_')}_90day_forecast.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalForecasted = visiblePredictions.reduce((acc, curr) => acc + curr.yhat, 0);
  const avgDaily = visiblePredictions.length > 0 ? totalForecasted / visiblePredictions.length : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
                90-Day Forecast Schedule
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Detailed day-by-day sales predictions for{' '}
                <span className="font-semibold text-slate-800">{activeBusiness?.name || 'Selected Business'}</span>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Horizon Selector */}
              <div className="flex items-center space-x-1 bg-white border border-slate-200 p-1 rounded-2xl shadow-xs">
                <span className="text-xs text-slate-500 px-2 flex items-center gap-1 font-medium">
                  <Filter className="h-3.5 w-3.5 text-indigo-600" />
                  Horizon:
                </span>
                {[7, 30, 60, 90].map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
                      horizon === h
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {h}D
                  </button>
                ))}
              </div>

              {visiblePredictions.length > 0 && (
                <button
                  onClick={downloadCSV}
                  className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <span className="text-xs text-slate-500 block font-medium">Selected Period</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">Next {horizon} Days</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <span className="text-xs text-slate-500 block font-medium">Total Forecast Revenue</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block">
                ₦{totalForecasted.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <span className="text-xs text-slate-500 block font-medium">Average Daily Predicted Sales</span>
              <span className="text-xl font-bold text-indigo-600 mt-1 block">
                ₦{avgDaily.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Forecast Table */}
          {loading ? (
            <div className="py-20 flex justify-center items-center text-slate-500 space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="text-sm">Fetching prediction table...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
              {error}
            </div>
          ) : visiblePredictions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-2 shadow-xs">
              <p className="font-semibold text-slate-800">No predictions available</p>
              <p className="text-xs">Please train a Random Forest model on the dashboard or upload a dataset.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-6">Forecast Date</th>
                      <th className="py-3.5 px-6">Predicted Sales (Yhat)</th>
                      <th className="py-3.5 px-6">95% Lower Bound</th>
                      <th className="py-3.5 px-6">95% Upper Bound</th>
                      <th className="py-3.5 px-6">Confidence Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {visiblePredictions.map((pred, i) => {
                      const margin = ((pred.yhat_upper - pred.yhat_lower) / 2).toFixed(2);

                      return (
                        <tr key={pred.id || i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-6 text-slate-800 font-mono flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                            {pred.date}
                          </td>
                          <td className="py-3 px-6 text-emerald-600 font-bold font-mono">
                            ₦{pred.yhat.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-6 text-slate-600 font-mono">
                            ₦{pred.yhat_lower.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-6 text-slate-600 font-mono">
                            ₦{pred.yhat_upper.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-6 text-indigo-600 font-mono text-[11px]">
                            ±₦{margin}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
