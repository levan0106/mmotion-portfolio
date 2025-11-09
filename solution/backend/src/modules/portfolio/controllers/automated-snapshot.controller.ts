import { Controller, Get, Post, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AutomatedSnapshotService } from '../services/automated-snapshot.service';

/**
 * Controller for managing automated portfolio snapshot creation.
 * Provides endpoints to monitor and control the automated snapshot service.
 */
@ApiTags('Automated Snapshots')
@Controller('api/v1/automated-snapshots')
export class AutomatedSnapshotController {
  private readonly logger = new Logger(AutomatedSnapshotController.name);

  constructor(
    private readonly automatedSnapshotService: AutomatedSnapshotService,
  ) {}

  /**
   * Get the current status of the automated snapshot service
   */
  @Get('status')
  @ApiOperation({ 
    summary: 'Get automated snapshot service status',
    description: 'Returns the current status, execution stats, and next scheduled time'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isRunning: { type: 'boolean', description: 'Whether the service is currently running' },
        lastExecutionTime: { type: 'string', format: 'date-time', nullable: true, description: 'Last execution time' },
        executionStats: {
          type: 'object',
          properties: {
            totalPortfolios: { type: 'number', description: 'Total portfolios processed' },
            successfulPortfolios: { type: 'number', description: 'Successfully processed portfolios' },
            failedPortfolios: { type: 'number', description: 'Failed portfolios' },
            totalSnapshots: { type: 'number', description: 'Total snapshots created' },
            executionTime: { type: 'number', description: 'Execution time in milliseconds' }
          }
        },
        nextScheduledTime: { type: 'string', description: 'Next scheduled execution time' }
      }
    }
  })
  getStatus() {
    this.logger.log('Getting automated snapshot service status');
    return this.automatedSnapshotService.getStatus();
  }

  /**
   * Manually trigger snapshot creation for all portfolios
   */
  @Post('trigger')
  @ApiOperation({ 
    summary: 'Manually trigger snapshot creation',
    description: 'Manually triggers snapshot creation for all portfolios in the system'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Snapshot creation triggered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Result message' },
        stats: {
          type: 'object',
          properties: {
            totalPortfolios: { type: 'number' },
            successfulPortfolios: { type: 'number' },
            failedPortfolios: { type: 'number' },
            totalSnapshots: { type: 'number' },
            executionTime: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Service is already running',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        stats: { type: 'object' }
      }
    }
  })
  async triggerManualSnapshotCreation() {
    this.logger.log('Manual trigger of automated snapshot creation requested');
    return await this.automatedSnapshotService.triggerManualSnapshotCreation();
  }

  /**
   * Test snapshot creation for a specific portfolio
   */
  @Post('test/:portfolioId')
  @ApiOperation({ 
    summary: 'Test snapshot creation for a specific portfolio',
    description: 'Tests snapshot creation for a single portfolio without affecting the scheduled service'
  })
  @ApiParam({ 
    name: 'portfolioId', 
    description: 'Portfolio ID to test',
    type: 'string'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Test completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', description: 'Whether the test was successful' },
        message: { type: 'string', description: 'Result message' },
        snapshotsCreated: { type: 'number', description: 'Number of snapshots created' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Portfolio not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        snapshotsCreated: { type: 'number' }
      }
    }
  })
  async testSnapshotCreation(@Param('portfolioId') portfolioId: string) {
    this.logger.log(`Testing snapshot creation for portfolio: ${portfolioId}`);
    return await this.automatedSnapshotService.testSnapshotCreation(portfolioId);
  }

  /**
   * Get information about the automated snapshot schedule
   */
  @Get('schedule-info')
  @ApiOperation({ 
    summary: 'Get schedule information',
    description: 'Returns information about the automated snapshot schedule'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Schedule information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        cronExpression: { type: 'string', description: 'Cron expression for the schedule' },
        timezone: { type: 'string', description: 'Timezone for the schedule' },
        description: { type: 'string', description: 'Human-readable description of the schedule' },
        nextExecution: { type: 'string', description: 'Next scheduled execution time' }
      }
    }
  })
  getScheduleInfo() {
    this.logger.log('Getting automated snapshot schedule information');
    const status = this.automatedSnapshotService.getStatus();
    return {
      cronExpression: status.cronExpression,
      timezone: status.timezone,
      description: status.scheduleDescription,
      nextExecution: status.isEnabled ? `Next execution based on ${status.cronExpression}` : 'Service disabled'
    };
  }

  /**
   * Enable automated snapshot service
   */
  @Post('enable')
  @ApiOperation({ 
    summary: 'Enable automated snapshot service',
    description: 'Enables the automated snapshot service to run on schedule'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service enabled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Success message' },
        enabled: { type: 'boolean', description: 'Service enabled status' }
      }
    }
  })
  async enableService() {
    this.logger.log('Enabling automated snapshot service');
    return await this.automatedSnapshotService.enableService();
  }

  /**
   * Disable automated snapshot service
   */
  @Post('disable')
  @ApiOperation({ 
    summary: 'Disable automated snapshot service',
    description: 'Disables the automated snapshot service from running on schedule'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service disabled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Success message' },
        enabled: { type: 'boolean', description: 'Service enabled status' }
      }
    }
  })
  async disableService() {
    this.logger.log('Disabling automated snapshot service');
    return await this.automatedSnapshotService.disableService();
  }
}
