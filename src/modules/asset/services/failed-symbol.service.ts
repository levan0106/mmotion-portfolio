import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FailedSymbol, FailedSymbolReason } from '../entities/failed-symbol.entity';

export interface CreateFailedSymbolDto {
  executionId: string;
  symbol: string;
  assetType: string;
  provider: string;
  reason: FailedSymbolReason;
  errorMessage: string;
  errorCode?: string;
  statusCode?: number;
  rawData?: Record<string, any>;
}

export interface FailedSymbolQuery {
  executionId?: string;
  symbol?: string;
  assetType?: string;
  provider?: string;
  reason?: FailedSymbolReason;
  retrySuccessful?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'symbol' | 'retryCount';
  sortOrder?: 'ASC' | 'DESC';
}

export interface FailedSymbolStats {
  totalFailed: number;
  byReason: Record<FailedSymbolReason, number>;
  byProvider: Record<string, number>;
  byAssetType: Record<string, number>;
  retrySuccessful: number;
  retryPending: number;
  mostCommonErrors: Array<{
    errorMessage: string;
    count: number;
  }>;
}

@Injectable()
export class FailedSymbolService {
  private readonly logger = new Logger(FailedSymbolService.name);

  constructor(
    @InjectRepository(FailedSymbol)
    private readonly failedSymbolRepository: Repository<FailedSymbol>,
  ) {}

  /**
   * Create a new failed symbol record
   */
  async createFailedSymbol(dto: CreateFailedSymbolDto): Promise<FailedSymbol> {
    const failedSymbol = this.failedSymbolRepository.create(dto);
    const saved = await this.failedSymbolRepository.save(failedSymbol);
    
    this.logger.log(`[FailedSymbolService] Created failed symbol record: ${saved.symbol} - ${saved.reason}`);
    return saved;
  }

  /**
   * Create multiple failed symbol records in batch
   */
  async createFailedSymbols(dtos: CreateFailedSymbolDto[]): Promise<FailedSymbol[]> {
    if (dtos.length === 0) return [];

    const failedSymbols = this.failedSymbolRepository.create(dtos);
    const saved = await this.failedSymbolRepository.save(failedSymbols);
    
    this.logger.log(`[FailedSymbolService] Created ${saved.length} failed symbol records`);
    return saved;
  }

  /**
   * Get failed symbols by execution ID
   */
  async getFailedSymbolsByExecutionId(executionId: string): Promise<FailedSymbol[]> {
    const failedSymbols = await this.failedSymbolRepository.find({
      where: { executionId },
      order: { createdAt: 'DESC' },
    });

    this.logger.log(`[FailedSymbolService] Retrieved ${failedSymbols.length} failed symbols for execution: ${executionId}`);
    return failedSymbols;
  }

