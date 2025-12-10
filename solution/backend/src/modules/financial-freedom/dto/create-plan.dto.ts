import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentFrequency, PaymentType, RiskTolerance } from '../entities/financial-freedom-plan.entity';
import { AssetAllocationItemDto, AssetAllocationDto } from './asset-allocation.dto';

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  // Step 1: Goals & Investment Info
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetMethod?: 'direct' | 'fromExpenses';

  @ApiProperty()
  @IsNumber()
  @Min(0)
  targetPresentValue: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  futureValueRequired: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyExpenses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  withdrawalRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialInvestment?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  periodicPayment?: number;

  @ApiProperty({ enum: PaymentFrequency, default: PaymentFrequency.MONTHLY })
  @IsEnum(PaymentFrequency)
  paymentFrequency: PaymentFrequency;

  @ApiProperty({ enum: PaymentType, default: PaymentType.CONTRIBUTION })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  investmentYears?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  requiredReturnRate?: number;

  @ApiProperty({ default: 4.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  inflationRate: number;

  @ApiProperty({ enum: RiskTolerance, default: RiskTolerance.MODERATE })
  @IsEnum(RiskTolerance)
  riskTolerance: RiskTolerance;

  // Step 2: Asset Allocation
  @ApiPropertyOptional({ type: [AssetAllocationItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetAllocationItemDto)
  suggestedAllocation?: AssetAllocationDto;

  // Step 3: Consolidated Plan (optional - can be calculated)
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  yearlyProjections?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  scenarios?: any;

  // Tracking
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  linkedPortfolioIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  linkedGoalIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  milestones?: any[];
}

