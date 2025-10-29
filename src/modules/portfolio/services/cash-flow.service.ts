import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
import { normalizeDateToString, compareDates } from '../utils/date-normalization.util';
import { CashFlow, CashFlowType, CashFlowStatus } from '../entities/cash-flow.entity';
import { Trade, TradeSide } from '../../trading/entities/trade.entity';
import { Asset } from '../../asset/entities/asset.entity';
import { CreateCashFlowDto } from '../dto/cash-flow.dto';
import { Deposit } from '../entities/deposit.entity';

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
  private readonly logger = new Logger(CashFlowService.name);

  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    @InjectRepository(CashFlow)
    private readonly cashFlowRepository: Repository<CashFlow>,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
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
   * Recalculate cash balance from all cash flows (including deposits, trades, etc.)
   * @param portfolioId Portfolio ID
   * @param snapshotDate Snapshot date
   * @returns Promise<CashFlowUpdateResult>
   */
  async recalculateCashBalance(portfolioId: string, snapshotDate?: Date): Promise<CashFlowUpdateResult> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    const oldCashBalance = parseFloat(portfolio.cashBalance.toString());

    // Use getCashBalance to calculate the new balance (centralized logic)
    const calculatedCashBalance = await this.getCashBalance(portfolioId, snapshotDate);

    // Format calculated cash balance
    const formattedCashBalance = Number(calculatedCashBalance.toFixed(2));

    // Update portfolio cash balance
    portfolio.cashBalance = formattedCashBalance;
    await this.portfolioRepository.save(portfolio);

    // Determine cash flow type based on whether there are any cash flows
    const cashFlowType = formattedCashBalance === 0 ? 'NO_CASH_FLOWS' : 'RECALCULATION';

    return {
      portfolioId,
      oldCashBalance,
      newCashBalance: formattedCashBalance,
      cashFlowAmount: Number((formattedCashBalance - oldCashBalance).toFixed(2)),
      cashFlowType,
    };
  }

  // /**
  //  * Recalculate cash balance from all trades only
  //  * @param portfolioId Portfolio ID
  //  * @returns Promise<CashFlowUpdateResult>
  //  */
  // async recalculateCashBalanceFromTrades(portfolioId: string): Promise<CashFlowUpdateResult> {
  //   const portfolio = await this.portfolioRepository.findOne({
  //     where: { portfolioId }
  //   });

  //   if (!portfolio) {
  //     throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
  //   }

  //   const oldCashBalance = parseFloat(portfolio.cashBalance.toString());

  //   // Get all trades for this portfolio
  //   const trades = await this.tradeRepository.find({
  //     where: { portfolioId },
  //     order: { tradeDate: 'ASC' }
  //   });

  //   // Start with current cash balance instead of 0
  //   let calculatedCashBalance = parseFloat(portfolio.cashBalance.toString());

  //   // Process each trade to calculate correct cash balance
  //   for (const trade of trades) {
  //     const tradeAmount = parseFloat(trade.totalAmount.toString());
  //     const fee = parseFloat(trade.fee.toString()) || 0;
  //     const tax = parseFloat(trade.tax.toString()) || 0;
  //     const totalCost = tradeAmount + fee + tax;

  //     if (trade.side === TradeSide.BUY) {
  //       // Buy trade: reduce cash balance
  //       calculatedCashBalance -= totalCost;
  //     } else {
  //       // Sell trade: increase cash balance (after fees and taxes)
  //       const netProceeds = tradeAmount - fee - tax;
  //       calculatedCashBalance += netProceeds;
  //     }
  //   }

  //   // Update portfolio cash balance
  //   portfolio.cashBalance = calculatedCashBalance;
  //   await this.portfolioRepository.save(portfolio);

  //   return {
  //     portfolioId,
  //     oldCashBalance,
  //     newCashBalance: calculatedCashBalance,
  //     cashFlowAmount: calculatedCashBalance - oldCashBalance,
  //     cashFlowType: 'RECALCULATION',
  //   };
  // }

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
    fundingSource?: string,
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
    
    // Create cash flow record
    const cashFlow = this.cashFlowRepository.create({
      portfolioId,
      flowDate,
      amount: Math.abs(amount), // Store absolute amount
      currency: 'VND', // TODO: Should be from portfolio baseCurrency
      type: type as any,
      description,
      fundingSource: fundingSource?.toUpperCase().trim(),
    });

    await this.cashFlowRepository.save(cashFlow);

    // implement get cashbalance from all cash flows
    const cashBalance = await this.recalculateCashBalance(portfolioId);

    const oldCashBalance = parseFloat(cashBalance.oldCashBalance.toString());
    const newCashBalance = parseFloat(cashBalance.newCashBalance.toString());
    
    // Calculate net amount based on cash flow type
    const isInflow = ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_TRADE', 'DEPOSIT_SETTLEMENT'].includes(type);
    const netAmount = isInflow ? Math.abs(amount) : -Math.abs(amount);


    // Validate cash balance doesn't go negative (only for outflows)
    if (newCashBalance < 0 && !isInflow) {
      // TODO: Handle this case
      // throw new BadRequestException('Insufficient cash balance for this operation');
    }

    // Update portfolio cash balance
    portfolio.cashBalance = newCashBalance;
    await this.portfolioRepository.save(portfolio);

    return {
      portfolioId,
      oldCashBalance,
      newCashBalance,
      cashFlowAmount: netAmount,
      cashFlowType: type,
    };
  }

  /**
   * Get cash flow history for a portfolio
   * @param portfolioId Portfolio ID
   * @param startDate Start date (optional)
   * @param endDate End date (optional)
   * @param page Page number (default: 1)
   * @param limit Items per page (default: 10)
   * @returns Promise<{data: CashFlow[], pagination: {page: number, limit: number, total: number, totalPages: number}}>
   */
  async getCashFlowHistory(
    portfolioId: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: CashFlow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const query = this.cashFlowRepository
      .createQueryBuilder('cashFlow')
      .where('cashFlow.portfolioId = :portfolioId', { portfolioId })
      .orderBy('cashFlow.flowDate', 'DESC');
    
    let startOfDay = startDate;
    if (startDate) {
      startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0); // Set to start of day
    }

    let endOfDay = endDate;
    if (endDate) {
      endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999); // Set to end of day
    }


    if (startOfDay) {
      query.andWhere('cashFlow.flowDate >= :startDate', { startDate: startOfDay });
    }

    if (endOfDay) {
      query.andWhere('cashFlow.flowDate <= :endDate', { endDate: endOfDay });
    }

    // Get total count for pagination
    const total = await query.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    const data = await query.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get current cash balance for a portfolio
   * @param portfolioId Portfolio ID
   * @param snapshotDate Snapshot date
   * @returns Promise<number>
   */
  async getCashBalance(portfolioId: string, snapshotDate?: Date): Promise<number> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Calculate cash balance from completed cash flows only
    const queryBuilder = this.cashFlowRepository
      .createQueryBuilder('cashFlow')
      .where('cashFlow.portfolioId = :portfolioId', { portfolioId })
      .andWhere('cashFlow.status = :status', { status: CashFlowStatus.COMPLETED })
      .orderBy('cashFlow.flowDate', 'ASC');
    
    if (snapshotDate) {
      // Use consistent date comparison - set to end of day to include all flows on that date
      const endOfDay = new Date(snapshotDate);
      endOfDay.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('cashFlow.flowDate <= :snapshotDate', { snapshotDate: endOfDay });
    }
    
    const cashFlows = await queryBuilder.getMany();

    const totalCashFlow = cashFlows.reduce((sum, flow) => {
      // Use netAmount which applies correct sign based on cash flow type
      return sum + Number(flow.netAmount);
    }, 0);

    return totalCashFlow;
  }

  /**
   * Recalculate cash balance from all cash flows
   * @param portfolioId Portfolio ID
   * @returns Promise<number> Recalculated cash balance
   */
  /*
    async recalculateCashBalance(portfolioId: string): Promise<number> {
    const cashFlows = await this.cashFlowRepository.find({
      where: { portfolioId },
      order: { flowDate: 'ASC' }
    });

    const totalCashFlow = cashFlows.reduce((sum, flow) => {
      // Use netAmount which applies correct sign based on cash flow type
      return sum + parseFloat(flow.netAmount.toString());
    }, 0);

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
*/

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
    currency?: string,
    fundingSource?: string,
  ): Promise<CashFlowCreateResult> {
    // Validate portfolio exists
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Format and validate amount (allow negative for BUY_TRADE)
    const formattedAmount = Number(amount.toFixed(2));
    if (formattedAmount === 0) {
      throw new BadRequestException('Amount cannot be zero');
    }

    // Use transaction to ensure consistency
    return await this.dataSource.transaction(async (manager) => {
      // Get current cash balance
      const currentCashBalance = parseFloat(portfolio.cashBalance.toString());

      // Create cash flow
      const cashFlow = manager.create(CashFlow, {
        portfolioId,
        type,
        amount: formattedAmount,
        description,
        reference,
        status: CashFlowStatus.COMPLETED,
        flowDate: effectiveDate || new Date(), // Use effectiveDate as flowDate
        effectiveDate: effectiveDate || new Date(),
        currency: currency || portfolio.baseCurrency || 'VND',
        fundingSource: fundingSource?.toUpperCase().trim(),
      });

      const savedCashFlow = await manager.save(cashFlow);

      // Calculate cash balance within transaction using manager
      const allCashFlows = await manager.find(CashFlow, {
        where: { portfolioId },
        order: { flowDate: 'ASC' }
      });

      // Filter only completed cash flows
      const completedCashFlows = allCashFlows.filter(cashFlow => 
        cashFlow.status === CashFlowStatus.COMPLETED
      );

      // Calculate new cash balance from all completed cash flows
      let newCashBalance = 0;
      for (const cf of completedCashFlows) {
        newCashBalance += Number(cf.netAmount);
      }

      // Validate cash balance doesn't go negative (only for outflows, but allow trades)
      const isInflow = [CashFlowType.DEPOSIT, CashFlowType.DIVIDEND, CashFlowType.INTEREST, CashFlowType.SELL_TRADE].includes(type);
      const isTrade = [CashFlowType.BUY_TRADE, CashFlowType.SELL_TRADE].includes(type);
      if (newCashBalance < 0 && !isInflow && !isTrade) {
        // TODO: Handle this case
        // throw new BadRequestException('Insufficient cash balance for this operation');
      }

      // Update portfolio cash balance within transaction
      await manager.update(Portfolio, 
        { portfolioId }, 
        { cashBalance: newCashBalance }
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
    
    // Delete existing cash flows for this trade first to avoid duplicates (silent - no balance recalculation)
    await this.deleteCashFlowByReferenceIdSilent(trade.tradeId);

    const tradeAmount = parseFloat(trade.totalAmount.toString());
    const fee = parseFloat(trade.fee.toString()) || 0;
    const tax = parseFloat(trade.tax.toString()) || 0;


    // If trade has zero price and no fees/taxes, no cash flow is needed
    if (tradeAmount === 0 && fee === 0 && tax === 0) {
      return {
        cashFlow: null,
        oldCashBalance: 0,
        newCashBalance: 0,
        portfolioUpdated: false,
      };
    }

    // Load asset information
    const asset = await this.assetRepository.findOne({
      where: { id: trade.assetId }
    });

    let type: CashFlowType;
    let amount: number;
    let description: string;

    if (trade.side === TradeSide.BUY) {
      type = CashFlowType.BUY_TRADE;
      amount = Number((tradeAmount + fee + tax).toFixed(2)); // Positive amount, netAmount will be negative
      description = `BUY ${Number(trade.quantity).toFixed(asset?.symbol in ['USDT', 'USDC','BTC','ETH','SOL'] ? 5 : 2)} shares of ${asset?.symbol || 'asset'} at ${Number(trade.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} [TradeID: ${trade.tradeId}]`;
    } else {
      type = CashFlowType.SELL_TRADE;
      amount = Number((tradeAmount - fee - tax).toFixed(2)); // Positive amount, netAmount will be positive
      description = `SELL ${Number(trade.quantity).toFixed(asset?.symbol in ['USDT', 'USDC','BTC','ETH','SOL'] ? 5 : 2)} shares of ${asset?.symbol || 'asset'} at ${Number(trade.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} [TradeID: ${trade.tradeId}]`;
    }

    return await this.createCashFlow(
      trade.portfolioId,
      type,
      amount,
      description,
      trade.tradeId,
      trade.tradeDate, // Use trade date as flowDate
      'VND', // TODO: Default currency for trades
      trade.fundingSource, // Pass fundingSource from trade
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
      const result = await this.recalculateCashBalance(cashFlow.portfolioId);

      return {
        cashFlow: { ...cashFlow, status: CashFlowStatus.CANCELLED } as CashFlow,
        oldCashBalance: result.oldCashBalance,
        newCashBalance: result.newCashBalance,
        portfolioUpdated: true,
      };
    });
  }

  /**
   * Update an existing cash flow.
   */
  async updateCashFlow(
    portfolioId: string,
    cashFlowId: string,
    updateData: CreateCashFlowDto,
  ): Promise<CashFlow> {
    const cashFlow = await this.cashFlowRepository.findOne({
      where: { cashFlowId, portfolioId },
    });

    if (!cashFlow) {
      throw new NotFoundException('Cash flow not found');
    }

    if (cashFlow.status === CashFlowStatus.CANCELLED) {
      throw new BadRequestException('Cannot update cancelled cash flow');
    }

    return await this.dataSource.transaction(async (manager) => {
      // Update cash flow
      await manager.update(CashFlow, 
        { cashFlowId }, 
        {
          type: updateData.type as CashFlowType,
          amount: updateData.amount,
          currency: updateData.currency,
          description: updateData.description,
          // Fix timezone issue: append 'T12:00:00' to ensure local time interpretation
          flowDate: updateData.flowDate ? new Date(updateData.flowDate + 'T12:00:00') : cashFlow.flowDate,
          status: updateData.status as CashFlowStatus || cashFlow.status,
          reference: updateData.reference || cashFlow.reference,
          effectiveDate: updateData.effectiveDate ? new Date(updateData.effectiveDate) : cashFlow.effectiveDate,
          fundingSource: updateData.fundingSource?.toUpperCase().trim() || cashFlow.fundingSource,
          updatedAt: new Date(),
        }
      );

      // Recalculate portfolio balance from all cash flows
      await this.recalculateCashBalance(portfolioId);

      // Return updated cash flow
      return await manager.findOne(CashFlow, { where: { cashFlowId } });
    });
  }

  /**
   * Delete an existing cash flow.
   */
  async deleteCashFlow(portfolioId: string, cashFlowId: string): Promise<void> {
    const cashFlow = await this.cashFlowRepository.findOne({
      where: { cashFlowId, portfolioId },
    });

    if (!cashFlow) {
      throw new NotFoundException('Cash flow not found');
    }

    // Allow deletion of cancelled cash flows
    // Only prevent deletion if it's a critical business rule violation
    // For now, we allow deletion of any cash flow regardless of status

    await this.dataSource.transaction(async (manager) => {
      // Delete cash flow
      await manager.delete(CashFlow, { cashFlowId });

      // Recalculate portfolio balance from all cash flows
      await this.recalculateCashBalance(portfolioId);
    });
  }

  /**
   * Delete cash flows by trade ID (when trade is deleted) - with balance recalculation
   */
  async deleteCashFlowAndRecalculateBalanceByReferenceId(referenceId: string): Promise<void> {
    
    // Find cash flows with this trade ID as reference
    const cashFlows = await this.cashFlowRepository.find({
      where: { reference: referenceId }
    });


    if (cashFlows.length === 0) {
      return null; // No cash flows to delete
    }

    // Get portfolio ID from first cash flow before deletion
    const portfolioId = cashFlows[0].portfolioId;

    // First, delete cash flows silently
    await this.deleteCashFlowByReferenceIdSilent(referenceId);
    
    // If cash flows were deleted, recalculate balance
    if (portfolioId) {
      await this.recalculateCashBalance(portfolioId);
    }
  }

  /**
   * Delete cash flows by trade ID (for avoiding duplicates) - without balance recalculation
   */
  async deleteCashFlowByReferenceIdSilent(referenceId: string): Promise<void> {
    

    // Delete all cash flows with this trade ID using raw query without transaction
    const deleteResult = await this.dataSource.query(
      'DELETE FROM cash_flows WHERE reference = $1',
      [referenceId]
    );
    
    // Verify deletion after transaction
    const remainingCashFlows = await this.cashFlowRepository.find({
      where: { reference: referenceId }
    });
    
  }

  /**
   * Create cash flow from deposit (handles both creation and settlement)
   * Deletes existing cash flows for the deposit before creating new ones
   */
  async createCashFlowFromDeposit( deposit: Deposit ): Promise<void> {
    const amount = (Number(deposit.principal) + Number(deposit.actualInterest || 0));
    const type = deposit.status === 'ACTIVE' ? CashFlowType.DEPOSIT_CREATION : CashFlowType.DEPOSIT_SETTLEMENT;
    
    
    const referenceId = this.formatReferenceId(deposit.depositId, deposit.status);

    // First, delete any existing cash flows for this deposit
    await this.deleteCashFlowByReferenceIdSilent(referenceId);
    
    // Format description based on type and amount
    const description = this.formatDepositDescription(type, Math.abs(amount), deposit.bankName, deposit.depositId);
    // Then create the new cash flow
    await this.createCashFlow(
      deposit.portfolioId, 
      type, 
      amount, 
      description,  
      referenceId,
      type === CashFlowType.DEPOSIT_CREATION ? deposit.startDate : deposit.settledAt,
      'VND', // Default currency for deposits
      deposit.bankName, // Pass fundingSource from deposit
    );
    
  }

  /**
   * Get cash flow by ID
   */
  async getCashFlowById(cashFlowId: string): Promise<CashFlow | null> {
    return this.cashFlowRepository.findOne({
      where: { cashFlowId },
    });
  }

  /**
   * Format deposit description based on type
   */
  private formatDepositDescription(
    type: CashFlowType,
    amount: number,
    bankName: string,
    depositId: string,
  ): string {
    const formattedAmount = Math.abs(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    
    return `${type === CashFlowType.DEPOSIT_CREATION ? 'DEPOSIT' : 'WITHDRAWAL'} ${formattedAmount} at ${bankName} [TradeID: ${depositId}]`;
  }

  formatReferenceId(referenceId: string, type: string): string {
    return (referenceId +"_"+ type).substring(0, 50);
  }

  /**
   * Transfer cash between funding sources
   * Creates two cash flows: one withdrawal from source and one deposit to destination
   */
  async transferCash(
    portfolioId: string,
    fromSource: string,
    toSource: string,
    amount: number,
    description?: string,
    transferDate?: Date,
  ): Promise<{
    withdrawalCashFlow: CashFlow;
    depositCashFlow: CashFlow;
    oldCashBalance: number;
    newCashBalance: number;
  }> {
    if (fromSource === toSource) {
      throw new BadRequestException('Source and destination funding sources cannot be the same');
    }

    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than 0');
    }

    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    const oldCashBalance = parseFloat(portfolio.cashBalance.toString());
    const transferDateToUse = transferDate || new Date();
    const transferDescription = description || `Transfer from ${fromSource} to ${toSource}`;

    return await this.dataSource.transaction(async (manager) => {
      // Create withdrawal cash flow from source
      const withdrawalCashFlow = manager.create(CashFlow, {
        portfolioId,
        type: CashFlowType.WITHDRAWAL,
        amount: amount,
        description: `${transferDescription} - Withdrawal from ${fromSource}`,
        status: CashFlowStatus.COMPLETED,
        flowDate: transferDateToUse,
        effectiveDate: transferDateToUse,
        currency: portfolio.baseCurrency || 'VND',
        fundingSource: fromSource,
        reference: `TRANSFER_${Date.now()}_FROM`,
      });

      // Create deposit cash flow to destination
      const depositCashFlow = manager.create(CashFlow, {
        portfolioId,
        type: CashFlowType.DEPOSIT,
        amount: amount,
        description: `${transferDescription} - Deposit to ${toSource}`,
        status: CashFlowStatus.COMPLETED,
        flowDate: transferDateToUse,
        effectiveDate: transferDateToUse,
        currency: portfolio.baseCurrency || 'VND',
        fundingSource: toSource,
        reference: `TRANSFER_${Date.now()}_TO`,
      });

      // Save both cash flows
      const savedWithdrawal = await manager.save(withdrawalCashFlow);
      const savedDeposit = await manager.save(depositCashFlow);

      // Recalculate portfolio balance
      const allCashFlows = await manager.find(CashFlow, {
        where: { portfolioId },
        order: { flowDate: 'ASC' }
      });

      const completedCashFlows = allCashFlows.filter(cashFlow => 
        cashFlow.status === CashFlowStatus.COMPLETED
      );

      let newCashBalance = 0;
      for (const cf of completedCashFlows) {
        newCashBalance += cf.netAmount;
      }

      // Update portfolio cash balance
      await manager.update(Portfolio, 
        { portfolioId }, 
        { cashBalance: newCashBalance }
      );

      return {
        withdrawalCashFlow: savedWithdrawal,
        depositCashFlow: savedDeposit,
        oldCashBalance,
        newCashBalance,
      };
    });
  }

  /**
   * Get the first transaction date for a portfolio (from cashflows and trades)
   * @param portfolioId Portfolio ID
   * @returns Promise<Date | null>
   */
  async getFirstTransactionDate(portfolioId: string): Promise<Date | null> {
    try {
      // Get first cashflow date
      const firstCashFlow = await this.cashFlowRepository
        .createQueryBuilder('cashFlow')
        .select('MIN(cashFlow.flowDate)', 'firstCashFlowDate')
        .where('cashFlow.portfolioId = :portfolioId', { portfolioId })
        .getRawOne();

      // Get first trade date
      const firstTrade = await this.tradeRepository
        .createQueryBuilder('trade')
        .select('MIN(trade.tradeDate)', 'firstTradeDate')
        .where('trade.portfolioId = :portfolioId', { portfolioId })
        .getRawOne();

      // this.logger.log(`getFirstTransactionDate: First cash flow date: ${firstCashFlow?.firstCashFlowDate}`);
      // this.logger.log(`getFirstTransactionDate: First trade date: ${firstTrade?.firstTradeDate}`);
      const cashFlowDate = firstCashFlow?.firstCashFlowDate ? new Date(firstCashFlow.firstCashFlowDate) : null;
      const tradeDate = firstTrade?.firstTradeDate ? new Date(firstTrade.firstTradeDate) : null;


      // this.logger.log(`getFirstTransactionDate: Cash flow date: ${cashFlowDate}`);
      // this.logger.log(`getFirstTransactionDate: Trade date: ${tradeDate}`);

      // Return the earliest date between cashflow and trade
      if (cashFlowDate && tradeDate) {
        return cashFlowDate < tradeDate ? cashFlowDate : tradeDate;
      } else if (cashFlowDate) {
        return cashFlowDate;
      } else if (tradeDate) {
        return tradeDate;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}
