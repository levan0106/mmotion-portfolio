import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { AssetType, RiskLevel, RebalanceFrequency } from '../entities';

export class CreateGoalAssetAllocationDto {
  @IsEnum(AssetType)
  assetType: AssetType;

  @IsNumber()
  @Min(0)
  @Max(100)
  targetPercentage: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercentage?: number;

  @IsOptional()
  @IsNumber()
  expectedReturn?: number;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsNumber()
  volatility?: number;

  @IsOptional()
  @IsEnum(RebalanceFrequency)
  rebalanceFrequency?: RebalanceFrequency;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  autoRebalance?: boolean;
}

export class UpdateGoalAssetAllocationDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  targetPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercentage?: number;

  @IsOptional()
  @IsNumber()
  expectedReturn?: number;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsNumber()
  volatility?: number;

  @IsOptional()
  @IsEnum(RebalanceFrequency)
  rebalanceFrequency?: RebalanceFrequency;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  autoRebalance?: boolean;
}
