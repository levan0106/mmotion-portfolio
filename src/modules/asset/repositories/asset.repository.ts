import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { AssetType } from '../enums/asset-type.enum';
import { IAssetRepository, AssetStatistics } from './asset.repository.interface';
import { Trade } from '../../trading/entities/trade.entity';
import { TradeDetail } from '../../trading/entities/trade-detail.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';

/**
 * Asset filters interface for query parameters
 */
export interface AssetFilters {
  createdBy?: string;
  portfolioId?: string;
  symbol?: string;
  type?: AssetType;
  search?: string;
  hasTrades?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
  page?: number;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Asset Repository
 * Handles all database operations for Asset entities
 */
@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(TradeDetail)
    private readonly tradeDetailRepository: Repository<TradeDetail>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
  ) {}

  /**
   * Create a new asset
   * @param assetData - Asset data to create
   * @returns Created asset
   */
  async create(assetData: Partial<Asset>): Promise<Asset> {
    const asset = this.assetRepository.create(assetData);
    return await this.assetRepository.save(asset);
  }

  /**
   * Find all assets with filtering and pagination
   * @param filters - Filter criteria
   * @returns Paginated assets
   */
  async findAll(filters: AssetFilters = {}): Promise<[Asset[], number]> {
    const queryBuilder = this.createQueryBuilder(filters);
    
    // Only add trades join if not already handled by filters
    if (!filters.hasTrades && !filters.portfolioId) {
      queryBuilder.leftJoinAndSelect('asset.trades', 'trades');
    }
    
    return await queryBuilder.getManyAndCount();
  }

  /**
   * Find assets with pagination
   * @param filters - Filter criteria
   * @returns Paginated response
   */
  async findWithPagination(filters: AssetFilters = {}): Promise<PaginatedResponse<Asset>> {
    // ✅ PERFORMANCE OPTIMIZATION: Use proper pagination with database-level LIMIT/OFFSET
    const limit = filters.limit || 10;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;
    
    // Get total count with filters
    const countQueryBuilder = this.createCountQueryBuilder(filters);
    const total = await countQueryBuilder.getCount();
    
    // ✅ OPTIMIZED: Get paginated data directly from database
    const dataQueryBuilder = this.createQueryBuilder(filters);
    const paginatedAssets = await dataQueryBuilder
      .skip(offset)
      .take(limit)
      .getMany();
    
    // ✅ OPTIMIZED: Only load trades if hasTrades filter is true
    if (filters.hasTrades === true && paginatedAssets.length > 0) {
      const assetIds = paginatedAssets.map(asset => asset.id);
      
      // ✅ BATCH LOAD: Load all trades in a single query
      const allTrades = await this.tradeRepository.find({
        where: { assetId: In(assetIds) },
        order: { tradeDate: 'ASC', createdAt: 'ASC' }
      });
      
      // ✅ MAP TRADES: Group trades by assetId for O(1) lookup
      const tradesMap = new Map<string, any[]>();
      allTrades.forEach(trade => {
        if (!tradesMap.has(trade.assetId)) {
          tradesMap.set(trade.assetId, []);
        }
        tradesMap.get(trade.assetId)!.push(trade);
      });
      
      // ✅ ASSIGN TRADES: Assign trades to assets
      paginatedAssets.forEach(asset => {
        asset.trades = tradesMap.get(asset.id) || [];
      });
    } else {
      // ✅ SKIP TRADES: Don't load trades if not needed
      paginatedAssets.forEach(asset => {
        asset.trades = [];
      });
    }
    
    return {
      data: paginatedAssets,
      total,
      page,
      limit,
    };
  }

  /**
   * Find asset by ID
   * @param id - Asset ID
   * @returns Asset or null
   */
  async findById(id: string): Promise<Asset | null> {
    return await this.assetRepository.findOne({
      where: { id },
      relations: ['trades'],
    });
  }

  /**
   * Find asset by ID with trades relationship
   * @param id - Asset ID
   * @returns Asset with trades or null
   */
  async findByIdWithTrades(id: string): Promise<Asset | null> {
    return await this.assetRepository.findOne({
      where: { id },
      relations: ['trades'],
    });
  }

  /**
   * Update asset by ID
   * @param id - Asset ID
   * @param updateData - Data to update
   * @returns Updated asset
   */
  async update(id: string, updateData: Partial<Asset>): Promise<Asset> {
    await this.assetRepository.update(id, updateData);
    return await this.findById(id);
  }

  /**
   * Delete asset by ID
   * @param id - Asset ID
   */
  async delete(id: string): Promise<void> {
    await this.assetRepository.delete(id);
  }

  /**
   * Find assets by portfolio ID through trades
   * @param portfolioId - Portfolio ID
   * @returns Array of assets
   */
  async findByPortfolioId(portfolioId: string): Promise<Asset[]> {
    // FIXED: Get all assets that have trades in the portfolio with trade date
    // This method is specifically for assets that have been traded in the portfolio
    return await this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.trades', 'trade')
      .where('trade.portfolioId = :portfolioId', { portfolioId })
      .distinct(true)
      .getMany();
  }



  /**
   * Find assets by type
   * @param type - Asset type
   * @param userId - Optional user ID filter
   * @returns Array of assets
   */
  async findByType(type: AssetType, userId?: string): Promise<Asset[]> {
    const whereCondition: any = { type };
    if (userId) {
      whereCondition.createdBy = userId;
    }

    return await this.assetRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Search assets by name, symbol, or description
   * @param searchTerm - Search term
   * @param userId - Optional user ID filter
   * @returns Array of assets
   */
  async search(searchTerm: string, userId?: string): Promise<Asset[]> {
    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset')
      .where(
        '(asset.name ILIKE :search OR asset.symbol ILIKE :search OR asset.description ILIKE :search)',
        { search: `%${searchTerm}%` }
      );

    if (userId) {
      queryBuilder.andWhere('asset.createdBy = :userId', { userId });
    }

    return await queryBuilder
      .orderBy('asset.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Count assets by user ID
   * @param userId - User ID
   * @returns Number of assets
   */
  async countByUserId(userId: string): Promise<number> {
    return await this.assetRepository.count({
      where: { createdBy: userId },
    });
  }

  /**
   * Check if asset name is unique globally
   * @param name - Asset name
   * @param excludeId - Asset ID to exclude from check
   * @returns True if unique, false otherwise
   */
  async isNameUniqueGlobally(
    name: string,
    excludeId?: string
  ): Promise<boolean> {
    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset')
      .where('LOWER(asset.name) = LOWER(:name)', { name });

    if (excludeId) {
      queryBuilder.andWhere('asset.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count === 0;
  }

  /**
   * Check if asset symbol is unique globally
   * @param symbol - Asset symbol
   * @param excludeId - Asset ID to exclude from check
   * @returns True if unique, false otherwise
   */
  async isSymbolUniqueGlobally(symbol: string, excludeId?: string): Promise<boolean> {
    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.symbol = :symbol', { symbol });

    if (excludeId) {
      queryBuilder.andWhere('asset.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count === 0;
  }

  /**
   * Check if asset symbol is unique for a specific user
   * @param symbol - Asset symbol
   * @param userId - User ID
   * @param excludeId - Asset ID to exclude from check
   * @returns True if unique, false otherwise
   */
  async isSymbolUniqueForUser(
    symbol: string,
    userId: string,
    excludeId?: string
  ): Promise<boolean> {
    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.symbol = :symbol', { symbol })
      .andWhere('asset.createdBy = :userId', { userId });

    if (excludeId) {
      queryBuilder.andWhere('asset.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count === 0;
  }

  /**
   * Check if asset has associated trades
   * @param id - Asset ID
   * @returns True if has trades, false otherwise
   */
  async hasTrades(id: string): Promise<boolean> {
    const count = await this.tradeRepository
      .createQueryBuilder('trade')
      .where('trade.assetId = :assetId', { assetId: id })
      .getCount();

    return count > 0;
  }

  /**
   * Get asset statistics by user
   * @param userId - User ID
   * @returns Asset statistics
   */
  async getAssetStatistics(userId: string): Promise<AssetStatistics> {
    const assets = await this.findByUserId(userId);
    
    const totalAssets = assets.length;
    const assetsByType = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {} as Record<AssetType, number>);
    
    const totalValue = assets.reduce((sum, asset) => {
      // Calculate currentValue real-time as currentQuantity * currentPrice
      // Note: currentPrice should be calculated from global assets
      const currentValue = asset.currentQuantity 
        ? asset.currentQuantity * 0 // Will be calculated from global assets
        : 0;
      return sum + currentValue;
    }, 0);
    const averageValue = totalAssets > 0 ? totalValue / totalAssets : 0;

    return {
      totalAssets,
      assetsByType,
      totalValue,
      averageValue,
    };
  }

  /**
   * Get assets by value range
   * @param minValue - Minimum value
   * @param maxValue - Maximum value
   * @param userId - Optional user ID filter
   * @returns Array of assets
   */
  async findByValueRange(
    minValue: number,
    maxValue: number,
    userId?: string
  ): Promise<Asset[]> {
    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.currentValue >= :minValue', { minValue })
      .andWhere('asset.currentValue <= :maxValue', { maxValue });

    if (userId) {
      queryBuilder.andWhere('asset.createdBy = :userId', { userId });
    }

    return await queryBuilder
      .orderBy('asset.currentValue', 'DESC')
      .getMany();
  }

  /**
   * Get recent assets
   * @param limit - Number of assets to return
   * @param userId - Optional user ID filter
   * @returns Array of recent assets
   */
  async findRecent(limit: number = 10, userId?: string): Promise<Asset[]> {
    const whereCondition: any = {};
    if (userId) {
      whereCondition.createdBy = userId;
    }

    return await this.assetRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Create query builder with filters
   * @param filters - Filter criteria
   * @returns Query builder
   */
  private createQueryBuilder(filters: AssetFilters): SelectQueryBuilder<Asset> {
    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset');

    // Apply filters
    if (filters.createdBy) {
      queryBuilder.andWhere('asset.createdBy = :createdBy', { 
        createdBy: filters.createdBy 
      });
    }

    if (filters.symbol) {
      queryBuilder.andWhere('LOWER(asset.symbol) = LOWER(:symbol)', { 
        symbol: filters.symbol 
      });
    }

    if (filters.type) {
      queryBuilder.andWhere('asset.type = :type', { type: filters.type });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(asset.name ILIKE :search OR asset.symbol ILIKE :search OR asset.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Handle both portfolioId and hasTrades filters together
    if (filters.portfolioId && filters.hasTrades !== undefined) {
      if (filters.hasTrades) {
        // Filter assets that have trades in specific portfolio
        queryBuilder
          .innerJoin('asset.trades', 'trade')
          .andWhere('trade.portfolioId = :portfolioId', { portfolioId: filters.portfolioId });
      } else {
        // Filter assets that don't have trades in specific portfolio
        queryBuilder
          .andWhere('NOT EXISTS (SELECT 1 FROM trades t WHERE t.asset_id = asset.id AND t.portfolio_id = :portfolioId)', { portfolioId: filters.portfolioId });
      }
    } else if (filters.portfolioId) {
      // Filter assets by portfolio through trades
      queryBuilder
        .andWhere('EXISTS (SELECT 1 FROM trades t WHERE t.asset_id = asset.id AND t.portfolio_id = :portfolioId)', { portfolioId: filters.portfolioId });
    } else if (filters.hasTrades !== undefined) {
      if (filters.hasTrades === true || String(filters.hasTrades) === 'true') {
        // Filter assets that have trades
        queryBuilder
          .innerJoin('asset.trades', 'trade');
      } else {
        // Filter assets that don't have trades
        queryBuilder
          .andWhere('NOT EXISTS (SELECT 1 FROM trades t WHERE t.asset_id = asset.id)');
      }
    }

    // Apply sorting
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder || 'ASC';
      queryBuilder.orderBy(`asset.${filters.sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('asset.createdAt', 'DESC');
    }

    // Note: Pagination is handled in findWithPagination method
    // Don't apply pagination here to avoid conflicts
    
    return queryBuilder;
  }

  /**
   * Create count query builder with filters (for counting only)
   * @param filters - Filter criteria
   * @returns Query builder for counting
   */
  private createCountQueryBuilder(filters: AssetFilters): SelectQueryBuilder<Asset> {
    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset');

    // Apply filters
    if (filters.createdBy) {
      queryBuilder.andWhere('asset.createdBy = :createdBy', { 
        createdBy: filters.createdBy 
      });
    }

    if (filters.symbol) {
      queryBuilder.andWhere('LOWER(asset.symbol) = LOWER(:symbol)', { 
        symbol: filters.symbol 
      });
    }

    if (filters.type) {
      queryBuilder.andWhere('asset.type = :type', { type: filters.type });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(asset.name ILIKE :search OR asset.symbol ILIKE :search OR asset.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Handle both portfolioId and hasTrades filters together
    if (filters.portfolioId && filters.hasTrades !== undefined) {
      if (filters.hasTrades) {
        // Filter assets that have trades in specific portfolio
        queryBuilder
          .innerJoin('asset.trades', 'trade')
          .andWhere('trade.portfolioId = :portfolioId', { portfolioId: filters.portfolioId });
      } else {
        // Filter assets that don't have trades in specific portfolio
        queryBuilder
          .andWhere('NOT EXISTS (SELECT 1 FROM trades t WHERE t.asset_id = asset.id AND t.portfolio_id = :portfolioId)', { portfolioId: filters.portfolioId });
      }
    } else if (filters.portfolioId) {
      // Filter assets by portfolio through trades
      queryBuilder
        .andWhere('EXISTS (SELECT 1 FROM trades t WHERE t.asset_id = asset.id AND t.portfolio_id = :portfolioId)', { portfolioId: filters.portfolioId });
    } else if (filters.hasTrades !== undefined) {
      if (filters.hasTrades === true || String(filters.hasTrades) === 'true') {
        // Filter assets that have trades
        queryBuilder
          .innerJoin('asset.trades', 'trade');
      } else {
        // Filter assets that don't have trades
        queryBuilder
          .andWhere('NOT EXISTS (SELECT 1 FROM trades t WHERE t.asset_id = asset.id)');
      }
    }

    return queryBuilder;
  }

  /**
   * Find assets by user ID
   * @param userId - User ID
   * @returns Promise<Asset[]> - Array of assets
   */
  async findByUserId(userId: string): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find assets by user ID with pagination
   * @param userId - User ID
   * @param filters - Additional filters
   * @returns Promise<PaginatedResponse<Asset>> - Paginated assets
   */
  async findByUserIdWithPagination(
    userId: string,
    filters: Omit<AssetFilters, 'createdBy'> = {}
  ): Promise<PaginatedResponse<Asset>> {
    // Create filters with userId
    const fullFilters: AssetFilters = {
      ...filters,
      createdBy: userId,
    };
    
    // Use the main findWithPagination method
    return await this.findWithPagination(fullFilters);
  }


  /**
   * Find assets by portfolio ID with pagination
   * @param portfolioId - Portfolio ID
   * @param filters - Additional filters
   * @returns Promise<PaginatedResponse<Asset>> - Paginated assets
   */
  async findByPortfolioIdWithPagination(
    portfolioId: string,
    filters: AssetFilters = {}
  ): Promise<PaginatedResponse<Asset>> {
    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset')
      .leftJoin('asset.trades', 'trade')
      .where('trade.portfolioId = :portfolioId', { portfolioId });

    // Apply additional filters
    if (filters.type) {
      queryBuilder.andWhere('asset.type = :type', { type: filters.type });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(asset.name ILIKE :search OR asset.symbol ILIKE :search OR asset.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(`asset.${sortBy}`, sortOrder);

    // Apply pagination
    const limit = filters.limit || 10;
    const offset = filters.offset || 0;
    queryBuilder.limit(limit).offset(offset);

    const [assets, total] = await queryBuilder.getManyAndCount();

    return {
      data: assets,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  }

  /**
   * Count assets by portfolio ID through trades
   * @param portfolioId - Portfolio ID
   * @returns Promise<number> - Number of assets
   */
  async countByPortfolioId(portfolioId: string): Promise<number> {
    return await this.assetRepository
      .createQueryBuilder('asset')
      .leftJoin('asset.trades', 'trade')
      .where('trade.portfolioId = :portfolioId', { portfolioId })
      .getCount();
  }

  /**
   * Check if asset name is unique within a portfolio
   * @param name - Asset name
   * @param portfolioId - Portfolio ID
   * @param excludeId - Asset ID to exclude from check
   * @returns Promise<boolean> - True if unique, false otherwise
   */
  async isNameUniqueInPortfolio(
    name: string,
    portfolioId: string,
    excludeId?: string
  ): Promise<boolean> {
    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset')
      .where('LOWER(asset.name) = LOWER(:name)', { name })
      .andWhere('asset.portfolioId = :portfolioId', { portfolioId });

    if (excludeId) {
      queryBuilder.andWhere('asset.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count === 0;
  }

  /**
   * Get the first trade for an asset (ordered by trade date)
   * @param assetId - Asset ID
   * @returns Promise<Trade | null> - First trade or null if none exists
   */
  async getFirstTrade(assetId: string): Promise<Trade | null> {
    return await this.tradeRepository
      .createQueryBuilder('trade')
      .where('trade.assetId = :assetId', { assetId })
      .orderBy('trade.tradeDate', 'ASC')
      .addOrderBy('trade.createdAt', 'ASC')
      .getOne();
  }

  /**
   * Get all trades for an asset
   * @param assetId - Asset ID
   * @returns Promise<Trade[]> - Array of trades
   */
  async getTradesForAsset(assetId: string): Promise<Trade[]> {
    const trades = await this.tradeRepository
      .createQueryBuilder('trade')
      .where('trade.assetId = :assetId', { assetId })
      .orderBy('trade.tradeDate', 'ASC')
      .addOrderBy('trade.createdAt', 'ASC')
      .getMany();
    return trades;
  }

  /**
   * Get all portfolios for an account
   * @param accountId - Account ID
   * @returns Promise<any[]> - Array of portfolios
   */
  async getPortfoliosForAccount(accountId: string): Promise<any[]> {
    const portfolios = await this.portfolioRepository
      .createQueryBuilder('portfolio')
      .where('portfolio.accountId = :accountId', { accountId })
      .getMany();
    
    return portfolios;
  }

  /**
   * Get all trades for a specific asset and portfolio
   * @param assetId - Asset ID
   * @param portfolioId - Portfolio ID
   * @param snapshotDate - Optional snapshot date to filter trades
   * @returns Promise<Trade[]> - Array of trades
   */
  async getAssetTradesByPortfolioFinal(assetId: string, portfolioId: string, snapshotDate?: Date): Promise<Trade[]> {
    const queryBuilder = this.tradeRepository
      .createQueryBuilder('trade')
      .where('trade.assetId = :assetId', { assetId })
      .andWhere('trade.portfolioId = :portfolioId', { portfolioId });

    // Filter trades by snapshot date if provided
    if (snapshotDate) {
      // Use consistent date comparison - set to end of day to include all trades on that date
      const endOfDay = new Date(snapshotDate);
      endOfDay.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('trade.tradeDate <= :snapshotDate', { snapshotDate: endOfDay });
    }

    return await queryBuilder
      .orderBy('trade.tradeDate', 'ASC')
      .addOrderBy('trade.createdAt', 'ASC')
      .getMany();
  }


  /**
   * Get the latest trade for an asset
   * @param assetId - Asset ID
   * @returns Promise<Trade | null> - Latest trade or null if none exists
   */
  async getLatestTrade(assetId: string): Promise<Trade | null> {
    return await this.tradeRepository
      .createQueryBuilder('trade')
      .where('trade.assetId = :assetId', { assetId })
      .orderBy('trade.tradeDate', 'DESC')
      .addOrderBy('trade.createdAt', 'DESC')
      .getOne();
  }

  /**
   * Delete trade details for a trade
   * @param tradeId - Trade ID
   * @returns Promise<void>
   */
  async deleteTradeDetails(tradeId: string): Promise<void> {
    await this.tradeDetailRepository
      .createQueryBuilder()
      .delete()
      .where('sell_trade_id = :tradeId OR buy_trade_id = :tradeId', { tradeId })
      .execute();
  }

  /**
   * Delete a trade by ID
   * @param tradeId - Trade ID
   * @returns Promise<void>
   */
  async deleteTrade(tradeId: string): Promise<void> {
    // First delete trade details (foreign key constraint)
    await this.deleteTradeDetails(tradeId);
    // Then delete the trade
    await this.tradeRepository.delete(tradeId);
  }

  /**
   * Find asset by symbol and user
   * @param symbol - Asset symbol
   * @param userId - User ID
   * @returns Asset or null if not found
   */
  async findBySymbolAndUser(symbol: string, userId: string): Promise<Asset | null> {
    return await this.assetRepository.findOne({
      where: {
        symbol: symbol.toUpperCase(),
        createdBy: userId,
      },
    });
  }
}
