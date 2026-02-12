import { MarketData } from '../types';

// List of proxies to try in sequence. 
// 1. corsproxy.io is generally faster and less rate-limited.
// 2. allorigins.win is a good backup.
const PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
];

const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/';

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Normalize ticker for Yahoo Finance (e.g., BRK.B -> BRK-B)
const normalizeTicker = (ticker: string): string => {
  return ticker.replace(/\./g, '-');
};

export const fetchMarketData = async (symbol: string): Promise<MarketData> => {
  const cleanSymbol = normalizeTicker(symbol);
  const targetUrl = `${YAHOO_BASE_URL}${cleanSymbol}?interval=1d&range=1d`;
  
  let lastError: any;

  // Try proxies in order
  for (const proxyGenerator of PROXIES) {
    try {
      const proxyUrl = proxyGenerator(targetUrl);
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        // If 429 (Too Many Requests) or 403 (Forbidden), definitely try next proxy
        throw new Error(`HTTP error ${response.status}`);
      }

      const json = await response.json();
      
      // Validation: Yahoo Chart API specific structure
      const result = json.chart?.result?.[0];
      if (!result || !result.meta) {
        throw new Error(`Invalid data structure for ${symbol}`);
      }

      const meta = result.meta;
      const price = meta.regularMarketPrice;
      const previousClose = meta.chartPreviousClose || meta.previousClose;
      
      // Calculate change manually if not provided explicitly
      const change = price - previousClose;
      const changePercent = (change / previousClose) * 100;

      return {
        symbol: meta.symbol,
        price: price,
        change: change,
        changePercent: changePercent,
        previousClose: previousClose,
        timestamp: Date.now(),
      };
    } catch (error) {
      // console.warn(`Proxy failed for ${symbol}:`, error);
      lastError = error;
      // Continue to next proxy loop
    }
  }

  // If all proxies failed
  throw lastError || new Error(`All proxies failed for ${symbol}`);
};

// Retry wrapper with exponential backoff
const fetchWithRetry = async (symbol: string, retries = 3, backoff = 1000): Promise<MarketData> => {
  try {
    return await fetchMarketData(symbol);
  } catch (error) {
    if (retries <= 0) throw error;
    await delay(backoff);
    return fetchWithRetry(symbol, retries - 1, backoff * 1.5);
  }
};

// Batch processor with strict rate limiting and retries
export const batchFetchMarketData = async (
  symbols: string[], 
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, MarketData | null>> => {
  const results = new Map<string, MarketData | null>();
  // Batch size 5 is a balance between speed and rate limits
  const batchSize = 5; 
  let completed = 0;

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    
    // Process batch in parallel
    const promises = batch.map(async (sym) => {
      try {
        const data = await fetchWithRetry(sym);
        return { sym, data };
      } catch (e) {
        console.error(`Failed to fetch ${sym}`);
        return { sym, data: null };
      }
    });

    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ sym, data }) => results.set(sym, data));
    
    completed += batch.length;
    if (onProgress) onProgress(Math.min(completed, symbols.length), symbols.length);
    
    // Delay between batches to be nice to the proxies
    if (i + batchSize < symbols.length) {
      await delay(1200); 
    }
  }

  return results;
};