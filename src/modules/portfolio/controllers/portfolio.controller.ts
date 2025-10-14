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
  ParseIntPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioAnalyticsService } from '../services/portfolio-analytics.service';
import { PositionManagerService } from '../services/position-manager.service';
import { InvestorHoldingService } from '../services/investor-holding.service';
import { AccountValidationService } from '../../shared/services/account-validation.service';
import { CreatePortfolioDto } from '../dto/create-portfolio.dto';
import { UpdatePortfolioDto } from '../dto/update-portfolio.dto';
import { SubscribeToFundDto } from '../dto/subscribe-to-fund.dto';
import { RedeemFromFundDto } from '../dto/redeem-from-fund.dto';
import { CopyPortfolioDto } from '../dto/copy-portfolio.dto';
import { Portfolio } from '../entities/portfolio.entity';
import { InvestorHolding } from '../entities/investor-holding.entity';

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
    private readonly investorHoldingService: InvestorHoldingService,
    private readonly accountValidationService: AccountValidationService,
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
   * Get all public portfolios (templates)
   */
  @Get('public-templates')
  @ApiOperation({ 
    summary: 'Get all public portfolios',
    description: 'Retrieves all public portfolio templates that can be copied by other users.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Public portfolios retrieved successfully',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/Portfolio' }
    }
  })
  async getPublicPortfolios(): Promise<Portfolio[]> {
    return this.portfolioService.getPublicPortfolios();
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
    // Validate account ownership for the accountId in the DTO
    await this.accountValidationService.validateAccountOwnership(createPortfolioDto.accountId, createPortfolioDto.accountId);
    
    return this.portfolioService.createPortfolio(createPortfolioDto);
  }

  /**
   * Copy a portfolio with all its data.
   */
  @Post('copy')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Copy a portfolio',
    description: 'Creates a new portfolio by copying all data (trades, cash flows, deposits) from an existing portfolio.',
  })
  @ApiBody({ type: CopyPortfolioDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Portfolio copied successfully',
    schema: {
      type: 'object',
      properties: {
        portfolioId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440004' },
        accountId: { type: 'string', example: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5' },
        name: { type: 'string', example: 'Growth Portfolio Copy' },
        baseCurrency: { type: 'string', example: 'VND' },
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
    description: 'Bad request - validation failed or portfolio name already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'string',
          example: 'Portfolio with name "Growth Portfolio Copy" already exists for this account'
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Source portfolio not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { 
          type: 'string',
          example: 'Source portfolio with ID 550e8400-e29b-41d4-a716-446655440000 not found'
        },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async copyPortfolio(@Body() copyPortfolioDto: CopyPortfolioDto): Promise<Portfolio> {
    return this.portfolioService.copyPortfolio(
      copyPortfolioDto.sourcePortfolioId,
      copyPortfolioDto.name
    );
  }


  /**
   * Copy a public portfolio to current account
   */
  @Post('copy-from-public')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Copy a public portfolio',
    description: 'Creates a new portfolio by copying from a public portfolio template.',
  })
  @ApiBody({
    description: 'Copy from public portfolio data',
    schema: {
      type: 'object',
      properties: {
        sourcePortfolioId: { type: 'string', format: 'uuid', description: 'Source public portfolio ID' },
        targetAccountId: { type: 'string', format: 'uuid', description: 'Target account ID' },
        name: { type: 'string', description: 'Name for the new portfolio' }
      },
      required: ['sourcePortfolioId', 'targetAccountId', 'name']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Portfolio copied successfully from public template',
    schema: {
      type: 'object',
      properties: {
        portfolioId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440004' },
        accountId: { type: 'string', example: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5' },
        name: { type: 'string', example: 'Growth Portfolio Copy' },
        baseCurrency: { type: 'string', example: 'VND' },
        visibility: { type: 'string', example: 'PRIVATE' },
        createdAt: { type: 'string', example: '2024-12-19T10:30:00.000Z' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed or portfolio not public',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Portfolio is not public and cannot be copied' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Source portfolio not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Source portfolio with ID 550e8400-e29b-41d4-a716-446655440000 not found' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async copyFromPublicPortfolio(@Body() copyFromPublicDto: { sourcePortfolioId: string; targetAccountId: string; name: string }): Promise<Portfolio> {
    return this.portfolioService.copyPublicPortfolio(
      copyFromPublicDto.sourcePortfolioId,
      copyFromPublicDto.targetAccountId,
      copyFromPublicDto.name
    );
  }

  /**
   * Update portfolio visibility
   */
  @Put(':id/visibility')
  @ApiOperation({ 
    summary: 'Update portfolio visibility',
    description: 'Updates portfolio visibility (PRIVATE/PUBLIC) and template information.',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiBody({
    description: 'Portfolio visibility update data',
    schema: {
      type: 'object',
      properties: {
        visibility: { type: 'string', enum: ['PRIVATE', 'PUBLIC'], description: 'Portfolio visibility' },
        templateName: { type: 'string', description: 'Template name (required for PUBLIC)' },
        description: { type: 'string', description: 'Template description (optional for PUBLIC)' }
      },
      required: ['visibility']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Portfolio visibility updated successfully',
    schema: {
      type: 'object',
      properties: {
        portfolioId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440004' },
        visibility: { type: 'string', example: 'PUBLIC' },
        templateName: { type: 'string', example: 'Growth Strategy Template' },
        description: { type: 'string', example: 'A balanced growth portfolio strategy' }
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
        message: { type: 'string', example: 'Template name is required for public portfolios' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Portfolio does not belong to account',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Portfolio does not belong to account' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Portfolio not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Portfolio with ID 550e8400-e29b-41d4-a716-446655440000 not found' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async updatePortfolioVisibility(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
    @Body() visibilityDto: { visibility: 'PRIVATE' | 'PUBLIC'; templateName?: string; description?: string }
  ): Promise<Portfolio> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    
    // Validate portfolio ownership
    await this.accountValidationService.validatePortfolioOwnership(id, accountId);
    
    // Validate template name for public portfolios
    if (visibilityDto.visibility === 'PUBLIC' && !visibilityDto.templateName) {
      throw new BadRequestException('Template name is required for public portfolios');
    }
    
    return this.portfolioService.updatePortfolioVisibility(
      id,
      visibilityDto.visibility,
      visibilityDto.templateName,
      visibilityDto.description
    );
  }

  /**
   * Get portfolio details by ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get portfolio details by ID' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiResponse({ status: 200, description: 'Portfolio details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 403, description: 'Portfolio does not belong to account' })
  async getPortfolioById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
  ): Promise<Portfolio> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    
    // Validate portfolio ownership
    await this.accountValidationService.validatePortfolioOwnership(id, accountId);
    
    return this.portfolioService.getPortfolioDetails(id);
  }

  /**
   * Update portfolio information.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update portfolio information' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiResponse({ status: 200, description: 'Portfolio updated successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 403, description: 'Portfolio does not belong to account' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async updatePortfolio(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
  ): Promise<Portfolio> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    
    // Validate portfolio ownership
    await this.accountValidationService.validatePortfolioOwnership(id, accountId);
    
    return this.portfolioService.updatePortfolio(id, updatePortfolioDto);
  }

  /**
   * Delete a portfolio and all related data.
   * 
   * This endpoint performs a comprehensive deletion that removes:
   * - All trades and trade details
   * - All cash flows and deposits
   * - All investor holdings (if portfolio is a fund)
   * - All NAV snapshots and performance data
   * - All portfolio snapshots and analytics data
   * - All asset allocation snapshots
   * 
   * WARNING: This action cannot be undone!
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete a portfolio and all related data',
    description: 'Comprehensively deletes a portfolio and all associated data including trades, cash flows, deposits, snapshots, and analytics. This action cannot be undone.'
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for ownership validation' })
  @ApiResponse({ 
    status: 204, 
    description: 'Portfolio and all related data deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string', 
          example: 'Portfolio and all related data deleted successfully' 
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 403, description: 'Portfolio does not belong to account' })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error during deletion',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Failed to delete portfolio: [error details]' },
        error: { type: 'string', example: 'Internal Server Error' }
      }
    }
  })
  async deletePortfolio(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
  ): Promise<void> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    
    // Validate portfolio ownership
    await this.accountValidationService.validatePortfolioOwnership(id, accountId);
    
    return this.portfolioService.deletePortfolio(id);
  }

  // /**
  //  * Get current NAV for a portfolio.
  //  */
  // @Get(':id/nav')
  // @ApiOperation({ summary: 'Get current NAV for a portfolio' })
  // @ApiParam({ name: 'id', description: 'Portfolio ID' })
  // @ApiResponse({ 
  //   status: 200, 
  //   description: 'Current NAV retrieved successfully',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       navValue: { 
  //         type: 'number', 
  //         description: 'Net Asset Value (cash + assets) - trading performance',
  //         example: 1500000000 
  //       },
  //       totalValue: { 
  //         type: 'number', 
  //         description: 'Total asset value only (excluding deposits)',
  //         example: 1400000000 
  //       }
  //     }
  //   }
  // })
  // @ApiResponse({ status: 404, description: 'Portfolio not found' })
  // async getCurrentNAV(@Param('id', ParseUUIDPipe) id: string): Promise<{ navValue: number; totalValue: number }> {
  //   const nav = await this.portfolioAnalyticsService.calculateNAV(id);
  //   const portfolio = await this.portfolioService.getPortfolioDetails(id);
  //   return { 
  //     navValue: nav, // NAV = cash + assets (trading performance)
  //     totalValue: portfolio.totalAssetValue // Total asset value only
  //   };
  // }

  /**
   * Get NAV history for a portfolio.
   */
  @Get(':id/nav/history')
  @ApiOperation({ summary: 'Get NAV history for a portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'months', required: false, description: 'Number of months to look back (default: 12)' })
  @ApiQuery({ name: 'granularity', required: false, description: 'Data granularity: DAILY, WEEKLY, MONTHLY (default: DAILY)' })
  @ApiResponse({ status: 200, description: 'NAV history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getNavHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('months', new ParseIntPipe({ optional: true })) months?: number,
    @Query('granularity') granularity?: string,
  ): Promise<any> {
    // Limit history data to maximum 12 months (1 year)
    const monthsToLookBack = Math.min(months || 12, 12);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - monthsToLookBack);

    return this.portfolioAnalyticsService.getNavHistory(id, startDate, endDate, granularity);
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
    // const performanceSummary = await this.portfolioAnalyticsService.getPerformanceSummary(id);
     const portfolio = await this.portfolioService.getPortfolioDetails(id);
    
    // // If we have historical data, use it
    // if (performanceSummary.twr1Year !== 0) {
    //   return {
    //     totalReturn: performanceSummary.twr1Year,
    //     annualizedReturn: performanceSummary.twr1Year,
    //   };
    // }
    
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

  /**
   * Convert portfolio to fund
   */
  @Post(':id/convert-to-fund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Convert portfolio to fund',
    description: 'Converts a regular portfolio to a fund, enabling NAV/Unit management. Optionally specify a snapshot date for historical conversion.',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ 
    name: 'snapshotDate', 
    description: 'Optional snapshot date for historical conversion (ISO 8601 format)', 
    required: false,
    example: '2024-01-15T00:00:00.000Z'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Portfolio converted to fund successfully',
    type: Portfolio
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Portfolio not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Portfolio is already a fund or invalid snapshot date' 
  })
  async convertToFund(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Query('snapshotDate') snapshotDate?: string
  ): Promise<Portfolio> {
    let parsedSnapshotDate: Date | undefined;
    
    if (snapshotDate) {
      parsedSnapshotDate = new Date(snapshotDate);
      if (isNaN(parsedSnapshotDate.getTime())) {
        throw new BadRequestException('Invalid snapshot date format. Please use ISO 8601 format (e.g., 2024-01-15T00:00:00.000Z)');
      }
    }
    
    return this.investorHoldingService.convertPortfolioToFund(portfolioId, parsedSnapshotDate);
  }

  /**
   * Get fund investors
   */
  @Get(':id/investors')
  @ApiOperation({ 
    summary: 'Get fund investors',
    description: 'Gets all investors and their holdings for a fund',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Investor holdings retrieved successfully',
    type: [InvestorHolding]
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Portfolio not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Portfolio is not a fund' 
  })
  async getFundInvestors(@Param('id', ParseUUIDPipe) portfolioId: string): Promise<InvestorHolding[]> {
    return this.investorHoldingService.getFundInvestors(portfolioId);
  }

  /**
   * Get specific investor holding
   */
  @Get(':id/investors/:accountId')
  @ApiOperation({ 
    summary: 'Get investor holding',
    description: 'Gets specific investor holding for a fund',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Investor holding retrieved successfully',
    type: InvestorHolding
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Portfolio or investor holding not found' 
  })
  async getInvestorHolding(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string
  ): Promise<InvestorHolding> {
    return this.investorHoldingService.getInvestorHoldingValues(portfolioId, accountId);
  }

  /**
   * Subscribe to fund
   */
  @Post(':id/investors/subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Subscribe to fund',
    description: 'Allows an investor to subscribe to a fund by purchasing units',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiBody({ type: SubscribeToFundDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Fund subscription successful',
    schema: {
      type: 'object',
      properties: {
        holding: { $ref: '#/components/schemas/InvestorHolding' },
        cashFlow: { $ref: '#/components/schemas/CashFlow' },
        unitsIssued: { type: 'number' },
        navPerUnit: { type: 'number' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Portfolio or account not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid subscription request' 
  })
  async subscribeToFund(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Body() subscribeDto: SubscribeToFundDto
  ) {
    return this.investorHoldingService.subscribeToFund({
      ...subscribeDto,
      portfolioId
    }, subscribeDto.subscriptionDate);
  }

  /**
   * Redeem from fund
   */
  @Post(':id/investors/redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Redeem from fund',
    description: 'Allows an investor to redeem units from a fund',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiBody({ type: RedeemFromFundDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Fund redemption successful',
    schema: {
      type: 'object',
      properties: {
        holding: { $ref: '#/components/schemas/InvestorHolding' },
        cashFlow: { $ref: '#/components/schemas/CashFlow' },
        unitsRedeemed: { type: 'number' },
        amountReceived: { type: 'number' },
        navPerUnit: { type: 'number' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Portfolio or account not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid redemption request' 
  })
  async redeemFromFund(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Body() redeemDto: RedeemFromFundDto
  ) {
    return this.investorHoldingService.redeemFromFund({
      ...redeemDto,
      portfolioId
    }, redeemDto.redemptionDate);
  }

  @Post(':id/refresh-nav-per-unit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh NAV per unit', description: 'Manually refresh NAV per unit calculation and update database' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'NAV per unit refreshed successfully', 
    schema: { 
      type: 'object', 
      properties: { 
        portfolioId: { type: 'string' }, 
        navPerUnit: { type: 'number' }, 
        totalAllValue: { type: 'number' }, 
        totalOutstandingUnits: { type: 'number' } 
      } 
    } 
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 400, description: 'Portfolio is not a fund' })
  async refreshNavPerUnit(@Param('id', ParseUUIDPipe) portfolioId: string) {
    return this.investorHoldingService.refreshNavPerUnit(portfolioId, true);
  }

  @Post(':id/convert-to-portfolio')
  @ApiOperation({ 
    summary: 'Convert fund to portfolio',
    description: 'Convert a fund back to a regular portfolio by cleaning up all fund-related data including investor holdings, fund unit transactions, and related cash flows. This operation will reset the portfolio to non-fund status and recalculate cash balance from remaining cash flows.'
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'accountId', description: 'Account ID for ownership validation', required: true })
  @ApiResponse({ 
    status: 200, 
    description: 'Fund successfully converted to portfolio',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        portfolioId: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 400, description: 'Portfolio is not a fund or accountId is missing' })
  @ApiResponse({ status: 403, description: 'Forbidden - Portfolio does not belong to the account' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  async convertFundToPortfolio(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Query('accountId') accountId: string
  ) {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    
    // Validate portfolio ownership
    await this.accountValidationService.validatePortfolioOwnership(portfolioId, accountId);
    
    await this.portfolioService.convertFundToPortfolio(portfolioId);
    return {
      success: true,
      message: 'Fund successfully converted to portfolio',
      portfolioId: portfolioId
    };
  }

}
