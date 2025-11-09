import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({ 
    required: false, 
    default: 1, 
    minimum: 1,
    description: 'Page number (1-based)'
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    required: false, 
    default: 10, 
    minimum: 1, 
    maximum: 100,
    description: 'Number of items per page'
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items' })
  data: T[];

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}
