import { ApiProperty } from '@nestjs/swagger';

/**
 * Summary Metrics DTO
 * Calculated metrics from analysis data
 */
export class SummaryMetricsDto {
  @ApiProperty({ description: 'Total family income', example: 240000000 })
  totalFamilyIncome: number;

  @ApiProperty({ description: 'Total business income', example: 120000000 })
  totalBusinessIncome: number;

  @ApiProperty({ description: 'Total other income', example: 60000000 })
  totalOtherIncome: number;

  @ApiProperty({ description: 'Total living expenses', example: 60000000 })
  totalLivingExpenses: number;

  @ApiProperty({ description: 'Total education expenses', example: 24000000 })
  totalEducationExpenses: number;

  @ApiProperty({ description: 'Total insurance expenses', example: 12000000 })
  totalInsuranceExpenses: number;

  @ApiProperty({ description: 'Total other expenses', example: 24000000 })
  totalOtherExpenses: number;

  @ApiProperty({ description: 'Total consumer assets', example: 500000000 })
  totalConsumerAssets: number;

  @ApiProperty({ description: 'Total business assets', example: 1000000000 })
  totalBusinessAssets: number;

  @ApiProperty({ description: 'Total financial assets', example: 2000000000 })
  totalFinancialAssets: number;

  @ApiProperty({ description: 'Total real estate assets', example: 5000000000 })
  totalRealEstateAssets: number;

  @ApiProperty({ description: 'Total assets', example: 8500000000 })
  totalAssets: number;

  @ApiProperty({ description: 'Total protection layer assets', example: 1000000000 })
  totalProtectionLayer: number;

  @ApiProperty({ description: 'Total income generation layer assets', example: 2000000000 })
  totalIncomeGenerationLayer: number;

  @ApiProperty({ description: 'Total growth layer assets', example: 3000000000 })
  totalGrowthLayer: number;

  @ApiProperty({ description: 'Total risk layer assets', example: 2500000000 })
  totalRiskLayer: number;

  @ApiProperty({ description: 'Current emergency fund', example: 60000000 })
  emergencyFund: number;

  @ApiProperty({ description: 'Recommended emergency fund (6 months expenses)', example: 72000000 })
  emergencyFundRecommended: number;

  @ApiProperty({ description: 'Total debt', example: 2000000000 })
  totalDebt: number;

  @ApiProperty({ description: 'Debt to asset ratio (percentage)', example: 23.5 })
  debtToAssetRatio: number;

  @ApiProperty({ description: 'Net worth', example: 6500000000 })
  netWorth: number;
}

