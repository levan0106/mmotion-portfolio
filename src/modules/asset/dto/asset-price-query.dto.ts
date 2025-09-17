import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PriceType, PriceSource } from '../entities/asset-price.entity';

/**
 * DTO for querying asset prices with filtering, pagination, and sorting.
 * 
 * CR-005 Global Assets System:
 * - Price type filtering
 * - Price source filtering
 * - Age-based filtering
 * - Pagination and sorting support
 */
export class AssetPriceQueryDto {
  /**
   * Filter by asset ID.
   */
  @ApiPropertyOptional({
    description: 'Filter by asset ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsString()
  assetId?: string;

  /**
   * Filter by price type.
   */
  @ApiPropertyOptional({
    description: 'Filter by price type',
    enum: PriceType,
    example: PriceType.MARKET_DATA,
  })
  @IsOptional()
  @IsEnum(PriceType)
  priceType?: PriceType;

  /**
   * Filter by price source.
   */
  @ApiPropertyOptional({
    description: 'Filter by price source',
    enum: PriceSource,
    example: PriceSource.MARKET_DATA_SERVICE,
  })
  @IsOptional()
  @IsEnum(PriceSource)
  priceSource?: PriceSource;

  /**
   * Filter by multiple price types.
   */
  @ApiPropertyOptional({
    description: 'Filter by multiple price types',
    example: [PriceType.MARKET_DATA, PriceType.MANUAL],
    enum: PriceType,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(PriceType, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  priceTypes?: PriceType[];

  /**
   * Filter by multiple price sources.
   */
  @ApiPropertyOptional({
    description: 'Filter by multiple price sources',
    example: [PriceSource.MARKET_DATA_SERVICE, PriceSource.USER],
    enum: PriceSource,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(PriceSource, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  priceSources?: PriceSource[];

  /**
   * Filter by recent prices only (updated within last 24 hours).
   */
  @ApiPropertyOptional({
    description: 'Filter by recent prices only (updated within last 24 hours)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  recentOnly?: boolean;

  /**
   * Filter by prices that need updating (older than specified hours).
   */
  @ApiPropertyOptional({
    description: 'Filter by prices that need updating (older than specified hours)',
    example: 24,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  needsUpdatingOlderThan?: number;

  /**
   * Filter by market data prices only.
   */
  @ApiPropertyOptional({
    description: 'Filter by market data prices only',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  marketDataOnly?: boolean;

  /**
   * Filter by manual prices only.
   */
  @ApiPropertyOptional({
    description: 'Filter by manual prices only',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  manualOnly?: boolean;

  /**
   * Sort field.
   */
  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'lastPriceUpdate',
    enum: ['currentPrice', 'priceType', 'priceSource', 'lastPriceUpdate', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'currentPrice' | 'priceType' | 'priceSource' | 'lastPriceUpdate' | 'createdAt' | 'updatedAt';

  /**
   * Sort order.
   */
  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  /**
   * Page number (1-based).
   */
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  /**
   * Number of items per page.
   */
  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
