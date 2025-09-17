import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
import { NavSnapshot } from '../entities/nav-snapshot.entity';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { PortfolioCalculationService } from './portfolio-calculation.service';

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
}
