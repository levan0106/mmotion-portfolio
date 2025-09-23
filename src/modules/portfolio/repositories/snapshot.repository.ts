import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AssetAllocationSnapshot } from '../entities/asset-allocation-snapshot.entity';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';

export interface SnapshotQueryOptions {
  portfolioId?: string;
  assetId?: string;
  assetSymbol?: string;
  granularity?: SnapshotGranularity;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface SnapshotAggregationResult {
  portfolioId: string;
  snapshotDate: Date;
  granularity: SnapshotGranularity;
  totalValue: number;
  totalPl: number;
  totalReturn: number;
  assetCount: number;
}

@Injectable()
export class SnapshotRepository {
  constructor(
    @InjectRepository(AssetAllocationSnapshot)
    private readonly repository: Repository<AssetAllocationSnapshot>,
  ) {}

  /**
   * Create a new snapshot
   */
  async create(snapshot: Partial<AssetAllocationSnapshot>): Promise<AssetAllocationSnapshot> {
    const newSnapshot = this.repository.create(snapshot);
    return await this.repository.save(newSnapshot);
  }

  /**
   * Create multiple snapshots in batch
   */
  async createMany(snapshots: Partial<AssetAllocationSnapshot>[]): Promise<AssetAllocationSnapshot[]> {
    const newSnapshots = this.repository.create(snapshots);
    return await this.repository.save(newSnapshots);
  }

