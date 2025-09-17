import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsUUID, IsObject, Min, IsNotEmpty } from 'class-validator';
import { PriceType, PriceSource } from '../entities/asset-price.entity';

/**
 * DTO for creating a new asset price.
 * 
 * CR-005 Global Assets System:
 * - Price validation
 * - Price type and source validation
 * - Metadata support
 * - Foreign key validation
 */
export class CreateAssetPriceDto {
  /**
   * ID of the global asset this price belongs to.
   * Foreign key to global_assets table.
   */
  @ApiProperty({
    description: 'ID of the global asset this price belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  assetId: string;

  /**
   * Current price of the asset.
   * Must be positive value.
   */
  @ApiProperty({
    description: 'Current price of the asset',
    example: 150000,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01, {
    message: 'Price must be greater than 0',
  })
  currentPrice: number;

  /**
   * Type of the price (MANUAL, MARKET_DATA, EXTERNAL, CALCULATED).
   */
  @ApiProperty({
    description: 'Type of the price',
    enum: PriceType,
    example: PriceType.MARKET_DATA,
  })
  @IsEnum(PriceType, {
    message: 'Price type must be one of: MANUAL, MARKET_DATA, EXTERNAL, CALCULATED',
  })
  priceType: PriceType;

  /**
   * Source of the price (USER, MARKET_DATA_SERVICE, EXTERNAL_API, CALCULATED).
   */
  @ApiProperty({
    description: 'Source of the price',
    enum: PriceSource,
    example: PriceSource.MARKET_DATA_SERVICE,
  })
  @IsEnum(PriceSource, {
    message: 'Price source must be one of: USER, MARKET_DATA_SERVICE, EXTERNAL_API, CALCULATED',
  })
  priceSource: PriceSource;

  /**
   * Timestamp when the price was last updated.
   */
  @ApiProperty({
    description: 'Timestamp when the price was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsString()
  @IsNotEmpty()
  lastPriceUpdate: string;

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
