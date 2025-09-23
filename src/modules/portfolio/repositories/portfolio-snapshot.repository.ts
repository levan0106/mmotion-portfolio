import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, SelectQueryBuilder } from 'typeorm';
import { PortfolioSnapshot } from '../entities/portfolio-snapshot.entity';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';

export interface PortfolioSnapshotQueryOptions {
  portfolioId?: string;
  startDate?: Date;
  endDate?: Date;
  granularity?: SnapshotGranularity;
  isActive?: boolean;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PortfolioSnapshotAggregationResult {
  portfolioId: string;
  portfolioName: string;
  snapshotDate: string;
  granularity: SnapshotGranularity;
  totalValue: number;
  totalAssetPl: number;
  totalPortfolioPl: number;
  totalReturn: number;
  cashBalance: number;
  investedValue: number;
  assetCount: number;
  activeAssetCount: number;
  volatility: number;
  maxDrawdown: number;
}

@Injectable()
export class PortfolioSnapshotRepository {
  constructor(
    @InjectRepository(PortfolioSnapshot)
    private readonly repository: Repository<PortfolioSnapshot>,
  ) {}

  /**
   * Create a new portfolio snapshot
   */
  async create(data: Partial<PortfolioSnapshot>): Promise<PortfolioSnapshot> {
    const snapshot = this.repository.create(data);
    return await this.repository.save(snapshot);
  }

  /**
   * Create multiple portfolio snapshots
   */
  async createMany(data: Partial<PortfolioSnapshot>[]): Promise<PortfolioSnapshot[]> {
    const snapshots = this.repository.create(data);
    return await this.repository.save(snapshots);
  }

  /**
   * Find portfolio snapshot by ID
   */
  async findById(id: string): Promise<PortfolioSnapshot | null> {
    return await this.repository.findOne({
      where: { id, isActive: true },
    });
  }

  /**
   * Find portfolio snapshots with query options
   */
  async findMany(options: PortfolioSnapshotQueryOptions): Promise<PortfolioSnapshot[]> {
    const queryBuilder = this.createQueryBuilder(options);
    return await queryBuilder.getMany();
  }

  /**
   * Find portfolio snapshots with pagination
   */
  async findManyWithPagination(options: PortfolioSnapshotQueryOptions) {
    const queryBuilder = this.createQueryBuilder(options);
    
    const page = options.page || 1;
    const limit = options.limit || 25;
    const skip = (page - 1) * limit;

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find latest portfolio snapshot
   */
  async findLatest(
    portfolioId: string,
    granularity?: SnapshotGranularity
  ): Promise<PortfolioSnapshot | null> {
    const queryBuilder = this.repository
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'DESC')
      .addOrderBy('snapshot.createdAt', 'DESC');

    if (granularity) {
      queryBuilder.andWhere('snapshot.granularity = :granularity', { granularity });
    }

    return await queryBuilder.getOne();
  }

