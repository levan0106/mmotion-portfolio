import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Portfolio } from '../entities/portfolio.entity';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { CreatePortfolioDto } from '../dto/create-portfolio.dto';
import { UpdatePortfolioDto } from '../dto/update-portfolio.dto';
import { Account } from '../../shared/entities/account.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { Asset } from '../../asset/entities/asset.entity';
import { PortfolioCalculationService } from './portfolio-calculation.service';
import { PortfolioValueCalculatorService } from './portfolio-value-calculator.service';
import { CashFlowService } from './cash-flow.service';

/**
 * Service class for Portfolio business logic.
 * Handles portfolio CRUD operations, value calculations, and caching.
 */
@Injectable()
export class PortfolioService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    @InjectRepository(Portfolio)
    private readonly portfolioEntityRepository: Repository<Portfolio>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    // PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly portfolioCalculationService: PortfolioCalculationService,
    private readonly portfolioValueCalculator: PortfolioValueCalculatorService,
    private readonly cashFlowService: CashFlowService,
  ) {}

  /**
   * Create a new portfolio.
   * @param createPortfolioDto - Portfolio creation data
   * @returns Promise<Portfolio>
   */
  async createPortfolio(createPortfolioDto: CreatePortfolioDto): Promise<Portfolio> {
    const { name, baseCurrency, accountId, cashBalance = 0 } = createPortfolioDto;

    // Validate account exists
    const account = await this.accountRepository.findOne({
      where: { accountId: accountId },
    });

    if (!account) {
      throw new NotFoundException(
        `Account with ID "${accountId}" not found`,
      );
    }

    // Check if portfolio with same name already exists for this account
    const existingPortfolio = await this.portfolioRepository.findOne({
      where: { accountId: accountId, name },
    });

    if (existingPortfolio) {
      throw new BadRequestException(
        `Portfolio with name "${name}" already exists for this account`,
      );
    }

    const portfolio = this.portfolioEntityRepository.create({
      name,
      baseCurrency,
      accountId,
      totalValue: cashBalance,
      cashBalance: cashBalance,
      unrealizedPl: 0,
      realizedPl: 0,
    });

    const savedPortfolio = await this.portfolioEntityRepository.save(portfolio);
    
    // Clear cache for account
    await this.clearAccountCache(accountId);
    
    return savedPortfolio;
  }

  /**
   * Get portfolio details with current values.
   * @param portfolioId - Portfolio ID
   * @returns Promise<Portfolio>
   */
  async getPortfolioDetails(portfolioId: string): Promise<Portfolio> {
    const cacheKey = `portfolio:${portfolioId}`;
    
    // Try to get from cache first
    const cachedPortfolio = await this.cacheManager.get<Portfolio>(cacheKey);
    if (cachedPortfolio) {
      return cachedPortfolio;
    }

    const portfolio = await this.portfolioRepository.findByIdWithAssets(portfolioId);
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Calculate values real-time using new calculator
    try {
      const calculatedValues = await this.portfolioValueCalculator.calculateAllValues(portfolioId);
      const assetValue = await this.portfolioValueCalculator.calculateAssetValue(portfolioId);
      
      // Override DB values with real-time calculations
      portfolio.totalValue = assetValue; // Only asset value for Total Portfolio Value
      portfolio.realizedPl = calculatedValues.realizedPl;
      portfolio.unrealizedPl = calculatedValues.unrealizedPl;
    } catch (error) {
      console.error(`Error calculating real-time values for portfolio ${portfolioId}:`, error);
      // Fallback to old calculation method
      await this.calculatePortfolioValue(portfolio);
    }

    // Cache the result
    await this.cacheManager.set(cacheKey, portfolio, this.CACHE_TTL);

    return portfolio;
  }

  /**
   * Update portfolio information.
   * @param portfolioId - Portfolio ID
   * @param updatePortfolioDto - Update data
   * @returns Promise<Portfolio>
   */
  async updatePortfolio(
    portfolioId: string,
    updatePortfolioDto: UpdatePortfolioDto,
  ): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Update portfolio fields
    Object.assign(portfolio, updatePortfolioDto);
    const updatedPortfolio = await this.portfolioEntityRepository.save(portfolio);

    // Clear cache
    await this.clearPortfolioCache(portfolioId);
    await this.clearAccountCache(portfolio.accountId);

    return updatedPortfolio;
  }

  /**
   * Delete a portfolio and all related data.
   * @param portfolioId - Portfolio ID
   * @returns Promise<void>
   */
  async deletePortfolio(portfolioId: string): Promise<void> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Delete portfolio (cascade will handle related data)
    await this.portfolioEntityRepository.remove(portfolio);

    // Clear cache
    await this.clearPortfolioCache(portfolioId);
    await this.clearAccountCache(portfolio.accountId);
  }

  /**
   * Get all portfolios for an account.
   * @param accountId - Account ID
   * @returns Promise<Portfolio[]>
   */
  async getPortfoliosByAccount(accountId: string): Promise<Portfolio[]> {
    const cacheKey = `portfolios:account:${accountId}`;
    
    // Try to get from cache first
    const cachedPortfolios = await this.cacheManager.get<Portfolio[]>(cacheKey);
    if (cachedPortfolios) {
      return cachedPortfolios;
    }

    const portfolios = await this.portfolioRepository.findByAccountId(accountId);
    
    // Cache the result
    await this.cacheManager.set(cacheKey, portfolios, this.CACHE_TTL);

    return portfolios;
  }

  /**
   * Calculate current portfolio value based on market prices.
   * @param portfolio - Portfolio entity
   * @returns Promise<void>
   */
  async calculatePortfolioValue(portfolio: Portfolio): Promise<void> {
    try {
      // First, recalculate cash balance from all cash flows to ensure accuracy
      await this.cashFlowService.recalculateCashBalanceFromAllFlows(portfolio.portfolioId);
      
      // Get updated portfolio with correct cash balance
      const updatedPortfolio = await this.portfolioEntityRepository.findOne({
        where: { portfolioId: portfolio.portfolioId }
      });
      
      if (!updatedPortfolio) {
        throw new Error('Portfolio not found after cash balance recalculation');
      }

      // Calculate portfolio values from trades with correct cash balance
      const calculation = await this.portfolioCalculationService.calculatePortfolioValues(
        portfolio.portfolioId,
        parseFloat(updatedPortfolio.cashBalance.toString()),
      );

      // Update portfolio with calculated values
      portfolio.totalValue = calculation.totalValue;
      portfolio.unrealizedPl = calculation.unrealizedPl;
      portfolio.realizedPl = calculation.realizedPl;
      portfolio.cashBalance = updatedPortfolio.cashBalance; // Update with correct cash balance

      // Save updated values to database
      await this.portfolioEntityRepository.save(portfolio);
    } catch (error) {
      console.error('Error calculating portfolio value:', error);
      // Fallback to cash balance if calculation fails
      portfolio.totalValue = parseFloat(portfolio.cashBalance.toString());
      portfolio.unrealizedPl = 0;
      portfolio.realizedPl = 0;
    }
  }

  /**
   * Calculate and update portfolio realized P&L from all trades.
   * @param portfolioId - Portfolio ID
   * @returns Promise<number> Total realized P&L
   */
  async updatePortfolioRealizedPL(portfolioId: string): Promise<number> {
    // Get total realized P&L from trade details for all sell trades in this portfolio
    const result = await this.portfolioRepository.manager.query(`
      SELECT COALESCE(SUM(td.pnl), 0) as totalRealizedPl
      FROM trade_details td
      INNER JOIN trades t ON td.sell_trade_id = t.trade_id
      WHERE t.portfolio_id = $1 AND t.side = 'SELL'
    `, [portfolioId]);

    const totalRealizedPL = parseFloat((result[0]?.totalRealizedPl || 0).toString());

    // Update portfolio realized P&L
    await this.portfolioRepository.manager.query(`
      UPDATE portfolios 
      SET realized_pl = $1, updated_at = NOW()
      WHERE portfolio_id = $2
    `, [totalRealizedPL, portfolioId]);

    return totalRealizedPL;
  }

  /**
   * Get asset allocation for a portfolio.
   * @param portfolioId - Portfolio ID
   * @returns Promise<Array<{assetType: string, totalValue: number, percentage: number}>>
   */
  async getAssetAllocation(portfolioId: string): Promise<
    Array<{
      assetType: string;
      totalValue: number;
      percentage: number;
    }>
  > {
    try {
      const cacheKey = `allocation:${portfolioId}`;
      
      // Try to get from cache first
      const cachedAllocation = await this.cacheManager.get(cacheKey);
      if (cachedAllocation) {
        return cachedAllocation as Array<{
          assetType: string;
          totalValue: number;
          percentage: number;
        }>;
      }

      const allocation = await this.portfolioRepository.getAssetAllocation(portfolioId);
      
      // Cache the result
      await this.cacheManager.set(cacheKey, allocation, this.CACHE_TTL);

      return allocation;
    } catch (error) {
      console.error('Error in getAssetAllocation service:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics for a portfolio.
   * @param portfolioId - Portfolio ID
   * @returns Promise<object>
   */
  async getPerformanceMetrics(portfolioId: string): Promise<{
    totalValue: number;
    cashBalance: number;
    unrealizedPL: number;
    realizedPL: number;
    assetCount: number;
  }> {
    const cacheKey = `metrics:${portfolioId}`;
    
    // Try to get from cache first
    const cachedMetrics = await this.cacheManager.get(cacheKey);
    if (cachedMetrics) {
      return cachedMetrics as {
        totalValue: number;
        cashBalance: number;
        unrealizedPL: number;
        realizedPL: number;
        assetCount: number;
      };
    }

    const metrics = await this.portfolioRepository.getPortfolioAnalytics(portfolioId);
    
    // Cache the result
    await this.cacheManager.set(cacheKey, metrics, this.CACHE_TTL);

    return metrics;
  }

  /**
   * Clear portfolio cache.
   * @param portfolioId - Portfolio ID
   */
  private async clearPortfolioCache(portfolioId: string): Promise<void> {
    const keys = [
      `portfolio:${portfolioId}`,
      `allocation:${portfolioId}`,
      `metrics:${portfolioId}`,
    ];
    
    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }

  /**
   * Clear account cache.
   * @param accountId - Account ID
   */
  private async clearAccountCache(accountId: string): Promise<void> {
    const key = `portfolios:account:${accountId}`;
    await this.cacheManager.del(key);
  }

  /**
   * Add an asset to a portfolio.
   * @param portfolioId - Portfolio ID
   * @param assetId - Asset ID
   * @param quantity - Quantity to add
   * @param avgCost - Average cost per unit
   * @returns Promise<any>
   */
  async addAssetToPortfolio(
    portfolioId: string,
    assetId: string,
    quantity: number,
    avgCost: number,
  ): Promise<any> {
    // Validate portfolio exists
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: portfolioId },
    });
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Validate asset exists
    const asset = await this.assetRepository.findOne({
      where: { id: assetId },
    });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    // PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
    // This method is no longer needed
    return null;

    /*
    if (existingPortfolioAsset) {
      // Update existing position
      const newQuantity = parseFloat(existingPortfolioAsset.quantity.toString()) + quantity;
      const newAvgCost = 
        (parseFloat(existingPortfolioAsset.quantity.toString()) * parseFloat(existingPortfolioAsset.avgCost.toString()) + 
         quantity * avgCost) / newQuantity;

      existingPortfolioAsset.quantity = newQuantity;
      existingPortfolioAsset.avgCost = newAvgCost;
      existingPortfolioAsset.marketValue = newQuantity * parseFloat(asset.currentValue?.toString() || asset.initialValue.toString());
      existingPortfolioAsset.unrealizedPl = existingPortfolioAsset.marketValue - (newQuantity * newAvgCost);

      const updatedPortfolioAsset = await this.portfolioAssetRepository.save(existingPortfolioAsset);
      
      // Clear cache
      await this.clearPortfolioCache(portfolioId);
      
      return updatedPortfolioAsset;
    } else {
      // Create new position
      const marketValue = quantity * parseFloat(asset.currentValue?.toString() || asset.initialValue.toString());
      const unrealizedPL = marketValue - (quantity * avgCost);

      const portfolioAsset = this.portfolioAssetRepository.create({
        portfolioId: portfolioId,
        assetId: assetId,
        quantity,
        avgCost: avgCost,
        marketValue: marketValue,
        unrealizedPl: unrealizedPL,
      });

      const savedPortfolioAsset = await this.portfolioAssetRepository.save(portfolioAsset);
      
      // Clear cache
      await this.clearPortfolioCache(portfolioId);
      
      return savedPortfolioAsset;
    }
    */
  }

  /**
   * Remove an asset from a portfolio.
   * @param portfolioId - Portfolio ID
   * @param assetId - Asset ID
   * @returns Promise<void>
   */
  async removeAssetFromPortfolio(portfolioId: string, assetId: string): Promise<void> {
    // Validate portfolio exists
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: portfolioId },
    });
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
    // This method is no longer needed
    return;
  }

  /**
   * Update asset position in portfolio.
   * @param portfolioId - Portfolio ID
   * @param assetId - Asset ID
   * @param quantity - New quantity
   * @param avgCost - New average cost
   * @returns Promise<PortfolioAsset>
   */
  async updateAssetInPortfolio(
    portfolioId: string,
    assetId: string,
    quantity: number,
    avgCost: number,
  ): Promise<any> {
    // Validate portfolio exists
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: portfolioId },
    });
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
    // This method is no longer needed
    return null;
  }

  /**
   * Get all assets in a portfolio.
   * @param portfolioId - Portfolio ID
   * @returns Promise<any[]>
   */
  async getPortfolioAssets(portfolioId: string): Promise<any[]> {
    // Validate portfolio exists
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: portfolioId },
    });
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
    // This method is no longer needed
    return [];
  }

  /**
   * Get available assets that can be added to portfolio.
   * @param userId - User ID
   * @param searchTerm - Optional search term
   * @returns Promise<Asset[]>
   */
  async getAvailableAssets(userId: string, searchTerm?: string): Promise<Asset[]> {
    let query = this.assetRepository.createQueryBuilder('asset')
      .where('asset.createdBy = :userId', { userId });

    if (searchTerm) {
      query = query.andWhere(
        '(asset.name ILIKE :searchTerm OR asset.symbol ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      );
    }

    return await query.getMany();
  }
}
