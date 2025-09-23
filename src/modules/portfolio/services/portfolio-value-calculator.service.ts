import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
import { AssetValueCalculatorService, AssetPosition } from '../../asset/services/asset-value-calculator.service';
import { PortfolioCalculationService } from './portfolio-calculation.service';

/**
 * Service for calculating portfolio values real-time.
 * Handles totalValue, realizedPL, and unrealizedPL calculations.
 */
@Injectable()
export class PortfolioValueCalculatorService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    private readonly assetValueCalculator: AssetValueCalculatorService,
    private readonly portfolioCalculationService: PortfolioCalculationService,
  ) {}

  /**
   * Calculate total portfolio value real-time (cash + assets for NAV)
   * @param portfolioId - Portfolio ID
   * @returns Total portfolio value (NAV)
   */
  async calculateTotalValue(portfolioId: string): Promise<number> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: portfolioId }
    });
    
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }

    // Get cash balance
    const cashBalance = parseFloat(portfolio.cashBalance.toString());

    // Get asset positions with current prices
    const positions = await this.getAssetPositions(portfolioId);

    // Calculate total asset value
    const totalAssetValue = this.assetValueCalculator.calculateTotalCurrentValue(positions);

    // NAV = cash balance + asset positions value
    return cashBalance + totalAssetValue;
  }

  /**
   * Calculate total asset value only (excluding cash)
   * @param portfolioId - Portfolio ID
   * @returns Total asset value
   */
  async calculateAssetValue(portfolioId: string): Promise<number> {
    const positions = await this.getAssetPositions(portfolioId);
    return this.assetValueCalculator.calculateTotalCurrentValue(positions);
  }

  /**
   * Calculate realized P&L real-time
   * @param portfolioId - Portfolio ID
   * @returns Realized P&L
   */
  async calculateRealizedPL(portfolioId: string): Promise<number> {
    try {
      const result = await this.portfolioRepository.manager.query(`
        SELECT COALESCE(SUM(td.pnl), 0) as "totalRealizedPl"
        FROM trade_details td
        INNER JOIN trades t ON td.sell_trade_id = t.trade_id
        WHERE t.portfolio_id = $1 AND t.side = 'SELL'
      `, [portfolioId]);

      const rawValue = result?.[0]?.totalRealizedPl || 0;
      const realizedPl = parseFloat(String(rawValue));
      
      return realizedPl;
    } catch (error) {
      console.error(`Error calculating realized PL for portfolio ${portfolioId}:`, error);
      return 0;
    }
  }

  /**
   * Calculate unrealized P&L real-time
   * @param portfolioId - Portfolio ID
   * @returns Unrealized P&L
   */
  async calculateUnrealizedPL(portfolioId: string): Promise<number> {
    const positions = await this.getAssetPositions(portfolioId);
    
    return this.assetValueCalculator.calculateTotalUnrealizedPL(positions);
  }

  /**
   * Calculate all portfolio values at once (optimized)
   * @param portfolioId - Portfolio ID
   * @returns Object with all calculated values
   */
  async calculateAllValues(portfolioId: string): Promise<{
    totalValue: number;
    realizedPl: number;
    unrealizedPl: number;
    cashBalance: number;
  }> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: portfolioId }
    });
    
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }

    const cashBalance = parseFloat(portfolio.cashBalance.toString());
    const positions = await this.getAssetPositions(portfolioId);

    // Calculate all values in parallel
    const [totalAssetValue, realizedPl] = await Promise.all([
      Promise.resolve(this.assetValueCalculator.calculateTotalCurrentValue(positions)),
      this.calculateRealizedPL(portfolioId),
    ]);

    const unrealizedPl = this.assetValueCalculator.calculateTotalUnrealizedPL(positions);

    return {
      totalValue: cashBalance + totalAssetValue, // NAV = cash + assets
      realizedPl: realizedPl,
      unrealizedPl: unrealizedPl,
      cashBalance: cashBalance,
    };
  }

  /**
   * Get asset positions with current prices from global assets
   * @param portfolioId - Portfolio ID
   * @returns Array of asset positions
   */
  private async getAssetPositions(portfolioId: string): Promise<AssetPosition[]> {
    try {
      // Use the existing logic from PortfolioCalculationService
      const result = await this.portfolioCalculationService.calculatePortfolioValues(
        portfolioId,
        0 // We don't need cash balance here as we'll get it separately
      );

      // Transform to AssetPosition format
      return result.assetPositions.map(pos => ({
        quantity: pos.quantity,
        price: pos.currentValue / pos.quantity, // Calculate price from value
        avgCost: pos.avgCost,
        // Future: Add tax, fee, discount here based on asset type or configuration
      }));
    } catch (error) {
      console.error(`Error getting asset positions for portfolio ${portfolioId}:`, error);
      return [];
    }
  }

  /**
   * Calculate portfolio performance metrics
   * @param portfolioId - Portfolio ID
   * @returns Performance metrics
   */
  async calculatePerformanceMetrics(portfolioId: string): Promise<{
    totalReturn: number;
    totalReturnPercentage: number;
    realizedReturn: number;
    realizedReturnPercentage: number;
    unrealizedReturn: number;
    unrealizedReturnPercentage: number;
  }> {
    const values = await this.calculateAllValues(portfolioId);
    
    // Calculate total return
    const totalReturn = values.realizedPl + values.unrealizedPl;
    
    // Calculate return percentage (assuming initial investment = totalValue - totalReturn)
    const initialInvestment = values.totalValue - totalReturn;
    const totalReturnPercentage = initialInvestment > 0 ? (totalReturn / initialInvestment) * 100 : 0;
    
    // Calculate realized return percentage
    const realizedReturnPercentage = initialInvestment > 0 ? (values.realizedPl / initialInvestment) * 100 : 0;
    
    // Calculate unrealized return percentage
    const unrealizedReturnPercentage = initialInvestment > 0 ? (values.unrealizedPl / initialInvestment) * 100 : 0;

    return {
      totalReturn: totalReturn,
      totalReturnPercentage: totalReturnPercentage,
      realizedReturn: values.realizedPl,
      realizedReturnPercentage: realizedReturnPercentage,
      unrealizedReturn: values.unrealizedPl,
      unrealizedReturnPercentage: unrealizedReturnPercentage,
    };
  }
}
