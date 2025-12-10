import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max } from 'class-validator';

// Asset allocation item with code, allocation, and expectedReturn
export class AssetAllocationItemDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  allocation: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  expectedReturn: number;
}

// Dynamic asset allocation - array of asset allocation items
// Supports any asset type with code, allocation, and expectedReturn
export type AssetAllocationDto = AssetAllocationItemDto[];

