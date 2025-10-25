import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { SnapshotService } from '../services/snapshot.service';
import { PortfolioSnapshotService } from '../services/portfolio-snapshot.service';
import { PerformanceSnapshotService } from '../services/performance-snapshot.service';
import { PortfolioService } from '../services/portfolio.service';
import { SnapshotTrackingService } from '../services/snapshot-tracking.service';
import { CashFlowService } from '../services/cash-flow.service';
import { AccountValidationService } from '../../shared/services/account-validation.service';
import {
  CreateSnapshotDto,
  UpdateSnapshotDto,
  SnapshotResponseDto,
  SnapshotQueryDto,
  SnapshotTimelineQueryDto,
  SnapshotStatisticsDto,
  SnapshotAggregationDto,
} from '../dto/snapshot.dto';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { SnapshotTrackingType } from '../entities/snapshot-tracking.entity';
import { normalizeDateToString } from '../utils/date-normalization.util';
import { randomUUID } from 'crypto';

@ApiTags('Snapshots')
@Controller('api/v1/snapshots')
export class SnapshotController {
  private readonly logger = new Logger(SnapshotController.name);

  constructor(
    private readonly snapshotService: SnapshotService,
    @Inject(forwardRef(() => PortfolioSnapshotService))
    private readonly portfolioSnapshotService: PortfolioSnapshotService,
    @Inject(forwardRef(() => PerformanceSnapshotService))
    private readonly performanceSnapshotService: PerformanceSnapshotService,
    @Inject(forwardRef(() => PortfolioService))
    private readonly portfolioService: PortfolioService,
    private readonly snapshotTrackingService: SnapshotTrackingService,
    private readonly cashFlowService: CashFlowService,
    private readonly accountValidationService: AccountValidationService,
  ) {}

