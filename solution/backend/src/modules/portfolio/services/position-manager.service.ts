import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
import { PortfolioCalculationService } from './portfolio-calculation.service';

/**
 * Service class for managing portfolio positions.
 * Handles position updates, P&L calculations, and position aggregation.
 */
@Injectable()
export class PositionManagerService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    private readonly portfolioCalculationService: PortfolioCalculationService,
  ) {}

  /**
   * Get current positions for a portfolio
   * @param portfolioId Portfolio ID
   * @returns Current positions
   */
  async getCurrentPositions(portfolioId: string): Promise<any[]> {
    try {
      // Get portfolio to get current cash balance
      const portfolio = await this.portfolioRepository.findOne({
        where: { portfolioId }
      });

      if (!portfolio) {
        return [];
      }

      // Use PortfolioCalculationService to calculate positions
      const calculation = await this.portfolioCalculationService.calculatePortfolioAssetValues(portfolioId);

      return calculation.assetPositions || [];
    } catch (error) {
      console.error('Error getting current positions:', error);
      return [];
    }
  }

  /**
   * Get position aggregation for a portfolio
   * @param portfolioId Portfolio ID
   * @returns Position aggregation data
   */
  async getPositionAggregation(portfolioId: string): Promise<any> {
    try {
      // Get portfolio to get current cash balance
      const portfolio = await this.portfolioRepository.findOne({
        where: { portfolioId }
      });

      if (!portfolio) {
        return {
          totalValue: 0,
          totalCost: 0,
          totalUnrealizedPl: 0,
          totalRealizedPl: 0,
          positionCount: 0,
        };
      }

      // Use PortfolioCalculationService to calculate positions
      const calculation = await this.portfolioCalculationService.calculatePortfolioAssetValues(portfolioId);

      const positions = calculation.assetPositions || [];
      
      return {
        totalValue: positions.reduce((sum, pos) => sum + pos.currentValue, 0),
        totalCost: positions.reduce((sum, pos) => sum + (pos.avgCost * pos.quantity), 0),
        totalUnrealizedPl: positions.reduce((sum, pos) => sum + pos.unrealizedPl, 0),
        totalRealizedPl: calculation.realizedPl || 0,
        positionCount: positions.length,
      };
    } catch (error) {
      console.error('Error getting position aggregation:', error);
      return {
        totalValue: 0,
        totalCost: 0,
        totalUnrealizedPl: 0,
        totalRealizedPl: 0,
        positionCount: 0,
      };
    }
  }
}