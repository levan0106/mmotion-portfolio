import { IsString, IsUUID, IsDateString, IsEnum, IsNumber, IsOptional, IsBoolean, IsPositive, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';

export class CreatePortfolioSnapshotDto {
  @ApiProperty({ description: 'Portfolio ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  portfolioId: string;

  @ApiProperty({ description: 'Portfolio name', example: 'Test Portfolio' })
  @IsString()
  portfolioName: string;

  @ApiProperty({ description: 'Snapshot date', example: '2025-09-20' })
  @IsDateString()
  snapshotDate: string;

  @ApiProperty({ description: 'Snapshot granularity', enum: SnapshotGranularity, example: SnapshotGranularity.DAILY })
  @IsEnum(SnapshotGranularity)
  granularity: SnapshotGranularity;

  // Asset Value Fields (Assets Only)
  @ApiProperty({ description: 'Total Asset Value', example: 1000000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalAssetValue: number;

  @ApiProperty({ description: 'Total Asset Invested', example: 800000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalAssetInvested: number;

  // Asset P&L Fields (Assets Only)
  @ApiProperty({ description: 'Total Asset P&L', example: 50000 })
  @IsNumber()
  @Type(() => Number)
  totalAssetPl: number;

  @ApiProperty({ description: 'Unrealized Asset P&L', example: 30000 })
  @IsNumber()
  @Type(() => Number)
  unrealizedAssetPl: number;

  @ApiProperty({ description: 'Realized Asset P&L', example: 20000 })
  @IsNumber()
  @Type(() => Number)
  realizedAssetPl: number;

  // Portfolio P&L Fields (Assets + Deposits)
  @ApiProperty({ description: 'Total Portfolio P&L (Assets + Deposits)', example: 55000 })
  @IsNumber()
  @Type(() => Number)
  totalPortfolioPl: number;

  @ApiProperty({ description: 'Unrealized Portfolio P&L (Assets + Deposits)', example: 35000 })
  @IsNumber()
  @Type(() => Number)
  unrealizedPortfolioPl: number;

  @ApiProperty({ description: 'Realized Portfolio P&L (Assets + Deposits)', example: 20000 })
  @IsNumber()
  @Type(() => Number)
  realizedPortfolioPl: number;

  @ApiProperty({ description: 'Total return percentage', example: 5.0 })
  @IsNumber()
  @Type(() => Number)
  totalReturn: number;

  @ApiProperty({ description: 'Cash balance', example: 200000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cashBalance: number;

  // Portfolio Value Fields (Assets + Deposits)
  @ApiProperty({ description: 'Total Portfolio Value (Assets + Deposits)', example: 1200000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalPortfolioValue: number;

  @ApiProperty({ description: 'Total Portfolio Invested (Assets + Deposits)', example: 1000000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalPortfolioInvested: number;

  // Asset Performance Metrics (Assets Only)
  @ApiProperty({ description: 'Asset Daily return percentage (Assets Only)', example: 0.5 })
  @IsNumber()
  @Type(() => Number)
  assetDailyReturn: number;

  @ApiProperty({ description: 'Asset Weekly return percentage (Assets Only)', example: 3.5 })
  @IsNumber()
  @Type(() => Number)
  assetWeeklyReturn: number;

  @ApiProperty({ description: 'Asset Monthly return percentage (Assets Only)', example: 15.0 })
  @IsNumber()
  @Type(() => Number)
  assetMonthlyReturn: number;

  @ApiProperty({ description: 'Asset Year-to-date return percentage (Assets Only)', example: 20.0 })
  @IsNumber()
  @Type(() => Number)
  assetYtdReturn: number;

  // Asset Risk Metrics (Assets Only)
  @ApiProperty({ description: 'Asset Volatility percentage (Assets Only)', example: 2.5 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  assetVolatility: number;

  @ApiProperty({ description: 'Asset Maximum drawdown percentage (Assets Only)', example: 5.0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  assetMaxDrawdown: number;

  // Portfolio Performance Metrics (Assets + Deposits)
  @ApiProperty({ description: 'Portfolio Daily return percentage (Assets + Deposits)', example: 0.3 })
  @IsNumber()
  @Type(() => Number)
  portfolioDailyReturn: number;

  @ApiProperty({ description: 'Portfolio Weekly return percentage (Assets + Deposits)', example: 2.1 })
  @IsNumber()
  @Type(() => Number)
  portfolioWeeklyReturn: number;

  @ApiProperty({ description: 'Portfolio Monthly return percentage (Assets + Deposits)', example: 9.0 })
  @IsNumber()
  @Type(() => Number)
  portfolioMonthlyReturn: number;

  @ApiProperty({ description: 'Portfolio Year-to-date return percentage (Assets + Deposits)', example: 12.0 })
  @IsNumber()
  @Type(() => Number)
  portfolioYtdReturn: number;

  // Portfolio Risk Metrics (Assets + Deposits)
  @ApiProperty({ description: 'Portfolio Volatility percentage (Assets + Deposits)', example: 1.8 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  portfolioVolatility: number;

  @ApiProperty({ description: 'Portfolio Maximum drawdown percentage (Assets + Deposits)', example: 3.2 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  portfolioMaxDrawdown: number;

  // Legacy fields for backward compatibility (deprecated)
  @ApiProperty({ description: 'Daily return percentage (DEPRECATED - use assetDailyReturn or portfolioDailyReturn)', example: 0.5 })
  @IsNumber()
  @Type(() => Number)
  dailyReturn: number;

  @ApiProperty({ description: 'Weekly return percentage (DEPRECATED - use assetWeeklyReturn or portfolioWeeklyReturn)', example: 3.5 })
  @IsNumber()
  @Type(() => Number)
  weeklyReturn: number;

  @ApiProperty({ description: 'Monthly return percentage (DEPRECATED - use assetMonthlyReturn or portfolioMonthlyReturn)', example: 15.0 })
  @IsNumber()
  @Type(() => Number)
  monthlyReturn: number;

  @ApiProperty({ description: 'Year-to-date return percentage (DEPRECATED - use assetYtdReturn or portfolioYtdReturn)', example: 20.0 })
  @IsNumber()
  @Type(() => Number)
  ytdReturn: number;

  @ApiProperty({ description: 'Volatility percentage (DEPRECATED - use assetVolatility or portfolioVolatility)', example: 2.5 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  volatility: number;

  @ApiProperty({ description: 'Maximum drawdown percentage (DEPRECATED - use assetMaxDrawdown or portfolioMaxDrawdown)', example: 5.0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDrawdown: number;

  @ApiProperty({ 
    description: 'Asset allocation by type', 
    example: { 'STOCK': { percentage: 80.0, value: 800000, count: 5 } }
  })
  @IsObject()
  assetAllocation: {
    [assetType: string]: {
      percentage: number;
      value: number;
      count: number;
    };
  };

  @ApiProperty({ description: 'Total asset count', example: 5 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  assetCount: number;

  @ApiProperty({ description: 'Active asset count', example: 5 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  activeAssetCount: number;

  @ApiPropertyOptional({ description: 'Total deposit principal', example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalDepositPrincipal?: number;

  @ApiPropertyOptional({ description: 'Total deposit interest', example: 25000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalDepositInterest?: number;

  @ApiPropertyOptional({ description: 'Total deposit value', example: 525000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalDepositValue?: number;

  @ApiPropertyOptional({ description: 'Total deposit count', example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalDepositCount?: number;

  @ApiPropertyOptional({ description: 'Unrealized deposit P&L', example: 15000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unrealizedDepositPnL?: number;

  @ApiPropertyOptional({ description: 'Realized deposit P&L', example: 10000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  realizedDepositPnL?: number;

  // Fund Management Fields
  @ApiPropertyOptional({ description: 'Total outstanding units', example: 1000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalOutstandingUnits?: number;

  @ApiPropertyOptional({ description: 'NAV per unit', example: 1.25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  navPerUnit?: number;

  @ApiPropertyOptional({ description: 'Number of investors', example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  numberOfInvestors?: number;

  @ApiPropertyOptional({ description: 'Whether this portfolio is a fund', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFund?: boolean;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Created by', example: 'test' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Test portfolio snapshot' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePortfolioSnapshotDto {
  // Asset Value Fields (Assets Only)
  @ApiPropertyOptional({ description: 'Total Asset Value', example: 1000000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalAssetValue?: number;

  @ApiPropertyOptional({ description: 'Total Asset Invested', example: 800000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalAssetInvested?: number;

  // Asset P&L Fields (Assets Only)
  @ApiPropertyOptional({ description: 'Total Asset P&L', example: 50000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalAssetPl?: number;

  @ApiPropertyOptional({ description: 'Unrealized Asset P&L', example: 30000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unrealizedAssetPl?: number;

  @ApiPropertyOptional({ description: 'Realized Asset P&L', example: 20000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  realizedAssetPl?: number;

  // Portfolio P&L Fields (Assets + Deposits)
  @ApiPropertyOptional({ description: 'Total Portfolio P&L (Assets + Deposits)', example: 55000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalPortfolioPl?: number;

  @ApiPropertyOptional({ description: 'Unrealized Portfolio P&L (Assets + Deposits)', example: 35000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unrealizedPortfolioPl?: number;

  @ApiPropertyOptional({ description: 'Realized Portfolio P&L (Assets + Deposits)', example: 20000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  realizedPortfolioPl?: number;

  @ApiPropertyOptional({ description: 'Total return percentage', example: 5.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalReturn?: number;

  @ApiPropertyOptional({ description: 'Cash balance', example: 200000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cashBalance?: number;

  // Portfolio Value Fields (Assets + Deposits)
  @ApiPropertyOptional({ description: 'Total Portfolio Value (Assets + Deposits)', example: 1200000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalPortfolioValue?: number;

  @ApiPropertyOptional({ description: 'Total Portfolio Invested (Assets + Deposits)', example: 1000000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalPortfolioInvested?: number;

  // Asset Performance Metrics (Assets Only)
  @ApiPropertyOptional({ description: 'Asset Daily return percentage (Assets Only)', example: 0.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  assetDailyReturn?: number;

  @ApiPropertyOptional({ description: 'Asset Weekly return percentage (Assets Only)', example: 3.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  assetWeeklyReturn?: number;

  @ApiPropertyOptional({ description: 'Asset Monthly return percentage (Assets Only)', example: 15.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  assetMonthlyReturn?: number;

  @ApiPropertyOptional({ description: 'Asset Year-to-date return percentage (Assets Only)', example: 20.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  assetYtdReturn?: number;

  // Asset Risk Metrics (Assets Only)
  @ApiPropertyOptional({ description: 'Asset Volatility percentage (Assets Only)', example: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  assetVolatility?: number;

  @ApiPropertyOptional({ description: 'Asset Maximum drawdown percentage (Assets Only)', example: 5.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  assetMaxDrawdown?: number;

  // Portfolio Performance Metrics (Assets + Deposits)
  @ApiPropertyOptional({ description: 'Portfolio Daily return percentage (Assets + Deposits)', example: 0.3 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  portfolioDailyReturn?: number;

  @ApiPropertyOptional({ description: 'Portfolio Weekly return percentage (Assets + Deposits)', example: 2.1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  portfolioWeeklyReturn?: number;

  @ApiPropertyOptional({ description: 'Portfolio Monthly return percentage (Assets + Deposits)', example: 9.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  portfolioMonthlyReturn?: number;

  @ApiPropertyOptional({ description: 'Portfolio Year-to-date return percentage (Assets + Deposits)', example: 12.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  portfolioYtdReturn?: number;

  // Portfolio Risk Metrics (Assets + Deposits)
  @ApiPropertyOptional({ description: 'Portfolio Volatility percentage (Assets + Deposits)', example: 1.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  portfolioVolatility?: number;

  @ApiPropertyOptional({ description: 'Portfolio Maximum drawdown percentage (Assets + Deposits)', example: 3.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  portfolioMaxDrawdown?: number;

  // Legacy fields for backward compatibility (deprecated)
  @ApiPropertyOptional({ description: 'Daily return percentage (DEPRECATED)', example: 0.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dailyReturn?: number;

  @ApiPropertyOptional({ description: 'Weekly return percentage (DEPRECATED)', example: 3.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weeklyReturn?: number;

  @ApiPropertyOptional({ description: 'Monthly return percentage (DEPRECATED)', example: 15.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  monthlyReturn?: number;

  @ApiPropertyOptional({ description: 'Year-to-date return percentage (DEPRECATED)', example: 20.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ytdReturn?: number;

  @ApiPropertyOptional({ description: 'Volatility percentage (DEPRECATED)', example: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  volatility?: number;

  @ApiPropertyOptional({ description: 'Maximum drawdown percentage (DEPRECATED)', example: 5.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDrawdown?: number;

  @ApiPropertyOptional({ 
    description: 'Asset allocation by type', 
    example: { 'STOCK': { percentage: 80.0, value: 800000, count: 5 } }
  })
  @IsOptional()
  @IsObject()
  assetAllocation?: {
    [assetType: string]: {
      percentage: number;
      value: number;
      count: number;
    };
  };

  @ApiPropertyOptional({ description: 'Total asset count', example: 5 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  assetCount?: number;

  @ApiPropertyOptional({ description: 'Active asset count', example: 5 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  activeAssetCount?: number;

  // Fund Management Fields
  @ApiPropertyOptional({ description: 'Total outstanding units', example: 1000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalOutstandingUnits?: number;

  @ApiPropertyOptional({ description: 'NAV per unit', example: 1.25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  navPerUnit?: number;

  @ApiPropertyOptional({ description: 'Number of investors', example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  numberOfInvestors?: number;

  @ApiPropertyOptional({ description: 'Whether this portfolio is a fund', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFund?: boolean;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Notes', example: 'Updated portfolio snapshot' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PortfolioSnapshotResponseDto {
  @ApiProperty({ description: 'Snapshot ID', example: '123e4567-e89b-12d3-a456-426614174002' })
  id: string;

  @ApiProperty({ description: 'Portfolio ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  portfolioId: string;

  @ApiProperty({ description: 'Portfolio name', example: 'Test Portfolio' })
  portfolioName: string;

  @ApiProperty({ description: 'Snapshot date', example: '2025-09-20' })
  snapshotDate: string;

  @ApiProperty({ description: 'Snapshot granularity', enum: SnapshotGranularity, example: SnapshotGranularity.DAILY })
  granularity: SnapshotGranularity;

  // Asset Value Fields (Assets Only)
  @ApiProperty({ description: 'Total Asset Value', example: 1000000 })
  totalAssetValue: number;

  @ApiProperty({ description: 'Total Asset Invested', example: 800000 })
  totalAssetInvested: number;

  // Asset P&L Fields (Assets Only)
  @ApiProperty({ description: 'Total Asset P&L', example: 50000 })
  totalAssetPl: number;

  @ApiProperty({ description: 'Unrealized Asset P&L', example: 30000 })
  unrealizedAssetPl: number;

  @ApiProperty({ description: 'Realized Asset P&L', example: 20000 })
  realizedAssetPl: number;

  // Portfolio P&L Fields (Assets + Deposits)
  @ApiProperty({ description: 'Total Portfolio P&L (Assets + Deposits)', example: 55000 })
  totalPortfolioPl: number;

  @ApiProperty({ description: 'Unrealized Portfolio P&L (Assets + Deposits)', example: 35000 })
  unrealizedPortfolioPl: number;

  @ApiProperty({ description: 'Realized Portfolio P&L (Assets + Deposits)', example: 20000 })
  realizedPortfolioPl: number;

  @ApiProperty({ description: 'Total return percentage', example: 5.0 })
  totalReturn: number;

  @ApiProperty({ description: 'Cash balance', example: 200000 })
  cashBalance: number;

  // Portfolio Value Fields (Assets + Deposits)
  @ApiProperty({ description: 'Total Portfolio Value (Assets + Deposits)', example: 1200000 })
  totalPortfolioValue: number;

  @ApiProperty({ description: 'Total Portfolio Invested (Assets + Deposits)', example: 1000000 })
  totalPortfolioInvested: number;

  // Asset Performance Metrics (Assets Only)
  @ApiProperty({ description: 'Asset Daily return percentage (Assets Only)', example: 0.5 })
  assetDailyReturn: number;

  @ApiProperty({ description: 'Asset Weekly return percentage (Assets Only)', example: 3.5 })
  assetWeeklyReturn: number;

  @ApiProperty({ description: 'Asset Monthly return percentage (Assets Only)', example: 15.0 })
  assetMonthlyReturn: number;

  @ApiProperty({ description: 'Asset Year-to-date return percentage (Assets Only)', example: 20.0 })
  assetYtdReturn: number;

  // Asset Risk Metrics (Assets Only)
  @ApiProperty({ description: 'Asset Volatility percentage (Assets Only)', example: 2.5 })
  assetVolatility: number;

  @ApiProperty({ description: 'Asset Maximum drawdown percentage (Assets Only)', example: 5.0 })
  assetMaxDrawdown: number;

  // Portfolio Performance Metrics (Assets + Deposits)
  @ApiProperty({ description: 'Portfolio Daily return percentage (Assets + Deposits)', example: 0.3 })
  portfolioDailyReturn: number;

  @ApiProperty({ description: 'Portfolio Weekly return percentage (Assets + Deposits)', example: 2.1 })
  portfolioWeeklyReturn: number;

  @ApiProperty({ description: 'Portfolio Monthly return percentage (Assets + Deposits)', example: 9.0 })
  portfolioMonthlyReturn: number;

  @ApiProperty({ description: 'Portfolio Year-to-date return percentage (Assets + Deposits)', example: 12.0 })
  portfolioYtdReturn: number;

  // Portfolio Risk Metrics (Assets + Deposits)
  @ApiProperty({ description: 'Portfolio Volatility percentage (Assets + Deposits)', example: 1.8 })
  portfolioVolatility: number;

  @ApiProperty({ description: 'Portfolio Maximum drawdown percentage (Assets + Deposits)', example: 3.2 })
  portfolioMaxDrawdown: number;

  // Legacy fields for backward compatibility (deprecated)
  @ApiProperty({ description: 'Daily return percentage (DEPRECATED)', example: 0.5 })
  dailyReturn: number;

  @ApiProperty({ description: 'Weekly return percentage (DEPRECATED)', example: 3.5 })
  weeklyReturn: number;

  @ApiProperty({ description: 'Monthly return percentage (DEPRECATED)', example: 15.0 })
  monthlyReturn: number;

  @ApiProperty({ description: 'Year-to-date return percentage (DEPRECATED)', example: 20.0 })
  ytdReturn: number;

  @ApiProperty({ description: 'Volatility percentage (DEPRECATED)', example: 2.5 })
  volatility: number;

  @ApiProperty({ description: 'Maximum drawdown percentage (DEPRECATED)', example: 5.0 })
  maxDrawdown: number;

  @ApiProperty({ 
    description: 'Asset allocation by type', 
    example: { 'STOCK': { percentage: 80.0, value: 800000, count: 5 } }
  })
  assetAllocation: {
    [assetType: string]: {
      percentage: number;
      value: number;
      count: number;
    };
  };

  @ApiProperty({ description: 'Total asset count', example: 5 })
  assetCount: number;

  @ApiProperty({ description: 'Active asset count', example: 5 })
  activeAssetCount: number;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Created by', example: 'test' })
  createdBy: string;

  @ApiProperty({ description: 'Notes', example: 'Test portfolio snapshot' })
  notes: string;

  // Fund Management Fields
  @ApiProperty({ description: 'Total outstanding units', example: 1000000 })
  totalOutstandingUnits: number;

  @ApiProperty({ description: 'NAV per unit', example: 1.25 })
  navPerUnit: number;

  @ApiProperty({ description: 'Number of investors', example: 150 })
  numberOfInvestors: number;

  @ApiProperty({ description: 'Whether this portfolio is a fund', example: true })
  isFund: boolean;

  @ApiProperty({ description: 'Created at', example: '2025-09-20T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2025-09-20T10:00:00Z' })
  updatedAt: Date;
}