  /**
   * Get failed symbols with filtering and pagination
   */
  async getFailedSymbols(query: FailedSymbolQuery): Promise<{
    data: FailedSymbol[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      executionId,
      symbol,
      assetType,
      provider,
      reason,
      retrySuccessful,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.failedSymbolRepository.createQueryBuilder('failedSymbol');

    // Apply filters
    if (executionId) {
      queryBuilder.andWhere('failedSymbol.executionId = :executionId', { executionId });
    }
    if (symbol) {
      queryBuilder.andWhere('failedSymbol.symbol ILIKE :symbol', { symbol: `%${symbol}%` });
    }
    if (assetType) {
      queryBuilder.andWhere('failedSymbol.assetType = :assetType', { assetType });
    }
    if (provider) {
      queryBuilder.andWhere('failedSymbol.provider = :provider', { provider });
    }
    if (reason) {
      queryBuilder.andWhere('failedSymbol.reason = :reason', { reason });
    }
    if (retrySuccessful !== undefined) {
      queryBuilder.andWhere('failedSymbol.retrySuccessful = :retrySuccessful', { retrySuccessful });
    }
    if (startDate && endDate) {
      queryBuilder.andWhere('failedSymbol.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('failedSymbol.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('failedSymbol.createdAt <= :endDate', { endDate });
    }

    // Apply sorting
    const sortField = `failedSymbol.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get failed symbol statistics
   */
  async getFailedSymbolStats(executionId?: string): Promise<FailedSymbolStats> {
    const queryBuilder = this.failedSymbolRepository.createQueryBuilder('failedSymbol');

    if (executionId) {
      queryBuilder.where('failedSymbol.executionId = :executionId', { executionId });
    }

    const failedSymbols = await queryBuilder.getMany();

    const stats: FailedSymbolStats = {
      totalFailed: failedSymbols.length,
      byReason: {} as Record<FailedSymbolReason, number>,
      byProvider: {},
      byAssetType: {},
      retrySuccessful: 0,
      retryPending: 0,
      mostCommonErrors: [],
    };

    // Initialize counters
    Object.values(FailedSymbolReason).forEach(reason => {
      stats.byReason[reason] = 0;
    });

    // Count by reason, provider, asset type
    failedSymbols.forEach(symbol => {
      stats.byReason[symbol.reason]++;
      stats.byProvider[symbol.provider] = (stats.byProvider[symbol.provider] || 0) + 1;
      stats.byAssetType[symbol.assetType] = (stats.byAssetType[symbol.assetType] || 0) + 1;
      
      if (symbol.retrySuccessful) {
        stats.retrySuccessful++;
      } else {
        stats.retryPending++;
      }
    });

    // Find most common errors
    const errorCounts: Record<string, number> = {};
    failedSymbols.forEach(symbol => {
      const error = symbol.errorMessage;
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });

    stats.mostCommonErrors = Object.entries(errorCounts)
      .map(([errorMessage, count]) => ({ errorMessage, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * Mark a failed symbol as successfully retried
   */
  async markRetrySuccessful(id: string): Promise<FailedSymbol> {
    const failedSymbol = await this.failedSymbolRepository.findOne({
      where: { id },
    });

    if (!failedSymbol) {
      throw new Error(`Failed symbol not found: ${id}`);
    }

    failedSymbol.retrySuccessful = true;
    failedSymbol.retrySuccessfulAt = new Date();

    const updated = await this.failedSymbolRepository.save(failedSymbol);
    this.logger.log(`[FailedSymbolService] Marked failed symbol as retry successful: ${updated.symbol}`);
    return updated;
  }

  /**
   * Increment retry count for a failed symbol
   */
  async incrementRetryCount(id: string): Promise<FailedSymbol> {
    const failedSymbol = await this.failedSymbolRepository.findOne({
      where: { id },
    });

    if (!failedSymbol) {
      throw new Error(`Failed symbol not found: ${id}`);
    }

    failedSymbol.retryCount++;

    const updated = await this.failedSymbolRepository.save(failedSymbol);
    this.logger.log(`[FailedSymbolService] Incremented retry count for failed symbol: ${updated.symbol} - Count: ${updated.retryCount}`);
    return updated;
  }

  /**
   * Get symbols that need retry (failed but not yet retried successfully)
   */
  async getSymbolsForRetry(executionId?: string, maxRetryCount: number = 3): Promise<FailedSymbol[]> {
    const queryBuilder = this.failedSymbolRepository.createQueryBuilder('failedSymbol')
      .where('failedSymbol.retrySuccessful = false')
      .andWhere('failedSymbol.retryCount < :maxRetryCount', { maxRetryCount });

    if (executionId) {
      queryBuilder.andWhere('failedSymbol.executionId = :executionId', { executionId });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Clean up old failed symbol records
   */
  async cleanupOldFailedSymbols(days: number = 90): Promise<{ deletedRecords: number; message: string }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.failedSymbolRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();

    const deletedRecords = result.affected || 0;
    const message = `Cleaned up ${deletedRecords} failed symbol records older than ${days} days`;

    this.logger.log(`[FailedSymbolService] ${message}`);
    return { deletedRecords, message };
  }
}
