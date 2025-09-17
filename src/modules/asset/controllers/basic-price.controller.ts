import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
  NotFoundException,
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
import { BasicPriceService } from '../services/basic-price.service';
import { CreateAssetPriceDto } from '../dto/create-asset-price.dto';
import { UpdateAssetPriceDto } from '../dto/update-asset-price.dto';
import { AssetPriceQueryDto } from '../dto/asset-price-query.dto';
import { AssetPriceResponseDto } from '../dto/asset-price-response.dto';

/**
 * Controller for managing asset prices in the Global Assets System.
 * Provides CRUD operations for asset prices and price history.
 * 
 * CR-005 Global Assets System:
 * - Separated price management from asset management
 * - Price history tracking and audit
 * - Multiple price sources support
 * - System resilience with fallback mechanisms
 */
@ApiTags('Asset Prices')
@Controller('api/v1/asset-prices')
export class BasicPriceController {
  constructor(
    private readonly basicPriceService: BasicPriceService,
  ) {}

  /**
   * Get all asset prices with filtering, pagination, and sorting.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all asset prices',
    description: 'Retrieve all asset prices with optional filtering, pagination, and sorting. Supports filtering by asset, price type, and price source.',
  })
  @ApiQuery({
    name: 'assetId',
    required: false,
    description: 'Filter by global asset ID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'priceType',
    required: false,
    description: 'Filter by price type',
    enum: ['MANUAL', 'MARKET_DATA', 'EXTERNAL', 'CALCULATED'],
    example: 'MARKET_DATA',
  })
  @ApiQuery({
    name: 'priceSource',
    required: false,
    description: 'Filter by price source',
    enum: ['USER', 'MARKET_DATA_SERVICE', 'EXTERNAL_API', 'CALCULATED'],
    example: 'MARKET_DATA_SERVICE',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: 'number',
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of items to skip',
    type: 'number',
    example: 0,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by',
    enum: ['createdAt', 'updatedAt', 'currentPrice', 'lastPriceUpdate'],
    example: 'lastPriceUpdate',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Asset prices retrieved successfully',
    type: [AssetPriceResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findAllAssetPrices(
    @Query(ValidationPipe) queryDto: AssetPriceQueryDto,
  ): Promise<AssetPriceResponseDto[]> {
    const result = await this.basicPriceService.findAll(queryDto);
    return result.data;
  }

  /**
   * Get a single asset price by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get asset price by ID',
    description: 'Retrieve a specific asset price by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Asset price ID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Asset price retrieved successfully',
    type: AssetPriceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Asset price not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid asset price ID format',
  })
  async findAssetPriceById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AssetPriceResponseDto> {
    const price = await this.basicPriceService.findOne(id);
    if (!price) {
      throw new NotFoundException(`Asset price with ID '${id}' not found.`);
    }
    return price;
  }

  /**
   * Get asset price by global asset ID.
   */
  @Get('asset/:assetId')
  @ApiOperation({
    summary: 'Get asset price by global asset ID',
    description: 'Retrieve the current price for a specific global asset.',
  })
  @ApiParam({
    name: 'assetId',
    description: 'Global asset ID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Asset price retrieved successfully',
    type: AssetPriceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Asset price not found for this asset',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid asset ID format',
  })
  async findAssetPriceByAssetId(
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ): Promise<AssetPriceResponseDto> {
    const price = await this.basicPriceService.findByAssetId(assetId);
    if (!price) {
      throw new NotFoundException(`Asset price not found for global asset with ID '${assetId}'.`);
    }
    return price;
  }

