export interface Holding {
  ticker: string;
  name: string;
  weight: number; // Percentage as decimal (e.g., 0.05 for 5%)
  shares?: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  timestamp: number;
}

export interface EnrichedHolding extends Holding {
  marketData?: MarketData;
  contribution?: number; // weight * changePercent
  value?: number; // Notional value if shares exist, or just representative
  isLoading?: boolean;
  error?: string;
  isStable?: boolean; // New flag for Cash/Money Market funds
}

export interface ETFSummary {
  symbol: string;
  marketData?: MarketData;
  calculatedDailyPerformance?: number; // Sum of holding contributions
  trackingGap?: number; // Difference between actual and calculated
  holdingsCount: number;
  lastUpdated: string;
}

export enum SortField {
  Ticker = 'ticker',
  Weight = 'weight',
  Price = 'price',
  Change = 'change',
  Contribution = 'contribution'
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc'
}