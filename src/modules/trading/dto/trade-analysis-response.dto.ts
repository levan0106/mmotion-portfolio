import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data Transfer Object for trade analysis response data.
 * Contains comprehensive trading performance and analysis metrics.
 */
export class TradeAnalysisResponseDto {
  @ApiProperty({
    description: 'Portfolio ID',
    example: 'fe4690dc-42b3-4a34-a665-89b4ca93d5a1',
    format: 'uuid',
  })
  portfolioId: string;

  @ApiProperty({
    description: 'Analysis period start date',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  startDate: Date;

  @ApiProperty({
    description: 'Analysis period end date',
    example: '2024-01-31T23:59:59.999Z',
    format: 'date-time',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Asset ID filter (if applied)',
    example: 'b1c9a597-9cd4-476d-8f4c-a33191e8abe4',
    format: 'uuid',
  })
  assetId?: string;

  @ApiProperty({
    description: 'Trading statistics summary',
    type: 'object',
  })
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

  @ApiProperty({
    description: 'Profit and Loss summary',
    type: 'object',
  })
  pnlSummary: {
    totalRealizedPl: number;
    totalUnrealizedPl: number;
    totalPl: number;
    realizedPlPercentage: number;
    unrealizedPlPercentage: number;
    totalPlPercentage: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
  };

  @ApiProperty({
    description: 'Array of top performing trades',
    type: 'array',
  })
  topTrades: Array<{
    tradeId: string;
    assetSymbol: string;
    assetName: string;
    side: string;
    quantity: number;
    price: number;
    realizedPl: number;
    realizedPlPercentage: number;
    tradeDate: Date;
  }>;

  @ApiProperty({
    description: 'Array of worst performing trades',
    type: 'array',
  })
  worstTrades: Array<{
    tradeId: string;
    assetSymbol: string;
    assetName: string;
    side: string;
    quantity: number;
    price: number;
    realizedPl: number;
    realizedPlPercentage: number;
    tradeDate: Date;
  }>;

  @ApiProperty({
    description: 'Monthly performance breakdown',
    type: 'array',
  })
  monthlyPerformance: Array<{
    month: string;
    year: number;
    tradesCount: number;
    volume: number;
    realizedPl: number;
    unrealizedPl: number;
    totalPl: number;
    winRate: number;
  }>;

  @ApiProperty({
    description: 'Asset-wise performance breakdown',
    type: 'array',
  })
  assetPerformance: Array<{
    assetId: string;
    assetSymbol: string;
    assetName: string;
    tradesCount: number;
    totalVolume: number;
    totalValue: number;
    realizedPl: number;
    unrealizedPl: number;
    totalPl: number;
    winRate: number;
    averageHoldTime: number;
  }>;

  @ApiProperty({
    description: 'Risk metrics',
    type: 'object',
  })
  riskMetrics: {
    maxDrawdown: number;
    maxDrawdownPercentage: number;
    sharpeRatio: number;
    sortinoRatio: number;
    volatility: number;
    beta: number;
    var95: number;
    var99: number;
  };

  @ApiProperty({
    description: 'Trading frequency analysis',
    type: 'object',
  })
  frequencyAnalysis: {
    averageTradesPerDay: number;
    averageTradesPerWeek: number;
    averageTradesPerMonth: number;
    mostActiveDay: string;
    mostActiveHour: number;
    tradingDaysCount: number;
  };

  @ApiProperty({
    description: 'Position analysis',
    type: 'object',
  })
  positionAnalysis: {
    totalPositions: number;
    openPositions: number;
    closedPositions: number;
    averagePositionSize: number;
    averageHoldTime: number;
    longestHoldTime: number;
    shortestHoldTime: number;
  };

  @ApiProperty({
    description: 'Analysis generation timestamp',
    example: '2024-01-15T09:30:00.000Z',
    format: 'date-time',
  })
  generatedAt: Date;
}

/**
 * Data Transfer Object for trading performance response data.
 */
export class TradingPerformanceResponseDto {
  @ApiProperty({
    description: 'Portfolio ID',
    example: 'fe4690dc-42b3-4a34-a665-89b4ca93d5a1',
    format: 'uuid',
  })
  portfolioId: string;

  @ApiProperty({
    description: 'Performance period start date',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  startDate: Date;

  @ApiProperty({
    description: 'Performance period end date',
    example: '2024-01-31T23:59:59.999Z',
    format: 'date-time',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Total number of trades',
    example: 150,
  })
  totalTrades: number;

  @ApiProperty({
    description: 'Win rate percentage',
    example: 65.5,
  })
  winRate: number;

  @ApiProperty({
    description: 'Total profit and loss',
    example: 15000.00,
  })
  totalPnl: number;

  @ApiProperty({
    description: 'Average profit and loss per trade',
    example: 100.00,
  })
  averagePnl: number;

  @ApiProperty({
    description: 'Best performing trade',
    type: 'object',
  })
  bestTrade: {
    tradeId: string;
    assetSymbol: string;
    realizedPl: number;
    realizedPlPercentage: number;
    tradeDate: Date;
  };

  @ApiProperty({
    description: 'Worst performing trade',
    type: 'object',
  })
  worstTrade: {
    tradeId: string;
    assetSymbol: string;
    realizedPl: number;
    realizedPlPercentage: number;
    tradeDate: Date;
  };

  @ApiProperty({
    description: 'Monthly performance data',
    type: 'array',
  })
  monthlyPerformance: Array<{
    month: string;
    year: number;
    pnl: number;
    trades: number;
    winRate: number;
  }>;

  @ApiProperty({
    description: 'Performance generation timestamp',
    example: '2024-01-15T09:30:00.000Z',
    format: 'date-time',
  })
  generatedAt: Date;
}

/**
 * Data Transfer Object for trade matching result.
 */
export class TradeMatchingResponseDto {
  @ApiProperty({
    description: 'Trade ID that was matched',
    example: 'c3caca2c-a542-460b-81bd-2e0d4a7ba366',
    format: 'uuid',
  })
  tradeId: string;

  @ApiProperty({
    description: 'Trade details',
    type: 'object',
  })
  trade: {
    tradeId: string;
    assetSymbol: string;
    side: string;
    quantity: number;
    price: number;
    tradeDate: Date;
  };

  @ApiProperty({
    description: 'Array of matched trade details',
    type: 'array',
  })
  matchedDetails: Array<{
    detailId: string;
    buyTradeId: string;
    sellTradeId: string;
    matchedQty: number;
    buyPrice: number;
    sellPrice: number;
    pnl: number;
    createdAt: Date;
  }>;

  @ApiProperty({
    description: 'Remaining unmatched quantity',
    example: 0,
  })
  remainingQuantity: number;

  @ApiProperty({
    description: 'Total profit and loss from matching',
    example: 150.25,
  })
  totalPnl: number;

  @ApiProperty({
    description: 'Matching algorithm used',
    example: 'FIFO',
  })
  algorithm: 'FIFO' | 'LIFO';

  @ApiProperty({
    description: 'Matching completion timestamp',
    example: '2024-01-15T09:30:00.000Z',
    format: 'date-time',
  })
  matchedAt: Date;
}
