import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, Length, Matches } from 'class-validator';
import { AssetType } from '../enums/asset-type.enum';
import { PriceMode } from '../enums/price-mode.enum';
/**
 * DTO for updating an existing global asset.
 * 
 * CR-005 Global Assets System:
 * - Partial update support
 * - Nation-specific validation
 * - Symbol format validation (if provided)
 * - Market code and currency validation
 */
export class UpdateGlobalAssetDto {
  /**
   * Name of the asset (e.g., 'Hoa Phat Group', 'Vietcombank').
   */
  @ApiPropertyOptional({
    description: 'Name of the asset',
    example: 'Hoa Phat Group',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  /**
   * Type of the asset (STOCK, BOND, GOLD, DEPOSIT, CASH).
   */
  @ApiPropertyOptional({
    description: 'Type of the asset',
    enum: AssetType,
    example: AssetType.STOCK,
  })
  @IsOptional()
  @IsEnum(AssetType, {
    message: 'Type must be one of: STOCK, BOND, GOLD, COMMODITY, DEPOSIT, CASH',
  })
  type?: AssetType;

  /**
   * Market code where this asset is traded (e.g., 'HOSE', 'NYSE', 'LSE').
   * Must be uppercase alphanumeric with dashes allowed.
   */
  @ApiPropertyOptional({
    description: 'Market code where this asset is traded',
    example: 'HOSE',
    pattern: '^[A-Z0-9-]+$',
    minLength: 1,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Market code must contain only uppercase letters, numbers, and dashes',
  })
  marketCode?: string;

  /**
   * Currency used for this asset (e.g., 'VND', 'USD', 'EUR').
   * Must be 3-letter ISO currency code.
   */
  @ApiPropertyOptional({
    description: 'Currency used for this asset',
    example: 'VND',
    pattern: '^[A-Z]{3}$',
    minLength: 3,
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency code must be 3-letter ISO currency code',
  })
  currency?: string;

  /**
   * Timezone for this asset's market (e.g., 'Asia/Ho_Chi_Minh', 'America/New_York').
   * Must follow IANA timezone format.
   */
  @ApiPropertyOptional({
    description: 'Timezone for this asset\'s market',
    example: 'Asia/Ho_Chi_Minh',
    pattern: '^[A-Za-z_/]+$',
    minLength: 1,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Matches(/^[A-Za-z_/]+$/, {
    message: 'Timezone must follow IANA timezone format',
  })
  timezone?: string;

  /**
   * Whether this asset is active and available for trading.
   */
  @ApiPropertyOptional({
    description: 'Whether this asset is active and available for trading',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /**
   * Optional description of the asset.
   */
  @ApiPropertyOptional({
    description: 'Asset description',
    example: 'Leading steel manufacturer in Vietnam',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  /**
   * Price mode for the global asset (AUTOMATIC or MANUAL).
   * AUTOMATIC: Auto-sync from market data
   * MANUAL: Manual price entry only
   */
  @ApiPropertyOptional({
    description: 'Price mode for the global asset',
    enum: PriceMode,
    example: PriceMode.AUTOMATIC,
  })
  @IsOptional()
  @IsEnum(PriceMode, {
    message: 'Price mode must be one of: AUTOMATIC, MANUAL',
  })
  priceMode?: PriceMode;
}
