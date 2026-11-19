'use client';

import React from 'react';
import { Cpu } from 'lucide-react';

interface FeatureImportanceBarProps {
  featureImportance: Record<string, number>;
}

export default function FeatureImportanceBar({ featureImportance }: FeatureImportanceBarProps) {
  const sortedFeatures = Object.entries(featureImportance || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8); // Top 8 features

  const maxImportance = sortedFeatures.length > 0 ? Math.max(...sortedFeatures.map(([, v]) => v)) : 1;

  const featureLabels: Record<string, string> = {
    rolling_mean_7: '7-Day Rolling Sales Average',
    rolling_mean_30: '30-Day Rolling Sales Average',
    lag_7: 'Same Day Previous Week (Lag 7)',
    lag_1: 'Previous Day Sales (Lag 1)',
    dayofweek: 'Day of Week Seasonality',
    dayofyear: 'Day of Year Seasonality',
    month: 'Monthly Seasonality',
    lag_14: '2 Weeks Prior Sales (Lag 14)',
    lag_30: '1 Month Prior Sales (Lag 30)',
    rolling_std_7: '7-Day Sales Volatility (Std)',
    is_weekend: 'Weekend Indicator',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
      <div className="flex items-center space-x-2 text-indigo-600 mb-1">
        <Cpu className="h-5 w-5" />
        <h3 className="font-bold text-slate-900 text-base">Model Feature Drivers</h3>
      </div>
      <p className="text-xs text-slate-500 mb-5">
        Random Forest Gini-importance breakdown of key sales signals
      </p>

      <div className="space-y-3.5">
        {sortedFeatures.map(([featureKey, score]) => {
          const percentage = Math.round((score / maxImportance) * 100);
          const formattedScore = (score * 100).toFixed(1);
          const label = featureLabels[featureKey] || featureKey;

          return (
            <div key={featureKey} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700 truncate max-w-[220px] sm:max-w-xs">{label}</span>
                <span className="text-indigo-600 font-mono font-semibold">{formattedScore}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

