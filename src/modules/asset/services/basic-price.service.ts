import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions, In } from 'typeorm';
import { AssetPrice } from '../entities/asset-price.entity';
import { AssetPriceHistory } from '../entities/asset-price-history.entity';
import { PriceType, PriceSource } from '../enums/price-type.enum';
import { GlobalAssetService } from './global-asset.service';
import { CreateAssetPriceDto } from '../dto/create-asset-price.dto';
import { UpdateAssetPriceDto } from '../dto/update-asset-price.dto';
import { AssetPriceQueryDto } from '../dto/asset-price-query.dto';
import { AssetPriceResponseDto } from '../dto/asset-price-response.dto';

/**
 * Service for managing asset prices in the Global Assets System.
 * Provides CRUD operations and business logic for asset prices.
 * 
 * CR-005 Global Assets System:
 * - Price management for global assets
 * - Support for multiple price types and sources
 * - Price validation and business logic
 * - Integration with global asset service
 * - Caching for performance
 */
@Injectable()
export class BasicPriceService {
  private readonly logger = new Logger(BasicPriceService.name);

  constructor(
    @InjectRepository(AssetPrice)
    private readonly assetPriceRepository: Repository<AssetPrice>,
    @InjectRepository(AssetPriceHistory)
    private readonly priceHistoryRepository: Repository<AssetPriceHistory>,
    private readonly globalAssetService: GlobalAssetService,
  ) {}

  /**
   * Create a new asset price.
   * @param createDto - Price creation data
   * @returns Created price
   */
  async create(createDto: CreateAssetPriceDto): Promise<AssetPriceResponseDto> {
    this.logger.log(`Creating asset price for asset: ${createDto.assetId}`);

    // Validate asset exists
    const asset = await this.globalAssetService.findOne(createDto.assetId);
    if (!asset) {
      throw new NotFoundException(`Global asset with ID ${createDto.assetId} not found`);
    }

    // Check if price already exists for this asset
    await this.checkPriceExists(createDto.assetId);

    // Validate price value
    this.validatePrice(createDto.currentPrice);

    // Create price entity
    const price = this.assetPriceRepository.create({
      ...createDto,
      lastPriceUpdate: createDto.lastPriceUpdate ? new Date(createDto.lastPriceUpdate) : new Date(),
    });

    try {
      const savedPrice = await this.assetPriceRepository.save(price);
      this.logger.log(`Asset price created successfully: ${savedPrice.id}`);
      return this.mapToResponseDto(savedPrice);
    } catch (error) {
      this.logger.error(`Failed to create asset price: ${error.message}`);
      throw new BadRequestException(`Failed to create asset price: ${error.message}`);
    }
  }

