import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { 
  MigrationDataAnalysisDto, 
  MigrationResultDto, 
  RollbackResultDto 
} from '../dto/migration-data-analysis.dto';

/**
 * Asset Migration Service
 * Handles migration from code field to symbol field for data consistency
 */
@Injectable()
export class AssetMigrationService {
  private readonly logger = new Logger(AssetMigrationService.name);

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {}

  /**
   * Analyze current data distribution to understand migration scope
   * @returns Data analysis result
   */
  async analyzeDataDistribution(): Promise<MigrationDataAnalysisDto> {
    this.logger.log('Starting data analysis for asset migration');

    try {
      const totalAssets = await this.assetRepository.count();
      
      const assetsWithCodeOnly = await this.assetRepository
        .createQueryBuilder('asset')
        .where('asset.code IS NOT NULL AND asset.symbol IS NULL')
        .getCount();

      const assetsWithSymbolOnly = await this.assetRepository
        .createQueryBuilder('asset')
        .where('asset.code IS NULL AND asset.symbol IS NOT NULL')
        .getCount();

      const assetsWithBothFields = await this.assetRepository
        .createQueryBuilder('asset')
        .where('asset.code IS NOT NULL AND asset.symbol IS NOT NULL')
        .getCount();

      const assetsWithNeitherField = await this.assetRepository
        .createQueryBuilder('asset')
        .where('asset.code IS NULL AND asset.symbol IS NULL')
        .getCount();

      // Check for potential conflicts (duplicate symbols per user)
      const duplicateSymbolsQuery = await this.assetRepository
        .createQueryBuilder('asset')
        .select('asset.createdBy, asset.symbol')
        .where('asset.symbol IS NOT NULL')
        .groupBy('asset.createdBy, asset.symbol')
        .having('COUNT(*) > 1')
        .getRawMany();

      const potentialConflicts = duplicateSymbolsQuery.length;

      const analysis: MigrationDataAnalysisDto = {
        totalAssets,
        assetsWithCodeOnly,
        assetsWithSymbolOnly,
        assetsWithBothFields,
        assetsWithNeitherField,
        assetsNeedingSymbolGeneration: assetsWithNeitherField,
        potentialConflicts,
      };

      this.logger.log(`Data analysis completed: ${JSON.stringify(analysis)}`);
      return analysis;

    } catch (error) {
      this.logger.error('Failed to analyze data distribution', error);
      throw new BadRequestException('Failed to analyze data distribution');
    }
  }