  /**
   * Create a new asset price.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new asset price',
    description: 'Create a new asset price for a global asset.',
  })
  @ApiBody({
    type: CreateAssetPriceDto,
    description: 'Asset price creation data',
    examples: {
      manualPrice: {
        summary: 'Manual Price Entry',
        value: {
          assetId: '550e8400-e29b-41d4-a716-446655440000',
          currentPrice: 150.75,
          priceType: 'MANUAL',
          priceSource: 'USER',
          changeReason: 'Manual price update',
        },
      },
      marketDataPrice: {
        summary: 'Market Data Price',
        value: {
          assetId: '550e8400-e29b-41d4-a716-446655440000',
          currentPrice: 152.30,
          priceType: 'MARKET_DATA',
          priceSource: 'MARKET_DATA_SERVICE',
          changeReason: 'Market data update',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Asset price created successfully',
    type: AssetPriceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or validation errors',
  })
  @ApiResponse({
    status: 409,
    description: 'Asset price already exists for this asset',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createAssetPrice(
    @Body(ValidationPipe) createAssetPriceDto: CreateAssetPriceDto,
  ): Promise<AssetPriceResponseDto> {
    const price = await this.basicPriceService.create(createAssetPriceDto);
    return price;
  }

  /**
   * Update an existing asset price.
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update asset price',
    description: 'Update an existing asset price. This will create a new price history record.',
  })
  @ApiParam({
    name: 'id',
    description: 'Asset price ID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateAssetPriceDto,
    description: 'Asset price update data',
    examples: {
      updatePrice: {
        summary: 'Update Price',
        value: {
          currentPrice: 155.00,
          changeReason: 'Price correction',
        },
      },
      updateSource: {
        summary: 'Update Price Source',
        value: {
          priceSource: 'EXTERNAL_API',
          changeReason: 'Switched to external API',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Asset price updated successfully',
    type: AssetPriceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Asset price not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or validation errors',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateAssetPrice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateAssetPriceDto: UpdateAssetPriceDto,
  ): Promise<AssetPriceResponseDto> {
    const price = await this.basicPriceService.update(id, updateAssetPriceDto);
    return price;
  }

  /**
   * Delete an asset price.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete asset price',
    description: 'Delete an asset price and its associated price history.',
  })
  @ApiParam({
    name: 'id',
    description: 'Asset price ID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Asset price deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Asset price not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid asset price ID format',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async deleteAssetPrice(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.basicPriceService.remove(id);
  }

  /**
   * Get price history for a global asset.
   */
  @Get('asset/:assetId/history')
  @ApiOperation({
    summary: 'Get price history for asset',
    description: 'Retrieve price history for a specific global asset with pagination.',
  })
  @ApiParam({
    name: 'assetId',
    description: 'Global asset ID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: 'number',
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of items to skip',
    type: 'number',
    example: 0,
  })
  @ApiQuery({
    name: 'priceType',
    required: false,
    description: 'Filter by price type',
    enum: ['MANUAL', 'MARKET_DATA', 'EXTERNAL', 'CALCULATED'],
    example: 'MARKET_DATA',
  })
  @ApiQuery({
    name: 'priceSource',
    required: false,
    description: 'Filter by price source',
    enum: ['USER', 'MARKET_DATA_SERVICE', 'EXTERNAL_API', 'CALCULATED'],
    example: 'MARKET_DATA_SERVICE',
  })
  @ApiResponse({
    status: 200,
    description: 'Price history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
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
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Global asset not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid asset ID format',
  })
  async getPriceHistory(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('priceType') priceType?: string,
    @Query('priceSource') priceSource?: string,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Mock implementation for now - will be implemented later
    const result = {
      data: [],
      total: 0,
      page: 1,
      limit: limit || 10,
      totalPages: 0,
    };
    return result;
  }

