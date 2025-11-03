import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioSnapshot } from '../entities/portfolio-snapshot.entity';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { CashFlowService } from './cash-flow.service';

export interface MWRIRRCalculationResult {
  mwr1M: number;
  mwr3M: number;
  mwr6M: number;
  mwr1Y: number;
  mwrYTD: number;
  irr1M: number;
  irr3M: number;
  irr6M: number;
  irr1Y: number;
  irrYTD: number;
}

export interface CashFlow {
  date: Date;
  amount: number;
  type: 'INFLOW' | 'OUTFLOW';
}

export interface MWRIRRCalculationOptions {
  portfolioId: string;
  snapshotDate: Date;
  granularity?: SnapshotGranularity;
}

@Injectable()
export class MWRIRRCalculationService {
  private readonly logger = new Logger(MWRIRRCalculationService.name);
  private readonly MAX_ITERATIONS = 100;
  private readonly TOLERANCE = 0.0001;

  constructor(
    @InjectRepository(PortfolioSnapshot)
    private readonly portfolioSnapshotRepo: Repository<PortfolioSnapshot>,
    private readonly cashFlowService: CashFlowService,
  ) {}

  /**
   * Calculate MWR and IRR for portfolio across multiple timeframes
   */
  async calculatePortfolioMWRIRR(options: MWRIRRCalculationOptions): Promise<MWRIRRCalculationResult> {
    const { portfolioId, snapshotDate, granularity = SnapshotGranularity.DAILY } = options;
    

    try {
      // Calculate MWR/IRR for different periods
      const mwr1M = await this.calculateMWRForPeriod(portfolioId, snapshotDate, 30, granularity);
      const mwr3M = await this.calculateMWRForPeriod(portfolioId, snapshotDate, 90, granularity);
      const mwr6M = await this.calculateMWRForPeriod(portfolioId, snapshotDate, 180, granularity);
      const mwr1Y = await this.calculateMWRForPeriod(portfolioId, snapshotDate, 365, granularity);
      const mwrYTD = await this.calculateYTD(portfolioId, snapshotDate, granularity);

      const irr1M = await this.calculateIRRForPeriod(portfolioId, snapshotDate, 30, granularity);
      const irr3M = await this.calculateIRRForPeriod(portfolioId, snapshotDate, 90, granularity);
      const irr6M = await this.calculateIRRForPeriod(portfolioId, snapshotDate, 180, granularity);
      const irr1Y = await this.calculateIRRForPeriod(portfolioId, snapshotDate, 365, granularity);
      const irrYTD = await this.calculateIRRYTD(portfolioId, snapshotDate, granularity);

      return {
        mwr1M: Number(mwr1M.toFixed(4)),
        mwr3M: Number(mwr3M.toFixed(4)),
        mwr6M: Number(mwr6M.toFixed(4)),
        mwr1Y: Number(mwr1Y.toFixed(4)),
        mwrYTD: Number(mwrYTD.toFixed(4)),
        irr1M: Number(irr1M.toFixed(4)),
        irr3M: Number(irr3M.toFixed(4)),
        irr6M: Number(irr6M.toFixed(4)),
        irr1Y: Number(irr1Y.toFixed(4)),
        irrYTD: Number(irrYTD.toFixed(4)),
      };
    } catch (error) {
      this.logger.error(`Error calculating portfolio MWR/IRR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate MWR and IRR for specific asset across multiple timeframes
   */
  async calculateAssetMWRIRR(
    portfolioId: string,
    assetId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<MWRIRRCalculationResult> {

    try {
      // Calculate MWR for different periods
      const mwr1M = await this.calculateAssetMWRForPeriod(portfolioId, assetId, snapshotDate, 30, granularity);
      const mwr3M = await this.calculateAssetMWRForPeriod(portfolioId, assetId, snapshotDate, 90, granularity);
      const mwr6M = await this.calculateAssetMWRForPeriod(portfolioId, assetId, snapshotDate, 180, granularity);
      const mwr1Y = await this.calculateAssetMWRForPeriod(portfolioId, assetId, snapshotDate, 365, granularity);
      const mwrYTD = await this.calculateAssetMWRYTD(portfolioId, assetId, snapshotDate, granularity);

      // Calculate IRR for different periods
      const irr1M = await this.calculateAssetIRRForPeriod(portfolioId, assetId, snapshotDate, 30, granularity);
      const irr3M = await this.calculateAssetIRRForPeriod(portfolioId, assetId, snapshotDate, 90, granularity);
      const irr6M = await this.calculateAssetIRRForPeriod(portfolioId, assetId, snapshotDate, 180, granularity);
      const irr1Y = await this.calculateAssetIRRForPeriod(portfolioId, assetId, snapshotDate, 365, granularity);
      const irrYTD = await this.calculateAssetIRRYTD(portfolioId, assetId, snapshotDate, granularity);

      return {
        mwr1M: Number(mwr1M.toFixed(4)),
        mwr3M: Number(mwr3M.toFixed(4)),
        mwr6M: Number(mwr6M.toFixed(4)),
        mwr1Y: Number(mwr1Y.toFixed(4)),
        mwrYTD: Number(mwrYTD.toFixed(4)),
        irr1M: Number(irr1M.toFixed(4)),
        irr3M: Number(irr3M.toFixed(4)),
        irr6M: Number(irr6M.toFixed(4)),
        irr1Y: Number(irr1Y.toFixed(4)),
        irrYTD: Number(irrYTD.toFixed(4)),
      };
    } catch (error) {
      this.logger.error(`Error calculating asset MWR/IRR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate MWR for specific period
   */
  private async calculateMWRForPeriod(
    portfolioId: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    // Get cash flows for the period
    const cashFlows = await this.getCashFlowsForPeriod(portfolioId, startDate, snapshotDate);
    
    // Get portfolio values
    const portfolioValues = await this.getPortfolioValuesForPeriod(portfolioId, startDate, snapshotDate, granularity);

    if (cashFlows.length === 0 || portfolioValues.length < 2) {
      this.logger.warn(`Insufficient data for MWR calculation: ${cashFlows.length} cash flows, ${portfolioValues.length} portfolio values`);
      return 0;
    }

    return this.calculateMWRFromData(cashFlows, portfolioValues, snapshotDate);
  }

  /**
   * Calculate IRR for specific period
   */
  private async calculateIRRForPeriod(
    portfolioId: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    // Get cash flows for the period
    const cashFlows = await this.getCashFlowsForPeriod(portfolioId, startDate, snapshotDate);
    
    // Get final portfolio value
    const finalValue = await this.getFinalPortfolioValue(portfolioId, snapshotDate, granularity);

    if (cashFlows.length === 0 || finalValue === 0) {
      this.logger.warn(`Insufficient data for IRR calculation: ${cashFlows.length} cash flows, final value: ${finalValue}`);
      return 0;
    }

    return this.calculateIRRFromCashFlows(cashFlows, finalValue, snapshotDate);
  }

  /**
   * Calculate YTD MWR
   */
  private async calculateYTD(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const yearStart = new Date(snapshotDate.getUTCFullYear()-1, 11, 31); // December 31st, 00:00:00 UTC of last day of previous year
    return await this.calculateMWRForPeriod(portfolioId, snapshotDate, 
      Math.ceil((snapshotDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)), granularity);
  }

  /**
   * Calculate YTD IRR
   */
  private async calculateIRRYTD(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const yearStart = new Date(snapshotDate.getUTCFullYear()-1, 11, 31); // December 31st, 00:00:00 UTC of last day of previous year
    return await this.calculateIRRForPeriod(portfolioId, snapshotDate, 
      Math.ceil((snapshotDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)), granularity);
  }

  /**
   * Get cash flows for period using CashFlowService
   */
  private async getCashFlowsForPeriod(
    portfolioId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashFlow[]> {
    try {
      // Get cash flow history from CashFlowService
      const result = await this.cashFlowService.getCashFlowHistory(
        portfolioId,
        startDate,
        endDate,
        1, // page
        1000 // limit - get all cash flows for the period
      );

      // Convert to our CashFlow interface format
      const cashFlows: CashFlow[] = result.data.map(cf => {
        const date = cf.flowDate instanceof Date ? cf.flowDate : new Date(cf.flowDate);
        const amount = cf.netAmount; // netAmount already has correct sign based on type
        const type = cf.netAmount >= 0 ? 'INFLOW' : 'OUTFLOW';
        
        return {
          date,
          amount,
          type
        };
      });
      
      return cashFlows;
    } catch (error) {
      this.logger.error(`Error retrieving cash flows for portfolio ${portfolioId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get portfolio values for period
   */
  private async getPortfolioValuesForPeriod(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<Array<{ date: Date; value: number }>> {
    const startOfDate = new Date(startDate);
    startOfDate.setHours(0, 0, 0, 0);
    const endOfDate = new Date(endDate);
    endOfDate.setHours(23, 59, 59, 999);
    
    const snapshots = await this.portfolioSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate: startOfDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate: endOfDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();
    
    const result = snapshots.map(snapshot => {
      const date = snapshot.snapshotDate instanceof Date ? snapshot.snapshotDate : new Date(snapshot.snapshotDate);
      const value = Number(snapshot.totalPortfolioValue || 0);
      
      return {
        date,
        value
      };
    });
    
    return result;
  }

  /**
   * Get final portfolio value
   */
  private async getFinalPortfolioValue(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const snapshot = await this.portfolioSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.snapshotDate <= :snapshotDate', { snapshotDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'DESC')
      .getOne();

    return snapshot ? Number(snapshot.totalPortfolioValue || 0) : 0;
  }

  /**
   * Calculate MWR from cash flows and portfolio values
   */
  private calculateMWRFromData(
    cashFlows: CashFlow[],
    portfolioValues: Array<{ date: Date; value: number }>,
    endDate: Date
  ): number {
    if (cashFlows.length === 0 || portfolioValues.length < 2) {
      return 0;
    }

    const initialValue = portfolioValues[0].value;
    const finalValue = portfolioValues[portfolioValues.length - 1].value;

    if (initialValue === 0) {
      return 0;
    }

    // Calculate weighted average return considering cash flows
    let totalWeightedReturn = 0;
    let totalWeight = 0;

    for (let i = 1; i < portfolioValues.length; i++) {
      const prevValue = portfolioValues[i - 1].value;
      const currValue = portfolioValues[i].value;
      const prevDate = portfolioValues[i - 1].date;
      const currDate = portfolioValues[i].date;
      const endofPrevDate = new Date(prevDate.getTime() + 24 * 60 * 60 * 1000);
      const endofCurrDate = new Date(currDate.getTime() + 24 * 60 * 60 * 1000);
      
      // Calculate net cash flow for this specific period only
      const periodCashFlows = cashFlows.filter(cf => 
        cf.date > endofPrevDate && cf.date <= endofCurrDate
      );

      const netCashFlow = periodCashFlows.reduce((sum, cf) => {
        const amount = cf.type === 'INFLOW' ? cf.amount : -cf.amount;
        return sum + amount;
      }, 0);


      // Calculate period return with proper logic
      let periodReturn = 0;
      if (prevValue === currValue && netCashFlow !== 0) {
        // Portfolio value unchanged but cash flows occurred - this means 
        // the cash flows were offset by market movements, so return is 0
        periodReturn = 0;
      } else {
        // Normal calculation: (End Value - Start Value - Net Cash Flow) / Start Value
        periodReturn = (currValue - prevValue - netCashFlow) / prevValue;
      }
      
      // Weight by time period
      const timeWeight = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      
      totalWeightedReturn += periodReturn * timeWeight;
      totalWeight += timeWeight;
    }

    const finalMWR = totalWeight > 0 ? (totalWeightedReturn / totalWeight) * 100 : 0;

    return finalMWR;
  }

  /**
   * Calculate IRR from cash flows using Newton-Raphson method
   */
  private calculateIRRFromCashFlows(
    cashFlows: CashFlow[],
    finalValue: number,
    endDate: Date
  ): number {
    if (cashFlows.length === 0) {
      return 0;
    }

    // Create cash flow array with final value as outflow
    const allCashFlows = [
      ...cashFlows.map(cf => ({
        date: cf.date,
        amount: cf.type === 'INFLOW' ? -cf.amount : cf.amount // IRR convention: negative for inflows
      })),
      {
        date: endDate,
        amount: finalValue // Final value as positive (outflow)
      }
    ];

    // Sort by date
    allCashFlows.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Use Newton-Raphson method to find IRR
    let rate = 0.1; // Initial guess: 10%
    
    for (let i = 0; i < this.MAX_ITERATIONS; i++) {
      const npv = this.calculateNPV(allCashFlows, rate);
      const npvDerivative = this.calculateNPVDerivative(allCashFlows, rate);
      
      if (Math.abs(npv) < this.TOLERANCE) {
        break;
      }
      
      if (Math.abs(npvDerivative) < this.TOLERANCE) {
        this.logger.warn('IRR calculation: derivative too small, using fallback');
        break;
      }
      
      rate = rate - npv / npvDerivative;
      
      // Prevent extreme values
      if (rate < -0.99) rate = -0.99;
      if (rate > 10) rate = 10;
    }

    return rate * 100; // Convert to percentage
  }

  /**
   * Calculate Net Present Value
   */
  private calculateNPV(
    cashFlows: Array<{ date: Date; amount: number }>,
    rate: number
  ): number {
    const startDate = cashFlows[0].date;
    
    return cashFlows.reduce((npv, cf) => {
      const days = (cf.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const discountFactor = Math.pow(1 + rate, days / 365);
      return npv + cf.amount / discountFactor;
    }, 0);
  }

  /**
   * Calculate NPV derivative for Newton-Raphson method
   */
  private calculateNPVDerivative(
    cashFlows: Array<{ date: Date; amount: number }>,
    rate: number
  ): number {
    const startDate = cashFlows[0].date;
    
    return cashFlows.reduce((derivative, cf) => {
      const days = (cf.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const discountFactor = Math.pow(1 + rate, days / 365);
      const timeWeight = days / 365;
      return derivative - (cf.amount * timeWeight) / (discountFactor * (1 + rate));
    }, 0);
  }

  /**
   * Calculate Asset MWR for specific period
   */
  private async calculateAssetMWRForPeriod(
    portfolioId: string,
    assetId: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);


    // Get asset cash flows for the period (trades)
    const cashFlows = await this.getAssetCashFlowsForPeriod(portfolioId, assetId, startDate, snapshotDate);
    
    // Get asset values for the period
    const assetValues = await this.getAssetValuesForPeriod(portfolioId, assetId, startDate, snapshotDate, granularity);

    if (cashFlows.length === 0 && assetValues.length < 2) {
      this.logger.warn(`Insufficient data for asset MWR calculation: ${cashFlows.length} cash flows, ${assetValues.length} values`);
      return 0;
    }

    return this.calculateMWRFromData(cashFlows, assetValues, snapshotDate);
  }

  /**
   * Calculate Asset IRR for specific period
   */
  private async calculateAssetIRRForPeriod(
    portfolioId: string,
    assetId: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);


    // Get asset cash flows for the period
    const cashFlows = await this.getAssetCashFlowsForPeriod(portfolioId, assetId, startDate, snapshotDate);
    
    // Get final asset value
    const finalValue = await this.getAssetValueAtDate(portfolioId, assetId, snapshotDate);

    if (cashFlows.length === 0) {
      this.logger.warn(`No cash flows for asset IRR calculation`);
      return 0;
    }

    return this.calculateIRRFromCashFlows(cashFlows, finalValue, snapshotDate);
  }

  /**
   * Calculate Asset MWR YTD
   */
  private async calculateAssetMWRYTD(
    portfolioId: string,
    assetId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const yearStart = new Date(snapshotDate.getFullYear(), 0, 1);
    return await this.calculateAssetMWRForPeriod(portfolioId, assetId, snapshotDate, 
      Math.ceil((snapshotDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)), granularity);
  }

  /**
   * Calculate Asset IRR YTD
   */
  private async calculateAssetIRRYTD(
    portfolioId: string,
    assetId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const yearStart = new Date(snapshotDate.getUTCFullYear()-1, 11, 31); // December 31st, 00:00:00 UTC of last day of previous year
    return await this.calculateAssetIRRForPeriod(portfolioId, assetId, snapshotDate, 
      Math.ceil((snapshotDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)), granularity);
  }

  /**
   * Get asset cash flows for period (from trades)
   */
  private async getAssetCashFlowsForPeriod(
    portfolioId: string,
    assetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashFlow[]> {
    // Get trades for the asset in the portfolio for the period
    const trades = await this.portfolioSnapshotRepo.manager
      .createQueryBuilder('trades', 't')
      .where('t.portfolio_id = :portfolioId', { portfolioId })
      .andWhere('t.asset_id = :assetId', { assetId })
      .andWhere('t.trade_date >= :startDate', { startDate })
      .andWhere('t.trade_date <= :endDate', { endDate })
      .orderBy('t.trade_date', 'ASC')
      .getMany();

    const cashFlows: CashFlow[] = [];

    for (const trade of trades) {
      const tradeDate = trade.tradeDate instanceof Date ? trade.tradeDate : new Date(trade.tradeDate);
      const amount = Number(trade.quantity) * Number(trade.price) + Number(trade.fee || 0) + Number(trade.tax || 0);
      
      if (trade.side === 'BUY') {
        cashFlows.push({
          date: tradeDate,
          amount: -amount, // Outflow for buy
          type: 'OUTFLOW'
        });
      } else if (trade.side === 'SELL') {
        cashFlows.push({
          date: tradeDate,
          amount: amount, // Inflow for sell
          type: 'INFLOW'
        });
      }
    }

    return cashFlows;
  }

  /**
   * Get asset values for period
   */
  private async getAssetValuesForPeriod(
    portfolioId: string,
    assetId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<Array<{ date: Date; value: number }>> {
    // Get asset allocation snapshots for the period
    const snapshots = await this.portfolioSnapshotRepo.manager
      .createQueryBuilder('asset_allocation_snapshots', 's')
      .where('s.portfolio_id = :portfolioId', { portfolioId })
      .andWhere('s.asset_id = :assetId', { assetId })
      .andWhere('s.snapshot_date >= :startDate', { startDate })
      .andWhere('s.snapshot_date <= :endDate', { endDate })
      .andWhere('s.granularity = :granularity', { granularity })
      .andWhere('s.is_active = :isActive', { isActive: true })
      .orderBy('s.snapshot_date', 'ASC')
      .getMany();

    return snapshots.map(snapshot => ({
      date: snapshot.snapshotDate instanceof Date ? snapshot.snapshotDate : new Date(snapshot.snapshotDate),
      value: Number(snapshot.currentValue || 0)
    }));
  }

  /**
   * Get asset value at specific date
   */
  private async getAssetValueAtDate(
    portfolioId: string,
    assetId: string,
    date: Date
  ): Promise<number> {
    const snapshot = await this.portfolioSnapshotRepo.manager
      .createQueryBuilder('asset_allocation_snapshots', 's')
      .where('s.portfolio_id = :portfolioId', { portfolioId })
      .andWhere('s.asset_id = :assetId', { assetId })
      .andWhere('s.snapshot_date = :date', { date })
      .andWhere('s.is_active = :isActive', { isActive: true })
      .getOne();

    return snapshot ? Number(snapshot.currentValue || 0) : 0;
  }

  /**
   * Calculate MWR and IRR for asset group across multiple timeframes
   */
  async calculateAssetGroupMWRIRR(
    portfolioId: string,
    assetType: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<MWRIRRCalculationResult> {

    try {
      // Calculate MWR for different periods
      const mwr1M = await this.calculateAssetGroupMWRForPeriod(portfolioId, assetType, snapshotDate, 30, granularity);
      const mwr3M = await this.calculateAssetGroupMWRForPeriod(portfolioId, assetType, snapshotDate, 90, granularity);
      const mwr6M = await this.calculateAssetGroupMWRForPeriod(portfolioId, assetType, snapshotDate, 180, granularity);
      const mwr1Y = await this.calculateAssetGroupMWRForPeriod(portfolioId, assetType, snapshotDate, 365, granularity);
      const mwrYTD = await this.calculateAssetGroupMWRYTD(portfolioId, assetType, snapshotDate, granularity);

      // Calculate IRR for different periods
      const irr1M = await this.calculateAssetGroupIRRForPeriod(portfolioId, assetType, snapshotDate, 30, granularity);
      const irr3M = await this.calculateAssetGroupIRRForPeriod(portfolioId, assetType, snapshotDate, 90, granularity);
      const irr6M = await this.calculateAssetGroupIRRForPeriod(portfolioId, assetType, snapshotDate, 180, granularity);
      const irr1Y = await this.calculateAssetGroupIRRForPeriod(portfolioId, assetType, snapshotDate, 365, granularity);
      const irrYTD = await this.calculateAssetGroupIRRYTD(portfolioId, assetType, snapshotDate, granularity);

      return {
        mwr1M: Number(mwr1M.toFixed(4)),
        mwr3M: Number(mwr3M.toFixed(4)),
        mwr6M: Number(mwr6M.toFixed(4)),
        mwr1Y: Number(mwr1Y.toFixed(4)),
        mwrYTD: Number(mwrYTD.toFixed(4)),
        irr1M: Number(irr1M.toFixed(4)),
        irr3M: Number(irr3M.toFixed(4)),
        irr6M: Number(irr6M.toFixed(4)),
        irr1Y: Number(irr1Y.toFixed(4)),
        irrYTD: Number(irrYTD.toFixed(4)),
      };
    } catch (error) {
      this.logger.error(`Error calculating asset group MWR/IRR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate Asset Group MWR for specific period
   */
  private async calculateAssetGroupMWRForPeriod(
    portfolioId: string,
    assetType: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    // Get asset group cash flows for the period (trades for all assets of this type)
    const cashFlows = await this.getAssetGroupCashFlowsForPeriod(portfolioId, assetType, startDate, snapshotDate);
    
    // Get asset group values for the period
    const assetGroupValues = await this.getAssetGroupValuesForPeriod(portfolioId, assetType, startDate, snapshotDate, granularity);

    if (cashFlows.length === 0 && assetGroupValues.length < 2) {
      this.logger.warn(`Insufficient data for asset group MWR calculation: ${cashFlows.length} cash flows, ${assetGroupValues.length} values`);
      return 0;
    }

    return this.calculateMWRFromData(cashFlows, assetGroupValues, snapshotDate);
  }

  /**
   * Calculate Asset Group IRR for specific period
   */
  private async calculateAssetGroupIRRForPeriod(
    portfolioId: string,
    assetType: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    // Get asset group cash flows for the period
    const cashFlows = await this.getAssetGroupCashFlowsForPeriod(portfolioId, assetType, startDate, snapshotDate);
    
    // Get final asset group value
    const finalValue = await this.getAssetGroupValueAtDate(portfolioId, assetType, snapshotDate);

    if (cashFlows.length === 0) {
      this.logger.warn(`No cash flows for asset group IRR calculation`);
      return 0;
    }

    return this.calculateIRRFromCashFlows(cashFlows, finalValue, snapshotDate);
  }

  /**
   * Calculate Asset Group MWR YTD
   */
  private async calculateAssetGroupMWRYTD(
    portfolioId: string,
    assetType: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const yearStart = new Date(snapshotDate.getFullYear(), 0, 1);
    return await this.calculateAssetGroupMWRForPeriod(portfolioId, assetType, snapshotDate, 
      Math.ceil((snapshotDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)), granularity);
  }

  /**
   * Calculate Asset Group IRR YTD
   */
  private async calculateAssetGroupIRRYTD(
    portfolioId: string,
    assetType: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const yearStart = new Date(snapshotDate.getFullYear(), 0, 1);
    return await this.calculateAssetGroupIRRForPeriod(portfolioId, assetType, snapshotDate, 
      Math.ceil((snapshotDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)), granularity);
  }

  /**
   * Get asset group cash flows for period (from trades for all assets of this type)
   */
  private async getAssetGroupCashFlowsForPeriod(
    portfolioId: string,
    assetType: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashFlow[]> {
    // Get trades for all assets of this type in the portfolio for the period
    const trades = await this.portfolioSnapshotRepo.manager
      .createQueryBuilder('trades', 't')
      .innerJoin('assets', 'a', 'a.id = t.asset_id')
      .where('t.portfolio_id = :portfolioId', { portfolioId })
      .andWhere('a.type = :assetType', { assetType })
      .andWhere('t.trade_date >= :startDate', { startDate })
      .andWhere('t.trade_date <= :endDate', { endDate })
      .orderBy('t.trade_date', 'ASC')
      .getMany();

    const cashFlows: CashFlow[] = [];

    for (const trade of trades) {
      const tradeDate = trade.tradeDate instanceof Date ? trade.tradeDate : new Date(trade.tradeDate);
      const amount = Number(trade.quantity) * Number(trade.price) + Number(trade.fee || 0) + Number(trade.tax || 0);
      
      if (trade.side === 'BUY') {
        cashFlows.push({
          date: tradeDate,
          amount: -amount, // Outflow for buy
          type: 'OUTFLOW'
        });
      } else if (trade.side === 'SELL') {
        cashFlows.push({
          date: tradeDate,
          amount: amount, // Inflow for sell
          type: 'INFLOW'
        });
      }
    }

    return cashFlows;
  }

  /**
   * Get asset group values for period
   */
  private async getAssetGroupValuesForPeriod(
    portfolioId: string,
    assetType: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<Array<{ date: Date; value: number }>> {
    // Get asset allocation snapshots for all assets of this type for the period
    const snapshots = await this.portfolioSnapshotRepo.manager
      .createQueryBuilder('asset_allocation_snapshots', 's')
      .innerJoin('assets', 'a', 'a.id = s.asset_id')
      .where('s.portfolio_id = :portfolioId', { portfolioId })
      .andWhere('a.type = :assetType', { assetType })
      .andWhere('s.snapshot_date >= :startDate', { startDate })
      .andWhere('s.snapshot_date <= :endDate', { endDate })
      .andWhere('s.granularity = :granularity', { granularity })
      .andWhere('s.is_active = :isActive', { isActive: true })
      .orderBy('s.snapshot_date', 'ASC')
      .getMany();

    // Group by date and sum values
    const dateValueMap = new Map<string, number>();
    
    for (const snapshot of snapshots) {
      const date = snapshot.snapshotDate instanceof Date ? snapshot.snapshotDate : new Date(snapshot.snapshotDate);
      const dateKey = date.toISOString().split('T')[0];
      const currentValue = Number(snapshot.currentValue || 0);
      
      dateValueMap.set(dateKey, (dateValueMap.get(dateKey) || 0) + currentValue);
    }

    return Array.from(dateValueMap.entries()).map(([dateKey, value]) => ({
      date: new Date(dateKey),
      value
    }));
  }

  /**
   * Get asset group value at specific date
   */
  private async getAssetGroupValueAtDate(
    portfolioId: string,
    assetType: string,
    date: Date
  ): Promise<number> {
    const snapshots = await this.portfolioSnapshotRepo.manager
      .createQueryBuilder('asset_allocation_snapshots', 's')
      .innerJoin('assets', 'a', 'a.id = s.asset_id')
      .where('s.portfolio_id = :portfolioId', { portfolioId })
      .andWhere('a.type = :assetType', { assetType })
      .andWhere('s.snapshot_date = :date', { date })
      .andWhere('s.is_active = :isActive', { isActive: true })
      .getMany();

    return snapshots.reduce((sum, snapshot) => sum + Number(snapshot.currentValue || 0), 0);
  }
}
