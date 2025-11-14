import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType } from '../enums/asset-type.enum';
import { PriceMode } from '../enums/price-mode.enum';

/**
 * Asset Response DTO
 * Data Transfer Object for asset responses with computed properties
 * 
 * CR-003 Changes:
 * - Symbol field is now the primary identifier
 * - Code field is deprecated but included for backward compatibility
 * - Added new computed properties for symbol management
 */
export class AssetResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the asset',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;


  @ApiProperty({
    description: 'Name of the asset',
    example: 'Hoa Phat Group',
  })
  name: string;

  @ApiProperty({
    description: 'Asset symbol for trading - primary identifier',
    example: 'HPG',
  })
  symbol: string;

  @ApiProperty({
    description: 'Type of the asset',
    enum: AssetType,
    example: AssetType.STOCK,
  })
  type: AssetType;

  @ApiPropertyOptional({
    description: 'Asset description',
    example: 'Leading steel manufacturer in Vietnam',
  })
  description?: string;

  @ApiProperty({
    description: 'Price mode for the asset (AUTOMATIC or MANUAL)',
    enum: PriceMode,
    example: PriceMode.AUTOMATIC,
  })
  priceMode: PriceMode;

  @ApiProperty({
    description: 'Initial value of the asset when first added to portfolio',
    example: 1000000,
  })
  initialValue: number;

  @ApiProperty({
    description: 'Initial quantity of the asset when first added to portfolio',
    example: 1000,
  })
  initialQuantity: number;

  @ApiPropertyOptional({
    description: 'Current market value of the asset',
    example: 1200000,
  })
  currentValue?: number;

  @ApiPropertyOptional({
    description: 'Current quantity of the asset held',
    example: 1000,
  })
  currentQuantity?: number;

  @ApiPropertyOptional({
    description: 'Current market price per unit',
    example: 1200,
  })
  currentPrice?: number;

  @ApiPropertyOptional({
    description: 'Average cost per unit from buy trades',
    example: 1000,
  })
  avgCost?: number;

  @ApiPropertyOptional({
    description: 'Timestamp when the asset price was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  priceUpdatedAt?: Date;

  @ApiProperty({
    description: 'Timestamp when the asset was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the asset was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'ID of the user who created this asset',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  createdBy: string;

  @ApiProperty({
    description: 'ID of the user who last updated this asset',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  updatedBy: string;

  // Computed properties
  @ApiProperty({
    description: 'Current total value of this asset (currentValue or initialValue)',
    example: 1200000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Current total quantity of this asset (currentQuantity or initialQuantity)',
    example: 1000,
  })
  totalQuantity: number;

  @ApiProperty({
    description: 'Whether this asset has any associated trades',
    example: true,
  })
  hasTrades: boolean;

  @ApiPropertyOptional({
    description: 'Whether this asset has trades in portfolios that the account has access to',
    example: true,
  })
  hasPortfolioTrades?: boolean;

  @ApiProperty({
    description: 'Formatted display name for UI',
    example: 'Hoa Phat Group (HPG)',
  })
  displayName: string;

  @ApiProperty({
    description: 'Whether the symbol field can be modified',
    example: false,
  })
  canModifySymbol: boolean;

  @ApiProperty({
    description: 'Primary identifier for this asset (symbol)',
    example: 'HPG',
  })
  primaryIdentifier: string;
}

/**
 * Paginated Asset Response DTO
 * Data Transfer Object for paginated asset responses
 */
export class PaginatedAssetResponseDto {
  @ApiProperty({
    description: 'Array of assets',
    type: [AssetResponseDto],
  })
  data: AssetResponseDto[];

  @ApiProperty({
    description: 'Total number of assets',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;
}

/**
 * Asset Statistics Response DTO
 * Data Transfer Object for asset statistics
 */
export class AssetStatisticsResponseDto {
  @ApiProperty({
    description: 'Total number of assets in the portfolio',
    example: 15,
  })
  totalAssets: number;

  @ApiProperty({
    description: 'Assets count by type',
    example: {
      STOCK: 8,
      BOND: 3,
      GOLD: 2,
      DEPOSIT: 1,
      CASH: 1,
    },
  })
  assetsByType: Record<AssetType, number>;

  @ApiProperty({
    description: 'Total value of all assets in the portfolio',
    example: 50000000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Average value per asset',
    example: 3333333.33,
  })
  averageValue: number;
}

/**
 * Asset Existence Check Response DTO
 * Data Transfer Object for asset existence check
 */
export class AssetExistenceResponseDto {
  @ApiProperty({
    description: 'Whether the asset exists',
    example: true,
  })
  exists: boolean;
}

/**
 * Asset Count Response DTO
 * Data Transfer Object for asset count
 */
export class AssetCountResponseDto {
  @ApiProperty({
    description: 'Number of assets in the portfolio',
    example: 15,
  })
  count: number;
}

/**
 * Asset Deletion Response DTO
 * Data Transfer Object for asset deletion responses
 */
export class AssetDeletionResponseDto {
  @ApiPropertyOptional({
    description: 'Success status',
    example: true,
  })
  success?: boolean;

  @ApiPropertyOptional({
    description: 'Error message if deletion failed',
    example: 'Asset has associated trades',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'Number of associated trades',
    example: 3,
  })
  tradeCount?: number;

  @ApiPropertyOptional({
    description: 'User-friendly message',
    example: 'This asset has 3 associated trades. Deleting will remove all trades first.',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Available options for user',
    example: {
      cancel: 'Cancel deletion',
      force: 'Delete asset and all trades'
    },
  })
  options?: {
    cancel: string;
    force: string;
  };
}