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
import { InvestorHoldingService } from './investor-holding.service';
// Additional imports for comprehensive deletion
import { Trade } from '../../trading/entities/trade.entity';
import { TradeDetail } from '../../trading/entities/trade-detail.entity';
import { CashFlow } from '../entities/cash-flow.entity';
import { Deposit } from '../entities/deposit.entity';
import { InvestorHolding } from '../entities/investor-holding.entity';
import { FundUnitTransaction } from '../entities/fund-unit-transaction.entity';
import { NavSnapshot } from '../entities/nav-snapshot.entity';
import { PortfolioSnapshot } from '../entities/portfolio-snapshot.entity';
import { PortfolioPerformanceSnapshot } from '../entities/portfolio-performance-snapshot.entity';
import { AssetAllocationSnapshot } from '../entities/asset-allocation-snapshot.entity';

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
    private readonly investorHoldingService: InvestorHoldingService,
    // Additional repositories for comprehensive deletion
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(TradeDetail)
    private readonly tradeDetailRepository: Repository<TradeDetail>,
    @InjectRepository(CashFlow)
    private readonly cashFlowRepository: Repository<CashFlow>,
    @InjectRepository(Deposit)
    private readonly depositEntityRepository: Repository<Deposit>,
    @InjectRepository(InvestorHolding)
    private readonly investorHoldingRepository: Repository<InvestorHolding>,
    @InjectRepository(FundUnitTransaction)
    private readonly fundUnitTransactionRepository: Repository<FundUnitTransaction>,
    @InjectRepository(NavSnapshot)
    private readonly navSnapshotRepository: Repository<NavSnapshot>,
    @InjectRepository(PortfolioSnapshot)
    private readonly portfolioSnapshotRepository: Repository<PortfolioSnapshot>,
    @InjectRepository(PortfolioPerformanceSnapshot)
    private readonly portfolioPerformanceSnapshotRepository: Repository<PortfolioPerformanceSnapshot>,
    @InjectRepository(AssetAllocationSnapshot)
    private readonly assetAllocationSnapshotRepository: Repository<AssetAllocationSnapshot>,
  ) {}

  /**
   * Create a new portfolio.
   * @param createPortfolioDto - Portfolio creation data
   * @returns Promise<Portfolio>
   */
  async createPortfolio(createPortfolioDto: CreatePortfolioDto): Promise<Portfolio> {
    const { name, baseCurrency, accountId, cashBalance = 0, fundingSource } = createPortfolioDto;

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
      fundingSource,
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
      
      // Get NAV per unit for funds (real-time calculation)
      if (portfolio.isFund) {
        // Calculate real-time total outstanding units
        const realTimeOutstandingUnits = await this.investorHoldingService.calculateTotalOutstandingUnits(portfolioId);
        
        // Check if outstanding units changed significantly (more than 0.1%)
        const dbOutstandingUnits = typeof portfolio.totalOutstandingUnits === 'string' 
          ? parseFloat(portfolio.totalOutstandingUnits) 
          : portfolio.totalOutstandingUnits;
        const unitsChanged = Math.abs(realTimeOutstandingUnits - dbOutstandingUnits) > (dbOutstandingUnits * 0.001);
        
        // Update portfolio with real-time outstanding units
        portfolio.totalOutstandingUnits = realTimeOutstandingUnits;
        
        if (realTimeOutstandingUnits > 0) {
          
          // Check if DB value is valid and not stale
          const isNavPerUnitValid = this.navUtilsService.isNavPerUnitValid(portfolio.navPerUnit);
          const isNavPerUnitStale = this.navUtilsService.isNavPerUnitStale(portfolio.lastNavDate);
          
          if (isNavPerUnitValid && !isNavPerUnitStale && !unitsChanged) {
            // Use DB value (already set) - only if units haven't changed
            this.logger.debug(`Using DB navPerUnit: ${portfolio.navPerUnit} for portfolio ${portfolioId} (lastNavDate: ${portfolio.lastNavDate})`);
          } else {
            // Calculate real-time NAV per unit
            portfolio.navPerUnit = newFields.totalAllValue / realTimeOutstandingUnits;
            // Update lastNavDate when calculating real-time NAV
            portfolio.lastNavDate = new Date();
            const reason = !isNavPerUnitValid ? 'DB value is zero' : 
                          isNavPerUnitStale ? 'DB value is stale' : 
                          'Outstanding units changed';
            this.logger.debug(`Calculated real-time navPerUnit: ${portfolio.navPerUnit} for portfolio ${portfolioId} (reason: ${reason}, lastNavDate: ${portfolio.lastNavDate})`);
          }
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

    this.logger.log(`Starting comprehensive deletion of portfolio ${portfolioId}`);

    try {
      // 1. Delete all trades and their details first (to avoid foreign key constraints)
      await this.deleteAllTradesForPortfolio(portfolioId);

      // 2. Delete all cash flows
      await this.deleteAllCashFlowsForPortfolio(portfolioId);

      // 3. Delete all deposits
      await this.deleteAllDepositsForPortfolio(portfolioId);

      // 4. Delete all investor holdings (if portfolio is a fund)
      await this.deleteAllInvestorHoldingsForPortfolio(portfolioId);

      // 5. Delete all NAV snapshots
      await this.deleteAllNavSnapshotsForPortfolio(portfolioId);

      // 6. Delete all portfolio snapshots
      await this.deleteAllPortfolioSnapshotsForPortfolio(portfolioId);

      // 7. Delete all performance snapshots
      await this.deleteAllPerformanceSnapshotsForPortfolio(portfolioId);

      // 8. Delete all asset snapshots
      await this.deleteAllAssetSnapshotsForPortfolio(portfolioId);

      // 9. Finally delete the portfolio itself
      await this.portfolioEntityRepository.remove(portfolio);

      // 10. Clear all caches
      await this.clearPortfolioCache(portfolioId);
      await this.clearAccountCache(portfolio.accountId);

      this.logger.log(`Successfully deleted portfolio ${portfolioId} and all related data`);
    } catch (error) {
      this.logger.error(`Failed to delete portfolio ${portfolioId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete all trades for a portfolio
   */
  private async deleteAllTradesForPortfolio(portfolioId: string): Promise<void> {
    this.logger.log(`Deleting all trades for portfolio ${portfolioId}`);
    
    const trades = await this.tradeRepository.find({
      where: { portfolioId },
      relations: ['sellDetails', 'buyDetails']
    });

    for (const trade of trades) {
      // Delete trade details first
      if (trade.sellDetails && trade.sellDetails.length > 0) {
        await this.tradeDetailRepository.remove(trade.sellDetails);
      }
      if (trade.buyDetails && trade.buyDetails.length > 0) {
        await this.tradeDetailRepository.remove(trade.buyDetails);
      }
      
      // Delete the trade
      await this.tradeRepository.remove(trade);
    }

    this.logger.log(`Deleted ${trades.length} trades for portfolio ${portfolioId}`);
  }

  /**
   * Delete all cash flows for a portfolio
   */
  private async deleteAllCashFlowsForPortfolio(portfolioId: string): Promise<void> {
    this.logger.log(`Deleting all cash flows for portfolio ${portfolioId}`);
    
    const cashFlows = await this.cashFlowRepository.find({
      where: { portfolioId }
    });

    if (cashFlows.length > 0) {
      await this.cashFlowRepository.remove(cashFlows);
      this.logger.log(`Deleted ${cashFlows.length} cash flows for portfolio ${portfolioId}`);
    }
  }

  /**
   * Delete all deposits for a portfolio
   */
  private async deleteAllDepositsForPortfolio(portfolioId: string): Promise<void> {
    this.logger.log(`Deleting all deposits for portfolio ${portfolioId}`);
    
    const deposits = await this.depositEntityRepository.find({
      where: { portfolioId }
    });

    for (const deposit of deposits) {
      // Delete associated cash flows first
      const referenceId = this.cashFlowService.formatReferenceId(deposit.depositId, "ACTIVE");
      await this.cashFlowService.deleteCashFlowByReferenceIdSilent(referenceId);
      
      const referenceIdSettlement = this.cashFlowService.formatReferenceId(deposit.depositId, "SETTLED");
      await this.cashFlowService.deleteCashFlowByReferenceIdSilent(referenceIdSettlement);
    }

    if (deposits.length > 0) {
      await this.depositEntityRepository.remove(deposits);
      this.logger.log(`Deleted ${deposits.length} deposits for portfolio ${portfolioId}`);
    }
  }

  /**
   * Delete all investor holdings for a portfolio
   */
  private async deleteAllInvestorHoldingsForPortfolio(portfolioId: string): Promise<void> {
    this.logger.log(`Deleting all investor holdings for portfolio ${portfolioId}`);
    
    const holdings = await this.investorHoldingRepository.find({
      where: { portfolioId },
      relations: ['transactions']
    });

    for (const holding of holdings) {
      // Delete all fund unit transactions first
      if (holding.transactions && holding.transactions.length > 0) {
        await this.fundUnitTransactionRepository.remove(holding.transactions);
      }
    }

    if (holdings.length > 0) {
      await this.investorHoldingRepository.remove(holdings);
      this.logger.log(`Deleted ${holdings.length} investor holdings for portfolio ${portfolioId}`);
    }
  }

  /**
   * Delete all NAV snapshots for a portfolio
   */
  private async deleteAllNavSnapshotsForPortfolio(portfolioId: string): Promise<void> {
    this.logger.log(`Deleting all NAV snapshots for portfolio ${portfolioId}`);
    
    const navSnapshots = await this.navSnapshotRepository.find({
      where: { portfolioId }
    });

    if (navSnapshots.length > 0) {
      await this.navSnapshotRepository.remove(navSnapshots);
      this.logger.log(`Deleted ${navSnapshots.length} NAV snapshots for portfolio ${portfolioId}`);
    }
  }

  /**
   * Delete all portfolio snapshots for a portfolio
   */
  private async deleteAllPortfolioSnapshotsForPortfolio(portfolioId: string): Promise<void> {
    this.logger.log(`Deleting all portfolio snapshots for portfolio ${portfolioId}`);
    
    const portfolioSnapshots = await this.portfolioSnapshotRepository.find({
      where: { portfolioId }
    });

    if (portfolioSnapshots.length > 0) {
      await this.portfolioSnapshotRepository.remove(portfolioSnapshots);
      this.logger.log(`Deleted ${portfolioSnapshots.length} portfolio snapshots for portfolio ${portfolioId}`);
    }
  }

  /**
   * Delete all performance snapshots for a portfolio
   */
  private async deleteAllPerformanceSnapshotsForPortfolio(portfolioId: string): Promise<void> {
    this.logger.log(`Deleting all performance snapshots for portfolio ${portfolioId}`);
    
    const performanceSnapshots = await this.portfolioPerformanceSnapshotRepository.find({
      where: { portfolioId }
    });

    if (performanceSnapshots.length > 0) {
      await this.portfolioPerformanceSnapshotRepository.remove(performanceSnapshots);
      this.logger.log(`Deleted ${performanceSnapshots.length} performance snapshots for portfolio ${portfolioId}`);
    }
  }

  /**
   * Delete all asset snapshots for a portfolio
   */
  private async deleteAllAssetSnapshotsForPortfolio(portfolioId: string): Promise<void> {
    this.logger.log(`Deleting all asset snapshots for portfolio ${portfolioId}`);
    
    const assetSnapshots = await this.assetAllocationSnapshotRepository.find({
      where: { portfolioId }
    });

    if (assetSnapshots.length > 0) {
      await this.assetAllocationSnapshotRepository.remove(assetSnapshots);
      this.logger.log(`Deleted ${assetSnapshots.length} asset snapshots for portfolio ${portfolioId}`);
    }
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

  /**
   * Copy a portfolio with all its data
   * @param sourcePortfolioId - Source portfolio ID to copy from
   * @param newName - Name for the new portfolio
   * @returns Promise<Portfolio> - The new copied portfolio
   */
  async copyPortfolio(sourcePortfolioId: string, newName: string): Promise<Portfolio> {
    // Get source portfolio with all related data
    const sourcePortfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: sourcePortfolioId },
      relations: ['trades', 'trades.sellDetails', 'trades.buyDetails', 'cashFlows', 'deposits', 'investorHoldings']
    });

    if (!sourcePortfolio) {
      throw new NotFoundException(`Source portfolio with ID ${sourcePortfolioId} not found`);
    }

    // Check if portfolio with same name already exists for this account
    const existingPortfolio = await this.portfolioRepository.findOne({
      where: { accountId: sourcePortfolio.accountId, name: newName },
    });

    if (existingPortfolio) {
      throw new BadRequestException(
        `Portfolio with name "${newName}" already exists for this account`,
      );
    }

    // Create new portfolio with same properties but new name
    const newPortfolio = this.portfolioEntityRepository.create({
      accountId: sourcePortfolio.accountId,
      name: newName,
      baseCurrency: sourcePortfolio.baseCurrency,
      // Copy all values from source portfolio
      totalValue: sourcePortfolio.totalValue || 0,
      cashBalance: sourcePortfolio.cashBalance || 0,
      unrealizedPl: sourcePortfolio.unrealizedPl || 0,
      realizedPl: sourcePortfolio.realizedPl || 0,
      // Copy fund-related fields if source is a fund
      isFund: sourcePortfolio.isFund,
      totalOutstandingUnits: sourcePortfolio.isFund ? 0 : sourcePortfolio.totalOutstandingUnits,
      navPerUnit: sourcePortfolio.isFund ? 0 : sourcePortfolio.navPerUnit,
      numberOfInvestors: sourcePortfolio.isFund ? 0 : sourcePortfolio.numberOfInvestors,
      lastNavDate: sourcePortfolio.isFund ? null : sourcePortfolio.lastNavDate,
      // Copy all P&L fields from source portfolio
      totalAssetValue: sourcePortfolio.totalAssetValue || 0,
      totalInvestValue: sourcePortfolio.totalInvestValue || 0,
      totalAllValue: sourcePortfolio.totalAllValue || 0,
      realizedAssetPnL: sourcePortfolio.realizedAssetPnL || 0,
      realizedInvestPnL: sourcePortfolio.realizedInvestPnL || 0,
      realizedAllPnL: sourcePortfolio.realizedAllPnL || 0,
      unrealizedAssetPnL: sourcePortfolio.unrealizedAssetPnL || 0,
      unrealizedInvestPnL: sourcePortfolio.unrealizedInvestPnL || 0,
      unrealizedAllPnL: sourcePortfolio.unrealizedAllPnL || 0,
    });

    const savedPortfolio = await this.portfolioEntityRepository.save(newPortfolio);

    // Copy all trades from source portfolio
    if (sourcePortfolio.trades && sourcePortfolio.trades.length > 0) {
      const { Trade } = await import('../../trading/entities/trade.entity');
      const { TradeDetail } = await import('../../trading/entities/trade-detail.entity');
      
      // Create a mapping of old trade IDs to new trade IDs
      const tradeIdMapping = new Map<string, string>();
      
      // First pass: create all trades and build ID mapping
      for (const sourceTrade of sourcePortfolio.trades) {
        // Create new trade
        const newTrade = this.portfolioEntityRepository.manager.create(Trade, {
          portfolioId: savedPortfolio.portfolioId,
          assetId: sourceTrade.assetId,
          side: sourceTrade.side,
          quantity: sourceTrade.quantity,
          price: sourceTrade.price,
          fee: sourceTrade.fee,
          tax: sourceTrade.tax,
          tradeDate: sourceTrade.tradeDate,
          notes: sourceTrade.notes,
          tradeType: sourceTrade.tradeType,
          source: sourceTrade.source,
          exchange: sourceTrade.exchange,
          fundingSource: sourceTrade.fundingSource,
          createdAt: sourceTrade.createdAt, // Copy creation timestamp
          updatedAt: sourceTrade.updatedAt, // Copy update timestamp
        });

        const savedTrade = await this.portfolioEntityRepository.manager.save(newTrade);
        
        // Map old trade ID to new trade ID
        tradeIdMapping.set(sourceTrade.tradeId, savedTrade.tradeId);
      }
      
      // Second pass: copy trade details with correct trade ID mappings
      // Use a Set to track already copied trade details to avoid duplicates
      const copiedTradeDetails = new Set<string>();
      
      for (const sourceTrade of sourcePortfolio.trades) {
        const newTradeId = tradeIdMapping.get(sourceTrade.tradeId);
        
        // Copy sell details (where this trade is the sell trade)
        if (sourceTrade.sellDetails && sourceTrade.sellDetails.length > 0) {
          for (const sourceTradeDetail of sourceTrade.sellDetails) {
            const newBuyTradeId = tradeIdMapping.get(sourceTradeDetail.buyTradeId);
            
            if (newBuyTradeId) {
              // Create a unique key to avoid duplicates
              const detailKey = `${newBuyTradeId}-${newTradeId}-${sourceTradeDetail.assetId}`;
              
              if (!copiedTradeDetails.has(detailKey)) {
                const newTradeDetail = this.portfolioEntityRepository.manager.create(TradeDetail, {
                  buyTradeId: newBuyTradeId, // Use mapped buy trade ID
                  sellTradeId: newTradeId, // Use mapped sell trade ID
                  assetId: sourceTradeDetail.assetId,
                  matchedQty: sourceTradeDetail.matchedQty,
                  buyPrice: sourceTradeDetail.buyPrice,
                  sellPrice: sourceTradeDetail.sellPrice,
                  feeTax: sourceTradeDetail.feeTax,
                  pnl: sourceTradeDetail.pnl,
                  createdAt: sourceTradeDetail.createdAt, // Copy creation timestamp
                });

                await this.portfolioEntityRepository.manager.save(newTradeDetail);
                copiedTradeDetails.add(detailKey);
              }
            }
          }
        }
      }
    }

    // Copy cash flows from source portfolio
    if (sourcePortfolio.cashFlows && sourcePortfolio.cashFlows.length > 0) {
      const { CashFlow } = await import('../entities/cash-flow.entity');
      
      for (const sourceCashFlow of sourcePortfolio.cashFlows) {
        const newCashFlow = this.portfolioEntityRepository.manager.create(CashFlow, {
          portfolioId: savedPortfolio.portfolioId,
          amount: sourceCashFlow.amount,
          type: sourceCashFlow.type,
          description: sourceCashFlow.description,
          flowDate: sourceCashFlow.flowDate,
          reference: sourceCashFlow.reference,
          currency: sourceCashFlow.currency,
          status: sourceCashFlow.status,
          effectiveDate: sourceCashFlow.effectiveDate,
          tradeId: sourceCashFlow.tradeId,
          fundingSource: sourceCashFlow.fundingSource,
        });

        await this.portfolioEntityRepository.manager.save(newCashFlow);
      }
    }

    // Copy deposits from source portfolio
    if (sourcePortfolio.deposits && sourcePortfolio.deposits.length > 0) {
      const { Deposit } = await import('../entities/deposit.entity');
      
      for (const sourceDeposit of sourcePortfolio.deposits) {
        const newDeposit = this.portfolioEntityRepository.manager.create(Deposit, {
          portfolioId: savedPortfolio.portfolioId,
          bankName: sourceDeposit.bankName, // Copy bank name (required field)
          accountNumber: sourceDeposit.accountNumber, // Copy account number
          principal: sourceDeposit.principal,
          interestRate: sourceDeposit.interestRate,
          startDate: sourceDeposit.startDate,
          endDate: sourceDeposit.endDate,
          termMonths: sourceDeposit.termMonths, // Copy term months
          status: 'ACTIVE', // Reset status to active for new portfolio
          actualInterest: 0, // Reset actual interest
          notes: sourceDeposit.notes, // Copy notes
        });

        await this.portfolioEntityRepository.manager.save(newDeposit);
      }
    }

    // Clear cache for account
    await this.clearAccountCache(sourcePortfolio.accountId);
    
    this.logger.log(`Portfolio copied successfully: ${sourcePortfolioId} -> ${savedPortfolio.portfolioId}`);
    
    return savedPortfolio;
  }

  /**
   * Convert fund to portfolio by cleaning up all fund-related data
   * This is the reverse of convertToFund operation
   */
  async convertFundToPortfolio(portfolioId: string): Promise<void> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    if (!portfolio.isFund) {
      throw new BadRequestException(`Portfolio ${portfolioId} is not a fund`);
    }

    this.logger.log(`Starting conversion of fund ${portfolioId} to portfolio`);

    try {
      // 1. Delete cash flows related to fund unit transactions
      await this.deleteCashFlowsForFundUnitTransactions(portfolioId);

      // 2. Delete fund unit transactions
      await this.deleteFundUnitTransactions(portfolioId);

      // 3. Delete investor holdings
      await this.deleteInvestorHoldings(portfolioId);

      // 4. Recalculate cash balance from remaining cash flows
      const newCashBalance = await this.recalculateCashBalance(portfolioId);

      // 5. Reset portfolio to non-fund status
      await this.portfolioEntityRepository.update(
        { portfolioId: portfolioId },
        {
          isFund: false,
          totalOutstandingUnits: 0,
          navPerUnit: 0,
          lastNavDate: null,
          cashBalance: newCashBalance,
          numberOfInvestors: 0,
        }
      );

      // 6. Clear all caches
      await this.clearPortfolioCache(portfolioId);
      await this.clearAccountCache(portfolio.accountId);

      this.logger.log(`Successfully converted fund ${portfolioId} to portfolio`);
    } catch (error) {
      this.logger.error(`Failed to convert fund ${portfolioId} to portfolio: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete cash flows related to fund unit transactions for a portfolio
   */
  private async deleteCashFlowsForFundUnitTransactions(portfolioId: string): Promise<void> {
    const cashFlows = await this.cashFlowRepository
      .createQueryBuilder('cf')
      .innerJoin('fund_unit_transactions', 'fut', 'cf.cash_flow_id = fut.cash_flow_id')
      .innerJoin('investor_holdings', 'ih', 'fut.holding_id = ih.holding_id')
      .where('ih.portfolio_id = :portfolioId', { portfolioId })
      .getMany();

    if (cashFlows.length > 0) {
      await this.cashFlowRepository.remove(cashFlows);
      this.logger.log(`Deleted ${cashFlows.length} cash flows related to fund unit transactions`);
    }
  }

  /**
   * Delete fund unit transactions for a portfolio
   */
  private async deleteFundUnitTransactions(portfolioId: string): Promise<void> {
    const transactions = await this.fundUnitTransactionRepository
      .createQueryBuilder('fut')
      .innerJoin('investor_holdings', 'ih', 'fut.holding_id = ih.holding_id')
      .where('ih.portfolio_id = :portfolioId', { portfolioId })
      .getMany();

    if (transactions.length > 0) {
      await this.fundUnitTransactionRepository.remove(transactions);
      this.logger.log(`Deleted ${transactions.length} fund unit transactions`);
    }
  }

  /**
   * Delete investor holdings for a portfolio
   */
  private async deleteInvestorHoldings(portfolioId: string): Promise<void> {
    const holdings = await this.investorHoldingRepository.find({
      where: { portfolioId: portfolioId },
    });

    if (holdings.length > 0) {
      await this.investorHoldingRepository.remove(holdings);
      this.logger.log(`Deleted ${holdings.length} investor holdings`);
    }
  }

  /**
   * Recalculate cash balance from remaining cash flows
   */
  private async recalculateCashBalance(portfolioId: string): Promise<number> {
    const cashFlows = await this.cashFlowRepository.find({
      where: { portfolioId: portfolioId },
    });

    const totalCashBalance = cashFlows.reduce((sum, cf) => {
      const inflowTypes = ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_TRADE', 'DEPOSIT_SETTLEMENT'];
      // Ensure amount is converted to number (TypeORM may return string for decimal fields)
      const amount = typeof cf.amount === 'string' ? parseFloat(cf.amount) : cf.amount;
      return sum + (inflowTypes.includes(cf.type) ? amount : -amount);
    }, 0);

    this.logger.log(`Recalculated cash balance: ${totalCashBalance}`);
    return totalCashBalance;
  }
}
