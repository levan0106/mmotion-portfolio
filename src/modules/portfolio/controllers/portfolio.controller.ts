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
  ParseUUIDPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioAnalyticsService } from '../services/portfolio-analytics.service';
import { PositionManagerService } from '../services/position-manager.service';
import { CreatePortfolioDto } from '../dto/create-portfolio.dto';
import { UpdatePortfolioDto } from '../dto/update-portfolio.dto';
import { Portfolio } from '../entities/portfolio.entity';

/**
 * Controller for Portfolio CRUD operations and basic analytics.
 */
@ApiTags('Portfolios')
@Controller('api/v1/portfolios')
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly portfolioAnalyticsService: PortfolioAnalyticsService,
    private readonly positionManagerService: PositionManagerService,
  ) {}

  /**
   * Get all portfolios for an account.
   */
  @Get()
  @ApiOperation({ 
    summary: 'Get all portfolios for an account',
    description: 'Retrieves all portfolios associated with a specific account ID. The accountId must be provided as a query parameter.',
  })
  @ApiQuery({ 
    name: 'accountId', 
    description: 'Account ID to filter portfolios (UUID format)', 
    required: true,
    example: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    type: 'string'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of portfolios retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          portfolioId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
          accountId: { type: 'string', example: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5' },
          name: { type: 'string', example: 'Growth Portfolio' },
          baseCurrency: { type: 'string', example: 'VND' },
          totalValue: { type: 'number', example: 1500000000 },
          cashBalance: { type: 'number', example: 50000000 },
          unrealizedPl: { type: 'number', example: 150000000 },
          realizedPl: { type: 'number', example: 75000000 },
          createdAt: { type: 'string', example: '2024-01-15T08:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-12-19T10:30:00.000Z' }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - accountId is required',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'accountId query parameter is required' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async getAllPortfolios(@Query('accountId') accountId: string): Promise<Portfolio[]> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    return this.portfolioService.getPortfoliosByAccount(accountId);
  }

  /**
   * Create a new portfolio.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new portfolio',
    description: 'Creates a new portfolio for an account. All fields are required except description.',
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Portfolio created successfully',
    schema: {
      type: 'object',
      properties: {
        portfolioId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440003' },
        accountId: { type: 'string', example: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5' },
        name: { type: 'string', example: 'Tech Growth Portfolio' },
        baseCurrency: { type: 'string', example: 'USD' },
        totalValue: { type: 'number', example: 0 },
        cashBalance: { type: 'number', example: 0 },
        unrealizedPl: { type: 'number', example: 0 },
        realizedPl: { type: 'number', example: 0 },
        createdAt: { type: 'string', example: '2024-12-19T10:30:00.000Z' },
        updatedAt: { type: 'string', example: '2024-12-19T10:30:00.000Z' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'array',
          items: { type: 'string' },
          example: ['name should not be empty', 'baseCurrency must be exactly 3 characters', 'accountId must be a UUID']
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async createPortfolio(@Body() createPortfolioDto: CreatePortfolioDto): Promise<Portfolio> {
    return this.portfolioService.createPortfolio(createPortfolioDto);
  }

  /**
   * Get portfolio details by ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get portfolio details by ID' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getPortfolioById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Portfolio> {
    return this.portfolioService.getPortfolioDetails(id);
  }

  /**
   * Update portfolio information.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update portfolio information' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio updated successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async updatePortfolio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
  ): Promise<Portfolio> {
    return this.portfolioService.updatePortfolio(id, updatePortfolioDto);
  }

  /**
   * Delete a portfolio.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 204, description: 'Portfolio deleted successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async deletePortfolio(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.portfolioService.deletePortfolio(id);
  }

  /**
   * Get current NAV for a portfolio.
   */
  @Get(':id/nav')
  @ApiOperation({ summary: 'Get current NAV for a portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Current NAV retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        navValue: { 
          type: 'number', 
          description: 'Net Asset Value (cash + assets) - trading performance',
          example: 1500000000 
        },
        totalValue: { 
          type: 'number', 
          description: 'Total asset value only (excluding deposits)',
          example: 1400000000 
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getCurrentNAV(@Param('id', ParseUUIDPipe) id: string): Promise<{ navValue: number; totalValue: number }> {
    const nav = await this.portfolioAnalyticsService.calculateNAV(id);
    const portfolio = await this.portfolioService.getPortfolioDetails(id);
    return { 
      navValue: nav, // NAV = cash + assets (trading performance)
      totalValue: portfolio.totalAssetValue // Total asset value only
    };
  }

  /**
   * Get NAV history for a portfolio.
   */
  @Get(':id/nav/history')
  @ApiOperation({ summary: 'Get NAV history for a portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'NAV history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getNavHistory(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    // TODO: Add date range parameters
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Last 30 days

    return this.portfolioAnalyticsService.getPerformanceSummary(id);
  }

  /**
   * Get performance metrics for a portfolio.
   */
  @Get(':id/performance')
  @ApiOperation({ summary: 'Get performance metrics for a portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getPerformanceMetrics(@Param('id', ParseUUIDPipe) id: string): Promise<{
    totalReturn: number;
    annualizedReturn: number;
  }> {
    const performanceSummary = await this.portfolioAnalyticsService.getPerformanceSummary(id);
    const portfolio = await this.portfolioService.getPortfolioDetails(id);
    
    // If we have historical data, use it
    if (performanceSummary.twr1Year !== 0) {
      return {
        totalReturn: performanceSummary.twr1Year,
        annualizedReturn: performanceSummary.twr1Year,
      };
    }
    
    // Fallback: Calculate basic return based on unrealized P&L
    const totalValue = parseFloat(portfolio.totalValue.toString());
    const unrealizedPL = parseFloat(portfolio.unrealizedPl.toString());
    
    // Calculate return as percentage of unrealized P&L vs total value
    const totalReturn = totalValue > 0 ? (unrealizedPL / totalValue) * 100 : 0;
    
    return {
      totalReturn: totalReturn,
      annualizedReturn: totalReturn, // For now, use same value as total return
    };
  }

  /**
   * Get asset allocation for a portfolio.
   */
  @Get(':id/allocation')
  @ApiOperation({ summary: 'Get asset allocation for a portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Asset allocation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getAssetAllocation(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    try {
      const allocation = await this.portfolioService.getAssetAllocation(id);
      return {
        portfolioId: id,
        allocation: allocation.reduce((acc, item) => {
          acc[item.assetType.toLowerCase()] = item.percentage;
          return acc;
        }, {}),
        calculatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getAssetAllocation:', error);
      throw error;
    }
  }

  /**
   * Get current positions for a portfolio.
   */
  @Get(':id/positions')
  @ApiOperation({ summary: 'Get current positions for a portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Current positions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getCurrentPositions(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    const positions = await this.positionManagerService.getCurrentPositions(id);
    const aggregation = await this.positionManagerService.getPositionAggregation(id);

    return {
      portfolioId: id,
      positions,
      summary: aggregation,
      retrievedAt: new Date().toISOString(),
    };
  }

  /**
   * Update portfolio realized P&L from trades.
   */
  @Post(':id/update-realized-pl')
  @ApiOperation({ summary: 'Update portfolio realized P&L from trades' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Realized P&L updated successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async updateRealizedPL(@Param('id', ParseUUIDPipe) id: string): Promise<{ realizedPl: number }> {
    const realizedPL = await this.portfolioService.updatePortfolioRealizedPL(id);
    return { realizedPl: realizedPL };
  }

  /**
   * Get all assets in a portfolio.
   */
  @Get(':id/assets')
  @ApiOperation({ summary: 'Get all assets in a portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio assets retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getPortfolioAssets(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    const assets = await this.portfolioService.getPortfolioAssets(id);
    return {
      portfolioId: id,
      assets,
      count: assets.length,
    };
  }

  /**
   * Add an asset to a portfolio.
   */
  @Post(':id/assets')
  @ApiOperation({ summary: 'Add an asset to a portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 201, description: 'Asset added to portfolio successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio or asset not found' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async addAssetToPortfolio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { assetId: string; quantity: number; avgCost: number },
  ): Promise<any> {
    const { assetId, quantity, avgCost } = body;
    
    if (!assetId || !quantity || !avgCost) {
      throw new BadRequestException('assetId, quantity, and avgCost are required');
    }

    const portfolioAsset = await this.portfolioService.addAssetToPortfolio(
      id,
      assetId,
      quantity,
      avgCost,
    );

    return {
      portfolioId: id,
      assetId: assetId,
      portfolioAsset: portfolioAsset,
    };
  }

  /**
   * Remove an asset from a portfolio.
   */
  @Delete(':id/assets/:assetId')
  @ApiOperation({ summary: 'Remove an asset from a portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Asset removed from portfolio successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio or asset not found' })
  async removeAssetFromPortfolio(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ): Promise<{ message: string }> {
    await this.portfolioService.removeAssetFromPortfolio(id, assetId);
    return { message: 'Asset removed from portfolio successfully' };
  }

  /**
   * Update asset position in portfolio.
   */
  @Put(':id/assets/:assetId')
  @ApiOperation({ summary: 'Update asset position in portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Asset position updated successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio or asset not found' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async updateAssetInPortfolio(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() body: { quantity: number; avgCost: number },
  ): Promise<any> {
    const { quantity, avgCost } = body;
    
    if (!quantity || !avgCost) {
      throw new BadRequestException('quantity and avgCost are required');
    }

    const portfolioAsset = await this.portfolioService.updateAssetInPortfolio(
      id,
      assetId,
      quantity,
      avgCost,
    );

    return {
      portfolioId: id,
      assetId: assetId,
      portfolioAsset: portfolioAsset,
    };
  }

  /**
   * Get available assets for a user.
   */
  @Get('available-assets')
  @ApiOperation({ summary: 'Get available assets for a user' })
  @ApiQuery({ name: 'userId', description: 'User ID', required: true })
  @ApiQuery({ name: 'search', description: 'Search term', required: false })
  @ApiResponse({ status: 200, description: 'Available assets retrieved successfully' })
  async getAvailableAssets(
    @Query('userId', ParseUUIDPipe) userId: string,
    @Query('search') search?: string,
  ): Promise<any> {
    const assets = await this.portfolioService.getAvailableAssets(userId, search);
    return {
      userId: userId,
      assets,
      count: assets.length,
      searchTerm: search,
    };
  }

}
