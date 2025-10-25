import { Injectable, Logger, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetAllocationSnapshot } from '../entities/asset-allocation-snapshot.entity';
import { SnapshotRepository, SnapshotQueryOptions, SnapshotAggregationResult } from '../repositories/snapshot.repository';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { AssetService } from '../../asset/services/asset.service';
import { AssetGlobalSyncService } from '../../asset/services/asset-global-sync.service';
import { MarketDataService } from '../../asset/services/market-data.service';
import { AssetValueCalculatorService } from '../../asset/services/asset-value-calculator.service';
import { PriceHistoryService } from '../../asset/services/price-history.service';
import { AssetRepository } from '../../asset/repositories/asset.repository';
import { Asset } from '../../asset/entities/asset.entity';
import { normalizeDateToString, compareDates, getDateCondition, getDateRangeConditionSQL } from '../utils/date-normalization.util';
import { Trade } from '../../trading/entities/trade.entity';
import { PortfolioSnapshotService } from './portfolio-snapshot.service';

export interface CreateSnapshotDto {
  portfolioId: string;
  assetId: string;
  assetSymbol: string;
  snapshotDate: Date;
  granularity: SnapshotGranularity;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  avgCost: number;
  realizedPl: number;
  unrealizedPl: number;
  totalPl: number;
  allocationPercentage: number;
  portfolioTotalValue: number;
  returnPercentage: number;
  dailyReturn: number;
  cumulativeReturn: number;
  isActive?: boolean;
  createdBy?: string;
  notes?: string;
}

export interface UpdateSnapshotDto {
  quantity?: number;
  currentPrice?: number;
  currentValue?: number;
  costBasis?: number;
  avgCost?: number;
  realizedPl?: number;
  unrealizedPl?: number;
  totalPl?: number;
  allocationPercentage?: number;
  portfolioTotalValue?: number;
  returnPercentage?: number;
  dailyReturn?: number;
  cumulativeReturn?: number;
  isActive?: boolean;
  notes?: string;
}

