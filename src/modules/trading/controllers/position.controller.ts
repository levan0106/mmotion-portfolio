import {
  Controller,
  Get,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PositionService, PositionSummary } from '../services/position.service';
import { PositionResponseDto } from '../dto/position-response.dto';

export interface PositionQueryDto {
  portfolioId: string;
  assetId?: string;
  marketPrices?: Record<string, number>;
}

export interface PositionUpdateDto {
  marketPrices: Record<string, number>;
}

/**
 * Controller for managing portfolio positions and position-related operations.
 * Provides REST API endpoints for position tracking and analytics.
 */
@ApiTags('Positions')
@Controller('api/v1/portfolios')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  /**
   * Get current positions for a portfolio
   * @param portfolioId Portfolio ID
   * @param query Query parameters
   * @returns Array of current positions
   */
  @Get(':id/positions')
  @ApiOperation({ summary: 'Get current positions for a portfolio' })
  @ApiResponse({
    status: 200,
    description: 'Current positions retrieved successfully',
    type: [PositionResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'marketPrices', required: false, description: 'Current market prices (JSON string)' })
  async getCurrentPositions(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Query('marketPrices') marketPricesStr?: string,
  ): Promise<PositionSummary[]> {
    let marketPrices: Record<string, number> = {};
    
    if (marketPricesStr) {
      try {
        marketPrices = JSON.parse(marketPricesStr);
      } catch (error) {
        // If parsing fails, use empty object
        marketPrices = {};
      }
    }

    return this.positionService.getCurrentPositions(portfolioId, marketPrices);
  }

  /**
   * Get position for a specific asset
   * @param portfolioId Portfolio ID
   * @param assetId Asset ID
   * @param marketPrice Current market price
   * @returns Position details
   */
  @Get(':id/positions/:assetId')
  @ApiOperation({ summary: 'Get position for a specific asset' })
  @ApiResponse({
    status: 200,
    description: 'Position details retrieved successfully',
    type: PositionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or position not found',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiQuery({ name: 'marketPrice', required: false, description: 'Current market price' })
  async getPositionByAsset(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('marketPrice') marketPrice?: number,
  ): Promise<PositionSummary | null> {
    return this.positionService.getPositionByAsset(portfolioId, assetId, marketPrice);
  }

  /**
   * Update position value with current market price
   * @param portfolioId Portfolio ID
   * @param assetId Asset ID
   * @param marketPrice Current market price
   * @returns Updated position
   */
  @Get(':id/positions/:assetId/update')
  @ApiOperation({ summary: 'Update position value with current market price' })
  @ApiResponse({
    status: 200,
    description: 'Position updated successfully',
    type: PositionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or position not found',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiQuery({ name: 'marketPrice', required: true, description: 'Current market price' })
  async updatePositionValue(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('marketPrice') marketPrice: number,
  ): Promise<PositionSummary> {
    return this.positionService.updatePositionValue(portfolioId, assetId, marketPrice);
  }

  /**
   * Calculate position metrics for a specific asset
   * @param portfolioId Portfolio ID
   * @param assetId Asset ID
   * @param marketPrice Current market price
   * @returns Position metrics
   */
  @Get(':id/positions/:assetId/metrics')
  @ApiOperation({ summary: 'Calculate position metrics for a specific asset' })
  @ApiResponse({
    status: 200,
    description: 'Position metrics calculated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or asset not found',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiQuery({ name: 'marketPrice', required: true, description: 'Current market price' })
  async calculatePositionMetrics(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('marketPrice') marketPrice: number,
  ): Promise<{
    totalQuantity: number;
    totalCost: number;
    averageCost: number;
    marketValue: number;
    unrealizedPl: number;
    unrealizedPlPercentage: number;
    realizedPl: number;
    totalPl: number;
  }> {
    return this.positionService.calculatePositionMetrics(portfolioId, assetId, marketPrice);
  }

  /**
   * Get position performance over time
   * @param portfolioId Portfolio ID
   * @param assetId Asset ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Position performance data
   */
  @Get(':id/positions/:assetId/performance')
  @ApiOperation({ summary: 'Get position performance over time' })
  @ApiResponse({
    status: 200,
    description: 'Position performance retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or asset not found',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO string)' })
  async getPositionPerformance(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Array<{
    date: Date;
    quantity: number;
    avgCost: number;
    marketPrice: number;
    marketValue: number;
    unrealizedPl: number;
    realizedPl: number;
  }>> {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    return this.positionService.getPositionPerformance(
      portfolioId,
      assetId,
      startDateObj,
      endDateObj,
    );
  }

  /**
   * Get portfolio position summary
   * @param portfolioId Portfolio ID
   * @param marketPrices Current market prices
   * @returns Portfolio position summary
   */
  @Get(':id/positions/summary')
  @ApiOperation({ summary: 'Get portfolio position summary' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio position summary retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'marketPrices', required: false, description: 'Current market prices (JSON string)' })
  async getPortfolioPositionSummary(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Query('marketPrices') marketPricesStr?: string,
  ): Promise<{
    totalValue: number;
    totalCost: number;
    totalUnrealizedPl: number;
    totalRealizedPl: number;
    totalPl: number;
    positionCount: number;
    topPositions: PositionSummary[];
  }> {
    let marketPrices: Record<string, number> = {};
    
    if (marketPricesStr) {
      try {
        marketPrices = JSON.parse(marketPricesStr);
      } catch (error) {
        // If parsing fails, use empty object
        marketPrices = {};
      }
    }

    return this.positionService.getPortfolioPositionSummary(portfolioId, marketPrices);
  }

  /**
   * Update all positions with current market prices
   * @param portfolioId Portfolio ID
   * @param marketPrices Current market prices
   * @returns Updated positions
   */
  @Get(':id/positions/update-all')
  @ApiOperation({ summary: 'Update all positions with current market prices' })
  @ApiResponse({
    status: 200,
    description: 'All positions updated successfully',
    type: [PositionResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'marketPrices', required: true, description: 'Current market prices (JSON string)' })
  async updateAllPositionValues(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Query('marketPrices') marketPricesStr: string,
  ): Promise<PositionSummary[]> {
    let marketPrices: Record<string, number> = {};
    
    try {
      marketPrices = JSON.parse(marketPricesStr);
    } catch (error) {
      throw new Error('Invalid market prices format');
    }

    return this.positionService.updateAllPositionValues(portfolioId, marketPrices);
  }

  /**
   * Get position alerts
   * @param portfolioId Portfolio ID
   * @param marketPrices Current market prices
   * @returns Position alerts
   */
  @Get(':id/positions/alerts')
  @ApiOperation({ summary: 'Get position alerts' })
  @ApiResponse({
    status: 200,
    description: 'Position alerts retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'marketPrices', required: false, description: 'Current market prices (JSON string)' })
  async getPositionAlerts(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Query('marketPrices') marketPricesStr?: string,
  ): Promise<Array<{
    assetId: string;
    assetSymbol: string;
    alertType: 'LOW_QUANTITY' | 'HIGH_LOSS' | 'HIGH_GAIN' | 'ZERO_POSITION';
    message: string;
    value: number;
  }>> {
    let marketPrices: Record<string, number> = {};
    
    if (marketPricesStr) {
      try {
        marketPrices = JSON.parse(marketPricesStr);
      } catch (error) {
        // If parsing fails, use empty object
        marketPrices = {};
      }
    }

    // Position service methods are not available as PositionService has been commented out
    return [];
  }

  /**
   * Get position analytics dashboard data
   * @param portfolioId Portfolio ID
   * @param marketPrices Current market prices
   * @returns Position analytics data
   */
  @Get(':id/positions/analytics')
  @ApiOperation({ summary: 'Get position analytics dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Position analytics retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'marketPrices', required: false, description: 'Current market prices (JSON string)' })
  async getPositionAnalytics(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Query('marketPrices') marketPricesStr?: string,
  ): Promise<{
    summary: any;
    positions: PositionSummary[];
    alerts: any[];
    topPerformers: PositionSummary[];
    worstPerformers: PositionSummary[];
  }> {
    let marketPrices: Record<string, number> = {};
    
    if (marketPricesStr) {
      try {
        marketPrices = JSON.parse(marketPricesStr);
      } catch (error) {
        // If parsing fails, use empty object
        marketPrices = {};
      }
    }

    // Position service methods are not available as PositionService has been commented out
    const summary: any = {
      totalValue: 0,
      totalCost: 0,
      totalPnl: 0,
      totalPnlPercentage: 0,
      positionCount: 0,
    };
    
    // Position service methods are not available as PositionService has been commented out
    const positions: any[] = [];
    
    // Position alerts are not available as PositionService has been commented out
    const alerts: any[] = [];

    // Get top and worst performers
    const topPerformers = positions
      .sort((a, b) => b.unrealizedPlPercentage - a.unrealizedPlPercentage)
      .slice(0, 5);

    const worstPerformers = positions
      .sort((a, b) => a.unrealizedPlPercentage - b.unrealizedPlPercentage)
      .slice(0, 5);

    return {
      summary,
      positions,
      alerts,
      topPerformers,
      worstPerformers,
    };
  }
}
