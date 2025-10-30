import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Portfolio } from '../entities/portfolio.entity';
import { NavSnapshot } from '../entities/nav-snapshot.entity';
import { AssetGroupPerformanceSnapshot } from '../entities/asset-group-performance-snapshot.entity';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { PortfolioCalculationService } from './portfolio-calculation.service';
import { AssetDetailSummaryResponseDto, AssetDetailSummaryDto } from '../dto/asset-detail-summary.dto';
import { TradeRepository } from '../../trading/repositories/trade.repository';
import { Trade } from '../../trading/entities/trade.entity';
import { SnapshotService } from './snapshot.service';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { PortfolioSnapshotService } from './portfolio-snapshot.service';
import { PerformanceSnapshotService } from './performance-snapshot.service';

/**
 * Service class for Portfolio analytics and performance calculations.
 * Handles NAV calculations, performance metrics, and historical analysis.
 */
@Injectable()
export class PortfolioAnalyticsService {
  private readonly logger = new Logger(PortfolioAnalyticsService.name);
  private readonly CACHE_ENABLED = process.env.CACHE_ENABLED === 'true';

  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    @InjectRepository(NavSnapshot)
    private readonly navSnapshotRepository: Repository<NavSnapshot>,
    private readonly portfolioCalculationService: PortfolioCalculationService,
    private readonly tradeRepository: TradeRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly snapshotService: SnapshotService,
    private readonly portfolioSnapshotService: PortfolioSnapshotService,
    private readonly performanceSnapshotService: PerformanceSnapshotService,
  ) {}

  // /**
  //  * Calculate Net Asset Value (NAV) for a portfolio.
  //  * @param portfolioId - Portfolio ID
  //  * @returns Promise<number>
  //  */
  // async calculateNAV(portfolioId: string): Promise<number> {
  //   const portfolio = await this.portfolioRepository.findByIdWithAssets(portfolioId);
  //   if (!portfolio) {
  //     throw new Error(`Portfolio with ID ${portfolioId} not found`);
  //   }

  //   // Use the new calculation service
  //   return await this.portfolioCalculationService.calculateNAV(
  //     portfolioId,
  //     parseFloat(portfolio.cashBalance.toString()),
  //   );
  // }

  /**
   * Calculate Return on Equity (ROE) for a portfolio over a specific period.
   * @param portfolioId - Portfolio ID
   * @param startDate - Start date for calculation
   * @param endDate - End date for calculation
   * @returns Promise<number> ROE as percentage
   */
  async calculateROE(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const navHistory = await this.portfolioRepository.getPerformanceHistory(
      portfolioId,
      startDate,
      endDate,
    );

    if (navHistory.length < 2) {
      return 0;
    }

    const startNav = parseFloat(navHistory[0].navValue.toString());
    const endNav = parseFloat(navHistory[navHistory.length - 1].navValue.toString());

    if (startNav === 0) {
      return 0;
    }

    return ((endNav - startNav) / startNav) * 100;
  }

  /**
   * Calculate week-on-week change percentage.
   * @param portfolioId - Portfolio ID
   * @returns Promise<number> Week-on-week change as percentage
   */
  async calculateWeekOnWeekChange(portfolioId: string): Promise<number> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 14); // 2 weeks ago

    const navHistory = await this.portfolioRepository.getPerformanceHistory(
      portfolioId,
      startDate,
      endDate,
    );

    if (navHistory.length < 2) {
      return 0;
    }

    // Get NAV from 2 weeks ago and current NAV
    const twoWeeksAgoNav = parseFloat(navHistory[0].navValue.toString());
    const currentNav = parseFloat(navHistory[navHistory.length - 1].navValue.toString());

    if (twoWeeksAgoNav === 0) {
      return 0;
    }

    return ((currentNav - twoWeeksAgoNav) / twoWeeksAgoNav) * 100;
  }

  /**
   * Calculate return history by asset group.
   * @param portfolioId - Portfolio ID
   * @param startDate - Start date for calculation
   * @param endDate - End date for calculation
   * @returns Promise<Array<{assetType: string, return: number}>>
   */
  async calculateReturnHistory(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ assetType: string; return: number }>> {
    const allocation = await this.portfolioRepository.getAssetAllocation(portfolioId);
    
    // For now, return allocation as return history
    // TODO: Implement actual return calculation by asset type
    return allocation.map(item => ({
      assetType: item.assetType,
      return: item.percentage, // This should be actual return calculation
    }));
  }

  // /**
  //  * Generate NAV snapshot for a portfolio.
  //  * @param portfolioId - Portfolio ID
  //  * @param navDate - Date for the snapshot
  //  * @returns Promise<NavSnapshot>
  //  */
  // async generateNavSnapshot(
  //   portfolioId: string,
  //   navDate: Date = new Date(),
  // ): Promise<NavSnapshot> {
  //   const portfolio = await this.portfolioRepository.findByIdWithAssets(portfolioId);
  //   if (!portfolio) {
  //     throw new Error(`Portfolio with ID ${portfolioId} not found`);
  //   }

  //   const navValue = await this.calculateNAV(portfolioId);
  //   const totalValue = portfolio.totalValue;

  //   // Calculate and update NAV per unit for funds
  //   let navPerUnit = 0;
  //   if (portfolio.isFund && portfolio.totalOutstandingUnits > 0) {
  //     const outstandingUnits = typeof portfolio.totalOutstandingUnits === 'string' 
  //       ? parseFloat(portfolio.totalOutstandingUnits) 
  //       : portfolio.totalOutstandingUnits;
  //     navPerUnit = navValue / outstandingUnits;
      
  //     // Update portfolio with calculated NAV per unit and last NAV date
  //     await this.portfolioRepository.update(portfolioId, {
  //       navPerUnit: navPerUnit,
  //       lastNavDate: navDate // Use snapshot date as last NAV date
  //     });
      
  //     this.logger.log(`Updated navPerUnit to ${navPerUnit.toFixed(8)} for fund ${portfolioId} during daily snapshot`);
  //   }

  //   // Check if snapshot already exists for this date
  //   const existingSnapshot = await this.navSnapshotRepository.findOne({
  //     where: {
  //       portfolioId: portfolioId,
  //       navDate: navDate,
  //     },
  //   });

  //   if (existingSnapshot) {
  //     // Update existing snapshot
  //     existingSnapshot.navValue = navValue;
  //     existingSnapshot.cashBalance = portfolio.cashBalance;
  //     existingSnapshot.totalValue = totalValue;
  //     existingSnapshot.totalOutstandingUnits = portfolio.totalOutstandingUnits;
  //     existingSnapshot.navPerUnit = navPerUnit;
  //     return await this.navSnapshotRepository.save(existingSnapshot);
  //   } else {
  //     // Create new snapshot
  //     const navSnapshot = this.navSnapshotRepository.create({
  //       portfolioId: portfolioId,
  //       navDate: navDate,
  //       navValue: navValue,
  //       cashBalance: portfolio.cashBalance,
  //       totalValue: totalValue,
  //       totalOutstandingUnits: portfolio.totalOutstandingUnits,
  //       navPerUnit: navPerUnit,
  //     });

  //     return await this.navSnapshotRepository.save(navSnapshot);
  //   }
  // }

  /**
   * Calculate Time-Weighted Return (TWR).
   * @param portfolioId - Portfolio ID
   * @param startDate - Start date for calculation
   * @param endDate - End date for calculation
   * @returns Promise<number> TWR as percentage
   */
  async calculateTWR(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const navHistory = await this.portfolioRepository.getPerformanceHistory(
      portfolioId,
      startDate,
      endDate,
    );

    if (navHistory.length < 2) {
      return 0;
    }

    let twr = 1;

    for (let i = 1; i < navHistory.length; i++) {
      const previousNav = parseFloat(navHistory[i - 1].navValue.toString());
      const currentNav = parseFloat(navHistory[i].navValue.toString());
      
      if (previousNav > 0) {
        const periodReturn = currentNav / previousNav;
        twr *= periodReturn;
      }
    }

    return (twr - 1) * 100;
  }

  /**
   * Calculate Internal Rate of Return (IRR).
   * @param portfolioId - Portfolio ID
   * @param startDate - Start date for calculation
   * @param endDate - End date for calculation
   * @returns Promise<number> IRR as percentage
   */
  async calculateIRR(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // TODO: Implement IRR calculation
    // This requires cash flow data and complex mathematical calculation
    // For now, return a placeholder
    return 0;
  }

  /**
   * Calculate Extended Internal Rate of Return (XIRR).
   * @param portfolioId - Portfolio ID
   * @param startDate - Start date for calculation
   * @param endDate - End date for calculation
   * @returns Promise<number> XIRR as percentage
   */
  async calculateXIRR(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // TODO: Implement XIRR calculation
    // This requires cash flow data with specific dates and complex calculation
    // For now, return a placeholder
    return 0;
  }

  // /**
  //  * Get performance summary for a portfolio.
  //  * @param portfolioId - Portfolio ID
  //  * @returns Promise<object>
  //  */
  // async getPerformanceSummary(portfolioId: string): Promise<{
  //   currentNAV: number;
  //   weekOnWeekChange: number;
  //   roe1Month: number;
  //   roe3Month: number;
  //   roe1Year: number;
  //   twr1Year: number;
  // }> {
  //   const currentNAV = await this.calculateNAV(portfolioId);
  //   const weekOnWeekChange = await this.calculateWeekOnWeekChange(portfolioId);

  //   // Calculate ROE for different periods
  //   const now = new Date();
  //   const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  //   const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  //   const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  //   const roe1Month = await this.calculateROE(portfolioId, oneMonthAgo, now);
  //   const roe3Month = await this.calculateROE(portfolioId, threeMonthsAgo, now);
  //   const roe1Year = await this.calculateROE(portfolioId, oneYearAgo, now);
  //   const twr1Year = await this.calculateTWR(portfolioId, oneYearAgo, now);

  //   return {
  //     currentNAV,
  //     weekOnWeekChange,
  //     roe1Month,
  //     roe3Month,
  //     roe1Year,
  //     twr1Year,
  //   };
  // }

  /**
   * Get asset detail summary data for a portfolio.
   * @param portfolioId - Portfolio ID
   * @returns Promise<AssetDetailSummaryResponseDto>
   */
  async getAssetDetailSummary(portfolioId: string, snapshotDate?: Date): Promise<AssetDetailSummaryResponseDto> {
    // Get portfolio details
    const portfolio = await this.portfolioRepository.findByIdWithAssets(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }

    // Use PortfolioCalculationService to get consistent positions and calculations
    const calculation = await this.portfolioCalculationService.calculatePortfolioAssetValues(
      portfolioId,
      snapshotDate
    );

    // Get asset names and types from database
    const assetInfoQuery = `
      SELECT DISTINCT
        asset.id as "assetId",
        asset.symbol,
        asset.name,
        asset.type as "assetType"
      FROM assets asset
      INNER JOIN trades trade ON asset.id = trade.asset_id
      WHERE trade.portfolio_id = $1
    `;
    const assetInfos = await this.portfolioRepository.query(assetInfoQuery, [portfolioId]);
    const assetInfoMap = new Map(assetInfos.map(info => [info.symbol, info]));

    // Calculate total portfolio value (use asset values only, ignore potentially incorrect cash balance)
    const portfolioTotalValue = calculation.assetPositions.reduce((sum, pos) => sum + pos.currentValue, 0);

    // Transform data and calculate percentages using consistent calculations
    const assetDetails: AssetDetailSummaryDto[] = calculation.assetPositions.map(position => {
      const assetInfo = assetInfoMap.get(position.symbol) || { name: position.symbol, assetType: 'UNKNOWN' };
      const currentPrice = position.quantity > 0 ? position.currentValue / position.quantity : 0;
      const percentage = position.currentValue > 0 && portfolioTotalValue > 0 ? (position.currentValue / portfolioTotalValue) * 100 : 0;
      
      // Use real unrealized P&L from PortfolioCalculationService
      const unrealizedPlPercentage = position.avgCost > 0 ? (position.unrealizedPl / (position.quantity * position.avgCost)) * 100 : 0;

      return {
        assetId: (assetInfo as any)?.assetId || position.assetId,
        symbol: position.symbol,
        name: (assetInfo as any).name,
        assetType: (assetInfo as any).assetType,
        quantity: position.quantity,
        currentPrice: currentPrice,
        totalValue: position.currentValue,
        percentage: percentage,
        unrealizedPl: position.unrealizedPl,
        unrealizedPlPercentage: unrealizedPlPercentage,
      } as AssetDetailSummaryDto;
    });

    return {
      portfolioId: portfolioId,
      totalValue: portfolioTotalValue,
      data: assetDetails,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate asset allocation timeline for a portfolio using real snapshot data.
   * @param portfolioId - Portfolio ID
   * @param months - Number of months to look back (max: 12)
   * @param useSnapshots - Always true for real data
   * @param granularity - Snapshot granularity (default: MONTHLY for better performance)
   * @returns Promise<AllocationTimelineResponse>
   */
  async calculateAllocationTimeline(
    portfolioId: string,
    months: number = 12,
    useSnapshots: boolean = true,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY,
  ): Promise<{
    portfolioId: string;
    totalValue: number;
    data: Array<{
      date: string;
      [assetType: string]: string | number;
    }>;
    calculatedAt: string;
  }> {
    try {
      // Enforce maximum 12 months limit
      const monthsToLookBack = Math.min(months, 12);
      
      const cacheKey = `allocation-timeline:${portfolioId}:${monthsToLookBack}:${granularity}`;
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache for better performance
      
      // Try to get from cache first (if enabled)
      if (this.CACHE_ENABLED) {
        const cachedResult = await this.cacheManager.get(cacheKey);
        if (cachedResult) {
          return cachedResult as {
            portfolioId: string;
            totalValue: number;
            data: Array<{
              date: string;
              [assetType: string]: string | number;
            }>;
            calculatedAt: string;
          };
        }
      }

      // Get portfolio details
      const portfolio = await this.portfolioRepository.findByIdWithAssets(portfolioId);
      if (!portfolio) {
        throw new Error(`Portfolio with ID ${portfolioId} not found`);
      }

      // Always use snapshot-based calculation for real data
      if (useSnapshots) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - monthsToLookBack);

        // Use SnapshotService to get allocation timeline data
        const snapshotData = await this.snapshotService.getAnalyticsAllocationTimeline(
          portfolioId,
          startDate,
          endDate,
          granularity
        );

        const result = {
          portfolioId,
          totalValue: parseFloat(portfolio.totalValue.toString()),
          data: snapshotData,
          calculatedAt: new Date().toISOString(),
        };

        // Cache the result (if enabled)
        if (this.CACHE_ENABLED) {
          await this.cacheManager.set(cacheKey, result, CACHE_TTL);
        }
        return result;
      }

      // Fallback to original trade-based calculation (should not be used with real data)
      const calculation = await this.portfolioCalculationService.calculatePortfolioAssetValues(portfolioId);

      // Get asset types from database
      const assetInfoQuery = `
        SELECT DISTINCT
          asset.symbol,
          asset.name,
          asset.type as "assetType"
        FROM assets asset
        INNER JOIN trades trade ON asset.id = trade.asset_id
        WHERE trade.portfolio_id = $1
      `;
      const assetInfos = await this.portfolioRepository.query(assetInfoQuery, [portfolioId]);
      const assetInfoMap = new Map(assetInfos.map(info => [info.symbol, info]));

      // Get all trades for the portfolio in the date range
      const allTrades = await this.tradeRepository.findTradesByPortfolio(portfolioId);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsToLookBack);
      
      const trades = allTrades.filter(trade => {
        const tradeDate = new Date(trade.tradeDate);
        return tradeDate >= startDate && tradeDate <= endDate;
      });

      // Group trades by month and calculate allocation for each month
      const timelineData = [];
      const monthlyData = new Map<string, Map<string, { quantity: number; value: number }>>();

      // Initialize monthly data structure
      for (let i = monthsToLookBack - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(monthKey, new Map());
      }

      // Process trades chronologically and apply cumulative effects
      const sortedTrades = trades.sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime());

      // Track cumulative holdings for each asset type
      const cumulativeHoldings = new Map<string, { quantity: number; value: number }>();

      for (const trade of sortedTrades) {
        const tradeDate = new Date(trade.tradeDate);
        const tradeMonthKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(tradeMonthKey)) {
          continue; // Skip trades outside our date range
        }

        // Get asset type from database lookup
        let assetType = 'UNKNOWN';
        const symbol = trade.asset?.symbol;
        if (symbol) {
          const assetInfo = assetInfoMap.get(symbol);
          if (assetInfo) {
            assetType = (assetInfo as any).assetType;
          }
        }

        const quantity = parseFloat(trade.quantity.toString());
        const price = parseFloat(trade.price.toString());
        const value = quantity * price;

        // Update cumulative holdings
        if (!cumulativeHoldings.has(assetType)) {
          cumulativeHoldings.set(assetType, { quantity: 0, value: 0 });
        }

        const currentHolding = cumulativeHoldings.get(assetType);
        if (trade.side === 'BUY') {
          currentHolding.quantity += quantity;
          currentHolding.value += value;
        } else {
          currentHolding.quantity -= quantity;
          currentHolding.value -= value;
        }

        // Ensure quantity doesn't go negative
        if (currentHolding.quantity < 0) {
          currentHolding.quantity = 0;
          currentHolding.value = 0;
        }

        // Apply this trade's effect to all months from trade date onwards
        for (let i = monthsToLookBack - 1; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          // Only apply to months on or after the trade month
          if (monthKey >= tradeMonthKey) {
            const monthData = monthlyData.get(monthKey);
            
            if (!monthData.has(assetType)) {
              monthData.set(assetType, { quantity: 0, value: 0 });
            }

            // Update month data with current cumulative holdings
            const current = monthData.get(assetType);
            current.quantity = currentHolding.quantity;
            current.value = currentHolding.value;
          }
        }
      }

      // Generate timeline data points in chronological order
      for (let i = monthsToLookBack - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthData = monthlyData.get(monthKey);

        const dataPoint: any = {
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`,
        };

        // For current month, use current positions with current prices
        const isCurrentMonth = i === 0;
        if (isCurrentMonth) {
          // Use current positions from PortfolioCalculationService
          const currentPositions = new Map<string, { quantity: number; value: number }>();
          
          for (const position of calculation.assetPositions) {
            if (position.quantity > 0) {
              // Get asset type from symbol
              let assetType = 'UNKNOWN';
              const assetInfo = assetInfoMap.get(position.symbol);
              if (assetInfo) {
                assetType = (assetInfo as any).assetType;
              }
              
              if (!currentPositions.has(assetType)) {
                currentPositions.set(assetType, { quantity: 0, value: 0 });
              }
              
              const current = currentPositions.get(assetType);
              current.quantity += position.quantity;
              current.value += position.currentValue;
            }
          }
          
          // Calculate allocation percentages for current month
          let totalValue = 0;
          for (const [assetType, data] of currentPositions) {
            totalValue += data.value;
          }
          
          if (totalValue > 0) {
            for (const [assetType, data] of currentPositions) {
              if (data.value > 0) {
                const percentage = (data.value / totalValue) * 100;
                dataPoint[assetType] = Math.round(percentage * 10) / 10;
              }
            }
          }
        } else if (monthData && monthData.size > 0) {
          // For historical months, use trade-based calculations
          let totalValue = 0;
          for (const [assetType, data] of monthData) {
            totalValue += data.value;
          }

          // Calculate allocation percentages
          if (totalValue > 0) {
            for (const [assetType, data] of monthData) {
              if (data.value > 0) {
                const percentage = (data.value / totalValue) * 100;
                dataPoint[assetType] = Math.round(percentage * 10) / 10;
              }
            }
          }
        }

        timelineData.push(dataPoint);
      }

      const result = {
        portfolioId,
        totalValue: parseFloat(portfolio.totalValue.toString()),
        data: timelineData,
        calculatedAt: new Date().toISOString(),
      };

      // Cache the result (if enabled)
      if (this.CACHE_ENABLED) {
        await this.cacheManager.set(cacheKey, result, CACHE_TTL);
      }

      return result;
    } catch (error) {
      console.error('Error in calculateAllocationTimeline service:', error);
      throw error;
    }
  }

  /**
   * Get portfolio snapshot timeline data for benchmark comparison.
   * @param portfolioId - Portfolio ID
   * @param startDate - Start date
   * @param endDate - End date
   * @param granularity - Snapshot granularity
   * @returns Promise<PortfolioSnapshot[]>
   */
  async getPortfolioSnapshotTimeline(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.MONTHLY
  ): Promise<any[]> {
    try {
      // Use portfolio snapshot service to get portfolio snapshots
      const portfolioSnapshots = await this.portfolioSnapshotService.getPortfolioSnapshotTimeline({
        portfolioId,
        startDate,
        endDate,
        granularity
      });

      return portfolioSnapshots || [];
    } catch (error) {
      console.error('Error in getPortfolioSnapshotTimeline service:', error);
      return [];
    }
  }

  /**
   * Get NAV history for a portfolio from portfolio snapshots.
   * @param portfolioId - Portfolio ID
   * @param startDate - Start date
   * @param endDate - End date
   * @param granularity - Data granularity (optional)
   * @returns Promise<any>
   */
  async getNavHistory(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity?: string
  ): Promise<any> {
    try {
      const snapshotGranularity = granularity ? 
        (granularity.toUpperCase() as SnapshotGranularity) : 
        SnapshotGranularity.DAILY;
      
      
      const currentYear = new Date(startDate).getFullYear();
      const yearStartDate = new Date(currentYear, 0, 1); // January 1st
      const yearEndDate = new Date(); // ngày hiện tại

      // get all snapshots for the portfolio
      const yearSnapshots = await this.portfolioSnapshotService.getPortfolioSnapshotTimeline({
        portfolioId,
        startDate: yearStartDate,
        endDate: yearEndDate,
        granularity: SnapshotGranularity.DAILY
      });

      //console.log('getNavHistory: yearSnapshots', yearSnapshots[0].snapshotDate, yearSnapshots[yearSnapshots.length - 1].snapshotDate);

      const fundSnapshots = yearSnapshots.filter(snapshot => snapshot.totalOutstandingUnits > 0);

      // Find first day of year for YTD growth from yearSnapshots
      const yearStartSnapshot = fundSnapshots.length > 0 
      ? fundSnapshots.sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime())[0]
      : null;
      
      //console.log('getNavHistory: yearStartSnapshot', yearStartDate, yearEndDate, yearStartSnapshot);

      // Get portfolio snapshots
      const portfolioSnapshots = await this.portfolioSnapshotService.getPortfolioSnapshotTimeline({
        portfolioId,
        startDate,
        endDate,
        granularity: snapshotGranularity
      });

      // Get portfolio info to determine if it's a fund
      const portfolio = await this.portfolioRepository.findOne({
        where: { portfolioId }
      });

      if (!portfolio) {
        throw new Error(`Portfolio ${portfolioId} not found`);
      }

      // Transform data for chart with pre-calculated growth metrics
      const navHistory = portfolioSnapshots.map((snapshot, index) => {
        const navValue = parseFloat(snapshot.totalPortfolioValue.toString());
        const isFund = portfolio.isFund || false;
        const totalOutstandingUnits = parseFloat(snapshot.totalOutstandingUnits.toString()) || 0;
        const navPerUnit = parseFloat(snapshot.navPerUnit.toString()) || 0;
        
        // Calculate growth metrics
        const dailyReturn = parseFloat(snapshot.dailyReturn.toString());
        const ytdReturn = parseFloat(snapshot.ytdReturn.toString());
        
        // Calculate growth values
        const dailyGrowthValue = navValue * (dailyReturn / 100);
        const ytdGrowthValue = navValue * (ytdReturn / 100);
        
        // For funds, calculate NAV per unit growth based on actual NAV per unit changes
        let navPerUnitDailyGrowth = 0;
        let navPerUnitYtdGrowth = 0;
        let navPerUnitDailyGrowthValue = 0;
        let navPerUnitYtdGrowthValue = 0;
        
        if (isFund && totalOutstandingUnits > 0) {
          // Calculate NAV per unit growth based on actual NAV per unit changes
          // Find previous day's NAV per unit for daily growth
          if (index > 0) {
            const previousSnapshot = portfolioSnapshots[index - 1];
            const previousNavPerUnit = parseFloat(previousSnapshot.navPerUnit.toString()) || 0;
            if (previousNavPerUnit > 0) {
              navPerUnitDailyGrowth = ((navPerUnit - previousNavPerUnit) / previousNavPerUnit) * 100;
              navPerUnitDailyGrowthValue = navPerUnit - previousNavPerUnit;
            }
          }
          // If no snapshot found in current year, use the earliest snapshot overall (same as database fallback)
          const finalYearStartSnapshot = yearStartSnapshot || portfolioSnapshots[0];
          
          if (finalYearStartSnapshot) {
            const yearStartNavPerUnit = parseFloat(finalYearStartSnapshot.navPerUnit.toString()) || 0;
            if (yearStartNavPerUnit > 0) {
              navPerUnitYtdGrowth = ((navPerUnit - yearStartNavPerUnit) / yearStartNavPerUnit) * 100;
              navPerUnitYtdGrowthValue = navPerUnit - yearStartNavPerUnit;
            }
          }
        }

        return {
          date: snapshot.snapshotDate,
          navValue,
          totalValue: navValue,
          cashBalance: parseFloat(snapshot.cashBalance.toString()),
          assetValue: parseFloat(snapshot.totalAssetValue.toString()),
          totalReturn: parseFloat(snapshot.totalReturn.toString()),
          portfolioPnL: parseFloat(snapshot.totalPortfolioPl.toString()),
          portfolioDailyReturn: dailyReturn,
          portfolioWeeklyReturn: parseFloat(snapshot.weeklyReturn.toString()),
          portfolioMonthlyReturn: parseFloat(snapshot.monthlyReturn.toString()),
          portfolioYtdReturn: ytdReturn,
          // Fund-specific fields
          isFund,
          totalOutstandingUnits,
          navPerUnit,
          // Pre-calculated growth metrics
          growth: {
            // Portfolio/NAV growth
            dailyGrowth: dailyReturn,
            dailyGrowthValue,
            ytdGrowth: ytdReturn,
            ytdGrowthValue,
            isDailyGrowing: dailyReturn > 0,
            isYtdGrowing: ytdReturn > 0,
            // NAV per unit growth (for funds)
            navPerUnitDailyGrowth,
            navPerUnitYtdGrowth,
            navPerUnitDailyGrowthValue,
            navPerUnitYtdGrowthValue,
            isNavPerUnitDailyGrowing: navPerUnitDailyGrowth > 0,
            isNavPerUnitYtdGrowing: navPerUnitYtdGrowth > 0
          }
        };
      });

      // Get latest growth metrics for summary
      const latestData = navHistory.length > 0 ? navHistory[navHistory.length - 1] : null;
      
      return {
        portfolioId,
        portfolio: {
          isFund: portfolio.isFund || false,
          totalOutstandingUnits: portfolio.totalOutstandingUnits || 0,
          name: portfolio.name,
          baseCurrency: portfolio.baseCurrency
        },
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        granularity: snapshotGranularity,
        data: navHistory,
        totalRecords: navHistory.length,
        // Summary growth metrics (from latest data)
        summary: latestData ? {
          navValue: latestData.navValue,
          navPerUnit: latestData.navPerUnit,
          growth: latestData.growth
        } : null,
        retrievedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getNavHistory service:', error);
      throw error;
    }
  }

  /**
   * Get asset group performance snapshots
   */
  async getAssetGroupPerformanceSnapshots(
    portfolioId: string,
    assetType?: string,
    startDate?: Date,
    endDate?: Date,
    granularity?: SnapshotGranularity
  ): Promise<AssetGroupPerformanceSnapshot[]> {
    return await this.performanceSnapshotService.getAssetGroupPerformanceSnapshots(
      portfolioId,
      assetType,
      startDate,
      endDate,
      granularity
    );
  }
}

