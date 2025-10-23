import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { SnapshotTracking, SnapshotTrackingStatus, SnapshotTrackingType } from '../entities/snapshot-tracking.entity';
import { SnapshotService } from './snapshot.service';
import { PerformanceSnapshotService } from './performance-snapshot.service';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { randomUUID } from 'crypto';

export interface CreateTrackingData {
  executionId: string;
  portfolioId?: string;
  portfolioName?: string;
  type: SnapshotTrackingType;
  totalPortfolios?: number;
  createdBy?: string;
  cronExpression?: string;
  timezone?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTrackingData {
  status?: SnapshotTrackingStatus;
  totalSnapshots?: number;
  successfulSnapshots?: number;
  failedSnapshots?: number;
  totalPortfolios?: number;
  executionTimeMs?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface TrackingStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  totalSnapshots: number;
  successRate: number;
}

export interface TrackingFilters {
  status?: SnapshotTrackingStatus;
  type?: SnapshotTrackingType;
  portfolioId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class SnapshotTrackingService {
  private readonly logger = new Logger(SnapshotTrackingService.name);

  constructor(
    @InjectRepository(SnapshotTracking)
    private readonly trackingRepository: Repository<SnapshotTracking>,
    private readonly snapshotService: SnapshotService,
    private readonly performanceSnapshotService: PerformanceSnapshotService,
  ) {}

  /**
   * Create a new tracking record
   */
  async createTracking(data: CreateTrackingData): Promise<SnapshotTracking> {
    const tracking = this.trackingRepository.create({
      ...data,
      startedAt: new Date(),
      status: SnapshotTrackingStatus.STARTED,
    });

    const saved = await this.trackingRepository.save(tracking);
    this.logger.log(`Created tracking record for execution ${data.executionId}`);
    return saved;
  }

  /**
   * Update tracking record
   */
  async updateTracking(
    executionId: string,
    data: UpdateTrackingData
  ): Promise<SnapshotTracking | null> {
    const tracking = await this.trackingRepository
      .createQueryBuilder('tracking')
      .where('tracking.execution_id = :executionId', { executionId })
      .getOne();

    if (!tracking) {
      this.logger.warn(`Tracking record not found for execution ${executionId}`);
      return null;
    }

    // Update fields
    Object.assign(tracking, data);

    // Set completedAt if status is completed or failed
    if (data.status === SnapshotTrackingStatus.COMPLETED || 
        data.status === SnapshotTrackingStatus.FAILED) {
      tracking.completedAt = new Date();
    }

    const updated = await this.trackingRepository.save(tracking);
    this.logger.log(`Updated tracking record for execution ${executionId}`);
    return updated;
  }

  /**
   * Get tracking records with filters
   */
  async getTrackingRecords(filters: TrackingFilters = {}): Promise<{
    records: SnapshotTracking[];
    total: number;
  }> {
    const queryBuilder = this.trackingRepository.createQueryBuilder('tracking');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('tracking.status = :status', { status: filters.status });
    }

    if (filters.type) {
      queryBuilder.andWhere('tracking.type = :type', { type: filters.type });
    }

    if (filters.portfolioId) {
      queryBuilder.andWhere('tracking.portfolioId = :portfolioId', { 
        portfolioId: filters.portfolioId 
      });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('tracking.created_at BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    } else if (filters.startDate) {
      queryBuilder.andWhere('tracking.created_at >= :startDate', {
        startDate: filters.startDate,
      });
    } else if (filters.endDate) {
      queryBuilder.andWhere('tracking.created_at <= :endDate', {
        endDate: filters.endDate,
      });
    }

    // Order by created date (newest first)
    queryBuilder.orderBy('tracking.created_at', 'DESC');

    // Apply pagination
    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    const [records, total] = await queryBuilder.getManyAndCount();
    
    return { records, total };
  }

  /**
   * Get tracking record by execution ID
   */
  async getTrackingByExecutionId(executionId: string): Promise<SnapshotTracking | null> {
    return this.trackingRepository
      .createQueryBuilder('tracking')
      .where('tracking.execution_id = :executionId', { executionId })
      .getOne();
  }

  /**
   * Get tracking statistics
   */
  async getTrackingStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<TrackingStats> {
    const queryBuilder = this.trackingRepository.createQueryBuilder('tracking');

    if (startDate && endDate) {
      queryBuilder.andWhere('tracking.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const records = await queryBuilder.getMany();

    const totalExecutions = records.length;
    const successfulExecutions = records.filter(
      r => r.status === SnapshotTrackingStatus.COMPLETED
    ).length;
    const failedExecutions = records.filter(
      r => r.status === SnapshotTrackingStatus.FAILED
    ).length;

    const totalSnapshots = records.reduce((sum, r) => sum + r.totalSnapshots, 0);
    const averageExecutionTime = records.length > 0 
      ? records.reduce((sum, r) => sum + r.executionTimeMs, 0) / records.length 
      : 0;

    const successRate = totalExecutions > 0 
      ? (successfulExecutions / totalExecutions) * 100 
      : 0;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime,
      totalSnapshots,
      successRate,
    };
  }

  /**
   * Get recent tracking records
   */
  async getRecentTracking(limit: number = 10): Promise<SnapshotTracking[]> {
    return this.trackingRepository
      .createQueryBuilder('tracking')
      .orderBy('tracking.created_at', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get tracking records by portfolio
   */
  async getTrackingByPortfolio(
    portfolioId: string,
    limit: number = 20
  ): Promise<SnapshotTracking[]> {
    return this.trackingRepository
      .createQueryBuilder('tracking')
      .where('tracking.portfolio_id = :portfolioId', { portfolioId })
      .orderBy('tracking.created_at', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get failed tracking records
   */
  async getFailedTracking(limit: number = 20): Promise<SnapshotTracking[]> {
    return this.trackingRepository
      .createQueryBuilder('tracking')
      .where('tracking.status = :status', { status: SnapshotTrackingStatus.FAILED })
      .orderBy('tracking.created_at', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Clean up old tracking records
   */
  async cleanupOldRecords(daysToKeep: number = 30): Promise<number> {
    let result;
    
    if (daysToKeep === 0) {
      // Delete all records
      this.logger.log('Deleting all tracking records');
      result = await this.trackingRepository
        .createQueryBuilder()
        .delete()
        .execute();
    } else {
      // Delete records older than specified days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      this.logger.log(`Deleting records older than ${daysToKeep} days (before ${cutoffDate.toISOString()})`);
      result = await this.trackingRepository
        .createQueryBuilder()
        .delete()
        .where('created_at < :cutoffDate', { cutoffDate })
        .execute();
    }

    const deletedCount = result.affected || 0;
    this.logger.log(`Cleaned up ${deletedCount} tracking records`);
    return deletedCount;
  }

  /**
   * Get execution summary for a specific execution ID
   */
  async getExecutionSummary(executionId: string): Promise<{
    execution: SnapshotTracking | null;
    portfolioRecords: SnapshotTracking[];
  }> {
    const execution = await this.getTrackingByExecutionId(executionId);
    
    if (!execution) {
      return { execution: null, portfolioRecords: [] };
    }

    // Get all records for this execution (including individual portfolio records)
    const portfolioRecords = await this.trackingRepository
      .createQueryBuilder('tracking')
      .where('tracking.execution_id = :executionId', { executionId })
      .orderBy('tracking.created_at', 'ASC')
      .getMany();

    return { execution, portfolioRecords };
  }

  /**
   * Centralized method to create snapshots with tracking
   * This method should be used by all services that need to create snapshots
   */
  async createSnapshotsWithTracking(
    portfolioId: string,
    portfolioName: string,
    snapshotDate: Date | string,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY,
    executionId?: string,
    createdBy?: string,
    includePerformance: boolean = true,
    trackingType: SnapshotTrackingType = SnapshotTrackingType.MANUAL
  ): Promise<{
    success: boolean;
    assetSnapshots: any[];
    performanceSnapshots?: any;
    trackingId: string;
    error?: string;
  }> {

    let createdParentTrackingRecord = false;
    if (executionId) {
      // check if executionId is already in the database
      let trackingRecord = await this.getTrackingByExecutionId(executionId);
      if (!trackingRecord) {
        // create parent tracking record
        trackingRecord = await this.createTracking({
          executionId: executionId,
          portfolioId: undefined,
          portfolioName: undefined,
          type: trackingType,
          metadata: {
            triggeredBy: createdBy || 'centralized-service',
            includePerformance,
            granularity,
          },
        });
        createdParentTrackingRecord = true;
        this.logger.log(`createSnapshotsWithTracking: ✅ Created parent tracking record for executionId ${executionId}`);
      } else {
        this.logger.log(`createSnapshotsWithTracking: ✅ Parent tracking record already exists for executionId ${executionId}`);
      }
    }

    const trackingId = randomUUID(); // create a new tracking id
    const date = typeof snapshotDate === 'string' ? new Date(snapshotDate) : snapshotDate;
    
    this.logger.log(`createSnapshotsWithTracking: 📸 Creating snapshots for portfolio ${portfolioName} (${portfolioId}) with tracking ${trackingId} and executionId ${executionId}`);

    // Create tracking record
    let trackingRecord = null;
    try {
      trackingRecord = await this.createTracking({
        executionId: trackingId,
        portfolioId,
        portfolioName: portfolioName + ' - ' + date.toISOString().split('T')[0], // add date to portfolio name
        type: trackingType,
        metadata: {
          parentExecutionId: executionId ? executionId : randomUUID(),
          triggeredBy: createdBy || 'centralized-service',
          includePerformance,
          granularity,
        },
      });
    } catch (trackingError) {
      this.logger.error('createSnapshotsWithTracking: Failed to create tracking record:', trackingError);
    }

    try {
      // Create asset allocation snapshots with timeout protection
      const assetSnapshots = await Promise.race([
        this.snapshotService.createPortfolioSnapshot(
          portfolioId,
          date,
          granularity,
          createdBy || 'centralized-service'
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Asset snapshot creation timeout')), 30000)
        )
      ]) as any[];

      this.logger.log(`createSnapshotsWithTracking: ✅ Created ${assetSnapshots.length} asset snapshots for portfolio ${portfolioName}`);

      let performanceSnapshots = null;
      
      // Create performance snapshots if requested and asset snapshots were created
      if (includePerformance && assetSnapshots.length > 0) {
        try {
          performanceSnapshots = await Promise.race([
            this.performanceSnapshotService.createPerformanceSnapshots(
              portfolioId,
              date,
              granularity,
              createdBy || 'centralized-service'
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Performance snapshot creation timeout')), 30000)
            )
          ]);

          this.logger.log(`createSnapshotsWithTracking: ✅ Created performance snapshots for portfolio ${portfolioName} with tracking ${trackingId} and executionId ${executionId}`);
        } catch (performanceError) {
          this.logger.error(`createSnapshotsWithTracking: ⚠️ Asset snapshots created but performance snapshots failed for portfolio ${portfolioName}:`, performanceError);
          
          // Update tracking with partial success
          if (trackingRecord) {
            await this.updateTracking(trackingId, {
              status: SnapshotTrackingStatus.COMPLETED,
              totalSnapshots: assetSnapshots.length,
              successfulSnapshots: assetSnapshots.length,
              failedSnapshots: 0,
              metadata: {
                ...trackingRecord.metadata,
                performanceSnapshotError: performanceError.message,
              },
            });
          }
        }
      }

      // Update tracking with success
      if (trackingRecord) {
        await this.updateTracking(trackingId, {
          status: SnapshotTrackingStatus.COMPLETED,
          totalSnapshots: assetSnapshots.length,
          successfulSnapshots: assetSnapshots.length,
          failedSnapshots: 0,
        });
      }

      // Update parent tracking record with success
      if (createdParentTrackingRecord) {
        await this.updateTracking(executionId, {
          status: SnapshotTrackingStatus.COMPLETED,
          totalSnapshots: trackingRecord.totalSnapshots + assetSnapshots.length,
          successfulSnapshots: trackingRecord.successfulSnapshots + assetSnapshots.length,
          failedSnapshots: trackingRecord.failedSnapshots
        });
      }

      return {
        success: true,
        assetSnapshots,
        performanceSnapshots,
        trackingId,
      };

    } catch (error) {
      this.logger.error(`createSnapshotsWithTracking: ❌ Failed to create snapshots for portfolio ${portfolioName}:`, error);
      
      // Update tracking with error
      if (trackingRecord) {
        await this.updateTracking(trackingId, {
          status: SnapshotTrackingStatus.FAILED,
          errorMessage: error.message,
        });
      }

      return {
        success: false,
        assetSnapshots: [],
        trackingId,
        error: error.message,
      };
    }
  }

  /**
   * Create snapshots for multiple portfolios with centralized tracking
   */
  async createSnapshotsForMultiplePortfolios(
    portfolios: Array<{ portfolioId: string; portfolioName: string }>,
    snapshotDate: Date | string,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY,
    createdBy?: string,
    includePerformance: boolean = true,
    maxConcurrent: number = 2,
    trackingType: SnapshotTrackingType = SnapshotTrackingType.MANUAL
  ): Promise<{
    success: boolean;
    results: Array<{
      portfolioId: string;
      portfolioName: string;
      success: boolean;
      assetSnapshots: any[];
      performanceSnapshots?: any;
      trackingId: string;
      error?: string;
    }>;
    totalProcessed: number;
    totalSuccessful: number;
    totalFailed: number;
  }> {
    const results = [];
    let totalSuccessful = 0;
    let totalFailed = 0;

    this.logger.log(`createSnapshotsForMultiplePortfolios: 📸 Creating snapshots for ${portfolios.length} portfolios with max concurrent: ${maxConcurrent}`);

    // Process portfolios in batches to avoid overwhelming the system
    for (let i = 0; i < portfolios.length; i += maxConcurrent) {
      const batch = portfolios.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (portfolio) => {
        const result = await this.createSnapshotsWithTracking(
          portfolio.portfolioId,
          portfolio.portfolioName,
          snapshotDate,
          granularity,
          undefined, // Let it generate its own tracking ID
          createdBy,
          includePerformance,
          trackingType
        );

        if (result.success) {
          totalSuccessful++;
        } else {
          totalFailed++;
        }

        return {
          portfolioId: portfolio.portfolioId,
          portfolioName: portfolio.portfolioName,
          success: result.success,
          assetSnapshots: result.assetSnapshots,
          performanceSnapshots: result.performanceSnapshots,
          trackingId: result.trackingId,
          error: result.error,
        };
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          totalFailed++;
          results.push({
            portfolioId: 'unknown',
            portfolioName: 'unknown',
            success: false,
            assetSnapshots: [],
            trackingId: `error-${Date.now()}`,
            error: result.reason?.message || 'Unknown error',
          });
        }
      });

      // Add delay between batches to prevent overwhelming the system
      if (i + maxConcurrent < portfolios.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      success: totalFailed === 0,
      results,
      totalProcessed: portfolios.length,
      totalSuccessful,
      totalFailed,
    };
  }

  /**
   * Debug method to check tracking records for a specific portfolio
   */
  async debugPortfolioTracking(portfolioId: string, limit: number = 10): Promise<{
    portfolioId: string;
    totalRecords: number;
    recentRecords: SnapshotTracking[];
    summary: {
      automated: number;
      manual: number;
      completed: number;
      failed: number;
      inProgress: number;
    };
  }> {
    const records = await this.trackingRepository
      .createQueryBuilder('tracking')
      .where('tracking.portfolio_id = :portfolioId', { portfolioId })
      .orderBy('tracking.created_at', 'DESC')
      .limit(limit)
      .getMany();

    const allRecords = await this.trackingRepository
      .createQueryBuilder('tracking')
      .where('tracking.portfolio_id = :portfolioId', { portfolioId })
      .getMany();

    const summary = {
      automated: allRecords.filter(r => r.type === SnapshotTrackingType.AUTOMATED).length,
      manual: allRecords.filter(r => r.type === SnapshotTrackingType.MANUAL).length,
      completed: allRecords.filter(r => r.status === SnapshotTrackingStatus.COMPLETED).length,
      failed: allRecords.filter(r => r.status === SnapshotTrackingStatus.FAILED).length,
      inProgress: allRecords.filter(r => r.status === SnapshotTrackingStatus.IN_PROGRESS).length,
    };

    return {
      portfolioId,
      totalRecords: allRecords.length,
      recentRecords: records,
      summary,
    };
  }
}
