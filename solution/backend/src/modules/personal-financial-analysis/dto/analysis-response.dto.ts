import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnalysisStatus } from '../entities/personal-financial-analysis.entity';
import { SummaryMetricsDto } from './summary-metrics.dto';
import { IncomeExpenseBreakdownDto } from './income-expense-breakdown.dto';
import { ScenarioDto } from './scenario.dto';
import { AssetDto, IncomeDto, ExpenseDto, DebtDto } from './create-analysis.dto';

/**
 * Analysis Response DTO
 * Maps all entity fields to DTO for API responses
 */
export class AnalysisResponseDto {
  @ApiProperty({ description: 'Analysis ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Account ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  accountId: string;

  @ApiPropertyOptional({ description: 'Analysis name', example: 'My Financial Analysis 2024' })
  name?: string;

  @ApiPropertyOptional({ description: 'Analysis date', example: '2024-01-15' })
  analysisDate?: Date;

  @ApiProperty({ description: 'Base currency', example: 'VND', default: 'VND' })
  baseCurrency: string;

  @ApiProperty({ description: 'Analysis status', enum: AnalysisStatus, default: AnalysisStatus.DRAFT })
  status: AnalysisStatus;

  @ApiProperty({ description: 'Whether analysis is active', default: true })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Assets array', type: [AssetDto] })
  assets?: AssetDto[];

  @ApiPropertyOptional({ description: 'Income array', type: [IncomeDto] })
  income?: IncomeDto[];

  @ApiPropertyOptional({ description: 'Expenses array', type: [ExpenseDto] })
  expenses?: ExpenseDto[];

  @ApiPropertyOptional({ description: 'Debts array', type: [DebtDto] })
  debts?: DebtDto[];

  @ApiPropertyOptional({ description: 'Summary metrics', type: SummaryMetricsDto })
  summaryMetrics?: SummaryMetricsDto;

  @ApiPropertyOptional({ description: 'Income expense breakdown', type: IncomeExpenseBreakdownDto })
  incomeExpenseBreakdown?: IncomeExpenseBreakdownDto;

  @ApiPropertyOptional({ description: 'Scenarios array', type: [ScenarioDto] })
  scenarios?: ScenarioDto[];

  @ApiProperty({ description: 'Linked portfolio IDs', type: [String], example: ['550e8400-e29b-41d4-a716-446655440002'] })
  linkedPortfolioIds: string[];

  @ApiPropertyOptional({ description: 'Linked Financial Freedom Plan ID' })
  linkedFinancialFreedomPlanId?: string;

  @ApiPropertyOptional({ description: 'Notes about the analysis' })
  notes?: string;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

