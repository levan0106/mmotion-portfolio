import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Trade, TradeSide, TradeType } from '../entities/trade.entity';
import { TradeDetail } from '../entities/trade-detail.entity';
import { TradeRepository } from '../repositories/trade.repository';
import { TradeDetailRepository } from '../repositories/trade-detail.repository';
import { FIFOEngine } from '../engines/fifo-engine';
import { LIFOEngine } from '../engines/lifo-engine';
import { PositionManager } from '../managers/position-manager';
import { AssetCacheService } from '../../asset/services/asset-cache.service';
import { CashFlowService } from '../../portfolio/services/cash-flow.service';
import { PortfolioCalculationService } from '../../portfolio/services/portfolio-calculation.service';
import { PortfolioValueCalculatorService } from '../../portfolio/services/portfolio-value-calculator.service';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { RiskMetricsConfig } from '../../../config/risk-metrics.config';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { CreateTradeDto, UpdateTradeDto } from '../dto/trade.dto';
import { NotificationGateway } from '../../../notification/notification.gateway';


export interface TradeMatchingResult {
  trade: Trade;
  matchedDetails: TradeDetail[];
  remainingQuantity: number;
  totalPnl: number;
}

/**
 * Service for managing trades and trade matching operations.
 * Handles trade creation, updates, deletion, and FIFO/LIFO matching.
 */
@Injectable()
export class TradingService {
  private readonly CACHE_ENABLED = process.env.CACHE_ENABLED === 'true';

  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(TradeDetail)
    private readonly tradeDetailRepository: Repository<TradeDetail>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepo: Repository<Portfolio>,
    private readonly tradeRepo: TradeRepository,
    private readonly tradeDetailRepo: TradeDetailRepository,
    private readonly fifoEngine: FIFOEngine,
    private readonly lifoEngine: LIFOEngine,
    private readonly positionManager: PositionManager,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly assetCacheService: AssetCacheService,
    private readonly cashFlowService: CashFlowService,
    private readonly portfolioCalculationService: PortfolioCalculationService,
    private readonly portfolioValueCalculator: PortfolioValueCalculatorService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * Comprehensive cache invalidation when trades are modified
   * This clears ALL caches related to the portfolio and affected assets
   * @param portfolioId Portfolio ID
   * @param assetId Asset ID (optional, for asset-specific caches)
   */
  private async invalidateAllRelatedCaches(portfolioId: string, assetId?: string): Promise<void> {
    try {
      // Get portfolio details to find account ID
      const trade = await this.tradeRepository.findOne({
        where: { portfolioId },
        relations: ['portfolio'],
      });

      const accountId = trade?.portfolio?.accountId;

      // 1. Portfolio-level caches
      const portfolioCacheKeys = [
        `portfolio:${portfolioId}`,
        `allocation:${portfolioId}`,
        `metrics:${portfolioId}`,
        `allocation-timeline:${portfolioId}:6`,
        `allocation-timeline:${portfolioId}:12`,
        `allocation-timeline:${portfolioId}:24`,
        `allocation-timeline:${portfolioId}:36`,
      ];

      // 2. Account-level caches
      const accountCacheKeys = accountId ? [
        `portfolios:account:${accountId}`,
      ] : [];

      // 3. Asset-level caches (if assetId provided)
      const assetCacheKeys = assetId ? [
        `initial:${assetId}`,
        `current:${assetId}:${portfolioId}`,
        `current:${assetId}:none`,
        `asset:${assetId}`,
        `asset-trades:${assetId}`,
        `asset-performance:${assetId}`,
        `asset-analytics:${assetId}`,
      ] : [];

      // 4. Portfolio analytics caches (specific keys - no wildcards)
      const analyticsCacheKeys = [
        `portfolio-analytics:${portfolioId}`,
        `portfolio-performance:${portfolioId}`,
        `portfolio-risk:${portfolioId}`,
        `portfolio-diversification:${portfolioId}`,
        `portfolio-cashflow:${portfolioId}`,
        `portfolio-returns:${portfolioId}`,
        `portfolio-volatility:${portfolioId}`,
        `portfolio-sharpe:${portfolioId}`,
      ];

      // Combine all cache keys
      const allCacheKeys = [
        ...portfolioCacheKeys,
        ...accountCacheKeys,
        ...assetCacheKeys,
        ...analyticsCacheKeys,
      ];

      // Clear all caches
      const clearResults = await Promise.allSettled(
        allCacheKeys.map(async (key) => {
          try {
            if (this.CACHE_ENABLED) {
              await this.cacheManager.del(key);
              console.log(`Cache clear attempt for key '${key}': success`);
            }
            return true;
          } catch (error) {
            console.log(`Cache clear attempt for key '${key}': failed - ${error.message}`);
            return false;
          }
        })
      );

      const successCount = clearResults.filter(result => result.status === 'fulfilled' && result.value).length;
      console.log(`Cache invalidation completed: ${successCount}/${allCacheKeys.length} keys cleared for portfolio ${portfolioId}${assetId ? ` and asset ${assetId}` : ''}`);

      // Also clear asset-specific caches using AssetCacheService
      if (assetId) {
        try {
          this.assetCacheService.invalidateAsset(assetId);
          console.log(`Asset cache invalidated for asset ${assetId}`);
        } catch (error) {
          console.warn(`Failed to invalidate asset cache for ${assetId}:`, error);
        }
      }
      
    } catch (error) {
      // Log error but don't throw - cache invalidation failure shouldn't break trade operations
      console.warn('Failed to invalidate related caches:', error);
    }
  }

