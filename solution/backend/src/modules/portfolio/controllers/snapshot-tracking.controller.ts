import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  Logger,
  ParseIntPipe,
  ParseEnumPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { SnapshotTrackingService } from '../services/snapshot-tracking.service';
import {
  SnapshotTrackingStatus,
  SnapshotTrackingType,
} from '../entities/snapshot-tracking.entity';
import {
  CreateTrackingData,
  UpdateTrackingData,
  TrackingFilters,
} from '../services/snapshot-tracking.service';

@Controller('api/v1/snapshot-tracking')
export class SnapshotTrackingController {
  private readonly logger = new Logger(SnapshotTrackingController.name);

  constructor(
    private readonly trackingService: SnapshotTrackingService,
  ) {}

  /**
   * Get tracking records with filters
   */
  @Get()
  async getTrackingRecords(
    @Query('status') status?: SnapshotTrackingStatus,
    @Query('type') type?: SnapshotTrackingType,
    @Query('portfolioId') portfolioId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.logger.log('Getting tracking records with filters');

    const filters: TrackingFilters = {
      status,
      type,
      portfolioId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    const result = await this.trackingService.getTrackingRecords(filters);
    
    return {
      success: true,
      data: result.records,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit, 10) : 20,
        offset: offset ? parseInt(offset, 10) : 0,
        hasMore: (offset ? parseInt(offset, 10) : 0) + (limit ? parseInt(limit, 10) : 20) < result.total,
      },
    };
  }

  /**
   * Get tracking record by execution ID
   */
  @Get('execution/:executionId')
  async getTrackingByExecutionId(
    @Param('executionId', ParseUUIDPipe) executionId: string,
  ) {
    this.logger.log(`Getting tracking record for execution ${executionId}`);

    const tracking = await this.trackingService.getTrackingByExecutionId(executionId);
    
    if (!tracking) {
      return {
        success: false,
        message: 'Tracking record not found',
        data: null,
      };
    }

    return {
      success: true,
      data: tracking,
    };
  }

  /**
   * Get execution summary
   */
  @Get('execution/:executionId/summary')
  async getExecutionSummary(
    @Param('executionId', ParseUUIDPipe) executionId: string,
  ) {
    this.logger.log(`Getting execution summary for ${executionId}`);

    const summary = await this.trackingService.getExecutionSummary(executionId);
    
    return {
      success: true,
      data: summary,
    };
  }

  /**
   * Get tracking statistics
   */
  @Get('stats')
  async getTrackingStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.log('Getting tracking statistics');

    const stats = await this.trackingService.getTrackingStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Get recent tracking records
   */
  @Get('recent')
  async getRecentTracking(
    @Query('limit') limit?: string,
  ) {
    this.logger.log('Getting recent tracking records');

    const records = await this.trackingService.getRecentTracking(limit ? parseInt(limit, 10) : 10);
    
    return {
      success: true,
      data: records,
    };
  }

  /**
   * Get tracking records by portfolio
   */
  @Get('portfolio/:portfolioId')
  async getTrackingByPortfolio(
    @Param('portfolioId') portfolioId: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log(`Getting tracking records for portfolio ${portfolioId}`);

    const records = await this.trackingService.getTrackingByPortfolio(
      portfolioId,
      limit ? parseInt(limit, 10) : 20,
    );
    
    return {
      success: true,
      data: records,
    };
  }

  /**
   * Get failed tracking records
   */
  @Get('failed')
  async getFailedTracking(
    @Query('limit') limit?: string,
  ) {
    this.logger.log('Getting failed tracking records');

    const records = await this.trackingService.getFailedTracking(limit ? parseInt(limit, 10) : 20);
    
    return {
      success: true,
      data: records,
    };
  }

  /**
   * Create tracking record
   */
  @Post()
  async createTracking(@Body() data: CreateTrackingData) {
    this.logger.log('Creating tracking record');

    const tracking = await this.trackingService.createTracking(data);
    
    return {
      success: true,
      data: tracking,
    };
  }

  /**
   * Update tracking record
   */
  @Post(':executionId/update')
  async updateTracking(
    @Param('executionId', ParseUUIDPipe) executionId: string,
    @Body() data: UpdateTrackingData,
  ) {
    this.logger.log(`Updating tracking record for execution ${executionId}`);

    const tracking = await this.trackingService.updateTracking(executionId, data);
    
    if (!tracking) {
      return {
        success: false,
        message: 'Tracking record not found',
        data: null,
      };
    }

    return {
      success: true,
      data: tracking,
    };
  }

  /**
   * Clean up old tracking records
   */
  @Post('cleanup')
  async cleanupOldRecords(
    @Query('daysToKeep') daysToKeep?: string,
  ) {
    const days = daysToKeep ? parseInt(daysToKeep, 10) : 30;
    const action = days === 0 ? 'all tracking records' : `old tracking records (older than ${days} days)`;
    
    this.logger.log(`Cleaning up ${action}`);

    const deletedCount = await this.trackingService.cleanupOldRecords(days);
    
    return {
      success: true,
      message: `Cleaned up ${deletedCount} tracking records`,
      data: { deletedCount },
    };
  }

  /**
   * Get dashboard data
   */
  @Get('dashboard')
  async getDashboardData() {
    this.logger.log('Getting dashboard data');

    // Get recent records
    const recentRecords = await this.trackingService.getRecentTracking(10);
    
    // Get stats for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const stats = await this.trackingService.getTrackingStats(sevenDaysAgo);
    
    // Get failed records
    const failedRecords = await this.trackingService.getFailedTracking(5);

    return {
      success: true,
      data: {
        recentRecords,
        stats,
        failedRecords,
        lastUpdated: new Date(),
      },
    };
  }
}
