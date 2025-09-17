import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TradeSide, TradeType, TradeSource } from '../entities/trade.entity';

/**
 * Data Transfer Object for trade response data.
 * Contains all trade information returned by API endpoints.
 */
export class TradeResponseDto {
  @ApiProperty({
    description: 'Unique trade identifier',
    example: 'c3caca2c-a542-460b-81bd-2e0d4a7ba366',
    format: 'uuid',
  })
  tradeId: string;

  @ApiProperty({
    description: 'Portfolio ID where the trade belongs',
    example: 'fe4690dc-42b3-4a34-a665-89b4ca93d5a1',
    format: 'uuid',
  })
  portfolioId: string;

  @ApiProperty({
    description: 'Asset ID being traded',
    example: 'b1c9a597-9cd4-476d-8f4c-a33191e8abe4',
    format: 'uuid',
  })
  assetId: string;

  @ApiProperty({
    description: 'Asset symbol for display purposes',
    example: 'HPG',
  })
  assetSymbol?: string;

  @ApiProperty({
    description: 'Asset name for display purposes',
    example: 'Hoa Phat Group',
  })
  assetName?: string;

  @ApiProperty({
    description: 'Trade execution date',
    example: '2024-01-15T09:30:00.000Z',
    format: 'date-time',
  })
  tradeDate: Date;

  @ApiProperty({
    description: 'Trade side (BUY or SELL)',
    enum: TradeSide,
    example: TradeSide.BUY,
  })
  side: TradeSide;

  @ApiProperty({
    description: 'Quantity of assets traded',
    example: 100,
  })
  quantity: number;

  @ApiProperty({
    description: 'Price per unit of the asset',
    example: 45.50,
  })
  price: number;

  @ApiProperty({
    description: 'Total value of the trade (quantity × price)',
    example: 4550.00,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Trading fee charged for this trade',
    example: 2.50,
  })
  fee: number;

  @ApiProperty({
    description: 'Tax amount for this trade',
    example: 1.25,
  })
  tax: number;

  @ApiProperty({
    description: 'Total cost including fees and taxes',
    example: 4553.75,
  })
  totalCost: number;

  @ApiProperty({
    description: 'Type of trade execution',
    enum: TradeType,
    example: TradeType.MARKET,
  })
  tradeType: TradeType;

  @ApiProperty({
    description: 'Source of the trade (manual entry, API, etc.)',
    enum: TradeSource,
    example: TradeSource.MANUAL,
  })
  source: TradeSource;

  @ApiPropertyOptional({
    description: 'Additional notes or comments about the trade',
    example: 'Bought HPG shares during market dip',
  })
  notes?: string;

  @ApiProperty({
    description: 'Trade creation timestamp',
    example: '2024-01-15T09:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Trade last update timestamp',
    example: '2024-01-15T09:30:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Realized P&L for this trade (if matched)',
    example: 150.25,
  })
  realizedPl?: number;

  @ApiPropertyOptional({
    description: 'Number of trade details (matched trades)',
    example: 2,
  })
  tradeDetailsCount?: number;

  @ApiPropertyOptional({
    description: 'Remaining unmatched quantity (for sell trades)',
    example: 0,
  })
  remainingQuantity?: number;
}

/**
 * Data Transfer Object for trade list response with pagination.
 */
export class TradeListResponseDto {
  @ApiProperty({
    description: 'Array of trades',
    type: [TradeResponseDto],
  })
  trades: TradeResponseDto[];

  @ApiProperty({
    description: 'Total number of trades matching the query',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;
}

/**
 * Data Transfer Object for trade summary statistics.
 */
export class TradeSummaryDto {
  @ApiProperty({
    description: 'Total number of trades',
    example: 150,
  })
  totalTrades: number;

  @ApiProperty({
    description: 'Number of buy trades',
    example: 75,
  })
  buyTrades: number;

  @ApiProperty({
    description: 'Number of sell trades',
    example: 75,
  })
  sellTrades: number;

  @ApiProperty({
    description: 'Total trading volume',
    example: 50000,
  })
  totalVolume: number;

  @ApiProperty({
    description: 'Total trading value',
    example: 2250000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Average trade price',
    example: 45.50,
  })
  averagePrice: number;

  @ApiProperty({
    description: 'Total fees paid',
    example: 1250.50,
  })
  totalFees: number;

  @ApiProperty({
    description: 'Total taxes paid',
    example: 625.25,
  })
  totalTaxes: number;
}