  /**
   * Find portfolio snapshots by date range
   */
  async findByDateRange(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity?: SnapshotGranularity
  ): Promise<PortfolioSnapshot[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.snapshotDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC');

    if (granularity) {
      queryBuilder.andWhere('snapshot.granularity = :granularity', { granularity });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Find aggregated portfolio snapshots by date
   */
  async findAggregatedByDate(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<PortfolioSnapshotAggregationResult[]> {
    return await this.repository
      .createQueryBuilder('snapshot')
      .select([
        'snapshot.portfolioId',
        'snapshot.portfolioName',
        'snapshot.snapshotDate',
        'snapshot.granularity',
        'snapshot.totalValue',
        'snapshot.totalAssetPl',
        'snapshot.totalPortfolioPl',
        'snapshot.totalReturn',
        'snapshot.cashBalance',
        'snapshot.investedValue',
        'snapshot.assetCount',
        'snapshot.activeAssetCount',
        'snapshot.volatility',
        'snapshot.maxDrawdown',
      ])
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.snapshotDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getRawMany();
  }

  /**
   * Find portfolios with snapshots
   */
  async findPortfoliosWithSnapshots(): Promise<Array<{
    portfolioId: string;
    portfolioName: string;
    snapshotCount: number;
    latestSnapshotDate: Date;
    oldestSnapshotDate: Date;
  }>> {
    return await this.repository
      .createQueryBuilder('snapshot')
      .select([
        'snapshot.portfolioId',
        'snapshot.portfolioName',
        'COUNT(snapshot.id) as snapshotCount',
        'MAX(snapshot.snapshotDate) as latestSnapshotDate',
        'MIN(snapshot.snapshotDate) as oldestSnapshotDate',
      ])
      .where('snapshot.isActive = :isActive', { isActive: true })
      .groupBy('snapshot.portfolioId, snapshot.portfolioName')
      .orderBy('latestSnapshotDate', 'DESC')
      .getRawMany();
  }

  /**
   * Update portfolio snapshot
   */
  async update(id: string, data: Partial<PortfolioSnapshot>): Promise<PortfolioSnapshot | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  /**
   * Soft delete portfolio snapshot
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return result.affected > 0;
  }

  /**
   * Hard delete portfolio snapshot
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  /**
   * Delete portfolio snapshots by portfolio, date, and granularity
   * This is used to ensure only one portfolio snapshot per day per portfolio
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
   * Delete portfolio snapshots by portfolio and date range
   */
  async deleteByPortfolioAndDateRange(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity?: SnapshotGranularity
  ): Promise<number> {
    const queryBuilder = this.repository
      .createQueryBuilder()
      .delete()
      .where('portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshotDate BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (granularity) {
      queryBuilder.andWhere('granularity = :granularity', { granularity });
    }

    const result = await queryBuilder.execute();
    return result.affected || 0;
  }

  /**
   * Delete portfolio snapshots by portfolio and specific date
   */
  async deleteByPortfolioAndDate(
    portfolioId: string,
    snapshotDate: Date,
    granularity?: SnapshotGranularity
  ): Promise<number> {
    const queryBuilder = this.repository
      .createQueryBuilder()
      .delete()
      .where('portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshotDate = :snapshotDate', { snapshotDate });

    if (granularity) {
      queryBuilder.andWhere('granularity = :granularity', { granularity });
    }

    const result = await queryBuilder.execute();
    return result.affected || 0;
  }

  /**
   * Delete portfolio snapshots by portfolio and granularity
   */
  async deleteByPortfolioAndGranularity(
    portfolioId: string,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const queryBuilder = this.repository
      .createQueryBuilder()
      .delete()
      .where('portfolioId = :portfolioId', { portfolioId })
      .andWhere('granularity = :granularity', { granularity });

    const result = await queryBuilder.execute();
    return result.affected || 0;
  }

  /**
   * Check if portfolio snapshot exists
   */
  async exists(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        portfolioId,
        snapshotDate,
        granularity,
        isActive: true,
      },
    });
    return count > 0;
  }

  /**
   * Get portfolio snapshot statistics
   */
  async getStatistics(portfolioId: string) {
    const stats = await this.repository
      .createQueryBuilder('snapshot')
      .select([
        'COUNT(snapshot.id) as totalSnapshots',
        'COUNT(CASE WHEN snapshot.granularity = \'DAILY\' THEN 1 END) as dailySnapshots',
        'COUNT(CASE WHEN snapshot.granularity = \'WEEKLY\' THEN 1 END) as weeklySnapshots',
        'COUNT(CASE WHEN snapshot.granularity = \'MONTHLY\' THEN 1 END) as monthlySnapshots',
        'MAX(snapshot.snapshotDate) as latestSnapshotDate',
        'MIN(snapshot.snapshotDate) as oldestSnapshotDate',
      ])
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .getRawOne();

    return {
      totalSnapshots: parseInt(stats.totalSnapshots) || 0,
      dailySnapshots: parseInt(stats.dailySnapshots) || 0,
      weeklySnapshots: parseInt(stats.weeklySnapshots) || 0,
      monthlySnapshots: parseInt(stats.monthlySnapshots) || 0,
      latestSnapshotDate: stats.latestSnapshotDate,
      oldestSnapshotDate: stats.oldestSnapshotDate,
    };
  }

  /**
   * Create query builder with common filters
   */
  private createQueryBuilder(options: PortfolioSnapshotQueryOptions): SelectQueryBuilder<PortfolioSnapshot> {
    const queryBuilder = this.repository.createQueryBuilder('snapshot');

    if (options.portfolioId) {
      queryBuilder.andWhere('snapshot.portfolioId = :portfolioId', { portfolioId: options.portfolioId });
    }

    if (options.startDate && options.endDate) {
      queryBuilder.andWhere('snapshot.snapshotDate BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate,
      });
    } else if (options.startDate) {
      queryBuilder.andWhere('snapshot.snapshotDate >= :startDate', { startDate: options.startDate });
    } else if (options.endDate) {
      queryBuilder.andWhere('snapshot.snapshotDate <= :endDate', { endDate: options.endDate });
    }

    if (options.granularity) {
      queryBuilder.andWhere('snapshot.granularity = :granularity', { granularity: options.granularity });
    }

    if (options.isActive !== undefined) {
      queryBuilder.andWhere('snapshot.isActive = :isActive', { isActive: options.isActive });
    }

    // Ordering
    const orderBy = options.orderBy || 'snapshot.snapshotDate';
    const orderDirection = options.orderDirection || 'DESC';
    queryBuilder.orderBy(orderBy, orderDirection);

    return queryBuilder;
  }
}
