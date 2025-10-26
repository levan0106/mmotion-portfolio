import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsUUID, Min, MaxLength, ValidateIf, IsEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { AssetType } from '../enums/asset-type.enum';
import { PriceMode } from '../enums/price-mode.enum';

/**
 * Create Asset DTO
 * Data Transfer Object for creating new assets.
 * Assets are user-scoped and can be used across multiple portfolios.
 * 
 * CR-003 Changes:
 * - Symbol field is now required and primary identifier
 * - Symbol must be unique per user (not globally)
 * - Name can be duplicated across users
 */
export class CreateAssetDto {

  @ApiProperty({
    description: 'Asset name',
    example: 'Apple Inc. Stock',
    maxLength: 255,
  })
  @IsString({ message: 'Asset name must be a string' })
  @MaxLength(255, { message: 'Asset name cannot exceed 255 characters' })
  name: string;

  @ApiProperty({
    description: 'Asset symbol for trading - must be unique per user',
    example: 'AAPL',
    maxLength: 50,
  })
  @IsString({ message: 'Asset symbol must be a string' })
  @MaxLength(50, { message: 'Asset symbol cannot exceed 50 characters' })
  @Matches(/^[A-Z0-9-]+$/, { message: 'Asset symbol must contain only uppercase letters, numbers, and dashes' })
  symbol: string;

  @ApiPropertyOptional({
    description: 'Legacy asset code - deprecated, use symbol instead',
    example: 'AAPL',
    maxLength: 50,
    deprecated: true,
  })
  @IsOptional()
  @IsString({ message: 'Asset code must be a string' })
  @MaxLength(50, { message: 'Asset code cannot exceed 50 characters' })
  code?: string;

  @ApiProperty({
    description: 'Asset type',
    enum: AssetType,
    example: AssetType.STOCK,
  })
  @IsEnum(AssetType, { message: 'Asset type must be a valid enum value' })
  type: AssetType;

  @ApiPropertyOptional({
    description: 'Asset description',
    example: 'Technology company stock',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Asset description must be a string' })
  @MaxLength(1000, { message: 'Asset description cannot exceed 1000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Price mode for the asset (AUTOMATIC or MANUAL)',
    enum: PriceMode,
    example: PriceMode.AUTOMATIC,
  })
  @IsOptional()
  @IsEnum(PriceMode, { message: 'Price mode must be a valid enum value' })
  priceMode?: PriceMode;

  @ApiPropertyOptional({
    description: 'Manual price for the asset (required when priceMode is MANUAL)',
    example: 150000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Manual price must be a number' })
  @Min(0, { message: 'Manual price must be non-negative' })
  manualPrice?: number;

  @ApiPropertyOptional({
    description: 'Initial value of the asset',
    example: 1000000,
    minimum: 0,
  })
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsNumber({}, { message: 'Initial value must be a number' })
  @Min(0, { message: 'Initial value must be non-negative' })
  initialValue?: number;

  @ApiPropertyOptional({
    description: 'Initial quantity of the asset',
    example: 100,
    minimum: 0.0001,
  })
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsNumber({}, { message: 'Initial quantity must be a number' })
  @Min(0.0001, { message: 'Initial quantity must be positive' })
  initialQuantity?: number;

  @ApiPropertyOptional({
    description: 'Current value of the asset',
    example: 1200000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Current value must be a number' })
  @Min(0, { message: 'Current value must be non-negative' })
  currentValue?: number;

  @ApiPropertyOptional({
    description: 'Current quantity of the asset',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Current quantity must be a number' })
  @Min(0, { message: 'Current quantity must be non-negative' })
  currentQuantity?: number;

  @ApiProperty({
    description: 'User ID who created this asset',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID(4, { message: 'Created by must be a valid UUID' })
  createdBy: string;

  @ApiProperty({
    description: 'User ID who last updated this asset',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID(4, { message: 'Updated by must be a valid UUID' })
  updatedBy: string;

}