  /**
   * Migrate code values to symbol field
   * @returns Migration result
   */
  async migrateCodeToSymbol(): Promise<MigrationResultDto> {
    this.logger.log('Starting migration from code to symbol field');

    const errors: string[] = [];
    let migratedCount = 0;
    let generatedSymbolsCount = 0;
    let conflictsResolved = 0;

    try {
      // Step 1: Migrate assets with code field only
      const assetsWithCodeOnly = await this.assetRepository
        .createQueryBuilder('asset')
        .where('asset.code IS NOT NULL AND asset.symbol IS NULL')
        .getMany();

      for (const asset of assetsWithCodeOnly) {
        try {
          await this.assetRepository.update(asset.id, {
            symbol: asset.code,
          });
          migratedCount++;
          this.logger.debug(`Migrated asset ${asset.id}: ${asset.code} -> ${asset.symbol}`);
        } catch (error) {
          const errorMsg = `Asset ID ${asset.id}: Failed to migrate code to symbol - ${error.message}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      // Step 2: Generate symbols for assets without either field
      const assetsNeedingSymbols = await this.assetRepository
        .createQueryBuilder('asset')
        .where('asset.code IS NULL AND asset.symbol IS NULL')
        .getMany();

      for (const asset of assetsNeedingSymbols) {
        try {
          const generatedSymbol = this.generateSymbolFromName(asset.name, asset.createdBy);
          await this.assetRepository.update(asset.id, {
            symbol: generatedSymbol,
          });
          generatedSymbolsCount++;
          this.logger.debug(`Generated symbol for asset ${asset.id}: ${generatedSymbol}`);
        } catch (error) {
          const errorMsg = `Asset ID ${asset.id}: Failed to generate symbol - ${error.message}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      // Step 3: Resolve conflicts (duplicate symbols per user)
      const duplicateSymbols = await this.findDuplicateSymbols();
      for (const conflict of duplicateSymbols) {
        try {
          await this.resolveSymbolConflict(conflict.userId, conflict.symbol);
          conflictsResolved++;
        } catch (error) {
          const errorMsg = `Failed to resolve symbol conflict for user ${conflict.userId}, symbol ${conflict.symbol} - ${error.message}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      const result: MigrationResultDto = {
        migratedCount,
        failedCount: errors.length,
        generatedSymbolsCount,
        conflictsResolved,
        completedAt: new Date(),
        errors,
      };

      this.logger.log(`Migration completed: ${JSON.stringify(result)}`);
      return result;

    } catch (error) {
      this.logger.error('Migration failed', error);
      throw new BadRequestException('Migration failed');
    }
  }

  /**
   * Generate symbol from asset name
   * @param name - Asset name
   * @param userId - User ID for uniqueness
   * @returns Generated symbol
   */
  private generateSymbolFromName(name: string, userId: string): string {
    // Remove special characters and spaces, convert to uppercase
    let symbol = name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .toUpperCase()
      .substring(0, 10);

    // Ensure symbol is not empty
    if (!symbol) {
      symbol = 'ASSET';
    }

    // Add user ID suffix to ensure uniqueness
    const userIdSuffix = userId.substring(userId.length - 4).toUpperCase();
    symbol = `${symbol}_${userIdSuffix}`;

    return symbol;
  }

  /**
   * Find duplicate symbols per user
   * @returns List of duplicate symbol conflicts
   */
  private async findDuplicateSymbols(): Promise<Array<{ userId: string; symbol: string }>> {
    const duplicates = await this.assetRepository
      .createQueryBuilder('asset')
      .select('asset.createdBy as userId, asset.symbol as symbol')
      .where('asset.symbol IS NOT NULL')
      .groupBy('asset.createdBy, asset.symbol')
      .having('COUNT(*) > 1')
      .getRawMany();

    return duplicates;
  }

  /**
   * Resolve symbol conflict by adding numeric suffix
   * @param userId - User ID
   * @param symbol - Conflicting symbol
   */
  private async resolveSymbolConflict(userId: string, symbol: string): Promise<void> {
    const conflictingAssets = await this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.createdBy = :userId AND asset.symbol = :symbol', { userId, symbol })
      .orderBy('asset.createdAt', 'ASC')
      .getMany();

    // Keep the first asset with original symbol, add suffix to others
    for (let i = 1; i < conflictingAssets.length; i++) {
      const asset = conflictingAssets[i];
      const newSymbol = `${symbol}_${i}`;
      
      await this.assetRepository.update(asset.id, {
        symbol: newSymbol,
      });
      
      this.logger.debug(`Resolved conflict for asset ${asset.id}: ${symbol} -> ${newSymbol}`);
    }
  }

  /**
   * Validate migration success
   * @returns Validation result
   */
  async validateMigration(): Promise<{ isValid: boolean; issues: string[] }> {
    this.logger.log('Validating migration results');

    const issues: string[] = [];

    try {
      // Check if all assets now have symbol field
      const assetsWithoutSymbol = await this.assetRepository
        .createQueryBuilder('asset')
        .where('asset.symbol IS NULL')
        .getCount();

      if (assetsWithoutSymbol > 0) {
        issues.push(`${assetsWithoutSymbol} assets still missing symbol field`);
      }

      // Check for remaining duplicate symbols
      const duplicateSymbols = await this.findDuplicateSymbols();
      if (duplicateSymbols.length > 0) {
        issues.push(`${duplicateSymbols.length} duplicate symbol conflicts remain`);
      }

      // Check if code field is still being used
      const assetsWithCode = await this.assetRepository
        .createQueryBuilder('asset')
        .where('asset.code IS NOT NULL')
        .getCount();

      if (assetsWithCode > 0) {
        issues.push(`${assetsWithCode} assets still have code field (migration incomplete)`);
      }

      const isValid = issues.length === 0;
      
      this.logger.log(`Migration validation completed. Valid: ${isValid}, Issues: ${issues.length}`);
      
      return { isValid, issues };

    } catch (error) {
      this.logger.error('Migration validation failed', error);
      throw new BadRequestException('Migration validation failed');
    }
  }

  /**
   * Basic rollback - restore code field from symbol
   * @returns Rollback result
   */
  async rollbackMigration(): Promise<RollbackResultDto> {
    this.logger.log('Starting migration rollback');

    const errors: string[] = [];
    let rolledBackCount = 0;

    try {
      // Find assets that were migrated (have symbol but no code)
      const migratedAssets = await this.assetRepository
        .createQueryBuilder('asset')
        .where('asset.symbol IS NOT NULL AND asset.code IS NULL')
        .getMany();

      for (const asset of migratedAssets) {
        try {
          await this.assetRepository.update(asset.id, {
            code: asset.symbol,
          });
          rolledBackCount++;
          this.logger.debug(`Rolled back asset ${asset.id}: ${asset.symbol} -> code`);
        } catch (error) {
          const errorMsg = `Asset ID ${asset.id}: Failed to rollback - ${error.message}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      const result: RollbackResultDto = {
        rolledBackCount,
        failedCount: errors.length,
        completedAt: new Date(),
        errors,
      };

      this.logger.log(`Rollback completed: ${JSON.stringify(result)}`);
      return result;

    } catch (error) {
      this.logger.error('Rollback failed', error);
      throw new BadRequestException('Rollback failed');
    }
  }
}
