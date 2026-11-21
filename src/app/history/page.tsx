'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { api, SalesDataset, ModelMetric } from '@/lib/api';
import { 
  History, 
  FileSpreadsheet, 
  Cpu, 
  CheckCircle2, 
  Loader2, 
  Clock
} from 'lucide-react';

export default function HistoryPage() {
  const { user, activeBusiness } = useAuth();
  const [datasets, setDatasets] = useState<SalesDataset[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!activeBusiness) {
        setDatasets([]);
        setModelMetrics([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [dsRes, metricRes] = await Promise.all([
          api.sales.list(activeBusiness.id),
          api.forecast.getModelHistory(activeBusiness.id),
        ]);
        setDatasets(dsRes.datasets || []);
        setModelMetrics(metricRes.model_history || []);
      } catch (err) {
        const errorObj = err as Error;
        setError(errorObj.message || 'Failed to load history.');
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [activeBusiness]);

  if (user && !user.is_admin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
        <Navbar />
        <div className="flex-1 flex flex-col md:flex-row">
          <Sidebar />
          <main className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <History className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Administrator Access Required</h2>
            <p className="text-xs text-slate-500 max-w-md">
              Datasets and model training audit logs are restricted to platform administrators.
            </p>
            <Link href="/" className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20">
              Return to Executive Dashboard
            </Link>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <History className="h-6 w-6 text-indigo-600" />
              Datasets & Model Training History
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Audit log of historical CSV uploads and trained Random Forest model evaluations for{' '}
              <span className="font-semibold text-slate-800">{activeBusiness?.name || 'Selected Business'}</span>
            </p>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center items-center text-slate-500 space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="text-sm">Loading history records...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
              {error}
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Section 1: Uploaded Datasets */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                  Uploaded CSV Sales Datasets ({datasets.length})
                </h2>

                {datasets.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center text-slate-500 text-xs shadow-xs">
                    No CSV datasets uploaded yet for this business profile.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            <th className="py-3.5 px-6">Filename</th>
                            <th className="py-3.5 px-6">Uploaded Date</th>
                            <th className="py-3.5 px-6">Record Count</th>
                            <th className="py-3.5 px-6">Detected Range</th>
                            <th className="py-3.5 px-6">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium">
                          {datasets.map((d) => (
                            <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-6 font-semibold text-slate-800 flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                                {d.filename}
                              </td>
                              <td className="py-3.5 px-6 text-slate-500">
                                {d.uploaded_at ? new Date(d.uploaded_at).toLocaleString() : 'N/A'}
                              </td>
                              <td className="py-3.5 px-6 text-slate-700 font-mono">
                                {d.row_count} rows
                              </td>
                              <td className="py-3.5 px-6 text-slate-500 font-mono text-[11px]">
                                {d.start_date} → {d.end_date}
                              </td>
                              <td className="py-3.5 px-6">
                                {d.is_active ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="h-3 w-3" /> Active Dataset
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Archived</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Model Training Logs */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-purple-600" />
                  Model Training & Evaluation Log ({modelMetrics.length})
                </h2>

                {modelMetrics.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center text-slate-500 text-xs shadow-xs">
                    No ML model trainings recorded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modelMetrics.map((m) => (
                      <div
                        key={m.id}
                        className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3"
                      >
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider block">
                              Random Forest Regressor
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {m.trained_at ? new Date(m.trained_at).toLocaleString() : ''}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-xl">
                            Duration: {m.training_duration_sec}s
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 font-semibold block">R² ACCURACY</span>
                            <span className="text-sm font-bold text-purple-700">
                              {(m.r2_score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 font-semibold block">MAE ERROR</span>
                            <span className="text-sm font-bold text-pink-600">₦{Number(m.mae).toLocaleString()}</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 font-semibold block">RMSE</span>
                            <span className="text-sm font-bold text-indigo-700">₦{Number(m.rmse).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