  /**
   * Create a new trade
   * @param createTradeDto Trade creation data
   * @returns Created trade
   */
  async createTrade(createTradeDto: CreateTradeDto): Promise<Trade> {
    // Validate trade data
    this.validateTradeData(createTradeDto);

    // Create trade entity
    const trade = this.tradeRepository.create({
      portfolioId: createTradeDto.portfolioId,
      assetId: createTradeDto.assetId,
      tradeDate: new Date(createTradeDto.tradeDate),
      side: createTradeDto.side,
      quantity: createTradeDto.quantity,
      price: createTradeDto.price,
      fee: createTradeDto.fee || 0,
      tax: createTradeDto.tax || 0,
      tradeType: createTradeDto.tradeType || TradeType.NORMAL,
      source: createTradeDto.source,
      exchange: createTradeDto.exchange?.toUpperCase().trim(),
      fundingSource: createTradeDto.fundingSource?.toUpperCase().trim(),
      notes: createTradeDto.notes,
    });

    // Save trade
    const savedTrade = await this.tradeRepository.save(trade);

    // Process trade matching if it's a sell trade
    if (savedTrade.side === TradeSide.SELL) {
      await this.processTradeMatching(savedTrade);
    }

    // Create cash flow from trade
    await this.cashFlowService.createCashFlowFromTrade(savedTrade);

    // Invalidate all related caches
    await this.invalidateAllRelatedCaches(savedTrade.portfolioId, savedTrade.assetId);

    // Send notification
    try {
      const portfolio = await this.portfolioRepo.findOne({
        where: { portfolioId: savedTrade.portfolioId },
      });
      
      if (portfolio) {
        const title = `Trade ${savedTrade.side} Successful`;
        const message = `Successfully ${savedTrade.side.toLowerCase()}ed ${savedTrade.quantity} units at ${savedTrade.price} ${portfolio.baseCurrency}`;
        const actionUrl = `/portfolios/${savedTrade.portfolioId}/trading`;
        
        await this.notificationGateway.sendTradeNotification(
          portfolio.accountId,
          title,
          message,
          actionUrl,
          {
            tradeId: savedTrade.tradeId,
            assetId: savedTrade.assetId,
            portfolioId: savedTrade.portfolioId,
            side: savedTrade.side,
            quantity: savedTrade.quantity,
            price: savedTrade.price,
          }
        );
      }
    } catch (error) {
      console.error('Error sending trade notification:', error);
      // Don't throw error to avoid breaking trade creation
    }

    return savedTrade;
  }

