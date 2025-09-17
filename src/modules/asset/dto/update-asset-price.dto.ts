import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsObject, Min } from 'class-validator';
import { PriceType, PriceSource } from '../entities/asset-price.entity';

/**
 * DTO for updating an existing asset price.
 * 
 * CR-005 Global Assets System:
 * - Partial update support
 * - Price validation
 * - Price type and source validation
 * - Metadata support
 */
export class UpdateAssetPriceDto {
  /**
   * Current price of the asset.
   * Must be positive value.
   */
  @ApiPropertyOptional({
    description: 'Current price of the asset',
    example: 150000,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01, {
    message: 'Price must be greater than 0',
  })
  currentPrice?: number;

  /**
   * Type of the price (MANUAL, MARKET_DATA, EXTERNAL, CALCULATED).
   */
  @ApiPropertyOptional({
    description: 'Type of the price',
    enum: PriceType,
    example: PriceType.MARKET_DATA,
  })
  @IsOptional()
  @IsEnum(PriceType, {
    message: 'Price type must be one of: MANUAL, MARKET_DATA, EXTERNAL, CALCULATED',
  })
  priceType?: PriceType;

  /**
   * Source of the price (USER, MARKET_DATA_SERVICE, EXTERNAL_API, CALCULATED).
   */
  @ApiPropertyOptional({
    description: 'Source of the price',
    enum: PriceSource,
    example: PriceSource.MARKET_DATA_SERVICE,
  })
  @IsOptional()
  @IsEnum(PriceSource, {
    message: 'Price source must be one of: USER, MARKET_DATA_SERVICE, EXTERNAL_API, CALCULATED',
  })
  priceSource?: PriceSource;

  /**
   * Timestamp when the price was last updated.
   */
  @ApiPropertyOptional({
    description: 'Timestamp when the price was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsString()
  lastPriceUpdate?: string;

  /**
   * Optional metadata about the price (e.g., API response, calculation details).
   */
  @ApiPropertyOptional({
    description: 'Optional metadata about the price',
    example: { api_provider: 'yahoo_finance', response_time: '150ms' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
