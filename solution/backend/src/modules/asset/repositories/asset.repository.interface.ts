import { Asset } from '../entities/asset.entity';
import { AssetType } from '../enums/asset-type.enum';
import { AssetFilters, PaginatedResponse } from './asset.repository';

/**
 * Asset Repository Interface
 * Defines the contract for Asset data access operations
 */
export interface IAssetRepository {
  /**
   * Create a new asset
   * @param assetData - Asset data to create
   * @returns Promise<Asset> - Created asset
   */
  create(assetData: Partial<Asset>): Promise<Asset>;

  /**
   * Find all assets with filtering and pagination
   * @param filters - Filter criteria
   * @returns Promise<[Asset[], number]> - Array of assets and total count
   */
  findAll(filters?: AssetFilters): Promise<[Asset[], number]>;

  /**
   * Find assets with pagination
   * @param filters - Filter criteria
   * @returns Promise<PaginatedResponse<Asset>> - Paginated response
   */
  findWithPagination(filters?: AssetFilters): Promise<PaginatedResponse<Asset>>;

  /**
   * Find asset by ID
   * @param id - Asset ID
   * @returns Promise<Asset | null> - Asset or null if not found
   */
  findById(id: string): Promise<Asset | null>;

  /**
   * Find asset by ID with trades relationship
   * @param id - Asset ID
   * @returns Promise<Asset | null> - Asset with trades or null if not found
   */
  findByIdWithTrades(id: string): Promise<Asset | null>;

  /**
   * Update asset by ID
   * @param id - Asset ID
   * @param updateData - Data to update
   * @returns Promise<Asset> - Updated asset
   */
  update(id: string, updateData: Partial<Asset>): Promise<Asset>;

  /**
   * Delete asset by ID
   * @param id - Asset ID
   * @returns Promise<void>
   */
  delete(id: string): Promise<void>;

  /**
   * Find assets by user ID
   * @param userId - User ID
   * @returns Promise<Asset[]> - Array of assets
   */
  findByUserId(userId: string): Promise<Asset[]>;

  /**
   * Find assets by user ID with pagination
   * @param userId - User ID
   * @param filters - Additional filters
   * @returns Promise<PaginatedResponse<Asset>> - Paginated assets
   */
  findByUserIdWithPagination(
    userId: string,
    filters?: Omit<AssetFilters, 'createdBy'>
  ): Promise<PaginatedResponse<Asset>>;

  /**
   * Find assets by type
   * @param type - Asset type
   * @param userId - Optional user ID filter
   * @returns Promise<Asset[]> - Array of assets
   */
  findByType(type: AssetType, userId?: string): Promise<Asset[]>;

  /**
   * Search assets by name, symbol, or description
   * @param searchTerm - Search term
   * @param userId - Optional user ID filter
   * @returns Promise<Asset[]> - Array of assets
   */
  search(searchTerm: string, userId?: string): Promise<Asset[]>;

  /**
   * Count assets by user ID
   * @param userId - User ID
   * @returns Promise<number> - Number of assets
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Check if asset name is unique globally
   * @param name - Asset name
   * @param excludeId - Asset ID to exclude from check
   * @returns Promise<boolean> - True if unique, false otherwise
   */
  isNameUniqueGlobally(
    name: string,
    excludeId?: string
  ): Promise<boolean>;

