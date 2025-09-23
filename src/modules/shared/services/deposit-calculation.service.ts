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

  /**
   * Calculate deposit data for a portfolio
   * @param portfolioId - Portfolio ID
   * @returns DepositCalculationData
   */
  async calculateDepositData(portfolioId: string): Promise<DepositCalculationData> {
    const deposits = await this.depositRepository.find({
      where: { portfolioId },
    });

    let totalDepositPrincipal = 0;
    let totalDepositInterest = 0;
    let totalDepositValue = 0;
    let totalDepositCount = deposits.length;
    let unrealizedDepositPnL = 0;
    let realizedDepositPnL = 0;

    deposits.forEach(deposit => {
      const principal = typeof deposit.principal === 'string' 
        ? parseFloat(deposit.principal) 
        : (deposit.principal || 0);
      
      const interestRate = typeof deposit.interestRate === 'string' 
        ? parseFloat(deposit.interestRate) 
        : (deposit.interestRate || 0);

      totalDepositPrincipal += principal;

      if (deposit.status === 'ACTIVE') {
        // For active deposits, calculate accrued interest
        const accruedInterest = deposit.calculateAccruedInterest();
        const parsedAccruedInterest = typeof accruedInterest === 'string' 
          ? parseFloat(accruedInterest) 
          : (accruedInterest || 0);
        
        totalDepositInterest += parsedAccruedInterest;
        unrealizedDepositPnL += parsedAccruedInterest;
        
        const totalValue = deposit.calculateTotalValue();
        const parsedTotalValue = typeof totalValue === 'string' 
          ? parseFloat(totalValue) 
          : (totalValue || 0);
        
        totalDepositValue += parsedTotalValue;
      } else if (deposit.status === 'SETTLED') {
        // For settled deposits, use actual interest
        const actualInterest = typeof deposit.actualInterest === 'string' 
          ? parseFloat(deposit.actualInterest) 
          : (deposit.actualInterest || 0);
        
        totalDepositInterest += actualInterest;
        realizedDepositPnL += actualInterest;
        totalDepositValue += principal + actualInterest;
      }
    });

    return {
      totalDepositPrincipal: Number(totalDepositPrincipal.toFixed(8)),
      totalDepositInterest: Number(totalDepositInterest.toFixed(8)),
      totalDepositValue: Number(totalDepositValue.toFixed(8)),
      totalDepositCount,
      unrealizedDepositPnL: Number(unrealizedDepositPnL.toFixed(8)),
      realizedDepositPnL: Number(realizedDepositPnL.toFixed(8)),
    };
  }

  /**
   * Calculate deposit data for all portfolios (global)
   * @returns DepositCalculationData
   */
  async calculateGlobalDepositData(): Promise<DepositCalculationData> {
    const deposits = await this.depositRepository.find();

    let totalDepositPrincipal = 0;
    let totalDepositInterest = 0;
    let totalDepositValue = 0;
    let totalDepositCount = deposits.length;
    let unrealizedDepositPnL = 0;
    let realizedDepositPnL = 0;

    deposits.forEach(deposit => {
      const principal = typeof deposit.principal === 'string' 
        ? parseFloat(deposit.principal) 
        : (deposit.principal || 0);
      
      totalDepositPrincipal += principal;

      if (deposit.status === 'ACTIVE') {
        const accruedInterest = deposit.calculateAccruedInterest();
        const parsedAccruedInterest = typeof accruedInterest === 'string' 
          ? parseFloat(accruedInterest) 
          : (accruedInterest || 0);
        
        totalDepositInterest += parsedAccruedInterest;
        unrealizedDepositPnL += parsedAccruedInterest;
        
        const totalValue = deposit.calculateTotalValue();
        const parsedTotalValue = typeof totalValue === 'string' 
          ? parseFloat(totalValue) 
          : (totalValue || 0);
        
        totalDepositValue += parsedTotalValue;
      } else if (deposit.status === 'SETTLED') {
        const actualInterest = typeof deposit.actualInterest === 'string' 
          ? parseFloat(deposit.actualInterest) 
          : (deposit.actualInterest || 0);
        
        totalDepositInterest += actualInterest;
        realizedDepositPnL += actualInterest;
        totalDepositValue += principal + actualInterest;
      }
    });

    return {
      totalDepositPrincipal: Number(totalDepositPrincipal.toFixed(8)),
      totalDepositInterest: Number(totalDepositInterest.toFixed(8)),
      totalDepositValue: Number(totalDepositValue.toFixed(8)),
      totalDepositCount,
      unrealizedDepositPnL: Number(unrealizedDepositPnL.toFixed(8)),
      realizedDepositPnL: Number(realizedDepositPnL.toFixed(8)),
    };
  }
}
