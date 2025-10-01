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
  DEPOSIT_CREATION = 'DEPOSIT_CREATION',
  DEPOSIT_SETTLEMENT = 'DEPOSIT_SETTLEMENT'
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
   * Description of the cash flow (optional).
   */
  @ApiProperty({
    description: 'Description of the cash flow (optional)',
    example: 'Initial deposit to portfolio',
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  description?: string;

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

  /**
   * Funding source (optional).
   */
  @ApiProperty({
    description: 'Funding source used for this cash flow',
    example: 'VIETCOMBANK',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase().trim() : value)
  fundingSource?: string;
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

  @ApiProperty({ description: 'Funding source', required: false })
  fundingSource?: string;

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

/**
 * DTO for transferring cash between funding sources.
 */
export class TransferCashDto {
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
   * Source funding source to transfer from.
   */
  @ApiProperty({
    description: 'Source funding source to transfer from',
    example: 'VIETCOMBANK',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase().trim() : value)
  fromSource: string;

  /**
   * Destination funding source to transfer to.
   */
  @ApiProperty({
    description: 'Destination funding source to transfer to',
    example: 'BIDV',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase().trim() : value)
  toSource: string;

  /**
   * Transfer amount.
   */
  @ApiProperty({
    description: 'Transfer amount',
    example: 1000000,
    minimum: 0.01,
    maximum: 1000000000000,
  })
  @IsNumber()
  @Min(0.01)
  @Max(1000000000000)
  amount: number;

  /**
   * Description of the transfer (optional).
   */
  @ApiProperty({
    description: 'Description of the transfer (optional)',
    example: 'Transfer from Vietcombank to BIDV for better interest rates',
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  description?: string;

  /**
   * Transfer date (optional, defaults to now).
   */
  @ApiProperty({
    description: 'Transfer date (optional, defaults to now)',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  transferDate?: string;
}