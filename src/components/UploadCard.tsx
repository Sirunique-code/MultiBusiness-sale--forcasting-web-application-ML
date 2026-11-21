'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api, SalesDataset, Business } from '@/lib/api';
import { 
  UploadCloud, 
  FileCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Play,
  Sparkles,
  Download,
  FileSpreadsheet,
  Building2,
  PlusCircle,
  FolderOpen
} from 'lucide-react';

interface UploadCardProps {
  onSuccess?: () => void;
}

export default function UploadCard({ onSuccess }: UploadCardProps) {
  const { activeBusiness, businesses, refreshBusinesses, selectBusiness } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode: 'new' (Create new business profile for this CSV) or 'existing' (Upload to selected existing business)
  const [uploadMode, setUploadMode] = useState<'new' | 'existing'>('new');
  
  // Form fields for New Business
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('Retail & Commerce');
  const [description, setDescription] = useState('');

  // Target existing business ID
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | ''>(
    activeBusiness ? activeBusiness.id : (businesses.length > 0 ? businesses[0].id : '')
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadedDataset, setUploadedDataset] = useState<SalesDataset | null>(null);
  const [validationData, setValidationData] = useState<{ columns: string[]; preview: Record<string, unknown>[] } | null>(null);

  // Helper to extract clean suggested business name from CSV filename
  const cleanFilenameToBusinessName = (filename: string): string => {
    const baseName = filename.replace(/\.[^/.]+$/, ''); // Remove extension .csv
    const cleaned = baseName
      .replace(/[-_]/g, ' ') // Replace underscores and dashes with spaces
      .replace(/\b(sales|data|dataset|daily|revenue|historical|20\d\d)\b/gi, '') // Remove generic keywords
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return 'New Business Profile';
    // Capitalize words
    return cleaned
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleFileChange = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Only CSV files are allowed.');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setSuccessMessage(null);
    setUploadedDataset(null);
    setValidationData(null);

    // Auto-suggest business name if mode is 'new' and business name is empty or default
    if (!businessName || businessName === 'New Business Profile') {
      const suggested = cleanFilenameToBusinessName(file.name);
      setBusinessName(suggested);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndTrain = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select or drop a CSV file to upload.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (uploadMode === 'new') {
        if (!businessName.trim()) {
          setError('Please provide a Business Name for the new business profile.');
          setIsProcessing(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', businessName.trim());
        formData.append('industry', industry.trim() || 'General');
        formData.append('description', description.trim());

        const res = await api.sales.uploadNewBusiness(formData);
        setUploadedDataset(res.dataset);
        setValidationData(res.validation);
        setSuccessMessage(`Success! Business "${res.business.name}" created and ML model trained (${res.forecast_count} daily forecasts generated).`);

        // Refresh businesses and select the new business
        const updatedList = await refreshBusinesses(res.business.id);
        const newBiz = updatedList.find((b) => b.id === res.business.id);
        if (newBiz) selectBusiness(newBiz);

        if (onSuccess) onSuccess();

      } else {
        // Existing Business mode
        const targetId = typeof selectedBusinessId === 'number' ? selectedBusinessId : activeBusiness?.id;
        if (!targetId) {
          setError('Please select an existing business profile from the list.');
          setIsProcessing(false);
          return;
        }

        // Upload CSV
        const uploadRes = await api.sales.upload(targetId, selectedFile);
        setUploadedDataset(uploadRes.dataset);
        setValidationData(uploadRes.validation);

        // Train model
        const trainRes = await api.forecast.train(targetId, 90);
        setSuccessMessage(`Success! CSV updated and Random Forest model trained (${trainRes.forecast_count} daily forecasts generated).`);

        await refreshBusinesses(targetId);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Upload & ML training failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
      
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-indigo-600" />
            Upload Sales Dataset & Fit ML Model
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Create a new business profile or update an existing business model sandbox.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <a
            href="/company_sales_template.csv"
            download="company_sales_template.csv"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all"
            title="Download an example company CSV record template"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600" />
            <span>Sample CSV Template</span>
          </a>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start space-x-2 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start space-x-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleUploadAndTrain} className="space-y-5">
        
        {/* Mode Selector Tabs */}
        <div className="bg-slate-100/80 p-1.5 rounded-2xl flex grid grid-cols-2 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setUploadMode('new')}
            className={`flex items-center justify-center space-x-2 py-2 rounded-xl transition-all ${
              uploadMode === 'new'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="h-4 w-4 text-indigo-600" />
            <span>Create New Business Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadMode('existing')}
            className={`flex items-center justify-center space-x-2 py-2 rounded-xl transition-all ${
              uploadMode === 'existing'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="h-4 w-4 text-slate-500" />
            <span>Update Existing Business ({businesses.length})</span>
          </button>
        </div>

        {/* Form Inputs according to Mode */}
        {uploadMode === 'new' ? (
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" />
              <span>New Business Profile Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Apparel Retail"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Industry Category
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
                >
                  <option value="Apparel & Fashion">Apparel & Fashion</option>
                  <option value="Food & Beverage">Food & Beverage / Bakery</option>
                  <option value="Consumer Electronics">Consumer Electronics & Tech</option>
                  <option value="Healthcare & Pharmacy">Healthcare & Pharmacy</option>
                  <option value="Software & E-commerce">Software & E-commerce</option>
                  <option value="Retail & Commerce">Retail & General Commerce</option>
                  <option value="Other">Other / Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="Brief summary of business operations or sales seasonality"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
              />
            </div>
          </div>
        ) : (
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Select Target Business Profile
            </label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.industry}) — {b.datasets_count} datasets
                </option>
              ))}
            </select>
          </div>
        )}

        {/* CSV File Upload Dropzone */}
        <div className="space-y-2">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all space-y-2 group ${
              selectedFile
                ? 'border-indigo-500 bg-indigo-50/40'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={onFileInputChange}
              className="hidden"
            />

            <div className="h-10 w-10 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
              <UploadCloud className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800">
                {selectedFile ? selectedFile.name : 'Click or drag CSV sales file here'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Required columns: Date (YYYY-MM-DD) & Numeric Sales Amount
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 italic">
            {uploadMode === 'new'
              ? 'Creates business profile & automatically trains Random Forest model'
              : 'Updates sales dataset & retrains business ML model'}
          </span>

          <button
            type="submit"
            disabled={isProcessing || !selectedFile}
            className="flex items-center space-x-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing & Training ML Model...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 fill-white" />
                <span>Upload Dataset & Train Model</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Validation & Dataset Summary */}
      {uploadedDataset && validationData && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">TOTAL ROWS</span>
              <span className="text-xs font-bold text-slate-900">{uploadedDataset.row_count} Days</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">DATE COLUMN</span>
              <span className="text-xs font-bold text-indigo-600 font-mono">{uploadedDataset.date_column}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">SALES COLUMN</span>
              <span className="text-xs font-bold text-emerald-600 font-mono">{uploadedDataset.sales_column}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">DATE RANGE</span>
              <span className="text-[11px] font-semibold text-slate-700">
                {uploadedDataset.start_date} → {uploadedDataset.end_date}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
