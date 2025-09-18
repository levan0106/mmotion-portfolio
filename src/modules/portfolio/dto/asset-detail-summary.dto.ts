import { ApiProperty } from '@nestjs/swagger';

export class AssetDetailSummaryDto {
  @ApiProperty({ description: 'Asset symbol' })
  symbol: string;

  @ApiProperty({ description: 'Asset name' })
  name: string;

  @ApiProperty({ description: 'Asset type' })
  assetType: string;

  @ApiProperty({ description: 'Current quantity' })
  quantity: number;

  @ApiProperty({ description: 'Current price' })
  currentPrice: number;

  @ApiProperty({ description: 'Total value (quantity * currentPrice)' })
  totalValue: number;

  @ApiProperty({ description: 'Percentage of portfolio' })
  percentage: number;

  @ApiProperty({ description: 'Unrealized P&L' })
  unrealizedPl: number;

  @ApiProperty({ description: 'Unrealized P&L percentage' })
  unrealizedPlPercentage: number;
}

export class AssetDetailSummaryResponseDto {
  @ApiProperty({ description: 'Portfolio ID' })
  portfolioId: string;

  @ApiProperty({ description: 'Total portfolio value' })
  totalValue: number;

  @ApiProperty({ description: 'Asset details', type: [AssetDetailSummaryDto] })
  data: AssetDetailSummaryDto[];

  @ApiProperty({ description: 'Calculation timestamp' })
  calculatedAt: string;
}
