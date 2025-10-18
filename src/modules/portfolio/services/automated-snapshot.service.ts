import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as cron from 'node-cron';
import { randomUUID } from 'crypto';
import { PortfolioService } from './portfolio.service';
import { SnapshotService } from './snapshot.service';
import { PerformanceSnapshotService } from './performance-snapshot.service';
import { PortfolioSnapshotService } from './portfolio-snapshot.service';
import { SnapshotTrackingService } from './snapshot-tracking.service';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { SnapshotTrackingStatus, SnapshotTrackingType } from '../entities/snapshot-tracking.entity';

/**
 * Service for automated portfolio snapshot creation.
 * Handles scheduled snapshot creation for all portfolios in the system.
 */
@Injectable()
export class AutomatedSnapshotService {
  private readonly logger = new Logger(AutomatedSnapshotService.name);
  private isRunning = false;
  private isEnabled = true; // Service enabled by default
  private lastExecutionTime: Date | null = null;
  private executionStats = {
    totalPortfolios: 0,
    successfulPortfolios: 0,
    failedPortfolios: 0,
    totalSnapshots: 0,
    executionTime: 0
  };

  private readonly cronExpression: string;
  private readonly timezone: string;
  private readonly scheduleDescription: string;
  private cronJob: cron.ScheduledTask | null = null;

  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly snapshotService: SnapshotService,
    private readonly performanceSnapshotService: PerformanceSnapshotService,
    private readonly portfolioSnapshotService: PortfolioSnapshotService,
    private readonly trackingService: SnapshotTrackingService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    // Load configuration from environment variables
    this.cronExpression = this.configService.get<string>('AUTOMATED_SNAPSHOT_CRON', '0 19 * * *');
    this.timezone = this.configService.get<string>('AUTOMATED_SNAPSHOT_TIMEZONE', 'Asia/Ho_Chi_Minh');
    this.scheduleDescription = this.configService.get<string>('AUTOMATED_SNAPSHOT_DESCRIPTION', 'Daily at 7:00 PM (Vietnam time)');
    
    this.logger.log(`Automated snapshot service configured with cron: ${this.cronExpression}, timezone: ${this.timezone}`);
    