  /**
   * Check if asset symbol is unique globally
   * @param symbol - Asset symbol
   * @param excludeId - Asset ID to exclude from check
   * @returns Promise<boolean> - True if unique, false otherwise
   */
  isSymbolUniqueGlobally(symbol: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if asset symbol is unique for a specific user
   * @param symbol - Asset symbol
   * @param userId - User ID
   * @param excludeId - Asset ID to exclude from check
   * @returns Promise<boolean> - True if unique, false otherwise
   */
  isSymbolUniqueForUser(
    symbol: string,
    userId: string,
    excludeId?: string
  ): Promise<boolean>;

  /**
   * Check if asset has associated trades
   * @param id - Asset ID
   * @returns Promise<boolean> - True if has trades, false otherwise
   */
  hasTrades(id: string): Promise<boolean>;

  /**
   * Get asset statistics by user
   * @param userId - User ID
   * @returns Promise<AssetStatistics> - Asset statistics
   */
  getAssetStatistics(userId: string): Promise<AssetStatistics>;

  /**
   * Get assets by value range
   * @param minValue - Minimum value
   * @param maxValue - Maximum value
   * @param userId - Optional user ID filter
   * @returns Promise<Asset[]> - Array of assets
   */
  findByValueRange(
    minValue: number,
    maxValue: number,
    userId?: string
  ): Promise<Asset[]>;

  /**
   * Get recent assets
   * @param limit - Number of assets to return
   * @param userId - Optional user ID filter
   * @returns Promise<Asset[]> - Array of recent assets
   */
  findRecent(limit?: number, userId?: string): Promise<Asset[]>;

  /**
   * Find assets by portfolio ID
   * @param portfolioId - Portfolio ID
   * @returns Promise<Asset[]> - Array of assets
   */
  findByPortfolioId(portfolioId: string): Promise<Asset[]>;

  /**
   * Find assets by portfolio ID with pagination
   * @param portfolioId - Portfolio ID
   * @param filters - Additional filters
   * @returns Promise<PaginatedResponse<Asset>> - Paginated assets
   */
  findByPortfolioIdWithPagination(
    portfolioId: string,
    filters?: AssetFilters
  ): Promise<PaginatedResponse<Asset>>;

  /**
   * Count assets by portfolio ID
   * @param portfolioId - Portfolio ID
   * @returns Promise<number> - Number of assets
   */
  countByPortfolioId(portfolioId: string): Promise<number>;

  /**
   * Check if asset name is unique within a portfolio
   * @param name - Asset name
   * @param portfolioId - Portfolio ID
   * @param excludeId - Asset ID to exclude from check
   * @returns Promise<boolean> - True if unique, false otherwise
   */
  isNameUniqueInPortfolio(
    name: string,
    portfolioId: string,
    excludeId?: string
  ): Promise<boolean>;

  /**
   * Get the first trade for an asset (ordered by trade date)
   * @param assetId - Asset ID
   * @returns Promise<Trade | null> - First trade or null if none exists
   */
  getFirstTrade(assetId: string): Promise<any | null>;

  /**
   * Get all trades for an asset
   * @param assetId - Asset ID
   * @returns Promise<Trade[]> - Array of trades
   */
  getTradesForAsset(assetId: string): Promise<any[]>;

  /**
   * Get all portfolios for an account
   * @param accountId - Account ID
   * @returns Promise<any[]> - Array of portfolios
   */
  getPortfoliosForAccount(accountId: string): Promise<any[]>;

  /**
   * Get all trades for a specific asset and portfolio
   * @param assetId - Asset ID
   * @param portfolioId - Portfolio ID
   * @returns Promise<Trade[]> - Array of trades
   */
  getAssetTradesByPortfolioFinal(assetId: string, portfolioId: string): Promise<any[]>;


  /**
   * Get the latest trade for an asset
   * @param assetId - Asset ID
   * @returns Promise<Trade | null> - Latest trade or null if none exists
   */
  getLatestTrade(assetId: string): Promise<any | null>;

  /**
   * Delete trade details for a trade
   * @param tradeId - Trade ID
   * @returns Promise<void>
   */
  deleteTradeDetails(tradeId: string): Promise<void>;

  /**
   * Delete a trade by ID
   * @param tradeId - Trade ID
   * @returns Promise<void>
   */
  deleteTrade(tradeId: string): Promise<void>;

  /**
   * Find asset by symbol and user
   * @param symbol - Asset symbol
   * @param userId - User ID
   * @returns Promise<Asset | null> - Asset or null if not found
   */
  findBySymbolAndUser(symbol: string, userId: string): Promise<Asset | null>;
}

/**
 * Asset Statistics Interface
 * Defines the structure for asset statistics data
 */
export interface AssetStatistics {
  /** Total number of assets */
  totalAssets: number;
  
  /** Number of assets by type */
  assetsByType: Record<AssetType, number>;
  
  /** Total value of all assets */
  totalValue: number;
  
  /** Average value per asset */
  averageValue: number;
}
