import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { SummaryCard } from './components/SummaryCard';
import { FileUploader } from './components/FileUploader';
import { HoldingsTable } from './components/HoldingsTable';
import { Charts } from './components/Charts';
import { Holding, EnrichedHolding, ETFSummary, MarketData } from './types';
import { fetchMarketData, batchFetchMarketData } from './services/api';
import { parseHoldingsCSV } from './utils/csv';

const TARGET_ETF = 'FMTM';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [holdings, setHoldings] = useState<EnrichedHolding[]>([]);
  const [etfData, setEtfData] = useState<MarketData | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  // Initialize Dark Mode based on preference
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Load ETF Data
  const loadEtfData = async () => {
    try {
      const data = await fetchMarketData(TARGET_ETF);
      setEtfData(data);
    } catch (e) {
      console.error("Failed to load ETF data", e);
    }
  };

  // Helper to identify assets that shouldn't be fetched (Cash, Money Market)
  const isStableAsset = (ticker: string) => {
    const t = ticker.toUpperCase();
    return (
        t === 'FGXXX' || 
        t === 'CASH&OTHER' || 
        t.includes('CASH') || 
        t.includes('&')
    );
  };

  // Process Holdings: Fetch market data and enrich
  const processHoldings = useCallback(async (baseHoldings: Holding[]) => {
    setIsRefreshing(true);
    setLoadingProgress(0);

    // Identify which tickers actually need fetching
    const tickersToFetch = baseHoldings
        .filter(h => h.ticker && !isStableAsset(h.ticker))
        .map(h => h.ticker);
    
    // Fetch data in batches for the valid tickers
    const marketMap = await batchFetchMarketData(tickersToFetch, (done, total) => {
        setLoadingProgress((done / total) * 100);
    });

    const enriched: EnrichedHolding[] = baseHoldings.map(h => {
      const isStable = isStableAsset(h.ticker);
      
      let mData = marketMap.get(h.ticker);
      let contribution = undefined;
      let error = undefined;

      if (isStable) {
          // Mock market data for stable assets (Price $1.00, Change 0%)
          mData = {
              symbol: h.ticker,
              price: 1.00,
              change: 0,
              changePercent: 0,
              previousClose: 1.00,
              timestamp: Date.now()
          };
          contribution = 0;
      } else if (mData) {
          // Normal asset with data
          contribution = (h.weight / 100) * mData.changePercent;
      } else {
          // Failed fetch
          error = "Failed to fetch";
      }

      return {
        ...h,
        marketData: mData || undefined,
        contribution,
        error,
        isStable
      };
    });

    setHoldings(enriched);
    setIsRefreshing(false);
  }, []);

  // Initial Load: Load ETF Price & Default Holdings from Repo File
  useEffect(() => {
    const init = async () => {
        // Load ETF Top Level Data
        loadEtfData();

        try {
            // Use relative path for subpath compatibility
            const response = await fetch('holdings.csv');
            if (response.ok) {
                const csvText = await response.text();
                const defaultHoldings = parseHoldingsCSV(csvText);
                if (defaultHoldings.length > 0) {
                    setHoldings(defaultHoldings.map(h => ({ ...h, isLoading: true })));
                    processHoldings(defaultHoldings);
                }
            } else {
                console.warn('Default holdings.csv not found.');
            }
        } catch (error) {
            console.error('Error loading default holdings:', error);
        }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processHoldings]);

  // Handler for Manual CSV Upload (Overrides default)
  const handleHoldingsLoaded = (newHoldings: Holding[]) => {
    // Reset state with new skeleton holdings
    setHoldings(newHoldings.map(h => ({ ...h })));
    // Trigger data fetch
    processHoldings(newHoldings);
  };

  const handleRefresh = () => {
    if (holdings.length > 0) {
        // Strip enrichment and re-process
        const base = holdings.map(h => ({ 
            ticker: h.ticker, 
            name: h.name, 
            weight: h.weight, 
            shares: h.shares 
        }));
        processHoldings(base);
    }
    loadEtfData();
  };

  // Calculated Metrics
  const calculatedDailyPerformance = holdings.reduce((sum, h) => sum + (h.contribution || 0), 0);
  
  // Tracking Gap = Actual ETF Change - Calculated Sum of Parts
  const trackingGap = etfData ? etfData.changePercent - calculatedDailyPerformance : undefined;

  const summary: ETFSummary = {
    symbol: TARGET_ETF,
    marketData: etfData,
    calculatedDailyPerformance,
    trackingGap,
    holdingsCount: holdings.length,
    lastUpdated: new Date().toISOString()
  };

  return (
    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
      {/* Progress Bar for loading */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-slate-800 z-[60]">
          <div 
            className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-300" 
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
      )}

      <SummaryCard 
        summary={summary} 
        onRefresh={handleRefresh} 
        isRefreshing={isRefreshing}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Charts holdings={holdings} />
          <HoldingsTable holdings={holdings} />
        </div>
        
        <div className="xl:col-span-1">
          <FileUploader onHoldingsLoaded={handleHoldingsLoaded} />
          
          {/* Instructions / Info Panel */}
          <div className="bg-blue-50 dark:bg-slate-800/50 rounded-xl p-6 border border-blue-100 dark:border-slate-700 text-sm text-gray-600 dark:text-gray-400">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Data Source</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Default data is loaded from <strong>repo/holdings.csv</strong>.</li>
              <li>Update the CSV in the repository monthly to refresh holdings.</li>
              <li>FGXXX & Cash are treated as stable assets (0% change).</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                <p className="text-xs">
                    <strong>Note:</strong> Data is proxied to bypass CORS. 
                </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;