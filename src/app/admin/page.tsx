'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  FileSpreadsheet, 
  BrainCircuit, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Loader2,
  Layers,
  BarChart3,
  Lock,
  ArrowRight,
  Eye,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

interface DatasetEvaluationItem {
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
}

interface AdminBusinessItem {
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
}

export default function AdminPage() {
  const { user, selectBusiness, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'businesses' | 'evaluations'>('businesses');
  
  const [data, setData] = useState<{
    kpis: {
      total_users: number;
      total_businesses: number;
      total_datasets: number;
      total_models_trained: number;
      avg_r2_score: number;
      avg_mae: number;
    };
    businesses?: AdminBusinessItem[];
    datasets_evaluation: DatasetEvaluationItem[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [reEvaluatingId, setReEvaluatingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.admin.getOverview();
      setData(res);
    } catch (err) {
      setError((err as Error).message || 'Failed to load admin panel overview.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.is_admin) {
      fetchAdminData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleReEvaluate = async (businessId: number) => {
    setReEvaluatingId(businessId);
    setActionMessage(null);
    try {
      const res = await api.admin.reEvaluateModel(businessId);
      setActionMessage(`Re-evaluation completed for "${res.business_name}". New R² Score: ${res.metrics.r2_score.toFixed(4)}.`);
      await fetchAdminData();
    } catch (err) {
      setError((err as Error).message || 'Re-evaluation failed.');
    } finally {
      setReEvaluatingId(null);
    }
  };

  const handleInspectBusiness = (b: AdminBusinessItem) => {
    selectBusiness({
      id: b.id,
      name: b.name,
      industry: b.industry,
      description: b.description,
      user_id: b.owner ? b.owner.id : 0,
      created_at: b.created_at || '',
      datasets_count: b.datasets_count || 0,
      has_active_model: !!b.model_evaluation,
    });
    router.push('/');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 space-x-2">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Loading Administrator Control Panel...</span>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Administrator Access Required</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              You must be logged in with administrator privileges to access the global evaluation dashboard and business profile feed.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <span>Return to Sales Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter business profiles
  const filteredBusinesses = (data?.businesses || []).filter((b) => {
    const matchesSearch = 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.owner?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.owner?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Filter evaluation feed
  const filteredEvaluations = (data?.datasets_evaluation || []).filter((item) => {
    const matchesSearch = 
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.business?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.owner?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.owner?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (gradeFilter === 'all') return true;
    return (item.model_evaluation?.evaluation_grade.toLowerCase() || '') === gradeFilter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          
          <Sidebar />

          <main className="flex-1 space-y-6">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" />
                  <span>Administrator Control Center</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Global Business Profiles & ML Evaluations
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Inspect every business profile registered across all user accounts. View active datasets, audit Random Forest model metrics ($R^2$, MAE, RMSE), and jump directly into any business dashboard.
                </p>
              </div>

              {/* Action message */}
              {actionMessage && (
                <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs rounded-2xl flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>{actionMessage}</span>
                </div>
              )}
            </div>

            {/* System KPI Overview Cards */}
            {data && (
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Registered Users</span>
                    <Users className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="text-xl font-extrabold text-slate-900">{data.kpis.total_users}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Businesses</span>
                    <Building2 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="text-xl font-extrabold text-slate-900">{data.kpis.total_businesses}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Uploaded Datasets</span>
                    <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="text-xl font-extrabold text-slate-900">{data.kpis.total_datasets}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Trained Models</span>
                    <BrainCircuit className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="text-xl font-extrabold text-slate-900">{data.kpis.total_models_trained}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">System Avg R²</span>
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-xl font-extrabold text-emerald-600">
                    {(data.kpis.avg_r2_score * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">System Avg MAE</span>
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="text-xl font-extrabold text-slate-900">
                    ₦{data.kpis.avg_mae.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
              <button
                onClick={() => setActiveTab('businesses')}
                className={`pb-3 border-b-2 flex items-center space-x-2 transition-all ${
                  activeTab === 'businesses'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>All Business Profiles ({data?.businesses?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('evaluations')}
                className={`pb-3 border-b-2 flex items-center space-x-2 transition-all ${
                  activeTab === 'evaluations'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Datasets & ML Audit Feed ({data?.datasets_evaluation.length || 0})</span>
              </button>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by business, user email, filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                {activeTab === 'evaluations' && (
                  <>
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Grade:</span>
                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 transition-all"
                    >
                      <option value="all">All Grades ({data?.datasets_evaluation.length || 0})</option>
                      <option value="excellent">Excellent (R² ≥ 0.8)</option>
                      <option value="good">Good (0.6 ≤ R² &lt; 0.8)</option>
                      <option value="fair">Fair (0.4 ≤ R² &lt; 0.6)</option>
                      <option value="needs improvement">Needs Improvement (R² &lt; 0.4)</option>
                    </select>
                  </>
                )}

                <button
                  onClick={fetchAdminData}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                  title="Refresh Overview"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* TAB 1: ALL BUSINESS PROFILES GRID */}
            {activeTab === 'businesses' && (
              <div className="space-y-4">
                {filteredBusinesses.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-2 shadow-xs">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                    <p className="text-sm font-semibold text-slate-900">No business profiles found</p>
                    <p className="text-xs text-slate-500">Try adjusting your search query.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredBusinesses.map((b) => {
                      const evalItem = b.model_evaluation;
                      const isReEvaluating = reEvaluatingId === b.id;

                      return (
                        <div
                          key={b.id}
                          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-indigo-300 transition-all space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            {/* Business Header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                                  ID: #{b.id} • {b.industry}
                                </span>
                                <h3 className="font-extrabold text-slate-900 text-lg mt-1">{b.name}</h3>
                              </div>

                              {evalItem && (
                                <span className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold ${
                                  evalItem.badge_color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  evalItem.badge_color === 'indigo' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                  evalItem.badge_color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  R² {(evalItem.r2_score * 100).toFixed(1)}%
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-2">{b.description || 'No description provided.'}</p>

                            {/* Owner Info & Details */}
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1 text-slate-600">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Account Owner:</span>
                                <span className="font-semibold text-slate-800">{b.owner?.full_name} ({b.owner?.email})</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Uploaded Datasets:</span>
                                <span className="font-semibold text-slate-800">{b.datasets_count} CSV files</span>
                              </div>
                              {b.active_dataset_filename && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Active CSV:</span>
                                  <span className="font-mono text-indigo-600 font-semibold truncate max-w-[180px]">{b.active_dataset_filename}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Business Actions Footer */}
                          <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => handleInspectBusiness(b)}
                              className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View Forecast Dashboard</span>
                            </button>

                            <button
                              onClick={() => handleReEvaluate(b.id)}
                              disabled={isReEvaluating || !b.has_dataset}
                              className="flex items-center justify-center space-x-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-40"
                              title="Re-evaluate & retrain ML model"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${isReEvaluating ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DATASETS & MODELS AUDIT FEED */}
            {activeTab === 'evaluations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <span>Evaluated Datasets & ML Models Audit Feed ({filteredEvaluations.length})</span>
                  </h3>
                </div>

                {filteredEvaluations.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-2 shadow-xs">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                    <p className="text-sm font-semibold text-slate-900">No matching datasets or model evaluations found</p>
                    <p className="text-xs text-slate-500">Try adjusting your search term or grade filter.</p>
                  </div>
                ) : (
                  filteredEvaluations.map((item) => {
                    const evalItem = item.model_evaluation;
                    const isReEvaluating = reEvaluatingId === item.business?.id;

                    return (
                      <div 
                        key={item.dataset_id} 
                        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-indigo-300 transition-all space-y-5"
                      >
                        {/* Item Top Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2.5">
                              <h4 className="font-bold text-slate-900 text-base">
                                {item.business?.name || 'Unassigned Business'}
                              </h4>
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold">
                                {item.business?.industry || 'General'}
                              </span>
                              {item.is_active && (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                  Active Model Dataset
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-3 text-xs text-slate-500">
                              <span>Owner: <strong className="text-slate-800 font-semibold">{item.owner?.full_name}</strong> ({item.owner?.email})</span>
                            </div>
                          </div>

                          {/* Evaluation Grade Badge */}
                          {evalItem ? (
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 ${
                                evalItem.badge_color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                evalItem.badge_color === 'indigo' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                evalItem.badge_color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Evaluation: {evalItem.evaluation_grade}</span>
                              </span>
                            </div>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                              Pending ML Training
                            </span>
                          )}
                        </div>

                        {/* Content Grid: Left Dataset details | Right ML Model Diagnostics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Dataset Details */}
                          <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                              <span className="flex items-center space-x-1.5">
                                <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                                <span>Uploaded CSV File Details</span>
                              </span>
                              <span className="text-slate-400 font-normal">{item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : ''}</span>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-600">
                              <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500">Filename:</span>
                                <span className="font-semibold text-slate-900 font-mono">{item.filename}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500">Row Count:</span>
                                <span className="font-semibold text-slate-900">{item.row_count} daily rows</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-200/60">
                                <span className="text-slate-500">Detected Schema:</span>
                                <span className="font-mono text-slate-800">Date: <strong className="text-indigo-600">{item.date_column}</strong> | Sales: <strong className="text-emerald-600">{item.sales_column}</strong></span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-slate-500">Coverage Range:</span>
                                <span className="font-semibold text-slate-800">{item.start_date} → {item.end_date}</span>
                              </div>
                            </div>
                          </div>

                          {/* ML Evaluation Diagnostics */}
                          {evalItem ? (
                            <div className="space-y-3 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
                              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                                <span className="flex items-center space-x-1.5">
                                  <BrainCircuit className="h-4 w-4 text-indigo-600" />
                                  <span>Random Forest Evaluation</span>
                                </span>
                                <span className="text-indigo-600 font-mono text-[11px]">Duration: {evalItem.duration_sec}s</span>
                              </div>

                              {/* Accuracy Meter */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600 font-medium">Model Accuracy ($R^2$ Score):</span>
                                  <span className="font-bold text-indigo-700">{(evalItem.r2_score * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-2 rounded-full transition-all ${
                                      evalItem.r2_score >= 0.8 ? 'bg-emerald-500' :
                                      evalItem.r2_score >= 0.6 ? 'bg-indigo-600' :
                                      evalItem.r2_score >= 0.4 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`} 
                                    style={{ width: `${Math.max(0, Math.min(100, evalItem.r2_score * 100))}%` }} 
                                  />
                                </div>
                              </div>

                              {/* Metrics MAE & RMSE */}
                              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                <div className="bg-white p-2 rounded-xl border border-indigo-100">
                                  <span className="text-[10px] text-slate-400 font-semibold block">MAE (MEAN ABS ERROR)</span>
                                  <span className="font-bold text-slate-900">₦{evalItem.mae.toLocaleString()}</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl border border-indigo-100">
                                  <span className="text-[10px] text-slate-400 font-semibold block">RMSE (ROOT MEAN SQ ERROR)</span>
                                  <span className="font-bold text-slate-900">₦{evalItem.rmse.toLocaleString()}</span>
                                </div>
                              </div>

                              {/* Evaluation Diagnostics Summary */}
                              <p className="text-[11px] text-slate-600 leading-snug pt-1 italic">
                                &quot;{evalItem.evaluation_summary}&quot;
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                              No ML evaluation metrics available for this dataset.
                            </div>
                          )}
                        </div>

                        {/* Feature Importances & Admin Actions Footer */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                          {evalItem && evalItem.feature_importance && (
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                              <span className="text-[11px] font-semibold text-slate-500 mr-1">Top Drivers:</span>
                              {Object.entries(evalItem.feature_importance)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .slice(0, 4)
                                .map(([feat, val]) => (
                                  <span key={feat} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-700">
                                    {feat}: <strong>{((val as number) * 100).toFixed(1)}%</strong>
                                  </span>
                                ))}
                            </div>
                          )}

                          {item.business && (
                            <div className="flex items-center space-x-2 ml-auto">
                              <button
                                onClick={() => handleInspectBusiness({
                                  id: item.business!.id,
                                  name: item.business!.name,
                                  industry: item.business!.industry,
                                  description: '',
                                  created_at: null,
                                  owner: item.owner,
                                  datasets_count: 1,
                                  has_dataset: true,
                                  active_dataset_filename: item.filename,
                                  model_evaluation: null
                                })}
                                className="flex items-center justify-center space-x-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Inspect Dashboard</span>
                              </button>

                              <button
                                onClick={() => handleReEvaluate(item.business!.id)}
                                disabled={isReEvaluating}
                                className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all disabled:opacity-50"
                              >
                                {isReEvaluating ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Re-Evaluating...</span>
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    <span>Retrain ML Model</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
