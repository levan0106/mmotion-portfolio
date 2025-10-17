import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { SnapshotTracking, SnapshotTrackingStatus, SnapshotTrackingType } from '../entities/snapshot-tracking.entity';

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
}
