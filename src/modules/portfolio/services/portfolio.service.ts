import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Portfolio } from '../entities/portfolio.entity';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { CreatePortfolioDto } from '../dto/create-portfolio.dto';
import { UpdatePortfolioDto } from '../dto/update-portfolio.dto';
import { Account } from '../../shared/entities/account.entity';
import { PortfolioPermissionService } from './portfolio-permission.service';
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
    private readonly portfolioPermissionService: PortfolioPermissionService,
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
      
      // Add calculated totalCapitalValue as a computed property
      (portfolio as any).totalCapitalValue = newFields.totalCapitalValue;
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
            totalCapitalValue: newFields.totalCapitalValue,
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
   * Get all portfolios accessible by an account (owned + shared with permissions).
   * This includes portfolios owned by the account and portfolios shared with the account.
   * @param accountId - Account ID
   * @returns Promise<Portfolio[]>
   */
  async getAccessiblePortfoliosByAccount(accountId: string): Promise<any[]> {
    const cacheKey = `accessible-portfolios:account:${accountId}`;
    
    // Try to get from cache first (if enabled)
    if (this.CACHE_ENABLED) {
      const cachedPortfolios = await this.cacheManager.get<any[]>(cacheKey);
      if (cachedPortfolios) {
        return cachedPortfolios;
      }
    }

    // Get owned portfolios
    const ownedPortfolios = await this.getPortfoliosByAccount(accountId);
    
    // Get shared portfolios (portfolios this account has permission to access)
    const sharedPortfolios = await this.portfolioPermissionService.getAccountAccessiblePortfolios(accountId);
    
    // Combine and deduplicate portfolios
    const allPortfolios = [...ownedPortfolios];
    const ownedPortfolioIds = new Set(ownedPortfolios.map(p => p.portfolioId));
    
    for (const sharedPortfolio of sharedPortfolios) {
      if (!ownedPortfolioIds.has(sharedPortfolio.portfolioId)) {
        allPortfolios.push(sharedPortfolio);
      }
    }

    // Add permission stats to each portfolio
    const portfoliosWithStats = await Promise.all(
      allPortfolios.map(async (portfolio) => {
        try {
          const permissionStats = await this.portfolioPermissionService.getPortfolioPermissionStats(portfolio.portfolioId);
          return {
            ...portfolio,
            permissionStats,
          } as any;
        } catch (error) {
          // If permission stats fail to load, return portfolio without stats
          return portfolio;
        }
      })
    );
    
    // Cache the result (if enabled)
    if (this.CACHE_ENABLED) {
      await this.cacheManager.set(cacheKey, portfoliosWithStats, this.CACHE_TTL);
    }

    return portfoliosWithStats as any;
  }

  /**
   * Check if an account has permission to access a portfolio.
   * @param portfolioId - Portfolio ID
   * @param accountId - Account ID
   * @param action - Action to check permission for
   * @returns Promise<boolean>
   */
  async checkPortfolioAccess(
    portfolioId: string,
    accountId: string,
    action: 'view' | 'update' | 'delete' | 'manage_permissions' = 'view'
  ): Promise<boolean> {
    return await this.portfolioPermissionService.checkPortfolioPermission(
      portfolioId,
      accountId,
      action
    );
  }

  /**
   * Get portfolio with permission check.
   * @param portfolioId - Portfolio ID
   * @param accountId - Account ID requesting access
   * @param action - Action to check permission for
   * @returns Promise<Portfolio>
   */
  async getPortfolioWithPermissionCheck(
    portfolioId: string,
    accountId: string,
    action: 'view' | 'update' | 'delete' | 'manage_permissions' = 'view'
  ): Promise<Portfolio> {
    // Check permission first
    const hasPermission = await this.checkPortfolioAccess(portfolioId, accountId, action);
    if (!hasPermission) {
      throw new NotFoundException('Portfolio not found or access denied');
    }

    // Get portfolio
    const portfolio = await this.portfolioEntityRepository.findOne({
      where: { portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    return portfolio;
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
      
      // Add calculated totalCapitalValue as a computed property
      (portfolio as any).totalCapitalValue = newFields.totalCapitalValue;

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
    totalCapitalValue: number;
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

    // Calculate total capital value from cash flows (total invested amount)
    const totalCapitalValue = await this.calculateTotalCapitalValueFromCashFlows(portfolioId);

    return {
      totalAssetValue: assetValue,
      totalInvestValue: assetValue + totalDepositValue,
      totalAllValue: assetValue + totalDepositValue + cashBalance,
      totalCapitalValue: totalCapitalValue,
      realizedAssetPnL: realizedAssetPnL,
      realizedInvestPnL: realizedAssetPnL + totalDepositRealizedPnL,
      realizedAllPnL: realizedAssetPnL + totalDepositRealizedPnL,
      unrealizedAssetPnL: calculatedValues.unrealizedPl,
      unrealizedInvestPnL: calculatedValues.unrealizedPl + totalDepositUnrealizedPnL,
      unrealizedAllPnL: calculatedValues.unrealizedPl + totalDepositUnrealizedPnL,
    };
  }

  /**
   * Calculate total capital value from cash flows
   * @param portfolioId - Portfolio ID
   * @returns Promise<number> Total capital value
   */
  private async calculateTotalCapitalValueFromCashFlows(portfolioId: string): Promise<number> {
    try {
      // Get cash flows for this portfolio, filter by DEPOSIT and WITHDRAWAL types
      const cashFlows = await this.cashFlowRepository.find({
        where: { 
          portfolioId,
          type: In(['DEPOSIT', 'WITHDRAWAL'])
        },
        order: { flowDate: 'ASC' }
      });

      // Calculate total capital value using NetAmount
      // NetAmount is positive for DEPOSIT (inflow) and negative for WITHDRAWAL (outflow)
      const totalCapitalValue = cashFlows.reduce((sum, cashFlow) => {
        return sum + cashFlow.netAmount;
      }, 0);

      return Number(totalCapitalValue.toFixed(2));
    } catch (error) {
      console.error(`Error calculating total capital value for portfolio ${portfolioId}:`, error);
      return 0;
    }
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
   * Copy a portfolio with all its data (same account)
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

    // Create new portfolio using helper method
    const savedPortfolio = await this.createCopiedPortfolio(
      sourcePortfolio, 
      sourcePortfolio.accountId, 
      newName, 
      false // Not a public copy
    );

    // Copy trades using helper method
    if (sourcePortfolio.trades && sourcePortfolio.trades.length > 0) {
      await this.copyTradesSameAccount(sourcePortfolio.trades, savedPortfolio.portfolioId);
    }

    // Copy cash flows using helper method
    if (sourcePortfolio.cashFlows && sourcePortfolio.cashFlows.length > 0) {
      await this.copyCashFlowWithAmounts(sourcePortfolio.cashFlows, savedPortfolio.portfolioId);
    }

    // Copy deposits using helper method
    if (sourcePortfolio.deposits && sourcePortfolio.deposits.length > 0) {
      await this.copyDepositsWithAmounts(sourcePortfolio.deposits, savedPortfolio.portfolioId);
    }

    // Clear cache for account
    await this.clearAccountCache(sourcePortfolio.accountId);
    
    this.logger.log(`Portfolio copied successfully: ${sourcePortfolioId} -> ${savedPortfolio.portfolioId}`);
    
    return savedPortfolio;
  }

  /**
   * Create new portfolio with copied data from source portfolio
   * @param sourcePortfolio - Source portfolio data
   * @param targetAccountId - Target account ID
   * @param newName - Name for the new portfolio
   * @param isPublicCopy - Whether this is a public portfolio copy
   * @returns Promise<Portfolio> - The new portfolio
   */
  private async createCopiedPortfolio(
    sourcePortfolio: any, 
    targetAccountId: string, 
    newName: string, 
    isPublicCopy: boolean = false
  ): Promise<Portfolio> {
    const newPortfolio = this.portfolioEntityRepository.create({
      accountId: targetAccountId,
      name: newName,
      baseCurrency: sourcePortfolio.baseCurrency,
      fundingSource: sourcePortfolio.fundingSource,
      // Copy all values from source portfolio
      totalValue: sourcePortfolio.totalValue || 0,
      cashBalance: sourcePortfolio.cashBalance || 0,
      unrealizedPl: sourcePortfolio.unrealizedPl || 0,
      realizedPl: sourcePortfolio.realizedPl || 0,
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
      // Handle fund-related fields based on copy type
      isFund: isPublicCopy ? false : sourcePortfolio.isFund,
      totalOutstandingUnits: isPublicCopy ? 0 : sourcePortfolio.totalOutstandingUnits,
      navPerUnit: isPublicCopy ? 0 : sourcePortfolio.navPerUnit,
      numberOfInvestors: isPublicCopy ? 0 : sourcePortfolio.numberOfInvestors,
      lastNavDate: isPublicCopy ? null : sourcePortfolio.lastNavDate,
      // Set visibility
      visibility: 'PRIVATE',
      // Set timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.portfolioEntityRepository.save(newPortfolio);
  }

  /**
   * Copy trades for same-account copy
   * @param trades - Source trades
   * @param newPortfolioId - New portfolio ID
   * @returns Promise<void>
   */
  private async copyTradesSameAccount(trades: any[], newPortfolioId: string): Promise<void> {
    const { Trade } = await import('../../trading/entities/trade.entity');
    const { TradeDetail } = await import('../../trading/entities/trade-detail.entity');
    
    // Create a mapping of old trade IDs to new trade IDs
    const tradeIdMapping = new Map<string, string>();
    
    // First pass: create all trades and build ID mapping
    for (const sourceTrade of trades) {
      // Create new trade
      const newTrade = this.portfolioEntityRepository.manager.create(Trade, {
        portfolioId: newPortfolioId,
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
        createdAt: new Date(), // reset creation timestamp
        updatedAt: new Date(), // reset update timestamp
      });

      const savedTrade = await this.portfolioEntityRepository.manager.save(newTrade);
      
      // Map old trade ID to new trade ID
      tradeIdMapping.set(sourceTrade.tradeId, savedTrade.tradeId);
    }
    
    // Second pass: copy trade details with correct trade ID mappings
    await this.copyTradeDetails(trades, tradeIdMapping);
  }

  /**
   * Copy trade details with trade ID mapping
   * @param trades - Source trades
   * @param tradeIdMapping - Mapping of old to new trade IDs
   * @returns Promise<void>
   */
  private async copyTradeDetails(trades: any[], tradeIdMapping: Map<string, string>): Promise<void> {
    const { TradeDetail } = await import('../../trading/entities/trade-detail.entity');
    
    // Use a Set to track already copied trade details to avoid duplicates
    const copiedTradeDetails = new Set<string>();
    
    for (const sourceTrade of trades) {
      const newTradeId = tradeIdMapping.get(sourceTrade.tradeId);
      
      // Copy sell details (where this trade is the sell trade)
      if (sourceTrade.sellDetails && sourceTrade.sellDetails.length > 0) {
        for (const sourceTradeDetail of sourceTrade.sellDetails) {
          const newBuyTradeId = tradeIdMapping.get(sourceTradeDetail.buyTradeId);
          
          if (newBuyTradeId) {
            const detailKey = `${newBuyTradeId}-${newTradeId}-${sourceTradeDetail.assetId}`;
            
            if (!copiedTradeDetails.has(detailKey)) {
              const newTradeDetail = this.portfolioEntityRepository.manager.create(TradeDetail, {
                buyTradeId: newBuyTradeId,
                sellTradeId: newTradeId,
                assetId: sourceTradeDetail.assetId,
                matchedQty: sourceTradeDetail.matchedQty,
                buyPrice: sourceTradeDetail.buyPrice,
                sellPrice: sourceTradeDetail.sellPrice,
                feeTax: sourceTradeDetail.feeTax,
                pnl: sourceTradeDetail.pnl,
                createdAt: new Date(), // reset creation timestamp
                updatedAt: new Date(), // reset update timestamp
              });

              await this.portfolioEntityRepository.manager.save(newTradeDetail);
              copiedTradeDetails.add(detailKey);
            }
          }
        }
      }
    }
  }

  /**
   * Copy a public portfolio to a different account
   * @param sourcePortfolioId - Source public portfolio ID to copy from
   * @param targetAccountId - Target account ID
   * @param newName - Name for the new portfolio
   * @returns Promise<Portfolio> - The new copied portfolio
   */
  async copyPublicPortfolio(sourcePortfolioId: string, targetAccountId: string, newName: string): Promise<Portfolio> {
    // Get source portfolio with all related data
    const sourcePortfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: sourcePortfolioId },
      relations: ['trades', 'trades.asset', 'trades.sellDetails', 'trades.buyDetails', 'cashFlows', 'deposits', 'investorHoldings']
    });

    if (!sourcePortfolio) {
      throw new NotFoundException(`Source portfolio with ID ${sourcePortfolioId} not found`);
    }

    // Check if source portfolio is public
    if (sourcePortfolio.visibility !== 'PUBLIC') {
      throw new BadRequestException(`Portfolio ${sourcePortfolioId} is not public and cannot be copied`);
    }

    // Check if portfolio with same name already exists for target account
    const existingPortfolio = await this.portfolioRepository.findOne({
      where: { accountId: targetAccountId, name: newName },
    });

    if (existingPortfolio) {
      throw new BadRequestException(
        `Portfolio with name "${newName}" already exists for this account`,
      );
    }

    // Create new portfolio using helper method
    const savedPortfolio = await this.createCopiedPortfolio(
      sourcePortfolio, 
      targetAccountId, 
      newName, 
      true // This is a public copy
    );

    // Copy trades with asset mapping
    if (sourcePortfolio.trades && sourcePortfolio.trades.length > 0) {
      await this.copyTradesWithAssetMapping(sourcePortfolio.trades, savedPortfolio.portfolioId, targetAccountId);
    }

    // Copy cash flows with amounts for public portfolio copy
    if (sourcePortfolio.cashFlows && sourcePortfolio.cashFlows.length > 0) {
      await this.copyCashFlowWithAmounts(sourcePortfolio.cashFlows, savedPortfolio.portfolioId);
    }

    // Copy deposits with amounts for public portfolio copy
    if (sourcePortfolio.deposits && sourcePortfolio.deposits.length > 0) {
      await this.copyDepositsWithAmounts(sourcePortfolio.deposits, savedPortfolio.portfolioId);
    }

    // Clear cache for target account
    await this.clearAccountCache(targetAccountId);
    
    this.logger.log(`Public portfolio copied successfully: ${sourcePortfolioId} -> ${savedPortfolio.portfolioId} (account: ${targetAccountId})`);
    
    return savedPortfolio;
  }

  /**
   * Copy trades with asset mapping for cross-account copy
   */
  private async copyTradesWithAssetMapping(trades: any[], newPortfolioId: string, targetAccountId: string): Promise<void> {
    const { Trade } = await import('../../trading/entities/trade.entity');
    const { TradeDetail } = await import('../../trading/entities/trade-detail.entity');
    const { Asset } = await import('../../asset/entities/asset.entity');
    
    // Create a mapping of old trade IDs to new trade IDs
    const tradeIdMapping = new Map<string, string>();
    const assetMapping = new Map<string, string>();
    
    // First pass: create all trades with asset mapping
    for (const sourceTrade of trades) {
      // Check if asset exists for target account, create if not
      let targetAssetId = assetMapping.get(sourceTrade.assetId);
      
      if (!targetAssetId) {
        // Try to find existing asset by symbol
        const existingAsset = await this.portfolioEntityRepository.manager.findOne(Asset, {
          where: { 
            symbol: sourceTrade.asset?.symbol || 'UNKNOWN',
            createdBy: targetAccountId 
          }
        });
        
        if (existingAsset) {
          targetAssetId = existingAsset.id;
          this.logger.log(`Using existing asset: ${existingAsset.symbol} (${existingAsset.name}) for target account ${targetAccountId}`);
        } else {
          // Create new asset manually for target account
          const assetName = sourceTrade.asset?.name || 'Unknown Asset';
          const assetSymbol = sourceTrade.asset?.symbol || 'UNKNOWN';
          
          this.logger.log(`Creating new asset: ${assetSymbol} (${assetName}) for target account ${targetAccountId}`);
          
          const newAsset = this.portfolioEntityRepository.manager.create(Asset, {
            name: assetName,
            symbol: assetSymbol,
            type: sourceTrade.asset?.type || 'STOCK',
            assetClass: sourceTrade.asset?.assetClass || 'EQUITY',
            currency: sourceTrade.asset?.currency || 'VND',
            isActive: true,
            createdBy: targetAccountId,
            updatedBy: targetAccountId,
            createdAt: new Date(), // reset creation timestamp
            updatedAt: new Date(), // reset update timestamp
          });
          const savedAsset = await this.portfolioEntityRepository.manager.save(newAsset);
          targetAssetId = savedAsset.id;
          
          this.logger.log(`Created new asset with ID: ${savedAsset.id} for symbol: ${savedAsset.symbol}`);
        }
        
        assetMapping.set(sourceTrade.assetId, targetAssetId);
      }
      
      // Create new trade
      const newTrade = this.portfolioEntityRepository.manager.create(Trade, {
        portfolioId: newPortfolioId,
        assetId: targetAssetId,
        side: sourceTrade.side,
        quantity: sourceTrade.quantity,
        price: sourceTrade.price,
        fee: sourceTrade.fee,
        tax: sourceTrade.tax,
        tradeDate: sourceTrade.tradeDate, // keep original trade date
        notes: sourceTrade.notes,
        tradeType: sourceTrade.tradeType,
        source: sourceTrade.source,
        exchange: sourceTrade.exchange,
        fundingSource: sourceTrade.fundingSource,
        createdAt: new Date(), // reset creation timestamp
        updatedAt: new Date(), // reset update timestamp
      });

      const savedTrade = await this.portfolioEntityRepository.manager.save(newTrade);
      tradeIdMapping.set(sourceTrade.tradeId, savedTrade.tradeId);
    }
    
    // Second pass: copy trade details with correct trade ID mappings
    await this.copyTradeDetails(trades, tradeIdMapping);
  }

  /**
   * Copy cash flow with full original information for public portfolio copy
   */
  private async copyCashFlowWithAmounts(cashFlows: any[], newPortfolioId: string): Promise<void> {
    const { CashFlow } = await import('../entities/cash-flow.entity');
    
    for (const sourceCashFlow of cashFlows) {
      const newCashFlow = this.portfolioEntityRepository.manager.create(CashFlow, {
        portfolioId: newPortfolioId,
        amount: sourceCashFlow.amount, // Copy original amount
        type: sourceCashFlow.type,
        description: sourceCashFlow.description,
        flowDate: sourceCashFlow.flowDate, // Keep original date
        reference: sourceCashFlow.reference,
        currency: sourceCashFlow.currency,
        status: sourceCashFlow.status, // Copy original status
        effectiveDate: sourceCashFlow.effectiveDate, // Keep original effective date
        tradeId: sourceCashFlow.tradeId, // Copy original trade ID
        fundingSource: sourceCashFlow.fundingSource,
        createdAt: new Date(), // reset creation timestamp
        updatedAt: new Date(), // reset update timestamp
      });

      await this.portfolioEntityRepository.manager.save(newCashFlow);
    }
  }

  /**
   * Copy deposits with full original information for public portfolio copy
   */
  private async copyDepositsWithAmounts(deposits: any[], newPortfolioId: string): Promise<void> {
    const { Deposit } = await import('../entities/deposit.entity');
    
    for (const sourceDeposit of deposits) {
      const newDeposit = this.portfolioEntityRepository.manager.create(Deposit, {
        portfolioId: newPortfolioId,
        bankName: sourceDeposit.bankName,
        accountNumber: sourceDeposit.accountNumber,
        principal: sourceDeposit.principal,
        interestRate: sourceDeposit.interestRate,
        startDate: sourceDeposit.startDate, // Keep original start date
        endDate: sourceDeposit.endDate, // Keep original end date
        termMonths: sourceDeposit.termMonths,
        status: sourceDeposit.status, // Copy original status
        actualInterest: sourceDeposit.actualInterest, // Copy original actual interest
        notes: sourceDeposit.notes,
        createdAt: new Date(), // reset creation timestamp
        updatedAt: new Date(), // reset update timestamp
      });

      await this.portfolioEntityRepository.manager.save(newDeposit);
    }
  }

  /**
   * Get all public portfolios
   */
  async getPublicPortfolios(): Promise<Portfolio[]> {
    const portfolios = await this.portfolioRepository.find({
      where: { visibility: 'PUBLIC' },
      relations: ['trades', 'cashFlows', 'deposits', 'account', 'account.user'],
      order: { createdAt: 'DESC' }
    });

    // Map portfolios to include creator information
    return portfolios.map(portfolio => {
      const portfolioData = portfolio as any;
      
      // Check if creator is "tungle" and set creatorName to "system"
      if (portfolio.account?.user?.username?.toLowerCase() === 'tungle' || 
          portfolio.account?.user?.username?.toLowerCase() === 'admin' ||
          portfolio.account?.user?.username?.toLowerCase() === 'sadmin') {
        portfolioData.creatorName = 'system';
      } else {
        // Use fullName or email as creatorName
        portfolioData.creatorName = portfolio.account?.user?.username || 
                                   'Unknown';
      }
      
      return portfolioData;
    });
  }

  /**
   * Get all portfolios in the system (for automated snapshot creation)
   */
  async getAllPortfolios(): Promise<Portfolio[]> {
    this.logger.log('Fetching all portfolios for automated snapshot creation');
    
    const portfolios = await this.portfolioRepository.find({
      relations: ['account', 'account.user'],
      order: { createdAt: 'DESC' }
    });

    this.logger.log(`Found ${portfolios.length} portfolios in the system`);
    return portfolios;
  }

  /**
   * Update portfolio visibility
   * @param portfolioId - Portfolio ID
   * @param visibility - New visibility setting
   * @param templateName - Template name for public portfolios
   * @param description - Description for public portfolios
   * @returns Promise<Portfolio> - Updated portfolio
   */
  async updatePortfolioVisibility(
    portfolioId: string, 
    visibility: 'PRIVATE' | 'PUBLIC', 
    templateName?: string, 
    description?: string
  ): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    const updateData: any = { visibility };
    
    if (visibility === 'PUBLIC') {
      updateData.templateName = templateName;
      updateData.description = description;
    } else {
      updateData.templateName = null;
      updateData.description = null;
    }

    Object.assign(portfolio, updateData);
    const updatedPortfolio = await this.portfolioEntityRepository.save(portfolio);

    // Clear cache
    await this.clearPortfolioCache(portfolioId);
    await this.clearAccountCache(portfolio.accountId);

    return updatedPortfolio;
  }

  /**
   * Convert fund to portfolio
   * @param portfolioId - Portfolio ID
   * @returns Promise<Portfolio> - Updated portfolio
   */
  async convertFundToPortfolio(portfolioId: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    if (!portfolio.isFund) {
      throw new BadRequestException(`Portfolio ${portfolioId} is not a fund and cannot be converted`);
    }

    // Convert fund to regular portfolio
    portfolio.isFund = false;
    portfolio.totalOutstandingUnits = 0;
    portfolio.navPerUnit = 0;
    portfolio.numberOfInvestors = 0;
    portfolio.lastNavDate = null;

    const updatedPortfolio = await this.portfolioEntityRepository.save(portfolio);

    // Clear cache
    await this.clearPortfolioCache(portfolioId);
    await this.clearAccountCache(portfolio.accountId);

    return updatedPortfolio;
  }

}
