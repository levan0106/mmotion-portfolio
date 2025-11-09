import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

/**
 * DTO for requesting portfolio return calculation for multiple portfolios
 */
export class GetPortfolioReturnRequestDto {
  @ApiProperty({
    description: 'List of portfolio IDs to calculate return',
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  portfolioIds: string[];
}

/**
 * DTO for portfolio return response item
 */
export class PortfolioReturnItemDto {
  @ApiProperty({
    description: 'Portfolio ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  portfolioId: string;

  @ApiProperty({
    description: 'Portfolio name',
    example: 'Growth Portfolio',
  })
  name: string;

  @ApiProperty({
    description: 'Current total NAV (Net Asset Value)',
    example: 1500000000,
  })
  totalNav: number;

  @ApiProperty({
    description: 'Daily return percentage (compared to latest snapshot)',
    example: 1.5,
  })
  dailyPercent: number;

  @ApiProperty({
    description: 'Daily value change (absolute amount)',
    example: 22500000,
  })
  dailyValue: number;

  @ApiProperty({
    description: 'Snapshot NAV value used for comparison',
    example: 1477500000,
    required: false,
  })
  snapshotNav?: number;

  @ApiProperty({
    description: 'Snapshot date used for comparison',
    example: '2024-12-01T00:00:00.000Z',
    required: false,
  })
  snapshotDate?: string;
}

/**
 * DTO for portfolio return response
 */
export class GetPortfolioReturnResponseDto {
  @ApiProperty({
    description: 'List of portfolios with return data',
    type: [PortfolioReturnItemDto],
  })
  portfolios: PortfolioReturnItemDto[];

  @ApiProperty({
    description: 'Calculation timestamp',
    example: '2024-12-02T10:30:00.000Z',
  })
  calculatedAt: string;
}

