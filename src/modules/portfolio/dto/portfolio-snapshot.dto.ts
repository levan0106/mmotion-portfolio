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

  @ApiProperty({ description: 'Total portfolio value', example: 1000000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalValue: number;

  @ApiProperty({ description: 'Total P&L', example: 50000 })
  @IsNumber()
  @Type(() => Number)
  totalPl: number;

  @ApiProperty({ description: 'Unrealized P&L', example: 30000 })
  @IsNumber()
  @Type(() => Number)
  unrealizedPl: number;

  @ApiProperty({ description: 'Realized P&L', example: 20000 })
  @IsNumber()
  @Type(() => Number)
  realizedPl: number;

  @ApiProperty({ description: 'Total return percentage', example: 5.0 })
  @IsNumber()
  @Type(() => Number)
  totalReturn: number;

  @ApiProperty({ description: 'Cash balance', example: 200000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cashBalance: number;

  @ApiProperty({ description: 'Invested value', example: 800000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  investedValue: number;

  @ApiProperty({ description: 'Daily return percentage', example: 0.5 })
  @IsNumber()
  @Type(() => Number)
  dailyReturn: number;

  @ApiProperty({ description: 'Weekly return percentage', example: 3.5 })
  @IsNumber()
  @Type(() => Number)
  weeklyReturn: number;

  @ApiProperty({ description: 'Monthly return percentage', example: 15.0 })
  @IsNumber()
  @Type(() => Number)
  monthlyReturn: number;

  @ApiProperty({ description: 'Year-to-date return percentage', example: 20.0 })
  @IsNumber()
  @Type(() => Number)
  ytdReturn: number;

  @ApiProperty({ description: 'Volatility percentage', example: 2.5 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  volatility: number;

  @ApiProperty({ description: 'Maximum drawdown percentage', example: 5.0 })
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
  @ApiPropertyOptional({ description: 'Total portfolio value', example: 1000000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalValue?: number;

  @ApiPropertyOptional({ description: 'Total P&L', example: 50000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalPl?: number;

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

  @ApiPropertyOptional({ description: 'Invested value', example: 800000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  investedValue?: number;

  @ApiPropertyOptional({ description: 'Daily return percentage', example: 0.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dailyReturn?: number;

  @ApiPropertyOptional({ description: 'Weekly return percentage', example: 3.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weeklyReturn?: number;

  @ApiPropertyOptional({ description: 'Monthly return percentage', example: 15.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  monthlyReturn?: number;

  @ApiPropertyOptional({ description: 'Year-to-date return percentage', example: 20.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ytdReturn?: number;

  @ApiPropertyOptional({ description: 'Volatility percentage', example: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  volatility?: number;

  @ApiPropertyOptional({ description: 'Maximum drawdown percentage', example: 5.0 })
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

  @ApiProperty({ description: 'Total portfolio value', example: 1000000 })
  totalValue: number;

  @ApiProperty({ description: 'Total P&L', example: 50000 })
  totalPl: number;

  @ApiProperty({ description: 'Total return percentage', example: 5.0 })
  totalReturn: number;

  @ApiProperty({ description: 'Cash balance', example: 200000 })
  cashBalance: number;

  @ApiProperty({ description: 'Invested value', example: 800000 })
  investedValue: number;

  @ApiProperty({ description: 'Daily return percentage', example: 0.5 })
  dailyReturn: number;

  @ApiProperty({ description: 'Weekly return percentage', example: 3.5 })
  weeklyReturn: number;

  @ApiProperty({ description: 'Monthly return percentage', example: 15.0 })
  monthlyReturn: number;

  @ApiProperty({ description: 'Year-to-date return percentage', example: 20.0 })
  ytdReturn: number;

  @ApiProperty({ description: 'Volatility percentage', example: 2.5 })
  volatility: number;

  @ApiProperty({ description: 'Maximum drawdown percentage', example: 5.0 })
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

  @ApiProperty({ description: 'Created at', example: '2025-09-20T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2025-09-20T10:00:00Z' })
  updatedAt: Date;
}
