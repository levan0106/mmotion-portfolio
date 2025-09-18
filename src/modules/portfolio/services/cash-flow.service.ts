import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
import { CashFlow } from '../entities/cash-flow.entity';
import { Trade, TradeSide } from '../../trading/entities/trade.entity';

export interface CashFlowUpdateResult {
  portfolioId: string;
  oldCashBalance: number;
  newCashBalance: number;
  cashFlowAmount: number;
  cashFlowType: string;
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
      type: cashFlowType,
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
      type,
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
}
