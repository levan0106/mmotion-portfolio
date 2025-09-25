import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvestorHolding } from '../entities/investor-holding.entity';
import { FundUnitTransaction, HoldingType } from '../entities/fund-unit-transaction.entity';
import { Portfolio } from '../entities/portfolio.entity';
import { Account } from '../../shared/entities/account.entity';
import { CashFlow, CashFlowType, CashFlowStatus } from '../entities/cash-flow.entity';
import { CashFlowService } from './cash-flow.service';
import { NavUtilsService } from './nav-utils.service';
import { PortfolioCalculationService } from './portfolio-calculation.service';
import { DepositCalculationService } from '../../shared/services/deposit-calculation.service';
import { HoldingDetailDto, FundUnitTransactionWithCashFlow, HoldingSummaryDto } from '../dto/holding-detail.dto';

export interface SubscribeToFundDto {
  accountId: string;
  portfolioId: string;
  amount: number;
  description?: string;
}

export interface RedeemFromFundDto {
  accountId: string;
  portfolioId: string;
  units: number;
  description?: string;
}

export interface SubscriptionResult {
  holding: InvestorHolding;
  transaction: FundUnitTransaction;
  cashFlow: CashFlow;
  unitsIssued: number;
  navPerUnit: number;
}

export interface RedemptionResult {
  holding: InvestorHolding;
  transaction: FundUnitTransaction;
  cashFlow: CashFlow;
  unitsRedeemed: number;
  amountReceived: number;
  navPerUnit: number;
}

@Injectable()
export class InvestorHoldingService {
  private readonly logger = new Logger(InvestorHoldingService.name);

  constructor(
    @InjectRepository(InvestorHolding)
    private readonly investorHoldingRepository: Repository<InvestorHolding>,
    @InjectRepository(FundUnitTransaction)
    private readonly fundUnitTransactionRepository: Repository<FundUnitTransaction>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly cashFlowService: CashFlowService,
    private readonly navUtilsService: NavUtilsService,
    private readonly portfolioCalculationService: PortfolioCalculationService,
    private readonly depositCalculationService: DepositCalculationService,
  ) {}

