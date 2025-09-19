import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum CashFlowType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  DIVIDEND = 'DIVIDEND',
  INTEREST = 'INTEREST',
  BUY_TRADE = 'BUY_TRADE',
  SELL_TRADE = 'SELL_TRADE',
  OTHER = 'OTHER',
}

/**
 * DTO for creating a manual cash flow.
 */
export class CreateCashFlowDto {
  /**
   * Portfolio ID.
   */
  @ApiProperty({
    description: 'Portfolio ID',
    example: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  portfolioId: string;

  /**
   * Cash flow amount (positive for inflow, negative for outflow).
   */
  @ApiProperty({
    description: 'Cash flow amount (positive for inflow, negative for outflow)',
    example: 1000000,
    minimum: -1000000000000,
    maximum: 1000000000000,
  })
  @IsNumber()
  @Min(-1000000000000)
  @Max(1000000000000)
  amount: number;

  /**
   * Cash flow type.
   */
  @ApiProperty({
    description: 'Cash flow type',
    example: 'DEPOSIT',
    enum: CashFlowType,
  })
  @IsEnum(CashFlowType)
  type: CashFlowType;

  /**
   * Description of the cash flow.
   */
  @ApiProperty({
    description: 'Description of the cash flow',
    example: 'Initial deposit to portfolio',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  description: string;

  /**
   * Flow date (optional, defaults to now).
   */
  @ApiProperty({
    description: 'Flow date (optional, defaults to now)',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  flowDate?: string;

  /**
   * Currency code (optional, defaults to VND).
   */
  @ApiProperty({
    description: 'Currency code (optional, defaults to VND)',
    example: 'VND',
    required: false,
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : value)
  currency?: string;

  /**
   * Status (optional, defaults to COMPLETED).
   */
  @ApiProperty({
    description: 'Status (optional, defaults to COMPLETED)',
    example: 'COMPLETED',
    required: false,
    enum: ['COMPLETED', 'PENDING', 'CANCELLED'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  /**
   * Reference (optional).
   */
  @ApiProperty({
    description: 'Reference (optional)',
    example: 'REF123',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  reference?: string;

  /**
   * Effective date (optional).
   */
  @ApiProperty({
    description: 'Effective date (optional)',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}

/**
 * DTO for updating cash balance directly.
 */
export class UpdateCashBalanceDto {
  /**
   * New cash balance amount.
   */
  @ApiProperty({
    description: 'New cash balance amount',
    example: 5000000,
    minimum: 0,
    maximum: 1000000000,
  })
  @IsNumber()
  @Min(0)
  @Max(1000000000)
  cashBalance: number;

  /**
   * Reason for the update.
   */
  @ApiProperty({
    description: 'Reason for the cash balance update',
    example: 'Manual adjustment for initial funding',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  reason: string;
}

/**
 * DTO for cash flow response.
 */
export class CashFlowResponseDto {
  @ApiProperty({ description: 'Cash flow ID' })
  cashflowId: string;

  @ApiProperty({ description: 'Portfolio ID' })
  portfolioId: string;

  @ApiProperty({ description: 'Flow date' })
  flowDate: Date;

  @ApiProperty({ description: 'Amount' })
  amount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Type' })
  type: string;

  @ApiProperty({ description: 'Description' })
  description: string;

  @ApiProperty({ description: 'Status' })
  status: string;

  @ApiProperty({ description: 'Reference', required: false })
  reference?: string;

  @ApiProperty({ description: 'Effective date', required: false })
  effectiveDate?: Date;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

/**
 * DTO for cash balance update result.
 */
export class CashBalanceUpdateResultDto {
  @ApiProperty({ description: 'Portfolio ID' })
  portfolioId: string;

  @ApiProperty({ description: 'Old cash balance' })
  oldCashBalance: number;

  @ApiProperty({ description: 'New cash balance' })
  newCashBalance: number;

  @ApiProperty({ description: 'Cash flow amount' })
  cashFlowAmount: number;

  @ApiProperty({ description: 'Cash flow type' })
  cashFlowType: string;
}
