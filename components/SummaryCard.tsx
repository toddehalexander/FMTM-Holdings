import React from 'react';
import { ArrowUp, ArrowDown, RefreshCw, AlertTriangle } from 'lucide-react';
import { ETFSummary } from '../types';

interface SummaryCardProps {
  summary: ETFSummary;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, onRefresh, isRefreshing }) => {
  const { marketData, calculatedDailyPerformance, trackingGap } = summary;
  
  const price = marketData?.price.toFixed(2) ?? '---';
  const change = marketData?.change.toFixed(2) ?? '---';
  const changePercent = marketData?.changePercent.toFixed(2) ?? '---';
  const isPositive = marketData ? marketData.change >= 0 : true;
  
  const estimatedPerf = calculatedDailyPerformance ? calculatedDailyPerformance.toFixed(2) : '---';
  const gap = trackingGap ? trackingGap.toFixed(2) : '---';

  return (
    <div className="bg-white dark:bg-slate-850 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
            <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{summary.symbol}</h2>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">ETF</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Target Momentum Strategy</p>
        </div>
        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Updating...' : 'Refresh Prices'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Price Card */}
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Current Price</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">${price}</span>
            {marketData && (
                <span className={`flex items-center text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {change} ({changePercent}%)
                </span>
            )}
          </div>
        </div>

        {/* Weighted Estimation */}
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Holdings Implied Move</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${Number(estimatedPerf) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Number(estimatedPerf) > 0 ? '+' : ''}{estimatedPerf}%
            </span>
            <span className="text-xs text-gray-400">weighted sum</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Based on {summary.holdingsCount} holdings</p>
        </div>

        {/* Tracking Gap */}
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tracking Gap</p>
          <div className="flex items-baseline gap-2">
             <span className={`text-2xl font-bold ${Math.abs(Number(gap)) > 0.5 ? 'text-orange-500' : 'text-gray-700 dark:text-gray-300'}`}>
                {Number(gap) > 0 ? '+' : ''}{gap}%
            </span>
             {Math.abs(Number(gap)) > 0.5 && <AlertTriangle className="h-5 w-5 text-orange-500" />}
          </div>
           <p className="text-xs text-gray-400 mt-2">NAV vs Holdings difference</p>
        </div>
      </div>
    </div>
  );
};