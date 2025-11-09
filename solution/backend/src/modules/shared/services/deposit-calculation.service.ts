import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deposit } from '../../portfolio/entities/deposit.entity';

export interface DepositCalculationData {
  totalDepositPrincipal: number;
  totalDepositInterest: number;
  totalDepositValue: number;
  totalDepositCount: number;
  unrealizedDepositPnL: number;
  realizedDepositPnL: number;
}

/**
 * Shared service for calculating deposit-related metrics
 * This service is designed to break circular dependencies between modules
 */
@Injectable()
export class DepositCalculationService {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
  ) {}

  private async calculateDepositsData(deposits: Deposit[], snapshotDate?: Date): Promise<DepositCalculationData> {
    
    let totalDepositPrincipal = 0;
    let totalDepositInterest = 0;
    let totalDepositValue = 0;
    let totalDepositCount = 0;
    let unrealizedDepositPnL = 0;
    let realizedDepositPnL = 0;
    
    const originalCount = deposits.length;
    console.log(`🔍 DEBUG: Snapshot date:`, snapshotDate);

    // Filter deposits that were active on or before snapshot date
    if (snapshotDate) {
      const startDate = new Date(snapshotDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(snapshotDate);
      endDate.setHours(23, 59, 59, 999);

      deposits = deposits.filter(deposit => {
        // Include deposits that started on or before snapshot date
        const startedOnOrBefore = new Date(deposit.startDate) <= endDate;
        // Include deposits that are either not settled yet OR were settled after snapshot date
        const isActiveOnSnapshotDate = !deposit.settledAt || new Date(deposit.settledAt) > startDate;
        console.log(`🔍 DEBUG: Deposit ${deposit.depositId}:`, deposit.startDate, startedOnOrBefore, deposit.settledAt, isActiveOnSnapshotDate);
        return startedOnOrBefore && isActiveOnSnapshotDate;
      });
      totalDepositCount = deposits.length;
    }

    console.log(`🔍 DEBUG: Deposits after filtering:${originalCount} -> ${deposits.length}`);

    deposits.forEach(deposit => {
      const principal = typeof deposit.principal === 'string' 
        ? parseFloat(deposit.principal) 
        : (deposit.principal || 0);
      
      const interestRate = typeof deposit.interestRate === 'string' 
        ? parseFloat(deposit.interestRate) 
        : (deposit.interestRate || 0);

      if (deposit.status === 'ACTIVE' || deposit.status === 'SETTLED') {
        // Only count principal for active deposits
        totalDepositPrincipal += principal;

        // For active deposits, calculate accrued interest unrealizedPnL
        const accruedInterest = deposit.calculateAccruedInterest(snapshotDate);
        const parsedAccruedInterest = typeof accruedInterest === 'string' 
          ? parseFloat(accruedInterest) 
          : (accruedInterest || 0);
        
        totalDepositInterest += parsedAccruedInterest
        unrealizedDepositPnL += deposit.isSettled(snapshotDate) ? 0 : parsedAccruedInterest;
        realizedDepositPnL += deposit.isSettled(snapshotDate) ? parsedAccruedInterest : 0;
        
        const totalValue = deposit.calculateTotalValue(snapshotDate);
        const parsedTotalValue = typeof totalValue === 'string' 
          ? parseFloat(totalValue) 
          : (totalValue || 0);
        
        totalDepositValue += deposit.isSettled(snapshotDate) ? 0 : parsedTotalValue; // Don't add to totalDepositValue for settled deposits
      } else {
        // For inactive deposits, don't add to totalDepositInterest, unrealizedDepositPnL, and realizedDepositPnL
        totalDepositInterest += 0;
        unrealizedDepositPnL += 0;
        realizedDepositPnL += 0;
        totalDepositValue += 0; 
      }
    });

    const result = {
      totalDepositPrincipal: Number(totalDepositPrincipal.toFixed(8)),
      totalDepositInterest: Number(totalDepositInterest.toFixed(8)),
      totalDepositValue: Number(totalDepositValue.toFixed(8)),
      totalDepositCount: totalDepositCount,
      unrealizedDepositPnL: Number(unrealizedDepositPnL.toFixed(8)),
      realizedDepositPnL: Number(realizedDepositPnL.toFixed(8)),
    };
    
    console.log(`🔍 DEBUG: Deposit calculation result:`, result);

    return result;
  }
  /**
   * Calculate deposit data for a portfolio
   * @param portfolioId - Portfolio ID
   * @param snapshotDate - Snapshot date
   * @returns DepositCalculationData
   */
  async calculateDepositDataByPortfolioId(portfolioId: string, snapshotDate?: Date): Promise<DepositCalculationData> {
    let deposits = await this.depositRepository.find({
      where: { portfolioId },
    });

    // All logic should be done in calculateDepositsData
    return this.calculateDepositsData(deposits, snapshotDate);
  }

  /**
   * Calculate deposit data for all portfolios (global)
   * @param snapshotDate - Snapshot date
   * @returns DepositCalculationData
   */
  async calculateGlobalDepositData(snapshotDate?: Date): Promise<DepositCalculationData> {
    const deposits = await this.depositRepository.find();

    // All logic should be done in calculateDepositsData
    return this.calculateDepositsData(deposits, snapshotDate);
  }
}
