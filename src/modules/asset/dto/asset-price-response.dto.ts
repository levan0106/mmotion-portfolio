import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceType, PriceSource } from '../entities/asset-price.entity';

/**
 * DTO for asset price response data.
 * 
 * CR-005 Global Assets System:
 * - Complete price information
 * - Computed properties
 * - Price age and status
 * - Formatted display values
 */
export class AssetPriceResponseDto {
  /**
   * Unique identifier for the asset price record.
   */
  @ApiProperty({
    description: 'Unique identifier for the asset price record',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  /**
   * ID of the global asset this price belongs to.
   */
  @ApiProperty({
    description: 'ID of the global asset this price belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  assetId: string;

  /**
   * Current price of the asset.
   */
  @ApiProperty({
    description: 'Current price of the asset',
    example: 150000,
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
  priceType: PriceType;

  /**
   * Source of the price (USER, MARKET_DATA_SERVICE, EXTERNAL_API, CALCULATED).
   */
  @ApiProperty({
    description: 'Source of the price',
    enum: PriceSource,
    example: PriceSource.MARKET_DATA_SERVICE,
  })
  priceSource: PriceSource;

  /**
   * Timestamp when the price was last updated.
   */
  @ApiProperty({
    description: 'Timestamp when the price was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  lastPriceUpdate: Date;

  /**
   * Optional metadata about the price (e.g., API response, calculation details).
   */
  @ApiPropertyOptional({
    description: 'Optional metadata about the price',
    example: { api_provider: 'yahoo_finance', response_time: '150ms' },
  })
  metadata?: Record<string, any>;

  /**
   * Timestamp when the price record was created.
   */
  @ApiProperty({
    description: 'Timestamp when the price record was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  /**
   * Timestamp when the price record was last updated.
   */
  @ApiProperty({
    description: 'Timestamp when the price record was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;

  // Computed Properties

  /**
   * Whether this price is recent (updated within last 24 hours).
   */
  @ApiProperty({
    description: 'Whether this price is recent (updated within last 24 hours)',
    example: true,
  })
  isRecent: boolean;

  /**
   * Whether this price is from market data.
   */
  @ApiProperty({
    description: 'Whether this price is from market data',
    example: true,
  })
  isFromMarketData: boolean;

  /**
   * Whether this price is manually set by user.
   */
  @ApiProperty({
    description: 'Whether this price is manually set by user',
    example: false,
  })
  isManual: boolean;

  /**
   * Age of the price in hours.
   */
  @ApiProperty({
    description: 'Age of the price in hours',
    example: 2,
  })
  priceAgeHours: number;

  /**
   * Age of the price in days.
   */
  @ApiProperty({
    description: 'Age of the price in days',
    example: 0,
  })
  priceAgeDays: number;

  /**
   * Whether this price needs updating based on age and type.
   */
  @ApiProperty({
    description: 'Whether this price needs updating based on age and type',
    example: false,
  })
  needsUpdating: boolean;

  /**
   * Formatted price string for display.
   */
  @ApiProperty({
    description: 'Formatted price string for display',
    example: '150.000 ₫',
  })
  formattedPrice: string;

  /**
   * Price source display name.
   */
  @ApiProperty({
    description: 'Price source display name',
    example: 'Dịch vụ dữ liệu thị trường',
  })
  priceSourceDisplayName: string;

  /**
   * Price type display name.
   */
  @ApiProperty({
    description: 'Price type display name',
    example: 'Dữ liệu thị trường',
  })
  priceTypeDisplayName: string;
}
