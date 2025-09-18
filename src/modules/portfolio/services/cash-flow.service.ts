import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
import { CashFlow, CashFlowType, CashFlowStatus } from '../entities/cash-flow.entity';
import { Trade, TradeSide } from '../../trading/entities/trade.entity';

export interface CashFlowUpdateResult {
  portfolioId: string;
  oldCashBalance: number;
  newCashBalance: number;
  cashFlowAmount: number;
  cashFlowType: string;
}

export interface CashFlowCreateResult {
  cashFlow: CashFlow;
  oldCashBalance: number;
  newCashBalance: number;
  portfolioUpdated: boolean;
}

/**
 * Service for managing cash flows and portfolio cash balance.
 * Handles cash balance updates from trades and manual cash flow operations.
 */
@Injectable()
export class CashFlowService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    @InjectRepository(CashFlow)
    private readonly cashFlowRepository: Repository<CashFlow>,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Update portfolio cash balance from a trade
   * @param trade Trade that affects cash balance
   * @returns Promise<CashFlowUpdateResult>
   */
  async updateCashBalanceFromTrade(trade: Trade): Promise<CashFlowUpdateResult> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: trade.portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${trade.portfolioId} not found`);
    }

    const oldCashBalance = parseFloat(portfolio.cashBalance.toString());
    const tradeAmount = parseFloat(trade.totalAmount.toString());
    const fee = parseFloat(trade.fee.toString()) || 0;
    const tax = parseFloat(trade.tax.toString()) || 0;
    const totalCost = tradeAmount + fee + tax;

    let cashFlowAmount: number;
    let cashFlowType: string;

    if (trade.side === TradeSide.BUY) {
      // Buy trade: cash outflow (negative)
      cashFlowAmount = -totalCost;
      cashFlowType = 'BUY_TRADE';
    } else {
      // Sell trade: cash inflow (positive)
      cashFlowAmount = tradeAmount - fee - tax;
      cashFlowType = 'SELL_TRADE';
    }

    const newCashBalance = oldCashBalance + cashFlowAmount;

    // Update portfolio cash balance
    portfolio.cashBalance = newCashBalance;
    await this.portfolioRepository.save(portfolio);

    // Create cash flow record
    const cashFlow = this.cashFlowRepository.create({
      portfolioId: trade.portfolioId,
      flowDate: trade.tradeDate,
      amount: cashFlowAmount,
      currency: 'VND', // Default currency, should be from portfolio
      type: cashFlowType as any,
      description: `${trade.side} ${trade.quantity} shares of ${trade.asset?.symbol || 'asset'} at ${trade.price}`,
    });

    await this.cashFlowRepository.save(cashFlow);

    return {
      portfolioId: trade.portfolioId,
      oldCashBalance,
      newCashBalance,
      cashFlowAmount,
      cashFlowType,
    };
  }

  /**
   * Recalculate cash balance from all trades
   * @param portfolioId Portfolio ID
   * @returns Promise<CashFlowUpdateResult>
   */
  async recalculateCashBalanceFromTrades(portfolioId: string): Promise<CashFlowUpdateResult> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    const oldCashBalance = parseFloat(portfolio.cashBalance.toString());

    // Get all trades for this portfolio
    const trades = await this.tradeRepository.find({
      where: { portfolioId },
      order: { tradeDate: 'ASC' }
    });

    let calculatedCashBalance = 0; // Start with 0, assuming no initial cash

    // Process each trade to calculate correct cash balance
    for (const trade of trades) {
      const tradeAmount = parseFloat(trade.totalAmount.toString());
      const fee = parseFloat(trade.fee.toString()) || 0;
      const tax = parseFloat(trade.tax.toString()) || 0;
      const totalCost = tradeAmount + fee + tax;

      if (trade.side === TradeSide.BUY) {
        // Buy trade: reduce cash balance
        calculatedCashBalance -= totalCost;
      } else {
        // Sell trade: increase cash balance (after fees and taxes)
        const netProceeds = tradeAmount - fee - tax;
        calculatedCashBalance += netProceeds;
      }
    }

    // Update portfolio cash balance
    portfolio.cashBalance = calculatedCashBalance;
    await this.portfolioRepository.save(portfolio);

    return {
      portfolioId,
      oldCashBalance,
      newCashBalance: calculatedCashBalance,
      cashFlowAmount: calculatedCashBalance - oldCashBalance,
      cashFlowType: 'RECALCULATION',
    };
  }

  /**
   * Add manual cash flow (deposit, withdrawal, dividend, etc.)
   * @param portfolioId Portfolio ID
   * @param amount Cash flow amount (positive for inflow, negative for outflow)
   * @param type Cash flow type
   * @param description Description
   * @param flowDate Flow date (optional, defaults to now)
   * @returns Promise<CashFlowUpdateResult>
   */
  async addManualCashFlow(
    portfolioId: string,
    amount: number,
    type: string,
    description: string,
    flowDate: Date = new Date(),
  ): Promise<CashFlowUpdateResult> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    if (amount === 0) {
      throw new BadRequestException('Cash flow amount cannot be zero');
    }

    const oldCashBalance = parseFloat(portfolio.cashBalance.toString());
    const newCashBalance = oldCashBalance + amount;

    // Validate cash balance doesn't go negative (unless it's a withdrawal)
    if (newCashBalance < 0 && type !== 'WITHDRAWAL') {
      throw new BadRequestException('Insufficient cash balance for this operation');
    }

    // Update portfolio cash balance
    portfolio.cashBalance = newCashBalance;
    await this.portfolioRepository.save(portfolio);

    // Create cash flow record
    const cashFlow = this.cashFlowRepository.create({
      portfolioId,
      flowDate,
      amount,
      currency: 'VND', // Should be from portfolio baseCurrency
      type: type as any,
      description,
    });

    await this.cashFlowRepository.save(cashFlow);

    return {
      portfolioId,
      oldCashBalance,
      newCashBalance,
      cashFlowAmount: amount,
      cashFlowType: type,
    };
  }

  /**
   * Get cash flow history for a portfolio
   * @param portfolioId Portfolio ID
   * @param startDate Start date (optional)
   * @param endDate End date (optional)
   * @returns Promise<CashFlow[]>
   */
  async getCashFlowHistory(
    portfolioId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CashFlow[]> {
    const query = this.cashFlowRepository
      .createQueryBuilder('cashFlow')
      .where('cashFlow.portfolioId = :portfolioId', { portfolioId })
      .orderBy('cashFlow.flowDate', 'DESC');

    if (startDate) {
      query.andWhere('cashFlow.flowDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('cashFlow.flowDate <= :endDate', { endDate });
    }

    return await query.getMany();
  }

  /**
   * Get current cash balance for a portfolio
   * @param portfolioId Portfolio ID
   * @returns Promise<number>
   */
  async getCurrentCashBalance(portfolioId: string): Promise<number> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    return parseFloat(portfolio.cashBalance.toString());
  }

  /**
   * Recalculate cash balance from all cash flows
   * @param portfolioId Portfolio ID
   * @returns Promise<number> Recalculated cash balance
   */
  async recalculateCashBalance(portfolioId: string): Promise<number> {
    const cashFlows = await this.cashFlowRepository.find({
      where: { portfolioId },
      order: { flowDate: 'ASC' }
    });

    const totalCashFlow = cashFlows.reduce((sum, flow) => sum + parseFloat(flow.amount.toString()), 0);

    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Update portfolio with recalculated balance
    portfolio.cashBalance = totalCashFlow;
    await this.portfolioRepository.save(portfolio);

    return totalCashFlow;
  }

  /**
   * Create a new cash flow and automatically update portfolio balance
   */
  async createCashFlow(
    portfolioId: string,
    type: CashFlowType,
    amount: number,
    description: string,
    reference?: string,
    effectiveDate?: Date,
  ): Promise<CashFlowCreateResult> {
    // Validate portfolio exists
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // Use transaction to ensure consistency
    return await this.dataSource.transaction(async (manager) => {
      // Get current cash balance
      const currentCashBalance = parseFloat(portfolio.cashBalance.toString());

      // Create cash flow
      const cashFlow = manager.create(CashFlow, {
        portfolioId,
        type,
        amount,
        description,
        reference,
        status: CashFlowStatus.COMPLETED,
        flowDate: new Date(),
        effectiveDate: effectiveDate || new Date(),
      });

      const savedCashFlow = await manager.save(cashFlow);

      // Calculate new cash balance
      const netAmount = savedCashFlow.netAmount;
      const newCashBalance = currentCashBalance + netAmount;

      // Update portfolio cash balance
      await manager.update(Portfolio, 
        { portfolioId }, 
        { 
          cashBalance: newCashBalance,
          updatedAt: new Date()
        }
      );

      return {
        cashFlow: savedCashFlow,
        oldCashBalance: currentCashBalance,
        newCashBalance: newCashBalance,
        portfolioUpdated: true,
      };
    });
  }

  /**
   * Create cash flow from trade (for trade settlements)
   */
  async createCashFlowFromTrade(trade: Trade): Promise<CashFlowCreateResult> {
    const tradeAmount = parseFloat(trade.totalAmount.toString());
    const fee = parseFloat(trade.fee.toString()) || 0;
    const tax = parseFloat(trade.tax.toString()) || 0;

    let type: CashFlowType;
    let amount: number;
    let description: string;

    if (trade.side === TradeSide.BUY) {
      type = CashFlowType.TRADE_SETTLEMENT;
      amount = tradeAmount + fee + tax;
      description = `Trade settlement: BUY ${trade.quantity} ${trade.asset?.symbol || 'asset'} @ ${trade.price}`;
    } else {
      type = CashFlowType.TRADE_SETTLEMENT;
      amount = tradeAmount - fee - tax;
      description = `Trade settlement: SELL ${trade.quantity} ${trade.asset?.symbol || 'asset'} @ ${trade.price}`;
    }

    return await this.createCashFlow(
      trade.portfolioId,
      type,
      amount,
      description,
      trade.tradeId,
      trade.tradeDate,
    );
  }

  /**
   * Cancel a cash flow and recalculate balance
   */
  async cancelCashFlow(cashFlowId: string): Promise<CashFlowCreateResult> {
    const cashFlow = await this.cashFlowRepository.findOne({
      where: { cashFlowId }
    });

    if (!cashFlow) {
      throw new NotFoundException(`Cash flow with ID ${cashFlowId} not found`);
    }

    if (cashFlow.status === CashFlowStatus.CANCELLED) {
      throw new BadRequestException('Cash flow is already cancelled');
    }

    return await this.dataSource.transaction(async (manager) => {
      // Update cash flow status
      await manager.update(CashFlow, 
        { cashFlowId }, 
        { 
          status: CashFlowStatus.CANCELLED,
          updatedAt: new Date()
        }
      );

      // Recalculate portfolio balance
      const result = await this.recalculateCashBalanceFromTrades(cashFlow.portfolioId);

      return {
        cashFlow: { ...cashFlow, status: CashFlowStatus.CANCELLED } as CashFlow,
        oldCashBalance: result.oldCashBalance,
        newCashBalance: result.newCashBalance,
        portfolioUpdated: true,
      };
    });
  }
}
