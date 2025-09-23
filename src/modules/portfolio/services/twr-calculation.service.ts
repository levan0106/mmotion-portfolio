import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioSnapshot } from '../entities/portfolio-snapshot.entity';
import { AssetAllocationSnapshot } from '../entities/asset-allocation-snapshot.entity';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';

export interface TWRCalculationResult {
  twr1D: number;
  twr1W: number;
  twr1M: number;
  twr3M: number;
  twr6M: number;
  twr1Y: number;
  twrYTD: number;
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
  ) {}

  /**
   * Calculate TWR for portfolio across multiple timeframes
   */
  async calculatePortfolioTWR(options: TWRCalculationOptions): Promise<TWRCalculationResult> {
    const { portfolioId, snapshotDate, granularity = SnapshotGranularity.DAILY } = options;
    
    // Ensure snapshotDate is a Date object
    const date = snapshotDate instanceof Date ? snapshotDate : new Date(snapshotDate);
    this.logger.log(`Calculating portfolio TWR for ${portfolioId} on ${date.toISOString().split('T')[0]}`);

    try {
      // Calculate TWR for different periods
      const twr1D = await this.calculateTWRForPeriod(portfolioId, date, 1, granularity);
      const twr1W = await this.calculateTWRForPeriod(portfolioId, date, 7, granularity);
      const twr1M = await this.calculateTWRForPeriod(portfolioId, date, 30, granularity);
      const twr3M = await this.calculateTWRForPeriod(portfolioId, date, 90, granularity);
      const twr6M = await this.calculateTWRForPeriod(portfolioId, date, 180, granularity);
      const twr1Y = await this.calculateTWRForPeriod(portfolioId, date, 365, granularity);
      const twrYTD = await this.calculateYTD(portfolioId, date, granularity);

      return {
        twr1D: Number(twr1D.toFixed(4)),
        twr1W: Number(twr1W.toFixed(4)),
        twr1M: Number(twr1M.toFixed(4)),
        twr3M: Number(twr3M.toFixed(4)),
        twr6M: Number(twr6M.toFixed(4)),
        twr1Y: Number(twr1Y.toFixed(4)),
        twrYTD: Number(twrYTD.toFixed(4)),
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
    this.logger.log(`Calculating asset TWR for ${assetId} on ${date.toISOString().split('T')[0]}`);

    try {
      const twr1D = await this.calculateAssetTWRForPeriod(portfolioId, assetId, date, 1, granularity);
      const twr1W = await this.calculateAssetTWRForPeriod(portfolioId, assetId, date, 7, granularity);
      const twr1M = await this.calculateAssetTWRForPeriod(portfolioId, assetId, date, 30, granularity);
      const twr3M = await this.calculateAssetTWRForPeriod(portfolioId, assetId, date, 90, granularity);
      const twr6M = await this.calculateAssetTWRForPeriod(portfolioId, assetId, date, 180, granularity);
      const twr1Y = await this.calculateAssetTWRForPeriod(portfolioId, assetId, date, 365, granularity);
      const twrYTD = await this.calculateAssetYTD(portfolioId, assetId, date, granularity);

      return {
        twr1D: Number(twr1D.toFixed(4)),
        twr1W: Number(twr1W.toFixed(4)),
        twr1M: Number(twr1M.toFixed(4)),
        twr3M: Number(twr3M.toFixed(4)),
        twr6M: Number(twr6M.toFixed(4)),
        twr1Y: Number(twr1Y.toFixed(4)),
        twrYTD: Number(twrYTD.toFixed(4)),
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
    this.logger.log(`Calculating asset group TWR for ${assetType} on ${date.toISOString().split('T')[0]}`);

    try {
      const twr1D = await this.calculateAssetGroupTWRForPeriod(portfolioId, assetType, date, 1, granularity);
      const twr1W = await this.calculateAssetGroupTWRForPeriod(portfolioId, assetType, date, 7, granularity);
      const twr1M = await this.calculateAssetGroupTWRForPeriod(portfolioId, assetType, date, 30, granularity);
      const twr3M = await this.calculateAssetGroupTWRForPeriod(portfolioId, assetType, date, 90, granularity);
      const twr6M = await this.calculateAssetGroupTWRForPeriod(portfolioId, assetType, date, 180, granularity);
      const twr1Y = await this.calculateAssetGroupTWRForPeriod(portfolioId, assetType, date, 365, granularity);
      const twrYTD = await this.calculateAssetGroupYTD(portfolioId, assetType, date, granularity);

      return {
        twr1D: Number(twr1D.toFixed(4)),
        twr1W: Number(twr1W.toFixed(4)),
        twr1M: Number(twr1M.toFixed(4)),
        twr3M: Number(twr3M.toFixed(4)),
        twr6M: Number(twr6M.toFixed(4)),
        twr1Y: Number(twr1Y.toFixed(4)),
        twrYTD: Number(twrYTD.toFixed(4)),
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

    return this.calculateTWRFromSnapshots(snapshots);
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

    // Get asset snapshots for the period
    const snapshots = await this.assetSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.assetId = :assetId', { assetId })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate: snapshotDate })
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

    // Get asset snapshots for the asset type
    const snapshots = await this.assetSnapshotRepo
      .createQueryBuilder('snapshot')
      .leftJoin('snapshot.asset', 'asset')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('asset.type = :assetType', { assetType })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate: snapshotDate })
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
   * Calculate YTD TWR
   */
  private async calculateYTD(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const yearStart = new Date(snapshotDate.getFullYear(), 0, 1);

    const snapshots = await this.portfolioSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate: yearStart })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate: snapshotDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    if (snapshots.length < 2) {
      return 0;
    }

    return this.calculateTWRFromSnapshots(snapshots);
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
    const yearStart = new Date(snapshotDate.getFullYear(), 0, 1);

    const snapshots = await this.assetSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.assetId = :assetId', { assetId })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate: yearStart })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate: snapshotDate })
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
    const yearStart = new Date(snapshotDate.getFullYear(), 0, 1);

    const snapshots = await this.assetSnapshotRepo
      .createQueryBuilder('snapshot')
      .leftJoin('snapshot.asset', 'asset')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('asset.type = :assetType', { assetType })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate: yearStart })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate: snapshotDate })
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
   */
  private calculateTWRFromSnapshots(snapshots: PortfolioSnapshot[]): number {
    if (snapshots.length < 2) return 0;

    let twr = 1;

    for (let i = 1; i < snapshots.length; i++) {
      const previousValue = Number(snapshots[i - 1].totalPortfolioValue || 0);
      const currentValue = Number(snapshots[i].totalPortfolioValue || 0);
      
      if (previousValue > 0) {
        const periodReturn = currentValue / previousValue;
        twr *= periodReturn;
      }
    }

    return (twr - 1) * 100; // Convert to percentage
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
