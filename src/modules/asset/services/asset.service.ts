import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { AssetRepository, AssetFilters, PaginatedResponse } from '../repositories/asset.repository';
import { IAssetRepository, AssetStatistics } from '../repositories/asset.repository.interface';
import { Asset } from '../entities/asset.entity';
import { AssetType } from '../enums/asset-type.enum';
import { AssetCacheService } from './asset-cache.service';
import { MarketDataService } from '../../market-data/services/market-data.service';
import { AssetGlobalSyncService } from './asset-global-sync.service';
import { AssetValueCalculatorService } from './asset-value-calculator.service';
import { CashFlowService } from '../../portfolio/services/cash-flow.service';

/**
 * Create Asset DTO
 * Note: initialValue, initialQuantity, currentValue, currentQuantity are computed fields
 * and will be calculated automatically based on trades and market prices
 * 
 * CR-003 Changes:
 * - Symbol field is now required and primary identifier
 * - Code field is deprecated but kept for backward compatibility
 */
export interface CreateAssetDto {
  name: string;
  symbol: string;
  code?: string; // Deprecated
  type: AssetType;
  description?: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * Update Asset DTO
 * Note: initialValue, initialQuantity, currentValue, currentQuantity are computed fields
 * and will be calculated automatically based on trades and market prices
 * 
 * CR-003 Changes:
 * - Symbol field is read-only after creation (not included in update)
 * - Code field is deprecated and not included in update
 */
export interface UpdateAssetDto {
  name?: string;
  type?: AssetType;
  description?: string;
  updatedBy: string;
}

/**
 * Asset Service
 * Handles business logic for Asset operations
 */
@Injectable()
export class AssetService {
  constructor(
    @Inject('IAssetRepository')
    private readonly assetRepository: IAssetRepository,
    private readonly cacheService: AssetCacheService,
    private readonly marketDataService: MarketDataService,
    private readonly assetGlobalSyncService: AssetGlobalSyncService,
    private readonly assetValueCalculator: AssetValueCalculatorService,
    private readonly cashFlowService: CashFlowService,
  ) {}

  /**
   * Create a new asset
   * @param createAssetDto - Asset creation data
   * @returns Created asset
   */
  async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    // Validate business rules
    await this.validateAssetCreation(createAssetDto);

    // Ensure symbol is uppercase for consistency
    const normalizedCreateDto = {
      ...createAssetDto,
      symbol: createAssetDto.symbol.toUpperCase(),
    };

    // Create asset
    const asset = await this.assetRepository.create(normalizedCreateDto);
    
    // ✅ PERFORMANCE OPTIMIZATION: Async sync with global asset
    // Don't block the response - sync in background
    this.syncAssetInBackground(asset);
    
    return asset;
  }

  /**
   * Sync asset with global asset in background (non-blocking)
   * @private
   */
  private syncAssetInBackground(asset: Asset): void {
    // Use setImmediate to run in next tick (non-blocking)
    setImmediate(async () => {
      try {
        console.log(`[SYNC DEBUG] Starting background sync for asset: ${asset.symbol}`);
        const globalAssetId = await this.assetGlobalSyncService.syncAssetOnCreate({
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          currency: 'VND', // Default currency for now
          userId: asset.createdBy,
        });
        console.log(`[SYNC DEBUG] Background sync completed for asset: ${asset.symbol}, globalAssetId: ${globalAssetId}`);
      } catch (error) {
        console.error(`[SYNC ERROR] Failed to sync asset with global asset: ${error.message}`, error.stack);
        // Log error but don't fail the request
      }
    });
  }

