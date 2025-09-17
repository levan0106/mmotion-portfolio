import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { AssetType } from '../enums/asset-type.enum';

/**
 * Update Asset DTO
 * Data Transfer Object for updating existing assets
 * 
 * CR-003 Changes:
 * - Symbol field is read-only after creation (not included in update)
 * - Code field is deprecated and not included in update
 * - Only name, type, description can be updated
 */
export class UpdateAssetDto {
  @ApiPropertyOptional({
    description: 'Asset name',
    example: 'Apple Inc. Stock',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Asset name must be a string' })
  @MaxLength(255, { message: 'Asset name cannot exceed 255 characters' })
  name?: string;

  // Note: Symbol field is read-only after creation to maintain data integrity
  // Symbol cannot be updated once the asset has trades
  // Code field is deprecated and not included in update DTO

  @ApiPropertyOptional({
    description: 'Asset type',
    enum: AssetType,
    example: AssetType.STOCK,
  })
  @IsOptional()
  @IsEnum(AssetType, { message: 'Asset type must be a valid enum value' })
  type?: AssetType;

  @ApiPropertyOptional({
    description: 'Asset description',
    example: 'Technology company stock',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Asset description must be a string' })
  @MaxLength(1000, { message: 'Asset description cannot exceed 1000 characters' })
  description?: string;

  // Note: initialValue, initialQuantity, currentValue, currentQuantity are computed fields
  // and are calculated automatically from trades. They should not be included in update DTOs.

  @ApiPropertyOptional({
    description: 'User ID who last updated this asset',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsString({ message: 'Updated by must be a string' })
  updatedBy: string;
}
