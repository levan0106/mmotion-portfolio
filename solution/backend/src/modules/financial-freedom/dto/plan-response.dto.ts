import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentFrequency, PaymentType, RiskTolerance, PlanStatus } from '../entities/financial-freedom-plan.entity';
import { AssetAllocationItemDto, AssetAllocationDto } from './asset-allocation.dto';

export class PlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  accountId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  startDate?: Date;

  // Step 1: Goals & Investment Info
  @ApiPropertyOptional()
  targetMethod?: 'direct' | 'fromExpenses';

  @ApiProperty()
  targetPresentValue: number;

  @ApiProperty()
  futureValueRequired: number;

  @ApiPropertyOptional()
  monthlyExpenses?: number;

  @ApiPropertyOptional()
  withdrawalRate?: number;

  @ApiPropertyOptional()
  initialInvestment?: number;

  @ApiPropertyOptional()
  periodicPayment?: number;

  @ApiProperty({ enum: PaymentFrequency })
  paymentFrequency: PaymentFrequency;

  @ApiProperty({ enum: PaymentType })
  paymentType: PaymentType;

  @ApiPropertyOptional()
  investmentYears?: number;

  @ApiPropertyOptional()
  requiredReturnRate?: number;

  @ApiProperty()
  inflationRate: number;

  @ApiProperty({ enum: RiskTolerance })
  riskTolerance: RiskTolerance;

  // Step 2: Asset Allocation
  @ApiPropertyOptional({ type: [AssetAllocationItemDto] })
  suggestedAllocation?: AssetAllocationDto;

  // Step 3: Consolidated Plan
  @ApiPropertyOptional()
  yearlyProjections?: any[];

  @ApiPropertyOptional()
  scenarios?: any;

  // Tracking
  @ApiProperty()
  linkedPortfolioIds: string[];

  @ApiProperty()
  linkedGoalIds: string[];

  @ApiPropertyOptional()
  currentPortfolioValue?: number;

  @ApiPropertyOptional()
  currentProgressPercentage?: number;

  @ApiPropertyOptional()
  milestones?: any[];

  // Metadata
  @ApiProperty({ enum: PlanStatus })
  status: PlanStatus;

  @ApiProperty()
  baseCurrency: string;

  @ApiPropertyOptional()
  templateId?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