  /**
   * Get price statistics for a global asset.
   */
  @Get('asset/:assetId/statistics')
  @ApiOperation({
    summary: 'Get price statistics for asset',
    description: 'Retrieve price statistics including min, max, average, and recent changes for a global asset.',
  })
  @ApiParam({
    name: 'assetId',
    description: 'Global asset ID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period for statistics',
    enum: ['1D', '7D', '30D', '90D', '1Y'],
    example: '30D',
  })
  @ApiResponse({
    status: 200,
    description: 'Price statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        currentPrice: { type: 'number', example: 150.75 },
        minPrice: { type: 'number', example: 145.20 },
        maxPrice: { type: 'number', example: 155.80 },
        averagePrice: { type: 'number', example: 150.45 },
        priceChange: { type: 'number', example: 2.50 },
        priceChangePercent: { type: 'number', example: 1.68 },
        lastUpdate: { type: 'string', format: 'date-time' },
        totalUpdates: { type: 'number', example: 150 },
        period: { type: 'string', example: '30D' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Global asset not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid asset ID format',
  })
  async getPriceStatistics(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('period') period?: string,
  ): Promise<{
    currentPrice: number;
    minPrice: number;
    maxPrice: number;
    averagePrice: number;
    priceChange: number;
    priceChangePercent: number;
    lastUpdate: Date;
    totalUpdates: number;
    period: string;
  }> {
    // Mock implementation for now - will be implemented later
    const stats = {
      currentPrice: 150.75,
      minPrice: 145.20,
      maxPrice: 155.80,
      averagePrice: 150.45,
      priceChange: 2.50,
      priceChangePercent: 1.68,
      lastUpdate: new Date(),
      totalUpdates: 150,
      period: period || '30D',
    };
    return stats;
  }

  /**
   * Bulk update prices for multiple assets.
   */
  @Post('bulk-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk update prices',
    description: 'Update prices for multiple assets in a single operation.',
  })
  @ApiBody({
    description: 'Bulk price update data',
    schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assetId: { type: 'string', format: 'uuid' },
              currentPrice: { type: 'number' },
              priceType: { type: 'string', enum: ['MANUAL', 'MARKET_DATA', 'EXTERNAL', 'CALCULATED'] },
              priceSource: { type: 'string', enum: ['USER', 'MARKET_DATA_SERVICE', 'EXTERNAL_API', 'CALCULATED'] },
              changeReason: { type: 'string' },
            },
            required: ['assetId', 'currentPrice'],
          },
        },
        priceType: { type: 'string', enum: ['MANUAL', 'MARKET_DATA', 'EXTERNAL', 'CALCULATED'] },
        priceSource: { type: 'string', enum: ['USER', 'MARKET_DATA_SERVICE', 'EXTERNAL_API', 'CALCULATED'] },
        changeReason: { type: 'string' },
      },
      required: ['updates'],
    },
    examples: {
      marketDataUpdate: {
        summary: 'Market Data Bulk Update',
        value: {
          updates: [
            { assetId: '550e8400-e29b-41d4-a716-446655440000', currentPrice: 150.75 },
            { assetId: '660f9511-f3c7-52e5-b827-667766551111', currentPrice: 75.25 },
          ],
          priceType: 'MARKET_DATA',
          priceSource: 'MARKET_DATA_SERVICE',
          changeReason: 'End of day market data update',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk price update completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number', example: 2 },
        failed: { type: 'number', example: 0 },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assetId: { type: 'string', format: 'uuid' },
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or validation errors',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async bulkUpdatePrices(
    @Body(ValidationPipe) bulkUpdateDto: {
      updates: Array<{
        assetId: string;
        currentPrice: number;
        priceType?: string;
        priceSource?: string;
        changeReason?: string;
      }>;
      priceType?: string;
      priceSource?: string;
      changeReason?: string;
    },
  ): Promise<{
    success: number;
    failed: number;
    results: Array<{
      assetId: string;
      success: boolean;
      message: string;
    }>;
  }> {
    // Mock implementation for now - will be implemented later
    const result = {
      success: bulkUpdateDto.updates.length,
      failed: 0,
      results: bulkUpdateDto.updates.map(update => ({
        assetId: update.assetId,
        success: true,
        message: 'Price updated successfully',
      })),
    };
    return result;
  }
}