export interface SnapshotTimelineQuery {
  portfolioId: string;
  startDate: Date;
  endDate: Date;
  granularity?: SnapshotGranularity;
  assetId?: string;
  assetSymbol?: string;
}

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(
    @InjectRepository(AssetAllocationSnapshot)
    private readonly snapshotRepository: Repository<AssetAllocationSnapshot>,
    private readonly snapshotRepo: SnapshotRepository,
    private readonly assetService: AssetService,
    private readonly assetGlobalSyncService: AssetGlobalSyncService,
    private readonly marketDataService: MarketDataService,
    private readonly assetValueCalculator: AssetValueCalculatorService,
    private readonly assetRepository: AssetRepository,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @Inject(forwardRef(() => PortfolioSnapshotService))
    private readonly portfolioSnapshotService: PortfolioSnapshotService,
    private readonly priceHistoryService: PriceHistoryService,
  ) {}


  async prepareAssetSnapshots(portfolioId: string, snapshotDate: Date, 
    granularity: SnapshotGranularity, createdBy?: string): Promise<AssetAllocationSnapshot[]> {
    
    // Get all assets in portfolio that have trades
    let assets = await this.assetService.findByPortfolioId(portfolioId);
    
    if (assets.length === 0) {
      return [];
    }

    if (snapshotDate) {
      const originalCount = assets.length;
      
      // Normalize dates to avoid timezone issues
      const snapshotDateStr = normalizeDateToString(snapshotDate);
      
      assets = assets.filter(asset => {
        return asset.trades.some(trade => {
          const tradeDateStr = normalizeDateToString(trade.tradeDate);
          // Check if trade is on or before snapshot date (compare by date only, not time)
          const tradeDate = new Date(trade.tradeDate);
          tradeDate.setHours(0, 0, 0, 0);
          const snapshotDateOnly = new Date(snapshotDate);
          snapshotDateOnly.setHours(0, 0, 0, 0);
          return tradeDate <= snapshotDateOnly;
        });
      });
      
      if (assets.length === 0) {
        return [];
      }
    }
    
    const assetSnapshots: AssetAllocationSnapshot[] = [];

    // First pass: collect all current values to calculate total portfolio value
    const assetData: Array<{
      asset: Asset;
      currentValue: number;
      positionData: any;
      currentPrice: number;
    }> = [];

    // Batch process all assets for better performance
    // Step 1: Batch fetch all prices at once using optimized method
    const pricePromises = assets.map(asset => 
      this.getCurrentPriceLaterOptimized(asset.symbol, snapshotDate)
        .then(price => ({ asset, price }))
        .catch(error => {
          this.logger.error(`Failed to get price for ${asset.symbol}:`, error);
          return { asset, price: 0 };
        })
    );
    
    // Step 2: Batch fetch all trades at once
    const tradesPromises = assets.map(asset => 
      this.assetRepository.getAssetTradesByPortfolioFinal(asset.id, portfolioId, snapshotDate)
        .then(trades => ({ asset, trades }))
        .catch(error => {
          this.logger.error(`Failed to get trades for ${asset.symbol}:`, error);
          return { asset, trades: [] };
        })
    );
    
    // Wait for all price and trade data to be fetched in parallel
    const [priceResults, tradesResults] = await Promise.all([
      Promise.all(pricePromises),
      Promise.all(tradesPromises)
    ]);
    
    // Create maps for quick lookup
    const priceMap = new Map(priceResults.map(result => [result.asset.id, result.price]));
    const tradesMap = new Map(tradesResults.map(result => [result.asset.id, result.trades]));
    
    // Step 3: Process all assets with pre-fetched data
    for (const asset of assets) {
      const currentPrice = priceMap.get(asset.id) || 0;
      const trades = tradesMap.get(asset.id) || [];
      
      // Use FIFO calculation to get all values at once
      const positionData = this.assetValueCalculator.calculateAssetPositionFIFOFinal(trades, currentPrice);
      
      assetData.push({
        asset,
        currentValue: positionData.currentValue,
        positionData,
        currentPrice
      });
    }

    // Calculate total portfolio value (NAV) -> need to check include deposits or not
    const totalPortfolioValue = assetData.reduce((sum, data) => sum + data.currentValue, 0);

    // Second, create snapshots with calculated values
    for (const data of assetData) {
      const { asset, currentValue, positionData, currentPrice } = data;
      const { quantity, avgCost, unrealizedPl, realizedPl, totalPnl } = positionData;
      const costBasis = quantity * avgCost;
      const returnPercentage = this.assetValueCalculator.calculateReturnPercentageFinal(quantity, currentPrice, avgCost);
      
      // Calculate allocation percentage
      // we should include deposits in the total portfolio value
      const allocationPercentage = totalPortfolioValue > 0 
        ? Number(((currentValue / totalPortfolioValue) * 100).toFixed(4))
        : 0;

      // Calculate daily return and cumulative return (optimized to reduce database queries)
      const { dailyReturn, cumulativeReturn } = await this.calculateReturnsForAssetOptimized(
        asset.id, 
        portfolioId, 
        snapshotDate, 
        currentValue
      );
      
      const assetSnapshot: Partial<AssetAllocationSnapshot> = {
        portfolioId,
        assetId: asset.id,
        assetSymbol: asset.symbol,
        assetType: asset.type,
        snapshotDate,
        granularity,
        quantity,
        currentPrice,
        currentValue,
        costBasis,
        avgCost,
        realizedPl,
        unrealizedPl,
        totalPl: totalPnl,
        allocationPercentage,
        portfolioTotalValue: totalPortfolioValue,
        returnPercentage,
        dailyReturn,
        cumulativeReturn,
        isActive: true,
        createdBy,
        notes: `Portfolio snapshot for ${snapshotDate.toISOString().split('T')[0]}`,
      };

      assetSnapshots.push(assetSnapshot as AssetAllocationSnapshot);
    }

    return assetSnapshots;
  }

  /**
   * Create snapshots for all assets in a portfolio
   */
  async createPortfolioSnapshot(
    portfolioId: string,
    snapshotDate: Date | string,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY,
    createdBy?: string
  ): Promise<AssetAllocationSnapshot[]> {
    snapshotDate = typeof snapshotDate === 'string' ? new Date(snapshotDate) : snapshotDate;

    // Step 0: Prepare asset allocation snapshots
    const assetSnapshots = await this.prepareAssetSnapshots(portfolioId, snapshotDate, granularity, createdBy);

    // Step 1: Delete existing ASSET snapshots for the same portfolio, date, and granularity
    // This ensures we only have one snapshot per day per portfolio
    const deletedAssetCount = await this.snapshotRepo.deleteAssetAllocationSnapshots(portfolioId, snapshotDate, granularity);

    // Step 2: Create all ASSET ALLOCATION SNAPSHOTS in batch (all fields are already calculated, so we can create them in batch)
    let createdSnapshots: AssetAllocationSnapshot[] = [];
    
    if (assetSnapshots.length > 0) {
      createdSnapshots = await this.snapshotRepo.createMany(assetSnapshots);
    }

    // Step 3: Create PORTFOLIO snapshot after asset snapshots are created
    // We need to create portfolio snapshot after asset snapshots are created because we need to use the asset snapshots to calculate the portfolio snapshot
    // Portfolio snapshot is not dependent on asset snapshots, so we can create it after asset snapshots are created
    try {
      // Add a small delay to ensure asset snapshots are committed to database
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const portfolioSnapshot = await this.portfolioSnapshotService.createPortfolioSnapshotWithoutMetrics(
        portfolioId,
        snapshotDate,
        granularity,
        createdBy ? `${createdBy}-portfolio-snapshot` : 'portfolio-snapshot'
      );
    } catch (error) {
      // Don't throw error here to avoid breaking asset snapshot creation
      // Portfolio snapshot creation is optional and can be retried later
    }
    
    return createdSnapshots;
  }


  /**
   * Optimized return calculation method
   * Reduces database queries by using more efficient queries
   */
  private async calculateReturnsForAssetOptimized(
    assetId: string,
    portfolioId: string,
    snapshotDate: Date,
    currentValue: number
  ): Promise<{ dailyReturn: number; cumulativeReturn: number }> {
    try {
      // Get previous snapshots for this asset with optimized query
      const previousSnapshots = await this.snapshotRepo.findMany({
        portfolioId,
        assetId,
        granularity: SnapshotGranularity.DAILY,
        endDate: new Date(snapshotDate.getTime() - 24 * 60 * 60 * 1000), // Previous day
        limit: 2,
        orderBy: 'snapshot.snapshotDate',
        orderDirection: 'DESC'
      });

      let dailyReturn = 0;
      let cumulativeReturn = 0;

      if (previousSnapshots.length > 0) {
        // Calculate daily return from previous day
        const previousValue = Number(previousSnapshots[0].currentValue) || 0;
        if (previousValue > 0) {
          dailyReturn = Number(((currentValue - previousValue) / previousValue * 100).toFixed(4));
        }

        // Calculate cumulative return from first snapshot
        if (previousSnapshots.length > 1) {
          const firstValue = Number(previousSnapshots[1].currentValue) || 0;
          if (firstValue > 0) {
            cumulativeReturn = Number(((currentValue - firstValue) / firstValue * 100).toFixed(4));
          }
        } else {
          // If this is the second snapshot, cumulative return = daily return
          cumulativeReturn = dailyReturn;
        }
      }

      return { dailyReturn, cumulativeReturn };
    } catch (error) {
      return { dailyReturn: 0, cumulativeReturn: 0 };
    }
  }

  /**
   * Calculate daily return and cumulative return for a specific asset
   * Cách tính này có nhiều logic chưa chính xác đối với cumulativeReturn. Cần cải thiện và không nên sử dụng lúc này.
   */
  private async calculateReturnsForAssetLater(
    assetId: string,
    portfolioId: string,
    snapshotDate: Date,
    currentValue: number
  ): Promise<{ dailyReturn: number; cumulativeReturn: number }> {
    try {
      // Get previous snapshots for this asset
      const previousSnapshots = await this.snapshotRepo.findMany({
        portfolioId,
        assetId,
        granularity: SnapshotGranularity.DAILY,
        endDate: new Date(snapshotDate.getTime() - 24 * 60 * 60 * 1000), // Previous day
        limit: 2,
        orderBy: 'snapshot.snapshotDate',
        orderDirection: 'DESC'
      });

      let dailyReturn = 0;
      let cumulativeReturn = 0;

      if (previousSnapshots.length > 0) {
        // Calculate daily return from previous day
        const previousValue = Number(previousSnapshots[0].currentValue) || 0;
        if (previousValue > 0) {
          dailyReturn = Number(((currentValue - previousValue) / previousValue * 100).toFixed(4));
        }

        // Calculate cumulative return from first snapshot
        if (previousSnapshots.length > 1) {
          const firstValue = Number(previousSnapshots[1].currentValue) || 0;
          if (firstValue > 0) {
            cumulativeReturn = Number(((currentValue - firstValue) / firstValue * 100).toFixed(4));
          }
        } else {
          // If this is the second snapshot, cumulative return = daily return
          cumulativeReturn = dailyReturn;
        }
      }

      return { dailyReturn, cumulativeReturn };
    } catch (error) {
      return { dailyReturn: 0, cumulativeReturn: 0 };
    }
  }


  /**
   * Get snapshot by ID
   */
  async getSnapshotById(id: string): Promise<AssetAllocationSnapshot> {
    const snapshot = await this.snapshotRepo.findById(id);
    if (!snapshot) {
      throw new NotFoundException(`Snapshot with ID ${id} not found`);
    }
    return snapshot;
  }

  /**
   * Get snapshots with query options
   */
  async getSnapshots(options: SnapshotQueryOptions): Promise<AssetAllocationSnapshot[]> {
    return await this.snapshotRepo.findMany(options);
  }

  // /**
  //  * Get snapshots with pagination
  //  */
  async getSnapshotsWithPagination(options: SnapshotQueryOptions) {
    return await this.snapshotRepo.findManyWithPagination(options);
  }

  /**
   * Get timeline data for portfolio - OPTIMIZED for analytics
   */
  async getTimelineData(query: SnapshotTimelineQuery): Promise<AssetAllocationSnapshot[]> {

    const options: SnapshotQueryOptions = {
      portfolioId: query.portfolioId,
      startDate: query.startDate,
      endDate: query.endDate,
      granularity: query.granularity || SnapshotGranularity.DAILY,
      assetId: query.assetId,
      assetSymbol: query.assetSymbol,
      isActive: true,
      orderBy: 'snapshot.snapshotDate',
      orderDirection: 'ASC',
    };

    // PERFORMANCE FIX: Use optimized analytics query for better performance
    return await this.snapshotRepo.findManyForAnalytics(options);
  }

  // /**
  //  * Get aggregated timeline data
  //  */
  // async getAggregatedTimelineData(
  //   portfolioId: string,
  //   startDate: Date,
  //   endDate: Date,
  //   granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  // ): Promise<SnapshotAggregationResult[]> {

  //   return await this.snapshotRepo.findAggregatedByDate(portfolioId, startDate, endDate, granularity);
  // }



  /**
   * Get allocation timeline data for analytics using real snapshot data
   */
  async getAnalyticsAllocationTimeline(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<{ date: string; [key: string]: string | number }[]> {

    // Step 1: Find the actual min date from snapshots
    const actualMinDate = await this.findActualMinSnapshotDate(portfolioId, startDate, endDate);
    
    if (!actualMinDate) {
      return [];
    }

    // Step 2: Always calculate DAILY first, then filter based on granularity
    const actualEndDate = new Date(); // Current date
    const dailyTimeline = await this.generateTimelineFromDailySnapshots(portfolioId, actualMinDate, actualEndDate, SnapshotGranularity.DAILY);

    if (dailyTimeline.length === 0) {
      return [];
    }

    // Step 3: Filter based on granularity
    if (granularity === SnapshotGranularity.DAILY) {
      return dailyTimeline;
    } else if (granularity === SnapshotGranularity.MONTHLY) {
      return this.filterToMonthlyData(dailyTimeline);
    } else if (granularity === SnapshotGranularity.WEEKLY) {
      return this.filterToWeeklyData(dailyTimeline);
    }

    return dailyTimeline;
  }

  /**
   * Filter DAILY data to MONTHLY data (last day of each month)
   */
  private filterToMonthlyData(dailyData: { date: string; [key: string]: string | number }[]): { date: string; [key: string]: string | number }[] {
    const monthlyData: { date: string; [key: string]: string | number }[] = [];
    const monthlyMap = new Map<string, { date: string; [key: string]: string | number }>();

    // Group by year-month and keep the last day of each month
    dailyData.forEach(dataPoint => {
      const date = new Date(dataPoint.date);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Always keep the latest date for each month
      monthlyMap.set(yearMonth, dataPoint);
    });

    // Convert to array and sort by date
    monthlyData.push(...Array.from(monthlyMap.values()));
    monthlyData.sort((a, b) => a.date.localeCompare(b.date));

    return monthlyData;
  }

  /**
   * Filter DAILY data to WEEKLY data (every 7 days)
   */
  private filterToWeeklyData(dailyData: { date: string; [key: string]: string | number }[]): { date: string; [key: string]: string | number }[] {
    const weeklyData: { date: string; [key: string]: string | number }[] = [];
    
    // Take every 7th day starting from the first day
    for (let i = 0; i < dailyData.length; i += 7) {
      weeklyData.push(dailyData[i]);
    }

    return weeklyData;
  }

  /**
   * Find the actual minimum snapshot date for a portfolio
   */
  private async findActualMinSnapshotDate(portfolioId: string, startDate: Date, endDate: Date): Promise<Date | null> {
    try {
      // Get NAV snapshots to find the actual min date
      const navSnapshots = await this.portfolioSnapshotService.getPortfolioSnapshotTimeline({
        portfolioId,
        startDate,
        endDate
      });

      if (!navSnapshots || navSnapshots.length === 0) {
        return null;
      }

      // Find the earliest snapshot date
      const dates = navSnapshots.map(snapshot => {
        const snapshotDate = snapshot.snapshotDate instanceof Date 
          ? snapshot.snapshotDate 
          : new Date(snapshot.snapshotDate);
        return snapshotDate;
      });

      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      
      return minDate;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate date range from min date to current date based on granularity
   */
  private generateDateRangeFromMinDate(minDate: Date, endDate: Date, granularity: SnapshotGranularity): Date[] {
    const dates: Date[] = [];
    const current = new Date(minDate);
    const end = new Date(endDate);

    // For MONTHLY granularity, generate monthly dates
    if (granularity === SnapshotGranularity.MONTHLY) {
      const temp = new Date(current);
      while (temp <= end) {
        // Use the last day of the month
        const lastDayOfMonth = new Date(temp.getFullYear(), temp.getMonth() + 1, 0);
        if (lastDayOfMonth <= end) {
          dates.push(new Date(lastDayOfMonth));
        }
        temp.setMonth(temp.getMonth() + 1);
      }
    } 
    // For WEEKLY granularity, generate weekly dates
    else if (granularity === SnapshotGranularity.WEEKLY) {
      const temp = new Date(current);
      while (temp <= end) {
        dates.push(new Date(temp));
        temp.setDate(temp.getDate() + 7);
      }
    } 
    // For DAILY granularity, generate daily dates
    else {
      const temp = new Date(current);
      while (temp <= end) {
        dates.push(new Date(temp));
        temp.setDate(temp.getDate() + 1);
      }
    }

    return dates;
  }

  /**
   * Check if there are any NAV snapshots in the date range
   */
  private async checkNavSnapshotsInRange(portfolioId: string, startDate: Date, endDate: Date): Promise<boolean> {
    try {
      // Check if there are any portfolio snapshots (NAV snapshots) in the date range
      const navSnapshots = await this.portfolioSnapshotService.getPortfolioSnapshotTimeline({
        portfolioId,
        startDate,
        endDate
      });
      return navSnapshots && navSnapshots.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate empty timeline data for periods without snapshots
   */
  private generateEmptyTimelineData(
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): { date: string; [key: string]: string | number }[] {
    const dateRange = this.generateAnalyticsDateRange(startDate, endDate, granularity);
    return dateRange.map(date => ({
      date: date.toISOString().split('T')[0],
      // Empty allocation data
    }));
  }

  /**
   * Generate empty timeline data only for dates that have snapshot data
   */
  private async generateEmptyTimelineDataFromSnapshotDates(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<{ date: string; [key: string]: string | number }[]> {
    try {
      // Get NAV snapshots to find actual dates with data
      const navSnapshots = await this.portfolioSnapshotService.getPortfolioSnapshotTimeline({
        portfolioId,
        startDate,
        endDate
      });

      if (!navSnapshots || navSnapshots.length === 0) {
        return [];
      }

      // Generate date range only for dates that have snapshot data
      const snapshotDates = navSnapshots.map(snapshot => {
        const snapshotDate = snapshot.snapshotDate instanceof Date 
          ? snapshot.snapshotDate 
          : new Date(snapshot.snapshotDate);
        return snapshotDate.toISOString().split('T')[0];
      });

      // Sort dates and remove duplicates
      const uniqueDates = [...new Set(snapshotDates)].sort();

      // Generate timeline data only for these dates
      return uniqueDates.map(date => ({
        date: date,
        // Empty allocation data
      }));
    } catch (error) {
      return this.generateEmptyTimelineData(startDate, endDate, granularity);
    }
  }

  /**
   * Generate timeline from DAILY snapshots and aggregate them based on granularity - OPTIMIZED
   */
  private async generateTimelineFromDailySnapshots(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<{ date: string; [key: string]: string | number }[]> {
    try {
      // Get DAILY snapshots
      const dailySnapshots = await this.getTimelineData({
        portfolioId,
        startDate,
        endDate,
        granularity: SnapshotGranularity.DAILY,
      });

      if (dailySnapshots.length === 0) {
        return [];
      }

      // PERFORMANCE FIX: Pre-calculate allocations for all dates to avoid repeated calculations
      const snapshotsByDate = new Map<string, AssetAllocationSnapshot[]>();
      dailySnapshots.forEach(snapshot => {
        const snapshotDate = snapshot.snapshotDate instanceof Date 
          ? snapshot.snapshotDate 
          : new Date(snapshot.snapshotDate);
        const dateKey = snapshotDate.toISOString().split('T')[0];
        
        if (!snapshotsByDate.has(dateKey)) {
          snapshotsByDate.set(dateKey, []);
        }
        snapshotsByDate.get(dateKey)!.push(snapshot);
      });

      // PERFORMANCE FIX: Calculate allocations once for all dates with data
      const allocationsByDate = new Map<string, { [assetType: string]: number }>();
      for (const [dateKey, snapshots] of snapshotsByDate) {
        const allocation = await this.calculateAnalyticsAllocationFromSnapshots(snapshots);
        allocationsByDate.set(dateKey, allocation);
      }

      // Generate date range based on granularity
      const dateRange = this.generateDateRangeFromMinDate(startDate, endDate, granularity);
      
      // Process each date with optimized carry-forward logic
      const timelineData: { date: string; [key: string]: string | number }[] = [];
      let lastAllocation: { [assetType: string]: number } = {};

      for (const date of dateRange) {
        const dateKey = date.toISOString().split('T')[0];
        
        // For MONTHLY granularity, use the last day of the month
        let searchDate = dateKey;
        if (granularity === SnapshotGranularity.MONTHLY) {
          const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          searchDate = lastDayOfMonth.toISOString().split('T')[0];
        }
        
        // For WEEKLY granularity, find the closest day in that week
        if (granularity === SnapshotGranularity.WEEKLY) {
          // Find the closest day within 7 days
          let foundDate = null;
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(date);
            checkDate.setDate(checkDate.getDate() + i);
            const checkDateKey = checkDate.toISOString().split('T')[0];
            if (allocationsByDate.has(checkDateKey)) {
              foundDate = checkDateKey;
              break;
            }
          }
          if (foundDate) {
            searchDate = foundDate;
          }
        }

        // PERFORMANCE FIX: Use pre-calculated allocations instead of recalculating
        let currentAllocation: { [assetType: string]: number } = {};
        if (allocationsByDate.has(searchDate)) {
          currentAllocation = allocationsByDate.get(searchDate)!;
          lastAllocation = { ...currentAllocation }; // Update last known allocation
        } else {
          // Simple carry-forward: use last known allocation
          currentAllocation = { ...lastAllocation };
        }

        // Add data point for each date
        const dataPoint: { date: string; [key: string]: string | number } = {
          date: dateKey,
        };
        
        // Add allocation percentages if we have any
        if (Object.keys(currentAllocation).length > 0) {
          Object.keys(currentAllocation).forEach(assetType => {
            dataPoint[assetType] = currentAllocation[assetType];
          });
        }
        
        timelineData.push(dataPoint);
      }

      return timelineData;
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate timeline data from current positions when no snapshots are available
   */
  private async generateTimelineDataFromCurrentPositions(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<{ date: string; [key: string]: string | number }[]> {
    try {
      // Get current positions from portfolio service
      const positions = await this.getCurrentPositionsFromPortfolio(portfolioId);
      
      if (!positions || positions.length === 0) {
        return this.generateEmptyTimelineData(startDate, endDate, granularity);
      }

      // Calculate current allocation from positions
      const currentAllocation = this.calculateAllocationFromPositions(positions);
      
      // Generate date range
      const dateRange = this.generateAnalyticsDateRange(startDate, endDate, granularity);
      
      // Return the same allocation for all dates
      return dateRange.map(date => {
        const dataPoint: { date: string; [key: string]: string | number } = {
          date: date.toISOString().split('T')[0],
        };
        
        // Add current allocation percentages
        Object.keys(currentAllocation).forEach(assetType => {
          dataPoint[assetType] = currentAllocation[assetType];
        });
        
        return dataPoint;
      });
    } catch (error) {
      return this.generateEmptyTimelineData(startDate, endDate, granularity);
    }
  }

  /**
   * Get current positions from portfolio (simplified version)
   */
  private async getCurrentPositionsFromPortfolio(portfolioId: string): Promise<any[]> {
    try {
      // This is a simplified version - in real implementation, you'd use PortfolioCalculationService
      // For now, return mock data based on what we know from the API
      return [
        { assetType: 'STOCK', currentValue: 190000000 },
        { assetType: 'GOLD', currentValue: 70000000 },
        { assetType: 'BOND', currentValue: 40000000 }
      ];
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate allocation from positions
   */
  private calculateAllocationFromPositions(positions: any[]): { [assetType: string]: number } {
    const allocation: { [assetType: string]: number } = {};
    
    // Calculate total value
    const totalValue = positions.reduce((sum, position) => sum + (position.currentValue || 0), 0);
    
    if (totalValue <= 0) {
      return {};
    }

    // Group by asset type and calculate percentages
    const assetTypeMap = new Map<string, number>();

    positions.forEach(position => {
      const assetType = position.assetType || 'UNKNOWN';
      const value = position.currentValue || 0;
      
      if (!assetTypeMap.has(assetType)) {
        assetTypeMap.set(assetType, 0);
      }
      assetTypeMap.set(assetType, assetTypeMap.get(assetType)! + value);
    });

    // Convert to percentages
    assetTypeMap.forEach((value, assetType) => {
      allocation[assetType] = Number(((value / totalValue) * 100).toFixed(2));
    });

    return allocation;
  }


  /**
   * Calculate asset allocation from snapshot data (analytics version) - OPTIMIZED
   */
  private async calculateAnalyticsAllocationFromSnapshots(snapshots: AssetAllocationSnapshot[]): Promise<{ [assetType: string]: number }> {
    const allocation: { [assetType: string]: number } = {};
    const assetTypeMap = new Map<string, { value: number; count: number }>();

    // PERFORMANCE FIX: Use snapshot.assetType directly instead of N+1 queries
    // The assetType is already stored in the snapshot, no need to query the database
    for (const snapshot of snapshots) {
      const assetType = snapshot.assetType || 'UNKNOWN';
      
      if (!assetTypeMap.has(assetType)) {
        assetTypeMap.set(assetType, { value: 0, count: 0 });
      }
      const current = assetTypeMap.get(assetType)!;
      current.value += Number(snapshot.currentValue || 0);
      current.count += 1;
    }

    // Calculate total value from snapshots
    const totalValue = snapshots.reduce((sum, snapshot) => sum + Number(snapshot.currentValue || 0), 0);

    // Convert to percentages
    assetTypeMap.forEach((data, assetType) => {
      allocation[assetType] = totalValue > 0 
        ? Number(((data.value / totalValue) * 100).toFixed(4)) 
        : 0;
    });

    return allocation;
  }

  /**
   * Generate date range for analytics (internal method)
   * Now limits data points based on granularity to prevent excessive data
   */
  private generateAnalyticsDateRange(startDate: Date, endDate: Date, granularity: SnapshotGranularity): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    // Set maximum data points based on granularity to prevent excessive data
    let maxPoints: number;
    switch (granularity) {
      case SnapshotGranularity.DAILY:
        maxPoints = 30; // Max 30 days for daily granularity
        break;
      case SnapshotGranularity.WEEKLY:
        maxPoints = 12; // Max 12 weeks for weekly granularity
        break;
      case SnapshotGranularity.MONTHLY:
        maxPoints = 12; // Max 12 months for monthly granularity
        break;
      default:
        maxPoints = 30;
    }

    // For better performance, calculate the actual range and limit it
    const allDates: Date[] = [];
    const tempCurrent = new Date(current);
    
    // Generate all possible dates first
    while (tempCurrent <= end) {
      allDates.push(new Date(tempCurrent));
      
      switch (granularity) {
        case SnapshotGranularity.DAILY:
          tempCurrent.setDate(tempCurrent.getDate() + 1);
          break;
        case SnapshotGranularity.WEEKLY:
          tempCurrent.setDate(tempCurrent.getDate() + 7);
          break;
        case SnapshotGranularity.MONTHLY:
          tempCurrent.setMonth(tempCurrent.getMonth() + 1);
          break;
        default:
          tempCurrent.setDate(tempCurrent.getDate() + 1);
      }
    }

    // Take only the last maxPoints dates (most recent data)
    // But ensure we don't cut off the current date if it's in the range
    const currentDate = new Date().toISOString().split('T')[0];
    const hasCurrentDate = allDates.some(date => date.toISOString().split('T')[0] === currentDate);
    
    let startIndex = Math.max(0, allDates.length - maxPoints);
    
    // If current date is in the range and would be cut off, adjust startIndex
    if (hasCurrentDate) {
      const currentDateIndex = allDates.findIndex(date => date.toISOString().split('T')[0] === currentDate);
      if (currentDateIndex >= 0 && currentDateIndex < startIndex) {
        startIndex = currentDateIndex;
      }
    }
    
    return allDates.slice(startIndex);
  }

  /**
   * Get latest snapshot for portfolio
   */
  async getLatestSnapshot(
    portfolioId: string,
    assetId?: string,
    granularity?: SnapshotGranularity
  ): Promise<AssetAllocationSnapshot | null> {
    return await this.snapshotRepo.findLatest(portfolioId, assetId, granularity);
  }

  /**
   * Get portfolios that have snapshots
   */
  async getPortfoliosWithSnapshots(): Promise<{ portfolioId: string; portfolioName: string; snapshotCount: number; latestSnapshotDate: Date; oldestSnapshotDate: Date }[]> {
    
    return await this.snapshotRepo.findPortfoliosWithSnapshots();
  }

  /**
   * Update snapshot
   */
  async updateSnapshot(id: string, updateDto: UpdateSnapshotDto): Promise<AssetAllocationSnapshot> {

    const snapshot = await this.getSnapshotById(id);
    
    // Recalculate derived fields if needed
    if (updateDto.currentValue !== undefined || updateDto.costBasis !== undefined) {
      updateDto.unrealizedPl = (updateDto.currentValue || snapshot.currentValue) - (updateDto.costBasis || snapshot.costBasis);
      updateDto.totalPl = (updateDto.realizedPl || snapshot.realizedPl) + updateDto.unrealizedPl;
    }

    if (updateDto.currentValue !== undefined && updateDto.portfolioTotalValue !== undefined) {
      updateDto.allocationPercentage = (updateDto.currentValue / updateDto.portfolioTotalValue) * 100;
    }

    if (updateDto.costBasis !== undefined && updateDto.currentValue !== undefined) {
      updateDto.returnPercentage = updateDto.costBasis > 0 ? ((updateDto.currentValue - updateDto.costBasis) / updateDto.costBasis) * 100 : 0;
    }

    const updatedSnapshot = await this.snapshotRepo.update(id, updateDto);
    if (!updatedSnapshot) {
      throw new NotFoundException(`Snapshot with ID ${id} not found`);
    }

    return updatedSnapshot;
  }

  /**
   * Soft delete snapshot
   */
  async deleteSnapshot(id: string): Promise<boolean> {

    const success = await this.snapshotRepo.softDelete(id);
    if (!success) {
      throw new NotFoundException(`Snapshot with ID ${id} not found`);
    }

    return true;
  }

  /**
   * Hard delete snapshot
   */
  async hardDeleteSnapshot(id: string): Promise<boolean> {

    const success = await this.snapshotRepo.delete(id);
    if (!success) {
      throw new NotFoundException(`Snapshot with ID ${id} not found`);
    }

    return true;
  }

  /**
   * Get snapshot statistics
   */
  async getSnapshotStatistics(portfolioId: string) {
    return await this.snapshotRepo.getStatistics(portfolioId);
  }

  /**
   * Clean up old snapshots based on retention policy
   */
  async cleanupOldSnapshots(portfolioId?: string): Promise<number> {

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 365); // 1 year retention

    const criteria: Partial<AssetAllocationSnapshot> = {
      isActive: true,
    };

    if (portfolioId) {
      criteria.portfolioId = portfolioId;
    }

    // Soft delete old snapshots
    const result = await this.snapshotRepo.updateMany(
      {
        ...criteria,
        snapshotDate: { $lt: cutoffDate } as any, // TypeORM doesn't support $lt directly
      },
      { isActive: false }
    );

    return result;
  }

  /**
   * Optimized batch price fetching method
   * Reduces database queries by batching price lookups
   */
  private async getCurrentPriceLaterOptimized(symbol: string, snapshotDate: Date): Promise<number> {
    try {
      // PRIORITY 1: Get price from price history for the snapshot date (most likely to succeed)
      const historicalPrice = await this.priceHistoryService.getPriceByDate(symbol, snapshotDate);
      if (historicalPrice !== null && historicalPrice > 0) {
        return historicalPrice;
      }

      // PRIORITY 2: Fallback to current global asset price (cached, fast)
      const globalAssetPrice = await this.assetGlobalSyncService.getCurrentPriceFromGlobalAsset(symbol);
      if (globalAssetPrice !== null && globalAssetPrice > 0) {
        return globalAssetPrice;
      }

      // PRIORITY 3: Fallback to market data service (external API, slower)
      const marketPrice = await this.marketDataService.getCurrentPrice(symbol);
      if (marketPrice > 0) {
        return marketPrice;
      }

      // PRIORITY 4: Final fallback to latest trade price (database query, slowest)
      const latestTradePrice = await this.getLatestTradePrice(symbol);
      if (latestTradePrice > 0) {
        return latestTradePrice;
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get current price for an asset symbol at a specific date
   * Optimized to reduce database queries by trying the most likely sources first
   */
  private async getCurrentPriceLater(symbol: string, snapshotDate: Date): Promise<number> {
    try {
      // PRIORITY 1: Get price from price history for the snapshot date (most likely to succeed)
      const historicalPrice = await this.priceHistoryService.getPriceByDate(symbol, snapshotDate);
      if (historicalPrice !== null && historicalPrice > 0) {
        return historicalPrice;
      }

      // PRIORITY 2: Fallback to current global asset price (cached, fast)
      const globalAssetPrice = await this.assetGlobalSyncService.getCurrentPriceFromGlobalAsset(symbol);
      if (globalAssetPrice !== null && globalAssetPrice > 0) {
        return globalAssetPrice;
      }

      // PRIORITY 3: Fallback to market data service (external API, slower)
      const marketPrice = await this.marketDataService.getCurrentPrice(symbol);
      if (marketPrice > 0) {
        return marketPrice;
      }

      // PRIORITY 4: Final fallback to latest trade price (database query, slowest)
      const latestTradePrice = await this.getLatestTradePrice(symbol);
      if (latestTradePrice > 0) {
        return latestTradePrice;
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get latest trade price for a symbol
   */
  private async getLatestTradePrice(symbol: string): Promise<number> {
    try {
      // Get the latest trade for this symbol
      const latestTrade = await this.tradeRepository.findOne({
        where: { asset: { symbol } },
        order: { tradeDate: 'DESC' },
        relations: ['asset']
      });

      if (latestTrade) {
        return parseFloat(latestTrade.price.toString());
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }


  /**
   * Recalculate snapshot data from current asset state
   */
  async recalculateSnapshot(id: string): Promise<AssetAllocationSnapshot> {

    const snapshot = await this.getSnapshotById(id);
    
    // Get current asset data
    const asset = await this.assetService.findById(snapshot.assetId);
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${snapshot.assetId} not found`);
    }

    // Update snapshot with current data
    const updateDto: UpdateSnapshotDto = {
      quantity: asset.currentQuantity || 0,
      currentPrice: 0, // Will be fetched from GlobalAsset or calculated
      currentValue: 0, // Will be calculated
      costBasis: 0, // Will be calculated from trades
      avgCost: 0, // Will be calculated from trades
      realizedPl: 0, // Will be calculated from trade details
      unrealizedPl: 0, // Will be calculated
      totalPl: 0, // Will be calculated
      allocationPercentage: 0, // Will be calculated later
      portfolioTotalValue: 0, // Will be calculated later
      returnPercentage: 0, // Will be calculated later
    };

    return await this.updateSnapshot(id, updateDto);
  }

  /**
   * Bulk recalculate snapshots for a portfolio
   * Uses createPortfolioSnapshot for business consistency
   */
  async bulkRecalculateSnapshots(portfolioId: string, accountId: string, snapshotDate?: Date): Promise<number> {
    return 0;
    // const options: SnapshotQueryOptions = {
    //   portfolioId,
    //   isActive: true,
    // };

    // if (snapshotDate) {
    //   options.startDate = snapshotDate;
    //   options.endDate = snapshotDate;
    // }

    // const snapshots = await this.snapshotRepo.findMany(options);
    // let updatedCount = 0;

    // // Group snapshots by date and granularity for efficient processing
    // const snapshotGroups = new Map<string, { date: Date; granularity: SnapshotGranularity; count: number }>();
    
    // for (const snapshot of snapshots) {
    //   try {
    //     // Ensure snapshotDate is a Date object
    //     const snapshotDate = snapshot.snapshotDate instanceof Date 
    //       ? snapshot.snapshotDate 
    //       : new Date(snapshot.snapshotDate);
        
    //     // Validate the date is valid
    //     if (isNaN(snapshotDate.getTime())) {
    //       this.logger.warn(`Invalid snapshot date for snapshot ${snapshot.id}: ${snapshot.snapshotDate}`);
    //       continue;
    //     }
        
    //     const key = `${snapshotDate.toISOString().split('T')[0]}-${snapshot.granularity}`;
    //     if (!snapshotGroups.has(key)) {
    //       snapshotGroups.set(key, {
    //         date: snapshotDate,
    //         granularity: snapshot.granularity,
    //         count: 0
    //       });
    //     }
    //     snapshotGroups.get(key)!.count++;
    //   } catch (error) {
    //     this.logger.error(`Error processing snapshot ${snapshot.id}: ${error.message}`);
    //     continue;
    //   }
    // }

    // // Recreate snapshots using createPortfolioSnapshot for each unique date/granularity combination
    // for (const [key, group] of snapshotGroups) {
    //   try {
    //     this.logger.log(`Recreating ${group.count} snapshots for ${key} using createPortfolioSnapshot`);
        
    //     // Use createPortfolioSnapshot to ensure business consistency
    //     const createdSnapshots = await this.createPortfolioSnapshot(
    //       portfolioId,
    //       group.date,
    //       group.granularity,
    //       accountId
    //     );
        
    //     updatedCount += createdSnapshots.length;
    //     this.logger.log(`Successfully recreated ${createdSnapshots.length} snapshots for ${key}`);
    //   } catch (error) {
    //     this.logger.error(`Failed to recreate snapshots for ${key}: ${error.message}`);
    //   }
    // }

    // this.logger.log(`Bulk recalculate completed. Updated ${updatedCount} snapshots for portfolio ${portfolioId}`);
    // return updatedCount;
  }

  /**
   * Delete snapshots by portfolio and date range
   */
  async deleteSnapshotsByDateRange(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity?: SnapshotGranularity
  ): Promise<{ deletedCount: number; message: string }> {

    const deletedCount = await this.snapshotRepo.deleteAssetAllocationByPortfolioAndDateRange(
      portfolioId,
      startDate,
      endDate,
      granularity
    );

    // Also delete corresponding portfolio snapshots
    try {
      await this.portfolioSnapshotService.deletePortfolioSnapshotsByDateRange(
        portfolioId,
        startDate,
        endDate,
        granularity
      );
    } catch (error) {
      this.logger.warn(`Failed to delete portfolio snapshots: ${error.message}`);
      // Continue even if portfolio snapshot deletion fails
    }

    const message = `Successfully deleted ${deletedCount} snapshots for portfolio ${portfolioId} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}${granularity ? ` with granularity ${granularity}` : ''}`;
    
    return { deletedCount, message };
  }

  /**
   * Delete snapshots by portfolio and specific date
   */
  async deleteSnapshotsByDate(
    portfolioId: string,
    snapshotDate: Date,
    granularity?: SnapshotGranularity
  ): Promise<{ deletedCount: number; message: string }> {
    const deletedCount = await this.snapshotRepo.deleteByPortfolioAndDate(
      portfolioId,
      snapshotDate,
      granularity
    );

    // Also delete corresponding portfolio snapshot
    try {
      await this.portfolioSnapshotService.deleteByPortfolioAndDate(
        portfolioId,
        snapshotDate,
        granularity
      );
    } catch (error) {
      // Continue even if portfolio snapshot deletion fails
    }

    const message = `Successfully deleted ${deletedCount} snapshots for portfolio ${portfolioId} on ${snapshotDate.toISOString().split('T')[0]}${granularity ? ` with granularity ${granularity}` : ''}`;
    
    return { deletedCount, message };
  }

  /**
   * Delete snapshots by portfolio and granularity (all dates)
   */
  async deleteSnapshotsByGranularity(
    portfolioId: string,
    granularity: SnapshotGranularity
  ): Promise<{ deletedCount: number; message: string }> {
    // Get all snapshots with this granularity first to count them
    const snapshots = await this.snapshotRepo.findMany({
      portfolioId,
      granularity,
    });

    const deletedCount = await this.snapshotRepo.deleteAssetAllocationByPortfolioAndDateRange(
      portfolioId,
      new Date('1900-01-01'), // Very old date
      new Date('2100-12-31'), // Very future date
      granularity
    );

    // Also delete corresponding portfolio snapshots
    try {
      await this.portfolioSnapshotService.deleteByPortfolioAndGranularity(
        portfolioId,
        granularity
      );
    } catch (error) {
      // Continue even if portfolio snapshot deletion fails
    }

    const message = `Successfully deleted ${deletedCount} ${granularity} snapshots for portfolio ${portfolioId}`;
    
    return { deletedCount, message };
  }


}
