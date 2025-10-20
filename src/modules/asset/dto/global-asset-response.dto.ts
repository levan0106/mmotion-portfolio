import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType } from '../enums/asset-type.enum';

/**
 * DTO for global asset response data.
 * 
 * CR-005 Global Assets System:
 * - Complete asset information
 * - Computed properties
 * - Market information
 * - Trading status
 */
export class GlobalAssetResponseDto {
  /**
   * Unique identifier for the global asset.
   */
  @ApiProperty({
    description: 'Unique identifier for the global asset',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  /**
   * Asset symbol for trading (e.g., 'HPG', 'VCB', 'GOLD').
   */
  @ApiProperty({
    description: 'Asset symbol for trading',
    example: 'HPG',
  })
  symbol: string;

  /**
   * Name of the asset (e.g., 'Hoa Phat Group', 'Vietcombank').
   */
  @ApiProperty({
    description: 'Name of the asset',
    example: 'Hoa Phat Group',
  })
  name: string;

  /**
   * Type of the asset (STOCK, BOND, GOLD, DEPOSIT, CASH).
   */
  @ApiProperty({
    description: 'Type of the asset',
    enum: AssetType,
    example: AssetType.STOCK,
  })
  type: AssetType;

  /**
   * Nation code where this asset is traded (e.g., 'VN', 'US', 'UK').
   */
  @ApiProperty({
    description: 'Nation code where this asset is traded',
    example: 'VN',
  })
  nation: string;

  /**
   * Market code where this asset is traded (e.g., 'HOSE', 'NYSE', 'LSE').
   */
  @ApiProperty({
    description: 'Market code where this asset is traded',
    example: 'HOSE',
  })
  marketCode: string;

  /**
   * Currency used for this asset (e.g., 'VND', 'USD', 'EUR').
   */
  @ApiProperty({
    description: 'Currency used for this asset',
    example: 'VND',
  })
  currency: string;

  /**
   * Timezone for this asset's market (e.g., 'Asia/Ho_Chi_Minh', 'America/New_York').
   */
  @ApiProperty({
    description: 'Timezone for this asset\'s market',
    example: 'Asia/Ho_Chi_Minh',
  })
  timezone: string;

  /**
   * Whether this asset is active and available for trading.
   */
  @ApiProperty({
    description: 'Whether this asset is active and available for trading',
    example: true,
  })
  isActive: boolean;

  /**
   * Optional description of the asset.
   */
  @ApiPropertyOptional({
    description: 'Asset description',
    example: 'Leading steel manufacturer in Vietnam',
  })
  description?: string;

  /**
   * Timestamp when the asset was created.
   */
  @ApiProperty({
    description: 'Timestamp when the asset was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  /**
   * Timestamp when the asset was last updated.
   */
  @ApiProperty({
    description: 'Timestamp when the asset was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;

  // Computed Properties

  /**
   * Global identifier for this asset (symbol.nation).
   */
  @ApiProperty({
    description: 'Global identifier for this asset (symbol.nation)',
    example: 'HPG.VN',
  })
  globalIdentifier: string;

  /**
   * Asset display name for UI.
   */
  @ApiProperty({
    description: 'Asset display name for UI',
    example: 'Hoa Phat Group (HPG.VN)',
  })
  displayName: string;

  /**
   * Market display name for UI.
   */
  @ApiProperty({
    description: 'Market display name for UI',
    example: 'HOSE (VN)',
  })
  marketDisplayName: string;

  /**
   * Whether this asset has any associated trades.
   */
  @ApiProperty({
    description: 'Whether this asset has any associated trades',
    example: false,
  })
  hasTrades: boolean;

  /**
   * Whether this asset is available for trading.
   */
  @ApiProperty({
    description: 'Whether this asset is available for trading',
    example: true,
  })
  isAvailableForTrading: boolean;

  /**
   * Market information object.
   */
  @ApiProperty({
    description: 'Market information object',
    example: {
      nation: 'VN',
      marketCode: 'HOSE',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
    },
  })
  marketInfo: {
    nation: string;
    marketCode: string;
    currency: string;
    timezone: string;
  };

  /**
   * Whether the asset can be modified.
   */
  @ApiProperty({
    description: 'Whether the asset can be modified',
    example: true,
  })
  canModify: boolean;

  /**
   * Latest price information for the asset, if available.
   */
  @ApiPropertyOptional({
    description: 'Latest price information for the asset',
    example: {
      currentPrice: 12345.67,
      priceType: 'EXTERNAL',
      priceSource: 'EXTERNAL_API',
      lastPriceUpdate: '2025-10-20T10:00:08.850Z',
      priceChangePercent: 1.23,
    },
  })
  assetPrice?: {
    currentPrice: number;
    priceType: string;
    priceSource: string;
    lastPriceUpdate: Date | string;
    priceChangePercent?: number;
  };
}
