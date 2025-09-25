/**
 * Unified Snapshot Types
 * 
 * Merged from snapshot.types.ts and performance-snapshot.types.ts
 * Comprehensive TypeScript types for all snapshot systems
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum SnapshotGranularity {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export type TimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type PerformanceGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type MetricFormat = 'percentage' | 'number' | 'currency';

export type TrendDirection = 'up' | 'down' | 'neutral';

// ============================================================================
// BASIC SNAPSHOT TYPES
// ============================================================================

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

// ============================================================================
// PORTFOLIO SNAPSHOT TYPES
// ============================================================================

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

// ============================================================================
// PERFORMANCE SNAPSHOT TYPES
// ============================================================================

export interface TWRMetrics {
  twr1D: number;
  twr1W: number;
  twr1M: number;
  twr3M: number;
  twr6M: number;
  twr1Y: number;
  twrYTD: number;
}

export interface MWRIRRMetrics {
  mwr1M: number;
  mwr3M: number;
  mwr6M: number;
  mwr1Y: number;
  mwrYTD: number;
  irr1M: number;
  irr3M: number;
  irr6M: number;
  irr1Y: number;
  irrYTD: number;
}

export interface AlphaBetaMetrics {
  alpha1M: number;
  alpha3M: number;
  alpha6M: number;
  alpha1Y: number;
  alphaYTD: number;
  beta1M: number;
  beta3M: number;
  beta6M: number;
  beta1Y: number;
  betaYTD: number;
  informationRatio1M: number;
  informationRatio3M: number;
  informationRatio1Y: number;
  trackingError1M: number;
  trackingError3M: number;
  trackingError1Y: number;
}

export interface RiskMetrics {
  volatility1M: number;
  volatility3M: number;
  volatility1Y: number;
  sharpeRatio1M: number;
  sharpeRatio3M: number;
  sharpeRatio1Y: number;
  maxDrawdown1M: number;
  maxDrawdown3M: number;
  maxDrawdown1Y: number;
  riskAdjustedReturn1M: number;
  riskAdjustedReturn3M: number;
  riskAdjustedReturn1Y: number;
}

export interface CashFlowData {
  totalCashInflows: number;
  totalCashOutflows: number;
  netCashFlow: number;
}

export interface BenchmarkComparison {
  [benchmarkId: string]: {
    benchmarkReturn: number;
    portfolioReturn: number;
    alpha: number;
    beta: number;
    trackingError: number;
    informationRatio: number;
  };
}

export interface PortfolioPerformanceSnapshot {
  id: string;
  portfolioId: string;
  snapshotDate: string;
  granularity: SnapshotGranularity;
  
  // TWR Metrics
  portfolioTWR1D: number;
  portfolioTWR1W: number;
  portfolioTWR1M: number;
  portfolioTWR3M: number;
  portfolioTWR6M: number;
  portfolioTWR1Y: number;
  portfolioTWRYTD: number;
  
  // MWR/IRR Metrics
  portfolioMWR1M: number;
  portfolioMWR3M: number;
  portfolioMWR6M: number;
  portfolioMWR1Y: number;
  portfolioMWRYTD: number;
  portfolioIRR1M: number;
  portfolioIRR3M: number;
  portfolioIRR6M: number;
  portfolioIRR1Y: number;
  portfolioIRRYTD: number;
  
  // Alpha/Beta Metrics
  portfolioAlpha1M: number;
  portfolioAlpha3M: number;
  portfolioAlpha6M: number;
  portfolioAlpha1Y: number;
  portfolioAlphaYTD: number;
  portfolioBeta1M: number;
  portfolioBeta3M: number;
  portfolioBeta6M: number;
  portfolioBeta1Y: number;
  portfolioBetaYTD: number;
  portfolioInformationRatio1M: number;
  portfolioInformationRatio3M: number;
  portfolioInformationRatio1Y: number;
  portfolioTrackingError1M: number;
  portfolioTrackingError3M: number;
  portfolioTrackingError1Y: number;
  
  // Cash Flow Data
  totalCashInflows: number;
  totalCashOutflows: number;
  netCashFlow: number;
  
  // Fund Management Data
  totalOutstandingUnits: number;
  navPerUnit: number;
  numberOfInvestors: number;
  isFund: boolean;
  
  // Benchmark Data
  benchmarkData: BenchmarkComparison;
  
  // Metadata
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetPerformanceSnapshot {
  id: string;
  portfolioId: string;
  assetId: string;
  assetSymbol: string;
  snapshotDate: string;
  granularity: SnapshotGranularity;
  
  // Asset TWR Metrics
  assetTWR1D: number;
  assetTWR1W: number;
  assetTWR1M: number;
  assetTWR3M: number;
  assetTWR6M: number;
  assetTWR1Y: number;
  assetTWRYTD: number;
  
  // Asset Risk Metrics
  assetVolatility1M: number;
  assetVolatility3M: number;
  assetVolatility1Y: number;
  assetSharpeRatio1M: number;
  assetSharpeRatio3M: number;
  assetSharpeRatio1Y: number;
  assetMaxDrawdown1M: number;
  assetMaxDrawdown3M: number;
  assetMaxDrawdown1Y: number;
  
  // Asset Risk-Adjusted Returns
  assetRiskAdjustedReturn1M: number;
  assetRiskAdjustedReturn3M: number;
  assetRiskAdjustedReturn1Y: number;
  
  // Metadata
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetGroupPerformanceSnapshot {
  id: string;
  portfolioId: string;
  assetType: string;
  snapshotDate: string;
  granularity: SnapshotGranularity;
  
  // Group TWR Metrics
  groupTWR1D: number;
  groupTWR1W: number;
  groupTWR1M: number;
  groupTWR3M: number;
  groupTWR6M: number;
  groupTWR1Y: number;
  groupTWRYTD: number;
  
  // Group Risk Metrics
  groupSharpeRatio1M: number;
  groupSharpeRatio3M: number;
  groupSharpeRatio1Y: number;
  groupVolatility1M: number;
  groupVolatility3M: number;
  groupVolatility1Y: number;
  groupMaxDrawdown1M: number;
  groupMaxDrawdown3M: number;
  groupMaxDrawdown1Y: number;
  
  // Group Risk-Adjusted Returns
  groupRiskAdjustedReturn1M: number;
  groupRiskAdjustedReturn3M: number;
  groupRiskAdjustedReturn1Y: number;
  
  // Group Statistics
  assetCount: number;
  activeAssetCount: number;
  allocationPercentage: number;
  
  // Metadata
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BenchmarkData {
  id: string;
  benchmarkId: string;
  benchmarkName: string;
  benchmarkType: string;
  snapshotDate: string;
  granularity: SnapshotGranularity;
  
  // Benchmark Performance
  benchmarkValue: number;
  benchmarkReturn1D: number;
  benchmarkReturn1W: number;
  benchmarkReturn1M: number;
  benchmarkReturn3M: number;
  benchmarkReturn6M: number;
  benchmarkReturn1Y: number;
  benchmarkReturnYTD: number;
  
  // Benchmark Risk Metrics
  benchmarkVolatility1M: number;
  benchmarkVolatility3M: number;
  benchmarkVolatility1Y: number;
  benchmarkMaxDrawdown1M: number;
  benchmarkMaxDrawdown3M: number;
  benchmarkMaxDrawdown1Y: number;
  
  // Metadata
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PERFORMANCE SNAPSHOT DTOs AND RESULTS
// ============================================================================

export interface PerformanceSnapshotResult {
  portfolioSnapshot: PortfolioPerformanceSnapshot;
  assetSnapshots: AssetPerformanceSnapshot[];
  groupSnapshots: AssetGroupPerformanceSnapshot[];
}

export interface CreatePerformanceSnapshotDto {
  portfolioId: string;
  snapshotDate: string;
  granularity?: SnapshotGranularity;
  createdBy?: string;
}

export interface PerformanceSnapshotQueryDto {
  startDate?: string;
  endDate?: string;
  granularity?: SnapshotGranularity;
  assetId?: string;
  assetType?: string;
}

export interface PortfolioPerformanceSummary {
  portfolioId: string;
  period: string;
  snapshotDate: string;
  twr: number;
  mwr: number;
  irr: number;
  alpha: number;
  beta: number;
  cashFlow: CashFlowData;
  benchmarkData: BenchmarkComparison;
}

export interface AssetPerformanceSummary {
  portfolioId: string;
  period: string;
  assetSummaries: Array<{
    assetId: string;
    assetSymbol: string;
    latestSnapshot: AssetPerformanceSnapshot;
    twr: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    riskAdjustedReturn: number;
  }>;
}

export interface AssetGroupPerformanceSummary {
  portfolioId: string;
  period: string;
  groupSummaries: Array<{
    assetType: string;
    latestSnapshot: AssetGroupPerformanceSnapshot;
    twr: number;
    sharpeRatio: number;
    volatility: number;
    maxDrawdown: number;
    riskAdjustedReturn: number;
    riskLevel: RiskLevel;
    performanceGrade: PerformanceGrade;
    assetCount: number;
    activeAssetCount: number;
    allocationPercentage: number;
  }>;
}

// ============================================================================
// CHART AND DISPLAY TYPES
// ============================================================================

export interface PerformanceMetricsDisplay {
  label: string;
  value: number;
  unit: string;
  trend?: TrendDirection;
  color?: string;
  format?: MetricFormat;
}

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

export interface PerformanceChartData {
  date: string;
  portfolio: number;
  benchmark?: number;
  [key: string]: string | number | undefined;
}

export interface PerformanceComparisonData {
  metric: string;
  portfolio: number;
  benchmark: number;
  difference: number;
  percentage: number;
}

export interface RiskAnalysisData {
  metric: string;
  value: number;
  level: RiskLevel;
  description: string;
  recommendation?: string;
}

export interface PerformanceAttributionData {
  assetType: string;
  contribution: number;
  weight: number;
  return: number;
  risk: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

// ============================================================================
// FILTER AND SORT TYPES
// ============================================================================

export interface SnapshotFilters {
  portfolioId?: string;
  assetId?: string;
  assetSymbol?: string;
  granularity?: SnapshotGranularity;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface PerformanceSnapshotFilters {
  portfolioId?: string;
  startDate?: string;
  endDate?: string;
  granularity?: SnapshotGranularity;
  assetId?: string;
  assetType?: string;
  period?: string;
}

export interface PerformanceSnapshotSort {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// FORM TYPES FOR UI COMPONENTS
// ============================================================================

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

// ============================================================================
// EXPORT/IMPORT TYPES
// ============================================================================

export interface PerformanceSnapshotExport {
  portfolioId: string;
  exportDate: string;
  data: {
    portfolioSnapshots: PortfolioPerformanceSnapshot[];
    assetSnapshots: AssetPerformanceSnapshot[];
    groupSnapshots: AssetGroupPerformanceSnapshot[];
  };
  metadata: {
    totalSnapshots: number;
    dateRange: {
      start: string;
      end: string;
    };
    granularity: SnapshotGranularity;
  };
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface PerformanceDashboardData {
  portfolioSummary: PortfolioPerformanceSummary;
  assetSummaries: AssetPerformanceSummary;
  groupSummaries: AssetGroupPerformanceSummary;
  charts: {
    performance: PerformanceChartData[];
    risk: PerformanceChartData[];
    attribution: PerformanceAttributionData[];
  };
  comparisons: PerformanceComparisonData[];
  riskAnalysis: RiskAnalysisData[];
}

// ============================================================================
// COMBINED SNAPSHOT TYPES FOR TIMELINE VIEW
// ============================================================================

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

// ============================================================================
// UNIFIED SNAPSHOT TYPES (NEW)
// ============================================================================

export interface UnifiedSnapshotData {
  date: string;
  portfolioSnapshot?: PortfolioSnapshot;
  performanceSnapshot?: PortfolioPerformanceSnapshot;
  assetSnapshots: SnapshotResponse[];
  assetPerformanceSnapshots: AssetPerformanceSnapshot[];
  groupPerformanceSnapshots: AssetGroupPerformanceSnapshot[];
  totalAssetValue: number;
  totalAssetInvested: number;
  totalPortfolioValue: number;
  totalPortfolioInvested: number;
  totalAssetPl: number;
  totalPortfolioPl: number;
  assetCount: number;
}

export interface UnifiedSnapshotQuery {
  portfolioId: string;
  startDate?: string;
  endDate?: string;
  granularity?: SnapshotGranularity;
  includeBasic?: boolean;
  includePerformance?: boolean;
  includeAssets?: boolean;
  includeGroups?: boolean;
}

export interface UnifiedSnapshotResult {
  basicSnapshots: SnapshotResponse[];
  portfolioSnapshots: PortfolioSnapshot[];
  performanceSnapshots: PortfolioPerformanceSnapshot[];
  assetSnapshots: AssetPerformanceSnapshot[];
  groupSnapshots: AssetGroupPerformanceSnapshot[];
  combinedData: UnifiedSnapshotData[];
  statistics: SnapshotStatistics;
  performanceSummary: PortfolioPerformanceSummary;
}
