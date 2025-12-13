import { IsString, IsOptional, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetDto, IncomeDto, ExpenseDto, DebtDto } from './create-analysis.dto';

/**
 * Scenario DTO for analysis restructuring
 */
export class ScenarioDto {
  @ApiProperty({ description: 'Scenario ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440010' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Scenario name', example: 'Optimistic Scenario' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Scenario description', example: 'Best case scenario with increased income' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Assets array for scenario', type: [AssetDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetDto)
  assets?: AssetDto[];

  @ApiPropertyOptional({ description: 'Income array for scenario', type: [IncomeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncomeDto)
  income?: IncomeDto[];

  @ApiPropertyOptional({ description: 'Expenses array for scenario', type: [ExpenseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseDto)
  expenses?: ExpenseDto[];

  @ApiPropertyOptional({ description: 'Debts array for scenario', type: [DebtDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DebtDto)
  debts?: DebtDto[];

  @ApiProperty({ description: 'Created at timestamp', example: '2024-01-15T10:30:00.000Z' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Updated at timestamp', example: '2024-01-15T10:30:00.000Z' })
  @IsString()
  updatedAt: string;
}

/**
 * Create Scenario DTO
 */
export class CreateScenarioDto {
  @ApiProperty({ description: 'Scenario name', example: 'Optimistic Scenario' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Scenario description', example: 'Best case scenario' })
  @IsOptional()
  @IsString()
  description?: string;

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

/**
 * Update Scenario DTO
 */
export class UpdateScenarioDto {
  @ApiPropertyOptional({ description: 'Scenario name', example: 'Updated Scenario Name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Scenario description' })
  @IsOptional()
  @IsString()
  description?: string;

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

