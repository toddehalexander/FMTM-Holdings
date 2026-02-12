import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { EnrichedHolding } from '../types';

interface ChartsProps {
  holdings: EnrichedHolding[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const displayValue = data.originalValue !== undefined ? data.originalValue : data.value;

    return (
      <div className="bg-white dark:bg-slate-850 p-4 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl min-w-[180px]">
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100 dark:border-slate-700">
            <p className="font-bold text-gray-900 dark:text-white">{data.name}</p>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Impact:</span> 
            <span className={displayValue >= 0 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}>
              {displayValue > 0 ? '+' : ''}{displayValue.toFixed(3)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Weight:</span> 
            <span className="text-gray-700 dark:text-gray-200">{data.weight.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Day Change:</span> 
            <span className={data.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
               {data.change > 0 ? '+' : ''}{data.change.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const Charts: React.FC<ChartsProps> = ({ holdings }) => {
  // Prep data for Top Gainers (Top 5 Positive)
  const gainers = [...holdings]
    .filter(h => (h.contribution || 0) > 0)
    .sort((a, b) => (b.contribution || 0) - (a.contribution || 0))
    .slice(0, 5)
    .map(h => ({
      name: h.ticker,
      value: h.contribution || 0,
      originalValue: h.contribution || 0,
      weight: h.weight,
      change: h.marketData?.changePercent || 0,
      fill: '#22c55e' // green-500
    }));

  // Prep data for Top Losers (Top 5 Negative)
  const losers = [...holdings]
    .filter(h => (h.contribution || 0) < 0)
    .sort((a, b) => (a.contribution || 0) - (b.contribution || 0))
    .slice(0, 5)
    .map(h => ({
      name: h.ticker,
      value: Math.abs(h.contribution || 0),
      originalValue: h.contribution || 0,
      weight: h.weight,
      change: h.marketData?.changePercent || 0,
      fill: '#ef4444' // red-500
    }));

  if (holdings.length === 0) return null;

  const ChartSection = ({ title, data }: { title: string, data: any[] }) => (
    <div className="bg-white dark:bg-slate-850 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
                data={data} 
                layout="vertical" 
                margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={50} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} 
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No data available
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <ChartSection title="Top Contributors" data={gainers} />
      <ChartSection title="Top Detractors" data={losers} />
    </div>
  );
};