    // Setup dynamic cron job
    this.setupDynamicCronJob();
  }

  /**
   * Setup dynamic cron job based on configuration
   */
  private setupDynamicCronJob(): void {
    try {
      // Stop existing cron job if it exists
      if (this.cronJob) {
        this.cronJob.stop();
        this.cronJob = null;
      }

      // Create new cron job with dynamic configuration
      this.cronJob = cron.schedule(this.cronExpression, () => {
        this.logger.log('[AutomatedSnapshotService] Running scheduled snapshot creation');
        this.createDailySnapshotsForAllPortfolios();
      }, {
        scheduled: true,
        timezone: this.timezone
      });

      this.logger.log(`Dynamic cron job created with expression: ${this.cronExpression}, timezone: ${this.timezone}`);
    } catch (error) {
      this.logger.error('Failed to setup dynamic cron job:', error);
    }
  }

  /**
   * Scheduled task to create snapshots for all portfolios
   * Schedule is configured via environment variables
   */
  async createDailySnapshotsForAllPortfolios(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.log('Automated snapshot service is disabled, skipping scheduled execution');
      return;
    }

    if (this.isRunning) {
      this.logger.warn('Automated snapshot creation is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    this.lastExecutionTime = startTime;

    // Generate execution ID for tracking
    const executionId = randomUUID();
    
    this.logger.log('🚀 Starting automated snapshot creation for all portfolios at 7 PM');
    
    // Create tracking record
    let trackingRecord = null;
    try {
      trackingRecord = await this.trackingService.createTracking({
        executionId,
        type: SnapshotTrackingType.AUTOMATED,
        cronExpression: this.cronExpression,
        timezone: this.timezone,
        totalPortfolios: 0, // Will be updated after getting portfolios
        metadata: {
          triggeredBy: 'scheduled',
          serviceVersion: '1.0.0',
        },
      });
    } catch (trackingError) {
      this.logger.error('Failed to create tracking record:', trackingError);
    }
    
    try {
      // Reset execution stats
      this.executionStats = {
        totalPortfolios: 0,
        successfulPortfolios: 0,
        failedPortfolios: 0,
        totalSnapshots: 0,
        executionTime: 0
      };

      // Get all portfolios in the system
      const portfolios = await this.portfolioService.getAllPortfolios();
      this.executionStats.totalPortfolios = portfolios.length;

      if (portfolios.length === 0) {
        this.logger.warn('No portfolios found in the system');
        if (trackingRecord) {
          await this.trackingService.updateTracking(executionId, {
            status: SnapshotTrackingStatus.COMPLETED,
            totalSnapshots: 0,
            successfulSnapshots: 0,
            failedSnapshots: 0,
            totalPortfolios: this.executionStats.totalPortfolios,
            executionTimeMs: 0,
          });
        }
        return;
      }

      this.logger.log(`📊 Found ${portfolios.length} portfolios to process`);

      // Update tracking with total portfolios
      if (trackingRecord) {
        await this.trackingService.updateTracking(executionId, {
          status: SnapshotTrackingStatus.IN_PROGRESS,
          totalSnapshots: portfolios.length,
        });
      }

      // Process portfolios in parallel batches for better performance
      const BATCH_SIZE = this.configService.get<number>('AUTOMATED_SNAPSHOT_BATCH_SIZE', 3); // Configurable batch size
      const portfolioBatches = [];
      
      for (let i = 0; i < portfolios.length; i += BATCH_SIZE) {
        portfolioBatches.push(portfolios.slice(i, i + BATCH_SIZE));
      }

      this.logger.log(`📦 Processing ${portfolios.length} portfolios in ${portfolioBatches.length} batches of ${BATCH_SIZE}`);

      for (const batch of portfolioBatches) {
        const batchPromises = batch.map(async (portfolio) => {
          try {
            await this.createSnapshotsForPortfolio(portfolio, executionId);
            this.executionStats.successfulPortfolios++;
            return { success: true, portfolioId: portfolio.portfolioId };
          } catch (error) {
            this.executionStats.failedPortfolios++;
            this.logger.error(`❌ Failed to create snapshots for portfolio ${portfolio.portfolioId} (${portfolio.name}):`, error);
            return { success: false, portfolioId: portfolio.portfolioId, error: error.message };
          }
        });

        // Wait for all portfolios in this batch to complete
        const batchResults = await Promise.allSettled(batchPromises);
        
        const successful = batchResults.filter(result => result.status === 'fulfilled' && result.value.success).length;
        const failed = batchResults.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)).length;
        
        this.logger.log(`✅ Batch completed: ${successful} successful, ${failed} failed`);
      }

      // Calculate execution time
      const endTime = new Date();
      this.executionStats.executionTime = endTime.getTime() - startTime.getTime();

      // Update final tracking record
      if (trackingRecord) {
        await this.trackingService.updateTracking(executionId, {
          status: this.executionStats.failedPortfolios > 0 
            ? SnapshotTrackingStatus.FAILED 
            : SnapshotTrackingStatus.COMPLETED,
          successfulSnapshots: this.executionStats.successfulPortfolios,
          failedSnapshots: this.executionStats.failedPortfolios,
          totalPortfolios: this.executionStats.totalPortfolios,
          executionTimeMs: this.executionStats.executionTime,
        });
      }

      // Log summary
      this.logger.log(`✅ Automated snapshot creation completed:`);
      this.logger.log(`   📈 Total portfolios: ${this.executionStats.totalPortfolios}`);
      this.logger.log(`   ✅ Successful: ${this.executionStats.successfulPortfolios}`);
      this.logger.log(`   ❌ Failed: ${this.executionStats.failedPortfolios}`);
      this.logger.log(`   📊 Total snapshots created: ${this.executionStats.totalSnapshots}`);
      this.logger.log(`   ⏱️ Execution time: ${this.executionStats.executionTime}ms`);

    } catch (error) {
      this.logger.error('💥 Fatal error during automated snapshot creation:', error);
      
      // Update tracking with error
      if (trackingRecord) {
        await this.trackingService.updateTracking(executionId, {
          status: SnapshotTrackingStatus.FAILED,
          errorMessage: error.message,
          executionTimeMs: new Date().getTime() - startTime.getTime(),
        });
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Create snapshots for a specific portfolio
   */
  private async createSnapshotsForPortfolio(portfolio: any, executionId?: string): Promise<void> {
    const portfolioId = portfolio.portfolioId;
    const portfolioName = portfolio.name;
    const snapshotDate = new Date();
    
    this.logger.log(`📸 Creating snapshots for portfolio: ${portfolioName} (${portfolioId})`);

    // Create individual portfolio tracking record
    let portfolioTracking = null;
    if (executionId) {
      try {
        portfolioTracking = await this.trackingService.createTracking({
          executionId: `${executionId}-${portfolioId}`,
          portfolioId,
          portfolioName,
          type: SnapshotTrackingType.AUTOMATED,
          metadata: {
            parentExecutionId: executionId,
            triggeredBy: 'automated-system',
          },
        });
      } catch (trackingError) {
        this.logger.error('Failed to create portfolio tracking record:', trackingError);
      }
    }

    try {
      // Create asset allocation snapshots
      const assetSnapshots = await this.snapshotService.createPortfolioSnapshot(
        portfolioId,
        snapshotDate,
        SnapshotGranularity.DAILY,
        'automated-system'
      );

      // Create performance snapshots if asset snapshots were created
      if (assetSnapshots.length > 0) {
        try {
          await this.performanceSnapshotService.createPerformanceSnapshots(
            portfolioId,
            snapshotDate,
            SnapshotGranularity.DAILY,
            'automated-system'
          );
          
          this.executionStats.totalSnapshots += assetSnapshots.length;
          this.logger.log(`✅ Created ${assetSnapshots.length} snapshots for portfolio ${portfolioName}`);

          // Update portfolio tracking
          if (portfolioTracking) {
            await this.trackingService.updateTracking(`${executionId}-${portfolioId}`, {
              status: SnapshotTrackingStatus.COMPLETED,
              totalSnapshots: assetSnapshots.length,
              successfulSnapshots: assetSnapshots.length,
              failedSnapshots: 0,
            });
          }
        } catch (performanceError) {
          this.logger.error(`⚠️ Asset snapshots created but performance snapshots failed for portfolio ${portfolioName}:`, performanceError);
          // Still count as successful since asset snapshots were created
          this.executionStats.totalSnapshots += assetSnapshots.length;

          // Update portfolio tracking with partial success
          if (portfolioTracking) {
            await this.trackingService.updateTracking(`${executionId}-${portfolioId}`, {
              status: SnapshotTrackingStatus.COMPLETED,
              totalSnapshots: assetSnapshots.length,
              successfulSnapshots: assetSnapshots.length,
              failedSnapshots: 0,
              metadata: {
                ...portfolioTracking.metadata,
                performanceSnapshotError: performanceError.message,
              },
            });
          }
        }
      } else {
        this.logger.warn(`⚠️ No asset snapshots created for portfolio ${portfolioName} - may have no assets or trades`);
        
        // Update portfolio tracking with no snapshots
        if (portfolioTracking) {
          await this.trackingService.updateTracking(`${executionId}-${portfolioId}`, {
            status: SnapshotTrackingStatus.COMPLETED,
            totalSnapshots: 0,
            successfulSnapshots: 0,
            failedSnapshots: 0,
            metadata: {
              ...portfolioTracking.metadata,
              reason: 'No assets or trades found',
            },
          });
        }
      }

    } catch (error) {
      this.logger.error(`❌ Failed to create snapshots for portfolio ${portfolioName}:`, error);
      
      // Update portfolio tracking with error
      if (portfolioTracking) {
        await this.trackingService.updateTracking(`${executionId}-${portfolioId}`, {
          status: SnapshotTrackingStatus.FAILED,
          errorMessage: error.message,
        });
      }
      
      throw error;
    }
  }

  /**
   * Manually trigger snapshot creation for all portfolios
   */
  async triggerManualSnapshotCreation(): Promise<{
    message: string;
    stats: typeof this.executionStats;
  }> {
    if (this.isRunning) {
      return {
        message: 'Automated snapshot creation is already running',
        stats: this.executionStats
      };
    }

    this.logger.log('🔧 Manual trigger of automated snapshot creation');
    await this.createDailySnapshotsForAllPortfolios();

    return {
      message: 'Manual snapshot creation completed',
      stats: this.executionStats
    };
  }

  /**
   * Enable the automated snapshot service
   */
  async enableService(): Promise<{ message: string; enabled: boolean }> {
    this.isEnabled = true;
    this.logger.log('Automated snapshot service enabled');
    return {
      message: 'Automated snapshot service has been enabled',
      enabled: true
    };
  }

  /**
   * Disable the automated snapshot service
   */
  async disableService(): Promise<{ message: string; enabled: boolean }> {
    this.isEnabled = false;
    this.logger.log('Automated snapshot service disabled');
    return {
      message: 'Automated snapshot service has been disabled',
      enabled: false
    };
  }

  /**
   * Get current status of the automated snapshot service
   */
  getStatus(): {
    isRunning: boolean;
    isEnabled: boolean;
    lastExecutionTime: Date | null;
    executionStats: typeof this.executionStats;
    nextScheduledTime: string;
    cronExpression: string;
    timezone: string;
    scheduleDescription: string;
  } {
    return {
      isRunning: this.isRunning,
      isEnabled: this.isEnabled,
      lastExecutionTime: this.lastExecutionTime,
      executionStats: this.executionStats,
      nextScheduledTime: this.isEnabled ? this.scheduleDescription : 'Service disabled',
      cronExpression: this.cronExpression,
      timezone: this.timezone,
      scheduleDescription: this.scheduleDescription
    };
  }

  /**
   * Test method to create snapshots for a specific portfolio
   */
  async testSnapshotCreation(portfolioId: string): Promise<{
    success: boolean;
    message: string;
    snapshotsCreated: number;
  }> {
    try {
      this.logger.log(`🧪 Testing snapshot creation for portfolio ${portfolioId}`);
      
      const portfolio = await this.portfolioService.getPortfolioDetails(portfolioId);
      if (!portfolio) {
        return {
          success: false,
          message: `Portfolio ${portfolioId} not found`,
          snapshotsCreated: 0
        };
      }

      await this.createSnapshotsForPortfolio(portfolio);
      
      return {
        success: true,
        message: `Test snapshot creation successful for portfolio ${portfolio.name}`,
        snapshotsCreated: this.executionStats.totalSnapshots
      };
    } catch (error) {
      this.logger.error(`❌ Test snapshot creation failed for portfolio ${portfolioId}:`, error);
      return {
        success: false,
        message: `Test failed: ${error.message}`,
        snapshotsCreated: 0
      };
    }
  }
}
