import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, Length, Matches, IsNotEmpty } from 'class-validator';
import { AssetType } from '../enums/asset-type.enum';

/**
 * DTO for creating a new global asset.
 * 
 * CR-005 Global Assets System:
 * - Multi-national asset support
 * - Nation-specific validation
 * - Symbol format validation
 * - Market code and currency validation
 */
export class CreateGlobalAssetDto {
  /**
   * Asset symbol for trading (e.g., 'HPG', 'VCB', 'GOLD').
   * Must be uppercase alphanumeric with dashes allowed.
   */
  @ApiProperty({
    description: 'Asset symbol for trading - must be uppercase alphanumeric with dashes',
    example: 'HPG',
    pattern: '^[A-Z0-9-]+$',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Symbol must contain only uppercase letters, numbers, and dashes',
  })
  symbol: string;

  /**
   * Name of the asset (e.g., 'Hoa Phat Group', 'Vietcombank').
   */
  @ApiProperty({
    description: 'Name of the asset',
    example: 'Hoa Phat Group',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  /**
   * Type of the asset (STOCK, BOND, GOLD, DEPOSIT, CASH).
   */
  @ApiProperty({
    description: 'Type of the asset',
    enum: AssetType,
    example: AssetType.STOCK,
  })
  @IsEnum(AssetType, {
    message: 'Type must be one of: STOCK, BOND, GOLD, COMMODITY, DEPOSIT, CASH',
  })
  type: AssetType;

  /**
   * Nation code where this asset is traded (e.g., 'VN', 'US', 'UK').
   * Must be 2-letter ISO country code.
   */
  @ApiProperty({
    description: 'Nation code where this asset is traded',
    example: 'VN',
    pattern: '^[A-Z]{2}$',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, {
    message: 'Nation code must be 2-letter ISO country code',
  })
  nation: string;

  /**
   * Market code where this asset is traded (e.g., 'HOSE', 'NYSE', 'LSE').
   * Must be uppercase alphanumeric with dashes allowed.
   */
  @ApiProperty({
    description: 'Market code where this asset is traded',
    example: 'HOSE',
    pattern: '^[A-Z0-9-]+$',
    minLength: 1,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Market code must contain only uppercase letters, numbers, and dashes',
  })
  marketCode: string;

  /**
   * Currency used for this asset (e.g., 'VND', 'USD', 'EUR').
   * Must be 3-letter ISO currency code.
   */
  @ApiProperty({
    description: 'Currency used for this asset',
    example: 'VND',
    pattern: '^[A-Z]{3}$',
    minLength: 3,
    maxLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency code must be 3-letter ISO currency code',
  })
  currency: string;

  /**
   * Timezone for this asset's market (e.g., 'Asia/Ho_Chi_Minh', 'America/New_York').
   * Must follow IANA timezone format.
   */
  @ApiProperty({
    description: 'Timezone for this asset\'s market',
    example: 'Asia/Ho_Chi_Minh',
    pattern: '^[A-Za-z_/]+$',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(/^[A-Za-z_/]+$/, {
    message: 'Timezone must follow IANA timezone format',
  })
  timezone: string;

  /**
   * Whether this asset is active and available for trading.
   */
  @ApiPropertyOptional({
    description: 'Whether this asset is active and available for trading',
    example: true,
    default: true,
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
}
