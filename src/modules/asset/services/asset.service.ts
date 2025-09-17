import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { AssetRepository, AssetFilters, PaginatedResponse } from '../repositories/asset.repository';
import { IAssetRepository, AssetStatistics } from '../repositories/asset.repository.interface';
import { Asset } from '../entities/asset.entity';
import { AssetType } from '../enums/asset-type.enum';
import { AssetCacheService } from './asset-cache.service';
import { AssetMigrationService } from './asset-migration.service';
import { MarketDataService } from '../../market-data/services/market-data.service';
import { 
  MigrationDataAnalysisDto, 
  MigrationResultDto, 
  RollbackResultDto 
} from '../dto/migration-data-analysis.dto';

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
    private readonly migrationService: AssetMigrationService,
    private readonly marketDataService: MarketDataService,
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
    
    return asset;
  }

  /**
   * Find all assets with filtering and pagination
   * @param filters - Filter criteria
   * @returns Paginated assets
   */
  async findAll(filters: AssetFilters = {}): Promise<PaginatedResponse<Asset>> {
    return await this.assetRepository.findWithPagination(filters);
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
   * Delete all trades for an asset
   * @param id - Asset ID
   * @returns Number of deleted trades
   */
  async deleteAllTrades(id: string): Promise<number> {
    const trades = await this.assetRepository.getTradesForAsset(id);
    const tradeCount = trades.length;
    
    // Delete all trades and their details
    for (const trade of trades) {
      // First delete trade details (foreign key constraint)
      await this.assetRepository.deleteTradeDetails(trade.tradeId);
      // Then delete the trade
      await this.assetRepository.deleteTrade(trade.tradeId);
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
      console.log(`[DEBUG] Using cached current values for ${assetId}: currentPrice=${cached.currentPrice}`);
      return cached;
    }

    console.log(`[DEBUG] Calculating current values for ${assetId}, portfolioId=${portfolioId}`);

    // Get asset first
    const asset = await this.assetRepository.findById(assetId);
    console.log(`[DEBUG] Asset found: ${asset ? 'YES' : 'NO'}, initialQuantity: ${asset?.initialQuantity}`);
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
      trades = await this.assetRepository.getTradesForAssetByPortfolio(assetId, portfolioId);
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
    
    // Get current market price for this asset
    const currentMarketPrice = await this.getCurrentMarketPrice(assetId);

    if (!trades || trades.length === 0) {
      // If no trades, use initial quantity for current quantity and get market price
      const initialQuantity = Number(asset.initialQuantity || 0);
      result = {
        currentValue: initialQuantity * currentMarketPrice,
        currentQuantity: initialQuantity,
        currentPrice: currentMarketPrice,
        avgCost: Number(asset.initialValue || 0) / initialQuantity || 0,
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
        
        if (trade.side === 'BUY') {
          currentQuantity += quantity;
          totalCost += totalTradeCost;
          totalQuantity += quantity;
        } else if (trade.side === 'SELL') {
          currentQuantity -= quantity;
          // For sells, we don't add to totalCost but we need to track for avgCost calculation
        }
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

    // Try to get current market price from market data service
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
   * Calculate all computed fields for an asset
   * @param assetId - Asset ID
   * @returns Object with all computed values
   */
  async calculateComputedFields(assetId: string, portfolioId?: string): Promise<{
    initialValue: number;
    initialQuantity: number;
    currentValue: number;
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
      ...currentValues,
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
    
    // Update the asset with computed fields
    const updateData = {
      initialValue: Number(computedFields.initialValue),
      initialQuantity: Number(computedFields.initialQuantity),
      currentValue: Number(computedFields.currentValue),
      currentQuantity: Number(computedFields.currentQuantity),
      updatedBy: asset.createdBy || asset.updatedBy || '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', // Fallback to test user
    };

    const updatedAsset = await this.assetRepository.update(assetId, updateData);
    
    // Invalidate cache for this asset
    this.cacheService.invalidateAsset(assetId);
    
    return updatedAsset;
  }

  // ==================== MIGRATION METHODS ====================

  /**
   * Analyze current data distribution for migration
   * @returns Data analysis result
   */
  async analyzeMigrationData(): Promise<MigrationDataAnalysisDto> {
    return this.migrationService.analyzeDataDistribution();
  }

  /**
   * Migrate code field to symbol field
   * @returns Migration result
   */
  async migrateCodeToSymbol(): Promise<MigrationResultDto> {
    return this.migrationService.migrateCodeToSymbol();
  }

  /**
   * Validate migration success
   * @returns Validation result
   */
  async validateMigration(): Promise<{ isValid: boolean; issues: string[] }> {
    return this.migrationService.validateMigration();
  }

  /**
   * Rollback migration (restore code field from symbol)
   * @returns Rollback result
   */
  async rollbackMigration(): Promise<RollbackResultDto> {
    return this.migrationService.rollbackMigration();
  }
}
