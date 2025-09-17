import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for position summary response.
 * Contains position information and calculated metrics.
 */
export class PositionResponseDto {
  @ApiProperty({
    description: 'Asset ID',
    example: 'b1c9a597-9cd4-476d-8f4c-a33191e8abe4',
    format: 'uuid',
  })
  assetId: string;

  @ApiProperty({
    description: 'Asset symbol',
    example: 'HPG',
  })
  assetSymbol: string;

  @ApiProperty({
    description: 'Asset name',
    example: 'Hoa Phat Group',
  })
  assetName: string;

  @ApiProperty({
    description: 'Current quantity held',
    example: 1000,
  })
  quantity: number;

  @ApiProperty({
    description: 'Average cost per unit',
    example: 25000,
  })
  avgCost: number;

  @ApiProperty({
    description: 'Current market price',
    example: 26000,
  })
  marketPrice: number;

  @ApiProperty({
    description: 'Current market value',
    example: 26000000,
  })
  marketValue: number;

  @ApiProperty({
    description: 'Unrealized profit/loss',
    example: 1000000,
  })
  unrealizedPl: number;

  @ApiProperty({
    description: 'Unrealized profit/loss percentage',
    example: 4.0,
  })
  unrealizedPlPercentage: number;

  @ApiProperty({
    description: 'Realized profit/loss',
    example: 500000,
  })
  realizedPl: number;

  @ApiProperty({
    description: 'Total profit/loss (realized + unrealized)',
    example: 1500000,
  })
  totalPl: number;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2024-01-15T09:30:00.000Z',
  })
  lastUpdated: Date;
}