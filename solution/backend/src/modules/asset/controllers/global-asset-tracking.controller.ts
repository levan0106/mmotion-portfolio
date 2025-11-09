import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { GlobalAssetTrackingService, GlobalAssetTrackingQuery, GlobalAssetTrackingStats } from '../services/global-asset-tracking.service';
import { GlobalAssetTracking, GlobalAssetSyncStatus, GlobalAssetSyncType, GlobalAssetSyncSource } from '../entities/global-asset-tracking.entity';

@ApiTags('Global Asset Tracking')
@Controller('api/v1/global-asset-tracking')
export class GlobalAssetTrackingController {
  private readonly logger = new Logger(GlobalAssetTrackingController.name);

  constructor(
    private readonly globalAssetTrackingService: GlobalAssetTrackingService,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get global asset tracking records',
    description: 'Retrieve paginated global asset tracking records with filtering options'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved tracking records',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/GlobalAssetTracking' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiQuery({ name: 'status', required: false, enum: GlobalAssetSyncStatus })
  @ApiQuery({ name: 'type', required: false, enum: GlobalAssetSyncType })
  @ApiQuery({ name: 'source', required: false, enum: GlobalAssetSyncSource })
  @ApiQuery({ name: 'startDate', required: false, type: 'string' })
  @ApiQuery({ name: 'endDate', required: false, type: 'string' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'offset', required: false, type: 'number' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'startedAt', 'completedAt', 'executionTimeMs', 'successRate'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  async getTrackingRecords(
    @Query() query: GlobalAssetTrackingQuery,
  ): Promise<{
    data: GlobalAssetTracking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      this.logger.log(`[GlobalAssetTrackingController] Getting tracking records with query: ${JSON.stringify(query)}`);
      return await this.globalAssetTrackingService.getTrackingRecords(query);
    } catch (error) {
      this.logger.error(`[GlobalAssetTrackingController] Error getting tracking records:`, error);
      throw new HttpException(
        'Failed to retrieve tracking records',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':executionId')
  @ApiOperation({ 
    summary: 'Get tracking record by execution ID',
    description: 'Retrieve a specific tracking record by its execution ID'
  })
  @ApiParam({ name: 'executionId', description: 'Execution ID of the tracking record' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved tracking record',
    type: GlobalAssetTracking,
  })
  @ApiResponse({
    status: 404,
    description: 'Tracking record not found',
  })
  async getTrackingRecord(
    @Param('executionId') executionId: string,
  ): Promise<GlobalAssetTracking> {
    try {
      this.logger.log(`[GlobalAssetTrackingController] Getting tracking record: ${executionId}`);
      const record = await this.globalAssetTrackingService.getByExecutionId(executionId);
      
      if (!record) {
        throw new HttpException(
          'Tracking record not found',
          HttpStatus.NOT_FOUND,
        );
      }
      
      return record;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`[GlobalAssetTrackingController] Error getting tracking record ${executionId}:`, error);
      throw new HttpException(
        'Failed to retrieve tracking record',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':executionId/api-calls')
  @ApiOperation({ 
    summary: 'Get API call details by execution ID',
    description: 'Retrieve detailed API call information for a specific execution'
  })
  @ApiParam({ name: 'executionId', description: 'Execution ID of the tracking record' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved API call details',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              executionId: { type: 'string' },
              apiName: { type: 'string' },
              endpoint: { type: 'string' },
              method: { type: 'string' },
              status: { type: 'string' },
              responseTime: { type: 'number' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Execution ID not found',
  })
  async getApiCallDetails(
    @Param('executionId') executionId: string,
  ): Promise<{ data: any[] }> {
    try {
      this.logger.log(`[GlobalAssetTrackingController] Getting API call details for execution: ${executionId}`);
      const apiCallDetails = await this.globalAssetTrackingService.getApiCallDetailsByExecutionId(executionId);
      return { data: apiCallDetails };
    } catch (error) {
      this.logger.error(`[GlobalAssetTrackingController] Error getting API call details for ${executionId}:`, error);
      throw new HttpException(
        'Failed to retrieve API call details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/summary')
  @ApiOperation({ 
    summary: 'Get tracking statistics',
    description: 'Get comprehensive statistics about global asset tracking operations'
  })
  @ApiQuery({ name: 'days', required: false, type: 'number', description: 'Number of days to include in statistics' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved tracking statistics',
    schema: {
      type: 'object',
      properties: {
        data: { $ref: '#/components/schemas/GlobalAssetTrackingStats' },
      },
    },
  })
  async getTrackingStats(
    @Query('days') days: number = 30,
  ): Promise<{ data: GlobalAssetTrackingStats }> {
    try {
      this.logger.log(`[GlobalAssetTrackingController] Getting tracking stats for ${days} days`);
      const stats = await this.globalAssetTrackingService.getTrackingStats(days);
      return { data: stats };
    } catch (error) {
      this.logger.error(`[GlobalAssetTrackingController] Error getting tracking stats:`, error);
      throw new HttpException(
        'Failed to retrieve tracking statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('recent/:limit')
  @ApiOperation({ 
    summary: 'Get recent tracking records',
    description: 'Get the most recent tracking records'
  })
  @ApiParam({ name: 'limit', description: 'Number of recent records to retrieve', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved recent tracking records',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/GlobalAssetTracking' }
        },
      },
    },
  })
  async getRecentTracking(
    @Param('limit') limit: number = 10,
  ): Promise<{ data: GlobalAssetTracking[] }> {
    try {
      this.logger.log(`[GlobalAssetTrackingController] Getting recent tracking records (limit: ${limit})`);
      const records = await this.globalAssetTrackingService.getRecentTracking(limit);
      return { data: records };
    } catch (error) {
      this.logger.error(`[GlobalAssetTrackingController] Error getting recent tracking records:`, error);
      throw new HttpException(
        'Failed to retrieve recent tracking records',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('running/list')
  @ApiOperation({ 
    summary: 'Get running sync operations',
    description: 'Get all currently running global asset sync operations'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved running sync operations',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/GlobalAssetTracking' }
        },
      },
    },
  })
  async getRunningSyncs(): Promise<{ data: GlobalAssetTracking[] }> {
    try {
      this.logger.log(`[GlobalAssetTrackingController] Getting running sync operations`);
      const records = await this.globalAssetTrackingService.getRunningSyncs();
      return { data: records };
    } catch (error) {
      this.logger.error(`[GlobalAssetTrackingController] Error getting running sync operations:`, error);
      throw new HttpException(
        'Failed to retrieve running sync operations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('cleanup/execute')
  @ApiOperation({ 
    summary: 'Clean up old tracking records',
    description: 'Delete tracking records older than specified number of days'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        days: { type: 'number', default: 90, description: 'Number of days - records older than this will be deleted' },
      },
      required: ['days'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully cleaned up old records',
    schema: {
      type: 'object',
      properties: {
        deletedRecords: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async cleanupOldRecords(
    @Body('days') days: number = 90,
  ): Promise<{ deletedRecords: number; message: string }> {
    try {
      this.logger.log(`[GlobalAssetTrackingController] Cleaning up records older than ${days} days`);
      const result = await this.globalAssetTrackingService.cleanupOldRecords(days);
      return result;
    } catch (error) {
      this.logger.error(`[GlobalAssetTrackingController] Error cleaning up old records:`, error);
      throw new HttpException(
        'Failed to clean up old records',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
