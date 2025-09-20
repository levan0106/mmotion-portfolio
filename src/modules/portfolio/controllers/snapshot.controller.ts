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

@ApiTags('Snapshots')
@Controller('snapshots')
export class SnapshotController {
  private readonly logger = new Logger(SnapshotController.name);

  constructor(
    private readonly snapshotService: SnapshotService,
    @Inject(forwardRef(() => PortfolioSnapshotService))
    private readonly portfolioSnapshotService: PortfolioSnapshotService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new snapshot' })
  @ApiCreatedResponse({
    description: 'Snapshot created successfully',
    type: SnapshotResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data or snapshot already exists' })
  @ApiNotFoundResponse({ description: 'Portfolio or asset not found' })
  async createSnapshot(@Body() createDto: CreateSnapshotDto): Promise<SnapshotResponseDto> {
    const snapshot = await this.snapshotService.createSnapshot({
      ...createDto,
      snapshotDate: new Date(createDto.snapshotDate),
    });
    return this.mapToResponseDto(snapshot);
  }

  @Post('portfolio/:portfolioId')
  @ApiOperation({ summary: 'Create snapshots for all assets in a portfolio and portfolio snapshot' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiCreatedResponse({
    description: 'Portfolio snapshots created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        assetSnapshots: { type: 'array', items: { $ref: '#/components/schemas/SnapshotResponseDto' } },
        portfolioSnapshot: { type: 'object' },
        assetCount: { type: 'number' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Portfolio not found' })
  async createPortfolioSnapshot(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Body() body: {
      snapshotDate?: string;
      granularity?: SnapshotGranularity;
      createdBy?: string;
    } = {},
  ): Promise<{ 
    message: string; 
    assetSnapshots: SnapshotResponseDto[]; 
    portfolioSnapshot: any;
    assetCount: number;
  }> {
    const date = body.snapshotDate ? new Date(body.snapshotDate) : new Date();
    const granularityValue = body.granularity || SnapshotGranularity.DAILY;
    
    // Create asset snapshots first
    const assetSnapshots = await this.snapshotService.createPortfolioSnapshot(
      portfolioId,
      date,
      granularityValue,
      body.createdBy,
    );
    
    // Portfolio snapshot is already created by createPortfolioSnapshot method
    // No need to create it again here to avoid duplicate calls
    
    const response = {
      message: assetSnapshots.length > 0 
        ? `Successfully created ${assetSnapshots.length} asset snapshots and portfolio snapshot for portfolio ${portfolioId}`
        : `No assets found in portfolio ${portfolioId}. No snapshots created.`,
      assetSnapshots: assetSnapshots.map(snapshot => this.mapToResponseDto(snapshot)),
      portfolioSnapshot: null, // Portfolio snapshot is created internally by createPortfolioSnapshot
      assetCount: assetSnapshots.length,
    };
    
    this.logger.log(`Portfolio snapshot creation result: ${response.message}`);
    return response;
  }

  @Get()
  @ApiOperation({ summary: 'Get snapshots with query options' })
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
  async getSnapshots(@Query() query: SnapshotQueryDto): Promise<SnapshotResponseDto[]> {
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

  @Get('timeline/aggregated')
  @ApiOperation({ summary: 'Get aggregated timeline data for portfolio' })
  @ApiQuery({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'startDate', description: 'Start date' })
  @ApiQuery({ name: 'endDate', description: 'End date' })
  @ApiQuery({ name: 'granularity', enum: SnapshotGranularity, description: 'Snapshot granularity', required: false })
  @ApiOkResponse({
    description: 'Aggregated timeline data retrieved successfully',
    type: [SnapshotAggregationDto],
  })
  async getAggregatedTimelineData(
    @Query('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('granularity') granularity?: SnapshotGranularity,
  ): Promise<SnapshotAggregationDto[]> {
    const results = await this.snapshotService.getAggregatedTimelineData(
      portfolioId,
      new Date(startDate),
      new Date(endDate),
      granularity || SnapshotGranularity.DAILY,
    );
    
    return results.map(result => ({
      ...result,
      snapshotDate: result.snapshotDate instanceof Date 
        ? result.snapshotDate.toISOString().split('T')[0]
        : result.snapshotDate,
    }));
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
  @ApiOkResponse({
    description: 'Portfolios with snapshots retrieved successfully',
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
  async getPortfoliosWithSnapshots() {
    return await this.snapshotService.getPortfoliosWithSnapshots();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get snapshot by ID' })
  @ApiParam({ name: 'id', description: 'Snapshot ID' })
  @ApiOkResponse({
    description: 'Snapshot retrieved successfully',
    type: SnapshotResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Snapshot not found' })
  async getSnapshotById(@Param('id', ParseUUIDPipe) id: string): Promise<SnapshotResponseDto> {
    const snapshot = await this.snapshotService.getSnapshotById(id);
    return this.mapToResponseDto(snapshot);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update snapshot' })
  @ApiParam({ name: 'id', description: 'Snapshot ID' })
  @ApiOkResponse({
    description: 'Snapshot updated successfully',
    type: SnapshotResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Snapshot not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async updateSnapshot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSnapshotDto,
  ): Promise<SnapshotResponseDto> {
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
  @ApiOperation({ summary: 'Bulk recalculate snapshots for portfolio' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'snapshotDate', description: 'Specific snapshot date to recalculate', required: false })
  @ApiOkResponse({
    description: 'Snapshots recalculated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        updatedCount: { type: 'number' },
      },
    },
  })
  async bulkRecalculateSnapshots(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('snapshotDate') snapshotDate?: string,
  ) {
    const date = snapshotDate ? new Date(snapshotDate) : undefined;
    const updatedCount = await this.snapshotService.bulkRecalculateSnapshots(portfolioId, date);
    return {
      message: `Successfully recalculated ${updatedCount} snapshots`,
      updatedCount,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete snapshot' })
  @ApiParam({ name: 'id', description: 'Snapshot ID' })
  @ApiOkResponse({ description: 'Snapshot deleted successfully' })
  @ApiNotFoundResponse({ description: 'Snapshot not found' })
  async deleteSnapshot(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.snapshotService.deleteSnapshot(id);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard delete snapshot' })
  @ApiParam({ name: 'id', description: 'Snapshot ID' })
  @ApiOkResponse({ description: 'Snapshot permanently deleted' })
  @ApiNotFoundResponse({ description: 'Snapshot not found' })
  async hardDeleteSnapshot(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.snapshotService.hardDeleteSnapshot(id);
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Clean up old snapshots based on retention policy' })
  @ApiQuery({ name: 'portfolioId', description: 'Portfolio ID', required: false })
  @ApiOkResponse({
    description: 'Old snapshots cleaned up successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        cleanedCount: { type: 'number' },
      },
    },
  })
  async cleanupOldSnapshots(@Query('portfolioId') portfolioId?: string) {
    const cleanedCount = await this.snapshotService.cleanupOldSnapshots(portfolioId);
    return {
      message: `Successfully cleaned up ${cleanedCount} old snapshots`,
      cleanedCount,
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

    return await this.snapshotService.deleteSnapshotsByDateRange(
      portfolioId,
      start,
      end,
      granularity,
    );
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

    return await this.snapshotService.deleteSnapshotsByDate(
      portfolioId,
      date,
      granularity,
    );
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
    return await this.snapshotService.deleteSnapshotsByGranularity(
      portfolioId,
      granularity,
    );
  }
}
