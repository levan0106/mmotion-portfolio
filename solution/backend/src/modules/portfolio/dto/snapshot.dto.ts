import { IsString, IsUUID, IsDateString, IsEnum, IsNumber, IsOptional, IsBoolean, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';

export class CreateSnapshotDto {
  @ApiProperty({ description: 'Portfolio ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  portfolioId: string;

  @ApiProperty({ description: 'Asset ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  assetId: string;

  @ApiProperty({ description: 'Asset symbol', example: 'HPG' })
  @IsString()
  assetSymbol: string;

  @ApiProperty({ description: 'Snapshot date', example: '2024-12-19' })
  @IsDateString()
  snapshotDate: string;

  @ApiProperty({ description: 'Snapshot granularity', enum: SnapshotGranularity, example: SnapshotGranularity.DAILY })
  @IsEnum(SnapshotGranularity)
  granularity: SnapshotGranularity;

  @ApiProperty({ description: 'Asset quantity', example: 1000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ description: 'Current price', example: 34059 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentPrice: number;

  @ApiProperty({ description: 'Current value', example: 34059000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentValue: number;

  @ApiProperty({ description: 'Cost basis', example: 20000000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costBasis: number;

  @ApiProperty({ description: 'Average cost', example: 20000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  avgCost: number;

  @ApiProperty({ description: 'Realized P&L', example: 500000 })
  @IsNumber()
  @Type(() => Number)
  realizedPl: number;

  @ApiProperty({ description: 'Unrealized P&L', example: 14059000 })
  @IsNumber()
  @Type(() => Number)
  unrealizedPl: number;

  @ApiProperty({ description: 'Total P&L', example: 14559000 })
  @IsNumber()
  @Type(() => Number)
  totalPl: number;

  @ApiProperty({ description: 'Allocation percentage', example: 24.2 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  allocationPercentage: number;

  @ApiProperty({ description: 'Portfolio total value', example: 140590000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  portfolioTotalValue: number;

  @ApiProperty({ description: 'Return percentage', example: 72.8 })
  @IsNumber()
  @Type(() => Number)
  returnPercentage: number;

  @ApiProperty({ description: 'Daily return', example: 1.2 })
  @IsNumber()
  @Type(() => Number)
  dailyReturn: number;

  @ApiProperty({ description: 'Cumulative return', example: 72.8 })
  @IsNumber()
  @Type(() => Number)
  cumulativeReturn: number;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Created by', example: 'system' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Portfolio snapshot for 2024-12-19' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSnapshotDto {
  @ApiPropertyOptional({ description: 'Asset quantity', example: 1000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Current price', example: 34059 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentPrice?: number;

  @ApiPropertyOptional({ description: 'Current value', example: 34059000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentValue?: number;

  @ApiPropertyOptional({ description: 'Cost basis', example: 20000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costBasis?: number;

  @ApiPropertyOptional({ description: 'Average cost', example: 20000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  avgCost?: number;

  @ApiPropertyOptional({ description: 'Realized P&L', example: 500000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  realizedPl?: number;

  @ApiPropertyOptional({ description: 'Unrealized P&L', example: 14059000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unrealizedPl?: number;

  @ApiPropertyOptional({ description: 'Total P&L', example: 14559000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalPl?: number;

  @ApiPropertyOptional({ description: 'Allocation percentage', example: 24.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  allocationPercentage?: number;

  @ApiPropertyOptional({ description: 'Portfolio total value', example: 140590000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  portfolioTotalValue?: number;

  @ApiPropertyOptional({ description: 'Return percentage', example: 72.8 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  returnPercentage?: number;

  @ApiPropertyOptional({ description: 'Daily return', example: 1.2 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dailyReturn?: number;

  @ApiPropertyOptional({ description: 'Cumulative return', example: 72.8 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cumulativeReturn?: number;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Notes', example: 'Updated snapshot data' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SnapshotResponseDto {
  @ApiProperty({ description: 'Snapshot ID', example: '123e4567-e89b-12d3-a456-426614174002' })
  id: string;

  @ApiProperty({ description: 'Portfolio ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  portfolioId: string;

  @ApiProperty({ description: 'Asset ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  assetId: string;

  @ApiProperty({ description: 'Asset symbol', example: 'HPG' })
  assetSymbol: string;

  @ApiProperty({ description: 'Asset type', example: 'STOCK' })
  assetType: string;

  @ApiProperty({ description: 'Snapshot date', example: '2024-12-19' })
  snapshotDate: string;

  @ApiProperty({ description: 'Snapshot granularity', enum: SnapshotGranularity, example: SnapshotGranularity.DAILY })
  granularity: SnapshotGranularity;

  @ApiProperty({ description: 'Asset quantity', example: 1000 })
  quantity: number;

  @ApiProperty({ description: 'Current price', example: 34059 })
  currentPrice: number;

  @ApiProperty({ description: 'Current value', example: 34059000 })
  currentValue: number;

  @ApiProperty({ description: 'Cost basis', example: 20000000 })
  costBasis: number;

  @ApiProperty({ description: 'Average cost', example: 20000 })
  avgCost: number;

  @ApiProperty({ description: 'Realized P&L', example: 500000 })
  realizedPl: number;

  @ApiProperty({ description: 'Unrealized P&L', example: 14059000 })
  unrealizedPl: number;

  @ApiProperty({ description: 'Total P&L', example: 14559000 })
  totalPl: number;

  @ApiProperty({ description: 'Allocation percentage', example: 24.2 })
  allocationPercentage: number;

  @ApiProperty({ description: 'Portfolio total value', example: 140590000 })
  portfolioTotalValue: number;

  @ApiProperty({ description: 'Return percentage', example: 72.8 })
  returnPercentage: number;

  @ApiProperty({ description: 'Daily return', example: 1.2 })
  dailyReturn: number;

  @ApiProperty({ description: 'Cumulative return', example: 72.8 })
  cumulativeReturn: number;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Created by', example: 'system' })
  createdBy: string;

  @ApiProperty({ description: 'Notes', example: 'Portfolio snapshot for 2024-12-19' })
  notes: string;

  @ApiProperty({ description: 'Created at', example: '2024-12-19T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2024-12-19T10:00:00Z' })
  updatedAt: Date;
}

export class SnapshotQueryDto {
  @ApiPropertyOptional({ description: 'Portfolio ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'Asset ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiPropertyOptional({ description: 'Asset symbol', example: 'HPG' })
  @IsOptional()
  @IsString()
  assetSymbol?: string;

  @ApiPropertyOptional({ description: 'Snapshot granularity', enum: SnapshotGranularity, example: SnapshotGranularity.DAILY })
  @IsOptional()
  @IsEnum(SnapshotGranularity)
  granularity?: SnapshotGranularity;

  @ApiPropertyOptional({ description: 'Start date', example: '2024-12-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Order by field', example: 'snapshotDate' })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiPropertyOptional({ description: 'Order direction', example: 'DESC' })
  @IsOptional()
  @IsString()
  orderDirection?: 'ASC' | 'DESC';
}

export class SnapshotTimelineQueryDto {
  @ApiProperty({ description: 'Portfolio ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  portfolioId: string;

  @ApiProperty({ description: 'Start date', example: '2024-12-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date', example: '2024-12-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Snapshot granularity', enum: SnapshotGranularity, example: SnapshotGranularity.DAILY })
  @IsOptional()
  @IsEnum(SnapshotGranularity)
  granularity?: SnapshotGranularity;

  @ApiPropertyOptional({ description: 'Asset ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiPropertyOptional({ description: 'Asset symbol', example: 'HPG' })
  @IsOptional()
  @IsString()
  assetSymbol?: string;
}

export class SnapshotStatisticsDto {
  @ApiProperty({ description: 'Total snapshots', example: 1500 })
  totalSnapshots: number;

  @ApiProperty({ description: 'Daily snapshots', example: 1000 })
  dailySnapshots: number;

  @ApiProperty({ description: 'Weekly snapshots', example: 300 })
  weeklySnapshots: number;

  @ApiProperty({ description: 'Monthly snapshots', example: 200 })
  monthlySnapshots: number;

  @ApiProperty({ description: 'Latest snapshot date', example: '2024-12-19' })
  latestSnapshotDate: string | null;

  @ApiProperty({ description: 'Oldest snapshot date', example: '2024-01-01' })
  oldestSnapshotDate: string | null;
}

export class SnapshotAggregationDto {
  @ApiProperty({ description: 'Portfolio ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  portfolioId: string;

  @ApiProperty({ description: 'Snapshot date', example: '2024-12-19' })
  snapshotDate: string;

  @ApiProperty({ description: 'Snapshot granularity', enum: SnapshotGranularity, example: SnapshotGranularity.DAILY })
  granularity: SnapshotGranularity;

  @ApiProperty({ description: 'Total value', example: 140590000 })
  totalValue: number;

  @ApiProperty({ description: 'Total P&L', example: 14559000 })
  totalPl: number;

  @ApiProperty({ description: 'Total return', example: 11.5 })
  totalReturn: number;

  @ApiProperty({ description: 'Asset count', example: 5 })
  assetCount: number;
}
