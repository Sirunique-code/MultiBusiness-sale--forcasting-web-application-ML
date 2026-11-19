'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ForecastPrediction } from '@/lib/api';
import { Calendar, Filter } from 'lucide-react';

interface SalesForecastChartProps {
  historicalData: Array<{ date: string; actual: number }>;
  forecastData: ForecastPrediction[];
}

interface TooltipPayloadItem {
  dataKey: string;
  value: number | null;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const actualItem = payload.find((p) => p.dataKey === 'actual');
    const forecastItem = payload.find((p) => p.dataKey === 'forecast');
    const lowerItem = payload.find((p) => p.dataKey === 'lower');
    const upperItem = payload.find((p) => p.dataKey === 'upper');

    return (
      <div className="bg-white/95 border border-slate-200 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[180px]">
        <div className="flex items-center space-x-1.5 text-slate-700 font-semibold border-b border-slate-100 pb-1.5">
          <Calendar className="h-3.5 w-3.5 text-indigo-600" />
          <span>{label}</span>
        </div>

        {actualItem && actualItem.value !== null && (
          <div className="flex justify-between items-center text-indigo-700">
            <span>Historical Sales:</span>
            <span className="font-bold text-indigo-900">
              ₦{Number(actualItem.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {forecastItem && forecastItem.value !== null && (
          <div className="flex justify-between items-center text-emerald-700">
            <span>Forecasted Sales:</span>
            <span className="font-bold text-emerald-800">
              ₦{Number(forecastItem.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {lowerItem && upperItem && lowerItem.value !== null && upperItem.value !== null && (
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex justify-between">
            <span>Confidence (95%):</span>
            <span className="font-mono text-slate-700">
              ₦{Math.round(lowerItem.value).toLocaleString('en-US')} - ₦{Math.round(upperItem.value).toLocaleString('en-US')}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function SalesForecastChart({ historicalData, forecastData }: SalesForecastChartProps) {
  const [rangeDays, setRangeDays] = useState<number>(90);

  // Filter forecast by chosen range (7, 30, 60, 90)
  const filteredForecast = forecastData.slice(0, rangeDays);

  // Combine historical + forecast into single timeline dataset for smooth Recharts plotting
  const combinedData = [
    ...historicalData.map((d) => ({
      date: d.date,
      actual: d.actual,
      forecast: null,
      lower: null,
      upper: null,
    })),
    // Connect historical end to forecast start
    ...(historicalData.length > 0 && filteredForecast.length > 0
      ? [
          {
            date: historicalData[historicalData.length - 1].date,
            actual: historicalData[historicalData.length - 1].actual,
            forecast: historicalData[historicalData.length - 1].actual,
            lower: historicalData[historicalData.length - 1].actual,
            upper: historicalData[historicalData.length - 1].actual,
          },
        ]
      : []),
    ...filteredForecast.map((f) => ({
      date: f.date,
      actual: null,
      forecast: f.yhat,
      lower: f.yhat_lower,
      upper: f.yhat_upper,
      confidenceRange: [f.yhat_lower, f.yhat_upper] as [number, number],
    })),
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Historical Sales & 90-Day ML Forecast
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Random Forest Regressor predictions with dynamic confidence uncertainty bounds
          </p>
        </div>

        {/* Forecast Days Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200 self-start">
          <span className="text-xs text-slate-500 px-2 flex items-center gap-1 font-medium">
            <Filter className="h-3.5 w-3.5 text-indigo-600" />
            Horizon:
          </span>
          {[7, 30, 60, 90].map((days) => (
            <button
              key={days}
              onClick={() => setRangeDays(days)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
                rangeDays === days
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="historicalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>

              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>

              <linearGradient id="boundsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              minTickGap={30}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(val) => {
                if (val >= 1_000_000) return `₦${(val / 1_000_000).toFixed(1)}M`;
                if (val >= 1_000) return `₦${(val / 1_000).toFixed(0)}k`;
                return `₦${val}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
            />

            {/* Upper and Lower Confidence Bounds Area */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="url(#boundsGrad)"
              name="Confidence Range"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#ffffff"
              fillOpacity={0.95}
            />

            {/* Historical Sales Line */}
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#historicalGrad)"
              name="Historical Sales"
              connectNulls={true}
            />

            {/* Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#10b981"
              strokeWidth={3}
              strokeDasharray="4 4"
              dot={false}
              name="Predicted Sales (90D)"
              connectNulls={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

