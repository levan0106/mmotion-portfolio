import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Portfolio } from '../entities/portfolio.entity';
import { NavSnapshot } from '../entities/nav-snapshot.entity';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { PortfolioCalculationService } from './portfolio-calculation.service';
import { AssetDetailSummaryResponseDto, AssetDetailSummaryDto } from '../dto/asset-detail-summary.dto';
import { TradeRepository } from '../../trading/repositories/trade.repository';
import { Trade } from '../../trading/entities/trade.entity';

/**
 * Service class for Portfolio analytics and performance calculations.
 * Handles NAV calculations, performance metrics, and historical analysis.
 */
@Injectable()
export class PortfolioAnalyticsService {
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    @InjectRepository(NavSnapshot)
    private readonly navSnapshotRepository: Repository<NavSnapshot>,
    private readonly portfolioCalculationService: PortfolioCalculationService,
    private readonly tradeRepository: TradeRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Calculate Net Asset Value (NAV) for a portfolio.
   * @param portfolioId - Portfolio ID
   * @returns Promise<number>
   */
  async calculateNAV(portfolioId: string): Promise<number> {
    const portfolio = await this.portfolioRepository.findByIdWithAssets(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }

    // Use the new calculation service
    return await this.portfolioCalculationService.calculateNAV(
      portfolioId,
      parseFloat(portfolio.cashBalance.toString()),
    );
  }

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

  /**
   * Generate NAV snapshot for a portfolio.
   * @param portfolioId - Portfolio ID
   * @param navDate - Date for the snapshot
   * @returns Promise<NavSnapshot>
   */
  async generateNavSnapshot(
    portfolioId: string,
    navDate: Date = new Date(),
  ): Promise<NavSnapshot> {
    const portfolio = await this.portfolioRepository.findByIdWithAssets(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }

    const navValue = await this.calculateNAV(portfolioId);
    const totalValue = portfolio.totalValue;

    // Check if snapshot already exists for this date
    const existingSnapshot = await this.navSnapshotRepository.findOne({
      where: {
        portfolioId: portfolioId,
        navDate: navDate,
      },
    });

    if (existingSnapshot) {
      // Update existing snapshot
      existingSnapshot.navValue = navValue;
      existingSnapshot.cashBalance = portfolio.cashBalance;
      existingSnapshot.totalValue = totalValue;
      return await this.navSnapshotRepository.save(existingSnapshot);
    } else {
      // Create new snapshot
      const navSnapshot = this.navSnapshotRepository.create({
        portfolioId: portfolioId,
        navDate: navDate,
        navValue: navValue,
        cashBalance: portfolio.cashBalance,
        totalValue: totalValue,
      });

      return await this.navSnapshotRepository.save(navSnapshot);
    }
  }

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

  /**
   * Get performance summary for a portfolio.
   * @param portfolioId - Portfolio ID
   * @returns Promise<object>
   */
  async getPerformanceSummary(portfolioId: string): Promise<{
    currentNAV: number;
    weekOnWeekChange: number;
    roe1Month: number;
    roe3Month: number;
    roe1Year: number;
    twr1Year: number;
  }> {
    const currentNAV = await this.calculateNAV(portfolioId);
    const weekOnWeekChange = await this.calculateWeekOnWeekChange(portfolioId);

    // Calculate ROE for different periods
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const roe1Month = await this.calculateROE(portfolioId, oneMonthAgo, now);
    const roe3Month = await this.calculateROE(portfolioId, threeMonthsAgo, now);
    const roe1Year = await this.calculateROE(portfolioId, oneYearAgo, now);
    const twr1Year = await this.calculateTWR(portfolioId, oneYearAgo, now);

    return {
      currentNAV,
      weekOnWeekChange,
      roe1Month,
      roe3Month,
      roe1Year,
      twr1Year,
    };
  }

  /**
   * Get asset detail summary data for a portfolio.
   * @param portfolioId - Portfolio ID
   * @returns Promise<AssetDetailSummaryResponseDto>
   */
  async getAssetDetailSummary(portfolioId: string): Promise<AssetDetailSummaryResponseDto> {
    // Get portfolio details
    const portfolio = await this.portfolioRepository.findByIdWithAssets(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }

    // Use PortfolioCalculationService to get consistent positions and calculations
    const calculation = await this.portfolioCalculationService.calculatePortfolioValues(
      portfolioId,
      parseFloat(portfolio.cashBalance.toString()),
    );

    // Get asset names and types from database
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
        symbol: position.symbol,
        name: (assetInfo as any).name,
        assetType: (assetInfo as any).assetType,
        quantity: position.quantity,
        currentPrice: currentPrice,
        totalValue: position.currentValue,
        percentage: percentage,
        unrealizedPl: position.unrealizedPl,
        unrealizedPlPercentage: unrealizedPlPercentage,
      };
    });

    return {
      portfolioId: portfolioId,
      totalValue: portfolioTotalValue,
      data: assetDetails,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate asset allocation timeline for a portfolio.
   * @param portfolioId - Portfolio ID
   * @param months - Number of months to look back (default: 12)
   * @returns Promise<AllocationTimelineResponse>
   */
  async calculateAllocationTimeline(
    portfolioId: string,
    months: number = 12,
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
      const cacheKey = `allocation-timeline:${portfolioId}:${months}`;
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
      
      // Try to get from cache first
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

      // Get portfolio details
      const portfolio = await this.portfolioRepository.findByIdWithAssets(portfolioId);
      if (!portfolio) {
        throw new Error(`Portfolio with ID ${portfolioId} not found`);
      }

      // Get current asset positions using PortfolioCalculationService
      const calculation = await this.portfolioCalculationService.calculatePortfolioValues(
        portfolioId,
        parseFloat(portfolio.cashBalance.toString()),
      );

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
      startDate.setMonth(startDate.getMonth() - months);
      
      const trades = allTrades.filter(trade => {
        const tradeDate = new Date(trade.tradeDate);
        return tradeDate >= startDate && tradeDate <= endDate;
      });

      // Group trades by month and calculate allocation for each month
      const timelineData = [];
      const monthlyData = new Map<string, Map<string, { quantity: number; value: number }>>();

      // Initialize monthly data structure
      for (let i = months - 1; i >= 0; i--) {
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
        for (let i = months - 1; i >= 0; i--) {
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
      for (let i = months - 1; i >= 0; i--) {
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

      // Cache the result
      await this.cacheManager.set(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Error in calculateAllocationTimeline service:', error);
      throw error;
    }
  }
}

