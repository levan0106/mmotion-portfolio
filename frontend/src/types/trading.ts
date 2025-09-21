/**
 * Trading types for Portfolio Management System
 */

// Trade types
export enum TradeSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum TradeType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
}

export enum TradeSource {
  MANUAL = 'MANUAL',
  API = 'API',
  IMPORT = 'IMPORT',
}

export interface Trade {
  tradeId: string;
  portfolioId: string;
  assetId: string;
  assetSymbol?: string;
  assetName?: string;
  tradeDate: string;
  side: TradeSide;
  quantity: number;
  price: number;
  fee?: number;
  tax?: number;
  tradeType?: TradeType;
  source?: TradeSource;
  exchange?: string;
  fundingSource?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Calculated fields
  totalValue?: number;
  totalCost?: number;
  remainingQuantity?: number;
  realizedPl?: number;
  tradeDetailsCount?: number;
  matchedTrades?: TradeDetail[];
}

export interface TradeDetail {
  id: string;
  tradeId: string;
  matchedTradeId: string;
  matchedQuantity: number;
  matchedPrice: number;
  pnl: number;
  createdAt: string;
}

export interface CreateTradeDto {
  portfolioId: string;
  assetId: string;
  tradeDate: string;
  side: TradeSide;
  quantity: number;
  price: number;
  fee?: number;
  tax?: number;
  tradeType?: TradeType;
  source?: TradeSource;
  exchange?: string;
  fundingSource?: string;
  notes?: string;
}

export interface UpdateTradeDto {
  tradeDate?: string;
  quantity?: number;
  price?: number;
  fee?: number;
  tax?: number;
  tradeType?: TradeType;
  source?: TradeSource;
  exchange?: string;
  fundingSource?: string;
  notes?: string;
}

// Position types
export interface Position {
  assetId: string;
  assetSymbol: string;
  assetName: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  totalCost: number;
  currentValue?: number;
  unrealizedPnl?: number;
  realizedPnl: number;
  totalPnl?: number;
  pnlPercentage?: number;
  lastUpdated: string;
}

export interface PositionResponseDto {
  assetId: string;
  assetSymbol: string;
  assetName: string;
  quantity: number;
  avgCost: number;
  marketPrice: number;
  marketValue: number;
  unrealizedPl: number;
  unrealizedPlPercentage: number;
  realizedPl: number;
  totalPl: number;
  lastUpdated: Date;
  // Additional properties that components expect
  assetType?: string;
  portfolioWeight?: number;
  openTradesCount?: number;
  closedTradesCount?: number;
}

// Risk management types
export interface RiskTarget {
  id: string;
  assetId: string;
  portfolioId: string;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  stopLossPercentage?: number;
  takeProfitPercentage?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskTargetResponseDto {
  id: string;
  assetId: string;
  assetSymbol?: string;
  assetName?: string;
  portfolioId: string;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  stopLossDistance?: number;
  takeProfitDistance?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskAlert {
  id: string;
  assetId: string;
  portfolioId: string;
  alertType: 'STOP_LOSS' | 'TAKE_PROFIT';
  currentPrice: number;
  targetPrice: number;
  triggeredAt: string;
  isAcknowledged: boolean;
}

// Analysis types
export interface TradeAnalysis {
  statistics: {
    totalTrades: number;
    buyTrades: number;
    sellTrades: number;
    totalVolume: number;
    totalValue: number;
    averagePrice: number;
    totalFees: number;
    totalTaxes: number;
  };
  pnlSummary: {
    totalPnl: number;
    totalVolume: number;
    averagePnl: number;
    winCount: number;
    lossCount: number;
    winRate: number;
  };
  topTrades: Array<{
    tradeId: string;
    assetSymbol: string;
    assetName: string;
    side: string;
    quantity: number;
    price: number;
    realizedPl: number;
    realizedPlPercentage: number;
    tradeDate: string;
  }>;
  worstTrades: Array<{
    tradeId: string;
    assetSymbol: string;
    assetName: string;
    side: string;
    quantity: number;
    price: number;
    realizedPl: number;
    realizedPlPercentage: number;
    tradeDate: string;
  }>;
  monthlyPerformance: Array<{
    month: string;
    tradesCount: number;
    totalPl: number;
    totalVolume: number;
    winRate: number;
    winningTrades: number;
    losingTrades: number;
  }>;
  assetPerformance: Array<{
    assetId: string;
    assetSymbol: string;
    assetName: string;
    totalPl: number;
    tradesCount: number;
    winRate: number;
    totalVolume: number;
    quantity: number;
    avgCost: number;
    marketValue: number;
  }>;
  riskMetrics: {
    sharpeRatio: number;
    volatility: number;
    var95: number;
    maxDrawdown: number;
  };
}

export interface TradePerformance {
  period: {
    startDate: string;
    endDate: string;
  };
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface TradingPerformanceResponseDto {
  portfolioId: string;
  startDate: Date;
  endDate: Date;
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
  bestTrade: {
    tradeId: string;
    assetSymbol: string;
    realizedPl: number;
    realizedPlPercentage: number;
    tradeDate: Date;
  };
  worstTrade: {
    tradeId: string;
    assetSymbol: string;
    realizedPl: number;
    realizedPlPercentage: number;
    tradeDate: Date;
  };
  monthlyPerformance: Array<{
    month: string;
    year: number;
    pnl: number;
    trades: number;
    winRate: number;
  }>;
  generatedAt: Date;
}

// Filter types
export interface TradeFilters {
  assetId?: string;
  side?: TradeSide;
  startDate?: string;
  endDate?: string;
  tradeType?: TradeType;
  source?: TradeSource;
  page?: number;
  limit?: number;
}

export interface PositionFilters {
  assetId?: string;
  minQuantity?: number;
  maxQuantity?: number;
  minPnl?: number;
  maxPnl?: number;
}

export interface RiskTargetFilters {
  assetId?: string;
  isActive?: boolean;
  alertType?: 'STOP_LOSS' | 'TAKE_PROFIT';
}

// API Response types
export interface TradeResponse {
  trades: Trade[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PositionResponse {
  positions: Position[];
  total: number;
  totalValue: number;
  totalPnl: number;
  totalPnlPercentage: number;
}

export interface RiskTargetResponse {
  riskTargets: RiskTarget[];
  total: number;
  activeTargets: number;
  triggeredAlerts: RiskAlert[];
}

// Form data types
export interface TradeFormData {
  portfolioId: string;
  assetId: string;
  tradeDate: string;
  side: TradeSide;
  quantity: number;
  price: number;
  fee?: number;
  tax?: number;
  tradeType?: TradeType;
  source?: TradeSource;
  exchange?: string;
  fundingSource?: string;
  notes?: string;
}

export interface RiskTargetFormData {
  assetId: string;
  portfolioId: string;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  stopLossPercentage?: number;
  takeProfitPercentage?: number;
  isActive: boolean;
}

// Chart data types
export interface TradeChartData {
  date: string;
  pnl: number;
  cumulativePnl: number;
  tradesCount: number;
  volume: number;
}

export interface PositionChartData {
  assetSymbol: string;
  quantity: number;
  value: number;
  pnl: number;
  percentage: number;
}

export interface PerformanceChartData {
  date: string;
  portfolioValue: number;
  benchmarkValue?: number;
  return: number;
  cumulativeReturn: number;
}