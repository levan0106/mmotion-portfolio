import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions, Like, In } from 'typeorm';
import { GlobalAsset } from '../entities/global-asset.entity';
import { NationConfigService } from './nation-config.service';
import { BasicPriceService } from './basic-price.service';
import { PriceHistoryService } from './price-history.service';
import { CreateGlobalAssetDto } from '../dto/create-global-asset.dto';
import { UpdateGlobalAssetDto } from '../dto/update-global-asset.dto';
import { GlobalAssetQueryDto } from '../dto/global-asset-query.dto';
import { GlobalAssetResponseDto } from '../dto/global-asset-response.dto';
import { BulkCreateAssetsDto, BulkAssetResultDto, BulkAssetItemDto } from '../dto/bulk-asset.dto';
import { CreateAssetPriceDto } from '../dto/create-asset-price.dto';
import { UpdateAssetPriceDto } from '../dto/update-asset-price.dto';
import { AssetType } from '../enums/asset-type.enum';
import { PriceType, PriceSource } from '../enums/price-type.enum';

type NationCode = 'VN' | 'US' | 'UK' | 'JP' | 'SG';

/**
 * Service for managing global assets in the Global Assets System.
 * Provides CRUD operations and business logic for global assets.
 * 
 * CR-005 Global Assets System:
 * - Multi-national asset management
 * - Nation-specific validation
 * - Symbol uniqueness validation
 * - Integration with nation configuration
 * - Caching for performance
 */
@Injectable()
export class GlobalAssetService {
  private readonly logger = new Logger(GlobalAssetService.name);

  constructor(
    @InjectRepository(GlobalAsset)
    private readonly globalAssetRepository: Repository<GlobalAsset>,
    private readonly nationConfigService: NationConfigService,
    @Inject(forwardRef(() => BasicPriceService))
    private readonly basicPriceService: BasicPriceService,
    @Inject(forwardRef(() => PriceHistoryService))
    private readonly priceHistoryService: PriceHistoryService,
  ) {}

  /**
   * Create a new global asset.
   * @param createDto - Asset creation data
   * @returns Created asset
   */
  async create(createDto: CreateGlobalAssetDto): Promise<GlobalAssetResponseDto> {
    this.logger.log(`Creating global asset: ${createDto.symbol}.${createDto.nation}`);

    // Validate nation configuration
    this.validateNationConfiguration(createDto.nation as NationCode, createDto.type as AssetType);

    // Check if asset already exists
    await this.checkAssetExists(createDto.symbol, createDto.nation as NationCode);

    // Validate symbol format
    this.validateSymbolFormat(createDto.nation as NationCode, createDto.type as AssetType, createDto.symbol);

    // Create asset entity
    const asset = this.globalAssetRepository.create({
      ...createDto,
      isActive: createDto.isActive ?? true,
    });

    try {
      const savedAsset = await this.globalAssetRepository.save(asset);
      this.logger.log(`Global asset created successfully: ${savedAsset.id}`);
      return this.mapToResponseDto(savedAsset);
    } catch (error) {
      this.logger.error(`Failed to create global asset: ${error.message}`);
      throw new BadRequestException(`Failed to create global asset: ${error.message}`);
    }
  }

