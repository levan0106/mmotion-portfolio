// Snapshot Types for CR-006 Asset Snapshot System

export enum SnapshotGranularity {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface SnapshotResponse {
  id: string;
  portfolioId: string;
  assetId: string;
  assetSymbol: string;
  snapshotDate: string;
  granularity: SnapshotGranularity;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  avgCost: number;
  realizedPl: number;
  unrealizedPl: number;
  totalPl: number;
  allocationPercentage: number;
  portfolioTotalValue: number;
  returnPercentage: number;
  dailyReturn: number;
  cumulativeReturn: number;
  isActive: boolean;
  createdBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSnapshotRequest {
  portfolioId: string;
  assetId: string;
  assetSymbol: string;
  snapshotDate: string;
  granularity: SnapshotGranularity;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  avgCost: number;
  realizedPl: number;
  unrealizedPl: number;
  totalPl: number;
  allocationPercentage: number;
  portfolioTotalValue: number;
  returnPercentage: number;
  dailyReturn: number;
  cumulativeReturn: number;
  isActive?: boolean;
  createdBy?: string;
  notes?: string;
}

export interface UpdateSnapshotRequest {
  quantity?: number;
  currentPrice?: number;
  currentValue?: number;
  costBasis?: number;
  avgCost?: number;
  realizedPl?: number;
  unrealizedPl?: number;
  totalPl?: number;
  allocationPercentage?: number;
  portfolioTotalValue?: number;
  returnPercentage?: number;
  dailyReturn?: number;
  cumulativeReturn?: number;
  isActive?: boolean;
  notes?: string;
}

export interface SnapshotQueryParams {
  portfolioId?: string;
  assetId?: string;
  assetSymbol?: string;
  granularity?: SnapshotGranularity;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedSnapshotResponse {
  data: SnapshotResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SnapshotStatistics {
  totalSnapshots: number;
  dailySnapshots: number;
  weeklySnapshots: number;
  monthlySnapshots: number;
  latestSnapshotDate: string | null;
  oldestSnapshotDate: string | null;
}

export interface SnapshotAggregation {
  portfolioId: string;
  snapshotDate: string;
  granularity: SnapshotGranularity;
  totalAssetValue: number;
  totalAssetInvested: number;
  totalPortfolioValue: number;
  totalPortfolioInvested: number;
  totalAssetPl: number;
  totalPortfolioPl: number;
  totalReturn: number;
  assetCount: number;
}

export interface SnapshotTimelineQuery {
  portfolioId: string;
  startDate: string;
  endDate: string;
  granularity?: SnapshotGranularity;
  assetId?: string;
  assetSymbol?: string;
}

// Form types for UI components
export interface SnapshotFormData {
  portfolioId: string;
  assetId: string;
  assetSymbol: string;
  snapshotDate: string;
  granularity: SnapshotGranularity;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  avgCost: number;
  realizedPl: number;
  unrealizedPl: number;
  totalPl: number;
  allocationPercentage: number;
  portfolioTotalValue: number;
  returnPercentage: number;
  dailyReturn: number;
  cumulativeReturn: number;
  isActive: boolean;
  createdBy?: string;
  notes?: string;
}

// Filter types for UI components
export interface SnapshotFilters {
  portfolioId?: string;
  assetId?: string;
  assetSymbol?: string;
  granularity?: SnapshotGranularity;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

// Chart data types
export interface SnapshotChartData {
  date: string;
  value: number;
  pl: number;
  return: number;
  allocation: number;
}

export interface PlChartData {
  date: string;
  realizedPl: number;
  unrealizedPl: number;
  totalPl: number;
}

export interface AllocationChartData {
  date: string;
  assetSymbol: string;
  allocation: number;
  value: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface BulkRecalculateResponse {
  message: string;
  updatedCount: number;
}

export interface CleanupResponse {
  message: string;
  cleanedCount: number;
}

export interface PortfolioWithSnapshots {
  portfolioId: string;
  portfolioName: string;
  snapshotCount: number;
  latestSnapshotDate: string;
  oldestSnapshotDate: string;
}

// Portfolio Snapshot Types
export interface PortfolioSnapshot {
  id: string;
  portfolioId: string;
  portfolioName: string;
  snapshotDate: string;
  granularity: SnapshotGranularity;
  
  // Asset Value Fields (Assets Only)
  totalAssetValue: number;
  totalAssetInvested: number;
  
  // Asset P&L Fields (Assets Only)
  totalAssetPl: number;
  unrealizedAssetPl: number;
  realizedAssetPl: number;
  
  // Portfolio P&L Fields (Assets + Deposits)
  totalPortfolioPl: number;
  unrealizedPortfolioPl: number;
  realizedPortfolioPl: number;
  
  totalReturn: number;
  cashBalance: number;

  // Portfolio Value Fields (Assets + Deposits)
  totalPortfolioValue: number;
  totalPortfolioInvested: number;
  
  // Deposit Fields
  totalDepositPrincipal: number;
  totalDepositInterest: number;
  totalDepositValue: number;
  totalDepositCount: number;
  
  // Deposit P&L Fields
  unrealizedDepositPnL: number;
  realizedDepositPnL: number;
  
  // Asset Performance Metrics (Assets Only)
  assetDailyReturn: number;
  assetWeeklyReturn: number;
  assetMonthlyReturn: number;
  assetYtdReturn: number;
  
  // Asset Risk Metrics (Assets Only)
  assetVolatility: number;
  assetMaxDrawdown: number;
  
  // Portfolio Performance Metrics (Assets + Deposits)
  portfolioDailyReturn: number;
  portfolioWeeklyReturn: number;
  portfolioMonthlyReturn: number;
  portfolioYtdReturn: number;
  
  // Portfolio Risk Metrics (Assets + Deposits)
  portfolioVolatility: number;
  portfolioMaxDrawdown: number;
  
  // Legacy Performance Metrics (DEPRECATED - for backward compatibility)
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  ytdReturn: number;
  
  // Legacy Risk Metrics (DEPRECATED - for backward compatibility)
  volatility: number;
  maxDrawdown: number;
  
  // Dynamic Asset Allocation
  assetAllocation: {
    [assetType: string]: {
      percentage: number;
      value: number;
      count: number;
    };
  };
  
  // Portfolio Statistics
  assetCount: number;
  activeAssetCount: number;
  
  // Metadata
  isActive: boolean;
  createdBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortfolioSnapshotRequest {
  portfolioId: string;
  portfolioName: string;
  snapshotDate: string;
  granularity: SnapshotGranularity;
  totalAssetValue: number;
  totalAssetInvested: number;
  totalPortfolioValue: number;
  totalPortfolioInvested: number;
  totalAssetPl: number;
  totalPortfolioPl: number;
  unrealizedAssetPl: number;
  realizedAssetPl: number;
  unrealizedPortfolioPl: number;
  realizedPortfolioPl: number;
  totalReturn: number;
  cashBalance: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  ytdReturn: number;
  volatility: number;
  maxDrawdown: number;
  assetAllocation: {
    [assetType: string]: {
      percentage: number;
      value: number;
      count: number;
    };
  };
  assetCount: number;
  activeAssetCount: number;
  isActive?: boolean;
  createdBy?: string;
  notes?: string;
}

export interface PortfolioSnapshotQueryParams {
  portfolioId?: string;
  startDate?: string;
  endDate?: string;
  granularity?: SnapshotGranularity;
  isActive?: boolean;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedPortfolioSnapshotResponse {
  data: PortfolioSnapshot[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Combined Snapshot Types for Timeline View
export interface CombinedSnapshotData {
  date: string;
  portfolioSnapshot?: PortfolioSnapshot;
  assetSnapshots: SnapshotResponse[];
  totalAssetValue: number;
  totalAssetInvested: number;
  totalPortfolioValue: number;
  totalPortfolioInvested: number;
  totalAssetPl: number;
  totalPortfolioPl: number;
  assetCount: number;
}