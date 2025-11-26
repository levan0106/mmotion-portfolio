import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GlobalAssetTracking, GlobalAssetSyncStatus, GlobalAssetSyncType, GlobalAssetSyncSource } from '../entities/global-asset-tracking.entity';
import { ApiCallDetailService } from './api-call-detail.service';
import { TrackingAlertData } from './tracking-alert.service';
import { TrackingFailureEvent, CriticalTrackingFailureEvent } from '../listeners/tracking-alert.listener';

export interface GlobalAssetTrackingQuery {
  status?: GlobalAssetSyncStatus;
  type?: GlobalAssetSyncType;
  source?: GlobalAssetSyncSource;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'startedAt' | 'completedAt' | 'executionTimeMs' | 'successRate';
  sortOrder?: 'ASC' | 'DESC';
}

export interface GlobalAssetTrackingStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  averageSuccessRate: number;
  lastExecutionTime: Date | null;
  successRateTrend: Array<{
    date: string;
    successRate: number;
  }>;
  errorFrequency: Array<{
    errorCode: string;
    count: number;
  }>;
}

/**
 * Service for managing global asset tracking data
 * Provides comprehensive tracking and monitoring of global asset sync operations
 */
@Injectable()
export class GlobalAssetTrackingService {
  private readonly logger = new Logger(GlobalAssetTrackingService.name);

