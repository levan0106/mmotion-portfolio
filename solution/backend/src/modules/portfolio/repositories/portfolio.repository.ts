import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { NavSnapshot } from '../entities/nav-snapshot.entity';

/**
 * Repository class for Portfolio entity operations.
 * Provides custom query methods for portfolio analytics and data retrieval.
 */
@Injectable()
export class PortfolioRepository extends Repository<Portfolio> {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
  ) {
    super(
      portfolioRepository.target,
      portfolioRepository.manager,
      portfolioRepository.queryRunner,
    );
  }

  /**
   * Find portfolio by ID with all related assets.
   * @param portfolioId - The portfolio ID to search for
   * @returns Promise<Portfolio | null>
   */
  async findByIdWithAssets(portfolioId: string): Promise<Portfolio | null> {
    return this.portfolioRepository.findOne({
      where: { portfolioId: portfolioId },
      // PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
    });
  }

  /**
   * Find all portfolios belonging to a specific account.
   * @param accountId - The account ID to search for
   * @returns Promise<Portfolio[]>
   */
  async findByAccountId(accountId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({
      where: { accountId: accountId },
      // PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find portfolio with NAV history.
   * @param portfolioId - The portfolio ID to search for
   * @param limit - Maximum number of NAV snapshots to return
   * @returns Promise<Portfolio | null>
   */
  async findWithNavHistory(
    portfolioId: string,
    limit: number = 30,
  ): Promise<Portfolio | null> {
    return this.portfolioRepository.findOne({
      where: { portfolioId: portfolioId },
      relations: ['navSnapshots'],
      order: {
        navSnapshots: { navDate: 'DESC' },
      },
    });
  }

  /**
   * Get portfolio analytics data including total value and performance.
   * @param portfolioId - The portfolio ID to analyze
   * @returns Promise<object>
   */
  async getPortfolioAnalytics(portfolioId: string): Promise<{
    totalValue: number;
    cashBalance: number;
    unrealizedPL: number;
    realizedPL: number;
    assetCount: number;
  }> {
    const result = await this.portfolioRepository
      .createQueryBuilder('portfolio')
      // PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
      .select([
        'portfolio.totalValue',
        'portfolio.cashBalance',
        'portfolio.unrealizedPl',
        'portfolio.realizedPl',
        '0 as assetCount',
      ])
      .where('portfolio.portfolioId = :portfolioId', { portfolioId })
      .getRawOne();

    return {
      totalValue: parseFloat(result.portfolio_totalValue) || 0,
      cashBalance: parseFloat(result.portfolio_cashBalance) || 0,
      unrealizedPL: parseFloat(result.portfolio_unrealizedPl) || 0,
      realizedPL: parseFloat(result.portfolio_realizedPl) || 0,
      assetCount: parseInt(result.assetCount) || 0,
    };
  }

  /**
   * Get portfolio performance over a date range.
   * @param portfolioId - The portfolio ID to analyze
   * @param startDate - Start date for performance calculation
   * @param endDate - End date for performance calculation
   * @returns Promise<NavSnapshot[]>
   */
  async getPerformanceHistory(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<NavSnapshot[]> {
    return this.portfolioRepository.manager
      .getRepository(NavSnapshot)
      .createQueryBuilder('nav')
      .where('nav.portfolioId = :portfolioId', { portfolioId })
      .andWhere('nav.nav_date >= :startDate', { startDate })
      .andWhere('nav.nav_date <= :endDate', { endDate })
      .orderBy('nav.nav_date', 'ASC')
      .getMany();
  }

  /**
   * Get asset allocation summary for a portfolio.
   * @param portfolioId - The portfolio ID to analyze
   * @returns Promise<Array<{assetType: string, totalValue: number, percentage: number}>>
   */
  async getAssetAllocation(portfolioId: string): Promise<
    Array<{
      assetType: string;
      totalValue: number;
      percentage: number;
    }>
  > {
    // Use raw query for better control
    const query = `
      SELECT 
        asset.type as "assetType",
        SUM(CASE WHEN trade.side = 'BUY' THEN trade.quantity ELSE -trade.quantity END) as "totalQuantity",
        COALESCE(ap.current_price, 0) as "currentPrice",
        asset.name as "assetName",
        asset.symbol as "assetSymbol"
      FROM portfolios portfolio 
      LEFT JOIN trades trade ON portfolio.portfolio_id = trade.portfolio_id 
      LEFT JOIN assets asset ON trade.asset_id = asset.id 
      LEFT JOIN global_assets ga ON asset.symbol = ga.symbol
      LEFT JOIN asset_prices ap ON ga.id = ap.asset_id
      WHERE portfolio.portfolio_id = $1 
      GROUP BY asset.type, ap.current_price, asset.name, asset.symbol 
      HAVING SUM(CASE WHEN trade.side = 'BUY' THEN trade.quantity ELSE -trade.quantity END) > 0
    `;

    const positions = await this.portfolioRepository.query(query, [portfolioId]);
    console.log('Raw positions from query:', JSON.stringify(positions, null, 2));

    // Calculate total portfolio value from assets
    const assetTotalValue = positions.reduce((sum, position) => {
      const quantity = parseFloat(position.totalQuantity) || 0;
      const price = parseFloat(position.currentPrice) || 0;
      return sum + (quantity * price);
    }, 0);

    // Calculate allocation percentages for assets
    const assetAllocation = positions.map(position => {
      const quantity = parseFloat(position.totalQuantity) || 0;
      const price = parseFloat(position.currentPrice) || 0;
      const positionValue = quantity * price;
      const percentage = assetTotalValue > 0 ? (positionValue / assetTotalValue) * 100 : 0;

      return {
        assetType: position.assetType || 'UNKNOWN',
        totalValue: positionValue,
        percentage: percentage,
      };
    });

    // Group by asset type and sum values
    const groupedAssetAllocation = assetAllocation.reduce((acc, item) => {
      if (!item.assetType) return acc; // Skip items without assetType
      const existing = acc.find(a => a.assetType === item.assetType);
      if (existing) {
        existing.totalValue += item.totalValue;
        existing.percentage += item.percentage;
      } else {
        acc.push(item);
      }
      return acc;
    }, []);

    // Get deposits data using the same logic as calculateAccruedInterest()
    const depositsQuery = `
      SELECT 
        principal,
        interest_rate,
        start_date,
        end_date,
        status,
        actual_interest
      FROM deposits 
      WHERE portfolio_id = $1
    `;

    const depositsResult = await this.portfolioRepository.query(depositsQuery, [portfolioId]);
    
    let totalDepositValue = 0;
    for (const deposit of depositsResult) {
      const principal = parseFloat(deposit.principal) || 0;
      let interest = 0;
      
      if (deposit.status === 'SETTLED') {
        interest = parseFloat(deposit.actual_interest) || 0;
        // Don't add to totalDepositValue for settled deposits
      } else {
        // Use same logic as calculateAccruedInterest()
        const currentDate = new Date();
        const startDate = new Date(deposit.start_date);
        const endDate = new Date(deposit.end_date);
        
        if (currentDate >= startDate) {
          const calculationDate = currentDate > endDate ? endDate : currentDate;
          const timeDiff = calculationDate.getTime() - startDate.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          const interestRate = parseFloat(deposit.interest_rate) || 0;
          interest = (principal * interestRate * daysDiff) / (100 * 365);
          interest = Math.round(interest * 100) / 100;
        }
        // Only add to totalDepositValue for active deposits
        totalDepositValue += principal + interest;
      }
    }
    
    // Calculate total portfolio value including deposits
    const totalPortfolioValue = assetTotalValue + totalDepositValue;

    // Recalculate asset percentages based on total portfolio value (including deposits)
    if (totalPortfolioValue > 0) {
      groupedAssetAllocation.forEach(item => {
        item.percentage = (item.totalValue / totalPortfolioValue) * 100;
      });
    }

    // Add deposits as a special asset type
    const finalAllocation = [...groupedAssetAllocation];
    
    if (totalDepositValue > 0) {
      finalAllocation.push({
        assetType: 'DEPOSITS',
        totalValue: totalDepositValue,
        percentage: totalPortfolioValue > 0 ? (totalDepositValue / totalPortfolioValue) * 100 : 0,
      });
    }

    return finalAllocation;
  }

  /**
   * Get portfolios with their current positions.
   * Note: Positions are now calculated through trades, not portfolioAssets.
   * @param accountId - The account ID to search for
   * @returns Promise<Portfolio[]>
   */
  async findWithCurrentPositions(accountId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({
      where: { accountId: accountId },
      relations: [
        'trades',
        'trades.asset',
      ],
      order: {
        updatedAt: 'DESC',
      },
    });
  }
}
