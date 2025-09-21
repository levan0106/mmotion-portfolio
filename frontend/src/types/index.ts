/**
 * TypeScript type definitions for Portfolio Management System
 */

// Base types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Account types
export interface Account extends BaseEntity {
  accountId: string;
  name: string;
  email: string;
  baseCurrency: string;
}

// Asset types
export interface Asset extends BaseEntity {
  assetId: string;
  symbol: string;
  name: string;
  type: string;
  assetClass: string;
  currency: string;
  isActive: boolean;
}

// Portfolio types
export interface Portfolio extends BaseEntity {
  portfolioId: string;
  accountId: string;
  name: string;
  baseCurrency: string;
  totalValue: number;
  cashBalance: number;
  unrealizedPl: number;
  realizedPl: number;
  account?: Account;
  portfolioAssets?: PortfolioAsset[];
  navSnapshots?: NavSnapshot[];
  cashFlows?: CashFlow[];
}

export interface PortfolioAsset {
  portfolioId: string;
  assetId: string;
  quantity: number;
  avgCost: number;
  marketValue: number;
  unrealizedPl: number;
  updatedAt: string;
  asset?: Asset;
}

export interface NavSnapshot {
  portfolioId: string;
  navDate: string;
  navValue: number;
  cashBalance: number;
  totalValue: number;
  createdAt: string;
}

export interface CashFlow {
  cashflowId: string;
  portfolioId: string;
  flowDate: string;
  amount: number;
  currency: string;
  type: string;
  description?: string;
  fundingSource?: string;
  createdAt: string;
}

// DTO types
export interface CreatePortfolioDto {
  name: string;
  baseCurrency: string;
  accountId: string;
}

export interface UpdatePortfolioDto {
  name?: string;
  baseCurrency?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Performance types
export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
}

export interface AssetAllocation {
  assetId: string;
  symbol: string;
  name: string;
  allocationPercentage: number;
  marketValue: number;
  quantity: number;
  avgCost: number;
  unrealizedPl: number;
  unrealizedPlPercentage: number;
}

export interface AllocationData {
  percentage: number;
  value: number;
}

export interface AssetAllocationResponse {
  allocation: Record<string, AllocationData>;
  totalValue: number;
  assetCount: number;
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface PerformanceChartData {
  portfolio: ChartDataPoint[];
  benchmark?: ChartDataPoint[];
}

// WebSocket types
export interface WebSocketMessage {
  type: 'portfolioUpdate' | 'priceUpdate' | 'tradeUpdate' | 'error';
  data: any;
  timestamp: string;
}

// Form types
export interface PortfolioFormData {
  name: string;
  baseCurrency: string;
  accountId: string;
}

export interface CashFlowFormData {
  amount: number;
  currency: string;
  type: string;
  description?: string;
  flowDate: string;
  fundingSource?: string;
}

// Filter and search types
export interface PortfolioFilters {
  search?: string;
  baseCurrency?: string;
  minValue?: number;
  maxValue?: number;
  sortBy?: 'name' | 'totalValue' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Theme types
export interface Theme {
  palette: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
  };
}

// Export trading types
export * from './trading';

// Export asset types
export * from './asset.types';