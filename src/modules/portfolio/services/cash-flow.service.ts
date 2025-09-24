import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
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
   * @returns Promise<CashFlowUpdateResult>
   */
  async recalculateCashBalanceFromAllFlows(portfolioId: string): Promise<CashFlowUpdateResult> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    const oldCashBalance = parseFloat(portfolio.cashBalance.toString());

    // Get all cash flows for this portfolio (including deposits, trades, etc.)
    const allCashFlows = await this.cashFlowRepository.find({
      where: { portfolioId },
      order: { flowDate: 'ASC' }
    });

    // Filter only completed cash flows
    const completedCashFlows = allCashFlows.filter(cashFlow => 
      cashFlow.status === CashFlowStatus.COMPLETED
    );

    // If no cash flows exist, preserve current cash balance
    if (completedCashFlows.length === 0) {
      return {
        portfolioId,
        oldCashBalance,
        newCashBalance: 0,
        cashFlowAmount: 0,
        cashFlowType: 'NO_CASH_FLOWS',
      };
    }

    let calculatedCashBalance = 0; // Start with 0 for complete recalculation


    // Process each cash flow
    for (const cashFlow of completedCashFlows) {
      // Use netAmount which applies correct sign based on cash flow type
      calculatedCashBalance += cashFlow.netAmount;
    }

    // Format calculated cash balance
    const formattedCashBalance = Number(calculatedCashBalance.toFixed(2));

    // Update portfolio cash balance
    portfolio.cashBalance = formattedCashBalance;
    await this.portfolioRepository.save(portfolio);

    console.log(`[CashFlowService] recalculateCashBalanceFromAllFlows called for portfolioId: ${portfolioId}, 
      oldCashBalance: ${oldCashBalance}, newCashBalance: ${formattedCashBalance}`); 

    return {
      portfolioId,
      oldCashBalance,
      newCashBalance: formattedCashBalance,
      cashFlowAmount: Number((formattedCashBalance - oldCashBalance).toFixed(2)),
      cashFlowType: 'RECALCULATION_ALL_FLOWS',
    };
  }

  /**
   * Recalculate cash balance from all trades only
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

    // Start with current cash balance instead of 0
    let calculatedCashBalance = parseFloat(portfolio.cashBalance.toString());

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
    const cashBalance = await this.recalculateCashBalanceFromAllFlows(portfolioId);

    const oldCashBalance = parseFloat(cashBalance.oldCashBalance.toString());
    const newCashBalance = parseFloat(cashBalance.newCashBalance.toString());
    
    // Calculate net amount based on cash flow type
    const isInflow = ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_TRADE', 'DEPOSIT_SETTLEMENT'].includes(type);
    const netAmount = isInflow ? Math.abs(amount) : -Math.abs(amount);


    // Validate cash balance doesn't go negative (only for outflows)
    if (newCashBalance < 0 && !isInflow) {
      throw new BadRequestException('Insufficient cash balance for this operation');
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

    if (startDate) {
      query.andWhere('cashFlow.flowDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('cashFlow.flowDate <= :endDate', { endDate });
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
   * @returns Promise<number>
   */
  async getCurrentCashBalance(portfolioId: string): Promise<number> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Calculate cash balance from all cash flows instead of using database value
    const cashFlows = await this.cashFlowRepository.find({
      where: { portfolioId },
      order: { flowDate: 'ASC' }
    });

    const totalCashFlow = cashFlows.reduce((sum, flow) => {
      // Use netAmount which applies correct sign based on cash flow type
      return sum + flow.netAmount;
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
        newCashBalance += cf.netAmount;
      }

      console.log(`[CashFlowService] createCashFlow called for portfolioId: ${portfolioId}, type: ${type}, 
        amount: ${amount}, description: ${description}, reference: ${reference}, effectiveDate: ${effectiveDate}, 
        currency: ${currency}, fundingSource: ${fundingSource}, currentCashBalance: ${currentCashBalance}, newCashBalance: ${newCashBalance}`); 
      

      // Validate cash balance doesn't go negative (only for outflows, but allow trades)
      const isInflow = [CashFlowType.DEPOSIT, CashFlowType.DIVIDEND, CashFlowType.INTEREST, CashFlowType.SELL_TRADE].includes(type);
      const isTrade = [CashFlowType.BUY_TRADE, CashFlowType.SELL_TRADE].includes(type);
      if (newCashBalance < 0 && !isInflow && !isTrade) {
        throw new BadRequestException('Insufficient cash balance for this operation');
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
    console.log(`[CashFlowService] createCashFlowFromTrade called for tradeId: ${trade.tradeId}, side: ${trade.side}, quantity: ${trade.quantity}, price: ${trade.price}`);
    
    // Delete existing cash flows for this trade first to avoid duplicates (silent - no balance recalculation)
    await this.deleteCashFlowByReferenceIdSilent(trade.tradeId);

    const tradeAmount = parseFloat(trade.totalAmount.toString());
    const fee = parseFloat(trade.fee.toString()) || 0;
    const tax = parseFloat(trade.tax.toString()) || 0;

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
      const result = await this.recalculateCashBalanceFromTrades(cashFlow.portfolioId);

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
          flowDate: updateData.flowDate ? new Date(updateData.flowDate) : cashFlow.flowDate,
          status: updateData.status as CashFlowStatus || cashFlow.status,
          reference: updateData.reference || cashFlow.reference,
          effectiveDate: updateData.effectiveDate ? new Date(updateData.effectiveDate) : cashFlow.effectiveDate,
          fundingSource: updateData.fundingSource?.toUpperCase().trim() || cashFlow.fundingSource,
          updatedAt: new Date(),
        }
      );

      // Recalculate portfolio balance from all cash flows
      await this.recalculateCashBalanceFromAllFlows(portfolioId);

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
      await this.recalculateCashBalanceFromAllFlows(portfolioId);
    });
  }

  /**
   * Delete cash flows by trade ID (when trade is deleted) - with balance recalculation
   */
  async deleteCashFlowAndRecalculateBalanceByReferenceId(referenceId: string): Promise<void> {
    console.log(`[CashFlowService] deleteCashFlowAndRecalculateBalanceByReferenceId called for referenceId: ${referenceId}`);
    
    // Find cash flows with this trade ID as reference
    const cashFlows = await this.cashFlowRepository.find({
      where: { reference: referenceId }
    });

    console.log(`[CashFlowService] Found ${cashFlows.length} cash flows for referenceId: ${referenceId}`);

    if (cashFlows.length === 0) {
      console.log(`[CashFlowService] No cash flows to delete for referenceId: ${referenceId}`);
      return null; // No cash flows to delete
    }

    // Get portfolio ID from first cash flow before deletion
    const portfolioId = cashFlows[0].portfolioId;

    // First, delete cash flows silently
    await this.deleteCashFlowByReferenceIdSilent(referenceId);
    
    // If cash flows were deleted, recalculate balance
    if (portfolioId) {
      await this.recalculateCashBalanceFromAllFlows(portfolioId);
      console.log(`[CashFlowService] Recalculated cash balance after deletion for portfolioId: ${portfolioId}`);
    }
  }

  /**
   * Delete cash flows by trade ID (for avoiding duplicates) - without balance recalculation
   */
  async deleteCashFlowByReferenceIdSilent(referenceId: string): Promise<void> {
    console.log(`[CashFlowService] deleteCashFlowByReferenceIdSilent called for referenceId: ${referenceId}`);
    

    // Delete all cash flows with this trade ID using raw query without transaction
    const deleteResult = await this.dataSource.query(
      'DELETE FROM cash_flows WHERE reference = $1',
      [referenceId]
    );
    console.log(`[CashFlowService] Deleted cash flows for referenceId: ${referenceId} using raw query without transaction`);
    
    // Verify deletion after transaction
    const remainingCashFlows = await this.cashFlowRepository.find({
      where: { reference: referenceId }
    });
    console.log(`[CashFlowService] Remaining cash flows after deletion: ${remainingCashFlows.length}`);
    
  }

  /**
   * Create cash flow from deposit (handles both creation and settlement)
   * Deletes existing cash flows for the deposit before creating new ones
   */
  async createCashFlowFromDeposit( deposit: Deposit ): Promise<void> {
    const amount = (Number(deposit.principal) + Number(deposit.actualInterest || 0));
    const type = deposit.status === 'ACTIVE' ? CashFlowType.DEPOSIT_CREATION : CashFlowType.DEPOSIT_SETTLEMENT;
    
    console.log(`[CashFlowService] createCashFlowFromDeposit called for depositId: ${deposit.depositId}, type: ${type}, amount: ${amount}`);
    
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
    
    console.log(`[CashFlowService] Successfully created cash flow for depositId: ${deposit.depositId}`);
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
}
