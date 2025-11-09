import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, IsUUID, Min, Max, IsPositive, IsArray } from 'class-validator';
import { GoalStatus } from '../entities';

export class CreateGoalDto {
  @IsArray()
  @IsUUID('4', { each: true })
  portfolioIds: string[];

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  targetValue?: number;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: number;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  autoTrack?: boolean;
}
