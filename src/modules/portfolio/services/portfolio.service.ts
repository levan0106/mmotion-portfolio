import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
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
import { DepositRepository } from '../repositories/deposit.repository';
import { NavUtilsService } from './nav-utils.service';

/**
 * Service class for Portfolio business logic.
 * Handles portfolio CRUD operations, value calculations, and caching.
 */
@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_ENABLED = process.env.CACHE_ENABLED === 'true';

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
    private readonly depositRepository: DepositRepository,
    private readonly navUtilsService: NavUtilsService,
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
    
    
    // Try to get from cache first (if enabled)
    if (this.CACHE_ENABLED) {
      const cachedPortfolio = await this.cacheManager.get<Portfolio>(cacheKey);
      if (cachedPortfolio) {
        return cachedPortfolio;
      }
    }

    const portfolio = await this.portfolioRepository.findByIdWithAssets(portfolioId);
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Calculate values real-time using new calculator
    try {
      const calculatedValues = await this.portfolioValueCalculator.calculateAllValues(portfolioId);
      const assetValue = await this.portfolioValueCalculator.calculateAssetValue(portfolioId);
      
      // Calculate correct cash balance from cash flows
      const correctCashBalance = await this.cashFlowService.getCashBalance(portfolioId);
      
      // Calculate new portfolio fields
      const newFields = await this.calculateNewPortfolioFields(portfolioId);
      
      // Get NAV per unit for funds (DB-first with fallback calculation)
      if (portfolio.isFund && portfolio.totalOutstandingUnits > 0) {
        const outstandingUnits = typeof portfolio.totalOutstandingUnits === 'string' 
          ? parseFloat(portfolio.totalOutstandingUnits) 
          : portfolio.totalOutstandingUnits;
        
        // Check if DB value is valid and not stale
        const isNavPerUnitValid = this.navUtilsService.isNavPerUnitValid(portfolio.navPerUnit);
        const isNavPerUnitStale = this.navUtilsService.isNavPerUnitStale(portfolio.lastNavDate);
        
        if (isNavPerUnitValid && !isNavPerUnitStale) {
          // Use DB value (already set)
          this.logger.debug(`Using DB navPerUnit: ${portfolio.navPerUnit} for portfolio ${portfolioId} (lastNavDate: ${portfolio.lastNavDate})`);
        } else {
          // Fallback to real-time calculation
          portfolio.navPerUnit = newFields.totalAllValue / outstandingUnits;
          const reason = !isNavPerUnitValid ? 'DB value is zero' : 'DB value is stale';
          this.logger.debug(`Calculated real-time navPerUnit: ${portfolio.navPerUnit} for portfolio ${portfolioId} (reason: ${reason}, lastNavDate: ${portfolio.lastNavDate})`);
        }
      }
      
      // Override DB values with real-time calculations
      portfolio.totalValue = assetValue; // Keep old field for backward compatibility
      portfolio.realizedPl = calculatedValues.realizedPl; // Keep old field for backward compatibility
      portfolio.unrealizedPl = calculatedValues.unrealizedPl; // Keep old field for backward compatibility
      portfolio.cashBalance = correctCashBalance; // Use calculated cash balance
      
      // Set new fields
      portfolio.totalAssetValue = newFields.totalAssetValue;
      portfolio.totalInvestValue = newFields.totalInvestValue;
      portfolio.totalAllValue = newFields.totalAllValue;
      portfolio.realizedAssetPnL = newFields.realizedAssetPnL;
      portfolio.realizedInvestPnL = newFields.realizedInvestPnL;
      portfolio.realizedAllPnL = newFields.realizedAllPnL;
      portfolio.unrealizedAssetPnL = newFields.unrealizedAssetPnL;
      portfolio.unrealizedInvestPnL = newFields.unrealizedInvestPnL;
      portfolio.unrealizedAllPnL = newFields.unrealizedAllPnL;
    } catch (error) {
      console.error(`Error calculating real-time values for portfolio ${portfolioId}:`, error);
      // Fallback to old calculation method
      await this.calculatePortfolioValue(portfolio);
    }

    // Cache the result (if enabled)
    if (this.CACHE_ENABLED) {
      await this.cacheManager.set(cacheKey, portfolio, this.CACHE_TTL);
    }

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
   * Get all portfolios for an account with real-time P&L calculation.
   * @param accountId - Account ID
   * @returns Promise<Portfolio[]>
   */
  async getPortfoliosByAccount(accountId: string): Promise<Portfolio[]> {
    const cacheKey = `portfolios:account:${accountId}`;
    
    // Try to get from cache first (if enabled)
    if (this.CACHE_ENABLED) {
      const cachedPortfolios = await this.cacheManager.get<Portfolio[]>(cacheKey);
      if (cachedPortfolios) {
        return cachedPortfolios;
      }
    }

    const portfolios = await this.portfolioRepository.findByAccountId(accountId);
    
    // Calculate real-time P&L for each portfolio using PortfolioCalculationService
    const portfoliosWithRealTimePL = await Promise.all(
      portfolios.map(async (portfolio) => {
        try {
          // Calculate correct cash balance from cash flows
          const correctCashBalance = await this.cashFlowService.getCashBalance(portfolio.portfolioId);
          
          // Use PortfolioCalculationService to get real-time calculations
          const calculation = await this.portfolioCalculationService.calculatePortfolioAssetValues(
            portfolio.portfolioId
          );

          // Calculate total unrealized P&L from all asset positions
          const totalUnrealizedPL = calculation.assetPositions.reduce(
            (sum, position) => sum + position.unrealizedPl,
            0
          );

          // Calculate total realized P&L from trade details
          const totalRealizedPL = await this.portfolioValueCalculator.calculateRealizedPL(portfolio.portfolioId);

          // Calculate total value (cash + assets)
          const totalAssetValue = calculation.assetPositions.reduce(
            (sum, position) => sum + position.currentValue,
            0
          );
          const totalValue = correctCashBalance + totalAssetValue;

          // Calculate new portfolio fields
          const newFields = await this.calculateNewPortfolioFields(portfolio.portfolioId);

          // Get NAV per unit for funds (DB-first with fallback calculation)
          let navPerUnit = portfolio.navPerUnit || 0;
          if (portfolio.isFund && portfolio.totalOutstandingUnits > 0) {
            const outstandingUnits = typeof portfolio.totalOutstandingUnits === 'string' 
              ? parseFloat(portfolio.totalOutstandingUnits) 
              : portfolio.totalOutstandingUnits;
            
            // Check if DB value is valid and not stale
            const isNavPerUnitValid = this.navUtilsService.isNavPerUnitValid(navPerUnit);
            const isNavPerUnitStale = this.navUtilsService.isNavPerUnitStale(portfolio.lastNavDate);
            
            if (isNavPerUnitValid && !isNavPerUnitStale) {
              // Use DB value (already set above)
              this.logger.debug(`Using DB navPerUnit: ${navPerUnit} for portfolio ${portfolio.portfolioId} (lastNavDate: ${portfolio.lastNavDate})`);
            } else {
              // Fallback to real-time calculation
              navPerUnit = newFields.totalAllValue / outstandingUnits;
              const reason = !isNavPerUnitValid ? 'DB value is zero' : 'DB value is stale';
              this.logger.debug(`Calculated real-time navPerUnit: ${navPerUnit} for portfolio ${portfolio.portfolioId} (reason: ${reason}, lastNavDate: ${portfolio.lastNavDate})`);
            }
          }

          // Return portfolio with updated real-time values
          const updatedPortfolio = {
            ...portfolio,
            totalValue: totalValue, // Keep old field for backward compatibility
            unrealizedPl: totalUnrealizedPL, // Keep old field for backward compatibility
            realizedPl: totalRealizedPL, // Keep old field for backward compatibility
            cashBalance: correctCashBalance, // Use calculated cash balance
            // Set new fields
            totalAssetValue: newFields.totalAssetValue,
            totalInvestValue: newFields.totalInvestValue,
            totalAllValue: newFields.totalAllValue,
            realizedAssetPnL: newFields.realizedAssetPnL,
            realizedInvestPnL: newFields.realizedInvestPnL,
            realizedAllPnL: newFields.realizedAllPnL,
            unrealizedAssetPnL: newFields.unrealizedAssetPnL,
            unrealizedInvestPnL: newFields.unrealizedInvestPnL,
            unrealizedAllPnL: newFields.unrealizedAllPnL,
            // Update NAV per unit for funds
            navPerUnit: navPerUnit,
          };
          
          // Add computed properties to match Portfolio type
          Object.defineProperty(updatedPortfolio, 'canAcceptInvestors', {
            get: function() { return this.isFund; },
            enumerable: true
          });
          Object.defineProperty(updatedPortfolio, 'investorCount', {
            get: function() { return this.investorHoldings?.length || 0; },
            enumerable: true
          });
          Object.defineProperty(updatedPortfolio, 'hasValidNavPerUnit', {
            get: function() { return this.isFund && this.totalOutstandingUnits > 0 && this.navPerUnit > 0; },
            enumerable: true
          });
          
          return updatedPortfolio;
        } catch (error) {
          // If calculation fails, return original portfolio data
          console.error(`Error calculating real-time P&L for portfolio ${portfolio.portfolioId}:`, error);
          return portfolio;
        }
      })
    );
    
    // Cache the result (if enabled)
    if (this.CACHE_ENABLED) {
      await this.cacheManager.set(cacheKey, portfoliosWithRealTimePL, this.CACHE_TTL);
    }

    return portfoliosWithRealTimePL as Portfolio[];
  }

  /**
   * Calculate current portfolio value based on market prices.
   * @param portfolio - Portfolio entity
   * @returns Promise<void>
   */
  async calculatePortfolioValue(portfolio: Portfolio): Promise<void> {
    try {
      // First, recalculate cash balance from all cash flows to ensure accuracy
      await this.cashFlowService.recalculateCashBalance(portfolio.portfolioId);
      
      // Get updated portfolio with correct cash balance
      const updatedPortfolio = await this.portfolioEntityRepository.findOne({
        where: { portfolioId: portfolio.portfolioId }
      });
      
      if (!updatedPortfolio) {
        throw new Error('Portfolio not found after cash balance recalculation');
      }

      // Calculate portfolio values from trades with correct cash balance
      const calculation = await this.portfolioCalculationService.calculatePortfolioAssetValues(
        portfolio.portfolioId
      );

      // Calculate new portfolio fields
      const newFields = await this.calculateNewPortfolioFields(portfolio.portfolioId);

      // Update portfolio with calculated values
      portfolio.totalValue = calculation.totalValue; // Keep old field for backward compatibility
      portfolio.unrealizedPl = calculation.unrealizedPl; // Keep old field for backward compatibility
      portfolio.realizedPl = calculation.realizedPl; // Keep old field for backward compatibility
      portfolio.cashBalance = updatedPortfolio.cashBalance; // Update with correct cash balance
      
      // Set new fields
      portfolio.totalAssetValue = newFields.totalAssetValue;
      portfolio.totalInvestValue = newFields.totalInvestValue;
      portfolio.totalAllValue = newFields.totalAllValue;
      portfolio.realizedAssetPnL = newFields.realizedAssetPnL;
      portfolio.realizedInvestPnL = newFields.realizedInvestPnL;
      portfolio.realizedAllPnL = newFields.realizedAllPnL;
      portfolio.unrealizedAssetPnL = newFields.unrealizedAssetPnL;
      portfolio.unrealizedInvestPnL = newFields.unrealizedInvestPnL;
      portfolio.unrealizedAllPnL = newFields.unrealizedAllPnL;

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
      
      // Try to get from cache first (if enabled)
      if (this.CACHE_ENABLED) {
        const cachedAllocation = await this.cacheManager.get(cacheKey);
        if (cachedAllocation) {
          return cachedAllocation as Array<{
            assetType: string;
            totalValue: number;
            percentage: number;
          }>;
        }
      }

      const allocation = await this.portfolioRepository.getAssetAllocation(portfolioId);
      
      // Cache the result (if enabled)
      if (this.CACHE_ENABLED) {
        await this.cacheManager.set(cacheKey, allocation, this.CACHE_TTL);
      }

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
    
    // Try to get from cache first (if enabled)
    if (this.CACHE_ENABLED) {
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
    }

    const metrics = await this.portfolioRepository.getPortfolioAnalytics(portfolioId);
    
    // Cache the result (if enabled)
    if (this.CACHE_ENABLED) {
      await this.cacheManager.set(cacheKey, metrics, this.CACHE_TTL);
    }

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
    if (!this.CACHE_ENABLED) return;
    
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



  /**
   * Calculate new portfolio value and P&L fields
   * @param portfolioId - Portfolio ID
   * @returns Promise<object> Calculated values
   */
  private async calculateNewPortfolioFields(portfolioId: string): Promise<{
    totalAssetValue: number;
    totalInvestValue: number;
    totalAllValue: number;
    realizedAssetPnL: number;
    realizedInvestPnL: number;
    realizedAllPnL: number;
    unrealizedAssetPnL: number;
    unrealizedInvestPnL: number;
    unrealizedAllPnL: number;
  }> {
    // Get asset values and P&L
    const calculatedValues = await this.portfolioValueCalculator.calculateAllValues(portfolioId);
    const assetValue = await this.portfolioValueCalculator.calculateAssetValue(portfolioId);
    const cashBalance = await this.cashFlowService.getCashBalance(portfolioId);
    
    // Get realized P&L directly to ensure accuracy
    const realizedAssetPnL = await this.portfolioValueCalculator.calculateRealizedPL(portfolioId);

    // Calculate deposit values for proper realizedInvestPnL
    const deposits = await this.portfolioRepository.manager.query(`
      SELECT 
        principal,
        interest_rate,
        start_date,
        end_date,
        status,
        actual_interest
      FROM deposits 
      WHERE portfolio_id = $1
    `, [portfolioId]);

    let totalDepositValue = 0;
    let totalDepositUnrealizedPnL = 0;
    let totalDepositRealizedPnL = 0;

    for (const deposit of deposits) {
      const principal = parseFloat(deposit.principal) || 0;
      let interest = 0;
      
      if (deposit.status === 'SETTLED') {
        interest = parseFloat(deposit.actual_interest) || 0;
        totalDepositRealizedPnL += interest;
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
        totalDepositUnrealizedPnL += interest;
        // Only add to totalDepositValue for active deposits
        totalDepositValue += principal + interest;
      }
    }

    return {
      totalAssetValue: assetValue,
      totalInvestValue: assetValue + totalDepositValue,
      totalAllValue: assetValue + totalDepositValue + cashBalance,
      realizedAssetPnL: realizedAssetPnL,
      realizedInvestPnL: realizedAssetPnL + totalDepositRealizedPnL,
      realizedAllPnL: realizedAssetPnL + totalDepositRealizedPnL,
      unrealizedAssetPnL: calculatedValues.unrealizedPl,
      unrealizedInvestPnL: calculatedValues.unrealizedPl + totalDepositUnrealizedPnL,
      unrealizedAllPnL: calculatedValues.unrealizedPl + totalDepositUnrealizedPnL,
    };
  }

  /**
   * Get portfolio deposits for analytics
   */
  async getPortfolioDeposits(portfolioId: string): Promise<any[]> {
    try {
      const deposits = await this.depositRepository.findActiveByPortfolioId(portfolioId);

      return deposits.map(deposit => ({
        assetId: deposit.depositId,
        symbol: 'DEPOSIT',
        assetType: 'DEPOSITS',
        name: `Deposit ${deposit.depositId.slice(0, 8)}`,
        quantity: 1,
        avgCost: deposit.principal,
        currentPrice: deposit.calculateTotalValue(),
        currentValue: deposit.calculateTotalValue(),
        unrealizedPl: deposit.calculateAccruedInterest(),
        unrealizedPlPercentage: deposit.principal > 0 ? (deposit.calculateAccruedInterest() / deposit.principal) * 100 : 0,
        weight: 0,
      }));
    } catch (error) {
      console.error('Error fetching portfolio deposits:', error);
      return [];
    }
  }
}