  @Post('portfolio/bulk')
  @ApiOperation({ summary: 'Create snapshots for multiple portfolios (supports both single date and date range)' })
  @ApiCreatedResponse({
    description: 'Portfolio snapshots created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        totalPortfolios: { type: 'number' },
        totalSnapshots: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              portfolioId: { type: 'string' },
              portfolioName: { type: 'string' },
              success: { type: 'boolean' },
              assetSnapshots: { type: 'array', items: { $ref: '#/components/schemas/SnapshotResponseDto' } },
              portfolioSnapshot: { type: 'object' },
              assetCount: { type: 'number' },
              snapshotsCreated: { type: 'number' },
              datesProcessed: { type: 'array', items: { type: 'string' } },
              error: { type: 'string' }
            }
          }
        }
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Portfolio not found' })
  @ApiBadRequestResponse({ description: 'Invalid date range or date format' })
  async createPortfolioSnapshots(
    @Body() body: {
      portfolioIds: string[];
      startDate?: string;
      endDate?: string;
      granularity?: SnapshotGranularity;
      createdBy?: string;
    },
  ): Promise<{ 
    message: string; 
    totalPortfolios: number;
    totalSnapshots: number;
    results: Array<{
      portfolioId: string;
      portfolioName: string;
      success: boolean;
      assetSnapshots: SnapshotResponseDto[];
      portfolioSnapshot: any;
      assetCount: number;
      snapshotsCreated: number;
      datesProcessed: string[];
      error?: string;
    }>;
  }> {
    const granularityValue = body.granularity || SnapshotGranularity.DAILY;

    // Normalize to date range: if single date, set startDate = endDate
    let startDate: Date;
    let endDate: Date;
    
    if (body.startDate && body.endDate) {
      // Date range mode
      startDate = new Date(body.startDate);
      endDate = new Date(body.endDate);
    } else if (body.startDate) {
      // Single date mode - normalize to date range (startDate = endDate)
      startDate = new Date(body.startDate);
      endDate = new Date(body.startDate);
    } else {
      // Default to today
      startDate = new Date();
      endDate = new Date();
    }
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD format.');
    }
    
    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date.');
    }
    
    if (startDate > new Date()) {
      throw new BadRequestException('Start date cannot be in the future.');
    }

    // Validate portfolio IDs
    if (!body.portfolioIds || body.portfolioIds.length === 0) {
      throw new BadRequestException('portfolioIds array is required and cannot be empty.');
    }

    const results: Array<{
      portfolioId: string;
      portfolioName: string;
      success: boolean;
      assetSnapshots: SnapshotResponseDto[];
      portfolioSnapshot: any;
      assetCount: number;
      snapshotsCreated: number;
      datesProcessed: string[];
      error?: string;
    }> = [];

    let totalSnapshots = 0;

    this.logger.log(`Creating snapshots for ${body.portfolioIds.length} portfolios from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    const executionId = randomUUID();
    
    // Process each portfolio
    for (const portfolioId of body.portfolioIds) {
      try {
        let datesProcessed: string[] = [];
        let portfolioSnapshots = 0;
        let allAssetSnapshots: any[] = [];
        let assetCount = 0;

        // Get portfolio name for response
        let portfolioName = 'Unknown Portfolio';
        try {
          const portfolio = await this.portfolioService.getPortfolioDetails(portfolioId);
          portfolioName = portfolio.name;
          // Get asset count separately
          const assets = await this.portfolioService.getPortfolioAssets(portfolioId);
          assetCount = assets.length;
        } catch (error) {
          this.logger.warn(`Could not get portfolio info for ${portfolioId}: ${error.message}`);
        }

        // Use common method to create snapshots for date range
        const snapshotResult = await this.createSnapshotsForDateRange(
          portfolioId,
          portfolioName,
          startDate,
          endDate,
          granularityValue,
          executionId,
          body.createdBy || 'api-user',
          SnapshotTrackingType.MANUAL
        );
        
        // Process results from common method
        portfolioSnapshots = snapshotResult.totalSnapshots;
        datesProcessed = snapshotResult.results
          .filter(r => r.success)
          .map(r => r.date);
        allAssetSnapshots = []; // Will be populated by individual snapshot creation
        
        // Log summary
        this.logger.log(`Created ${portfolioSnapshots} snapshots for portfolio ${portfolioName} across ${snapshotResult.successfulDates} dates. Tracking ID: ${executionId}`);

        totalSnapshots += portfolioSnapshots;

        results.push({
          portfolioId,
          portfolioName,
          success: true,
          assetSnapshots: allAssetSnapshots.map(snapshot => this.mapToResponseDto(snapshot)),
          portfolioSnapshot: null, // Portfolio snapshot is created within createPortfolioSnapshot
          assetCount,
          snapshotsCreated: portfolioSnapshots,
          datesProcessed,
        });

      } catch (error) {
        this.logger.error(`Failed to create snapshots for portfolio ${portfolioId}: ${error.message}`);
        
        results.push({
          portfolioId,
          portfolioName: 'Unknown Portfolio',
          success: false,
          assetSnapshots: [],
          portfolioSnapshot: null,
          assetCount: 0,
          snapshotsCreated: 0,
          datesProcessed: [],
          error: error.message,
        });
      }
    }

    const successfulPortfolios = results.filter(r => r.success).length;

    const response = {
      message: `Successfully processed ${successfulPortfolios}/${body.portfolioIds.length} portfolios. Created ${totalSnapshots} total snapshots.`,
      totalPortfolios: body.portfolioIds.length,
      totalSnapshots,
      results,
    };
    
    this.logger.log(`Portfolio snapshot creation result: ${response.message}`);
    return response;
  }


  @Get()
  @ApiOperation({ summary: 'Get snapshots with query options' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiQuery({ name: 'portfolioId', description: 'Portfolio ID', required: false })
  @ApiQuery({ name: 'assetId', description: 'Asset ID', required: false })
  @ApiQuery({ name: 'assetSymbol', description: 'Asset symbol', required: false })
  @ApiQuery({ name: 'granularity', enum: SnapshotGranularity, description: 'Snapshot granularity', required: false })
  @ApiQuery({ name: 'startDate', description: 'Start date', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date', required: false })
  @ApiQuery({ name: 'isActive', description: 'Is active', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiQuery({ name: 'orderBy', description: 'Order by field', required: false })
  @ApiQuery({ name: 'orderDirection', description: 'Order direction', required: false })
  @ApiOkResponse({
    description: 'Snapshots retrieved successfully',
    type: [SnapshotResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Portfolio does not belong to account' })
  async getSnapshots(@Query() query: SnapshotQueryDto & { accountId: string }): Promise<SnapshotResponseDto[]> {
    if (!query.accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    
    // If portfolioId is provided, validate portfolio ownership
    if (query.portfolioId) {
      await this.accountValidationService.validatePortfolioOwnership(query.portfolioId, query.accountId);
    }
    const options = {
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      offset: query.page ? (query.page - 1) * (query.limit || 10) : undefined,
    };
    
    const snapshots = await this.snapshotService.getSnapshots(options);
    return snapshots.map(snapshot => this.mapToResponseDto(snapshot));
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Get snapshots with pagination' })
  @ApiQuery({ name: 'portfolioId', description: 'Portfolio ID', required: false })
  @ApiQuery({ name: 'assetId', description: 'Asset ID', required: false })
  @ApiQuery({ name: 'assetSymbol', description: 'Asset symbol', required: false })
  @ApiQuery({ name: 'granularity', enum: SnapshotGranularity, description: 'Snapshot granularity', required: false })
  @ApiQuery({ name: 'startDate', description: 'Start date', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date', required: false })
  @ApiQuery({ name: 'isActive', description: 'Is active', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiQuery({ name: 'orderBy', description: 'Order by field', required: false })
  @ApiQuery({ name: 'orderDirection', description: 'Order direction', required: false })
  @ApiOkResponse({
    description: 'Paginated snapshots retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/SnapshotResponseDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
        hasNext: { type: 'boolean' },
        hasPrev: { type: 'boolean' },
      },
    },
  })
  async getSnapshotsWithPagination(@Query() query: SnapshotQueryDto) {
    const options = {
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      offset: query.page ? (query.page - 1) * (query.limit || 10) : undefined,
    };
    
    const result = await this.snapshotService.getSnapshotsWithPagination(options);
    return {
      ...result,
      data: result.data.map(snapshot => this.mapToResponseDto(snapshot)),
    };
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Get timeline data for portfolio' })
  @ApiQuery({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'startDate', description: 'Start date' })
  @ApiQuery({ name: 'endDate', description: 'End date' })
  @ApiQuery({ name: 'granularity', enum: SnapshotGranularity, description: 'Snapshot granularity', required: false })
  @ApiQuery({ name: 'assetId', description: 'Asset ID', required: false })
  @ApiQuery({ name: 'assetSymbol', description: 'Asset symbol', required: false })
  @ApiOkResponse({
    description: 'Timeline data retrieved successfully',
    type: [SnapshotResponseDto],
  })
  async getTimelineData(@Query() query: SnapshotTimelineQueryDto): Promise<SnapshotResponseDto[]> {
    const snapshots = await this.snapshotService.getTimelineData({
      ...query,
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
    });
    return snapshots.map(snapshot => this.mapToResponseDto(snapshot));
  }

  @Get('latest/:portfolioId')
  @ApiOperation({ summary: 'Get latest snapshot for portfolio' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'assetId', description: 'Asset ID', required: false })
  @ApiQuery({ name: 'granularity', enum: SnapshotGranularity, description: 'Snapshot granularity', required: false })
  @ApiOkResponse({
    description: 'Latest snapshot retrieved successfully',
    type: SnapshotResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Snapshot not found' })
  async getLatestSnapshot(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('assetId') assetId?: string,
    @Query('granularity') granularity?: SnapshotGranularity,
  ): Promise<SnapshotResponseDto | null> {
    const snapshot = await this.snapshotService.getLatestSnapshot(portfolioId, assetId, granularity);
    return snapshot ? this.mapToResponseDto(snapshot) : null;
  }

  @Get('statistics/:portfolioId')
  @ApiOperation({ summary: 'Get snapshot statistics for portfolio' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiOkResponse({
    description: 'Snapshot statistics retrieved successfully',
    type: SnapshotStatisticsDto,
  })
  async getSnapshotStatistics(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
  ): Promise<SnapshotStatisticsDto> {
    const stats = await this.snapshotService.getSnapshotStatistics(portfolioId);
    return {
      ...stats,
      latestSnapshotDate: stats.latestSnapshotDate instanceof Date 
        ? stats.latestSnapshotDate.toISOString().split('T')[0]
        : stats.latestSnapshotDate,
      oldestSnapshotDate: stats.oldestSnapshotDate instanceof Date 
        ? stats.oldestSnapshotDate.toISOString().split('T')[0]
        : stats.oldestSnapshotDate,
    };
  }

  @Get('portfolios')
  @ApiOperation({ summary: 'Get portfolios that have snapshots' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Filter by account ID' })
  @ApiOkResponse({
    description: 'Portfolio snapshots retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          portfolioId: { type: 'string' },
          portfolioName: { type: 'string' },
          snapshotCount: { type: 'number' },
          latestSnapshotDate: { type: 'string', format: 'date' },
          oldestSnapshotDate: { type: 'string', format: 'date' },
        },
      },
    },
  })
  async getPortfoliosWithSnapshots(@Query('accountId') accountId: string) {
    return await this.portfolioSnapshotService.getPortfoliosWithSnapshots(accountId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get snapshot by ID' })
  @ApiParam({ name: 'id', description: 'Snapshot ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiOkResponse({
    description: 'Snapshot retrieved successfully',
    type: SnapshotResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Snapshot not found' })
  @ApiResponse({ status: 403, description: 'Snapshot does not belong to account' })
  async getSnapshotById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
  ): Promise<SnapshotResponseDto> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    
    const snapshot = await this.snapshotService.getSnapshotById(id);
    
    // Validate portfolio ownership for the snapshot's portfolio
    await this.accountValidationService.validatePortfolioOwnership(snapshot.portfolioId, accountId);
    
    return this.mapToResponseDto(snapshot);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update snapshot' })
  @ApiParam({ name: 'id', description: 'Snapshot ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiOkResponse({
    description: 'Snapshot updated successfully',
    type: SnapshotResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Snapshot not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Snapshot does not belong to account' })
  async updateSnapshot(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
    @Body() updateDto: UpdateSnapshotDto,
  ): Promise<SnapshotResponseDto> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    
    // Get snapshot first to validate portfolio ownership
    const existingSnapshot = await this.snapshotService.getSnapshotById(id);
    await this.accountValidationService.validatePortfolioOwnership(existingSnapshot.portfolioId, accountId);
    
    const snapshot = await this.snapshotService.updateSnapshot(id, updateDto);
    return this.mapToResponseDto(snapshot);
  }

  @Put(':id/recalculate')
  @ApiOperation({ summary: 'Recalculate snapshot data from current portfolio state' })
  @ApiParam({ name: 'id', description: 'Snapshot ID' })
  @ApiOkResponse({
    description: 'Snapshot recalculated successfully',
    type: SnapshotResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Snapshot not found' })
  async recalculateSnapshot(@Param('id', ParseUUIDPipe) id: string): Promise<SnapshotResponseDto> {
    const snapshot = await this.snapshotService.recalculateSnapshot(id);
    return this.mapToResponseDto(snapshot);
  }

  @Post('bulk-recalculate/:portfolioId')
  @ApiOperation({ summary: 'Bulk recalculate snapshots for portfolio from first transaction date to current date' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiQuery({ name: 'snapshotDate', description: 'Specific snapshot date to recalculate (optional)', required: false })
  @ApiQuery({ name: 'useDateRange', description: 'Calculate from first transaction date to current date (default: true)', required: false })
  @ApiOkResponse({
    description: 'Snapshots recalculated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        updatedCount: { type: 'number' },
        trackingId: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            totalDates: { type: 'number' },
            successfulDates: { type: 'number' },
            failedDates: { type: 'number' },
            totalSnapshots: { type: 'number' }
          }
        },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              success: { type: 'boolean' },
              snapshotsCreated: { type: 'number' },
              error: { type: 'string' }
            }
          }
        },
        dateRange: { 
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' }
          }
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Portfolio does not belong to account' })
  async bulkRecalculateSnapshots(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('accountId') accountId: string,
    @Query('snapshotDate') snapshotDate?: string
  ) {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    
    // Validate portfolio ownership
    await this.accountValidationService.validatePortfolioOwnership(portfolioId, accountId);
    
    // Get portfolio info for tracking
    let portfolioName = 'Unknown Portfolio';
    try {
      const portfolio = await this.portfolioService.getPortfolioDetails(portfolioId);
      if (portfolio) {
        portfolioName = portfolio.name;
      }
    } catch (error) {
      this.logger.warn(`Could not get portfolio info for ${portfolioId}: ${error.message}`);
    }
    
    let startDate: Date;
    let endDate: Date;
    let dateRange: { startDate: string; endDate: string } | undefined;
    
    if (snapshotDate) {
      // Single date mode
      startDate = new Date(snapshotDate);
      endDate = new Date(snapshotDate);
    } else {
      // Enhanced mode: from first transaction date to current date
      try {
        const firstTransactionDate = await this.cashFlowService.getFirstTransactionDate(portfolioId);
        
        if (firstTransactionDate) {
          startDate = new Date(firstTransactionDate.setHours(12, 0, 0, 0));
          endDate = new Date();
          dateRange = {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          };
          
          // this.logger.log(`Using date range from first transaction (${dateRange.startDate}) to (${dateRange.endDate}) for portfolio ${portfolioId}`);
        } else {
          // Fallback to current date if no transactions found
          startDate = new Date();
          endDate = new Date();
          this.logger.warn(`No transactions found for portfolio ${portfolioId}, using current date only`);
        }
      } catch (error) {
        this.logger.error(`Error getting first transaction date for portfolio ${portfolioId}:`, error);
        // Fallback to current date
        startDate = new Date();
        endDate = new Date();
      }
    }
    
    // Use common method to create snapshots for date range
    const executionId = randomUUID();
    const snapshotResult = await this.createSnapshotsForDateRange(
      portfolioId,
      portfolioName,
      startDate,
      endDate,
      SnapshotGranularity.DAILY,
      executionId,
      accountId || 'api-recalculation',
      SnapshotTrackingType.MANUAL
    );
    
    return {
      message: `Successfully recalculated ${snapshotResult.totalSnapshots} snapshots across ${snapshotResult.successfulDates} dates`,
      updatedCount: snapshotResult.totalSnapshots,
      trackingId: executionId,
      summary: {
        totalDates: snapshotResult.results.length,
        successfulDates: snapshotResult.successfulDates,
        failedDates: snapshotResult.failedDates,
        totalSnapshots: snapshotResult.totalSnapshots
      },
      results: snapshotResult.results,
      ...(dateRange && { dateRange }),
    };
  }

  /**
   * Generate date range from start date to end date (inclusive)
   */
  private generateDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    // this.logger.log(`generateDateRange: Generated ${dates.length} dates from ${startDate} to ${endDate}`);
    // this.logger.log(`generateDateRange: Generated ${dates.length} dates from ${dates[0]} to ${dates[dates.length - 1]}`);
    return dates;
  }

  /**
   * Common method to create snapshots for a portfolio across a date range
   */
  private async createSnapshotsForDateRange(
    portfolioId: string,
    portfolioName: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY,
    executionId?: string,
    createdBy: string = 'api-user',
    trackingType: SnapshotTrackingType = SnapshotTrackingType.MANUAL
  ): Promise<{
    totalSnapshots: number;
    successfulDates: number;
    failedDates: number;
    results: Array<{
      date: string;
      success: boolean;
      snapshotsCreated?: number;
      error?: string;
    }>;
  }> {
    const datesToProcess = this.generateDateRange(startDate, endDate);
    const finalExecutionId = executionId || randomUUID();
    
    let totalSnapshots = 0;
    let successfulDates = 0;
    let failedDates = 0;
    const results = [];
    
    this.logger.log(`createSnapshotsForDateRange: Processing ${datesToProcess.length} dates from ${datesToProcess[0]} to ${datesToProcess[datesToProcess.length - 1]}`);
    
    // Process each date in the range
    for (const date of datesToProcess) {
      try {
        this.logger.log(`Creating snapshots for date: ${date.toISOString().split('T')[0]}`);
        
        const result = await this.snapshotTrackingService.createSnapshotsWithTracking(
          portfolioId,
          portfolioName,
          date,
          granularity,
          finalExecutionId,
          createdBy,
          true, // Include performance snapshots
          trackingType
        );
        
        if (result.success) {
          totalSnapshots += result.assetSnapshots.length;
          successfulDates++;
          results.push({
            date: date.toISOString().split('T')[0],
            success: true,
            snapshotsCreated: result.assetSnapshots.length
          });
          this.logger.log(`✅ Successfully created ${result.assetSnapshots.length} snapshots for ${date.toISOString().split('T')[0]}`);
        } else {
          failedDates++;
          results.push({
            date: date.toISOString().split('T')[0],
            success: false,
            error: result.error
          });
          this.logger.error(`❌ Failed to create snapshots for ${date.toISOString().split('T')[0]}: ${result.error}`);
        }
      } catch (error) {
        failedDates++;
        results.push({
          date: date.toISOString().split('T')[0],
          success: false,
          error: error.message
        });
        this.logger.error(`❌ Exception creating snapshots for ${date.toISOString().split('T')[0]}: ${error.message}`);
      }
    }
    
    this.logger.log(`Completed processing for portfolio ${portfolioId}: ${successfulDates} successful dates, ${failedDates} failed dates, ${totalSnapshots} total snapshots created`);
    
    return {
      totalSnapshots,
      successfulDates,
      failedDates,
      results
    };
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(snapshot: any): SnapshotResponseDto {
    // Handle date formatting - snapshotDate might be a string or Date object
    const snapshotDate = snapshot.snapshotDate instanceof Date 
      ? snapshot.snapshotDate.toISOString().split('T')[0]
      : snapshot.snapshotDate;

    return {
      id: snapshot.id,
      portfolioId: snapshot.portfolioId,
      assetId: snapshot.assetId,
      assetSymbol: snapshot.assetSymbol,
      assetType: snapshot.assetType,
      snapshotDate: snapshotDate,
      granularity: snapshot.granularity,
      quantity: parseFloat(snapshot.quantity) || 0,
      currentPrice: parseFloat(snapshot.currentPrice) || 0,
      currentValue: parseFloat(snapshot.currentValue) || 0,
      costBasis: parseFloat(snapshot.costBasis) || 0,
      avgCost: parseFloat(snapshot.avgCost) || 0,
      realizedPl: parseFloat(snapshot.realizedPl) || 0,
      unrealizedPl: parseFloat(snapshot.unrealizedPl) || 0,
      totalPl: parseFloat(snapshot.totalPl) || 0,
      allocationPercentage: parseFloat(snapshot.allocationPercentage) || 0,
      portfolioTotalValue: parseFloat(snapshot.portfolioTotalValue) || 0,
      returnPercentage: parseFloat(snapshot.returnPercentage) || 0,
      dailyReturn: parseFloat(snapshot.dailyReturn) || 0,
      cumulativeReturn: parseFloat(snapshot.cumulativeReturn) || 0,
      isActive: snapshot.isActive,
      createdBy: snapshot.createdBy,
      notes: snapshot.notes,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    };
  }

  /**
   * Delete snapshots by date range
   */
  @Delete('portfolio/:portfolioId/date-range')
  @ApiOperation({ summary: 'Delete snapshots by date range' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)', required: true })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)', required: true })
  @ApiQuery({ name: 'granularity', description: 'Snapshot granularity', required: false, enum: SnapshotGranularity })
  @ApiOkResponse({ description: 'Snapshots deleted successfully' })
  async deleteSnapshotsByDateRange(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('granularity') granularity?: SnapshotGranularity,
  ): Promise<{ deletedCount: number; message: string }> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    
    if (start > end) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Delete basic snapshots
    const basicResult = await this.snapshotService.deleteSnapshotsByDateRange(
      portfolioId,
      start,
      end,
      granularity,
    );

    // Delete performance snapshots
    let performanceResult = { deletedCount: 0, message: 'No performance snapshots to delete' };
    try {
      performanceResult = await this.performanceSnapshotService.deletePerformanceSnapshotsByDateRange(
        portfolioId,
        start,
        end,
        granularity,
      );
    } catch (error) {
      this.logger.error(`Failed to delete performance snapshots for portfolio ${portfolioId}:`, error);
      // Don't fail the entire operation if performance snapshots deletion fails
    }

    const totalDeleted = basicResult.deletedCount + performanceResult.deletedCount;
    return {
      deletedCount: totalDeleted,
      message: `Deleted ${basicResult.deletedCount} basic snapshots and ${performanceResult.deletedCount} performance snapshots for portfolio ${portfolioId} from ${startDate} to ${endDate}`,
    };
  }

  /**
   * Delete snapshots by specific date
   */
  @Delete('portfolio/:portfolioId/date')
  @ApiOperation({ summary: 'Delete snapshots by specific date' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'snapshotDate', description: 'Snapshot date (YYYY-MM-DD)', required: true })
  @ApiQuery({ name: 'granularity', description: 'Snapshot granularity', required: false, enum: SnapshotGranularity })
  @ApiOkResponse({ description: 'Snapshots deleted successfully' })
  async deleteSnapshotsByDate(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('snapshotDate') snapshotDate: string,
    @Query('granularity') granularity?: SnapshotGranularity,
  ): Promise<{ deletedCount: number; message: string }> {
    const date = new Date(snapshotDate);
    
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    // Delete basic snapshots
    const basicResult = await this.snapshotService.deleteSnapshotsByDate(
      portfolioId,
      date,
      granularity,
    );

    // Delete performance snapshots
    let performanceResult = { deletedCount: 0, message: 'No performance snapshots to delete' };
    try {
      performanceResult = await this.performanceSnapshotService.deletePerformanceSnapshotsByDateRange(
        portfolioId,
        date,
        date,
        granularity,
      );
    } catch (error) {
      this.logger.error(`Failed to delete performance snapshots for portfolio ${portfolioId}:`, error);
      // Don't fail the entire operation if performance snapshots deletion fails
    }

    const totalDeleted = basicResult.deletedCount + performanceResult.deletedCount;
    return {
      deletedCount: totalDeleted,
      message: `Deleted ${basicResult.deletedCount} basic snapshots and ${performanceResult.deletedCount} performance snapshots for portfolio ${portfolioId} on ${snapshotDate}`,
    };
  }

  /**
   * Delete snapshots by granularity
   */
  @Delete('portfolio/:portfolioId/granularity/:granularity')
  @ApiOperation({ summary: 'Delete snapshots by granularity' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiParam({ name: 'granularity', description: 'Snapshot granularity', enum: SnapshotGranularity })
  @ApiOkResponse({ description: 'Snapshots deleted successfully' })
  async deleteSnapshotsByGranularity(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Param('granularity') granularity: SnapshotGranularity,
  ): Promise<{ deletedCount: number; message: string }> {
    // Delete basic snapshots
    const basicResult = await this.snapshotService.deleteSnapshotsByGranularity(
      portfolioId,
      granularity,
    );

    // Delete performance snapshots
    let performanceResult = { deletedCount: 0, message: 'No performance snapshots to delete' };
    try {
      performanceResult = await this.performanceSnapshotService.deletePerformanceSnapshotsByGranularity(
        portfolioId,
        granularity,
      );
    } catch (error) {
      this.logger.error(`Failed to delete performance snapshots for portfolio ${portfolioId}:`, error);
      // Don't fail the entire operation if performance snapshots deletion fails
    }

    const totalDeleted = basicResult.deletedCount + performanceResult.deletedCount;
    return {
      deletedCount: totalDeleted,
      message: `Deleted ${basicResult.deletedCount} basic snapshots and ${performanceResult.deletedCount} performance snapshots for portfolio ${portfolioId} with granularity ${granularity}`,
    };
  }
}
