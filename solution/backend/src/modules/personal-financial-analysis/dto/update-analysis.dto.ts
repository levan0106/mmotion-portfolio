import { PartialType } from '@nestjs/mapped-types';
import { CreateAnalysisDto } from './create-analysis.dto';
import { IsEnum, IsOptional, IsArray, ValidateNested, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AnalysisStatus } from '../entities/personal-financial-analysis.entity';
import { ScenarioDto } from './scenario.dto';

/**
 * Update Analysis DTO
 * Extends CreateAnalysisDto with all fields optional
 */
export class UpdateAnalysisDto extends PartialType(CreateAnalysisDto) {
  @ApiPropertyOptional({ description: 'Analysis status', enum: AnalysisStatus })
  @IsOptional()
  @IsEnum(AnalysisStatus)
  status?: AnalysisStatus;

  @ApiPropertyOptional({ description: 'Notes about the analysis', example: 'This analysis shows...' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Scenarios array', type: [ScenarioDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScenarioDto)
  scenarios?: ScenarioDto[];
}

