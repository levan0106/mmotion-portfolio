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
  totalValue: number; // Keep for backward compatibility
  cashBalance: number;
  unrealizedPl: number; // Keep for backward compatibility
  realizedPl: number; // Keep for backward compatibility
  
  // New explicit value and P&L fields
  totalAssetValue: number;
  totalInvestValue: number;
  totalAllValue: number;
  realizedAssetPnL: number;
  realizedInvestPnL: number;
  realizedAllPnL: number;
  unrealizedAssetPnL: number;
  unrealizedInvestPnL: number;
  unrealizedAllPnL: number;
  
  // NAV/Unit System fields
  isFund?: boolean;
  totalOutstandingUnits?: number;
  navPerUnit?: number;
  lastNavDate?: string;
  
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
  totalAssetsValue: number;
  totalDepositsValue: number;
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

// NAV/Unit System types
export interface InvestorHolding {
  holdingId: string;
  accountId: string;
  portfolioId: string;
  totalUnits: number;
  avgCostPerUnit: number;
  totalInvestment: number;
  currentValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  createdAt: string;
  updatedAt: string;
  account?: Account;
  portfolio?: Portfolio;
}

export interface SubscribeToFundDto {
  accountId: string;
  portfolioId: string;
  amount: number;
  description?: string;
}

export interface RedeemFromFundDto {
  accountId: string;
  portfolioId: string;
  units: number;
  description?: string;
}

// Fund Unit Transaction types
export interface FundUnitTransaction {
  transactionId: string;
  holdingId: string;
  cashFlowId: string | null;
  holdingType: 'SUBSCRIBE' | 'REDEEM';
  units: number;
  navPerUnit: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

// Holding Detail types
export interface FundUnitTransactionWithCashFlow {
  transaction: FundUnitTransaction;
  cashFlow: CashFlow | null;
}

export interface HoldingSummary {
  totalTransactions: number;
  totalSubscriptions: number;
  totalRedemptions: number;
  totalUnitsSubscribed: number;
  totalUnitsRedeemed: number;
  totalAmountInvested: number;
  totalAmountReceived: number;
  netRealizedPnL: number;
  currentUnrealizedPnL: number;
  totalPnL: number;
  returnPercentage: number;
}

export interface HoldingDetail {
  holding: InvestorHolding;
  transactions: FundUnitTransactionWithCashFlow[];
  summary: HoldingSummary;
}

export interface SubscriptionResult {
  holding: InvestorHolding;
  cashFlow: CashFlow;
  unitsIssued: number;
  navPerUnit: number;
}

export interface RedemptionResult {
  holding: InvestorHolding;
  cashFlow: CashFlow;
  unitsRedeemed: number;
  amountReceived: number;
  navPerUnit: number;
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