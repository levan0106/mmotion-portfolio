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
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { IsUUID, IsOptional, IsDateString, IsString, IsIn } from 'class-validator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { TradingService } from '../services/trading.service';
import { CreateTradeDto, UpdateTradeDto } from '../dto/trade.dto';
import { TradeResponseDto } from '../dto/trade-response.dto';
import { Trade, TradeSide } from '../entities/trade.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { Asset } from '../../asset/entities/asset.entity';
import { Account } from '../../shared/entities/account.entity';

export interface TradeQueryDto {
  portfolioId: string;
  assetId?: string;
  side?: TradeSide;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class TradeAnalysisQueryDto {
  @IsUUID()
  portfolioId: string;

  @IsOptional()
  @IsUUID()
  assetId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['1M', '3M', '6M', '1Y', 'ALL'])
  timeframe?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pnl', 'trades', 'winrate'])
  metric?: string;
}

/**
 * Controller for managing trades and trading operations.
 * Provides REST API endpoints for trade CRUD operations and analysis.
 */
@ApiTags('Trading')
@Controller('api/v1/trades')
export class TradingController {
  constructor(
    private readonly tradingService: TradingService,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  /**
   * Get all trades with optional filtering
   * @param query Query parameters for filtering
   * @returns Array of trades
   */
  @Get()
  @ApiOperation({ summary: 'Get all trades with optional filtering' })
  @ApiResponse({
    status: 200,
    description: 'List of trades retrieved successfully',
    type: [TradeResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiQuery({ name: 'portfolioId', required: true, description: 'Portfolio ID' })
  @ApiQuery({ name: 'assetId', required: false, description: 'Asset ID filter' })
  @ApiQuery({ name: 'side', required: false, enum: TradeSide, description: 'Trade side filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (ISO string)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getTrades(@Query() query: TradeQueryDto): Promise<TradeResponseDto[]> {
    const {
      portfolioId,
      assetId,
      side,
      startDate,
      endDate,
    } = query;
    //debugger;
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return this.tradingService.getTrades(
      portfolioId,
      assetId,
      side,
      startDateObj,
      endDateObj,
    );
  }

  /**
   * Create a new trade
   * @param createTradeDto Trade creation data
   * @returns Created trade
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new trade' })
  @ApiResponse({
    status: 201,
    description: 'Trade created successfully',
    type: Trade,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid trade data',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or asset not found',
  })
  @ApiBody({ type: CreateTradeDto })
  async createTrade(@Body() createTradeDto: CreateTradeDto): Promise<Trade> {
    return this.tradingService.createTrade(createTradeDto);
  }

  /**
   * Get trade analysis for a portfolio
   * @param query Analysis query parameters
   * @returns Trade analysis data
   */
  @Get('analysis/portfolio')
  @ApiOperation({ summary: 'Get trade analysis for a portfolio' })
  @ApiResponse({
    status: 200,
    description: 'Trade analysis retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiQuery({ name: 'portfolioId', required: true, description: 'Portfolio ID' })
  @ApiQuery({ name: 'assetId', required: false, description: 'Asset ID filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (ISO string)' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Timeframe filter (1M, 3M, 6M, 1Y, ALL)' })
  @ApiQuery({ name: 'metric', required: false, description: 'Metric filter (pnl, trades, winrate)' })
  async getTradeAnalysis(@Query() query: TradeAnalysisQueryDto): Promise<{
    statistics: any;
    pnlSummary: any;
    topTrades: any[];
    worstTrades: any[];
  }> {
    const {
      portfolioId,
      assetId,
      startDate,
      endDate,
      timeframe,
      metric,
    } = query;

    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return this.tradingService.getTradeAnalysis(
      portfolioId,
      assetId,
      startDateObj,
      endDateObj,
      timeframe,
      metric,
    );
  }

  /**
   * Get trading performance metrics
   * @param query Performance query parameters
   * @returns Trading performance data
   */
  @Get('performance/portfolio')
  @ApiOperation({ summary: 'Get trading performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'Trading performance retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiQuery({ name: 'portfolioId', required: true, description: 'Portfolio ID' })
  @ApiQuery({ name: 'assetId', required: false, description: 'Asset ID filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (ISO string)' })
  async getTradingPerformance(@Query() query: TradeAnalysisQueryDto): Promise<{
    totalTrades: number;
    winRate: number;
    totalPnl: number;
    averagePnl: number;
    bestTrade: any;
    worstTrade: any;
    monthlyPerformance: any[];
  }> {
    const {
      portfolioId,
      assetId,
      startDate,
      endDate,
    } = query;

    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    const analysis = await this.tradingService.getTradeAnalysis(
      portfolioId,
      assetId,
      startDateObj,
      endDateObj,
    );

    // Transform analysis data into performance metrics
    const totalTrades = analysis.statistics.totalTrades;
    const winRate = analysis.pnlSummary.winRate || 0;
    const totalPnl = analysis.pnlSummary.totalPnl || 0;
    const averagePnl = analysis.pnlSummary.averagePnl || 0;
    const bestTrade = analysis.topTrades[0] || null;
    const worstTrade = analysis.worstTrades[0] || null;

    // Mock monthly performance data - in real implementation, this would be calculated
    const monthlyPerformance = [
      { month: '2024-01', pnl: 1000, trades: 5 },
      { month: '2024-02', pnl: -500, trades: 3 },
      { month: '2024-03', pnl: 2000, trades: 8 },
    ];

    return {
      totalTrades,
      winRate,
      totalPnl,
      averagePnl,
      bestTrade,
      worstTrade,
      monthlyPerformance,
    };
  }

  /**
   * Get recent trades for a portfolio
   * @param portfolioId Portfolio ID
   * @param limit Number of recent trades to return
   * @returns Array of recent trades
   */
  @Get('recent/:portfolioId')
  @ApiOperation({ summary: 'Get recent trades for a portfolio' })
  @ApiResponse({
    status: 200,
    description: 'Recent trades retrieved successfully',
    type: [Trade],
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found',
  })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of trades to return (default: 10)' })
  async getRecentTrades(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('limit') limit?: number,
  ): Promise<Trade[]> {
    return this.tradingService.getTrades(portfolioId, undefined, undefined, undefined, undefined);
  }

  /**
   * Get trade statistics for a portfolio
   * @param portfolioId Portfolio ID
   * @param query Optional query parameters
   * @returns Trade statistics
   */
  @Get('statistics/:portfolioId')
  @ApiOperation({ summary: 'Get trade statistics for a portfolio' })
  @ApiResponse({
    status: 200,
    description: 'Trade statistics retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found',
  })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'assetId', required: false, description: 'Asset ID filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (ISO string)' })
  async getTradeStatistics(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query() query: { assetId?: string; startDate?: string; endDate?: string },
  ): Promise<{
    totalTrades: number;
    buyTrades: number;
    sellTrades: number;
    totalVolume: number;
    totalValue: number;
    averagePrice: number;
  }> {
    const { assetId, startDate, endDate } = query;
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    const analysis = await this.tradingService.getTradeAnalysis(
      portfolioId,
      assetId,
      startDateObj,
      endDateObj,
    );

    return analysis.statistics;
  }

  /**
   * Get available portfolios and assets for testing
   * @returns List of portfolios and assets
   */
  @Get('test-data')
  @ApiOperation({ summary: 'Get available test data' })
  @ApiResponse({ status: 200, description: 'Test data retrieved successfully' })
  async getTestData(): Promise<{
    portfolios: Array<{ id: string; name: string; accountId: string }>;
    assets: Array<{ id: string; symbol: string; name: string }>;
  }> {
    const portfolios = await this.portfolioRepository.find({
      select: ['portfolioId', 'name', 'accountId'],
    });

    const assets = await this.assetRepository.find({
      select: ['id', 'symbol', 'name'],
    });

    return {
      portfolios: portfolios.map(p => ({
        id: p.portfolioId,
        name: p.name,
        accountId: p.accountId,
      })),
      assets: assets.map(a => ({
        id: a.id,
        symbol: a.symbol,
        name: a.name,
      })),
    };
  }

  /**
   * Get trade details by ID
   * @param id Trade ID
   * @returns Trade details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get trade details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Trade details retrieved successfully',
    type: Trade,
  })
  @ApiResponse({
    status: 404,
    description: 'Trade not found',
  })
  @ApiParam({ name: 'id', description: 'Trade ID' })
  async getTradeDetails(@Param('id', ParseUUIDPipe) id: string): Promise<Trade> {
    return this.tradingService.getTradeDetails(id);
  }

  /**
   * Get trade details with matching information
   * @param id Trade ID
   * @returns Trade with details
   */
  @Get(':id/details')
  @ApiOperation({ summary: 'Get trade details with matching information' })
  @ApiResponse({
    status: 200,
    description: 'Trade details with matching information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        trade: { $ref: '#/components/schemas/Trade' },
        tradeDetails: {
          type: 'array',
          items: { $ref: '#/components/schemas/TradeDetail' }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Trade not found',
  })
  @ApiParam({ name: 'id', description: 'Trade ID' })
  async getTradeDetailsWithMatching(@Param('id', ParseUUIDPipe) id: string): Promise<{ trade: Trade; tradeDetails: any[] }> {
    const trade = await this.tradingService.getTradeDetails(id);
    const tradeDetails = trade.sellDetails || trade.buyDetails || [];
    return { trade, tradeDetails };
  }

  /**
   * Update an existing trade
   * @param id Trade ID
   * @param updateTradeDto Update data
   * @returns Updated trade
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update an existing trade' })
  @ApiResponse({
    status: 200,
    description: 'Trade updated successfully',
    type: Trade,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade not found',
  })
  @ApiParam({ name: 'id', description: 'Trade ID' })
  @ApiBody({ type: UpdateTradeDto })
  async updateTrade(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTradeDto: UpdateTradeDto,
  ): Promise<Trade> {
    return this.tradingService.updateTrade(id, updateTradeDto);
  }

  /**
   * Delete a trade
   * @param id Trade ID
   * @returns Deletion result
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a trade' })
  @ApiResponse({
    status: 204,
    description: 'Trade deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade not found',
  })
  @ApiParam({ name: 'id', description: 'Trade ID' })
  async deleteTrade(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tradingService.deleteTrade(id);
  }

  /**
   * Process trade matching for a sell trade
   * @param id Trade ID
   * @returns Trade matching result
   */
  @Post(':id/match')
  @ApiOperation({ summary: 'Process trade matching for a sell trade' })
  @ApiResponse({
    status: 200,
    description: 'Trade matching processed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid trade for matching',
  })
  @ApiParam({ name: 'id', description: 'Trade ID' })
  async processTradeMatching(@Param('id', ParseUUIDPipe) id: string): Promise<{
    trade: Trade;
    matchedDetails: any[];
    remainingQuantity: number;
    totalPnl: number;
  }> {
    const trade = await this.tradingService.getTradeDetails(id);
    return this.tradingService.processTradeMatching(trade);
  }

  /**
   * Process trade matching using LIFO algorithm
   * @param id Trade ID
   * @returns Trade matching result
   */
  @Post(':id/match/lifo')
  @ApiOperation({ summary: 'Process trade matching using LIFO algorithm' })
  @ApiResponse({
    status: 200,
    description: 'LIFO trade matching processed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid trade for matching',
  })
  @ApiParam({ name: 'id', description: 'Trade ID' })
  async processTradeMatchingLIFO(@Param('id', ParseUUIDPipe) id: string): Promise<{
    trade: Trade;
    matchedDetails: any[];
    remainingQuantity: number;
    totalPnl: number;
  }> {
    const trade = await this.tradingService.getTradeDetails(id);
    return this.tradingService.processTradeMatchingLIFO(trade);
  }

  /**
   * Create test data for development
   * @returns Created test data information
   */
  @Post('setup-test-data')
  @ApiOperation({ summary: 'Create test data for development' })
  @ApiResponse({ status: 201, description: 'Test data created successfully' })
  async setupTestData(): Promise<{
    account: { id: string; name: string; email: string };
    portfolio: { id: string; name: string };
    assets: Array<{ id: string; symbol: string; name: string }>;
  }> {
    // Create test account
    let account = await this.accountRepository.findOne({ where: { email: 'test@example.com' } });
    
    if (!account) {
      account = this.accountRepository.create({
        name: 'Test User',
        email: 'test@example.com',
        baseCurrency: 'VND',
      });
      account = await this.accountRepository.save(account);
    }

    // Create test assets
    const testAssets = [
      { symbol: 'HPG', name: 'Hoa Phat Group', assetType: 'STOCK', assetClass: 'EQUITY' },
      { symbol: 'VCB', name: 'Vietcombank', assetType: 'STOCK', assetClass: 'EQUITY' },
    ];

    const assets = [];
    for (const assetData of testAssets) {
      let asset = await this.assetRepository.findOne({ where: { symbol: assetData.symbol } });
      
      if (!asset) {
        // Use a default system user ID for test data creation
        const systemUserId = '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5'; // Default test user ID
        asset = this.assetRepository.create({
          ...assetData,
          createdBy: systemUserId,
          updatedBy: systemUserId,
        });
        asset = await this.assetRepository.save(asset);
      }
      assets.push(asset);
    }

    // Create test portfolio
    let portfolio = await this.portfolioRepository.findOne({ where: { name: 'Test Portfolio' } });
    
    if (!portfolio) {
      portfolio = this.portfolioRepository.create({
        accountId: account.accountId,
        name: 'Test Portfolio',
        baseCurrency: 'VND',
        totalValue: 100000000,
        cashBalance: 50000000,
        unrealizedPl: 5000000,
        realizedPl: 2000000,
      });
      portfolio = await this.portfolioRepository.save(portfolio);
    }

    return {
      account: {
        id: account.accountId,
        name: account.name,
        email: account.email,
      },
      portfolio: {
        id: portfolio.portfolioId,
        name: portfolio.name,
      },
      assets: assets.map(asset => ({
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
      })),
    };
  }
}
