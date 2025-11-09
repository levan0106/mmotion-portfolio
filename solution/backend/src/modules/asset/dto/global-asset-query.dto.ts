import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean, IsArray, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AssetType } from '../enums/asset-type.enum';
import { PriceMode } from '../enums/price-mode.enum';

/**
 * DTO for querying global assets with filtering, pagination, and sorting.
 * 
 * CR-005 Global Assets System:
 * - Multi-national filtering
 * - Asset type filtering
 * - Market code filtering
 * - Active status filtering
 * - Pagination and sorting support
 */
export class GlobalAssetQueryDto {
  /**
   * Search term for symbol or name.
   */
  @ApiPropertyOptional({
    description: 'Search term for symbol or name',
    example: 'HPG',
  })
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Filter by nation code.
   */
  @ApiPropertyOptional({
    description: 'Filter by nation code',
    example: 'VN',
  })
  @IsOptional()
  @IsString()
  nation?: string;

  /**
   * Filter by asset type.
   */
  @ApiPropertyOptional({
    description: 'Filter by asset type',
    enum: AssetType,
    example: AssetType.STOCK,
  })
  @IsOptional()
  @IsEnum(AssetType)
  type?: AssetType;

  /**
   * Filter by price mode.
   */
  @ApiPropertyOptional({
    description: 'Filter by price mode',
    enum: PriceMode,
    example: PriceMode.AUTOMATIC,
  })
  @IsOptional()
  @IsEnum(PriceMode)
  priceMode?: PriceMode;

  /**
   * Filter by market code.
   */
  @ApiPropertyOptional({
    description: 'Filter by market code',
    example: 'HOSE',
  })
  @IsOptional()
  @IsString()
  marketCode?: string;

  /**
   * Filter by currency.
   */
  @ApiPropertyOptional({
    description: 'Filter by currency',
    example: 'VND',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  /**
   * Filter by active status.
   */
  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  /**
   * Filter by multiple nation codes.
   */
  @ApiPropertyOptional({
    description: 'Filter by multiple nation codes',
    example: ['VN', 'US'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  nations?: string[];

  /**
   * Filter by multiple asset types.
   */
  @ApiPropertyOptional({
    description: 'Filter by multiple asset types',
    example: [AssetType.STOCK, AssetType.BOND],
    enum: AssetType,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AssetType, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  types?: AssetType[];

  /**
   * Filter by multiple market codes.
   */
  @ApiPropertyOptional({
    description: 'Filter by multiple market codes',
    example: ['HOSE', 'HNX'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  marketCodes?: string[];

  /**
   * Filter by multiple currencies.
   */
  @ApiPropertyOptional({
    description: 'Filter by multiple currencies',
    example: ['VND', 'USD'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  currencies?: string[];

  /**
   * Sort field.
   */
  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'symbol',
    enum: ['symbol', 'name', 'type', 'nation', 'marketCode', 'currency', 'isActive', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'symbol' | 'name' | 'type' | 'nation' | 'marketCode' | 'currency' | 'isActive' | 'createdAt' | 'updatedAt';

  /**
   * Sort order.
   */
  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'ASC',
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
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;

  /**
   * Include inactive assets in results.
   */
  @ApiPropertyOptional({
    description: 'Include inactive assets in results',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  includeInactive?: boolean;

  /**
   * Include assets with trades only.
   */
  @ApiPropertyOptional({
    description: 'Include assets with trades only',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  hasTradesOnly?: boolean;
}
