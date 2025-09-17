import { ApiProperty } from '@nestjs/swagger';

/**
 * Data analysis result for asset migration
 */
export class MigrationDataAnalysisDto {
  @ApiProperty({
    description: 'Total number of assets in database',
    example: 150,
  })
  totalAssets: number;

  @ApiProperty({
    description: 'Number of assets with code field only',
    example: 45,
  })
  assetsWithCodeOnly: number;

  @ApiProperty({
    description: 'Number of assets with symbol field only',
    example: 30,
  })
  assetsWithSymbolOnly: number;

  @ApiProperty({
    description: 'Number of assets with both code and symbol fields',
    example: 25,
  })
  assetsWithBothFields: number;

  @ApiProperty({
    description: 'Number of assets with neither code nor symbol fields',
    example: 50,
  })
  assetsWithNeitherField: number;

  @ApiProperty({
    description: 'Number of assets that need symbol generation',
    example: 50,
  })
  assetsNeedingSymbolGeneration: number;

  @ApiProperty({
    description: 'Number of potential conflicts (duplicate symbols per user)',
    example: 5,
  })
  potentialConflicts: number;
}

/**
 * Migration result for asset migration
 */
export class MigrationResultDto {
  @ApiProperty({
    description: 'Number of assets successfully migrated',
    example: 145,
  })
  migratedCount: number;

  @ApiProperty({
    description: 'Number of assets that failed migration',
    example: 5,
  })
  failedCount: number;

  @ApiProperty({
    description: 'Number of symbols generated from names',
    example: 50,
  })
  generatedSymbolsCount: number;

  @ApiProperty({
    description: 'Number of conflicts resolved',
    example: 3,
  })
  conflictsResolved: number;

  @ApiProperty({
    description: 'Migration completion timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  completedAt: Date;

  @ApiProperty({
    description: 'List of errors encountered during migration',
    example: ['Asset ID xyz: Symbol conflict with existing asset'],
  })
  errors: string[];
}

/**
 * Rollback result for asset migration
 */
export class RollbackResultDto {
  @ApiProperty({
    description: 'Number of assets successfully rolled back',
    example: 145,
  })
  rolledBackCount: number;

  @ApiProperty({
    description: 'Number of assets that failed rollback',
    example: 0,
  })
  failedCount: number;

  @ApiProperty({
    description: 'Rollback completion timestamp',
    example: '2024-01-15T10:35:00.000Z',
  })
  completedAt: Date;

  @ApiProperty({
    description: 'List of errors encountered during rollback',
    example: [],
  })
  errors: string[];
}
