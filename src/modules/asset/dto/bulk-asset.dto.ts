import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min, IsNotEmpty, IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType } from '../enums/asset-type.enum';

export class BulkAssetItemDto {
  @ApiProperty({ 
    description: 'Asset symbol (e.g., HPG, VCB)',
    example: 'HPG'
  })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ 
    description: 'Asset name (optional)',
    example: 'Hoa Phat Group',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    description: 'Asset type (STOCK, BOND, GOLD, CRYPTO, COMMODITY or Stock, Bond, Gold, etc.)',
    example: 'Stock'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    // Convert to uppercase for enum validation
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return value;
  })
  @IsEnum(AssetType)
  assetType: string;

  @ApiProperty({ 
    description: 'Current price',
    example: 25000
  })
  @IsNumber()
  @Min(0.01, { message: 'Price must be greater than 0' })
  price: number;

  @ApiProperty({ 
    description: 'Nation code (VN, US, UK, JP, SG)',
    example: 'VN'
  })
  @IsString()
  @IsNotEmpty()
  nation: string;

  @ApiProperty({ 
    description: 'Currency code',
    example: 'VND'
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiPropertyOptional({ 
    description: 'Custom creation date (ISO string, MM/DD/YYYY, or DD/MM/YYYY format). If null, uses current date',
    example: '08/24/2025'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value) return value;
    
    // Handle MM/DD/YYYY or DD/MM/YYYY format
    if (typeof value === 'string' && value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) {
        // Assume MM/DD/YYYY format
        const [month, day, year] = parts;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toISOString();
      }
    }
    
    return value;
  })
  @Matches(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?|\d{2}\/\d{2}\/\d{4})$/, {
    message: 'Date must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) or MM/DD/YYYY format'
  })
  createdAt?: string;
}

export class BulkCreateAssetsDto {
  @ApiProperty({ 
    description: 'List of assets to create/update',
    type: [BulkAssetItemDto],
    minItems: 1,
    maxItems: 100
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one asset is required' })
  @ArrayMaxSize(100, { message: 'Maximum 100 assets allowed per request' })
  @ValidateNested({ each: true })
  @Type(() => BulkAssetItemDto)
  assets: BulkAssetItemDto[];
}

export class BulkAssetResultDto {
  @ApiProperty({ 
    description: 'Number of assets successfully created',
    example: 5
  })
  created: number;

  @ApiProperty({ 
    description: 'Number of assets successfully updated',
    example: 3
  })
  updated: number;

  @ApiProperty({ 
    description: 'Number of assets that failed',
    example: 1
  })
  failed: number;

  @ApiProperty({ 
    description: 'List of errors for failed assets',
    type: [String]
  })
  errors: string[];

  @ApiProperty({ 
    description: 'Total number of assets processed',
    example: 9
  })
  total: number;
}

export class BulkAssetErrorDto {
  @ApiProperty({ 
    description: 'Asset symbol that failed',
    example: 'INVALID'
  })
  symbol: string;

  @ApiProperty({ 
    description: 'Error message',
    example: 'Invalid asset type'
  })
  error: string;
}
