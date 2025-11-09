import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioSnapshot } from '../entities/portfolio-snapshot.entity';
import { AssetAllocationSnapshot } from '../entities/asset-allocation-snapshot.entity';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { CashFlowService } from './cash-flow.service';
import { CashFlowType } from '../entities/cash-flow.entity';

export interface TWRCalculationResult {
  twr1D: number;
  twr1W: number;
  twr1M: number;
  twr3M: number;
  twr6M: number;
  twr1Y: number;
  twrYTD: number;
  twrMTD: number;
}

export interface TWRCalculationOptions {
  portfolioId: string;
  snapshotDate: Date;
  granularity?: SnapshotGranularity;
}

@Injectable()
export class TWRCalculationService {
  private readonly logger = new Logger(TWRCalculationService.name);

  constructor(
    @InjectRepository(PortfolioSnapshot)
    private readonly portfolioSnapshotRepo: Repository<PortfolioSnapshot>,
    
    @InjectRepository(AssetAllocationSnapshot)
    private readonly assetSnapshotRepo: Repository<AssetAllocationSnapshot>,
    
    private readonly cashFlowService: CashFlowService,
  ) {}

  /**
   * Calculate TWR for portfolio across multiple timeframes
   */
  async calculatePortfolioTWR(options: TWRCalculationOptions): Promise<TWRCalculationResult> {
    const { portfolioId, snapshotDate, granularity = SnapshotGranularity.DAILY } = options;
    
    // Ensure snapshotDate is a Date object
    const date = snapshotDate instanceof Date ? snapshotDate : new Date(snapshotDate);

    try {
      // Calculate TWR for different periods
      const twr1D = await this.calculateTWRForPeriod(portfolioId, date, 1, granularity);
      const twr1W = await this.calculateTWRForPeriod(portfolioId, date, 7, granularity);
      const twr1M = await this.calculateTWRForPeriod(portfolioId, date, 30, granularity);
      const twr3M = await this.calculateTWRForPeriod(portfolioId, date, 90, granularity);
      const twr6M = await this.calculateTWRForPeriod(portfolioId, date, 180, granularity);
      const twr1Y = await this.calculateTWRForPeriod(portfolioId, date, 365, granularity);
      const twrYTD = await this.calculateYTD(portfolioId, date, granularity);
      const twrMTD = await this.calculateMTD(portfolioId, date, granularity);

      return {
        twr1D: Number(twr1D.toFixed(4)),
        twr1W: Number(twr1W.toFixed(4)),
        twr1M: Number(twr1M.toFixed(4)),
        twr3M: Number(twr3M.toFixed(4)),
        twr6M: Number(twr6M.toFixed(4)),
        twr1Y: Number(twr1Y.toFixed(4)),
        twrYTD: Number(twrYTD.toFixed(4)),
        twrMTD: Number(twrMTD.toFixed(4)),
      };
    } catch (error) {
      this.logger.error(`Error calculating portfolio TWR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate TWR for specific asset
   */
  async calculateAssetTWR(
    portfolioId: string,
    assetId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<TWRCalculationResult> {
    // Ensure snapshotDate is a Date object
    const date = snapshotDate instanceof Date ? snapshotDate : new Date(snapshotDate);

    try {
      const twr1D = await this.calculateAssetTWRForPeriod(portfolioId, assetId, date, 1, granularity);
      const twr1W = await this.calculateAssetTWRForPeriod(portfolioId, assetId, date, 7, granularity);
      const twr1M = await this.calculateAssetTWRForPeriod(portfolioId, assetId, date, 30, granularity);
      const twr3M = await this.calculateAssetTWRForPeriod(portfolioId, assetId, date, 90, granularity);
      const twr6M = await this.calculateAssetTWRForPeriod(portfolioId, assetId, date, 180, granularity);
      const twr1Y = await this.calculateAssetTWRForPeriod(portfolioId, assetId, date, 365, granularity);
      const twrYTD = await this.calculateAssetYTD(portfolioId, assetId, date, granularity);
      const twrMTD = await this.calculateAssetMTD(portfolioId, assetId, date, granularity);

      return {
        twr1D: Number(twr1D.toFixed(4)),
        twr1W: Number(twr1W.toFixed(4)),
        twr1M: Number(twr1M.toFixed(4)),
        twr3M: Number(twr3M.toFixed(4)),
        twr6M: Number(twr6M.toFixed(4)),
        twr1Y: Number(twr1Y.toFixed(4)),
        twrYTD: Number(twrYTD.toFixed(4)),
        twrMTD: Number(twrMTD.toFixed(4)),
      };
    } catch (error) {
      this.logger.error(`Error calculating asset TWR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate TWR for asset group
   */
  async calculateAssetGroupTWR(
    portfolioId: string,
    assetType: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<TWRCalculationResult> {
    // Ensure snapshotDate is a Date object
    const date = snapshotDate instanceof Date ? snapshotDate : new Date(snapshotDate);

    try {
      const twr1D = await this.calculateAssetGroupTWRForPeriod(portfolioId, assetType, date, 1, granularity);
      const twr1W = await this.calculateAssetGroupTWRForPeriod(portfolioId, assetType, date, 7, granularity);
      const twr1M = await this.calculateAssetGroupTWRForPeriod(portfolioId, assetType, date, 30, granularity);
      const twr3M = await this.calculateAssetGroupTWRForPeriod(portfolioId, assetType, date, 90, granularity);
      const twr6M = await this.calculateAssetGroupTWRForPeriod(portfolioId, assetType, date, 180, granularity);
      const twr1Y = await this.calculateAssetGroupTWRForPeriod(portfolioId, assetType, date, 365, granularity);
      const twrYTD = await this.calculateAssetGroupYTD(portfolioId, assetType, date, granularity);
      const twrMTD = await this.calculateAssetGroupMTD(portfolioId, assetType, date, granularity);

      return {
        twr1D: Number(twr1D.toFixed(4)),
        twr1W: Number(twr1W.toFixed(4)),
        twr1M: Number(twr1M.toFixed(4)),
        twr3M: Number(twr3M.toFixed(4)),
        twr6M: Number(twr6M.toFixed(4)),
        twr1Y: Number(twr1Y.toFixed(4)),
        twrYTD: Number(twrYTD.toFixed(4)),
        twrMTD: Number(twrMTD.toFixed(4)),
      };
    } catch (error) {
      this.logger.error(`Error calculating asset group TWR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate TWR for specific period using portfolio snapshots
   */
  private async calculateTWRForPeriod(
    portfolioId: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    // Get snapshots for the period
    const snapshots = await this.portfolioSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate: snapshotDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    if (snapshots.length < 2) {
      this.logger.warn(`Insufficient snapshots for TWR calculation: ${snapshots.length} snapshots found`);
      return 0;
    }

    return await this.calculateTWRFromSnapshots(snapshots, portfolioId);
  }

  /**
   * Calculate TWR for specific asset period
   */
  private async calculateAssetTWRForPeriod(
    portfolioId: string,
    assetId: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(snapshotDate);
    endDate.setHours(23, 59, 59, 999);

    // Get asset snapshots for the period
    const snapshots = await this.assetSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.assetId = :assetId', { assetId })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    if (snapshots.length < 2) {
      this.logger.warn(`Insufficient asset snapshots for TWR calculation: ${snapshots.length} snapshots found`);
      return 0;
    }

    return this.calculateTWRFromAssetSnapshots(snapshots);
  }

  /**
   * Calculate TWR for asset group period
   */
  private async calculateAssetGroupTWRForPeriod(
    portfolioId: string,
    assetType: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(snapshotDate);
    endDate.setHours(23, 59, 59, 999);

    // Get asset snapshots for the asset type
    const snapshots = await this.assetSnapshotRepo
      .createQueryBuilder('snapshot')
      .leftJoin('snapshot.asset', 'asset')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('asset.type = :assetType', { assetType })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    if (snapshots.length < 2) {
      this.logger.warn(`Insufficient asset group snapshots for TWR calculation: ${snapshots.length} snapshots found`);
      return 0;
    }

    return this.calculateTWRFromAssetSnapshots(snapshots);
  }

  /**
   * Calculate MTD (Month-to-Date) TWR
   * Calculates TWR from the last day of the previous month to the snapshot date
   */
  private async calculateMTD(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    // Get last day of previous month at 23:59:59 UTC
    const currentYear = snapshotDate.getUTCFullYear();
    const currentMonth = snapshotDate.getUTCMonth();
    const startDate = new Date(Date.UTC(
      currentYear,
      currentMonth,
      0, // Day 0 of current month = last day of previous month
      0, 0, 0, 0
    ));
    const endDate = new Date(snapshotDate);
    endDate.setHours(23, 59, 59, 999);

    const snapshots = await this.portfolioSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    if (snapshots.length < 2) {
      return 0;
    }

    return await this.calculateTWRFromSnapshots(snapshots, portfolioId);
  }

  /**
   * Calculate YTD TWR
   */
  private async calculateYTD(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const startDate = new Date(snapshotDate.getUTCFullYear()-1, 11, 31); // December 31st, 00:00:00 UTC of last day of previous year
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(snapshotDate);
    endDate.setHours(23, 59, 59, 999);

    const snapshots = await this.portfolioSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    if (snapshots.length < 2) {
      return 0;
    }

    return await this.calculateTWRFromSnapshots(snapshots, portfolioId);
  }

  /**
   * Calculate asset YTD TWR
   */
  private async calculateAssetYTD(
    portfolioId: string,
    assetId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const startDate = new Date(snapshotDate.getUTCFullYear()-1, 11, 31); // December 31st, 00:00:00 UTC of last day of previous year
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(snapshotDate);
    endDate.setHours(23, 59, 59, 999);

    const snapshots = await this.assetSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.assetId = :assetId', { assetId })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    if (snapshots.length < 2) {
      return 0;
    }

    return this.calculateTWRFromAssetSnapshots(snapshots);
  }

  /**
   * Calculate asset MTD TWR
   * Calculates TWR from the last day of the previous month to the snapshot date
   */
  private async calculateAssetMTD(
    portfolioId: string,
    assetId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    // Get last day of previous month at 23:59:59 UTC
    const currentYear = snapshotDate.getUTCFullYear();
    const currentMonth = snapshotDate.getUTCMonth();
    const startDate = new Date(Date.UTC(
      currentYear,
      currentMonth,
      0, // Day 0 of current month = last day of previous month
      0, 0, 0, 0
    ));
    const endDate = new Date(snapshotDate);
    endDate.setHours(23, 59, 59, 999);

    const snapshots = await this.assetSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.assetId = :assetId', { assetId })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    if (snapshots.length < 2) {
      return 0;
    }

    return this.calculateTWRFromAssetSnapshots(snapshots);
  }

  /**
   * Calculate asset group YTD TWR
   */
  private async calculateAssetGroupYTD(
    portfolioId: string,
    assetType: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const startDate = new Date(snapshotDate.getUTCFullYear()-1, 11, 31); // December 31st, 00:00:00 UTC of last day of previous year
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(snapshotDate);
    endDate.setHours(23, 59, 59, 999);

    const snapshots = await this.assetSnapshotRepo
      .createQueryBuilder('snapshot')
      .leftJoin('snapshot.asset', 'asset')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('asset.type = :assetType', { assetType })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    if (snapshots.length < 2) {
      return 0;
    }

    return this.calculateTWRFromAssetSnapshots(snapshots);
  }

  /**
   * Calculate asset group MTD TWR
   * Calculates TWR from the last day of the previous month to the snapshot date
   */
  private async calculateAssetGroupMTD(
    portfolioId: string,
    assetType: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    // Get last day of previous month at 23:59:59 UTC
    const currentYear = snapshotDate.getUTCFullYear();
    const currentMonth = snapshotDate.getUTCMonth();
    const startDate = new Date(Date.UTC(
      currentYear,
      currentMonth,
      0, // Day 0 of current month = last day of previous month
      0, 0, 0, 0
    ));
    const endDate = new Date(snapshotDate);
    endDate.setHours(23, 59, 59, 999);

    const snapshots = await this.assetSnapshotRepo
      .createQueryBuilder('snapshot')
      .leftJoin('snapshot.asset', 'asset')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('asset.type = :assetType', { assetType })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    if (snapshots.length < 2) {
      return 0;
    }

    return this.calculateTWRFromAssetSnapshots(snapshots);
  }

  /**
   * Calculate TWR from portfolio snapshots
   * TWR loại bỏ ảnh hưởng của cash flows bằng Modified Dietz method
   * Period Return = (End Value - Start Value - Cash Flow) / Start Value
   * TWR = (1 + r1) * (1 + r2) * ... * (1 + rn) - 1
   */
  private async calculateTWRFromSnapshots(
    snapshots: PortfolioSnapshot[],
    portfolioId: string
  ): Promise<number> {
    if (snapshots.length < 2) return 0;

    let twr = 1;

    // Get all cash flows for the period (from first snapshot date to last snapshot date)
    const startDate = snapshots[0].snapshotDate instanceof Date 
      ? snapshots[0].snapshotDate 
      : new Date(snapshots[0].snapshotDate);
    const endDate = snapshots[snapshots.length - 1].snapshotDate instanceof Date
      ? snapshots[snapshots.length - 1].snapshotDate
      : new Date(snapshots[snapshots.length - 1].snapshotDate);

    // Chỉ lấy External Cash Flows (tiền từ nhà đầu tư vào/ra)
    // KHÔNG bao gồm Internal Cash Flows (mua/bán cổ phiếu - đây là quyết định đầu tư của quỹ)
    let externalCashFlows: Array<{ date: Date; netAmount: number; type: CashFlowType }> = [];
    try {
      const cashFlowResult = await this.cashFlowService.getCashFlowHistory(
        portfolioId,
        startDate,
        endDate,
        1,
        10000 // Get all cash flows
      );
      
      // Chỉ lấy các external cash flows (tiền từ nhà đầu tư vào/ra)
      // Loại trừ: BUY_TRADE, SELL_TRADE, TRADE_SETTLEMENT (giao dịch đầu tư - phản ánh năng lực quản lý)
      // Loại trừ: DIVIDEND, INTEREST (investment income - phản ánh năng lực quản lý)
      // Loại trừ: FEE, TAX (đã được phản ánh trong portfolio value)
      const externalTypes = [
        CashFlowType.DEPOSIT,
        CashFlowType.WITHDRAWAL
      ];
      
      externalCashFlows = cashFlowResult.data
        .filter(cf => externalTypes.includes(cf.type))
        .map(cf => ({
          date: cf.flowDate instanceof Date ? cf.flowDate : new Date(cf.flowDate),
          netAmount: Number(cf.netAmount || 0), // netAmount already has correct sign
          type: cf.type,
        }));
    } catch (error) {
      this.logger.warn(`Error getting cash flows for TWR calculation: ${error.message}`);
      // Continue without cash flows - fallback to simple calculation
    }

    for (let i = 1; i < snapshots.length; i++) {
      const previousSnapshot = snapshots[i - 1];
      const currentSnapshot = snapshots[i];
      
      const previousValue = Number(previousSnapshot.totalPortfolioValue || 0);
      const currentValue = Number(currentSnapshot.totalPortfolioValue || 0);
      
      if (previousValue <= 0) {
        continue;
      }

      // Get snapshot dates
      const prevDate = previousSnapshot.snapshotDate instanceof Date
        ? previousSnapshot.snapshotDate
        : new Date(previousSnapshot.snapshotDate);
      const currDate = currentSnapshot.snapshotDate instanceof Date
        ? currentSnapshot.snapshotDate
        : new Date(currentSnapshot.snapshotDate);

      // Calculate EXTERNAL cash flows in this period (between prevDate and currDate)
      // CHỈ loại bỏ external cash flows (tiền từ nhà đầu tư vào/ra)
      // KHÔNG loại bỏ internal cash flows (mua/bán cổ phiếu - phản ánh năng lực quản lý)
      const periodCashFlows = externalCashFlows.filter(cf => {
        const cfDate = new Date(cf.date);
        const cfDateStr = cfDate.toISOString().split('T')[0];
        const prevDateStr = prevDate.toISOString().split('T')[0];
        const currDateStr = currDate.toISOString().split('T')[0];
        
        // Include external cash flows that occur after previous snapshot date and on/before current snapshot date
        // If snapshot is at end of day, cash flows on currDate are included in the snapshot value
        // So we need to subtract them to eliminate their impact
        return cfDateStr > prevDateStr && cfDateStr <= currDateStr;
      });

      // Calculate net EXTERNAL cash flow for this period (chỉ tiền từ nhà đầu tư vào/ra)
      const netCashFlow = periodCashFlows.reduce((sum, cf) => sum + cf.netAmount, 0);

      // Modified Dietz method: Period Return = (End Value - Start Value - Cash Flow) / Start Value
      // This eliminates the impact of cash flows by subtracting them from the change in value
      const periodReturn = (currentValue - previousValue - netCashFlow) / previousValue;
      
      // Geometric compounding: TWR = (1 + r1) * (1 + r2) * ... * (1 + rn)
      twr *= (1 + periodReturn);
    }

    // Convert to percentage: TWR = (Final Compound Return - 1) * 100
    return (twr - 1) * 100;
  }

  /**
   * Calculate TWR from asset snapshots
   */
  private calculateTWRFromAssetSnapshots(snapshots: AssetAllocationSnapshot[]): number {
    if (snapshots.length < 2) return 0;

    // Group by date to get portfolio values per date
    const dateGroups = snapshots.reduce((acc, snapshot) => {
      const dateStr = snapshot.snapshotDate instanceof Date 
        ? snapshot.snapshotDate.toISOString().split('T')[0]
        : new Date(snapshot.snapshotDate).toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(snapshot);
      return acc;
    }, {} as Record<string, AssetAllocationSnapshot[]>);

    const dates = Object.keys(dateGroups).sort();
    if (dates.length < 2) return 0;

    let twr = 1;

    for (let i = 1; i < dates.length; i++) {
      const prevDate = dates[i - 1];
      const currDate = dates[i];
      
      const prevSnapshots = dateGroups[prevDate];
      const currSnapshots = dateGroups[currDate];
      
      const prevValue = prevSnapshots.reduce((sum, s) => sum + Number(s.currentValue || 0), 0);
      const currValue = currSnapshots.reduce((sum, s) => sum + Number(s.currentValue || 0), 0);
      
      if (prevValue > 0) {
        const periodReturn = currValue / prevValue;
        twr *= periodReturn;
      }
    }

    return (twr - 1) * 100; // Convert to percentage
  }
}