  constructor(
    @InjectRepository(GlobalAssetTracking)
    private readonly globalAssetTrackingRepository: Repository<GlobalAssetTracking>,
    private readonly apiCallDetailService: ApiCallDetailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new tracking record for global asset sync operation
   */
  async createTracking(
    executionId: string,
    type: GlobalAssetSyncType,
    source: GlobalAssetSyncSource,
    triggeredBy?: string,
    triggerIp?: string,
    metadata?: Record<string, any>,
  ): Promise<GlobalAssetTracking> {
    const tracking = this.globalAssetTrackingRepository.create({
      executionId,
      type,
      source,
      status: GlobalAssetSyncStatus.STARTED,
      startedAt: new Date(),
      triggeredBy,
      triggerIp,
      metadata,
      autoSyncEnabled: true, // This should be passed from config
    });

    const saved = await this.globalAssetTrackingRepository.save(tracking);
    this.logger.log(`[GlobalAssetTrackingService] Created tracking record: ${executionId}`);
    return saved;
  }

  /**
   * Update tracking record with progress information
   */
  async updateProgress(
    executionId: string,
    status: GlobalAssetSyncStatus,
    totalSymbols?: number,
    successfulUpdates?: number,
    failedUpdates?: number,
    totalApis?: number,
    successfulApis?: number,
    failedApis?: number,
    failedSymbols?: string[],
  ): Promise<GlobalAssetTracking> {
    const tracking = await this.globalAssetTrackingRepository.findOne({
      where: { executionId },
    });

    if (!tracking) {
      throw new Error(`Tracking record not found for execution ID: ${executionId}`);
    }

    // Update fields
    tracking.status = status;
    if (totalSymbols !== undefined) tracking.totalSymbols = totalSymbols;
    if (successfulUpdates !== undefined) tracking.successfulUpdates = successfulUpdates;
    if (failedUpdates !== undefined) tracking.failedUpdates = failedUpdates;
    if (totalApis !== undefined) tracking.totalApis = totalApis;
    if (successfulApis !== undefined) tracking.successfulApis = successfulApis;
    if (failedApis !== undefined) tracking.failedApis = failedApis;
    if (failedSymbols !== undefined) tracking.failedSymbols = failedSymbols;

    // Calculate success rate: must consider BOTH API success AND asset update success
    // Success Rate = 0% if any API failed (cannot have 100% success with failed APIs)
    // Otherwise, Success Rate = (successfulUpdates / totalSymbols) * 100
    if (tracking.totalApis > 0 && tracking.successfulApis < tracking.totalApis) {
      // If any API failed, success rate cannot be 100%
      // Calculate as weighted average: (API success rate * 0.5) + (Asset update rate * 0.5)
      const apiSuccessRate = (tracking.successfulApis / tracking.totalApis) * 100;
      const assetUpdateRate = tracking.totalSymbols > 0 
        ? (tracking.successfulUpdates / tracking.totalSymbols) * 100 
        : 0;
      tracking.successRate = (apiSuccessRate * 0.5) + (assetUpdateRate * 0.5);
      this.logger.debug(
        `[GlobalAssetTrackingService] Success rate calculated with API failures: ` +
        `API: ${apiSuccessRate.toFixed(2)}%, Assets: ${assetUpdateRate.toFixed(2)}%, ` +
        `Final: ${tracking.successRate.toFixed(2)}%`
      );
    } else if (tracking.totalSymbols > 0) {
      // All APIs successful, calculate based on asset updates only
      tracking.successRate = (tracking.successfulUpdates / tracking.totalSymbols) * 100;
    } else {
      tracking.successRate = 0;
    }

    // Update status based on success rate: only 100% success rate is considered completed
    if (status === GlobalAssetSyncStatus.COMPLETED) {
      if (tracking.successRate < 100) {
        tracking.status = GlobalAssetSyncStatus.FAILED;
        this.logger.warn(`[GlobalAssetTrackingService] Execution ${executionId} marked as FAILED due to success rate ${tracking.successRate.toFixed(2)}% < 100%`);
      }
    }

    // Update completion time if status is completed or failed
    if (status === GlobalAssetSyncStatus.COMPLETED || status === GlobalAssetSyncStatus.FAILED) {
      tracking.completedAt = new Date();
      tracking.executionTimeMs = tracking.calculateExecutionTime();
    }

    // Send alert to admin for tracking failure
    if (status === GlobalAssetSyncStatus.FAILED) {
      await this.sendTrackingFailureAlert(tracking, {
        executionId: tracking.executionId,
        status: tracking.status,
        errorMessage: tracking.errorMessage,
        errorCode: tracking.errorCode,
        failedSymbolsCount: tracking.failedSymbols?.length || 0,
        totalSymbols: tracking.totalSymbols,
        successRate: tracking.successRate ? tracking.successRate / 100 : 0,
        executionTime: tracking.executionTimeMs,
        triggeredBy: tracking.source,
        metadata: {
          stackTrace: tracking.stackTrace,
          type: tracking.type,
        },
      });
    }

    const updated = await this.globalAssetTrackingRepository.save(tracking);
    this.logger.log(`[GlobalAssetTrackingService] Updated tracking record: ${executionId} - Status: ${status}`);
    return updated;
  }

  /**
   * Update tracking record with error information
   */
  async updateError(
    executionId: string,
    errorMessage: string,
    errorCode?: string,
    stackTrace?: string,
  ): Promise<GlobalAssetTracking> {
    const tracking = await this.globalAssetTrackingRepository.findOne({
      where: { executionId },
    });

    if (!tracking) {
      throw new Error(`Tracking record not found for execution ID: ${executionId}`);
    }

    tracking.status = GlobalAssetSyncStatus.FAILED;
    tracking.completedAt = new Date();
    tracking.executionTimeMs = tracking.calculateExecutionTime();
    tracking.errorMessage = errorMessage;
    tracking.errorCode = errorCode;
    tracking.stackTrace = stackTrace;

    const updated = await this.globalAssetTrackingRepository.save(tracking);
    this.logger.error(`[GlobalAssetTrackingService] Updated tracking record with error: ${executionId} - ${errorMessage}`);
    
    // Send alert to admin for tracking failure
    await this.sendTrackingFailureAlert(updated, {
      executionId: updated.executionId,
      status: updated.status,
      errorMessage: updated.errorMessage,
      errorCode: updated.errorCode,
      failedSymbolsCount: updated.failedSymbols?.length || 0,
      totalSymbols: updated.totalSymbols,
      successRate: updated.successRate ? updated.successRate / 100 : 0,
      executionTime: updated.executionTimeMs,
      triggeredBy: updated.source,
      metadata: {
        stackTrace: updated.stackTrace,
        type: updated.type,
      },
    });
    
    return updated;
  }

  /**
   * Get tracking record by execution ID
   */
  async getByExecutionId(executionId: string): Promise<GlobalAssetTracking | null> {
    const record = await this.globalAssetTrackingRepository.findOne({
      where: { executionId },
    });

    if (!record) {
      return null;
    }

    // Convert successRate from string to number
    return this.convertSuccessRate(record);
  }

  /**
   * Get tracking records with filtering and pagination
   */
  async getTrackingRecords(query: GlobalAssetTrackingQuery): Promise<{
    data: GlobalAssetTracking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      status,
      type,
      source,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.globalAssetTrackingRepository.createQueryBuilder('tracking');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('tracking.status = :status', { status });
    }
    if (type) {
      queryBuilder.andWhere('tracking.type = :type', { type });
    }
    if (source) {
      queryBuilder.andWhere('tracking.source = :source', { source });
    }
    if (startDate && endDate) {
      queryBuilder.andWhere('tracking.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Apply sorting
    const sortField = sortBy === 'createdAt' ? 'tracking.createdAt' :
                     sortBy === 'startedAt' ? 'tracking.startedAt' :
                     sortBy === 'completedAt' ? 'tracking.completedAt' :
                     sortBy === 'executionTimeMs' ? 'tracking.executionTimeMs' :
                     sortBy === 'successRate' ? 'tracking.successRate' :
                     'tracking.createdAt';

    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    // Convert successRate from string to number for each record
    const processedData = this.convertSuccessRateForRecords(data);

    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    this.logger.log(`[GlobalAssetTrackingService] Retrieved ${data.length} tracking records (page ${page}/${totalPages})`);

    return {
      data: processedData,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get tracking statistics for a given period
   */
  async getTrackingStats(days: number = 30): Promise<GlobalAssetTrackingStats> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await this.globalAssetTrackingRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'ASC' },
    });

    const totalExecutions = records.length;
    const successfulExecutions = records.filter(r => r.isCompleted()).length;
    const failedExecutions = records.filter(r => r.isFailed()).length;
    const averageExecutionTime = records.length > 0 
      ? records.reduce((sum, r) => sum + r.executionTimeMs, 0) / records.length 
      : 0;
    const averageSuccessRate = records.length > 0 
      ? records.reduce((sum, r) => sum + r.successRate, 0) / records.length 
      : 0;
    const lastExecutionTime = records.length > 0 ? records[records.length - 1].startedAt : null;

    // Calculate success rate trend (daily)
    const successRateTrend = this.calculateSuccessRateTrend(records);
    const errorFrequency = this.calculateErrorFrequency(records);

    this.logger.log(`[GlobalAssetTrackingService] Calculated stats for ${days} days: ${totalExecutions} executions, ${successfulExecutions} successful, ${failedExecutions} failed`);

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime,
      averageSuccessRate,
      lastExecutionTime,
      successRateTrend,
      errorFrequency,
    };
  }

  /**
   * Get API call details by execution ID
   */
  async getApiCallDetailsByExecutionId(executionId: string): Promise<any[]> {
    try {
      return await this.apiCallDetailService.getApiCallDetailsByExecutionId(executionId);
    } catch (error) {
      this.logger.error(`[GlobalAssetTrackingService] Failed to get API call details for ${executionId}:`, error);
      return [];
    }
  }

  /**
   * Get recent tracking records
   */
  async getRecentTracking(limit: number = 10): Promise<GlobalAssetTracking[]> {
    const records = await this.globalAssetTrackingRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    // Convert successRate from string to number for each record
    const processedRecords = this.convertSuccessRateForRecords(records);

    this.logger.log(`[GlobalAssetTrackingService] Retrieved ${records.length} recent tracking records`);
    return processedRecords;
  }

  /**
   * Get running sync operations
   */
  async getRunningSyncs(): Promise<GlobalAssetTracking[]> {
    const records = await this.globalAssetTrackingRepository.find({
      where: { status: GlobalAssetSyncStatus.IN_PROGRESS },
      order: { startedAt: 'DESC' },
    });

    // Convert successRate from string to number for each record
    const processedRecords = this.convertSuccessRateForRecords(records);

    this.logger.log(`[GlobalAssetTrackingService] Retrieved ${records.length} running sync operations`);
    return processedRecords;
  }

  /**
   * Get the most recent finished (COMPLETED or FAILED) tracking execution time
   */
  async getLatestFinishedExecutionTime(): Promise<Date | null> {
    const record = await this.globalAssetTrackingRepository.findOne({
      where: [
        { status: GlobalAssetSyncStatus.COMPLETED },
        { status: GlobalAssetSyncStatus.FAILED },
      ],
      order: { completedAt: 'DESC' },
    });

    if (!record) {
      return null;
    }
    return record.completedAt || record.startedAt || null;
  }

  /**
   * Clean up old tracking records
   */
  async cleanupOldRecords(days: number = 90): Promise<{ deletedRecords: number; message: string }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.globalAssetTrackingRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    const deletedRecords = result.affected || 0;
    this.logger.log(`[GlobalAssetTrackingService] Cleaned up ${deletedRecords} old tracking records older than ${days} days`);

    return {
      deletedRecords,
      message: `Successfully deleted ${deletedRecords} tracking records older than ${days} days`,
    };
  }

  /**
   * Calculate success rate trend from records
   */
  private calculateSuccessRateTrend(records: GlobalAssetTracking[]): Array<{
    date: string;
    successRate: number;
  }> {
    const dailyStats = new Map<string, { total: number; successful: number }>();

    records.forEach(record => {
      const date = record.startedAt.toISOString().split('T')[0];
      const stats = dailyStats.get(date) || { total: 0, successful: 0 };
      stats.total++;
      if (record.isCompleted()) {
        stats.successful++;
      }
      dailyStats.set(date, stats);
    });

    return Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
    }));
  }

  /**
   * Calculate error frequency from records
   */
  private calculateErrorFrequency(records: GlobalAssetTracking[]): Array<{
    errorCode: string;
    count: number;
  }> {
    const errorCounts = new Map<string, number>();

    records
      .filter(r => r.isFailed() && r.errorCode)
      .forEach(record => {
        const errorCode = record.errorCode!;
        errorCounts.set(errorCode, (errorCounts.get(errorCode) || 0) + 1);
      });

    return Array.from(errorCounts.entries()).map(([errorCode, count]) => ({
      errorCode,
      count,
    }));
  }

  /**
   * Convert successRate from string to number for a single record
   */
  private convertSuccessRate(record: GlobalAssetTracking): GlobalAssetTracking {
    if (typeof record.successRate === 'string') {
      record.successRate = parseFloat(record.successRate);
    }
    return record;
  }

  /**
   * Convert successRate from string to number for multiple records
   */
  private convertSuccessRateForRecords(records: GlobalAssetTracking[]): GlobalAssetTracking[] {
    return records.map(record => this.convertSuccessRate(record));
  }

  /**
   * Send tracking failure alert to admin using event-driven approach
   */
  private async sendTrackingFailureAlert(
    tracking: GlobalAssetTracking,
    alertData: TrackingAlertData,
  ): Promise<void> {
    try {
      // Determine alert type based on failure severity
      const isCriticalFailure = this.isCriticalFailure(tracking, alertData);
      
      if (isCriticalFailure) {
        this.eventEmitter.emit('tracking.critical_failure', new CriticalTrackingFailureEvent(tracking, alertData));
        this.logger.log(`[GlobalAssetTrackingService] Emitted critical failure event for execution: ${tracking.executionId}`);
      } else {
        this.eventEmitter.emit('tracking.failure', new TrackingFailureEvent(tracking, alertData));
        this.logger.log(`[GlobalAssetTrackingService] Emitted failure event for execution: ${tracking.executionId}`);
      }
    } catch (error) {
      this.logger.error(`[GlobalAssetTrackingService] Error emitting tracking failure event:`, error);
    }
  }

  /**
   * Determine if this is a critical failure that requires immediate attention
   */
  private isCriticalFailure(tracking: GlobalAssetTracking, alertData: TrackingAlertData): boolean {
    // Critical failure conditions:
    // 1. Success rate is very low (< 50%)
    // 2. High number of failed symbols (> 100)
    // 3. System-level errors (not API errors)
    // 4. Manual trigger failures (admin-initiated)
    
    const hasLowSuccessRate = alertData.successRate !== undefined && alertData.successRate < 0.5;
    const hasHighFailureCount = alertData.failedSymbolsCount !== undefined && alertData.failedSymbolsCount > 100;
    const isSystemError = alertData.errorCode && !alertData.errorCode.includes('API_');
    const isManualTrigger = tracking.source === 'manual_trigger';
    
    return hasLowSuccessRate || hasHighFailureCount || isSystemError || isManualTrigger;
  }
}
