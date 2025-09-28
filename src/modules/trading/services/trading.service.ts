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
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { CreateTradeDto, UpdateTradeDto } from '../dto/trade.dto';


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

    if (updateTradeDto.price !== undefined && updateTradeDto.price <= 0) {
      throw new BadRequestException('Price must be positive');
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
   * @param metric Optional metric filter
   * @returns Trade analysis
   */
  async getTradeAnalysis(
    portfolioId: string,
    assetId?: string,
    startDate?: Date,
    endDate?: Date,
    timeframe?: string,
    metric?: string,
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
      metric
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

    // Calculate monthly performance
    const monthlyPerformance = await this.calculateMonthlyPerformance(
      portfolioId,
      assetId,
      actualStartDate,
      actualEndDate,
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

    // Apply metric-based filtering to asset performance
    let filteredAssetPerformance = assetPerformance;
    if (metric) {
      switch (metric) {
        case 'pnl':
          // Sort by P&L (descending)
          filteredAssetPerformance = assetPerformance.sort((a, b) => 
            parseFloat(b.totalPl.toString()) - parseFloat(a.totalPl.toString())
          );
          break;
        case 'trades':
          // Sort by number of trades (descending)
          filteredAssetPerformance = assetPerformance.sort((a, b) => 
            b.tradesCount - a.tradesCount
          );
          break;
        case 'winrate':
          // Sort by win rate (descending)
          filteredAssetPerformance = assetPerformance.sort((a, b) => {
            const aWinRate = a.tradesCount > 0 ? (a.winCount / a.tradesCount) * 100 : 0;
            const bWinRate = b.tradesCount > 0 ? (b.winCount / b.tradesCount) * 100 : 0;
            return bWinRate - aWinRate;
          });
          break;
        default:
          // No filtering
          break;
      }
    }

    return {
      statistics,
      pnlSummary: overallPnlSummary,
      topTrades,
      worstTrades,
      monthlyPerformance: monthlyPerformance,
      assetPerformance: filteredAssetPerformance,
      riskMetrics: riskMetrics,
    };
  }

  /**
   * Calculate monthly performance data
   */
  private async calculateMonthlyPerformance(
    portfolioId: string,
    assetId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {

    // Get all trades for the portfolio
    const trades = await this.tradeRepo.find({
      where: {
        portfolioId: portfolioId,
        ...(assetId && { assetId: assetId }),
        ...(startDate && { tradeDate: MoreThanOrEqual(startDate) }),
        ...(endDate && { tradeDate: LessThanOrEqual(endDate) }),
      },
      order: { tradeDate: 'ASC' },
      relations: ['asset'],
    });

    // Group trades by month
    const monthlyData = new Map<string, any>();
    
    for (const trade of trades) {
      const monthKey = trade.tradeDate.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          tradesCount: 0,
          totalPl: 0, // Total P&L (realized + unrealized)
          realizedPl: 0, // Realized P&L from trades
          unrealizedPl: 0, // Unrealized P&L from current positions
          totalVolume: 0,
          winRate: 0,
          winningTrades: 0,
          losingTrades: 0,
        });
      }
      
      const monthData = monthlyData.get(monthKey);
      monthData.tradesCount++;
      monthData.totalVolume += trade.quantity * trade.price;
      
      // Calculate P&L for this trade based on trade details
      let tradePnl = 0;
      if (trade.side === 'SELL') {
        // Get trade details for realized P&L
        const tradeDetails = await this.tradeDetailRepository.find({
          where: { sellTradeId: trade.tradeId },
        });
        tradePnl = tradeDetails.reduce((sum, detail) => sum + parseFloat(detail.pnl?.toString() || '0'), 0);
      }
      
      monthData.realizedPl += tradePnl;
      
      if (tradePnl > 0) {
        monthData.winningTrades++;
      } else if (tradePnl < 0) {
        monthData.losingTrades++;
      }
    }
    
    // Calculate win rates
    for (const monthData of monthlyData.values()) {
      const totalTrades = monthData.winningTrades + monthData.losingTrades;
      monthData.winRate = totalTrades > 0 ? (monthData.winningTrades / totalTrades) * 100 : 0;
    }

        // Get historical portfolio snapshots for accurate unrealized P&L calculation
        try {
          // Get portfolio snapshots for the portfolio - use LAST_DAY of each month
          const queryStartDate = startDate || new Date('2020-01-01');
          const queryEndDate = endDate || new Date();
          
          const portfolioSnapshots = await this.portfolioRepo.manager.query(`
            SELECT 
              DATE_TRUNC('month', snapshot_date) as month,
              total_value,
              unrealized_asset_pl,
              realized_asset_pl,
              cash_balance,
              invested_value,
              snapshot_date,
              ROW_NUMBER() OVER (PARTITION BY DATE_TRUNC('month', snapshot_date) ORDER BY snapshot_date DESC) as rn
            FROM portfolio_snapshots 
            WHERE portfolio_id = $1 
            AND snapshot_date >= $2 
            AND snapshot_date <= $3
          `, [
            portfolioId, 
            queryStartDate, 
            queryEndDate
          ]);

          // Filter to get only the last day of each month
          const monthlySnapshots = portfolioSnapshots.filter(snapshot => snapshot.rn === '1');


          // Create a map of month to snapshot data (using last day of month data)
          const snapshotDataMap = new Map();
          for (const snapshot of monthlySnapshots) {
            const monthKey = snapshot.month.toISOString().substring(0, 7); // YYYY-MM
            snapshotDataMap.set(monthKey, {
              totalValue: parseFloat(snapshot.total_value || '0'),
              unrealizedPl: parseFloat(snapshot.unrealized_asset_pl || '0'),
              realizedPl: parseFloat(snapshot.realized_asset_pl || '0'),
              cashBalance: parseFloat(snapshot.cash_balance || '0'),
              investedValue: parseFloat(snapshot.invested_value || '0')
            });
          }

      // Calculate unrealized P&L for each month using snapshot data
      const months = Array.from(monthlyData.values());
      for (const monthData of months) {
        const snapshotData = snapshotDataMap.get(monthData.month);
        
        if (snapshotData) {
          // Use unrealized P&L directly from snapshot
          monthData.unrealizedPl = snapshotData.unrealizedPl;
        } else {
          // If no snapshot data for this month, try to find the closest snapshot
          // Look for snapshots in the same month or previous months
          let closestSnapshot = null;
          const currentMonth = new Date(monthData.month + '-01');
          
          // Find the most recent snapshot before or during this month
          for (const [snapshotMonth, data] of snapshotDataMap.entries()) {
            const snapshotDate = new Date(snapshotMonth + '-01');
            if (snapshotDate <= currentMonth) {
              if (!closestSnapshot || snapshotDate > new Date(closestSnapshot.month + '-01')) {
                closestSnapshot = { month: snapshotMonth, ...data };
              }
            }
          }
          
          if (closestSnapshot) {
            monthData.unrealizedPl = closestSnapshot.unrealizedPl;
          } else {
            // If no snapshot found, use 0
            monthData.unrealizedPl = 0;
          }
        }
        
        monthData.totalPl = monthData.realizedPl + monthData.unrealizedPl;
      }


    } catch (error) {
      console.error('Error calculating unrealized P&L from NAV snapshots:', error);
      // Fallback: use current portfolio calculation
      try {
        const portfolioCalculation = await this.portfolioCalculationService.calculatePortfolioAssetValues(portfolioId);
        const currentUnrealizedPl = portfolioCalculation.assetPositions.reduce(
          (sum, position) => sum + (parseFloat(position.unrealizedPl?.toString() || '0') || 0),
          0
        );

        const months = Array.from(monthlyData.values());
        if (months.length > 0) {
          const unrealizedPlPerMonth = currentUnrealizedPl / months.length;
          for (const monthData of months) {
            monthData.unrealizedPl = unrealizedPlPerMonth;
            monthData.totalPl = monthData.realizedPl + monthData.unrealizedPl;
          }
        }
      } catch (fallbackError) {
        console.error('Fallback calculation also failed:', fallbackError);
        // If all calculations fail, just use realized P&L
        for (const monthData of monthlyData.values()) {
          monthData.totalPl = monthData.realizedPl;
        }
      }
    }
    
    return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));
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
      // Get trade details for P&L calculation
      const topTradesRaw = await this.tradeDetailRepo.getTopPerformingTrades(100, portfolioId);
      const worstTradesRaw = await this.tradeDetailRepo.getWorstPerformingTrades(100, portfolioId);
      
      // Combine and deduplicate trades
      const allTrades = [...topTradesRaw, ...worstTradesRaw];
      const uniqueTrades = allTrades.filter((trade, index, self) => 
        index === self.findIndex(t => t.detailId === trade.detailId)
      );
      
      if (uniqueTrades.length === 0) {
        return {
          sharpeRatio: 0,
          volatility: 0,
          var95: 0,
          maxDrawdown: 0,
        };
      }
      
      // Extract P&L values and calculate returns
      const pnlValues = uniqueTrades.map(trade => Number(trade.pnl) || 0);
      
      // Calculate returns as percentages (P&L / Trade Value)
      // Use sellPrice for consistency with trade analysis display
      const returns = uniqueTrades.map(trade => {
        const pnl = Number(trade.pnl) || 0;
        const tradeValue = (Number(trade.matchedQty) || 0) * (Number(trade.sellPrice) || 0);
        return tradeValue > 0 ? (pnl / tradeValue) * 100 : 0; // Return as percentage
      });
      
      // Calculate basic statistics for returns
      const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance); // Volatility as percentage
      
      // Calculate Sharpe Ratio (assuming risk-free rate = 0)
      const sharpeRatio = volatility > 0 ? meanReturn / volatility : 0;
      
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
        volatility: Math.round(volatility * 100) / 100,
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

    if (!tradeData.price || tradeData.price <= 0) {
      throw new BadRequestException('Price must be positive');
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
          totalCost: (Number(trade.totalAmount) || 0) + (Number(trade.fee) || 0) + (Number(trade.tax) || 0),
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
}