  /**
   * Bulk create assets from global assets
   * @param globalAssetIds - Array of global asset IDs
   * @param accountId - Account ID for ownership
   * @returns Bulk creation result
   */
  async bulkCreateAssetsFromGlobal(
    globalAssetIds: string[],
    accountId: string
  ): Promise<{
    created: Asset[];
    failed: Array<{ globalAssetId: string; error: string }>;
    summary: { total: number; created: number; failed: number };
  }> {
    const created: Asset[] = [];
    const failed: Array<{ globalAssetId: string; error: string }> = [];

    for (const globalAssetId of globalAssetIds) {
      try {
        // Get global asset details
        const globalAsset = await this.assetGlobalSyncService.getGlobalAssetById(globalAssetId);
        
        if (!globalAsset) {
          failed.push({
            globalAssetId,
            error: 'Global asset not found'
          });
          continue;
        }

        // Check if asset already exists for this user
        const existingAsset = await this.assetRepository.findBySymbolAndUser(
          globalAsset.symbol,
          accountId
        );

        if (existingAsset) {
          failed.push({
            globalAssetId,
            error: `Asset with symbol '${globalAsset.symbol}' already exists for this user`
          });
          continue;
        }

        // Create asset from global asset
        const createAssetDto: CreateAssetDto = {
          name: globalAsset.name,
          symbol: globalAsset.symbol,
          type: globalAsset.type,
          description: globalAsset.description,
          createdBy: accountId,
          updatedBy: accountId,
        };

        const asset = await this.create(createAssetDto);
        created.push(asset);

      } catch (error) {
        console.error(`Failed to create asset from global asset ${globalAssetId}:`, error);
        failed.push({
          globalAssetId,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    return {
      created,
      failed,
      summary: {
        total: globalAssetIds.length,
        created: created.length,
        failed: failed.length,
      },
    };
  }

  /**
   * Find all assets with filtering and pagination
   * @param filters - Filter criteria
   * @returns Paginated assets
   */
  async findAll(filters: AssetFilters = {}): Promise<PaginatedResponse<Asset>> {
    console.log('AssetService.findAll called with filters:', filters);
    const result = await this.assetRepository.findWithPagination(filters);
    console.log('AssetService.findAll result:', { total: result.total, dataCount: result.data.length });
    return result;
  }

  /**
   * Find asset by ID
   * @param id - Asset ID
   * @returns Asset with computed fields
   * @throws NotFoundException if asset not found
   */
  async findById(id: string): Promise<Asset> {
    const asset = await this.assetRepository.findById(id);
    
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    // Update computed fields
    try {
      return await this.updateAssetWithComputedFields(asset.id);
    } catch (error) {
      console.warn(`Failed to update computed fields for asset ${asset.id}:`, error);
      return asset; // Return original asset if computation fails
    }
  }

  /**
   * Get asset by ID with computed fields for API response
   * @param id - Asset ID
   * @param portfolioId - Optional portfolio ID
   * @returns Asset with computed fields
   */
  async findByIdWithComputedFields(id: string, portfolioId?: string): Promise<{
    asset: Asset;
    computedFields: {
      currentPrice: number;
      avgCost: number;
    };
  }> {
    const asset = await this.assetRepository.findById(id);
    
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    // Calculate computed fields
    const computedFields = await this.calculateComputedFields(id, portfolioId);

    return {
      asset,
      computedFields: {
        currentPrice: computedFields.currentPrice,
        avgCost: computedFields.avgCost,
      },
    };
  }

  /**
   * Update asset by ID
   * @param id - Asset ID
   * @param updateAssetDto - Update data
   * @returns Updated asset
   * @throws NotFoundException if asset not found
   * @throws BadRequestException if validation fails
   */
  async update(id: string, updateAssetDto: UpdateAssetDto): Promise<Asset> {
    // Check if asset exists
    const existingAsset = await this.findById(id);

    // Validate business rules
    await this.validateAssetUpdate(id, updateAssetDto);

    // Note: Symbol field is read-only after creation, so it's not included in update DTO
    // Only name, type, and description can be updated

    // Update asset
    const updatedAsset = await this.assetRepository.update(id, updateAssetDto);
    
    // Sync with global asset
    try {
      await this.assetGlobalSyncService.syncAssetOnUpdate(id, {
        name: updateAssetDto.name,
        type: updateAssetDto.type,
        currency: 'VND', // Default currency for now
      });
    } catch (error) {
      console.warn(`Failed to sync asset with global asset: ${error.message}`);
      // Continue without failing the asset update
    }
    
    return updatedAsset;
  }

  /**
   * Delete asset by ID
   * @param id - Asset ID
   * @throws NotFoundException if asset not found
   * @throws BadRequestException if asset has associated trades
   */
  async delete(id: string): Promise<void> {
    // Check if asset exists
    await this.findById(id);

    // Check if asset has associated trades
    const hasTrades = await this.assetRepository.hasTrades(id);
    if (hasTrades) {
      throw new BadRequestException('Cannot delete asset with associated trades');
    }

    // Delete asset
    await this.assetRepository.delete(id);
  }

  /**
   * Find assets by user ID (created by user)
   * @param userId - User ID
   * @param filters - Additional filters
   * @returns Paginated assets with computed fields
   */
  async findByUserId(
    userId: string,
    filters: Omit<AssetFilters, 'createdBy'> = {}
  ): Promise<PaginatedResponse<Asset>> {
    const result = await this.assetRepository.findByUserIdWithPagination(userId, filters);
    
    // ✅ OPTIMIZED: No need to calculate computed fields for list view
    // Computed fields will be calculated on-demand when needed
    // This significantly improves performance for large asset lists
    
    return result;
  }

  /**
   * Find assets by type
   * @param type - Asset type
   * @param userId - Optional user ID filter
   * @returns Array of assets
   */
  async findByType(type: AssetType, userId?: string): Promise<Asset[]> {
    return await this.assetRepository.findByType(type, userId);
  }

  /**
   * Search assets by name or code
   * @param searchTerm - Search term
   * @param userId - Optional user ID filter
   * @returns Array of assets
   */
  async search(searchTerm: string, userId?: string): Promise<Asset[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new BadRequestException('Search term must be at least 2 characters long');
    }

    return await this.assetRepository.search(searchTerm.trim(), userId);
  }

  /**
   * Get asset statistics by user
   * @param userId - User ID
   * @returns Asset statistics
   */
  async getAssetStatistics(userId: string): Promise<AssetStatistics> {
    return await this.assetRepository.getAssetStatistics(userId);
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
    if (minValue < 0 || maxValue < 0) {
      throw new BadRequestException('Value range must be positive');
    }

    if (minValue > maxValue) {
      throw new BadRequestException('Minimum value cannot be greater than maximum value');
    }

    return await this.assetRepository.findByValueRange(minValue, maxValue, userId);
  }

  /**
   * Get recent assets
   * @param limit - Number of assets to return
   * @param userId - Optional user ID filter
   * @returns Array of recent assets
   */
  async findRecent(limit: number = 10, userId?: string): Promise<Asset[]> {
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    return await this.assetRepository.findRecent(limit, userId);
  }

  /**
   * Validate asset creation
   * @param createAssetDto - Asset creation data
   * @throws BadRequestException if validation fails
   * @throws ConflictException if uniqueness constraints are violated
   */
  private async validateAssetCreation(createAssetDto: CreateAssetDto): Promise<void> {
    // Validate required fields
    if (!createAssetDto.name || createAssetDto.name.trim().length === 0) {
      throw new BadRequestException('Asset name is required');
    }

    if (!createAssetDto.symbol || createAssetDto.symbol.trim().length === 0) {
      throw new BadRequestException('Asset symbol is required');
    }

    if (!createAssetDto.type) {
      throw new BadRequestException('Asset type is required');
    }

    // Validate symbol format (uppercase, alphanumeric, underscore only)
    if (!/^[A-Z0-9-]+$/.test(createAssetDto.symbol)) {
      throw new BadRequestException('Asset symbol must contain only uppercase letters, numbers, and dashes');
    }

    // Note: initialValue, initialQuantity are computed fields and don't need validation

    // Validate symbol uniqueness per user (not globally)
    const isSymbolUnique = await this.assetRepository.isSymbolUniqueForUser(
      createAssetDto.symbol.trim(),
      createAssetDto.createdBy
    );

    if (!isSymbolUnique) {
      throw new ConflictException(`Asset symbol '${createAssetDto.symbol}' already exists for this user`);
    }

    // Note: Name can be duplicated across users, so no uniqueness validation needed
    // Code field is deprecated and not validated for uniqueness
    // currentValue, currentQuantity are computed fields and don't need validation
  }

  /**
   * Validate asset update
   * @param id - Asset ID
   * @param updateAssetDto - Update data
   * @throws BadRequestException if validation fails
   * @throws ConflictException if uniqueness constraints are violated
   */
  private async validateAssetUpdate(id: string, updateAssetDto: UpdateAssetDto): Promise<void> {
    // Validate name if provided
    if (updateAssetDto.name !== undefined) {
      if (updateAssetDto.name.trim().length === 0) {
        throw new BadRequestException('Asset name cannot be empty');
      }

      // Note: Name can be duplicated across users, so no uniqueness validation needed
    }

    // Note: Symbol field is read-only after creation, so it's not included in update DTO
    // Code field is deprecated and not included in update DTO

    // Note: initialValue, initialQuantity, currentValue, currentQuantity are computed fields
    // and don't need validation as they are calculated automatically
  }

  /**
   * Check if asset exists
   * @param id - Asset ID
   * @returns True if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const asset = await this.assetRepository.findById(id);
    return asset !== null;
  }

  /**
   * Get asset count by user
   * @param userId - User ID
   * @returns Number of assets
   */
  async getAssetCount(userId: string): Promise<number> {
    return await this.assetRepository.countByUserId(userId);
  }

  /**
   * Check if asset has trades
   * @param id - Asset ID
   * @returns True if has trades, false otherwise
   */
  async hasTrades(id: string): Promise<boolean> {
    return await this.assetRepository.hasTrades(id);
  }

  /**
   * Get number of trades for an asset
   * @param id - Asset ID
   * @returns Number of trades
   */
  async getTradeCount(id: string): Promise<number> {
    const trades = await this.assetRepository.getTradesForAsset(id);
    return trades.length;
  }

  /**
   * Get portfolio and trade info for an asset
   * @param assetId - Asset ID
   * @param accountId - Account ID
   * @returns Portfolio and trade information
   */
  async getAssetPortfolioInfo(assetId: string, accountId: string): Promise<{
    portfolios: Array<{ id: string; name: string }>;
    trades: Array<{
      id: string;
      portfolioId: string;
      portfolioName: string;
      type: string;
      quantity: number;
      price: number;
      date: string;
    }>;
  }> {
    try {
      // Get all trades for this asset
      const trades = await this.assetRepository.getTradesForAsset(assetId);
      
      // Get all portfolios for the account
      const portfolios = await this.assetRepository.getPortfoliosForAccount(accountId);
      
      // Group trades by portfolio
      const portfolioTradeMap = new Map<string, any[]>();
      for (const trade of trades) {
        const portfolioId = trade.portfolioId;
        if (portfolioId) {
          if (!portfolioTradeMap.has(portfolioId)) {
            portfolioTradeMap.set(portfolioId, []);
          }
          portfolioTradeMap.get(portfolioId)!.push(trade);
        }
      }

      
      // Find related portfolios
      const relatedPortfolios = [];
      const tradeDetails = [];
      
      for (const [portfolioId, portfolioTrades] of portfolioTradeMap) {
        const portfolio = portfolios.find(p => {
          const pid = p.id || p.portfolioId || (p as any).uuid;
          return pid === portfolioId;
        });
        
        if (portfolio) {
          relatedPortfolios.push({
            id: portfolio.id || portfolio.portfolioId || (portfolio as any).uuid,
            name: portfolio.name || portfolio.portfolioName || 'Unnamed Portfolio'
          });
          
          // Add trade details
          for (const trade of portfolioTrades) {
            tradeDetails.push({
              id: trade.id,
              portfolioId: trade.portfolioId,
              portfolioName: portfolio.name || portfolio.portfolioName || 'Unnamed Portfolio',
              type: trade.type || 'BUY',
              quantity: trade.quantity || 0,
              price: trade.price || 0,
              date: trade.date ? new Date(trade.date).toISOString() : new Date().toISOString()
            });
          }
        }
      }
      
      return {
        portfolios: relatedPortfolios,
        trades: tradeDetails
      };
    } catch (error) {
      console.error('Error getting asset portfolio info:', error);
      return {
        portfolios: [],
        trades: []
      };
    }
  }

  /**
   * Delete all trades for an asset
   * @param id - Asset ID
   * @returns Number of deleted trades
   */
  async deleteAllTrades(id: string): Promise<number> {
    const trades = await this.assetRepository.getTradesForAsset(id);
    const tradeCount = trades.length;
    
    // Delete all trades and their details
    for (const trade of trades) {
      // Then delete the trade
      await this.assetRepository.deleteTrade(trade.tradeId);
      // Delete cash flows associated with this trade
      await this.cashFlowService.deleteCashFlowAndRecalculateBalanceByReferenceId(trade.tradeId);
      
    }
    
    // Invalidate cache
    this.cacheService.invalidateAsset(id);
    
    return tradeCount;
  }

  /**
   * Get asset summary for dashboard
   * @param userId - User ID
   * @returns Asset summary
   */
  async getAssetSummary(userId: string): Promise<{
    totalAssets: number;
    totalValue: number;
    averageValue: number;
    assetsByType: Record<AssetType, number>;
    recentAssets: Asset[];
  }> {
    const [statistics, recentAssets] = await Promise.all([
      this.getAssetStatistics(userId),
      this.findRecent(5, userId),
    ]);

    return {
      totalAssets: statistics.totalAssets,
      totalValue: statistics.totalValue,
      averageValue: statistics.averageValue,
      assetsByType: statistics.assetsByType,
      recentAssets,
    };
  }

  /**
   * Find assets by portfolio ID
   * @param portfolioId - Portfolio ID
   * @returns Array of assets
   */
  async findByPortfolioId(portfolioId: string): Promise<Asset[]> {
    return await this.assetRepository.findByPortfolioId(portfolioId);
  }

  /**
   * Find assets by portfolio ID with pagination
   * @param portfolioId - Portfolio ID
   * @param filters - Additional filters
   * @returns Paginated assets
   */
  async findByPortfolioIdWithPagination(
    portfolioId: string,
    filters?: AssetFilters
  ): Promise<PaginatedResponse<Asset>> {
    return await this.assetRepository.findByPortfolioIdWithPagination(portfolioId, filters);
  }

  /**
   * Count assets by portfolio ID
   * @param portfolioId - Portfolio ID
   * @returns Number of assets
   */
  async countByPortfolioId(portfolioId: string): Promise<number> {
    return await this.assetRepository.countByPortfolioId(portfolioId);
  }

  /**
   * Calculate initial value and quantity from first trade
   * @param assetId - Asset ID
   * @returns Object with initialValue and initialQuantity
   */
  async calculateInitialValues(assetId: string): Promise<{
    initialValue: number;
    initialQuantity: number;
  }> {
    const cacheKey = `initial:${assetId}`;
    const cached = this.cacheService.get<{
      initialValue: number;
      initialQuantity: number;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    // Get the first trade for this asset (ordered by trade date)
    const firstTrade = await this.assetRepository.getFirstTrade(assetId);
    
    let result: {
      initialValue: number;
      initialQuantity: number;
    };

    if (!firstTrade) {
      result = {
        initialValue: 0,
        initialQuantity: 0,
      };
    } else {
      // Calculate initial values from first trade
      const quantity = Number(firstTrade.quantity);
      const price = Number(firstTrade.price);
      const fee = Number(firstTrade.fee || 0);
      const tax = Number(firstTrade.tax || 0);
      
      const initialValue = quantity * price + fee + tax;
      const initialQuantity = quantity;

      result = {
        initialValue: isNaN(initialValue) ? 0 : initialValue,
        initialQuantity: isNaN(initialQuantity) ? 0 : initialQuantity,
      };
    }

    // Cache for 5 minutes
    this.cacheService.set(cacheKey, result, 5 * 60 * 1000);

    return result;
  }

  /**
   * Calculate current value and quantity from all trades
   * @param assetId - Asset ID
   * @param portfolioId - Portfolio ID to filter trades (optional)
   * @returns Object with currentValue and currentQuantity
   * Note: currentValue is now calculated real-time as currentQuantity * currentPrice
   */
  async calculateCurrentValues(assetId: string, portfolioId?: string): Promise<{
    currentValue: number;
    currentQuantity: number;
    currentPrice: number;
    avgCost: number;
  }> {
    const cacheKey = `current:${assetId}:${portfolioId || 'none'}`;
    const cached = this.cacheService.get<{
      currentValue: number;
      currentQuantity: number;
      currentPrice: number;
      avgCost: number;
    }>(cacheKey);

    if (cached) {
      console.log(`[DEBUG] Using cached current values for ${assetId}: currentPrice=${cached.currentPrice}, currentQuantity=${cached.currentQuantity}`);
      return cached;
    }

    console.log(`[DEBUG] Calculating current values for ${assetId}, portfolioId=${portfolioId}`);

    // Get asset first
    const asset = await this.assetRepository.findById(assetId);
    console.log(`[DEBUG] Asset found: ${asset ? 'YES' : 'NO'}, initialQuantity: ${asset?.initialQuantity}, currentQuantity: ${asset?.currentQuantity}`);
    if (!asset) {
      return {
        currentValue: 0,
        currentQuantity: 0,
        currentPrice: 0,
        avgCost: 0,
      };
    }

    // Get trades for this asset with proper filtering
    let trades: any[];
    if (portfolioId) {
      // Filter by portfolio
      trades = await this.assetRepository.getAssetTradesByPortfolioFinal(assetId, portfolioId);
    } else {
      // No filtering - get all trades (when no portfolioId specified)
      trades = await this.assetRepository.getTradesForAsset(assetId);
    }
    
    let result: {
      currentValue: number;
      currentQuantity: number;
      currentPrice: number;
      avgCost: number;
    };
    
    // Get current market price for this asset - use fresh data from global_assets
    let currentMarketPrice = 0;
    const globalAssetPrice = await this.getCurrentPriceFromGlobalAssetJoin(asset.symbol);
    if (globalAssetPrice !== null && globalAssetPrice > 0) {
      currentMarketPrice = globalAssetPrice;
      console.log(`[DEBUG] Using fresh global asset price: ${currentMarketPrice}`);
    } else {
      // Fallback to cached method if global asset not available
      currentMarketPrice = await this.getCurrentMarketPrice(assetId);
      console.log(`[DEBUG] Using fallback price: ${currentMarketPrice}`);
    }

    if (!trades || trades.length === 0) {
      // If no trades in this portfolio, quantity should be 0
      console.log(`[DEBUG] No trades found for asset ${assetId} in portfolio ${portfolioId}, returning quantity = 0`);
      result = {
        currentValue: 0,
        currentQuantity: 0,
        currentPrice: currentMarketPrice,
        avgCost: 0,
      };
    } else {
      // Calculate current quantity and average cost
      let currentQuantity = 0;
      let totalCost = 0;
      let totalQuantity = 0;
      
      for (const trade of trades) {
        const quantity = Number(trade.quantity);
        const price = Number(trade.price);
        const fee = Number(trade.fee || 0);
        const tax = Number(trade.tax || 0);
        const totalTradeCost = quantity * price + fee + tax;
        
        console.log(`[DEBUG] Trade: ${trade.side} ${quantity} @ ${price}, portfolioId: ${trade.portfolioId}, currentQuantity before: ${currentQuantity}`);
        
        if (trade.side === 'BUY') {
          currentQuantity += quantity;
          totalCost += totalTradeCost;
          totalQuantity += quantity;
        } else if (trade.side === 'SELL') {
          currentQuantity -= quantity;
          // For sells, we don't add to totalCost but we need to track for avgCost calculation
        }
        
        console.log(`[DEBUG] Trade processed: currentQuantity after: ${currentQuantity}`);
      }

      
      
      console.log(`[DEBUG] Trades found: ${trades.length}`);
      console.log(`[DEBUG] Trades found, calculating from trades`);
      
      // Calculate current value
      const currentValue = currentQuantity * currentMarketPrice;
      
      // Calculate average cost (only from buy trades)
      const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

      result = {
        currentValue: Math.max(0, currentValue), // Ensure non-negative
        currentQuantity: Math.max(0, currentQuantity), // Ensure non-negative
        currentPrice: currentMarketPrice,
        avgCost: avgCost,
      };
      
      console.log(`[DEBUG] Final result for ${assetId}: currentQuantity=${result.currentQuantity}, currentValue=${result.currentValue}, currentPrice=${result.currentPrice}, avgCost=${result.avgCost}`);
    }

    // Cache for 2 minutes (shorter TTL for current values as they change more frequently)
    this.cacheService.set(cacheKey, result, 2 * 60 * 1000);

    return result;
  }

  /**
   * Calculate current value real-time (currentQuantity * currentPrice)
   * @param assetId - Asset ID
   * @param portfolioId - Portfolio ID to filter trades (optional)
   * @returns Current value calculated real-time
   */
  async calculateCurrentValue(assetId: string, portfolioId?: string): Promise<number> {
    const computedFields = await this.calculateCurrentValues(assetId, portfolioId);
    return computedFields.currentValue; // This is already calculated as currentQuantity * currentPrice
  }

  /**
   * Get current market price for an asset
   * @param assetId - Asset ID
   * @returns Current market price
   */
  private async getCurrentMarketPrice(assetId: string): Promise<number> {
    // Get asset to get symbol
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      return 0;
    }

    // Try to get current price from global asset first
    const globalAssetPrice = await this.assetGlobalSyncService.getCurrentPriceFromGlobalAsset(asset.symbol);
    if (globalAssetPrice !== null && globalAssetPrice > 0) {
      console.log(`[DEBUG] Using global asset price: ${globalAssetPrice}`);
      return globalAssetPrice;
    }

    // Fallback to market data service
    const marketPrice = await this.marketDataService.getCurrentPrice(asset.symbol);
    console.log(`[DEBUG] getCurrentMarketPrice for ${asset.symbol}: marketPrice=${marketPrice}`);
    
    if (marketPrice > 0) {
      console.log(`[DEBUG] Using market price: ${marketPrice}`);
      return marketPrice;
    }

    // Fallback to latest trade price if no market data available
    const latestTrade = await this.assetRepository.getLatestTrade(assetId);
    if (latestTrade) {
      console.log(`[DEBUG] Fallback to trade price: ${latestTrade.price}`);
      return latestTrade.price;
    }

    // Default price if no trades exist
    console.log(`[DEBUG] No price available, returning 0`);
    return 0;
  }

  /**
   * Get current price directly from global assets table with join
   * This method is optimized for calculations that need fresh price data
   * @param symbol - Asset symbol
   * @returns Current price or null if not found
   */
  private async getCurrentPriceFromGlobalAssetJoin(symbol: string): Promise<number | null> {
    try {
      const globalAsset = await this.assetGlobalSyncService.getGlobalAssetBySymbol(symbol);
      if (!globalAsset || !globalAsset.assetPrice) {
        return null;
      }
      return globalAsset.assetPrice.currentPrice;
    } catch (error) {
      console.error(`Failed to get current price from global asset join: ${error.message}`);
      return null;
    }
  }

  /**
   * Calculate all computed fields for an asset
   * @param assetId - Asset ID
   * @returns Object with all computed values
   */
  async calculateComputedFields(assetId: string, portfolioId?: string): Promise<{
    initialValue: number;
    initialQuantity: number;
    currentQuantity: number;
    currentPrice: number;
    avgCost: number;
  }> {
    const [initialValues, currentValues] = await Promise.all([
      this.calculateInitialValues(assetId),
      this.calculateCurrentValues(assetId, portfolioId),
    ]);

    return {
      ...initialValues,
      // Exclude currentValue - calculated real-time as currentQuantity * currentPrice
      currentQuantity: currentValues.currentQuantity,
      currentPrice: currentValues.currentPrice,
      avgCost: currentValues.avgCost,
    };
  }

  /**
   * Update asset with computed fields
   * @param assetId - Asset ID
   * @returns Updated asset with computed fields
   */
  async updateAssetWithComputedFields(assetId: string, portfolioId?: string): Promise<Asset> {
    const computedFields = await this.calculateComputedFields(assetId, portfolioId);
    
    // Get the asset to preserve the original createdBy user
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    
    // Update the asset with computed fields (excluding currentValue - calculated real-time)
    const updateData = {
      initialValue: Number(computedFields.initialValue),
      initialQuantity: Number(computedFields.initialQuantity),
      // currentValue removed - calculated real-time as currentQuantity * currentPrice
      currentQuantity: Number(computedFields.currentQuantity),
      updatedBy: asset.createdBy || asset.updatedBy,
    };

    const updatedAsset = await this.assetRepository.update(assetId, updateData);
    
    // Invalidate cache for this asset
    this.cacheService.invalidateAsset(assetId);
    
    return updatedAsset;
  }


  /**
   * Calculate current value for multiple assets
   * @param assetIds - Array of asset IDs
   * @param options - Additional calculation options
   * @returns Total current value
   */
  async calculateTotalCurrentValue(
    assetIds: string[],
    options?: {
      tax?: number;
      fee?: number;
      discount?: number;
      commission?: number;
      otherDeductions?: number;
    }
  ): Promise<number> {
    const assets = await Promise.all(
      assetIds.map(async (assetId) => {
        const asset = await this.assetRepository.findById(assetId);
        if (!asset) return null;
        
        const currentPrice = await this.getCurrentPriceFromGlobalAssetJoin(asset.symbol);
        return {
          quantity: asset.currentQuantity || 0,
          price: currentPrice || 0,
          ...options
        };
      })
    );

    const validAssets = assets.filter(asset => asset !== null);
    return this.assetValueCalculator.calculateTotalCurrentValue(validAssets);
  }

}
