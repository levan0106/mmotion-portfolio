import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsArray, IsUUID, IsOptional, IsString } from 'class-validator';

/**
 * DTO for updating asset prices by historical date
 */
export class UpdatePriceByDateDto {
  @ApiProperty({
    description: 'Target date to get historical prices from',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  targetDate: string;

  @ApiProperty({
    description: 'Array of asset IDs to update',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  assetIds: string[];

  @ApiPropertyOptional({
    description: 'Reason for the price update',
    example: 'Bulk update from historical data',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO for getting assets with historical prices
 */
export class GetAssetsWithHistoricalPriceDto {
  @ApiProperty({
    description: 'Target date to get historical prices from',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  targetDate: string;

  @ApiPropertyOptional({
    description: 'Array of specific asset IDs to check (optional)',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assetIds?: string[];
}

/**
 * Response DTO for asset with historical price
 */
export class AssetWithHistoricalPriceDto {
  @ApiProperty({
    description: 'Asset ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  assetId: string;

  @ApiProperty({
    description: 'Asset symbol',
    example: 'HPG',
  })
  symbol: string;

  @ApiProperty({
    description: 'Asset name',
    example: 'Hoa Phat Group',
  })
  name: string;

  @ApiProperty({
    description: 'Current price',
    example: 150000,
  })
  currentPrice: number;

  @ApiPropertyOptional({
    description: 'Historical price from target date',
    example: 148000,
  })
  historicalPrice?: number;

  @ApiProperty({
    description: 'Whether historical data exists for target date',
    example: true,
  })
  hasHistoricalData: boolean;

  @ApiProperty({
    description: 'Currency of the asset',
    example: 'VND',
  })
  currency: string;

  @ApiProperty({
    description: 'Asset type',
    example: 'STOCK',
  })
  type: string;
}

/**
 * Response DTO for bulk update result
 */
export class BulkUpdateResultDto {
  @ApiProperty({
    description: 'Number of assets successfully updated',
    example: 5,
  })
  successCount: number;

  @ApiProperty({
    description: 'Number of assets that failed to update',
    example: 2,
  })
  failedCount: number;

  @ApiProperty({
    description: 'Total number of assets processed',
    example: 7,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Detailed results for each asset',
    type: [Object],
  })
  results: Array<{
    assetId: string;
    symbol: string;
    success: boolean;
    message: string;
    oldPrice?: number;
    newPrice?: number;
  }>;
}
