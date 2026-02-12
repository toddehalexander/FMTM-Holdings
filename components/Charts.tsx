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
    // Use originalValue if available (for negative bars shown as positive magnitude), else value
    const displayValue = data.originalValue !== undefined ? data.originalValue : data.value;

    return (
      <div className="bg-white dark:bg-slate-850 p-3 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg">
        <p className="font-bold text-gray-900 dark:text-white mb-1">{data.name}</p>
        <div className="space-y-1 text-xs">
          <p className="text-gray-600 dark:text-gray-300">
            <span className="font-semibold">Impact:</span> 
            <span className={displayValue >= 0 ? 'text-green-600 dark:text-green-400 ml-1' : 'text-red-600 dark:text-red-400 ml-1'}>
              {displayValue > 0 ? '+' : ''}{displayValue.toFixed(3)}%
            </span>
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            <span className="font-semibold">Weight:</span> {data.weight.toFixed(2)}%
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            <span className="font-semibold">Day Change:</span> 
            <span className={data.change >= 0 ? 'text-green-600 dark:text-green-400 ml-1' : 'text-red-600 dark:text-red-400 ml-1'}>
               {data.change > 0 ? '+' : ''}{data.change.toFixed(2)}%
            </span>
          </p>
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
  // We use Math.abs for the value so the bars grow left-to-right for better visual comparison
  const losers = [...holdings]
    .filter(h => (h.contribution || 0) < 0)
    .sort((a, b) => (a.contribution || 0) - (b.contribution || 0)) // Most negative first
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
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
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