  /**
   * Find all global assets with filtering, pagination, and sorting.
   * @param queryDto - Query parameters
   * @returns Paginated assets
   */
  async findAll(queryDto: GlobalAssetQueryDto): Promise<{
    data: GlobalAssetResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log('Finding global assets with query parameters');

    const {
      search,
      nation,
      type,
      marketCode,
      currency,
      isActive,
      nations,
      types,
      marketCodes,
      currencies,
      sortBy = 'symbol',
      sortOrder = 'ASC',
      page = 1,
      limit = 10,
      includeInactive = false,
      hasTradesOnly = false,
    } = queryDto;

    // Build where conditions
    const where: FindOptionsWhere<GlobalAsset> = {};

    if (search) {
      where.symbol = Like(`%${search.toUpperCase()}%`);
    }

    if (nation) {
      where.nation = nation;
    }

    if (type) {
      where.type = type;
    }

    if (marketCode) {
      where.marketCode = marketCode;
    }

    if (currency) {
      where.currency = currency;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (nations && nations.length > 0) {
      where.nation = In(nations);
    }

    if (types && types.length > 0) {
      where.type = In(types);
    }

    if (marketCodes && marketCodes.length > 0) {
      where.marketCode = In(marketCodes);
    }

    if (currencies && currencies.length > 0) {
      where.currency = In(currencies);
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    // Build find options
    const findOptions: FindManyOptions<GlobalAsset> = {
      where,
      order: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['assetPrice'],
    };

    try {
      const [assets, total] = await this.globalAssetRepository.findAndCount(findOptions);

      // Filter by trades if needed
      let filteredAssets = assets;
      if (hasTradesOnly) {
        filteredAssets = assets.filter(asset => asset.hasTrades());
      }

      // Compute price change percent using current price vs last price of previous calendar day
      const assetIds = filteredAssets.map(a => a.id);
      let previousDayPriceByAsset = new Map<string, number | null>();
      if (assetIds.length > 0) {
        try {
          for (const assetId of assetIds) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const prevLast = await this.priceHistoryService.getLastPriceOfDay(assetId, yesterday);
            previousDayPriceByAsset.set(assetId, prevLast);
          }
        } catch (e) {
          this.logger.warn(`Failed batch history fetch for priceChangePercent: ${e?.message || e}`);
        }
      }

      const responseData = filteredAssets.map(asset => {
        const dto = this.mapToResponseDto(asset);
        const prev = previousDayPriceByAsset.get(asset.id);
        const rawCurrent = (dto.assetPrice as any)?.currentPrice as any;
        const currentNum = rawCurrent !== undefined && rawCurrent !== null ? parseFloat(String(rawCurrent)) : NaN;
        const prevNum = prev !== undefined && prev !== null ? parseFloat(String(prev)) : NaN;
        const change = isFinite(currentNum) && isFinite(prevNum) && prevNum > 0
          ? ((currentNum - prevNum) / prevNum) * 100
          : 0;
        // Optional: debug trace if always zero
        if (!(isFinite(currentNum) && isFinite(prevNum) && prevNum > 0)) {
          this.logger.debug(`[priceChangePercent] asset=${asset.id} current=${rawCurrent} prev=${prev}`);
        }
        if (dto.assetPrice) {
          dto.assetPrice.priceChangePercent = change;
        } else {
          dto.assetPrice = {
            currentPrice: undefined as any,
            priceType: undefined as any,
            priceSource: undefined as any,
            lastPriceUpdate: undefined as any,
            priceChangePercent: change,
          };
        }
        return dto;
      });

      return {
        data: responseData,
        total: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to find global assets: ${error.message}`);
      throw new BadRequestException(`Failed to find global assets: ${error.message}`);
    }
  }

  /**
   * Find a global asset by ID.
   * @param id - Asset ID
   * @returns Asset or null
   */
  async findOne(id: string): Promise<GlobalAssetResponseDto | null> {
    this.logger.log(`Finding global asset by ID: ${id}`);

    try {
      const asset = await this.globalAssetRepository.findOne({
        where: { id },
        relations: ['assetPrice'],
      });

      if (!asset) {
        return null;
      }

      return this.mapToResponseDto(asset);
    } catch (error) {
      this.logger.error(`Failed to find global asset by ID ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to find global asset: ${error.message}`);
    }
  }

  /**
   * Find a global asset by symbol and nation.
   * @param symbol - Asset symbol
   * @param nation - Nation code
   * @returns Asset or null
   */
  async findBySymbolAndNation(symbol: string, nation: NationCode): Promise<GlobalAssetResponseDto | null> {
    this.logger.log(`Finding global asset by symbol and nation: ${symbol}.${nation}`);

    try {
      const asset = await this.globalAssetRepository.findOne({
        where: { symbol: symbol.toUpperCase(), nation },
        relations: ['assetPrice'],
      });

      if (!asset) {
        return null;
      }

      return this.mapToResponseDto(asset);
    } catch (error) {
      this.logger.error(`Failed to find global asset by symbol and nation ${symbol}.${nation}: ${error.message}`);
      throw new BadRequestException(`Failed to find global asset: ${error.message}`);
    }
  }

  /**
   * Update a global asset.
   * @param id - Asset ID
   * @param updateDto - Update data
   * @returns Updated asset
   */
  async update(id: string, updateDto: UpdateGlobalAssetDto): Promise<GlobalAssetResponseDto> {
    this.logger.log(`Updating global asset: ${id}`);

    const asset = await this.globalAssetRepository.findOne({
      where: { id },
      relations: ['assetPrice'],
    });

    if (!asset) {
      throw new NotFoundException(`Global asset with ID ${id} not found`);
    }

    // Check if asset can be modified
    if (!asset.canModify()) {
      throw new BadRequestException('Asset cannot be modified as it has associated trades');
    }

    // Validate nation configuration if type is being updated
    if (updateDto.type) {
      this.validateNationConfiguration(asset.nation as NationCode, updateDto.type as AssetType);
    }

    // Validate symbol format if type is being updated
    if (updateDto.type) {
      this.validateSymbolFormat(
        asset.nation as NationCode,
        updateDto.type as AssetType,
        asset.symbol,
      );
    }

    try {
      Object.assign(asset, updateDto);
      const savedAsset = await this.globalAssetRepository.save(asset);
      this.logger.log(`Global asset updated successfully: ${savedAsset.id}`);
      return this.mapToResponseDto(savedAsset);
    } catch (error) {
      this.logger.error(`Failed to update global asset ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update global asset: ${error.message}`);
    }
  }

  /**
   * Delete a global asset.
   * @param id - Asset ID
   * @returns Success message
   */
  async remove(id: string): Promise<{ message: string }> {
    this.logger.log(`Deleting global asset: ${id}`);

    const asset = await this.globalAssetRepository.findOne({
      where: { id },
      relations: ['trades'],
    });

    if (!asset) {
      throw new NotFoundException(`Global asset with ID ${id} not found`);
    }

    // Check if asset can be deleted
    if (asset.hasTrades()) {
      throw new BadRequestException('Asset cannot be deleted as it has associated trades');
    }

    try {
      await this.globalAssetRepository.remove(asset);
      this.logger.log(`Global asset deleted successfully: ${id}`);
      return { message: 'Global asset deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete global asset ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete global asset: ${error.message}`);
    }
  }

  /**
   * Get assets by nation.
   * @param nation - Nation code
   * @returns Assets for the nation
   */
  async findByNation(nation: NationCode): Promise<GlobalAssetResponseDto[]> {
    this.logger.log(`Finding global assets by nation: ${nation}`);

    try {
      const assets = await this.globalAssetRepository.find({
        where: { nation, isActive: true },
        relations: ['assetPrice'],
        order: { symbol: 'ASC' },
      });

      return assets.map(asset => this.mapToResponseDto(asset));
    } catch (error) {
      this.logger.error(`Failed to find global assets by nation ${nation}: ${error.message}`);
      throw new BadRequestException(`Failed to find global assets: ${error.message}`);
    }
  }

  /**
   * Get assets by type.
   * @param type - Asset type
   * @returns Assets of the type
   */
  async findByType(type: AssetType): Promise<GlobalAssetResponseDto[]> {
    this.logger.log(`Finding global assets by type: ${type}`);

    try {
      const assets = await this.globalAssetRepository.find({
        where: { type, isActive: true },
        relations: ['assetPrice'],
        order: { symbol: 'ASC' },
      });

      return assets.map(asset => this.mapToResponseDto(asset));
    } catch (error) {
      this.logger.error(`Failed to find global assets by type ${type}: ${error.message}`);
      throw new BadRequestException(`Failed to find global assets: ${error.message}`);
    }
  }

  /**
   * Get asset statistics.
   * @returns Asset statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byNation: Record<string, number>;
    byType: Record<string, number>;
    byMarketCode: Record<string, number>;
    byCurrency: Record<string, number>;
    active: number;
    inactive: number;
  }> {
    this.logger.log('Getting global asset statistics');

    try {
      const assets = await this.globalAssetRepository.find();

      const stats = {
        total: assets.length,
        byNation: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        byMarketCode: {} as Record<string, number>,
        byCurrency: {} as Record<string, number>,
        active: 0,
        inactive: 0,
      };

      assets.forEach(asset => {
        // Count by nation
        stats.byNation[asset.nation] = (stats.byNation[asset.nation] || 0) + 1;

        // Count by type
        stats.byType[asset.type] = (stats.byType[asset.type] || 0) + 1;

        // Count by market code
        stats.byMarketCode[asset.marketCode] = (stats.byMarketCode[asset.marketCode] || 0) + 1;

        // Count by currency
        stats.byCurrency[asset.currency] = (stats.byCurrency[asset.currency] || 0) + 1;

        // Count active/inactive
        if (asset.isActive) {
          stats.active++;
        } else {
          stats.inactive++;
        }
      });

      return stats;
    } catch (error) {
      this.logger.error(`Failed to get global asset statistics: ${error.message}`);
      throw new BadRequestException(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Validate nation configuration for asset creation/update.
   * @private
   */
  private validateNationConfiguration(nation: NationCode, type: AssetType): void {
    if (!this.nationConfigService.isValidNationCode(nation)) {
      throw new BadRequestException(`Invalid nation code: ${nation}`);
    }

    if (!this.nationConfigService.isAssetTypeEnabled(nation, type)) {
      throw new BadRequestException(`Asset type ${type} is not enabled for nation ${nation}`);
    }
  }

  /**
   * Check if asset already exists.
   * @private
   */
  private async checkAssetExists(symbol: string, nation: NationCode): Promise<void> {
    const existingAsset = await this.globalAssetRepository.findOne({
      where: { symbol: symbol.toUpperCase(), nation },
    });

    if (existingAsset) {
      throw new ConflictException(`Asset with symbol ${symbol} already exists in nation ${nation}`);
    }
  }

  /**
   * Validate symbol format.
   * @private
   */
  private validateSymbolFormat(nation: NationCode, type: AssetType, symbol: string): void {
    if (!this.nationConfigService.validateSymbolFormat(nation, type, symbol)) {
      throw new BadRequestException(`Invalid symbol format for ${type} in nation ${nation}`);
    }
  }

  /**
   * Map entity to response DTO.
   * @private
   */
  private mapToResponseDto(asset: GlobalAsset): GlobalAssetResponseDto {
    const dto: GlobalAssetResponseDto = {
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      nation: asset.nation,
      marketCode: asset.marketCode,
      currency: asset.currency,
      timezone: asset.timezone,
      isActive: asset.isActive,
      description: asset.description,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
      globalIdentifier: asset.getGlobalIdentifier(),
      displayName: asset.getDisplayName(),
      marketDisplayName: asset.getMarketDisplayName(),
      hasTrades: asset.hasTrades(),
      isAvailableForTrading: asset.isAvailableForTrading(),
      marketInfo: asset.getMarketInfo(),
      canModify: asset.canModify(),
    };

    // Attach latest price if relation is loaded
    const anyAsset = asset as any;
    if (anyAsset.assetPrice) {
      dto.assetPrice = {
        currentPrice: anyAsset.assetPrice.currentPrice,
        priceType: anyAsset.assetPrice.priceType,
        priceSource: anyAsset.assetPrice.priceSource,
        lastPriceUpdate: anyAsset.assetPrice.lastPriceUpdate,
        priceChangePercent: dto.assetPrice?.priceChangePercent,
      };
    }

    return dto;
  }

  /**
   * Bulk create/update assets with prices.
   * Creates new assets if they don't exist, updates prices if they do.
   * @param bulkDto - Bulk asset creation data
   * @returns Bulk operation result
   */
  async bulkCreateOrUpdateAssets(bulkDto: BulkCreateAssetsDto): Promise<BulkAssetResultDto> {
    this.logger.log(`Bulk processing ${bulkDto.assets.length} assets`);

    const result: BulkAssetResultDto = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
      total: bulkDto.assets.length,
    };

    // Process each asset individually to handle errors gracefully
    for (const assetData of bulkDto.assets) {
      try {
        await this.processBulkAsset(assetData, result);
      } catch (error) {
        result.failed++;
        result.errors.push(`${assetData.symbol}: ${error.message}`);
        this.logger.error(`Failed to process asset ${assetData.symbol}: ${error.message}`);
      }
    }

    this.logger.log(`Bulk operation completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
    return result;
  }

  /**
   * Process a single asset in bulk operation.
   * @param assetData - Asset data
   * @param result - Result object to update
   */
  private async processBulkAsset(assetData: BulkAssetItemDto, result: BulkAssetResultDto): Promise<void> {
    const { symbol, name, assetType, price, nation, currency, createdAt } = assetData;
    
    // Ensure assetType is properly typed as AssetType enum
    const typedAssetType = assetType as AssetType;

    // Check if asset already exists
    const existingAsset = await this.findAssetBySymbolAndNation(symbol, nation as NationCode);

    if (existingAsset) {
      // Update existing asset price
      await this.updateAssetPrice(existingAsset.id, price, createdAt || new Date().toISOString());
      result.updated++;
      this.logger.log(`Updated price for existing asset: ${symbol}.${nation}`);
    } else {
      // Create new asset
      const assetName = name || symbol; // Use symbol as fallback if name is empty
      const createDto: CreateGlobalAssetDto = {
        symbol,
        name: assetName,
        type: typedAssetType,
        nation: nation as NationCode,
        marketCode: this.getDefaultMarketCode(nation as NationCode, typedAssetType),
        currency,
        timezone: this.getDefaultTimezone(nation as NationCode),
        description: `Bulk created asset - ${assetName}`,
        isActive: true,
      };

      const newAsset = await this.create(createDto);
      
      // Create initial price for the new asset (this will also create history record)
      await this.updateAssetPrice(newAsset.id, price, createdAt || new Date().toISOString());
      result.created++;
      this.logger.log(`Created new asset: ${symbol}.${nation}`);
    }
  }

  /**
   * Find asset by symbol and nation.
   * @param symbol - Asset symbol
   * @param nation - Nation code
   * @returns Asset if found, null otherwise
   */
  private async findAssetBySymbolAndNation(symbol: string, nation: NationCode): Promise<GlobalAsset | null> {
    try {
      return await this.globalAssetRepository.findOne({
        where: { symbol, nation, isActive: true },
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Update asset price.
   * @param assetId - Asset ID
   * @param price - New price
   */
  private async updateAssetPrice(assetId: string, price: number, createdAt: string): Promise<void> {
    try {
      // Check if price exists for this asset
      const existingPrices = await this.basicPriceService.findAll({
        assetId,
        page: 1,
        limit: 1,
      });

      if (existingPrices.data.length > 0) {
        // Get old price for history tracking
        const oldPrice = existingPrices.data[0].currentPrice;
        
        // Update existing price
        const priceId = existingPrices.data[0].id;
        const updateDto: UpdateAssetPriceDto = {
          currentPrice: price,
          lastPriceUpdate: createdAt || new Date().toISOString(),
        };
        await this.basicPriceService.update(priceId, updateDto);
        
        // Create price history record
        await this.createPriceHistoryRecord(assetId, price, oldPrice, 'Bulk update', createdAt);
        
        this.logger.log(`Updated price for asset ${assetId} from ${oldPrice} to ${price}`);
      } else {
        // Create new price if none exists
        await this.createAssetPrice(assetId, price, createdAt);
        
        // Create price history record for initial price
        await this.createPriceHistoryRecord(assetId, price, null, 'Bulk create', createdAt);
      }
    } catch (error) {
      this.logger.error(`Failed to update price for asset ${assetId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create asset price.
   * @param assetId - Asset ID
   * @param price - Initial price
   */
  private async createAssetPrice(assetId: string, price: number, createdAt: string): Promise<void> {
    try {
      const createDto: CreateAssetPriceDto = {
        assetId,
        currentPrice: price,
        priceType: PriceType.MANUAL,
        priceSource: PriceSource.USER_INPUT,
        lastPriceUpdate: createdAt || new Date().toISOString(),
      };
      await this.basicPriceService.create(createDto);
      this.logger.log(`Created initial price ${price} for asset ${assetId}`);
    } catch (error) {
      this.logger.error(`Failed to create price for asset ${assetId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create price history record for tracking price changes.
   * @param assetId - Asset ID
   * @param newPrice - New price
   * @param oldPrice - Old price (null for initial price)
   * @param changeReason - Reason for price change
   * @param createdAt - Custom creation date (optional)
   */
  private async createPriceHistoryRecord(
    assetId: string, 
    newPrice: number, 
    oldPrice: number | null, 
    changeReason: string,
    createdAt?: string
  ): Promise<void> {
    try {
      const historyDto = {
        assetId,
        price: newPrice,
        priceType: PriceType.MANUAL,
        priceSource: PriceSource.USER_INPUT,
        changeReason,
        createdAt: createdAt || new Date().toISOString(),
        metadata: {
          oldPrice,
          changeAmount: oldPrice ? newPrice - oldPrice : null,
          changePercentage: oldPrice ? ((newPrice - oldPrice) / oldPrice) * 100 : null,
          source: 'bulk_operation',
        },
      };
      
      await this.priceHistoryService.createPriceHistory(historyDto);
      this.logger.log(`Created price history record for asset ${assetId}: ${oldPrice || 'N/A'} → ${newPrice} at ${createdAt || 'now'}`);
    } catch (error) {
      this.logger.error(`Failed to create price history record for asset ${assetId}: ${error.message}`);
      // Don't throw error here to avoid breaking the main operation
    }
  }

  /**
   * Get default market code for nation and asset type.
   * @param nation - Nation code
   * @param assetType - Asset type
   * @returns Default market code
   */
  private getDefaultMarketCode(nation: NationCode, assetType: AssetType): string {
    const marketCodes = {
      VN: {
        STOCK: 'HOSE',
        BOND: 'HOSE',
        GOLD: 'SJC',
        COMMODITY: 'HOSE',
        DEPOSIT: 'BANK',
        CASH: 'BANK',
      },
      US: {
        STOCK: 'NYSE',
        BOND: 'NYSE',
        GOLD: 'COMEX',
        COMMODITY: 'CME',
        DEPOSIT: 'BANK',
        CASH: 'BANK',
      },
      UK: {
        STOCK: 'LSE',
        BOND: 'LSE',
        GOLD: 'LME',
        COMMODITY: 'LME',
        DEPOSIT: 'BANK',
        CASH: 'BANK',
      },
      JP: {
        STOCK: 'TSE',
        BOND: 'TSE',
        GOLD: 'TGE',
        COMMODITY: 'TGE',
        DEPOSIT: 'BANK',
        CASH: 'BANK',
      },
      SG: {
        STOCK: 'SGX',
        BOND: 'SGX',
        GOLD: 'SGX',
        COMMODITY: 'SGX',
        DEPOSIT: 'BANK',
        CASH: 'BANK',
      },
    };

    return marketCodes[nation]?.[assetType] || 'DEFAULT';
  }

  /**
   * Get default timezone for nation.
   * @param nation - Nation code
   * @returns Default timezone
   */
  private getDefaultTimezone(nation: NationCode): string {
    const timezones = {
      VN: 'Asia/Ho_Chi_Minh',
      US: 'America/New_York',
      UK: 'Europe/London',
      JP: 'Asia/Tokyo',
      SG: 'Asia/Singapore',
    };

    return timezones[nation] || 'UTC';
  }
}
