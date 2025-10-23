import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { MetricType } from '../entities';

export class CreateGoalMetricDto {
  @IsString()
  metricName: string;

  @IsEnum(MetricType)
  metricType: MetricType;

  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @IsOptional()
  @IsNumber()
  currentValue?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  warningThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  criticalThreshold?: number;

  @IsOptional()
  @IsBoolean()
  isPositive?: boolean;
}

export class UpdateGoalMetricDto {
  @IsOptional()
  @IsString()
  metricName?: string;

  @IsOptional()
  @IsEnum(MetricType)
  metricType?: MetricType;

  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @IsOptional()
  @IsNumber()
  currentValue?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  warningThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  criticalThreshold?: number;

  @IsOptional()
  @IsBoolean()
  isPositive?: boolean;
}
