import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PriceHistoryService, CreatePriceHistoryDto, PriceHistoryQueryDto } from '../services/price-history.service';
import { AssetPriceHistory } from '../entities/asset-price-history.entity';
import { PriceHistoryStatsDto } from '../services/price-history.service';

/**
 * Controller for managing asset price history.
 * Provides REST API endpoints for price history operations.
 */
@ApiTags('Price History')
@Controller('api/v1/price-history')
export class PriceHistoryController {
  constructor(private readonly priceHistoryService: PriceHistoryService) {}

  /**
   * Create a new price history record.
   * @param createDto - Price history creation data
   * @returns Created price history record
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create price history record',
    description: 'Create a new price history record for an asset',
  })
  @ApiBody({
    type: Object,
    description: 'Price history creation data',
    schema: {
      type: 'object',
      properties: {
        assetId: { type: 'string', format: 'uuid', description: 'Asset ID' },
        price: { type: 'number', description: 'Price value' },
        priceType: { type: 'string', description: 'Price type (MANUAL, MARKET_DATA, EXTERNAL, CALCULATED)' },
        priceSource: { type: 'string', description: 'Price source (USER, MARKET_DATA_SERVICE, EXTERNAL_API, CALCULATED)' },
        changeReason: { type: 'string', description: 'Reason for price change' },
        metadata: { type: 'object', description: 'Additional metadata' },
      },
      required: ['assetId', 'price', 'priceType', 'priceSource'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Price history record created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        assetId: { type: 'string', format: 'uuid' },
        price: { type: 'number' },
        priceType: { type: 'string' },
        priceSource: { type: 'string' },
        changeReason: { type: 'string' },
        metadata: { type: 'object' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  async createPriceHistory(
    @Body(ValidationPipe) createDto: CreatePriceHistoryDto,
  ): Promise<AssetPriceHistory> {
    return this.priceHistoryService.createPriceHistory(createDto);
  }

  /**
   * Get price history for a specific asset.
   * @param assetId - Asset ID
   * @param query - Query parameters
   * @returns Array of price history records
   */
  @Get('asset/:assetId')
  @ApiOperation({
    summary: 'Get price history for asset',
    description: 'Retrieve price history records for a specific asset with optional filtering',
  })
  @ApiParam({
    name: 'assetId',
    type: 'string',
    format: 'uuid',
    description: 'Asset ID',
  })
  @ApiQuery({
    name: 'startDate',
    type: 'string',
    required: false,
    description: 'Start date filter (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'endDate',
    type: 'string',
    required: false,
    description: 'End date filter (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'priceType',
    type: 'string',
    required: false,
    description: 'Price type filter',
  })
  @ApiQuery({
    name: 'priceSource',
    type: 'string',
    required: false,
    description: 'Price source filter',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Maximum number of records to return',
  })
  @ApiQuery({
    name: 'offset',
    type: 'number',
    required: false,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'orderBy',
    type: 'string',
    enum: ['createdAt', 'price'],
    required: false,
    description: 'Field to order by',
  })
  @ApiQuery({
    name: 'orderDirection',
    type: 'string',
    enum: ['ASC', 'DESC'],
    required: false,
    description: 'Order direction',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price history records retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          assetId: { type: 'string', format: 'uuid' },
          price: { type: 'number' },
          priceType: { type: 'string' },
          priceSource: { type: 'string' },
          changeReason: { type: 'string' },
          metadata: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  async getPriceHistory(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query(ValidationPipe) query: PriceHistoryQueryDto,
  ): Promise<AssetPriceHistory[]> {
    return this.priceHistoryService.getPriceHistory(assetId, query);
  }

  /**
   * Get price history by date range.
   * @param assetId - Asset ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of price history records
   */
  @Get('asset/:assetId/date-range')
  @ApiOperation({
    summary: 'Get price history by date range',
    description: 'Retrieve price history records for an asset within a specific date range',
  })
  @ApiParam({
    name: 'assetId',
    type: 'string',
    format: 'uuid',
    description: 'Asset ID',
  })
  @ApiQuery({
    name: 'startDate',
    type: 'string',
    required: true,
    description: 'Start date (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'endDate',
    type: 'string',
    required: true,
    description: 'End date (ISO 8601 format)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price history records retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid date range',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  async getPriceHistoryByDateRange(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<AssetPriceHistory[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.priceHistoryService.getPriceHistoryByDateRange(assetId, start, end);
  }

  /**
   * Get latest price history for an asset.
   * @param assetId - Asset ID
   * @param limit - Number of latest records to return
   * @returns Array of latest price history records
   */
  @Get('asset/:assetId/latest')
  @ApiOperation({
    summary: 'Get latest price history',
    description: 'Retrieve the latest price history records for an asset',
  })
  @ApiParam({
    name: 'assetId',
    type: 'string',
    format: 'uuid',
    description: 'Asset ID',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Number of latest records to return (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Latest price history records retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  async getLatestPriceHistory(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('limit') limit?: number,
  ): Promise<AssetPriceHistory[]> {
    return this.priceHistoryService.getLatestPriceHistory(assetId, limit);
  }

  /**
   * Get price history statistics for an asset.
   * @param assetId - Asset ID
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Price history statistics
   */
  @Get('asset/:assetId/stats')
  @ApiOperation({
    summary: 'Get price history statistics',
    description: 'Retrieve statistical analysis of price history for an asset',
  })
  @ApiParam({
    name: 'assetId',
    type: 'string',
    format: 'uuid',
    description: 'Asset ID',
  })
  @ApiQuery({
    name: 'startDate',
    type: 'string',
    required: false,
    description: 'Start date for statistics calculation (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'endDate',
    type: 'string',
    required: false,
    description: 'End date for statistics calculation (ISO 8601 format)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price history statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalRecords: { type: 'number' },
        priceRange: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' },
            average: { type: 'number' },
          },
        },
        priceChanges: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            positive: { type: 'number' },
            negative: { type: 'number' },
            neutral: { type: 'number' },
          },
        },
        timeRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found or no price history available',
  })
  async getPriceHistoryStats(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PriceHistoryStatsDto> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.priceHistoryService.getPriceHistoryStats(assetId, start, end);
  }

  /**
   * Get price history by price type.
   * @param assetId - Asset ID
   * @param priceType - Price type filter
   * @returns Array of price history records
   */
  @Get('asset/:assetId/type/:priceType')
  @ApiOperation({
    summary: 'Get price history by type',
    description: 'Retrieve price history records for an asset filtered by price type',
  })
  @ApiParam({
    name: 'assetId',
    type: 'string',
    format: 'uuid',
    description: 'Asset ID',
  })
  @ApiParam({
    name: 'priceType',
    type: 'string',
    description: 'Price type filter',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price history records retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  async getPriceHistoryByType(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Param('priceType') priceType: string,
  ): Promise<AssetPriceHistory[]> {
    return this.priceHistoryService.getPriceHistoryByType(assetId, priceType);
  }

  /**
   * Get price history by price source.
   * @param assetId - Asset ID
   * @param priceSource - Price source filter
   * @returns Array of price history records
   */
  @Get('asset/:assetId/source/:priceSource')
  @ApiOperation({
    summary: 'Get price history by source',
    description: 'Retrieve price history records for an asset filtered by price source',
  })
  @ApiParam({
    name: 'assetId',
    type: 'string',
    format: 'uuid',
    description: 'Asset ID',
  })
  @ApiParam({
    name: 'priceSource',
    type: 'string',
    description: 'Price source filter',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price history records retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  async getPriceHistoryBySource(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Param('priceSource') priceSource: string,
  ): Promise<AssetPriceHistory[]> {
    return this.priceHistoryService.getPriceHistoryBySource(assetId, priceSource);
  }

  /**
   * Check if asset has price history.
   * @param assetId - Asset ID
   * @returns True if asset has price history, false otherwise
   */
  @Get('asset/:assetId/exists')
  @ApiOperation({
    summary: 'Check if asset has price history',
    description: 'Check whether an asset has any price history records',
  })
  @ApiParam({
    name: 'assetId',
    type: 'string',
    format: 'uuid',
    description: 'Asset ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price history existence check completed',
    schema: {
      type: 'object',
      properties: {
        hasPriceHistory: { type: 'boolean' },
        count: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  async hasPriceHistory(
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ): Promise<{ hasPriceHistory: boolean; count: number }> {
    const hasHistory = await this.priceHistoryService.hasPriceHistory(assetId);
    const count = await this.priceHistoryService.getPriceHistoryCount(assetId);
    return { hasPriceHistory: hasHistory, count };
  }

  /**
   * Delete old price history records.
   * @param assetId - Asset ID (optional)
   * @param olderThanDays - Delete records older than this many days
   * @returns Number of deleted records
   */
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cleanup old price history',
    description: 'Delete old price history records to maintain database performance',
  })
  @ApiBody({
    type: Object,
    description: 'Cleanup parameters',
    schema: {
      type: 'object',
      properties: {
        assetId: { type: 'string', format: 'uuid', description: 'Asset ID (optional)' },
        olderThanDays: { type: 'number', description: 'Delete records older than this many days (default: 365)' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Old price history records deleted successfully',
    schema: {
      type: 'object',
      properties: {
        deletedCount: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async deleteOldPriceHistory(
    @Body('assetId') assetId?: string,
    @Body('olderThanDays') olderThanDays: number = 365,
  ): Promise<{ deletedCount: number; message: string }> {
    const deletedCount = await this.priceHistoryService.deleteOldPriceHistory(assetId, olderThanDays);
    return {
      deletedCount,
      message: `Successfully deleted ${deletedCount} old price history records`,
    };
  }
}