  /**
   * Find all asset prices with filtering, pagination, and sorting.
   * @param queryDto - Query parameters
   * @returns Paginated prices
   */
  async findAll(queryDto: AssetPriceQueryDto): Promise<{
    data: AssetPriceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log('Finding asset prices with query parameters');

    const {
      assetId,
      priceType,
      priceSource,
      priceTypes,
      priceSources,
      recentOnly,
      needsUpdatingOlderThan,
      marketDataOnly,
      manualOnly,
      sortBy = 'lastPriceUpdate',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = queryDto;

    // Build where conditions
    const where: FindOptionsWhere<AssetPrice> = {};

    if (assetId) {
      where.assetId = assetId;
    }

    if (priceType) {
      where.priceType = priceType;
    }

    if (priceSource) {
      where.priceSource = priceSource;
    }

    if (priceTypes && priceTypes.length > 0) {
      where.priceType = In(priceTypes);
    }

    if (priceSources && priceSources.length > 0) {
      where.priceSource = In(priceSources);
    }

    // Build find options
    const findOptions: FindManyOptions<AssetPrice> = {
      where,
      order: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    };

    try {
      const [prices, total] = await this.assetPriceRepository.findAndCount(findOptions);

      // Apply additional filters
      let filteredPrices = prices;

      if (recentOnly) {
        filteredPrices = prices.filter(price => price.isRecent());
      }

      if (needsUpdatingOlderThan) {
        filteredPrices = prices.filter(price => price.getPriceAgeHours() > needsUpdatingOlderThan);
      }

      if (marketDataOnly) {
        filteredPrices = prices.filter(price => price.isFromMarketData());
      }

      if (manualOnly) {
        filteredPrices = prices.filter(price => price.isManual());
      }

      const responseData = filteredPrices.map(price => this.mapToResponseDto(price));

      return {
        data: responseData,
        total: filteredPrices.length,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to find asset prices: ${error.message}`);
      throw new BadRequestException(`Failed to find asset prices: ${error.message}`);
    }
  }

  /**
   * Find an asset price by ID.
   * @param id - Price ID
   * @returns Price or null
   */
  async findOne(id: string): Promise<AssetPriceResponseDto | null> {
    this.logger.log(`Finding asset price by ID: ${id}`);

    try {
      const price = await this.assetPriceRepository.findOne({
        where: { id },
        relations: ['globalAsset'],
      });

      if (!price) {
        return null;
      }

      return this.mapToResponseDto(price);
    } catch (error) {
      this.logger.error(`Failed to find asset price by ID ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to find asset price: ${error.message}`);
    }
  }

  /**
   * Find an asset price by asset ID.
   * @param assetId - Asset ID
   * @returns Price or null
   */
  async findByAssetId(assetId: string): Promise<AssetPriceResponseDto | null> {
    this.logger.log(`Finding asset price by asset ID: ${assetId}`);

    try {
      const price = await this.assetPriceRepository.findOne({
        where: { assetId },
        relations: ['globalAsset'],
      });

      if (!price) {
        return null;
      }

      return this.mapToResponseDto(price);
    } catch (error) {
      this.logger.error(`Failed to find asset price by asset ID ${assetId}: ${error.message}`);
      throw new BadRequestException(`Failed to find asset price: ${error.message}`);
    }
  }

  /**
   * Update an asset price.
   * @param id - Price ID
   * @param updateDto - Update data
   * @returns Updated price
   */
  async update(id: string, updateDto: UpdateAssetPriceDto): Promise<AssetPriceResponseDto> {
    this.logger.log(`Updating asset price: ${id}`);

    const price = await this.assetPriceRepository.findOne({
      where: { id },
      relations: ['globalAsset'],
    });

    if (!price) {
      throw new NotFoundException(`Asset price with ID ${id} not found`);
    }

    // Validate price value if provided
    if (updateDto.currentPrice !== undefined) {
      this.validatePrice(updateDto.currentPrice);
    }

    try {
      // Update lastPriceUpdate if currentPrice is being updated
      if (updateDto.currentPrice !== undefined) {
        updateDto.lastPriceUpdate = new Date().toISOString();
      }

      Object.assign(price, {
        ...updateDto,
        lastPriceUpdate: updateDto.lastPriceUpdate ? new Date(updateDto.lastPriceUpdate) : price.lastPriceUpdate,
      });

      const savedPrice = await this.assetPriceRepository.save(price);
      this.logger.log(`Asset price updated successfully: ${savedPrice.id}`);
      return this.mapToResponseDto(savedPrice);
    } catch (error) {
      this.logger.error(`Failed to update asset price ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update asset price: ${error.message}`);
    }
  }

  /**
   * Update an asset price by global asset ID.
   * @param assetId - Global asset ID
   * @param updateDto - Update data
   * @returns Updated price
   */
  async updateByAssetId(assetId: string, updateDto: UpdateAssetPriceDto): Promise<AssetPriceResponseDto> {
    this.logger.log(`Updating asset price by asset ID: ${assetId}`);

    // First, find the asset price by asset ID
    const price = await this.assetPriceRepository.findOne({
      where: { assetId },
      relations: ['globalAsset'],
    });

    if (!price) {
      throw new NotFoundException(`Asset price for global asset ${assetId} not found`);
    }

    // Validate price value if provided
    if (updateDto.currentPrice !== undefined) {
      this.validatePrice(updateDto.currentPrice);
    }

    try {
      // Update lastPriceUpdate if currentPrice is being updated
      if (updateDto.currentPrice !== undefined) {
        updateDto.lastPriceUpdate = new Date().toISOString();
      }

      Object.assign(price, {
        ...updateDto,
        lastPriceUpdate: updateDto.lastPriceUpdate ? new Date(updateDto.lastPriceUpdate) : price.lastPriceUpdate,
      });

      const savedPrice = await this.assetPriceRepository.save(price);
      
      // Create price history record for manual updates
      if (updateDto.currentPrice !== undefined) {
        const priceHistory = this.priceHistoryRepository.create({
          assetId: assetId,
          price: updateDto.currentPrice,
          priceType: updateDto.priceType || 'MANUAL',
          priceSource: updateDto.priceSource || 'USER',
          changeReason: 'Manual price update',
          metadata: {
            source: 'manual_update',
            updateType: 'manual',
            changeReason: updateDto.metadata?.changeReason || 'Manual price update',
          },
        });
        
        await this.priceHistoryRepository.save(priceHistory);
        this.logger.log(`Price history created for manual update: ${assetId}`);
      }
      
      this.logger.log(`Asset price updated successfully by asset ID: ${savedPrice.id}`);
      return this.mapToResponseDto(savedPrice);
    } catch (error) {
      this.logger.error(`Failed to update asset price by asset ID ${assetId}: ${error.message}`);
      throw new BadRequestException(`Failed to update asset price: ${error.message}`);
    }
  }

  /**
   * Delete an asset price.
   * @param id - Price ID
   * @returns Success message
   */
  async remove(id: string): Promise<{ message: string }> {
    this.logger.log(`Deleting asset price: ${id}`);

    const price = await this.assetPriceRepository.findOne({
      where: { id },
    });

    if (!price) {
      throw new NotFoundException(`Asset price with ID ${id} not found`);
    }

    try {
      await this.assetPriceRepository.remove(price);
      this.logger.log(`Asset price deleted successfully: ${id}`);
      return { message: 'Asset price deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete asset price ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete asset price: ${error.message}`);
    }
  }

  /**
   * Get prices by asset ID.
   * @param assetId - Asset ID
   * @returns Prices for the asset
   */
  async findByAsset(assetId: string): Promise<AssetPriceResponseDto[]> {
    this.logger.log(`Finding asset prices by asset ID: ${assetId}`);

    try {
      const prices = await this.assetPriceRepository.find({
        where: { assetId },
        relations: ['globalAsset'],
        order: { lastPriceUpdate: 'DESC' },
      });

      return prices.map(price => this.mapToResponseDto(price));
    } catch (error) {
      this.logger.error(`Failed to find asset prices by asset ID ${assetId}: ${error.message}`);
      throw new BadRequestException(`Failed to find asset prices: ${error.message}`);
    }
  }

  /**
   * Get prices by type.
   * @param priceType - Price type
   * @returns Prices of the type
   */
  async findByType(priceType: PriceType): Promise<AssetPriceResponseDto[]> {
    this.logger.log(`Finding asset prices by type: ${priceType}`);

    try {
      const prices = await this.assetPriceRepository.find({
        where: { priceType },
        relations: ['globalAsset'],
        order: { lastPriceUpdate: 'DESC' },
      });

      return prices.map(price => this.mapToResponseDto(price));
    } catch (error) {
      this.logger.error(`Failed to find asset prices by type ${priceType}: ${error.message}`);
      throw new BadRequestException(`Failed to find asset prices: ${error.message}`);
    }
  }

  /**
   * Get prices by source.
   * @param priceSource - Price source
   * @returns Prices from the source
   */
  async findBySource(priceSource: PriceSource): Promise<AssetPriceResponseDto[]> {
    this.logger.log(`Finding asset prices by source: ${priceSource}`);

    try {
      const prices = await this.assetPriceRepository.find({
        where: { priceSource },
        relations: ['globalAsset'],
        order: { lastPriceUpdate: 'DESC' },
      });

      return prices.map(price => this.mapToResponseDto(price));
    } catch (error) {
      this.logger.error(`Failed to find asset prices by source ${priceSource}: ${error.message}`);
      throw new BadRequestException(`Failed to find asset prices: ${error.message}`);
    }
  }

  /**
   * Get prices that need updating.
   * @param maxAgeHours - Maximum age in hours
   * @returns Prices that need updating
   */
  async findPricesNeedingUpdate(maxAgeHours: number = 24): Promise<AssetPriceResponseDto[]> {
    this.logger.log(`Finding prices that need updating (older than ${maxAgeHours} hours)`);

    try {
      const prices = await this.assetPriceRepository.find({
        relations: ['globalAsset'],
        order: { lastPriceUpdate: 'ASC' },
      });

      const pricesNeedingUpdate = prices.filter(price => price.needsUpdating(maxAgeHours));
      return pricesNeedingUpdate.map(price => this.mapToResponseDto(price));
    } catch (error) {
      this.logger.error(`Failed to find prices needing update: ${error.message}`);
      throw new BadRequestException(`Failed to find prices needing update: ${error.message}`);
    }
  }

  /**
   * Get recent prices (updated within last 24 hours).
   * @returns Recent prices
   */
  async findRecentPrices(): Promise<AssetPriceResponseDto[]> {
    this.logger.log('Finding recent prices (updated within last 24 hours)');

    try {
      const prices = await this.assetPriceRepository.find({
        relations: ['globalAsset'],
        order: { lastPriceUpdate: 'DESC' },
      });

      const recentPrices = prices.filter(price => price.isRecent());
      return recentPrices.map(price => this.mapToResponseDto(price));
    } catch (error) {
      this.logger.error(`Failed to find recent prices: ${error.message}`);
      throw new BadRequestException(`Failed to find recent prices: ${error.message}`);
    }
  }

  /**
   * Get price statistics.
   * @returns Price statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
    recent: number;
    needsUpdate: number;
    marketData: number;
    manual: number;
  }> {
    this.logger.log('Getting asset price statistics');

    try {
      const prices = await this.assetPriceRepository.find();

      const stats = {
        total: prices.length,
        byType: {} as Record<string, number>,
        bySource: {} as Record<string, number>,
        recent: 0,
        needsUpdate: 0,
        marketData: 0,
        manual: 0,
      };

      prices.forEach(price => {
        // Count by type
        stats.byType[price.priceType] = (stats.byType[price.priceType] || 0) + 1;

        // Count by source
        stats.bySource[price.priceSource] = (stats.bySource[price.priceSource] || 0) + 1;

        // Count recent prices
        if (price.isRecent()) {
          stats.recent++;
        }

        // Count prices needing update
        if (price.needsUpdating()) {
          stats.needsUpdate++;
        }

        // Count market data prices
        if (price.isFromMarketData()) {
          stats.marketData++;
        }

        // Count manual prices
        if (price.isManual()) {
          stats.manual++;
        }
      });

      return stats;
    } catch (error) {
      this.logger.error(`Failed to get asset price statistics: ${error.message}`);
      throw new BadRequestException(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Check if price already exists for asset.
   * @private
   */
  private async checkPriceExists(assetId: string): Promise<void> {
    const existingPrice = await this.assetPriceRepository.findOne({
      where: { assetId },
    });

    if (existingPrice) {
      throw new ConflictException(`Price already exists for asset ${assetId}`);
    }
  }

  /**
   * Validate price value.
   * @private
   */
  private validatePrice(price: number): void {
    if (price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }
    if (!Number.isFinite(price)) {
      throw new BadRequestException('Price must be a finite number');
    }
  }

  /**
   * Map entity to response DTO.
   * @private
   */
  private mapToResponseDto(price: AssetPrice): AssetPriceResponseDto {
    return {
      id: price.id,
      assetId: price.assetId,
      currentPrice: price.currentPrice,
      priceType: price.priceType,
      priceSource: price.priceSource,
      lastPriceUpdate: price.lastPriceUpdate,
      metadata: price.metadata,
      createdAt: price.createdAt,
      updatedAt: price.updatedAt,
      isRecent: price.isRecent(),
      isFromMarketData: price.isFromMarketData(),
      isManual: price.isManual(),
      priceAgeHours: price.getPriceAgeHours(),
      priceAgeDays: price.getPriceAgeDays(),
      needsUpdating: price.needsUpdating(),
      formattedPrice: price.getFormattedPrice(),
      priceSourceDisplayName: price.getPriceSourceDisplayName(),
      priceTypeDisplayName: price.getPriceTypeDisplayName(),
    };
  }
}
