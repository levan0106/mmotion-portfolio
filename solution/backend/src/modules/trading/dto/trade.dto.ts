import { IsUUID, IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min, Max, IsPositive, MaxLength, IsNotIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TradeSide, TradeType, TradeSource } from '../entities/trade.entity';

/**
 * Data Transfer Object for creating a new trade.
 * Contains validation rules and API documentation for trade creation.
 */
export class CreateTradeDto {
  @ApiProperty({
    description: 'Portfolio ID where the trade belongs',
    example: 'fe4690dc-42b3-4a34-a665-89b4ca93d5a1',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'Portfolio ID must be a valid UUID' })
  portfolioId: string;

  @ApiProperty({
    description: 'Asset ID being traded',
    example: 'b1c9a597-9cd4-476d-8f4c-a33191e8abe4',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'Asset ID must be a valid UUID' })
  assetId: string;

  @ApiProperty({
    description: 'Trade execution date',
    example: '2024-01-15T09:30:00.000Z',
    format: 'date-time',
  })
  @IsDateString({}, { message: 'Trade date must be a valid date' })
  tradeDate: string;

  @ApiProperty({
    description: 'Trade side (BUY or SELL)',
    enum: TradeSide,
    example: TradeSide.BUY,
  })
  @IsEnum(TradeSide, { message: 'Trade side must be either BUY or SELL' })
  side: TradeSide;

  @ApiProperty({
    description: 'Quantity of assets traded',
    example: 1000,
    minimum: 0.00000001,
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be positive' })
  @Min(0.00000001, { message: 'Quantity must be at least 0.00000001' })
  quantity: number;

  @ApiProperty({
    description: 'Price per unit',
    example: 25000,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be non-negative' })
  price: number;

  @ApiPropertyOptional({
    description: 'Trading fee',
    example: 2500,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Fee must be a number' })
  @Min(0, { message: 'Fee must be non-negative' })
  fee?: number = 0;

  @ApiPropertyOptional({
    description: 'Tax amount',
    example: 500,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Tax must be a number' })
  @Min(0, { message: 'Tax must be non-negative' })
  tax?: number = 0;

  @ApiPropertyOptional({
    description: 'Trade type',
    enum: TradeType,
    example: TradeType.MARKET,
    default: TradeType.MARKET,
  })
  @IsOptional()
  @IsEnum(TradeType, { message: 'Trade type must be a valid enum value' })
  tradeType?: TradeType = TradeType.MARKET;

  @ApiPropertyOptional({
    description: 'Trade source',
    enum: TradeSource,
    example: TradeSource.MANUAL,
    default: TradeSource.MANUAL,
  })
  @IsOptional()
  @IsEnum(TradeSource, { message: 'Trade source must be a valid enum value' })
  source?: TradeSource = TradeSource.MANUAL;

  @ApiPropertyOptional({
    description: 'Exchange/platform where trade was executed',
    example: 'VNDIRECT',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Exchange must be a string' })
  @MaxLength(100, { message: 'Exchange must not exceed 100 characters' })
  exchange?: string;

  @ApiPropertyOptional({
    description: 'Funding source used for this trade',
    example: 'VIETCOMBANK',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Funding source must be a string' })
  @MaxLength(100, { message: 'Funding source must not exceed 100 characters' })
  fundingSource?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the trade',
    example: 'testing note',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes must not exceed 1000 characters' })
  notes?: string;
}

/**
 * Data Transfer Object for updating an existing trade.
 * Contains validation rules and API documentation for trade updates.
 */
export class UpdateTradeDto {
  @ApiPropertyOptional({
    description: 'Portfolio ID where the trade belongs',
    example: 'fe4690dc-42b3-4a34-a665-89b4ca93d5a1',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4, { message: 'Portfolio ID must be a valid UUID' })
  portfolioId?: string;

  @ApiPropertyOptional({
    description: 'Asset ID being traded',
    example: 'b1c9a597-9cd4-476d-8f4c-a33191e8abe4',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4, { message: 'Asset ID must be a valid UUID' })
  assetId?: string;

  @ApiPropertyOptional({
    description: 'Trade execution date',
    example: '2024-01-15T09:30:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Trade date must be a valid date' })
  tradeDate?: string;

  @ApiPropertyOptional({
    description: 'Trade side (BUY or SELL)',
    enum: TradeSide,
    example: TradeSide.BUY,
  })
  @IsOptional()
  @IsEnum(TradeSide, { message: 'Trade side must be either BUY or SELL' })
  side?: TradeSide;

  @ApiPropertyOptional({
    description: 'Quantity of assets traded',
    example: 1000,
    minimum: 0.00000001,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be positive' })
  @Min(0.00000001, { message: 'Quantity must be at least 0.00000001' })
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Price per unit',
    example: 25000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be non-negative' })
  price?: number;

  @ApiPropertyOptional({
    description: 'Trading fee',
    example: 2500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Fee must be a number' })
  @Min(0, { message: 'Fee must be non-negative' })
  fee?: number;

  @ApiPropertyOptional({
    description: 'Tax amount',
    example: 500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Tax must be a number' })
  @Min(0, { message: 'Tax must be non-negative' })
  tax?: number;

  @ApiPropertyOptional({
    description: 'Trade type',
    enum: TradeType,
    example: TradeType.MARKET,
  })
  @IsOptional()
  @IsEnum(TradeType, { message: 'Trade type must be a valid enum value' })
  tradeType?: TradeType;

  @ApiPropertyOptional({
    description: 'Trade source',
    enum: TradeSource,
    example: TradeSource.MANUAL,
  })
  @IsOptional()
  @IsEnum(TradeSource, { message: 'Trade source must be a valid enum value' })
  source?: TradeSource;

  @ApiPropertyOptional({
    description: 'Exchange/platform where trade was executed',
    example: 'VNDIRECT',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Exchange must be a string' })
  @MaxLength(100, { message: 'Exchange must not exceed 100 characters' })
  exchange?: string;

  @ApiPropertyOptional({
    description: 'Funding source used for this trade',
    example: 'VIETCOMBANK',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Funding source must be a string' })
  @MaxLength(100, { message: 'Funding source must not exceed 100 characters' })
  fundingSource?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the trade',
    example: 'testing note',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes must not exceed 1000 characters' })
  notes?: string;
}
