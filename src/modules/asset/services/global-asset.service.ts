import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions, Like, In } from 'typeorm';
import { GlobalAsset } from '../entities/global-asset.entity';
import { NationConfigService } from './nation-config.service';
import { CreateGlobalAssetDto } from '../dto/create-global-asset.dto';
import { UpdateGlobalAssetDto } from '../dto/update-global-asset.dto';
import { GlobalAssetQueryDto } from '../dto/global-asset-query.dto';
import { GlobalAssetResponseDto } from '../dto/global-asset-response.dto';
import { NationCode, AssetType } from '../../config/nation-config.interface';

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
    };

    try {
      const [assets, total] = await this.globalAssetRepository.findAndCount(findOptions);

      // Filter by trades if needed
      let filteredAssets = assets;
      if (hasTradesOnly) {
        filteredAssets = assets.filter(asset => asset.hasTrades());
      }

      const responseData = filteredAssets.map(asset => this.mapToResponseDto(asset));

      return {
        data: responseData,
        total: filteredAssets.length,
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

    // Validate nation configuration if nation is being updated
    if (updateDto.nation) {
      this.validateNationConfiguration(updateDto.nation as NationCode, updateDto.type as AssetType || asset.type);
    }

    // Validate symbol format if type is being updated
    if (updateDto.type) {
      this.validateSymbolFormat(
        updateDto.nation as NationCode || asset.nation as NationCode,
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
    return {
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
  }
}
