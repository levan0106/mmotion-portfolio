import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cron from 'node-cron';
import { randomUUID } from 'crypto';
import { PortfolioService } from './portfolio.service';
import { SnapshotService } from './snapshot.service';
import { PerformanceSnapshotService } from './performance-snapshot.service';
import { SnapshotTrackingService } from './snapshot-tracking.service';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { SnapshotTrackingStatus, SnapshotTrackingType } from '../entities/snapshot-tracking.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
  
  // Queue management for non-blocking processing
  private processingQueue: Array<{
    portfolio: any;
    executionId: string;
    priority: number;
  }> = [];
  private isProcessingQueue = false;
  private maxConcurrentPortfolios: number;
  private processingDelayMs: number;
  private activeProcesses: Map<string, Promise<void>> = new Map();

  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly snapshotService: SnapshotService,
    private readonly performanceSnapshotService: PerformanceSnapshotService,
    private readonly trackingService: SnapshotTrackingService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Load configuration from environment variables
    this.cronExpression = this.configService.get<string>('AUTOMATED_SNAPSHOT_CRON', '0 19 * * *');
    this.timezone = this.configService.get<string>('AUTOMATED_SNAPSHOT_TIMEZONE', 'Asia/Ho_Chi_Minh');
    this.scheduleDescription = this.configService.get<string>('AUTOMATED_SNAPSHOT_DESCRIPTION', 'Daily at 7:00 PM (Vietnam time)');
    
    // Load queue management configuration
    this.maxConcurrentPortfolios = this.configService.get<number>('AUTOMATED_SNAPSHOT_MAX_CONCURRENT', 2);
    this.processingDelayMs = this.configService.get<number>('AUTOMATED_SNAPSHOT_PROCESSING_DELAY', 100);
    
    this.logger.log(`Automated snapshot service configured with cron: ${this.cronExpression}, timezone: ${this.timezone}`);
    this.logger.log(`Queue management: max concurrent: ${this.maxConcurrentPortfolios}, delay: ${this.processingDelayMs}ms`);
    
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
        // Use setImmediate to prevent blocking the event loop
        setImmediate(() => {
          this.createDailySnapshotsForAllPortfolios();
        });
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
   * Add portfolio to processing queue
   */
  private addToQueue(portfolio: any, executionId: string, priority: number = 0): void {
    this.processingQueue.push({ portfolio, executionId, priority });
    this.processingQueue.sort((a, b) => b.priority - a.priority); // Higher priority first
    
    // Start processing if not already running
    if (!this.isProcessingQueue) {
      this.startQueueProcessing();
    }
  }

  /**
   * Start continuous queue processing
   */
  private startQueueProcessing(): void {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;
    this.logger.log(`🔄 Starting continuous queue processing with ${this.processingQueue.length} portfolios`);
    
    // Start the continuous processing loop
    this.processQueueContinuously();
  }

  /**
   * Process the queue continuously
   */
  private async processQueueContinuously(): Promise<void> {
    while (this.isProcessingQueue && (this.processingQueue.length > 0 || this.activeProcesses.size > 0)) {
      // Start new processes if we have capacity and items in queue
      while (this.processingQueue.length > 0 && this.activeProcesses.size < this.maxConcurrentPortfolios) {
        const item = this.processingQueue.shift();
        if (!item) break;

        const processId = `${item.portfolio.portfolioId}-${Date.now()}`;
        const processPromise = this.processPortfolioAsync(item.portfolio, item.executionId)
          .finally(() => {
            this.activeProcesses.delete(processId);
          });

        this.activeProcesses.set(processId, processPromise);

        // Add delay between starting processes to prevent overwhelming the system
        if (this.processingDelayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, this.processingDelayMs));
        }
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // All processing completed
    this.isProcessingQueue = false;
    this.logger.log(`✅ Queue processing completed. Processed all portfolios.`);
  }

  /**
   * Process a single portfolio asynchronously
   */
  private async processPortfolioAsync(portfolio: any, executionId: string): Promise<void> {
    try {
      await this.createSnapshotsForPortfolio(portfolio, executionId);
      this.executionStats.successfulPortfolios++;
      
      // Emit success event
      this.eventEmitter.emit('snapshot.portfolio.success', {
        portfolioId: portfolio.portfolioId,
        portfolioName: portfolio.name,
        executionId
      });
    } catch (error) {
      this.executionStats.failedPortfolios++;
      this.logger.error(`❌ Failed to create snapshots for portfolio ${portfolio.portfolioId} (${portfolio.name}):`, error);
      
      // Emit failure event
      this.eventEmitter.emit('snapshot.portfolio.failed', {
        portfolioId: portfolio.portfolioId,
        portfolioName: portfolio.name,
        executionId,
        error: error.message
      });
    }
  }

  /**
   * Calculate priority for portfolio processing
   */
  private calculatePortfolioPriority(portfolio: any): number {
    // Higher priority for portfolios with more assets or recent activity
    let priority = 0;
    
    // Base priority
    priority += 10;
    
    // Add priority based on portfolio size (if available)
    if (portfolio.assetCount) {
      priority += Math.min(portfolio.assetCount, 50); // Cap at 50
    }
    
    // Add priority based on recent activity
    if (portfolio.lastUpdated) {
      const daysSinceUpdate = (Date.now() - new Date(portfolio.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) {
        priority += 20; // Recent activity gets higher priority
      }
    }
    
    return priority;
  }

  /**
   * Scheduled task to create snapshots for all portfolios
   * Schedule is configured via environment variables
   */
  async createDailySnapshotsForAllPortfolios(triggerType:string = 'scheduled'): Promise<void> {
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
          triggeredBy: triggerType,
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

      // Add all portfolios to processing queue for non-blocking processing
      this.logger.log(`📦 Adding ${portfolios.length} portfolios to processing queue`);
      
      portfolios.forEach((portfolio, index) => {
        // Assign priority based on portfolio size or other criteria
        const priority = this.calculatePortfolioPriority(portfolio);
        this.addToQueue(portfolio, executionId, priority);
      });

      // Wait for queue processing to complete
      this.logger.log(`⏳ Waiting for queue processing to complete...`);
      while (this.isProcessingQueue || this.processingQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Check every second
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
   * Create snapshots for a specific portfolio using centralized tracking
   */
  private async createSnapshotsForPortfolio(portfolio: any, executionId?: string): Promise<void> {
    const portfolioId = portfolio.portfolioId;
    const portfolioName = portfolio.name;
    const snapshotDate = new Date();
    
    this.logger.log(`createSnapshotsForPortfolio: 📸 Creating snapshots for portfolio: ${portfolioName} (${portfolioId})`);

    try {
      // Use centralized tracking service for consistent snapshot creation
      const result = await this.trackingService.createSnapshotsWithTracking(
        portfolioId,
        portfolioName,
        snapshotDate,
        SnapshotGranularity.DAILY,
        executionId,
        'automated-system',
        true, // Include performance snapshots
        SnapshotTrackingType.AUTOMATED // Use AUTOMATED type for automated snapshots
      );

      if (result.success) {
        this.executionStats.totalSnapshots += result.assetSnapshots.length;
        this.logger.log(`✅ Created ${result.assetSnapshots.length} snapshots for portfolio ${portfolioName}. Tracking ID: ${result.trackingId}`);
      } else {
        this.logger.error(`❌ Failed to create snapshots for portfolio ${portfolioName}: ${result.error}`);
      }

    } catch (error) {
      this.logger.error(`❌ Failed to create snapshots for portfolio ${portfolioName}:`, error);
      // Don't throw error - just log and continue with next portfolio
      this.logger.warn(`⚠️ Continuing with next portfolio after error in ${portfolioName}`);
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
    await this.createDailySnapshotsForAllPortfolios('manual');

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
      queueStatus: {
        queueLength: number;
        isProcessingQueue: boolean;
        maxConcurrentPortfolios: number;
        processingDelayMs: number;
        activeProcesses: number;
      };
  } {
    return {
      isRunning: this.isRunning,
      isEnabled: this.isEnabled,
      lastExecutionTime: this.lastExecutionTime,
      executionStats: this.executionStats,
      nextScheduledTime: this.isEnabled ? this.scheduleDescription : 'Service disabled',
      cronExpression: this.cronExpression,
      timezone: this.timezone,
      scheduleDescription: this.scheduleDescription,
      queueStatus: {
        queueLength: this.processingQueue.length,
        isProcessingQueue: this.isProcessingQueue,
        maxConcurrentPortfolios: this.maxConcurrentPortfolios,
        processingDelayMs: this.processingDelayMs,
        activeProcesses: this.activeProcesses.size,
      }
    };
  }

  /**
   * Get detailed queue information
   */
  getQueueStatus(): {
    queueLength: number;
    isProcessingQueue: boolean;
    maxConcurrentPortfolios: number;
    processingDelayMs: number;
    activeProcesses: number;
    queueItems: Array<{
      portfolioId: string;
      portfolioName: string;
      priority: number;
      executionId: string;
    }>;
  } {
    return {
      queueLength: this.processingQueue.length,
      isProcessingQueue: this.isProcessingQueue,
      maxConcurrentPortfolios: this.maxConcurrentPortfolios,
      processingDelayMs: this.processingDelayMs,
      activeProcesses: this.activeProcesses.size,
      queueItems: this.processingQueue.map(item => ({
        portfolioId: item.portfolio.portfolioId,
        portfolioName: item.portfolio.name,
        priority: item.priority,
        executionId: item.executionId,
      }))
    };
  }

  /**
   * Manually trigger snapshot creation for a specific portfolio (non-blocking)
   */
  async triggerPortfolioSnapshot(portfolioId: string): Promise<{
    success: boolean;
    message: string;
    queuePosition?: number;
  }> {
    try {
      this.logger.log(`🔧 Manual trigger for portfolio ${portfolioId}`);
      
      const portfolio = await this.portfolioService.getPortfolioDetails(portfolioId);
      if (!portfolio) {
        return {
          success: false,
          message: `Portfolio ${portfolioId} not found`
        };
      }

      const executionId = randomUUID();
      const priority = this.calculatePortfolioPriority(portfolio) + 100; // Higher priority for manual triggers
      
      this.addToQueue(portfolio, executionId, priority);
      
      return {
        success: true,
        message: `Portfolio ${portfolio.name} added to processing queue`,
        queuePosition: this.processingQueue.length
      };
    } catch (error) {
      this.logger.error(`❌ Failed to trigger portfolio snapshot for ${portfolioId}:`, error);
      return {
        success: false,
        message: `Failed to trigger: ${error.message}`
      };
    }
  }

  /**
   * Clear the processing queue
   */
  async clearQueue(): Promise<{
    success: boolean;
    message: string;
    clearedItems: number;
    activeProcesses: number;
  }> {
    const clearedItems = this.processingQueue.length;
    const activeProcesses = this.activeProcesses.size;
    
    this.processingQueue = [];
    this.activeProcesses.clear();
    
    this.logger.log(`🧹 Cleared ${clearedItems} items from processing queue and ${activeProcesses} active processes`);
    
    return {
      success: true,
      message: `Cleared ${clearedItems} items from processing queue and ${activeProcesses} active processes`,
      clearedItems,
      activeProcesses
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