  /**
   * Update an existing trade
   * @param tradeId Trade ID
   * @param updateTradeDto Update data
   * @returns Updated trade
   */
  async updateTrade(tradeId: string, updateTradeDto: UpdateTradeDto): Promise<Trade> {
    const trade = await this.tradeRepository.findOne({
      where: { tradeId: tradeId },
      relations: ['asset', 'portfolio'],
    });

    if (!trade) {
      throw new NotFoundException(`Trade with ID ${tradeId} not found`);
    }

    // Validate update data
    if (updateTradeDto.quantity !== undefined && updateTradeDto.quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    if (updateTradeDto.price !== undefined && updateTradeDto.price < 0) {
      throw new BadRequestException('Price must be non-negative');
    }

    // Store original assetId to handle position updates
    const originalAssetId = trade.assetId;
    const isAssetChanged = updateTradeDto.assetId !== undefined && updateTradeDto.assetId !== originalAssetId;

    // Update trade
    if (updateTradeDto.portfolioId !== undefined) trade.portfolioId = updateTradeDto.portfolioId;
    if (updateTradeDto.assetId !== undefined) trade.assetId = updateTradeDto.assetId;
    if (updateTradeDto.tradeDate) {
      trade.tradeDate = new Date(updateTradeDto.tradeDate);
    }
    if (updateTradeDto.side !== undefined) trade.side = updateTradeDto.side;
    if (updateTradeDto.quantity !== undefined) trade.quantity = updateTradeDto.quantity;
    if (updateTradeDto.price !== undefined) trade.price = updateTradeDto.price;
    if (updateTradeDto.fee !== undefined) trade.fee = updateTradeDto.fee;
    if (updateTradeDto.tax !== undefined) trade.tax = updateTradeDto.tax;
    if (updateTradeDto.tradeType !== undefined) trade.tradeType = updateTradeDto.tradeType;
    if (updateTradeDto.source !== undefined) trade.source = updateTradeDto.source;
    if (updateTradeDto.exchange !== undefined) trade.exchange = updateTradeDto.exchange?.toUpperCase().trim();
    if (updateTradeDto.fundingSource !== undefined) trade.fundingSource = updateTradeDto.fundingSource?.toUpperCase().trim();
    if (updateTradeDto.notes !== undefined) trade.notes = updateTradeDto.notes;
    
    // Use update method instead of save for better reliability
    await this.tradeRepository.update(trade.tradeId, {
      portfolioId: trade.portfolioId,
      assetId: trade.assetId,
      tradeDate: trade.tradeDate,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
      fee: trade.fee,
      tax: trade.tax,
      tradeType: trade.tradeType,
      source: trade.source,
      exchange: trade.exchange,
      fundingSource: trade.fundingSource,
      notes: trade.notes,
    });
    
    // Reload the trade from database
    const updatedTrade = await this.tradeRepository.findOne({
      where: { tradeId: trade.tradeId },
      relations: ['asset', 'portfolio'],
    });

    // Re-process trade matching if it's a sell trade
    if (updatedTrade.side === TradeSide.SELL) {
      await this.reprocessTradeMatching(updatedTrade);
    }

    // Always create cash flow for the updated trade
    await this.cashFlowService.createCashFlowFromTrade(updatedTrade);

    // Invalidate all related caches (including both old and new asset if changed)
    await this.invalidateAllRelatedCaches(updatedTrade.portfolioId, updatedTrade.assetId);
    if (isAssetChanged) {
      await this.invalidateAllRelatedCaches(updatedTrade.portfolioId, originalAssetId);
    }

    return updatedTrade;
  }

  /**
   * Delete a trade
   * @param tradeId Trade ID
   * @returns Deletion result
   */
  async deleteTrade(tradeId: string): Promise<void> {
    const trade = await this.tradeRepository.findOne({
      where: { tradeId: tradeId },
      relations: ['sellDetails', 'buyDetails'],
    });

    if (!trade) {
      throw new NotFoundException(`Trade with ID ${tradeId} not found`);
    }

    // Delete associated trade details
    if (trade.sellDetails && trade.sellDetails.length > 0) {
      await this.tradeDetailRepository.delete({
        sellTradeId: tradeId,
      });
    }

    if (trade.buyDetails && trade.buyDetails.length > 0) {
      await this.tradeDetailRepository.delete({
        buyTradeId: tradeId,
      });
    }
    
    // Delete cash flows associated with this trade FIRST
    await this.cashFlowService.deleteCashFlowAndRecalculateBalanceByReferenceId(tradeId);
    
    // Delete the trade
    await this.tradeRepository.delete(tradeId);

    // Invalidate all related caches
    await this.invalidateAllRelatedCaches(trade.portfolioId, trade.assetId);
  }

  /**
   * Get trades with filtering
   * @param portfolioId Portfolio ID
   * @param assetId Optional asset ID filter
   * @param side Optional trade side filter
   * @param startDate Optional start date filter
   * @param endDate Optional end date filter
   * @returns Array of trades with calculated fields
   */
  async getTrades(
    portfolioId: string,
    assetId?: string,
    side?: TradeSide,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    let trades: Trade[];

    if (assetId && side) {
      trades = await this.tradeRepo.findTradesBySide(side, portfolioId, assetId);
    } else if (assetId) {
      trades = await this.tradeRepo.findTradesByAssetAndPortfolio(assetId, portfolioId);
    } else if (startDate && endDate) {
      trades = await this.tradeRepo.findTradesByDateRange(startDate, endDate, portfolioId, assetId);
    } else {
      trades = await this.tradeRepo.findTradesByPortfolio(portfolioId);
    }

    // Calculate P&L for each trade
    return this.calculateTradePnl(trades);
  }

  /**
   * Get trade details
   * @param tradeId Trade ID
   * @returns Trade with details
   */
  async getTradeDetails(tradeId: string): Promise<Trade> {
    const trade = await this.tradeRepository.findOne({
      where: { tradeId: tradeId },
      relations: ['asset', 'portfolio', 'sellDetails', 'buyDetails'],
    });

    if (!trade) {
      throw new NotFoundException(`Trade with ID ${tradeId} not found`);
    }

    return trade;
  }

  /**
   * Process trade matching using FIFO algorithm
   * @param sellTrade Sell trade to match
   * @returns Trade matching result
   */
  async processTradeMatching(sellTrade: Trade): Promise<TradeMatchingResult> {
    if (sellTrade.side !== TradeSide.SELL) {
      throw new Error("processTradeMatching chỉ áp dụng cho SELL trades");
    }
  
    // Lấy tất cả BUY (bao gồm cả BONUS) chưa match hết
    const buyTrades = await this.tradeRepo.findUnmatchedBuyTrades(
      sellTrade.assetId,
      sellTrade.portfolioId,
      sellTrade.tradeDate,
    );

    if (buyTrades.length === 0) {
      return {
        trade: sellTrade,
        matchedDetails: [],
        remainingQuantity: sellTrade.quantity,
        totalPnl: 0,
      };
    }

    // Use FIFO engine for matching
    const matchResult = this.fifoEngine.matchTrades(sellTrade, buyTrades);

    // Save trade details
    const savedDetails = [];
    for (const detail of matchResult.matchedDetails) {
      const savedDetail = await this.tradeDetailRepository.save(detail);
      savedDetails.push(savedDetail);
    }

    return {
      trade: sellTrade,
      matchedDetails: savedDetails,
      remainingQuantity: matchResult.remainingQuantity,
      totalPnl: matchResult.totalPnl,
    };
  }

  /**
   * Reprocess trade matching after trade update
   * @param sellTrade Updated sell trade
   * @returns Trade matching result
   */
  async reprocessTradeMatching(sellTrade: Trade): Promise<TradeMatchingResult> {
    // Delete existing trade details
    await this.tradeDetailRepository.delete({
      sellTradeId: sellTrade.tradeId,
    });

    // Process new matching
    return this.processTradeMatching(sellTrade);
  }

  /**
   * Process trade matching using LIFO algorithm
   * @param sellTrade Sell trade to match
   * @returns Trade matching result
   */
  async processTradeMatchingLIFO(sellTrade: Trade): Promise<TradeMatchingResult> {
    // Get unmatched buy trades for the same asset and portfolio
    const buyTrades = await this.tradeRepo.findUnmatchedBuyTrades(
      sellTrade.assetId,
      sellTrade.portfolioId,
    );

    if (buyTrades.length === 0) {
      return {
        trade: sellTrade,
        matchedDetails: [],
        remainingQuantity: sellTrade.quantity,
        totalPnl: 0,
      };
    }

    // Use LIFO engine for matching
    const matchResult = this.lifoEngine.matchTrades(sellTrade, buyTrades);

    // Save trade details
    const savedDetails = [];
    for (const detail of matchResult.matchedDetails) {
      const savedDetail = await this.tradeDetailRepository.save(detail);
      savedDetails.push(savedDetail);
    }

    return {
      trade: sellTrade,
      matchedDetails: savedDetails,
      remainingQuantity: matchResult.remainingQuantity,
      totalPnl: matchResult.totalPnl,
    };
  }

  /**
   * Get trade analysis for a portfolio
   * @param portfolioId Portfolio ID
   * @param assetId Optional asset ID filter
   * @param startDate Optional start date filter
   * @param endDate Optional end date filter
   * @param timeframe Optional timeframe filter
   * @param granularity Data granularity (daily, weekly, monthly)
   * @returns Trade analysis
   */
  async getTradeAnalysis(
    portfolioId: string,
    assetId?: string,
    startDate?: Date,
    endDate?: Date,
    timeframe?: string,
    granularity: 'daily' | 'weekly' | 'monthly' = 'monthly',
  ): Promise<{
    statistics: any;
    pnlSummary: any;
    topTrades: any[];
    worstTrades: any[];
    monthlyPerformance: any[];
    assetPerformance: any[];
    riskMetrics: {
      sharpeRatio: number;
      volatility: number;
      var95: number;
      maxDrawdown: number;
    };
  }> {
    // Debug: Log input parameters
    console.log('🔍 getTradeAnalysis input:', {
      portfolioId,
      assetId,
      startDate,
      endDate,
      timeframe,
      granularity
    });

    // Calculate date range based on timeframe if not provided
    let actualStartDate = startDate;
    let actualEndDate = endDate;

    if (timeframe && !startDate && !endDate) {
      const now = new Date();
      actualEndDate = now;

      switch (timeframe) {
        case '1M':
          // Get data from 1 month ago to now
          actualStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3M':
          actualStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6M':
          actualStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1Y':
          actualStartDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'ALL':
        default:
          // No date filtering
          actualStartDate = undefined;
          actualEndDate = undefined;
          break;
      }
    }

    // Debug: Log date filtering
    console.log('🔍 Date filtering debug:', {
      actualStartDate: actualStartDate?.toISOString(),
      actualEndDate: actualEndDate?.toISOString(),
      timeframe,
      portfolioId
    });
    
    // Debug: Log parameters passed to calculateMonthlyPerformance
    console.log('🔍 About to call calculateMonthlyPerformance with:', {
      portfolioId,
      assetId,
      actualStartDate: actualStartDate?.toISOString(),
      actualEndDate: actualEndDate?.toISOString()
    });

    // Get statistics from trades directly
    let trades;
    if (actualStartDate && actualEndDate) {
      // Use raw query for debugging
      const startDateStr = actualStartDate.toISOString();
      const endDateStr = actualEndDate.toISOString();
      
      console.log('🔍 Using raw query with dates:', { startDateStr, endDateStr });
      
      trades = await this.tradeRepo.query(`
        SELECT * FROM trades 
        WHERE portfolio_id = $1 
        AND trade_date >= $2 
        AND trade_date <= $3
        ORDER BY trade_date ASC
      `, [portfolioId, startDateStr, endDateStr]);
    } else {
      trades = await this.tradeRepo.find({
        where: {
          portfolioId: portfolioId,
          ...(assetId && { assetId: assetId }),
        },
        order: { tradeDate: 'ASC' },
      });
    }

    // Debug: Log filtered trades
    console.log('🔍 Filtered trades count:', trades.length);
    if (trades.length > 0) {
      console.log('🔍 First trade date:', trades[0].tradeDate);
      console.log('🔍 Last trade date:', trades[trades.length - 1].tradeDate);
    }

    const statistics = {
      totalTrades: trades.length,
      buyTrades: trades.filter(t => t.side === 'BUY').length,
      sellTrades: trades.filter(t => t.side === 'SELL').length,
      totalVolume: trades.reduce((sum, trade) => sum + (parseFloat(trade.quantity.toString()) * parseFloat(trade.price.toString())), 0),
      totalValue: trades.reduce((sum, trade) => sum + (parseFloat(trade.quantity.toString()) * parseFloat(trade.price.toString())), 0),
      averagePrice: trades.length > 0 ? trades.reduce((sum, trade) => sum + parseFloat(trade.price.toString()), 0) / trades.length : 0,
      totalFees: trades.reduce((sum, trade) => sum + (parseFloat(trade.fee?.toString() || '0')), 0),
      totalTaxes: trades.reduce((sum, trade) => sum + (parseFloat(trade.tax?.toString() || '0')), 0),
    };

    // Get realized P&L from trade details
    const realizedPnl = await this.tradeDetailRepo.getPortfolioPnlSummary(
      portfolioId,
      startDate,
      endDate,
    );
    

    // Get top and worst performing trades
    const topTradesRaw = await this.tradeDetailRepo.getTopPerformingTrades(10, portfolioId);
    const worstTradesRaw = await this.tradeDetailRepo.getWorstPerformingTrades(10, portfolioId);

    // Transform trade details to include asset information
    const topTrades = topTradesRaw.map(trade => ({
      tradeId: trade.detailId,
      assetSymbol: trade.asset?.symbol || 'N/A',
      assetName: trade.asset?.name || 'N/A',
      side: trade.sellTrade?.side || 'SELL',
      quantity: trade.matchedQty,
      price: trade.sellPrice,
      realizedPl: parseFloat(trade.pnl?.toString() || '0'),
      realizedPlPercentage: trade.buyPrice > 0 ? ((trade.sellPrice - trade.buyPrice) / trade.buyPrice) * 100 : 0,
      tradeDate: trade.sellTrade?.tradeDate || trade.createdAt,
    }));

    const worstTrades = worstTradesRaw.map(trade => ({
      tradeId: trade.detailId,
      assetSymbol: trade.asset?.symbol || 'N/A',
      assetName: trade.asset?.name || 'N/A',
      side: trade.sellTrade?.side || 'SELL',
      quantity: trade.matchedQty,
      price: trade.sellPrice,
      realizedPl: parseFloat(trade.pnl?.toString() || '0'),
      realizedPlPercentage: trade.buyPrice > 0 ? ((trade.sellPrice - trade.buyPrice) / trade.buyPrice) * 100 : 0,
      tradeDate: trade.sellTrade?.tradeDate || trade.createdAt,
    }));

    // Calculate performance data with granularity
    const performanceData = await this.calculatePerformanceData(
      portfolioId,
      assetId,
      actualStartDate,
      actualEndDate,
      granularity,
    );

    // Calculate asset performance with proper structure
    const assetPerformance = await this.calculateAssetPerformance(
      portfolioId,
      assetId,
      actualStartDate,
      actualEndDate,
    );

    // Calculate risk metrics
    const riskMetrics = await this.calculateRiskMetrics(
      portfolioId,
      assetId,
      actualStartDate,
      actualEndDate,
    );

    // Use PortfolioCalculationService for consistent P&L calculations
    let portfolioCalculation;
    try {
      portfolioCalculation = await this.portfolioCalculationService.calculatePortfolioAssetValues(portfolioId);
    } catch (error) {
      console.error('Error getting portfolio calculation:', error);
      portfolioCalculation = { assetPositions: [], totalValue: 0 };
    }
    

    // Calculate overall P&L summary using helper services
    const allRealizedTrades = [...topTrades, ...worstTrades];
    const uniqueTrades = allRealizedTrades.filter((trade, index, self) => 
      index === self.findIndex(t => t.tradeId === trade.tradeId)
    );
    
    // Use PortfolioValueCalculatorService for accurate realized P&L
    const totalRealizedPnl = await this.portfolioValueCalculator.calculateRealizedPL(portfolioId);
    const totalUnrealizedPnl = portfolioCalculation.assetPositions.reduce(
      (sum, position) => sum + (parseFloat(position.unrealizedPl?.toString() || '0') || 0),  
      0
    );
    const totalPnl = totalRealizedPnl + totalUnrealizedPnl;
    
    const totalVolume = statistics.totalVolume;
    const totalTrades = statistics.totalTrades;
    
    // Calculate Win Rate based on realized P&L from trade details
    const winningTrades = uniqueTrades.filter(trade => (Number(trade.realizedPl) || 0) > 0).length;
    const losingTrades = uniqueTrades.filter(trade => (Number(trade.realizedPl) || 0) < 0).length;
    const totalRealizedTrades = winningTrades + losingTrades;
    const winRate = totalRealizedTrades > 0 ? (winningTrades / totalRealizedTrades) * 100 : 0;
    
    // Calculate additional P&L metrics
    const winningTradesList = uniqueTrades.filter(trade => (Number(trade.realizedPl) || 0) > 0);
    const losingTradesList = uniqueTrades.filter(trade => (Number(trade.realizedPl) || 0) < 0);
    
    const averageWin = winningTradesList.length > 0 
      ? winningTradesList.reduce((sum, trade) => sum + (Number(trade.realizedPl) || 0), 0) / winningTradesList.length 
      : 0;
    
    const averageLoss = losingTradesList.length > 0 
      ? losingTradesList.reduce((sum, trade) => sum + (Number(trade.realizedPl) || 0), 0) / losingTradesList.length 
      : 0;
    
    const totalWins = winningTradesList.reduce((sum, trade) => sum + (Number(trade.realizedPl) || 0), 0);
    const totalLosses = Math.abs(losingTradesList.reduce((sum, trade) => sum + (Number(trade.realizedPl) || 0), 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : (totalWins > 0 ? 999 : 0);
    
    const overallPnlSummary = {
      totalPnl: totalPnl,
      totalRealizedPnl: totalRealizedPnl,
      totalUnrealizedPnl: totalUnrealizedPnl,
      totalVolume: totalVolume,
      averagePnl: totalRealizedTrades > 0 ? totalPnl / totalRealizedTrades : 0,
      winCount: winningTrades,
      lossCount: losingTrades,
      winRate: Math.round(winRate * 100) / 100,
      averageWin: Math.round(averageWin * 100) / 100,
      averageLoss: Math.round(averageLoss * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
    };

    // Use asset performance as is (no filtering)
    const filteredAssetPerformance = assetPerformance;

    return {
      statistics,
      pnlSummary: overallPnlSummary,
      topTrades,
      worstTrades,
      monthlyPerformance: performanceData,
      assetPerformance: filteredAssetPerformance,
      riskMetrics: riskMetrics,
    };
  }

  /**
   * Calculate performance data with configurable granularity (daily, weekly, monthly)
   */
  private async calculatePerformanceData(
    portfolioId: string,
    assetId?: string,
    startDate?: Date,
    endDate?: Date,
    granularity: 'daily' | 'weekly' | 'monthly' = 'monthly',
  ): Promise<any[]> {
    console.log('🚀 calculatePerformanceData called with:', {
      portfolioId,
      assetId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      granularity
    });
    console.log('🔍 DEBUG: Method started successfully');

    // Step 1: Query Snapshot theo startDate và endDate
    let allSnapshots: any[] = [];
    try {
      const queryStartDate = startDate || new Date('2020-01-01');
      const queryEndDate = endDate || new Date();
      
      allSnapshots = await this.portfolioRepo.manager.query(`
        SELECT 
          snapshot_date,
          unrealized_asset_pl,
          realized_asset_pl
        FROM portfolio_snapshots 
        WHERE portfolio_id = $1 
        AND snapshot_date >= $2
        AND snapshot_date <= $3
        ORDER BY snapshot_date ASC
      `, [portfolioId, queryStartDate, queryEndDate]);

      console.log(`🔍 Step 1: Retrieved ${allSnapshots.length} snapshots for date range ${queryStartDate.toISOString().split('T')[0]} to ${queryEndDate.toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('Error fetching snapshots:', error);
    }

    // Step 2: Xác định lại startDate dựa vào data của snapshot vừa có
    let actualStartDate = startDate;
    let actualEndDate = endDate;
    
    if (!startDate && allSnapshots.length > 0) {
      actualStartDate = new Date(allSnapshots[0].snapshot_date);
      console.log(`🔍 Step 2: Using first snapshot date as startDate: ${actualStartDate.toISOString()}`);
    }
    
    if (!endDate && allSnapshots.length > 0) {
      actualEndDate = new Date(allSnapshots[allSnapshots.length - 1].snapshot_date);
      console.log(`🔍 Step 2: Using last snapshot date as endDate: ${actualEndDate.toISOString()}`);
    }

    // Step 3: Query trade theo startDate và endDate mới
    const tradesQuery = `
      SELECT t.*, a.*, td.pnl
      FROM trades t
      LEFT JOIN assets a ON t.asset_id = a.id
      LEFT JOIN trade_details td on t.trade_id = td.sell_trade_id
      WHERE t.portfolio_id = $1 
        AND t.trade_date >= $2 
        AND t.trade_date <= $3 
      ORDER BY t.trade_date ASC
    `;
    
    const trades = await this.tradeRepo.query(tradesQuery, [portfolioId, actualStartDate, actualEndDate]);
    console.log(`🔍 Step 3: Retrieved ${trades.length} trades for date range ${actualStartDate?.toISOString()} to ${actualEndDate?.toISOString()}`);


    // Step 4: Xử lý logic như cũ
    const performanceData = new Map<string, any>();
    
    // Generate date ranges based on granularity
    let dateRanges: string[] = [];
    
    if (granularity === 'daily') {
      dateRanges = this.generateDailyRange(actualStartDate, actualEndDate);
    } else if (granularity === 'weekly') {
      dateRanges = this.generateWeeklyRange(actualStartDate, actualEndDate);
    } else {
      // monthly (default)
      const firstMonth = actualStartDate ? actualStartDate.toISOString().substring(0, 7) : '2020-01';
      const lastMonth = actualEndDate ? actualEndDate.toISOString().substring(0, 7) : new Date().toISOString().substring(0, 7);
      dateRanges = this.generateMonthRange(firstMonth, lastMonth);
    }
    
    console.log(`🔍 Step 4: Generated ${dateRanges.length} periods for granularity: ${granularity}`);
    
    // Initialize all periods with zero data
    for (const period of dateRanges) {
      performanceData.set(period, {
        period: period,
        tradesCount: 0,
        totalPl: 0,
        realizedPl: 0,
        unrealizedPl: 0,
        totalVolume: 0,
        winRate: 0,
        winningTrades: 0,
        losingTrades: 0,
      });
    }
    
    // Process trades and update performance data
    let cumulativeRealizedPl = 0;
    
    for (const trade of trades) {
      let periodKey: string;
      
      if (granularity === 'daily') {
        periodKey = new Date(trade.trade_date).toISOString().substring(0, 10);
      } else if (granularity === 'weekly') {
        periodKey = this.getWeekKey(new Date(trade.trade_date));
      } else {
        periodKey = new Date(trade.trade_date).toISOString().substring(0, 7);
      }
      
      if (!performanceData.has(periodKey)) {
        performanceData.set(periodKey, {
          period: periodKey,
          tradesCount: 0,
          totalPl: 0,
          realizedPl: 0,
          unrealizedPl: 0,
          totalVolume: 0,
          winRate: 0,
          winningTrades: 0,
          losingTrades: 0,
        });
      }
      
      const periodData = performanceData.get(periodKey);
      periodData.tradesCount++;
      periodData.totalVolume += trade.quantity * trade.price;
      
      // Calculate P&L for this trade
      let tradePnl = 0;
      if (trade.side === 'SELL') {
          // const tradeDetails = await this.tradeDetailRepo.find({
          //   where: { sellTradeId: trade.tradeId },
          // });
        // tradePnl = tradeDetails.reduce((sum, detail) => sum + parseFloat(detail.pnl?.toString() || '0'), 0);
        tradePnl = parseFloat(trade.pnl?.toString() || '0'); 
      }
      
      // TODO: implement + lãi tiền gửi đã tất toán tương tự trading
      const interestEarned = 0; // await this.interestEarnedService.getInterestEarned(portfolioId);
      cumulativeRealizedPl += tradePnl + interestEarned;
      periodData.realizedPl = cumulativeRealizedPl;
      
      if (tradePnl > 0) {
        periodData.winningTrades++;
      } else if (tradePnl < 0) {
        periodData.losingTrades++;
      }
    }
    
    // Carry forward cumulative realized P&L for periods without trades
    const sortedPeriods = Array.from(performanceData.values()).sort((a, b) => a.period.localeCompare(b.period));
    let lastCumulativeRealizedPl = 0;
    
    for (const periodData of sortedPeriods) {
      if (periodData.tradesCount > 0) {
        lastCumulativeRealizedPl = periodData.realizedPl;
      } else {
        periodData.realizedPl = lastCumulativeRealizedPl;
      }
    }
    
    // Calculate win rates
    for (const periodData of performanceData.values()) {
      const totalTrades = periodData.winningTrades + periodData.losingTrades;
      periodData.winRate = totalTrades > 0 ? (periodData.winningTrades / totalTrades) * 100 : 0;
    }

    // Calculate unrealized P&L for each period using snapshot data
    const periods = Array.from(performanceData.values());
    for (const periodData of periods) {
      let periodStart: Date;
      let periodEnd: Date;
      
      if (granularity === 'daily') {
        periodStart = new Date(periodData.period);
        periodEnd = new Date(periodData.period);
        periodEnd.setHours(23, 59, 59, 999);
      } else if (granularity === 'weekly') {
        const weekMatch = periodData.period.match(/(\d{4})-W(\d{2})/);
        if (weekMatch) {
          const year = parseInt(weekMatch[1]);
          const week = parseInt(weekMatch[2]);
          periodStart = this.getWeekStartDate(year, week);
          periodEnd = this.getWeekEndDate(year, week);
        } else {
          periodStart = new Date(periodData.period);
          periodEnd = new Date(periodData.period);
        }
      } else {
        const monthDate = new Date(periodData.period + '-01');
        periodStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        periodEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      }
      
      // Find the last snapshot for this period
      const periodSnapshots = allSnapshots.filter(snapshot => {
        const snapshotDate = new Date(snapshot.snapshot_date);
        return snapshotDate >= periodStart && snapshotDate <= periodEnd;
      });
      
      if (periodSnapshots.length > 0) {
        const lastSnapshot = periodSnapshots[periodSnapshots.length - 1];
        periodData.unrealizedPl = parseFloat(lastSnapshot.unrealized_asset_pl?.toString() || '0');
        console.log(`📊 ${periodData.period}: Using last snapshot from ${lastSnapshot.snapshot_date}, unrealized P&L: ${periodData.unrealizedPl}`);
      } else {
        periodData.unrealizedPl = 0;
        console.log(`📊 ${periodData.period}: No snapshots found, using unrealized P&L: 0`);
      }
      
      periodData.totalPl = periodData.realizedPl + periodData.unrealizedPl;
    }
    
    const result = Array.from(performanceData.values()).sort((a, b) => a.period.localeCompare(b.period));
    
    console.log(`🔍 Final result: ${result.length} periods of data`);
    result.forEach(period => {
      console.log(`📊 ${period.period}: ${period.tradesCount} trades, Total P&L: ${period.totalPl}, Realized: ${period.realizedPl}, Unrealized: ${period.unrealizedPl}`);
    });
    
    return result;
  }

  /**
   * Generate array of months between start and end month
   */
  private generateMonthRange(startMonth: string, endMonth: string): string[] {
    const months: string[] = [];
    const start = new Date(startMonth + '-01');
    const end = new Date(endMonth + '-01');
    
    const current = new Date(start);
    while (current <= end) {
      months.push(current.toISOString().substring(0, 7));
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }

  /**
   * Get unrealized P&L for a specific period (day, week, month)
   */
  private getUnrealizedPlForPeriod(
    snapshots: any[],
    period: string,
    periodValue: string
  ): number {
    if (!snapshots || snapshots.length === 0) {
      return 0;
    }

    let filteredSnapshots: any[] = [];

    switch (period) {
      case 'day':
        // Get snapshot for specific day
        const targetDate = new Date(periodValue);
        filteredSnapshots = snapshots.filter(snapshot => {
          const snapshotDate = new Date(snapshot.snapshot_date);
          return snapshotDate.toDateString() === targetDate.toDateString();
        });
        break;

      case 'week':
        // Get snapshot for specific week
        const weekStart = new Date(periodValue);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        filteredSnapshots = snapshots.filter(snapshot => {
          const snapshotDate = new Date(snapshot.snapshot_date);
          return snapshotDate >= weekStart && snapshotDate <= weekEnd;
        });
        break;

      case 'month':
        // Get snapshot for specific month
        const monthDate = new Date(periodValue + '-01');
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        filteredSnapshots = snapshots.filter(snapshot => {
          const snapshotDate = new Date(snapshot.snapshot_date);
          return snapshotDate >= monthStart && snapshotDate <= monthEnd;
        });
        break;

      default:
        return 0;
    }

    if (filteredSnapshots.length === 0) {
      return 0;
    }

    // Return the last snapshot of the period
    const lastSnapshot = filteredSnapshots[filteredSnapshots.length - 1];
    return parseFloat(lastSnapshot.unrealized_asset_pl?.toString() || '0');
  }

  /**
   * Calculate asset performance data
   */
  private async calculateAssetPerformance(
    portfolioId: string,
    assetId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    try {
      // Get ALL trade details for the portfolio, not just top/worst
      const allTradeDetails = await this.tradeDetailRepo.find({
        relations: ['asset', 'buyTrade', 'sellTrade'],
        order: {
          createdAt: 'DESC'
        }
      });
      
      // Filter by portfolioId through relations
      const portfolioTradeDetails = allTradeDetails.filter(detail => 
        detail.buyTrade?.portfolioId === portfolioId || detail.sellTrade?.portfolioId === portfolioId
      );
      
      if (portfolioTradeDetails.length === 0) {
        return [];
      }

      // Group trades by asset
      const assetGroups = new Map<string, any[]>();
      
      for (const trade of portfolioTradeDetails) {
        const assetId = trade.assetId;
        if (!assetGroups.has(assetId)) {
          assetGroups.set(assetId, []);
        }
        assetGroups.get(assetId)!.push(trade);
      }

      // Calculate performance for each asset
      const assetPerformance = [];
      
      // Get portfolio calculation for unrealized P&L
      let portfolioCalculation;
      try {
        portfolioCalculation = await this.portfolioCalculationService.calculatePortfolioAssetValues(portfolioId);
      } catch (error) {
        console.error('Error getting portfolio calculation for asset performance:', error);
        portfolioCalculation = { assetPositions: [] };
      }
      
      for (const [assetId, trades] of assetGroups) {
        const asset = trades[0].asset;
        if (!asset) continue;

        const tradesCount = trades.length;
        const winCount = trades.filter(trade => (Number(trade.pnl) || 0) > 0).length;
        const winRate = tradesCount > 0 ? (winCount / tradesCount) * 100 : 0;
        
        // Calculate realized P&L from trades for this asset
        const assetRealizedPl = trades.reduce((sum, trade) => {
          return sum + (Number(trade.pnl) || 0);
        }, 0);

        // Get unrealized P&L from portfolio calculation
        let assetUnrealizedPl = 0;
        try {
          const assetPosition = portfolioCalculation.assetPositions.find(pos => pos.assetId === assetId);
          
          if (assetPosition) {
            assetUnrealizedPl = assetPosition.unrealizedPl || 0;
          }
        } catch (error) {
          console.error(`Error getting unrealized P&L for asset ${assetId}:`, error);
        }

        const totalPl = assetUnrealizedPl + assetRealizedPl;
        
        // Calculate total volume (sum of all trade values)
        const totalVolume = trades.reduce((sum, trade) => {
          const tradeValue = (Number(trade.matchedQty) || 0) * (Number(trade.sellPrice) || 0);
          return sum + tradeValue;
        }, 0);
        
        // Calculate average cost and current quantity
        let totalQuantity = 0;
        let totalCost = 0;
        
        for (const trade of trades) {
          const quantity = Number(trade.matchedQty) || 0;
          const price = Number(trade.buyPrice) || 0;
          const fee = Number(trade.feeTax) || 0;
          
          totalQuantity += quantity;
          totalCost += (quantity * price) + fee;
        }
        
        const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        const marketValue = totalQuantity * (Number(trades[0].sellPrice) || 0); // Use latest sell price as market value
        

        const assetData = {
          assetId: assetId,
          assetSymbol: asset.symbol || 'N/A',
          assetName: asset.name || 'N/A',
          totalPl: Math.round((totalPl || 0) * 100) / 100,
          realizedPl: Math.round((assetRealizedPl || 0) * 100) / 100, // Realized P&L from trades
          unrealizedPl: Math.round((assetUnrealizedPl || 0) * 100) / 100, // Unrealized P&L from helper
          tradesCount: tradesCount,
          winCount: winCount,
          winRate: Math.round(winRate * 100) / 100,
          totalVolume: Math.round(totalVolume * 100) / 100,
          quantity: Math.round(totalQuantity * 100) / 100,
          avgCost: Math.round(avgCost * 100) / 100,
          marketValue: Math.round(marketValue * 100) / 100,
        };
        
        
        assetPerformance.push(assetData);
      }

      return assetPerformance;
    } catch (error) {
      console.error('Error calculating asset performance:', error);
      return [];
    }
  }

  /**
   * Calculate risk metrics
   */
  private async calculateRiskMetrics(
    portfolioId: string,
    assetId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    sharpeRatio: number;
    volatility: number;
    var95: number;
    maxDrawdown: number;
  }> {
    try {
      // Get trade details for P&L calculation within date range
      let tradeDetails;
      
      if (startDate && endDate) {
        // Get trades within specific date range
        tradeDetails = await this.tradeDetailRepo.getTradesByDateRange(
          portfolioId, 
          startDate, 
          endDate, 
          assetId
        );
      } else {
        // Fallback to top/worst performing trades if no date range specified
        const topTradesRaw = await this.tradeDetailRepo.getTopPerformingTrades(100, portfolioId);
        const worstTradesRaw = await this.tradeDetailRepo.getWorstPerformingTrades(100, portfolioId);
        
        // Combine and deduplicate trades
        const allTrades = [...topTradesRaw, ...worstTradesRaw];
        tradeDetails = allTrades.filter((trade, index, self) => 
          index === self.findIndex(t => t.detailId === trade.detailId)
        );
      }
      
      if (tradeDetails.length === 0) {
        return {
          sharpeRatio: 0,
          volatility: 0,
          var95: 0,
          maxDrawdown: 0,
        };
      }
      
      // Extract P&L values and calculate returns
      const pnlValues = tradeDetails.map(trade => Number(trade.pnl) || 0);
      
      // Calculate returns as percentages (P&L / Trade Value)
      // Use sellPrice for consistency with trade analysis display
      const returns = tradeDetails.map(trade => {
        const pnl = Number(trade.pnl) || 0;
        const tradeValue = (Number(trade.matchedQty) || 0) * (Number(trade.sellPrice) || 0);
        return tradeValue > 0 ? (pnl / tradeValue) * 100 : 0; // Return as percentage
      });
      
      // Calculate basic statistics for returns
      const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / (returns.length - 1);
      const volatility = Math.sqrt(variance); // Daily volatility
      
      // Annualize volatility (assuming daily returns)
      const annualizedVolatility = volatility * Math.sqrt(RiskMetricsConfig.TRADING_DAYS_PER_YEAR);
      
      // Calculate Sharpe Ratio using configurable risk-free rate
      const riskFreeRate = RiskMetricsConfig.DEFAULT_RISK_FREE_RATE;
      const excessReturn = meanReturn - (riskFreeRate / RiskMetricsConfig.TRADING_DAYS_PER_YEAR); // Daily risk-free rate
      const sharpeRatio = volatility > 0 ? (excessReturn / volatility) * Math.sqrt(RiskMetricsConfig.TRADING_DAYS_PER_YEAR) : 0;
      
      // Calculate VaR 95% (5th percentile) - using P&L values (VND)
      const sortedPnl = pnlValues.sort((a, b) => a - b);
      const var95Index = Math.floor(sortedPnl.length * 0.05);
      const var95 = sortedPnl[var95Index] || 0;
      
      // Calculate Max Drawdown - using P&L values (VND)
      let maxDrawdown = 0;
      let peak = 0;
      let runningSum = 0;
      
      for (const pnl of pnlValues) {
        runningSum += pnl;
        if (runningSum > peak) {
          peak = runningSum;
        }
        const drawdown = peak - runningSum;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
      
      return {
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        volatility: Math.round(annualizedVolatility * 100) / 100, // Use annualized volatility
        var95: Math.round(var95 * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      };
    } catch (error) {
      console.error('Error calculating risk metrics:', error);
      return {
        sharpeRatio: 0,
        volatility: 0,
        var95: 0,
        maxDrawdown: 0,
      };
    }
  }


  /**
   * Validate trade data
   * @param tradeData Trade data to validate
   */
  private validateTradeData(tradeData: CreateTradeDto): void {
    if (!tradeData.portfolioId) {
      throw new BadRequestException('Portfolio ID is required');
    }

    if (!tradeData.assetId) {
      throw new BadRequestException('Asset ID is required');
    }

    if (!tradeData.tradeDate) {
      throw new BadRequestException('Trade date is required');
    }

    if (!tradeData.side || !Object.values(TradeSide).includes(tradeData.side)) {
      throw new BadRequestException('Valid trade side is required');
    }

    if (!tradeData.quantity || tradeData.quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    if (tradeData.price === undefined || tradeData.price === null || tradeData.price < 0) {
      throw new BadRequestException('Price must be non-negative');
    }

    if (tradeData.fee !== undefined && tradeData.fee < 0) {
      throw new BadRequestException('Fee cannot be negative');
    }

    if (tradeData.tax !== undefined && tradeData.tax < 0) {
      throw new BadRequestException('Tax cannot be negative');
    }
  }

  /**
   * Calculate P&L for trades by fetching trade details
   * @param trades Array of trades
   * @returns Array of trades with calculated P&L
   */
  private async calculateTradePnl(trades: Trade[]): Promise<any[]> {
    const tradesWithPnl = await Promise.all(
      trades.map(async (trade) => {
        // Get trade details for this trade
        const tradeDetails = await this.tradeDetailRepository.find({
          where: [
            { sellTradeId: trade.tradeId },
            { buyTradeId: trade.tradeId },
          ],
        });

        // Calculate realized P&L
        let realizedPl = 0;
        let tradeDetailsCount = 0;
        let remainingQuantity = trade.quantity;

        if (trade.side === TradeSide.SELL) {
          // For sell trades, calculate P&L from sellDetails
          const sellDetails = tradeDetails.filter(detail => detail.sellTradeId === trade.tradeId);
          realizedPl = sellDetails.reduce((sum, detail) => sum + (Number(detail.pnl) || 0), 0);
          tradeDetailsCount = sellDetails.length;
          remainingQuantity = trade.quantity - sellDetails.reduce((sum, detail) => sum + (Number(detail.matchedQty) || 0), 0);
        } else {
          // For buy trades, realized P&L is always 0 (no realized P&L until sold)
          realizedPl = 0;
          tradeDetailsCount = 0;
        }

        // Return trade with calculated fields and asset information
        return {
          tradeId: trade.tradeId,
          portfolioId: trade.portfolioId,
          assetId: trade.assetId,
          assetSymbol: trade.asset?.symbol || 'N/A',
          assetName: trade.asset?.name,
          asset: trade.asset, // Include full asset object
          tradeDate: trade.tradeDate,
          side: trade.side,
          quantity: trade.quantity,
          price: trade.price,
          totalValue: Number(trade.totalAmount) || 0,
          fee: Number(trade.fee) || 0,
          tax: Number(trade.tax) || 0,
          totalCost: trade.side === 'SELL' 
            ? (Number(trade.totalAmount) || 0) - (Number(trade.fee) || 0) - (Number(trade.tax) || 0)
            : (Number(trade.totalAmount) || 0) + (Number(trade.fee) || 0) + (Number(trade.tax) || 0),
          tradeType: trade.tradeType,
          source: trade.source,
          exchange: trade.exchange,
          fundingSource: trade.fundingSource,
          notes: trade.notes,
          createdAt: trade.createdAt,
          updatedAt: trade.updatedAt,
          realizedPl: realizedPl,
          tradeDetailsCount: tradeDetailsCount,
          remainingQuantity: remainingQuantity,
        };
      })
    );

    return tradesWithPnl;
  }

  /**
   * Generate daily date range
   */
  private generateDailyRange(startDate?: Date, endDate?: Date): string[] {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
    const end = endDate || new Date();
    
    const dates: string[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(current.toISOString().substring(0, 10)); // YYYY-MM-DD
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * Generate weekly date range
   */
  private generateWeeklyRange(startDate?: Date, endDate?: Date): string[] {
    const start = startDate || new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000); // Default: 12 weeks ago
    const end = endDate || new Date();
    
    const weeks: string[] = [];
    const current = new Date(start);
    
    // Start from the beginning of the week
    current.setDate(current.getDate() - current.getDay());
    
    while (current <= end) {
      weeks.push(this.getWeekKey(current));
      current.setDate(current.getDate() + 7);
    }
    
    return weeks;
  }

  /**
   * Get week key in format YYYY-WW
   */
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  /**
   * Get week number of the year
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Get week start date
   */
  private getWeekStartDate(year: number, week: number): Date {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7;
    const weekStart = new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    // Adjust to start of week (Monday)
    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - daysToMonday);
    return weekStart;
  }

  /**
   * Get week end date
   */
  private getWeekEndDate(year: number, week: number): Date {
    const weekStart = this.getWeekStartDate(year, week);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }
}
