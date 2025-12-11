import { ApiProperty } from '@nestjs/swagger';
import { AssetType } from '../../asset/enums/asset-type.enum';

export class AllocationDeviationDto {
  @ApiProperty({ description: 'Asset type', enum: AssetType, example: AssetType.STOCK })
  assetType: AssetType;

  @ApiProperty({ description: 'Current allocation percentage', example: 45.5 })
  currentAllocation: number;

  @ApiProperty({ description: 'Suggested allocation percentage', example: 65.0 })
  suggestedAllocation: number;

  @ApiProperty({ description: 'Deviation (current - suggested)', example: -19.5 })
  deviation: number;

  @ApiProperty({ description: 'Absolute deviation for sorting', example: 19.5 })
  absoluteDeviation: number;
}

export class AllocationComparisonResponseDto {
  @ApiProperty({ description: 'Plan ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  planId: string;

  @ApiProperty({ description: 'Current allocation from linked portfolios', type: 'object', additionalProperties: { type: 'number' } })
  currentAllocation: Record<string, number>;

  @ApiProperty({ description: 'Suggested allocation from plan (using code strings as stored)', type: 'object', additionalProperties: { type: 'number' } })
  suggestedAllocation: Record<string, number>;

  @ApiProperty({ description: 'Allocation deviations', type: [AllocationDeviationDto] })
  deviations: AllocationDeviationDto[];

  @ApiProperty({ description: 'Whether rebalancing is needed (any deviation > 5%)', example: true })
  needsRebalancing: boolean;

  @ApiProperty({ description: 'Number of asset types with significant deviation (>5%)', example: 2 })
  significantDeviationsCount: number;

  @ApiProperty({ description: 'Rebalancing recommendations', type: [String], example: ['Increase STOCK allocation by 19.5%', 'Decrease BOND allocation by 10.2%'] })
  recommendations: string[];
}

