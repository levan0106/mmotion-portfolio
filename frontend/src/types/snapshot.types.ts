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
  totalValue: number;
  totalPl: number;
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
  
  // Portfolio Summary Data
  totalValue: number;
  totalPl: number;
  unrealizedPl: number;
  realizedPl: number;
  totalReturn: number;
  cashBalance: number;
  investedValue: number;
  
  // Performance Metrics
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  ytdReturn: number;
  
  // Risk Metrics
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
  totalValue: number;
  totalPl: number;
  unrealizedPl: number;
  realizedPl: number;
  totalReturn: number;
  cashBalance: number;
  investedValue: number;
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
  totalValue: number;
  totalPl: number;
  assetCount: number;
}