import { ApiProperty } from '@nestjs/swagger';

export class MilestoneDto {
  @ApiProperty({ description: 'Year of the milestone', example: 5 })
  year: number;

  @ApiProperty({ description: 'Description of the milestone', example: '25% of goal' })
  description: string;

  @ApiProperty({ description: 'Target value for this milestone', example: 2092500000 })
  targetValue: number;

  @ApiProperty({ description: 'Whether the milestone has been achieved', example: false })
  achieved: boolean;

  @ApiProperty({ description: 'Date when milestone was achieved', example: null, required: false })
  achievedAt?: Date;
}

export class ProgressAlertDto {
  @ApiProperty({ description: 'Type of alert', enum: ['rebalancing', 'performance', 'milestone'], example: 'performance' })
  type: 'rebalancing' | 'performance' | 'milestone';

  @ApiProperty({ description: 'Severity of the alert', enum: ['info', 'warning', 'error'], example: 'warning' })
  severity: 'info' | 'warning' | 'error';

  @ApiProperty({ description: 'Alert message', example: 'Current return rate is slightly below required rate' })
  message: string;

  @ApiProperty({ description: 'Recommended action', example: 'Consider reviewing your portfolio allocation', required: false })
  action?: string;
}

export class YearlyComparisonDto {
  @ApiProperty({ description: 'Year', example: 2024 })
  year: number;

  @ApiProperty({ description: 'Target value for this year', example: 1000000000 })
  targetValue: number;

  @ApiProperty({ description: 'Actual value achieved', example: 800000000 })
  actualValue: number;

  @ApiProperty({ description: 'Difference between actual and target', example: -200000000 })
  difference: number;
}

export class ProgressResponseDto {
  @ApiProperty({ description: 'Plan ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  planId: string;

  @ApiProperty({ description: 'Current portfolio value from linked portfolios', example: 2000000000 })
  currentValue: number;

  @ApiProperty({ description: 'Target value (futureValueRequired)', example: 8370000000 })
  targetValue: number;

  @ApiProperty({ description: 'Progress percentage (0-100)', example: 23.9 })
  progressPercentage: number;

  @ApiProperty({ description: 'Remaining amount to reach target', example: 6370000000 })
  remainingAmount: number;

  @ApiProperty({ description: 'Remaining years to reach goal', example: 12 })
  remainingYears: number;

  @ApiProperty({ description: 'Current actual return rate (TWR)', example: 11.5 })
  currentReturnRate: number;

  @ApiProperty({ description: 'Required return rate from plan', example: 12.5 })
  requiredReturnRate: number;

  @ApiProperty({ description: 'Gap between current and required return rate', example: 1.0 })
  gap: number;

  @ApiProperty({ description: 'Milestones for the plan', type: [MilestoneDto] })
  milestones: MilestoneDto[];

  @ApiProperty({ description: 'Alerts and warnings', type: [ProgressAlertDto] })
  alerts: ProgressAlertDto[];

  @ApiProperty({ description: 'Yearly comparison data', type: [YearlyComparisonDto], required: false })
  yearlyComparison?: YearlyComparisonDto[];
}