  /**
   * Subscribe to a fund (buy fund units)
   */
  async subscribeToFund(dto: SubscribeToFundDto): Promise<SubscriptionResult> {
    this.logger.log(`Processing fund subscription: ${dto.accountId} -> ${dto.portfolioId}, amount: ${dto.amount}`);

    // 1. Validate inputs
    await this.validateSubscription(dto);

    // 2. Get portfolio and account
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: dto.portfolioId }
    });
    const account = await this.accountRepository.findOne({
      where: { accountId: dto.accountId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio ${dto.portfolioId} not found`);
    }
    if (!account) {
      throw new NotFoundException(`Account ${dto.accountId} not found`);
    }

    // 3. Calculate NAV per unit
    const navPerUnit = Number(await this.calculateNavPerUnit(dto.portfolioId));
    if (navPerUnit <= 0) {
      throw new BadRequestException('Invalid NAV per unit. Fund may not be properly initialized.');
    }

    // 4. Calculate units to be issued
    const unitsIssued = dto.amount / navPerUnit;

    // 5. Create or get holding first
    let holding = await this.investorHoldingRepository.findOne({
      where: { accountId: dto.accountId, portfolioId: dto.portfolioId }
    });

    if (!holding) {
      // Create new holding with initial values
      holding = await this.investorHoldingRepository.save({
        accountId: dto.accountId,
        portfolioId: dto.portfolioId,
        totalUnits: Math.round(unitsIssued * 1000) / 1000, // Set to units issued
        avgCostPerUnit: Math.round(navPerUnit * 1000) / 1000, // Set to current NAV per unit
        totalInvestment: Math.round(dto.amount * 1000) / 1000, // Set to amount invested
        currentValue: Math.round(dto.amount * 1000) / 1000, // Set to amount invested
        unrealizedPnL: 0, // No unrealized P&L initially
        realizedPnL: 0,
      });
    } else {
      // Update existing holding
      // Handle NaN values by treating them as 0 and ensure proper number conversion
      const currentTotalUnits = isNaN(Number(holding.totalUnits)) ? 0 : Number(holding.totalUnits);
      const currentTotalInvestment = isNaN(Number(holding.totalInvestment)) ? 0 : Number(holding.totalInvestment);
      const currentAvgCostPerUnit = isNaN(Number(holding.avgCostPerUnit)) ? navPerUnit : Number(holding.avgCostPerUnit);
      
      const newTotalUnits = currentTotalUnits + unitsIssued;
      const newTotalInvestment = currentTotalInvestment + dto.amount;
      const newAvgCost = newTotalUnits > 0 ? newTotalInvestment / newTotalUnits : navPerUnit;
      const newCurrentValue = newTotalUnits * navPerUnit;
      const newUnrealizedPnL = newCurrentValue - newTotalInvestment;
      
      // Validate calculated values
      if (isNaN(newTotalUnits) || isNaN(newTotalInvestment) || isNaN(newAvgCost) || isNaN(newCurrentValue) || isNaN(newUnrealizedPnL)) {
        this.logger.error(`Invalid calculation result for holding ${holding.holdingId}`);
        throw new BadRequestException('Invalid calculation result. Please contact support.');
      }

      await this.investorHoldingRepository.update(holding.holdingId, {
        totalUnits: Math.round(newTotalUnits * 1000) / 1000, // Round to 3 decimal places
        avgCostPerUnit: Math.round(newAvgCost * 1000) / 1000, // Round to 3 decimal places
        totalInvestment: Math.round(newTotalInvestment * 1000) / 1000, // Round to 3 decimal places
        currentValue: Math.round(newCurrentValue * 1000) / 1000, // Round to 3 decimal places
        unrealizedPnL: Math.round(newUnrealizedPnL * 1000) / 1000, // Round to 3 decimal places
      });

      // Reload holding to get updated values
      holding = await this.investorHoldingRepository.findOne({
        where: { holdingId: holding.holdingId }
      });
    }

    // 6. Create FundUnitTransaction record
    const transaction = await this.fundUnitTransactionRepository.save({
      holdingId: holding.holdingId,
      holdingType: HoldingType.SUBSCRIBE,
      units: Math.round(unitsIssued * 1000) / 1000, // Round to 3 decimal places
      navPerUnit: Math.round(navPerUnit * 1000) / 1000, // Round to 3 decimal places
      amount: Math.round(dto.amount * 1000) / 1000, // Round to 3 decimal places
    });

    // 7. Create CashFlow record with transaction reference
    const cashFlowResult = await this.cashFlowService.createCashFlow(
      dto.portfolioId,
      CashFlowType.DEPOSIT,
      dto.amount,
      `Fund subscription - ${unitsIssued.toFixed(3)} units at ${navPerUnit.toFixed(3)} per unit. ${dto.description}`,
      `${transaction.transactionId}`,
      new Date()
    );
    const cashFlow = cashFlowResult.cashFlow;

    // 8. Update transaction with cash flow ID
    await this.fundUnitTransactionRepository.update(transaction.transactionId, {
      cashFlowId: cashFlow.cashFlowId,
    });


    // 10. Update Portfolio total outstanding units
    await this.portfolioRepository.increment(
      { portfolioId: dto.portfolioId },
      'totalOutstandingUnits',
      Math.round(unitsIssued * 1000) / 1000 // Round to 3 decimal places
    );

    // 11. Update Portfolio NAV per unit
    await this.updatePortfolioNavPerUnit(dto.portfolioId);

    // 12. Update Portfolio numberOfInvestors
    await this.updatePortfolioNumberOfInvestors(dto.portfolioId);

    this.logger.log(`Fund subscription completed: ${unitsIssued.toFixed(3)} units issued at ${navPerUnit.toFixed(3)} per unit`);

    return {
      holding,
      transaction,
      cashFlow,
      unitsIssued,
      navPerUnit,
    };
  }

  /**
   * Redeem from a fund (sell fund units)
   */
  async redeemFromFund(dto: RedeemFromFundDto): Promise<RedemptionResult> {
    this.logger.log(`Processing fund redemption: ${dto.accountId} -> ${dto.portfolioId}, units: ${dto.units}`);

    // 1. Validate inputs
    await this.validateRedemption(dto);

    // 2. Get holding
    const holding = await this.investorHoldingRepository.findOne({
      where: { accountId: dto.accountId, portfolioId: dto.portfolioId }
    });

    if (!holding) {
      throw new NotFoundException('No holding found for this investor in this fund');
    }

    if (holding.totalUnits < dto.units) {
      throw new BadRequestException(`Insufficient units to redeem. Available: ${holding.totalUnits}, Requested: ${dto.units}`);
    }

    // 3. Calculate NAV per unit
    const navPerUnit = Number(await this.calculateNavPerUnit(dto.portfolioId));
    if (navPerUnit <= 0) {
      throw new BadRequestException('Invalid NAV per unit. Fund may not be properly initialized.');
    }

    // 4. Calculate redemption amount
    const amountReceived = dto.units * navPerUnit;

    // 5. Create FundUnitTransaction record first
    const transaction = await this.fundUnitTransactionRepository.save({
      holdingId: holding.holdingId,
      holdingType: HoldingType.REDEEM,
      units: Math.round(dto.units * 1000) / 1000, // Round to 3 decimal places
      navPerUnit: Math.round(navPerUnit * 1000) / 1000, // Round to 3 decimal places
      amount: Math.round(amountReceived * 1000) / 1000, // Round to 3 decimal places
    });

    // 6. Create CashFlow record with transaction reference
    const cashFlowResult = await this.cashFlowService.createCashFlow(
      dto.portfolioId,
      CashFlowType.WITHDRAWAL,
      amountReceived,
      `Fund redemption - ${dto.units.toFixed(3)} units at ${navPerUnit.toFixed(3)} per unit. ${dto.description}`,
      `${transaction.transactionId}`,
      new Date()
    );
    const cashFlow = cashFlowResult.cashFlow;

    // 7. Update transaction with cash flow ID
    await this.fundUnitTransactionRepository.update(transaction.transactionId, {
      cashFlowId: cashFlow.cashFlowId,
    });

    // 8. Update InvestorHolding
    // Handle NaN values by treating them as 0 and ensure proper number conversion
    const currentTotalUnits = isNaN(Number(holding.totalUnits)) ? 0 : Number(holding.totalUnits);
    const currentAvgCostPerUnit = isNaN(Number(holding.avgCostPerUnit)) ? navPerUnit : Number(holding.avgCostPerUnit);
    const currentRealizedPnL = isNaN(Number(holding.realizedPnL)) ? 0 : Number(holding.realizedPnL);
    
    const newTotalUnits = currentTotalUnits - dto.units;
    const realizedPnL = (dto.units * navPerUnit) - (dto.units * currentAvgCostPerUnit);
    const newTotalInvestment = newTotalUnits * currentAvgCostPerUnit;
    const newCurrentValue = newTotalUnits * navPerUnit;
    const newUnrealizedPnL = newCurrentValue - newTotalInvestment;
    const newRealizedPnL = currentRealizedPnL + realizedPnL;

    await this.investorHoldingRepository.update(holding.holdingId, {
      totalUnits: Math.round(newTotalUnits * 1000) / 1000, // Round to 3 decimal places
      totalInvestment: Math.round(newTotalInvestment * 1000) / 1000, // Round to 3 decimal places
      currentValue: Math.round(newCurrentValue * 1000) / 1000, // Round to 3 decimal places
      realizedPnL: Math.round(newRealizedPnL * 1000) / 1000, // Round to 3 decimal places
      unrealizedPnL: Math.round(newUnrealizedPnL * 1000) / 1000, // Round to 3 decimal places
    });

    // Reload holding to get updated values
    const updatedHolding = await this.investorHoldingRepository.findOne({
      where: { holdingId: holding.holdingId }
    });

    // 9. Update Portfolio total outstanding units
    await this.portfolioRepository.decrement(
      { portfolioId: dto.portfolioId },
      'totalOutstandingUnits',
      Math.round(dto.units * 1000) / 1000 // Round to 3 decimal places
    );

    // 10. Update Portfolio NAV per unit
    await this.updatePortfolioNavPerUnit(dto.portfolioId);

    // 11. Update Portfolio numberOfInvestors
    await this.updatePortfolioNumberOfInvestors(dto.portfolioId);

    this.logger.log(`Fund redemption completed: ${dto.units.toFixed(3)} units redeemed at ${navPerUnit.toFixed(3)} per unit`);

    return {
      holding: updatedHolding,
      transaction,
      cashFlow,
      unitsRedeemed: dto.units,
      amountReceived,
      navPerUnit,
    };
  }

  /**
   * Get investor holdings for a specific account
   */
  async getInvestorHoldings(accountId: string): Promise<InvestorHolding[]> {
    return this.investorHoldingRepository.find({
      where: { accountId },
      relations: ['portfolio'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get detailed holding information with transactions
   */
  async getHoldingDetail(holdingId: string): Promise<HoldingDetailDto> {
    // 1. Get holding with relations
    const holding = await this.investorHoldingRepository.findOne({
      where: { holdingId },
      relations: ['account', 'portfolio'],
    });

    if (!holding) {
      throw new NotFoundException(`Holding with ID ${holdingId} not found`);
    }

    // 2. Get all transactions for this holding
    const transactions = await this.fundUnitTransactionRepository.find({
      where: { holdingId },
      order: { createdAt: 'DESC' },
    });

    // 3. Get cash flows for each transaction
    const transactionsWithCashFlow: FundUnitTransactionWithCashFlow[] = [];
    
    for (const transaction of transactions) {
      let cashFlow = null;
      if (transaction.cashFlowId) {
        cashFlow = await this.cashFlowService.getCashFlowById(transaction.cashFlowId);
      }
      
      transactionsWithCashFlow.push({
        transaction,
        cashFlow,
      });
    }

    // 4. Calculate summary
    const summary = this.calculateHoldingSummary(transactionsWithCashFlow, holding);

    return {
      holding,
      transactions: transactionsWithCashFlow,
      summary,
    };
  }

  /**
   * Calculate holding summary statistics
   */
  private calculateHoldingSummary(
    transactions: FundUnitTransactionWithCashFlow[],
    holding: InvestorHolding
  ): HoldingSummaryDto {
    let totalSubscriptions = 0;
    let totalRedemptions = 0;
    let totalUnitsSubscribed = 0;
    let totalUnitsRedeemed = 0;
    let totalAmountInvested = 0;
    let totalAmountReceived = 0;

    for (const { transaction } of transactions) {
      if (transaction.holdingType === HoldingType.SUBSCRIBE) {
        totalSubscriptions++;
        totalUnitsSubscribed += parseFloat(transaction.units.toString());
        totalAmountInvested += parseFloat(transaction.amount.toString());
      } else if (transaction.holdingType === HoldingType.REDEEM) {
        totalRedemptions++;
        totalUnitsRedeemed += parseFloat(transaction.units.toString());
        totalAmountReceived += parseFloat(transaction.amount.toString());
      }
    }

    const netRealizedPnL = holding.realizedPnL || 0;
    const currentUnrealizedPnL = holding.unrealizedPnL || 0;
    const totalPnL = netRealizedPnL + currentUnrealizedPnL;
    const returnPercentage = holding.totalInvestment > 0 ? (totalPnL / holding.totalInvestment) * 100 : 0;

    return {
      totalTransactions: transactions.length,
      totalSubscriptions,
      totalRedemptions,
      totalUnitsSubscribed,
      totalUnitsRedeemed,
      totalAmountInvested,
      totalAmountReceived,
      netRealizedPnL,
      currentUnrealizedPnL,
      totalPnL,
      returnPercentage,
    };
  }

  /**
   * Get all investors in a fund
   */
  async getFundInvestors(portfolioId: string): Promise<InvestorHolding[]> {
    return this.investorHoldingRepository.find({
      where: { portfolioId },
      relations: ['account'],
      order: { totalUnits: 'DESC' }
    });
  }

  /**
   * Get specific holding
   */
  async getHolding(accountId: string, portfolioId: string): Promise<InvestorHolding | null> {
    return this.investorHoldingRepository.findOne({
      where: { accountId, portfolioId },
      relations: ['account', 'portfolio']
    });
  }

  /**
   * Get specific investor holding (throws error if not found)
   */
  async getInvestorHolding(portfolioId: string, accountId: string): Promise<InvestorHolding> {
    const holding = await this.investorHoldingRepository.findOne({
      where: { portfolioId, accountId },
      relations: ['account', 'portfolio']
    });

    if (!holding) {
      throw new NotFoundException(`Investor holding not found for portfolio ${portfolioId} and account ${accountId}`);
    }

    return holding;
  }

  /**
   * Calculate NAV per unit for a fund
   */
  async calculateNavPerUnit(portfolioId: string): Promise<number> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio || !portfolio.isFund) {
      return 0;
    }

    // If no outstanding units yet, use the stored NAV per unit (for new funds)
    if (portfolio.totalOutstandingUnits <= 0) {
      return Number(portfolio.navPerUnit) || 0;
    }

    // Use real-time calculated NAV value instead of stored database value
    const realTimeNavValue = await this.calculateRealTimeNavValue(portfolioId);
    const navPerUnit = realTimeNavValue / portfolio.totalOutstandingUnits;

    this.logger.log(`Calculated NAV per unit for portfolio ${portfolioId}: ${navPerUnit.toFixed(3)} 
    (Real-time NAV: ${realTimeNavValue}) (Total outstanding units: ${portfolio.totalOutstandingUnits})`);

    // Round to 3 decimal places to avoid precision issues
    return Math.round(navPerUnit * 1000) / 1000;
  }

  /**
   * Update Portfolio NAV per unit
   */
  async updatePortfolioNavPerUnit(portfolioId: string): Promise<number> {
    const navPerUnit = await this.calculateNavPerUnit(portfolioId);
    
    await this.portfolioRepository.update(portfolioId, {
      navPerUnit,
    });
    
    return navPerUnit;
  }


  /**
   * Validate subscription request
   */
  private async validateSubscription(dto: SubscribeToFundDto): Promise<void> {
    if (dto.amount <= 0) {
      throw new BadRequestException('Subscription amount must be greater than 0');
    }

    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: dto.portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio ${dto.portfolioId} not found`);
    }

    if (!portfolio.isFund) {
      throw new BadRequestException('Portfolio is not a fund');
    }

    const account = await this.accountRepository.findOne({
      where: { accountId: dto.accountId }
    });

    if (!account) {
      throw new NotFoundException(`Account ${dto.accountId} not found`);
    }

    if (!account.isInvestor) {
      throw new BadRequestException('Account is not authorized to invest in funds');
    }
  }

  /**
   * Validate redemption request
   */
  private async validateRedemption(dto: RedeemFromFundDto): Promise<void> {
    if (dto.units <= 0) {
      throw new BadRequestException('Redemption units must be greater than 0');
    }

    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: dto.portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio ${dto.portfolioId} not found`);
    }

    if (!portfolio.isFund) {
      throw new BadRequestException('Portfolio is not a fund');
    }

    const account = await this.accountRepository.findOne({
      where: { accountId: dto.accountId }
    });

    if (!account) {
      throw new NotFoundException(`Account ${dto.accountId} not found`);
    }

    if (!account.isInvestor) {
      throw new BadRequestException('Account is not authorized to invest in funds');
    }
  }

  /**
   * Convert portfolio to fund
   */
  async convertPortfolioToFund(portfolioId: string): Promise<Portfolio> {
    this.logger.log(`Converting portfolio ${portfolioId} to fund`);

    // 1. Get portfolio
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio ${portfolioId} not found`);
    }

    if (portfolio.isFund) {
      throw new BadRequestException('Portfolio is already a fund');
    }

    // 2. Calculate real-time NAV value
    const realTimeNavValue = await this.calculateRealTimeNavValue(portfolioId);
    
    // Calculate initial units to achieve a reasonable NAV per unit
    let initialUnits: number;
    let navPerUnit: number;
    
    if (realTimeNavValue > 0) {
      // Portfolio has value - calculate units to achieve reasonable NAV per unit (target: 10,000 VND per unit)
      const targetNavPerUnit = 10000; // Target 10,000 VND per unit
      initialUnits = Math.max(1000, Math.round(realTimeNavValue / targetNavPerUnit)); // Minimum 1000 units
      navPerUnit = realTimeNavValue / initialUnits;
    } else {
      // Portfolio không có value - sử dụng NAV per Unit cố định
      initialUnits = 0; // Không tạo units ban đầu
      navPerUnit = 10000; // NAV per Unit cố định 10,000 VND
    }

    // 3. Update portfolio to fund with calculated NAV per unit
    portfolio.isFund = true;
    // Always update units and NAV when converting to fund (isfund changes from false to true)
    portfolio.totalOutstandingUnits = initialUnits;
    portfolio.navPerUnit = navPerUnit;
    portfolio.lastNavDate = new Date(); // Set current timestamp as last NAV date
    // 4. Save portfolio to DB
    const updatedPortfolio = await this.portfolioRepository.save(portfolio);

    this.logger.log(`Portfolio ${portfolioId} converted to fund with ${initialUnits} units at ${navPerUnit.toFixed(3)} NAV per unit (Real-time NAV: ${realTimeNavValue})`);

    return updatedPortfolio;
  }


  /**
   * Calculate real-time NAV value for portfolio
   */
  private async calculateRealTimeNavValue(portfolioId: string): Promise<number> {
    // Get portfolio
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });
    
    if (!portfolio) {
      throw new NotFoundException(`Portfolio ${portfolioId} not found`);
    }

    // Calculate real-time cash balance from cash flows (more accurate than portfolio.cashBalance)
    const realTimeCashBalance = await this.cashFlowService.getCurrentCashBalance(portfolioId);

    // Calculate real-time portfolio values using real-time cash balance
    const calculatedValues = await this.portfolioCalculationService.calculatePortfolioValues(
      portfolioId,
      realTimeCashBalance
    );

    // Calculate deposit values
    const depositData = await this.depositCalculationService.calculateDepositData(portfolioId);

    // NAV should include asset value, deposit value, and real-time cash balance
    const navValue = calculatedValues.totalValue + depositData.totalDepositValue + realTimeCashBalance;
    this.logger.log(`Real-time NAV calculation for ${portfolioId}: ${navValue} (assets: ${calculatedValues.totalValue}, deposits: ${depositData.totalDepositValue}, cash: ${realTimeCashBalance})`);
    
    // Ensure we return a positive value
    return Math.max(navValue, 0);
  }

  /**
   * Refresh NAV per unit calculation and update database
   */
  async refreshNavPerUnit(portfolioId: string, forceRefresh: boolean = false): Promise<{
    portfolioId: string;
    navPerUnit: number;
    totalAllValue: number;
    totalOutstandingUnits: number;
  }> {
    this.logger.log(`Refreshing NAV per unit for portfolio ${portfolioId}`);

    // 1. Get portfolio
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio ${portfolioId} not found`);
    }

    if (!portfolio.isFund) {
      throw new BadRequestException('Portfolio is not a fund');
    }

    // 2. Check if refresh is needed
    const isNavPerUnitValid = this.navUtilsService.isNavPerUnitValid(portfolio.navPerUnit);
    const isNavPerUnitStale = this.navUtilsService.isNavPerUnitStale(portfolio.lastNavDate);
    
    let navPerUnit = portfolio.navPerUnit;
    let realTimeNavValue = 0;
    
    if (!isNavPerUnitValid || isNavPerUnitStale || forceRefresh) {
      // Calculate real-time NAV value
      realTimeNavValue = await this.calculateRealTimeNavValue(portfolioId);
      const outstandingUnits = typeof portfolio.totalOutstandingUnits === 'string' 
        ? parseFloat(portfolio.totalOutstandingUnits) 
        : portfolio.totalOutstandingUnits;

      if (outstandingUnits <= 0) {
        throw new BadRequestException('Total outstanding units must be greater than 0');
      }

      // Calculate new NAV per unit
      navPerUnit = realTimeNavValue / outstandingUnits;
      
      const reason = !isNavPerUnitValid ? 'DB value is zero' : 'DB value is stale';
      this.logger.log(`Refreshing navPerUnit for fund ${portfolioId} (reason: ${reason}, lastNavDate: ${portfolio.lastNavDate})`);
    } else {
      // Use existing DB value
      realTimeNavValue = portfolio.navPerUnit * (typeof portfolio.totalOutstandingUnits === 'string' 
        ? parseFloat(portfolio.totalOutstandingUnits) 
        : portfolio.totalOutstandingUnits);
      this.logger.log(`Using existing navPerUnit for fund ${portfolioId} (lastNavDate: ${portfolio.lastNavDate})`);
    }

    // 4. Update portfolio in database only if we calculated new value
    if (!isNavPerUnitValid || isNavPerUnitStale || forceRefresh) {
      await this.portfolioRepository.update(portfolioId, {
        navPerUnit: navPerUnit,
        lastNavDate: new Date() // Update last NAV date
      });
      this.logger.log(`Updated navPerUnit to ${navPerUnit.toFixed(3)} for fund ${portfolioId} (NAV: ${realTimeNavValue})`);
    }

    const outstandingUnits = typeof portfolio.totalOutstandingUnits === 'string' 
      ? parseFloat(portfolio.totalOutstandingUnits) 
      : portfolio.totalOutstandingUnits;

    return {
      portfolioId,
      navPerUnit,
      totalAllValue: realTimeNavValue,
      totalOutstandingUnits: outstandingUnits
    };
  }

  /**
   * Update numberOfInvestors for a portfolio
   */
  async updatePortfolioNumberOfInvestors(portfolioId: string): Promise<number> {
    try {
      const investorCount = await this.investorHoldingRepository
        .createQueryBuilder('holding')
        .select('COUNT(DISTINCT holding.accountId)', 'count')
        .where('holding.portfolioId = :portfolioId', { portfolioId })
        .getRawOne();

      const numberOfInvestors = parseInt(investorCount?.count || '0', 10);

      await this.portfolioRepository.update(portfolioId, {
        numberOfInvestors: numberOfInvestors
      });

      this.logger.log(`Updated numberOfInvestors to ${numberOfInvestors} for portfolio ${portfolioId}`);

      return numberOfInvestors;
    } catch (error) {
      this.logger.error(`Error updating numberOfInvestors for portfolio ${portfolioId}:`, error);
      return 0;
    }
  }
}
