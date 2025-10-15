import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType } from '../enums/asset-type.enum';

/**
 * Asset Allocation Response DTO
 * Data Transfer Object for asset allocation by type
 */
export class AssetAllocationResponseDto {
  @ApiProperty({
    description: 'Allocation percentage for stocks',
    example: 40.5,
  })
  STOCK: number;

  @ApiProperty({
    description: 'Allocation percentage for bonds',
    example: 25.0,
  })
  BOND: number;

  @ApiProperty({
    description: 'Allocation percentage for gold',
    example: 15.0,
  })
  GOLD: number;

  @ApiProperty({
    description: 'Allocation percentage for crypto',
    example: 12.5,
  })
  CRYPTO: number;

  @ApiProperty({
    description: 'Allocation percentage for commodities',
    example: 7.0,
  })
  COMMODITY: number;
}

/**
 * Asset Performance Item DTO
 * Data Transfer Object for individual asset performance
 */
export class AssetPerformanceItemDto {
  @ApiProperty({
    description: 'Asset ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  assetId: string;

  @ApiProperty({
    description: 'Asset name',
    example: 'Hoa Phat Group',
  })
  assetName: string;

  @ApiProperty({
    description: 'Asset symbol - primary identifier',
    example: 'HPG',
  })
  assetSymbol: string;

  @ApiProperty({
    description: 'Asset type',
    enum: AssetType,
    example: AssetType.STOCK,
  })
  assetType: AssetType;

  @ApiProperty({
    description: 'Current value of the asset',
    example: 1200000,
  })
  currentValue: number;

  @ApiProperty({
    description: 'Initial value of the asset',
    example: 1000000,
  })
  initialValue: number;

  @ApiProperty({
    description: 'Absolute return (current - initial)',
    example: 200000,
  })
  absoluteReturn: number;

  @ApiProperty({
    description: 'Percentage return',
    example: 20.0,
  })
  percentageReturn: number;

  @ApiProperty({
    description: 'Weight in portfolio (percentage)',
    example: 15.5,
  })
  portfolioWeight: number;
}

/**
 * Asset Performance Response DTO
 * Data Transfer Object for asset performance comparison
 */
export class AssetPerformanceResponseDto {
  @ApiProperty({
    description: 'Time period for the performance data',
    example: '1Y',
  })
  period: string;

  @ApiProperty({
    description: 'Array of asset performance data',
    type: [AssetPerformanceItemDto],
  })
  assets: AssetPerformanceItemDto[];

  @ApiProperty({
    description: 'Total portfolio value',
    example: 50000000,
  })
  totalPortfolioValue: number;

  @ApiProperty({
    description: 'Total portfolio return (absolute)',
    example: 5000000,
  })
  totalPortfolioReturn: number;

  @ApiProperty({
    description: 'Total portfolio return (percentage)',
    example: 11.1,
  })
  totalPortfolioReturnPercentage: number;

  @ApiProperty({
    description: 'Best performing asset',
    example: 'Hoa Phat Group (HPG)',
  })
  bestPerformer: string;

  @ApiProperty({
    description: 'Worst performing asset',
    example: 'Vietcombank (VCB)',
  })
  worstPerformer: string;
}

/**
 * Asset Risk Metrics Response DTO
 * Data Transfer Object for asset risk metrics
 */
export class AssetRiskMetricsResponseDto {
  @ApiProperty({
    description: 'Maximum drawdown percentage',
    example: -15.5,
  })
  maxDrawdown: number;

  @ApiProperty({
    description: 'Sharpe ratio (risk-adjusted return)',
    example: 1.25,
  })
  sharpeRatio: number;

  @ApiProperty({
    description: 'Value at Risk (VaR) at 95% confidence level',
    example: -5.2,
  })
  valueAtRisk: number;

  @ApiProperty({
    description: 'Concentration risk (largest position weight)',
    example: 25.0,
  })
  concentrationRisk: number;

  @ApiProperty({
    description: 'Portfolio volatility (annualized)',
    example: 12.5,
  })
  volatility: number;

  @ApiProperty({
    description: 'Beta relative to market',
    example: 1.1,
  })
  beta: number;
}

/**
 * Asset Analytics Summary Response DTO
 * Data Transfer Object for comprehensive asset analytics summary
 */
export class AssetAnalyticsSummaryResponseDto {
  @ApiProperty({
    description: 'Asset allocation by type',
    type: AssetAllocationResponseDto,
  })
  allocation: AssetAllocationResponseDto;

  @ApiProperty({
    description: 'Asset performance data',
    type: AssetPerformanceResponseDto,
  })
  performance: AssetPerformanceResponseDto;

  @ApiProperty({
    description: 'Asset risk metrics',
    type: AssetRiskMetricsResponseDto,
  })
  riskMetrics: AssetRiskMetricsResponseDto;

  @ApiProperty({
    description: 'Total number of assets',
    example: 15,
  })
  totalAssets: number;

  @ApiProperty({
    description: 'Total portfolio value',
    example: 50000000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Portfolio diversification score (0-100)',
    example: 75.5,
  })
  diversificationScore: number;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  lastUpdated: Date;
}

/**
 * Asset Value Range Response DTO
 * Data Transfer Object for assets within a value range
 */
export class AssetValueRangeResponseDto {
  @ApiProperty({
    description: 'Array of assets within the specified value range',
    type: [AssetPerformanceItemDto],
  })
  assets: AssetPerformanceItemDto[];

  @ApiProperty({
    description: 'Minimum value filter applied',
    example: 100000,
  })
  minValue: number;

  @ApiProperty({
    description: 'Maximum value filter applied',
    example: 5000000,
  })
  maxValue: number;

  @ApiProperty({
    description: 'Number of assets found in range',
    example: 8,
  })
  count: number;
}
