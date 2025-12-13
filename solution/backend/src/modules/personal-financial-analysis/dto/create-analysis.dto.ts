import { IsString, IsOptional, IsDateString, IsArray, ValidateNested, MaxLength, IsEnum, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetCategory, AssetLayer, IncomeCategory, ExpenseCategory, AnalysisStatus } from '../entities/personal-financial-analysis.entity';

/**
 * Asset DTO for analysis
 */
export class AssetDto {
  @ApiProperty({ description: 'Asset ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Asset name', example: 'Savings Account' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Asset value', example: 10000000 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ description: 'Asset category', enum: AssetCategory, example: AssetCategory.FINANCIAL })
  @IsEnum(AssetCategory)
  category: AssetCategory;

  @ApiPropertyOptional({ description: 'Asset layer for pyramid', enum: AssetLayer })
  @IsOptional()
  @IsEnum(AssetLayer)
  layer?: AssetLayer;

  @ApiProperty({ description: 'Source of asset', enum: ['custom', 'portfolio'], example: 'custom' })
  @IsEnum(['custom', 'portfolio'])
  source: 'custom' | 'portfolio';

  @ApiPropertyOptional({ description: 'Portfolio ID if loaded from portfolio' })
  @IsOptional()
  @IsString()
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'Portfolio name for display' })
  @IsOptional()
  @IsString()
  portfolioName?: string;

  @ApiPropertyOptional({ description: 'Portfolio asset ID' })
  @IsOptional()
  @IsString()
  assetId?: string;

  @ApiPropertyOptional({ description: 'Asset type from portfolio' })
  @IsOptional()
  @IsString()
  assetType?: string;

  @ApiPropertyOptional({ description: 'Asset symbol from portfolio' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ description: 'Whether this asset is part of emergency fund', default: false })
  @IsOptional()
  @IsBoolean()
  isEmergencyFund?: boolean;
}

/**
 * Income DTO for analysis
 */
export class IncomeDto {
  @ApiProperty({ description: 'Income ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Income name', example: 'Salary' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Monthly income value', example: 20000000 })
  @IsNumber()
  @Min(0)
  monthlyValue: number;

  @ApiProperty({ description: 'Income category', enum: IncomeCategory, example: IncomeCategory.FAMILY })
  @IsEnum(IncomeCategory)
  category: IncomeCategory;
}

/**
 * Expense DTO for analysis
 */
export class ExpenseDto {
  @ApiProperty({ description: 'Expense ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Expense name', example: 'Rent' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Monthly expense value', example: 5000000 })
  @IsNumber()
  @Min(0)
  monthlyValue: number;

  @ApiProperty({ description: 'Expense category', enum: ExpenseCategory, example: ExpenseCategory.LIVING })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;
}

/**
 * Debt DTO for analysis
 */
export class DebtDto {
  @ApiProperty({ description: 'Debt ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440003' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Debt name', example: 'Home Loan' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Principal amount', example: 1000000000 })
  @IsNumber()
  @Min(0)
  principalAmount: number;

  @ApiProperty({ description: 'Interest rate (percentage)', example: 12 })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate: number;

  @ApiProperty({ description: 'Term in months (0 for no term limit)', example: 240 })
  @IsNumber()
  @Min(0)
  term: number;

  @ApiProperty({ description: 'Monthly payment', example: 10000000 })
  @IsNumber()
  @Min(0)
  monthlyPayment: number;

  @ApiPropertyOptional({ description: 'Remaining balance', example: 800000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingBalance?: number;
}

/**
 * Create Analysis DTO
 */
export class CreateAnalysisDto {
  @ApiPropertyOptional({ description: 'Analysis name', example: 'My Financial Analysis 2024', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Analysis date', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  analysisDate?: string;

  @ApiPropertyOptional({ description: 'Base currency', example: 'VND', default: 'VND', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  baseCurrency?: string;

  @ApiPropertyOptional({ description: 'Assets array', type: [AssetDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetDto)
  assets?: AssetDto[];

  @ApiPropertyOptional({ description: 'Income array', type: [IncomeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncomeDto)
  income?: IncomeDto[];

  @ApiPropertyOptional({ description: 'Expenses array', type: [ExpenseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseDto)
  expenses?: ExpenseDto[];

  @ApiPropertyOptional({ description: 'Debts array', type: [DebtDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DebtDto)
  debts?: DebtDto[];
}

