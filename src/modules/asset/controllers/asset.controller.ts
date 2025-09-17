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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AssetService } from '../services/asset.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { AssetValidationService } from '../services/asset-validation.service';
import { AssetAnalyticsService } from '../services/asset-analytics.service';
import { Asset } from '../entities/asset.entity';
import { AssetType, AssetTypeLabels, AssetTypeDescriptions } from '../enums/asset-type.enum';
import { AssetFilters, PaginatedResponse } from '../repositories/asset.repository';
import { 
  AssetResponseDto, 
  PaginatedAssetResponseDto, 
  AssetStatisticsResponseDto,
  AssetExistenceResponseDto,
  AssetCountResponseDto,
  AssetDeletionResponseDto
} from '../dto/asset-response.dto';
import { 
  AssetAllocationResponseDto,
  AssetPerformanceResponseDto,
  AssetRiskMetricsResponseDto,
  AssetAnalyticsSummaryResponseDto,
  AssetValueRangeResponseDto
} from '../dto/asset-analytics-response.dto';
import { AssetMapper } from '../mappers/asset.mapper';
import { AssetAnalyticsMapper } from '../mappers/asset-analytics.mapper';

/**
 * Asset Controller
 * Handles HTTP requests for Asset operations
 */
@ApiTags('Assets')
@Controller('api/v1/assets')
export class AssetController {
  constructor(
    private readonly assetService: AssetService,
    private readonly assetValidationService: AssetValidationService,
    private readonly assetAnalyticsService: AssetAnalyticsService,
  ) {}

