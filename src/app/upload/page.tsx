'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import UploadCard from '@/components/UploadCard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, Info } from 'lucide-react';

export default function UploadPage() {
  const { activeBusiness } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
              Upload & Validate CSV Dataset
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Upload sales dataset specifically for{' '}
              <span className="font-semibold text-slate-800">{activeBusiness?.name || 'Selected Business'}</span>.
              Each business maintains strict data isolation and an independent machine learning model.
            </p>
          </div>

          <UploadCard onSuccess={() => router.push('/')} />

          {/* Guidelines & Template Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-xs">
              <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-sm">
                <Info className="h-4 w-4" />
                <span>CSV Data Format Recommendations</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
                <li>
                  <strong className="text-slate-800">Date Field:</strong> Include a date column such as{' '}
                  <code className="text-indigo-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Date</code>,{' '}
                  <code className="text-indigo-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Transaction_Date</code>, or{' '}
                  <code className="text-indigo-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">ds</code> (formatted YYYY-MM-DD).
                </li>
                <li>
                  <strong className="text-slate-800">Sales Field:</strong> Include a numeric sales/revenue column such as{' '}
                  <code className="text-emerald-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Sales_Amount</code>,{' '}
                  <code className="text-emerald-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">revenue</code>, or{' '}
                  <code className="text-emerald-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">daily_sales</code>.
                </li>
                <li>
                  <strong className="text-slate-800">Dataset Length:</strong> Datasets with at least 90–180+ days of history yield optimal accuracy for Random Forest seasonal modeling.
                </li>
                <li>
                  <strong className="text-slate-800">Data Isolation:</strong> Uploaded CSV files are strictly stored under your business sandbox and never mixed with other businesses.
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 border border-indigo-100 rounded-3xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-sm">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Company Sales Template</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Download a pre-formatted example company sales dataset with 90+ days of daily transactions, seasonality, and product categories.
                </p>
                <div className="bg-white border border-slate-200 rounded-2xl p-3 text-[11px] font-mono text-slate-700 overflow-x-auto">
                  <p className="text-slate-400 font-semibold pb-1 border-b border-slate-100 mb-1">CSV Header Example:</p>
                  <p className="text-indigo-600">Date,Sales_Amount,Transactions,Category</p>
                  <p className="text-slate-500">2024-01-01,1868250.00,45,Retail & Merchandise</p>
                  <p className="text-slate-500">2024-01-02,1770300.00,41,Retail & Merchandise</p>
                </div>
              </div>

              <a
                href="/company_sales_template.csv"
                download="company_sales_template.csv"
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                <span>Download Sample Template (.CSV)</span>
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

