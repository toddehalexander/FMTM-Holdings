import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, ExternalLink } from 'lucide-react';
import { EnrichedHolding, SortField, SortDirection } from '../types';

interface HoldingsTableProps {
  holdings: EnrichedHolding[];
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings }) => {
  const [sortField, setSortField] = useState<SortField>(SortField.Contribution);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.Desc);

  // Split holdings into Equities and Stable Assets
  const equities = useMemo(() => holdings.filter(h => !h.isStable), [holdings]);
  const stableAssets = useMemo(() => holdings.filter(h => h.isStable), [holdings]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc);
    } else {
      setSortField(field);
      setSortDirection(SortDirection.Desc);
    }
  };

  const sortedEquities = useMemo(() => {
    return [...equities].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortField) {
        case SortField.Ticker:
          valA = a.ticker;
          valB = b.ticker;
          break;
        case SortField.Weight:
          valA = a.weight;
          valB = b.weight;
          break;
        case SortField.Price:
          valA = a.marketData?.price ?? 0;
          valB = b.marketData?.price ?? 0;
          break;
        case SortField.Change:
          valA = a.marketData?.changePercent ?? -999;
          valB = b.marketData?.changePercent ?? -999;
          break;
        case SortField.Contribution:
          valA = a.contribution ?? -999;
          valB = b.contribution ?? -999;
          break;
      }

      if (valA < valB) return sortDirection === SortDirection.Asc ? -1 : 1;
      if (valA > valB) return sortDirection === SortDirection.Asc ? 1 : -1;
      return 0;
    });
  }, [equities, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    return sortDirection === SortDirection.Asc ? 
      <ArrowUp className="h-3 w-3 text-blue-500" /> : 
      <ArrowDown className="h-3 w-3 text-blue-500" />;
  };

  // Reusable Row Component
  const HoldingRow = ({ h }: { h: EnrichedHolding }) => {
    const isStable = h.isStable;
    const tickerUrl = `https://finance.yahoo.com/quote/${h.ticker.replace(/\./g, '-')}`;
    
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group/row">
            <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
                <div>
                <div className="flex items-center gap-2">
                    <a 
                      href={tickerUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex items-center gap-1.5"
                      title={`View ${h.ticker} on Yahoo Finance`}
                    >
                      <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {h.ticker}
                      </span>
                      <ExternalLink className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform translate-y-0.5 group-hover:translate-y-0" />
                    </a>
                    {isStable && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300">
                            {h.ticker === 'FGXXX' ? 'Fund' : 'Cash'}
                        </span>
                    )}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-[180px]">{h.name}</div>
                </div>
            </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-300">
            {h.weight.toFixed(2)}%
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white font-mono">
            {h.marketData ? (
                isStable ? <span className="text-gray-400">$1.00</span> : `$${h.marketData.price.toFixed(2)}`
            ) : (
                h.error ? <span className="text-gray-400">---</span> : <span className="text-gray-400">Loading...</span>
            )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono">
            {h.marketData ? (
                isStable ? (
                        <span className="text-gray-400 text-xs">0.00%</span>
                ) : (
                    <span className={h.marketData.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {h.marketData.changePercent > 0 ? '+' : ''}{h.marketData.changePercent.toFixed(2)}%
                    </span>
                )
            ) : (
                h.error ? (
                    <div className="flex items-center justify-end gap-1 text-xs text-red-400" title="Data unavailable">
                        <AlertCircle className="w-3 h-3" /> N/A
                    </div>
                ) : (
                    <span className="text-gray-400">Loading...</span>
                )
            )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold font-mono">
                {h.contribution !== undefined ? (
                isStable ? (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                ) : (
                    <span className={h.contribution >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {h.contribution > 0 ? '+' : ''}{h.contribution.toFixed(3)}%
                    </span>
                )
                ) : '---'}
            </td>
        </tr>
    );
  };

  return (
    <div className="space-y-8">
      {/* Equity Holdings Section */}
      <div className="bg-white dark:bg-slate-850 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Equity Holdings</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 italic">Click tickers to research</span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                    onClick={() => handleSort(SortField.Ticker)}
                >
                    <div className="flex items-center gap-1">Ticker <SortIcon field={SortField.Ticker} /></div>
                </th>
                <th 
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                    onClick={() => handleSort(SortField.Weight)}
                >
                    <div className="flex items-center justify-end gap-1">Weight <SortIcon field={SortField.Weight} /></div>
                </th>
                <th 
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                    onClick={() => handleSort(SortField.Price)}
                >
                    <div className="flex items-center justify-end gap-1">Price <SortIcon field={SortField.Price} /></div>
                </th>
                <th 
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                    onClick={() => handleSort(SortField.Change)}
                >
                    <div className="flex items-center justify-end gap-1">% Change <SortIcon field={SortField.Change} /></div>
                </th>
                <th 
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                    onClick={() => handleSort(SortField.Contribution)}
                >
                    <div className="flex items-center justify-end gap-1">Attrib. Impact <SortIcon field={SortField.Contribution} /></div>
                </th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-850 divide-y divide-gray-200 dark:divide-slate-700">
                {sortedEquities.map((h, idx) => (
                    <HoldingRow key={`equity-${h.ticker}-${idx}`} h={h} />
                ))}
            </tbody>
            </table>
            {sortedEquities.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No equity holdings found.
                </div>
            )}
        </div>
      </div>

      {/* Cash & Equivalents Section */}
      {stableAssets.length > 0 && (
        <div className="bg-white dark:bg-slate-850 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cash & Cash Equivalents</h3>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weight</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Change</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attrib. Impact</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-850 divide-y divide-gray-200 dark:divide-slate-700">
                        {stableAssets.map((h, idx) => (
                            <HoldingRow key={`stable-${h.ticker}-${idx}`} h={h} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};