  /**
   * Find snapshot by ID
   */
  async findById(id: string): Promise<AssetAllocationSnapshot | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['portfolio', 'asset'],
    });
  }

  /**
   * Find snapshots with query options
   */
  async findMany(options: SnapshotQueryOptions): Promise<AssetAllocationSnapshot[]> {
    const queryBuilder = this.createQueryBuilder(options);
    return await queryBuilder.getMany();
  }

  /**
   * Find snapshots with pagination
   */
  async findManyWithPagination(
    options: SnapshotQueryOptions
  ): Promise<{ data: AssetAllocationSnapshot[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.createQueryBuilder(options);
    
    const page = Math.max(1, options.offset ? Math.floor(options.offset / (options.limit || 10)) + 1 : 1);
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Find latest snapshot for portfolio and asset
   */
  async findLatest(
    portfolioId: string,
    assetId?: string,
    granularity?: SnapshotGranularity
  ): Promise<AssetAllocationSnapshot | null> {
    const queryBuilder = this.repository
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.isActive = :isActive', { isActive: true });

    if (assetId) {
      queryBuilder.andWhere('snapshot.assetId = :assetId', { assetId });
    }

    if (granularity) {
      queryBuilder.andWhere('snapshot.granularity = :granularity', { granularity });
    }

    return await queryBuilder
      .orderBy('snapshot.snapshotDate', 'DESC')
      .addOrderBy('snapshot.createdAt', 'DESC')
      .getOne();
  }

  /**
   * Find snapshots for timeline query
   */
  async findTimeline(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<AssetAllocationSnapshot[]> {
    return await this.repository.find({
      where: {
        portfolioId,
        snapshotDate: Between(startDate, endDate),
        granularity,
        isActive: true,
      },
      order: {
        snapshotDate: 'ASC',
        assetSymbol: 'ASC',
      },
    });
  }

  /**
   * Find snapshots by date range with aggregation
   */
  async findAggregatedByDate(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<SnapshotAggregationResult[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('snapshot')
      .select([
        'snapshot.portfolioId as "portfolioId"',
        'snapshot.snapshotDate as "snapshotDate"',
        'snapshot.granularity as "granularity"',
        'SUM(snapshot.currentValue) as "totalValue"',
        'SUM(snapshot.totalPl) as "totalPl"',
        'AVG(snapshot.returnPercentage) as "totalReturn"',
        'COUNT(DISTINCT snapshot.assetId) as "assetCount"',
      ])
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.snapshotDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .groupBy('snapshot.portfolioId, snapshot.snapshotDate, snapshot.granularity')
      .orderBy('snapshot.snapshotDate', 'ASC');

    const results = await queryBuilder.getRawMany();
    
    return results.map(result => ({
      portfolioId: result.portfolioId,
      snapshotDate: new Date(result.snapshotDate),
      granularity: result.granularity,
      totalValue: parseFloat(result.totalValue) || 0,
      totalPl: parseFloat(result.totalPl) || 0,
      totalReturn: parseFloat(result.totalReturn) || 0,
      assetCount: parseInt(result.assetCount) || 0,
    }));
  }

  /**
   * Find snapshots by asset symbol
   */
  async findByAssetSymbol(
    assetSymbol: string,
    startDate?: Date,
    endDate?: Date,
    granularity?: SnapshotGranularity
  ): Promise<AssetAllocationSnapshot[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('snapshot')
      .where('snapshot.assetSymbol = :assetSymbol', { assetSymbol })
      .andWhere('snapshot.isActive = :isActive', { isActive: true });

    if (startDate) {
      queryBuilder.andWhere('snapshot.snapshotDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('snapshot.snapshotDate <= :endDate', { endDate });
    }

    if (granularity) {
      queryBuilder.andWhere('snapshot.granularity = :granularity', { granularity });
    }

    return await queryBuilder
      .orderBy('snapshot.snapshotDate', 'DESC')
      .getMany();
  }

  /**
   * Check if snapshot exists
   */
  async exists(
    portfolioId: string,
    assetId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        portfolioId,
        assetId,
        snapshotDate,
        granularity,
      },
    });
    return count > 0;
  }

  /**
   * Find portfolios that have snapshots
   */
  async findPortfoliosWithSnapshots(): Promise<{ portfolioId: string; portfolioName: string; snapshotCount: number; latestSnapshotDate: Date; oldestSnapshotDate: Date }[]> {
    // Use raw SQL query to ensure proper join
    const result = await this.repository.query(`
      SELECT 
        s.portfolio_id as "portfolioId",
        COALESCE(p.name, 'Portfolio ' || SUBSTRING(s.portfolio_id::text, 1, 8)) as "portfolioName",
        COUNT(s.id) as "snapshotCount",
        MAX(s.snapshot_date) as "latestSnapshotDate",
        MIN(s.snapshot_date) as "oldestSnapshotDate"
      FROM asset_allocation_snapshots s
      LEFT JOIN portfolios p ON p.portfolio_id = s.portfolio_id
      WHERE s.is_active = true
      GROUP BY s.portfolio_id, p.name
      ORDER BY MAX(s.snapshot_date) DESC
    `);

    return result;
  }

  /**
   * Update snapshot
   */
  async update(id: string, updates: Partial<AssetAllocationSnapshot>): Promise<AssetAllocationSnapshot | null> {
    await this.repository.update(id, updates);
    return await this.findById(id);
  }

  /**
   * Update multiple snapshots
   */
  async updateMany(
    criteria: any,
    updates: Partial<AssetAllocationSnapshot>
  ): Promise<number> {
    const result = await this.repository.update(criteria, updates);
    return result.affected || 0;
  }

  /**
   * Soft delete snapshot
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return (result.affected || 0) > 0;
  }

  /**
   * Hard delete snapshot
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  /**
   * Delete snapshots by criteria
   */
  async deleteMany(criteria: any): Promise<number> {
    const result = await this.repository.delete(criteria);
    return result.affected || 0;
  }

  /**
   * Count snapshots
   */
  async count(options: SnapshotQueryOptions): Promise<number> {
    const queryBuilder = this.createQueryBuilder(options);
    return await queryBuilder.getCount();
  }

  /**
   * Get snapshot statistics
   */
  async getStatistics(portfolioId: string): Promise<{
    totalSnapshots: number;
    dailySnapshots: number;
    weeklySnapshots: number;
    monthlySnapshots: number;
    latestSnapshotDate: Date | null;
    oldestSnapshotDate: Date | null;
  }> {
    const stats = await this.repository
      .createQueryBuilder('snapshot')
      .select([
        'COUNT(*) as "totalSnapshots"',
        'COUNT(CASE WHEN snapshot.granularity = \'DAILY\' THEN 1 END) as "dailySnapshots"',
        'COUNT(CASE WHEN snapshot.granularity = \'WEEKLY\' THEN 1 END) as "weeklySnapshots"',
        'COUNT(CASE WHEN snapshot.granularity = \'MONTHLY\' THEN 1 END) as "monthlySnapshots"',
        'MAX(snapshot.snapshotDate) as "latestSnapshotDate"',
        'MIN(snapshot.snapshotDate) as "oldestSnapshotDate"',
      ])
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .getRawOne();

    return {
      totalSnapshots: parseInt(stats.totalSnapshots) || 0,
      dailySnapshots: parseInt(stats.dailySnapshots) || 0,
      weeklySnapshots: parseInt(stats.weeklySnapshots) || 0,
      monthlySnapshots: parseInt(stats.monthlySnapshots) || 0,
      latestSnapshotDate: stats.latestSnapshotDate ? new Date(stats.latestSnapshotDate) : null,
      oldestSnapshotDate: stats.oldestSnapshotDate ? new Date(stats.oldestSnapshotDate) : null,
    };
  }

  /**
   * Create query builder with options
   */
  private createQueryBuilder(options: SnapshotQueryOptions): SelectQueryBuilder<AssetAllocationSnapshot> {
    const queryBuilder = this.repository
      .createQueryBuilder('snapshot')
      .leftJoinAndSelect('snapshot.portfolio', 'portfolio')
      .leftJoinAndSelect('snapshot.asset', 'asset');

    if (options.portfolioId) {
      queryBuilder.andWhere('snapshot.portfolioId = :portfolioId', { portfolioId: options.portfolioId });
    }

    if (options.assetId) {
      queryBuilder.andWhere('snapshot.assetId = :assetId', { assetId: options.assetId });
    }

    if (options.assetSymbol) {
      queryBuilder.andWhere('snapshot.assetSymbol = :assetSymbol', { assetSymbol: options.assetSymbol });
    }

    if (options.granularity) {
      queryBuilder.andWhere('snapshot.granularity = :granularity', { granularity: options.granularity });
    }

    if (options.startDate) {
      queryBuilder.andWhere('snapshot.snapshotDate >= :startDate', { startDate: options.startDate });
    }

    if (options.endDate) {
      queryBuilder.andWhere('snapshot.snapshotDate <= :endDate', { endDate: options.endDate });
    }

    // Default to only active snapshots if isActive is not explicitly set
    if (options.isActive !== undefined) {
      queryBuilder.andWhere('snapshot.isActive = :isActive', { isActive: options.isActive });
    } else {
      queryBuilder.andWhere('snapshot.isActive = :isActive', { isActive: true });
    }

    // Apply ordering
    const orderBy = options.orderBy || 'snapshot.snapshotDate';
    const orderDirection = options.orderDirection || 'DESC';
    queryBuilder.orderBy(orderBy, orderDirection);

    return queryBuilder;
  }

  /**
   * Delete snapshots by portfolio, date, and granularity
   * This is used to ensure only one snapshot per day per portfolio
   */
  async deleteByPortfolioDateAndGranularity(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const result = await this.repository.delete({
      portfolioId,
      snapshotDate,
      granularity,
    });
    return result.affected || 0;
  }

  /**
   * Delete snapshots by portfolio and date range
   * This is used to delete snapshots for a specific period
   */
  async deleteByPortfolioAndDateRange(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity?: SnapshotGranularity
  ): Promise<number> {
    const queryBuilder = this.repository.createQueryBuilder()
      .delete()
      .where('portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshotDate >= :startDate', { startDate })
      .andWhere('snapshotDate <= :endDate', { endDate });

    if (granularity) {
      queryBuilder.andWhere('granularity = :granularity', { granularity });
    }

    const result = await queryBuilder.execute();
    return result.affected || 0;
  }

  /**
   * Delete snapshots by portfolio and specific date
   * This is used to delete all snapshots for a specific date
   */
  async deleteByPortfolioAndDate(
    portfolioId: string,
    snapshotDate: Date,
    granularity?: SnapshotGranularity
  ): Promise<number> {
    const queryBuilder = this.repository.createQueryBuilder()
      .delete()
      .where('portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshotDate = :snapshotDate', { snapshotDate });

    if (granularity) {
      queryBuilder.andWhere('granularity = :granularity', { granularity });
    }

    const result = await queryBuilder.execute();
    return result.affected || 0;
  }
}