  /**
   * Create a new asset
   * Assets are global and can be used across multiple portfolios.
   * No portfolioId is required during creation.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new asset',
    description: 'Create a new asset that can be used across multiple portfolios. Assets are user-scoped and belong to the user who created them. Symbol must be unique per user.'
  })
  @ApiBody({ type: CreateAssetDto })
  @ApiResponse({
    status: 201,
    description: 'Asset created successfully',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - asset symbol already exists for this user',
  })
  async create(@Body() createAssetDto: CreateAssetDto): Promise<AssetResponseDto> {
    await this.assetValidationService.validateAssetCreation(createAssetDto);
    const asset = await this.assetService.create(createAssetDto);
    
    // ✅ OPTIMIZED: No need to calculate computed fields for new asset
    // Computed fields will be calculated when needed (lazy loading)
    
    return AssetMapper.toResponseDto(asset);
  }

  /**
   * Get all assets with filtering and pagination
   */
  @Get()
  @ApiOperation({ summary: 'Get all assets with filtering and pagination' })
  @ApiQuery({ name: 'createdBy', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'symbol', required: false, description: 'Filter by asset symbol' })
  @ApiQuery({ name: 'type', required: false, enum: AssetType, description: 'Filter by asset type' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or code' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field name' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of items to skip' })
  @ApiResponse({
    status: 200,
    description: 'Assets retrieved successfully',
    type: PaginatedAssetResponseDto,
  })
  async findAll(@Query() filters: AssetFilters): Promise<PaginatedAssetResponseDto> {
    console.log('Asset filters received:', filters);
    const result = await this.assetService.findAll(filters);
    
    // Map assets with computed fields
    const mappedAssets = await Promise.all(
      result.data.map(async (asset) => {
        try {
          // Calculate computed fields for each asset
          const computedFields = await this.assetService.calculateComputedFields(asset.id);
          return AssetMapper.toResponseDto(asset, computedFields);
        } catch (error) {
          console.warn(`Failed to calculate computed fields for asset ${asset.id}:`, error);
          // Return asset without computed fields if calculation fails
          return AssetMapper.toResponseDto(asset);
        }
      })
    );
    
    return {
      data: mappedAssets,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * Get available asset types
   */
  @Get('types')
  @ApiOperation({ summary: 'Get available asset types' })
  @ApiResponse({
    status: 200,
    description: 'Asset types retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        types: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string', example: 'STOCK' },
              label: { type: 'string', example: 'Cổ phiếu' },
              description: { type: 'string', example: 'Cổ phiếu của các công ty niêm yết' }
            }
          }
        }
      }
    }
  })
  async getAssetTypes(): Promise<{
    types: Array<{
      value: string;
      label: string;
      description: string;
    }>;
  }> {
    const types = Object.values(AssetType).map(type => ({
      value: type,
      label: AssetTypeLabels[type],
      description: AssetTypeDescriptions[type]
    }));

    return { types };
  }

  /**
   * Get assets by user ID
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get assets by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'type', required: false, enum: AssetType, description: 'Filter by asset type' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or code' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field name' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of items to skip' })
  @ApiResponse({
    status: 200,
    description: 'Assets retrieved successfully',
    type: PaginatedAssetResponseDto,
  })
  async findByUserId(@Param('userId') userId: string, @Query() filters: AssetFilters): Promise<PaginatedAssetResponseDto> {
    const result = await this.assetService.findByUserId(userId, filters);
    
    // Map assets with computed fields
    const mappedAssets = await Promise.all(
      result.data.map(async (asset) => {
        try {
          // Calculate computed fields for each asset
          const computedFields = await this.assetService.calculateComputedFields(asset.id);
          return AssetMapper.toResponseDto(asset, computedFields);
        } catch (error) {
          console.warn(`Failed to calculate computed fields for asset ${asset.id}:`, error);
          // Return asset without computed fields if calculation fails
          return AssetMapper.toResponseDto(asset);
        }
      })
    );
    
    return {
      data: mappedAssets,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * Get assets by portfolio ID with pagination
   */
  @Get('portfolio/:portfolioId')
  @ApiOperation({ summary: 'Get assets by portfolio ID with pagination' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'type', required: false, enum: AssetType, description: 'Filter by asset type' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or code' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field name' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of items to skip' })
  @ApiResponse({
    status: 200,
    description: 'Assets retrieved successfully',
    type: PaginatedAssetResponseDto,
  })
  async findByPortfolioId(@Param('portfolioId') portfolioId: string, @Query() filters: AssetFilters): Promise<PaginatedAssetResponseDto> {
    const result = await this.assetService.findByPortfolioId(portfolioId);
    
    // Map assets with computed fields
    const mappedAssets = await Promise.all(
      result.map(async (asset) => {
        try {
          // Calculate computed fields for each asset with portfolio context
          const computedFields = await this.assetService.calculateComputedFields(asset.id, portfolioId);
          return AssetMapper.toResponseDto(asset, computedFields);
        } catch (error) {
          console.warn(`Failed to calculate computed fields for asset ${asset.id}:`, error);
          // Return asset without computed fields if calculation fails
          return AssetMapper.toResponseDto(asset);
        }
      })
    );
    
    return {
      data: mappedAssets,
      total: result.length,
      page: 1,
      limit: result.length,
    };
  }

  /**
   * Search assets by name or code
   */
  @Get('search')
  @ApiOperation({ summary: 'Search assets by name or code' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'type', required: false, enum: AssetType, description: 'Filter by asset type' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items to return' })
  @ApiResponse({
    status: 200,
    description: 'Assets found successfully',
    type: [AssetResponseDto],
  })
  async search(@Query('q') query: string, @Query() filters: AssetFilters): Promise<AssetResponseDto[]> {
    const assets = await this.assetService.search(query);
    return assets.map(asset => AssetMapper.toResponseDto(asset));
  }

  /**
   * Get asset statistics by user
   */
  @Get('user/:userId/statistics')
  @ApiOperation({ summary: 'Get asset statistics by user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset statistics retrieved successfully',
    type: AssetStatisticsResponseDto,
  })
  async getStatisticsByUser(@Param('userId') userId: string): Promise<AssetStatisticsResponseDto> {
    const statistics = await this.assetService.getAssetStatistics(userId);
    return {
      totalAssets: statistics.totalAssets,
      assetsByType: statistics.assetsByType,
      totalValue: statistics.totalValue,
      averageValue: statistics.averageValue
    };
  }

  /**
   * Get comprehensive asset analytics summary
   */
  @Get('user/:userId/analytics')
  @ApiOperation({ summary: 'Get comprehensive asset analytics summary' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset analytics summary retrieved successfully',
    type: AssetAnalyticsSummaryResponseDto,
  })
  async getAnalyticsSummary(@Param('userId') userId: string): Promise<AssetAnalyticsSummaryResponseDto> {
    const summary = await this.assetAnalyticsService.generateAssetSummary(userId);
    return AssetAnalyticsMapper.toAnalyticsSummaryResponseDto(summary);
  }

  /**
   * Get asset performance comparison
   */
  @Get('portfolio/:userId/performance')
  @ApiOperation({ summary: 'Get asset performance comparison' })
  @ApiParam({ name: 'userId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'period', required: false, enum: ['1M', '3M', '6M', '1Y', 'ALL'], description: 'Time period' })
  @ApiResponse({
    status: 200,
    description: 'Asset performance comparison retrieved successfully',
    type: AssetPerformanceResponseDto,
  })
  async getPerformanceComparison(
    @Param('userId') portfolioId: string,
    @Query('period') period: '1M' | '3M' | '6M' | '1Y' | 'ALL' = 'ALL'
  ): Promise<AssetPerformanceResponseDto> {
    const comparison = await this.assetAnalyticsService.getAssetPerformanceComparison(portfolioId, period);
    return AssetAnalyticsMapper.toPerformanceResponseDto(comparison);
  }

  /**
   * Get asset allocation by type
   */
  @Get('portfolio/:userId/allocation')
  @ApiOperation({ summary: 'Get asset allocation by type' })
  @ApiParam({ name: 'userId', description: 'Portfolio ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset allocation retrieved successfully',
    type: AssetAllocationResponseDto,
  })
  async getAllocation(@Param('userId') portfolioId: string): Promise<AssetAllocationResponseDto> {
    const allocation = await this.assetAnalyticsService.calculateAssetAllocation(portfolioId);
    return AssetAnalyticsMapper.toAllocationResponseDto(allocation);
  }

  /**
   * Get asset risk metrics
   */
  @Get('portfolio/:userId/risk')
  @ApiOperation({ summary: 'Get asset risk metrics' })
  @ApiParam({ name: 'userId', description: 'Portfolio ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset risk metrics retrieved successfully',
    type: AssetRiskMetricsResponseDto,
  })
  async getRiskMetrics(@Param('userId') portfolioId: string): Promise<AssetRiskMetricsResponseDto> {
    const riskMetrics = await this.assetAnalyticsService.calculateRiskMetrics(portfolioId);
    return AssetAnalyticsMapper.toRiskMetricsResponseDto(riskMetrics);
  }

  /**
   * Get recent assets
   */
  @Get('recent')
  @ApiOperation({ summary: 'Get recent assets' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recent assets to return' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Recent assets retrieved successfully',
    type: [AssetResponseDto],
  })
  async getRecent(@Query('limit') limit: number = 10, @Query('userId') userId?: string): Promise<AssetResponseDto[]> {
    const assets = await this.assetService.findRecent(limit, userId);
    return assets.map(asset => AssetMapper.toResponseDto(asset));
  }

  /**
   * Get assets by value range
   */
  @Get('value-range')
  @ApiOperation({ summary: 'Get assets by value range' })
  @ApiQuery({ name: 'minValue', required: false, description: 'Minimum value' })
  @ApiQuery({ name: 'maxValue', required: false, description: 'Maximum value' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Assets retrieved successfully',
    type: AssetValueRangeResponseDto,
  })
  async getByValueRange(
    @Query('minValue') minValue?: number,
    @Query('maxValue') maxValue?: number,
    @Query('userId') userId?: string
  ): Promise<AssetValueRangeResponseDto> {
    const result = await this.assetService.findByValueRange(minValue, maxValue, userId);
    return AssetMapper.toValueRangeResponseDto(result, minValue, maxValue);
  }

  /**
   * Get asset count by portfolio
   */
  @Get('portfolio/:userId/count')
  @ApiOperation({ summary: 'Get asset count by portfolio' })
  @ApiParam({ name: 'userId', description: 'Portfolio ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset count retrieved successfully',
    type: AssetCountResponseDto,
  })
  async getCountByPortfolio(@Param('userId') portfolioId: string): Promise<AssetCountResponseDto> {
    const count = await this.assetService.countByPortfolioId(portfolioId);
    return { count };
  }

  /**
   * Get asset by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset retrieved successfully',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  async findById(@Param('id') id: string, @Query('portfolioId') portfolioId?: string): Promise<AssetResponseDto> {
    const { asset, computedFields } = await this.assetService.findByIdWithComputedFields(id, portfolioId);
    return AssetMapper.toResponseDto(asset, computedFields);
  }


  /**
   * Update asset by ID
   */
  @Put(':id')
  @ApiOperation({ 
    summary: 'Update asset by ID',
    description: 'Update asset properties. Symbol field is read-only after creation and cannot be modified.'
  })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiBody({ type: UpdateAssetDto })
  @ApiResponse({
    status: 200,
    description: 'Asset updated successfully',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - validation failed',
  })
  async update(
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    await this.assetValidationService.validateAssetUpdate(id, updateAssetDto);
    const asset = await this.assetService.update(id, updateAssetDto);
    
    // ✅ OPTIMIZED: No need to calculate computed fields for metadata updates
    // Computed fields only change when trades change, not when name/type/description change
    
    return AssetMapper.toResponseDto(asset);
  }

  /**
   * Delete asset by ID
   * Returns validation result with options if asset has associated trades.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete asset by ID',
    description: 'Delete asset or return validation result with options if asset has associated trades.'
  })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset deleted successfully or validation result returned',
    type: AssetDeletionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  async delete(@Param('id') id: string): Promise<AssetDeletionResponseDto> {
    const validation = await this.assetValidationService.validateAssetDeletion(id);
    
    if (!validation.canDelete) {
      return {
        error: 'Asset has associated trades',
        tradeCount: validation.tradeCount,
        message: `This asset has ${validation.tradeCount} associated trades. Deleting will remove all trades first.`,
        options: {
          cancel: 'Cancel deletion',
          force: 'Delete asset and all trades'
        }
      };
    }

    await this.assetService.delete(id);
    return { success: true };
  }

  /**
   * Check if asset exists
   */
  @Get(':id/exists')
  @ApiOperation({ summary: 'Check if asset exists' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset existence check result',
    type: AssetExistenceResponseDto,
  })
  async checkAssetExists(@Param('id') id: string): Promise<AssetExistenceResponseDto> {
    const exists = await this.assetService.exists(id);
    return { exists };
  }

  /**
   * Get trade count for an asset
   * This endpoint is useful for checking if an asset can be safely deleted.
   */
  @Get(':id/trades/count')
  @ApiOperation({ 
    summary: 'Get trade count for an asset',
    description: 'Get the number of trades associated with an asset. Use this to check if asset can be safely deleted.'
  })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Trade count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: 'Number of trades' },
        canDelete: { type: 'boolean', description: 'Whether asset can be deleted without force' }
      }
    }
  })
  async getTradeCount(@Param('id') id: string): Promise<{ count: number; canDelete: boolean }> {
    const count = await this.assetService.getTradeCount(id);
    const canDelete = count === 0;
    return { count, canDelete };
  }

  /**
   * Delete all trades for an asset
   */
  @Delete(':id/trades')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all trades for an asset' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Trades deleted successfully',
    schema: {
      type: 'object',
      properties: {
        deletedCount: { type: 'number', description: 'Number of deleted trades' }
      }
    }
  })
  async deleteAllTrades(@Param('id') id: string): Promise<{ deletedCount: number }> {
    const deletedCount = await this.assetService.deleteAllTrades(id);
    return { deletedCount };
  }

  /**
   * Force delete asset (delete trades first, then asset)
   * This will delete all associated trades and then the asset.
   * Use with caution as this action cannot be undone.
   */
  @Delete(':id/force')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Force delete asset (delete trades first)',
    description: 'Delete all associated trades first, then delete the asset. This action cannot be undone.'
  })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({
    status: 204,
    description: 'Asset and all associated trades deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  async forceDelete(@Param('id') id: string): Promise<void> {
    // First delete all trades
    await this.assetService.deleteAllTrades(id);
    
    // Then delete the asset
    await this.assetService.delete(id);
  }


  /**
   * Update computed fields for an asset (force refresh)
   * Triggers recalculation of initialValue, initialQuantity, currentValue, currentQuantity
   */
  @Post(':id/update-computed-fields')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Force refresh computed fields for an asset',
    description: 'Forces recalculation and database update of computed fields (initialValue, initialQuantity, currentValue, currentQuantity) based on trades and current market prices. Use sparingly - prefer lazy loading endpoint.'
  })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiQuery({ name: 'portfolioId', description: 'Portfolio ID (optional)', required: false })
  @ApiResponse({
    status: 200,
    description: 'Computed fields updated successfully',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  async updateComputedFields(
    @Param('id') id: string,
    @Query('portfolioId') portfolioId?: string
  ): Promise<AssetResponseDto> {
    const asset = await this.assetService.updateAssetWithComputedFields(id, portfolioId);
    return AssetMapper.toResponseDto(asset);
  }

}
