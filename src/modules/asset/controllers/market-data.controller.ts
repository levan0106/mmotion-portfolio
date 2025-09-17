import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpStatus,
  HttpCode,
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
} from '@nestjs/swagger';
import { MarketDataService, PriceUpdateResult, MarketDataConfig, MarketDataProvider } from '../services/market-data.service';

/**
 * Controller for managing market data operations.
 * Provides REST API endpoints for market data integration and price updates.
 */
@ApiTags('Market Data')
@Controller('api/v1/market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  /**
   * Update prices for all active assets.
   * @returns Array of update results
   */
  @Post('update-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update all asset prices',
    description: 'Trigger price update for all active assets from market data providers',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price update completed',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          assetId: { type: 'string', format: 'uuid' },
          symbol: { type: 'string' },
          success: { type: 'boolean' },
          newPrice: { type: 'number' },
          error: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async updateAllPrices(): Promise<PriceUpdateResult[]> {
    return this.marketDataService.updateAllPrices();
  }

  /**
   * Update price for a specific asset.
   * @param assetId - Asset ID
   * @returns Price update result
   */
  @Post('update/:assetId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update asset price',
    description: 'Trigger price update for a specific asset from market data providers',
  })
  @ApiParam({
    name: 'assetId',
    type: 'string',
    format: 'uuid',
    description: 'Asset ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price update completed',
    schema: {
      type: 'object',
      properties: {
        assetId: { type: 'string', format: 'uuid' },
        symbol: { type: 'string' },
        success: { type: 'boolean' },
        newPrice: { type: 'number' },
        error: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  async updateAssetPrice(
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ): Promise<PriceUpdateResult> {
    return this.marketDataService.updateAssetPrice(assetId);
  }

  /**
   * Update prices for assets by nation.
   * @param nation - Nation code
   * @returns Array of update results
   */
  @Post('update-by-nation/:nation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update prices by nation',
    description: 'Trigger price update for all active assets in a specific nation',
  })
  @ApiParam({
    name: 'nation',
    type: 'string',
    description: 'Nation code (e.g., VN, US, UK)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price update completed',
  })
  async updatePricesByNation(
    @Param('nation') nation: string,
  ): Promise<PriceUpdateResult[]> {
    return this.marketDataService.updatePricesByNation(nation);
  }

  /**
   * Update prices for assets by market code.
   * @param marketCode - Market code
   * @returns Array of update results
   */
  @Post('update-by-market/:marketCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update prices by market',
    description: 'Trigger price update for all active assets in a specific market',
  })
  @ApiParam({
    name: 'marketCode',
    type: 'string',
    description: 'Market code (e.g., HOSE, NYSE, LSE)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price update completed',
  })
  async updatePricesByMarket(
    @Param('marketCode') marketCode: string,
  ): Promise<PriceUpdateResult[]> {
    return this.marketDataService.updatePricesByMarket(marketCode);
  }

  /**
   * Get market data configuration.
   * @returns Market data configuration
   */
  @Get('config')
  @ApiOperation({
    summary: 'Get market data configuration',
    description: 'Retrieve current market data configuration including providers and settings',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Market data configuration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        providers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              baseUrl: { type: 'string' },
              apiKey: { type: 'string' },
              rateLimit: { type: 'number' },
              isActive: { type: 'boolean' },
            },
          },
        },
        updateInterval: { type: 'number' },
        retryAttempts: { type: 'number' },
        timeout: { type: 'number' },
      },
    },
  })
  async getConfig(): Promise<MarketDataConfig> {
    return this.marketDataService.getConfig();
  }

  /**
   * Update market data configuration.
   * @param config - New configuration
   * @returns Success message
   */
  @Post('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update market data configuration',
    description: 'Update market data configuration including providers and settings',
  })
  @ApiBody({
    type: Object,
    description: 'Market data configuration',
    schema: {
      type: 'object',
      properties: {
        providers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              baseUrl: { type: 'string' },
              apiKey: { type: 'string' },
              rateLimit: { type: 'number' },
              isActive: { type: 'boolean' },
            },
          },
        },
        updateInterval: { type: 'number' },
        retryAttempts: { type: 'number' },
        timeout: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuration updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  async updateConfig(
    @Body(ValidationPipe) config: Partial<MarketDataConfig>,
  ): Promise<{ message: string }> {
    this.marketDataService.updateConfig(config);
    return { message: 'Market data configuration updated successfully' };
  }

  /**
   * Get available market data providers.
   * @returns Array of providers
   */
  @Get('providers')
  @ApiOperation({
    summary: 'Get market data providers',
    description: 'Retrieve list of available market data providers',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Providers retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          baseUrl: { type: 'string' },
          apiKey: { type: 'string' },
          rateLimit: { type: 'number' },
          isActive: { type: 'boolean' },
        },
      },
    },
  })
  async getProviders(): Promise<MarketDataProvider[]> {
    return this.marketDataService.getProviders();
  }

  /**
   * Test connection to a market data provider.
   * @param providerName - Provider name
   * @returns Connection test result
   */
  @Post('test-connection/:providerName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test provider connection',
    description: 'Test connection to a specific market data provider',
  })
  @ApiParam({
    name: 'providerName',
    type: 'string',
    description: 'Provider name',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connection test completed',
    schema: {
      type: 'object',
      properties: {
        providerName: { type: 'string' },
        connected: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Provider not found',
  })
  async testProviderConnection(
    @Param('providerName') providerName: string,
  ): Promise<{ providerName: string; connected: boolean; message: string }> {
    const connected = await this.marketDataService.testProviderConnection(providerName);
    return {
      providerName,
      connected,
      message: connected ? 'Connection successful' : 'Connection failed',
    };
  }

  /**
   * Get price update statistics.
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Update statistics
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get update statistics',
    description: 'Retrieve statistics about price updates including success rates and performance metrics',
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
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUpdates: { type: 'number' },
        successfulUpdates: { type: 'number' },
        failedUpdates: { type: 'number' },
        successRate: { type: 'number' },
        averageUpdateTime: { type: 'number' },
      },
    },
  })
  async getUpdateStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalUpdates: number;
    successfulUpdates: number;
    failedUpdates: number;
    successRate: number;
    averageUpdateTime: number;
  }> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.marketDataService.getUpdateStatistics(start, end);
  }
}
