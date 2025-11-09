import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan, LessThanOrEqual } from 'typeorm';
import { AssetPriceHistory } from '../entities/asset-price-history.entity';
import { GlobalAsset } from '../entities/global-asset.entity';
import { LoggingService } from '../../logging/services/logging.service';

export interface CreatePriceHistoryDto {
  assetId: string;
  price: number;
  priceType: string;
  priceSource: string;
  changeReason?: string;
  metadata?: Record<string, any>;
  createdAt?: string; // Optional custom creation date
}

export interface PriceHistoryQueryDto {
  assetId?: string;
  startDate?: Date;
  endDate?: Date;
  priceType?: string;
  priceSource?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'price';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PriceHistoryStatsDto {
  totalRecords: number;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  priceChanges: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
  };
  timeRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Service for managing asset price history.
 * Provides methods to create, retrieve, and analyze price history data.
 */
@Injectable()
export class PriceHistoryService {
  private readonly logger = new Logger(PriceHistoryService.name);

  constructor(
    @InjectRepository(AssetPriceHistory)
    private readonly priceHistoryRepository: Repository<AssetPriceHistory>,
    @InjectRepository(GlobalAsset)
    private readonly globalAssetRepository: Repository<GlobalAsset>,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Create a new price history record.
   * @param createDto - Price history creation data
   * @returns Created price history record
   */
  async createPriceHistory(createDto: CreatePriceHistoryDto): Promise<AssetPriceHistory> {
    this.logger.log(`Creating price history for asset ${createDto.assetId}`);

    // Validate asset exists
    const asset = await this.globalAssetRepository.findOne({
      where: { id: createDto.assetId }
    });

    if (!asset) {
      throw new NotFoundException(`Global asset with ID ${createDto.assetId} not found`);
    }

    // Validate price
    if (createDto.price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    // Create price history record
    const priceHistory = this.priceHistoryRepository.create({
      assetId: createDto.assetId,
      price: createDto.price,
      priceType: createDto.priceType,
      priceSource: createDto.priceSource,
      changeReason: createDto.changeReason,
      metadata: createDto.metadata,
      createdAt: createDto.createdAt ? new Date(createDto.createdAt) : new Date(),
    });

    const savedRecord = await this.priceHistoryRepository.save(priceHistory);

    // Log the creation
    await this.loggingService.logBusinessEvent(
      'PRICE_HISTORY_CREATED',
      'AssetPriceHistory',
      savedRecord.id,
      'CREATE',
      undefined,
      {
        assetId: createDto.assetId,
        price: createDto.price,
        priceType: createDto.priceType,
        priceSource: createDto.priceSource,
      },
    );

    this.logger.log(`Price history created with ID ${savedRecord.id}`);
    return savedRecord;
  }

  /**
   * Get price history for a specific asset with pagination info.
   * @param assetId - Asset ID
   * @param query - Query parameters
   * @returns Object with records and pagination info
   */
  async getPriceHistory(assetId: string, query: PriceHistoryQueryDto = {}): Promise<{
    records: AssetPriceHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`Getting price history for asset ${assetId}`);

    // Validate asset exists
    const asset = await this.globalAssetRepository.findOne({
      where: { id: assetId }
    });

    if (!asset) {
      throw new NotFoundException(`Global asset with ID ${assetId} not found`);
    }

    const queryBuilder = this.priceHistoryRepository
      .createQueryBuilder('priceHistory')
      .where('priceHistory.assetId = :assetId', { assetId });

    // Apply filters
    if (query.startDate) {
      queryBuilder.andWhere('priceHistory.createdAt >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('priceHistory.createdAt <= :endDate', { endDate: query.endDate });
    }

    if (query.priceType) {
      queryBuilder.andWhere('priceHistory.priceType = :priceType', { priceType: query.priceType });
    }

    if (query.priceSource) {
      queryBuilder.andWhere('priceHistory.priceSource = :priceSource', { priceSource: query.priceSource });
    }

    // Get total count first (without pagination)
    const total = await queryBuilder.getCount();

    // Apply ordering
    const orderBy = query.sortBy || 'createdAt';
    const orderDirection = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`priceHistory.${orderBy}`, orderDirection);

    // Apply pagination
    const limit = query.limit || 10;
    const offset = query.offset || 0;
    
    if (query.limit) {
      queryBuilder.limit(limit);
    }

    if (query.offset) {
      queryBuilder.offset(offset);
    }

    const records = await queryBuilder.getMany();

    // Calculate pagination info
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    this.logger.log(`Found ${records.length} price history records for asset ${assetId} (total: ${total})`);
    return {
      records,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Get price history by date range.
   * @param assetId - Asset ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of price history records
   */
  async getPriceHistoryByDateRange(
    assetId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AssetPriceHistory[]> {
    this.logger.log(`Getting price history for asset ${assetId} from ${startDate} to ${endDate}`);

    const result = await this.getPriceHistory(assetId, {
      startDate,
      endDate,
      sortBy: 'createdAt',
      sortOrder: 'ASC',
    });
    return result.records;
  }

  /**
   * Get latest price history for an asset.
   * @param assetId - Asset ID
   * @param limit - Number of latest records to return
   * @returns Array of latest price history records
   */
  async getLatestPriceHistory(assetId: string, limit: number = 10): Promise<AssetPriceHistory[]> {
    this.logger.log(`Getting latest ${limit} price history records for asset ${assetId}`);

    const result = await this.getPriceHistory(assetId, {
      limit,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
    return result.records;
  }

  /**
   * Get the last (latest) price within a specific calendar day for an asset.
   * If no record exists on that day, returns null (no fallback to earlier days).
   */
  async getLastPriceOfDay(assetId: string, day: Date): Promise<number | null> {
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    const record = await this.priceHistoryRepository.findOne({
      where: {
        assetId,
        createdAt: LessThanOrEqual(endOfDay),
      },
      order: { createdAt: 'DESC' },
    });

    return record ? record.price : null;
  }

  /**
   * Get price for a specific date (for snapshot creation).
   * If multiple prices exist for the same date, returns the latest one.
   * @param symbol - Asset symbol
   * @param targetDate - Target date for the price
   * @returns Price at the target date or null if not found
   */
  async getPriceByDate(symbol: string, targetDate: Date): Promise<number | null> {
    this.logger.log(`Getting price for symbol ${symbol} on date ${targetDate.toISOString()}`);

    try {
      // Find the global asset by symbol
      const globalAsset = await this.globalAssetRepository.findOne({
        where: { symbol }
      });

      if (!globalAsset) {
        this.logger.warn(`Global asset not found for symbol: ${symbol}`);
        return null;
      }

      // Get the start and end of the target date
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find the latest price record for the target date
      const priceRecord = await this.priceHistoryRepository.findOne({
        where: {
          assetId: globalAsset.id,
          createdAt: Between(startOfDay, endOfDay)
        },
        order: {
          createdAt: 'DESC' // Get the latest price if multiple exist on same date
        }
      });

      if (priceRecord) {
        this.logger.debug(`Found price for ${symbol} on ${targetDate.toISOString()}: ${priceRecord.price}`);
        return priceRecord.price;
      }

      // If no price found for exact date, try to find the latest price before the target date
      const latestPriceBefore = await this.priceHistoryRepository.findOne({
        where: {
          assetId: globalAsset.id,
          createdAt: LessThan(startOfDay)
        },
        order: {
          createdAt: 'DESC'
        }
      });

      if (latestPriceBefore) {
        this.logger.debug(`Using latest price before ${targetDate.toISOString()} for ${symbol}: ${latestPriceBefore.price}`);
        return latestPriceBefore.price;
      }

      this.logger.warn(`No price found for symbol ${symbol} on or before ${targetDate.toISOString()}`);
      return null;

    } catch (error) {
      this.logger.error(`Error getting price by date for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get price history statistics for an asset.
   * @param assetId - Asset ID
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Price history statistics
   */
  async getPriceHistoryStats(
    assetId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PriceHistoryStatsDto> {
    this.logger.log(`Getting price history stats for asset ${assetId}`);

    const queryBuilder = this.priceHistoryRepository
      .createQueryBuilder('priceHistory')
      .where('priceHistory.assetId = :assetId', { assetId });

    if (startDate) {
      queryBuilder.andWhere('priceHistory.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('priceHistory.createdAt <= :endDate', { endDate });
    }

    const records = await queryBuilder
      .orderBy('priceHistory.createdAt', 'ASC')
      .getMany();

    if (records.length === 0) {
      throw new NotFoundException(`No price history found for asset ${assetId}`);
    }

    // Calculate statistics
    const prices = records.map(r => r.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Calculate price changes
    let positiveChanges = 0;
    let negativeChanges = 0;
    let neutralChanges = 0;

    for (let i = 1; i < records.length; i++) {
      const currentPrice = records[i].price;
      const previousPrice = records[i - 1].price;
      const change = currentPrice - previousPrice;

      if (change > 0) {
        positiveChanges++;
      } else if (change < 0) {
        negativeChanges++;
      } else {
        neutralChanges++;
      }
    }

    const stats: PriceHistoryStatsDto = {
      totalRecords: records.length,
      priceRange: {
        min: minPrice,
        max: maxPrice,
        average: avgPrice,
      },
      priceChanges: {
        total: records.length - 1,
        positive: positiveChanges,
        negative: negativeChanges,
        neutral: neutralChanges,
      },
      timeRange: {
        start: records[0].createdAt,
        end: records[records.length - 1].createdAt,
      },
    };

    this.logger.log(`Price history stats calculated for asset ${assetId}: ${stats.totalRecords} records`);
    return stats;
  }

  /**
   * Delete old price history records.
   * @param assetId - Asset ID (optional, if not provided, cleans all assets)
   * @param olderThanDays - Delete records older than this many days
   * @returns Number of deleted records
   */
  async deleteOldPriceHistory(assetId?: string, olderThanDays: number = 365): Promise<number> {
    this.logger.log(`Deleting price history older than ${olderThanDays} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const queryBuilder = this.priceHistoryRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate });

    if (assetId) {
      queryBuilder.andWhere('assetId = :assetId', { assetId });
    }

    const result = await queryBuilder.execute();

    // Log the cleanup
    await this.loggingService.logBusinessEvent(
      'PRICE_HISTORY_CLEANUP',
      'AssetPriceHistory',
      'cleanup',
      'DELETE',
      undefined,
      {
        deletedCount: result.affected,
        cutoffDate,
        assetId: assetId || 'all',
      },
    );

    this.logger.log(`Deleted ${result.affected} old price history records`);
    return result.affected || 0;
  }

  /**
   * Get price history by price type.
   * @param assetId - Asset ID
   * @param priceType - Price type filter
   * @returns Array of price history records
   */
  async getPriceHistoryByType(assetId: string, priceType: string): Promise<AssetPriceHistory[]> {
    this.logger.log(`Getting price history for asset ${assetId} with type ${priceType}`);

    const result = await this.getPriceHistory(assetId, {
      priceType,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
    return result.records;
  }

  /**
   * Get price history by price source.
   * @param assetId - Asset ID
   * @param priceSource - Price source filter
   * @returns Array of price history records
   */
  async getPriceHistoryBySource(assetId: string, priceSource: string): Promise<AssetPriceHistory[]> {
    this.logger.log(`Getting price history for asset ${assetId} with source ${priceSource}`);

    const result = await this.getPriceHistory(assetId, {
      priceSource,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
    return result.records;
  }

  /**
   * Check if asset has price history.
   * @param assetId - Asset ID
   * @returns True if asset has price history, false otherwise
   */
  async hasPriceHistory(assetId: string): Promise<boolean> {
    const count = await this.priceHistoryRepository.count({
      where: { assetId }
    });

    return count > 0;
  }

  /**
   * Get total price history count for an asset.
   * @param assetId - Asset ID
   * @returns Total number of price history records
   */
  async getPriceHistoryCount(assetId: string): Promise<number> {
    return this.priceHistoryRepository.count({
      where: { assetId }
    });
  }
}
