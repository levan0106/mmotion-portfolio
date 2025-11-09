import { IsString, IsNotEmpty, IsOptional, Length, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new portfolio.
 */
export class CreatePortfolioDto {
  /**
   * Name of the portfolio.
   */
  @ApiProperty({
    description: 'Name of the portfolio',
    example: 'Tech Growth Portfolio',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name: string;

  /**
   * Base currency for the portfolio (e.g., 'VND', 'USD').
   */
  @ApiProperty({
    description: 'Base currency for the portfolio (ISO 4217 currency code)',
    example: 'USD',
    enum: ['VND', 'USD', 'EUR', 'GBP', 'JPY'],
    minLength: 3,
    maxLength: 3,
  })
  @IsString()
  @Length(3, 3)
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : value)
  baseCurrency: string;

  /**
   * Funding source for the portfolio (free text input, optional).
   */
  @ApiProperty({
    description: 'Funding source for the portfolio (free text input, optional)',
    example: 'Personal Savings',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  fundingSource?: string;

  /**
   * ID of the account that owns this portfolio.
   */
  @ApiProperty({
    description: 'ID of the account that owns this portfolio (UUID format)',
    example: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    format: 'uuid',
  })
  @IsUUID()
  accountId: string;

  /**
   * Optional description of the portfolio.
   */
  @ApiProperty({
    description: 'Optional description of the portfolio',
    example: 'Portfolio focused on technology stocks with growth potential',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  description?: string;

  /**
   * Initial cash balance for the portfolio (optional, defaults to 0).
   */
  @ApiProperty({
    description: 'Initial cash balance for the portfolio (optional, defaults to 0)',
    example: 1000000,
    required: false,
    minimum: 0,
    maximum: 1000000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000000)
  cashBalance?: number;

  /**
   * Portfolio visibility setting (PRIVATE or PUBLIC).
   */
  @ApiProperty({
    description: 'Portfolio visibility setting',
    example: 'PRIVATE',
    enum: ['PRIVATE', 'PUBLIC'],
    required: false,
  })
  @IsOptional()
  @IsString()
  visibility?: 'PRIVATE' | 'PUBLIC';

  /**
   * Template name for public portfolios.
   */
  @ApiProperty({
    description: 'Template name for public portfolios',
    example: 'Tech Growth Template',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  templateName?: string;
}
