import { ApiProperty } from '@nestjs/swagger';

/**
 * Income and Expense Breakdown DTO
 * Detailed breakdown of income, expenses, and savings
 */
export class IncomeExpenseBreakdownDto {
  @ApiProperty({ description: 'Monthly principal payment', example: 5000000 })
  monthlyPrincipalPayment: number;

  @ApiProperty({ description: 'Annual principal payment', example: 60000000 })
  annualPrincipalPayment: number;

  @ApiProperty({ description: 'Monthly interest payment', example: 5000000 })
  monthlyInterestPayment: number;

  @ApiProperty({ description: 'Annual interest payment', example: 60000000 })
  annualInterestPayment: number;

  @ApiProperty({ description: 'Monthly total debt payment', example: 10000000 })
  monthlyTotalDebtPayment: number;

  @ApiProperty({ description: 'Annual total debt payment', example: 120000000 })
  annualTotalDebtPayment: number;

  @ApiProperty({ description: 'Debt payment to income ratio (percentage)', example: 28.6 })
  debtPaymentToIncomeRatio: number;

  @ApiProperty({ description: 'Total monthly income', example: 35000000 })
  totalMonthlyIncome: number;

  @ApiProperty({ description: 'Total annual income', example: 420000000 })
  totalAnnualIncome: number;

  @ApiProperty({ description: 'Total monthly expenses', example: 20000000 })
  totalMonthlyExpenses: number;

  @ApiProperty({ description: 'Total annual expenses', example: 240000000 })
  totalAnnualExpenses: number;

  @ApiProperty({ description: 'Expense to income ratio (percentage)', example: 57.1 })
  expenseToIncomeRatio: number;

  @ApiProperty({ description: 'Remaining monthly savings', example: 5000000 })
  remainingMonthlySavings: number;

  @ApiProperty({ description: 'Remaining annual savings', example: 60000000 })
  remainingAnnualSavings: number;

  @ApiProperty({ description: 'Savings to income ratio (percentage)', example: 14.3 })
  savingsToIncomeRatio: number;
}

