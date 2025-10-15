import { Injectable, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { IAssetRepository } from '../repositories/asset.repository.interface';
import { Asset } from '../entities/asset.entity';
import { AssetType } from '../enums/asset-type.enum';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';

/**
 * Asset deletion validation result
 */
export interface AssetDeletionValidationResult {
  canDelete: boolean;
  tradeCount: number;
}

/**
 * Asset Validation Service
 * Handles business rules validation for Asset operations
 * 
 * CR-003 Changes:
 * - Symbol field is now required and primary identifier
 * - Symbol must be unique per user (not globally)
 * - Name can be duplicated across users
 * - Symbol field is read-only after creation
 */
@Injectable()
export class AssetValidationService {
  constructor(
    @Inject('IAssetRepository')
    private readonly assetRepository: IAssetRepository,
  ) {}

  /**
   * Validate asset creation
   * @param createAssetDto - Asset creation data
   * @throws BadRequestException if validation fails
   * @throws ConflictException if uniqueness constraints are violated
   */
  async validateAssetCreation(createAssetDto: CreateAssetDto): Promise<void> {
    // Validate required fields
    this.validateRequiredFields(createAssetDto);
    
    // Validate field formats and constraints
    this.validateFieldFormats(createAssetDto);
    
    // Validate business rules
    await this.validateBusinessRules(createAssetDto);
    
    // Validate uniqueness constraints
    await this.validateUniquenessConstraints(createAssetDto);
  }

  /**
   * Validate asset update
   * @param id - Asset ID
   * @param updateAssetDto - Update data
   * @throws BadRequestException if validation fails
   * @throws ConflictException if uniqueness constraints are violated
   */
  async validateAssetUpdate(id: string, updateAssetDto: UpdateAssetDto): Promise<void> {
    // Validate field formats if provided
    this.validateUpdateFieldFormats(updateAssetDto);
    
    // Validate business rules
    await this.validateUpdateBusinessRules(id, updateAssetDto);
    
    // Validate uniqueness constraints if relevant fields are updated
    await this.validateUpdateUniquenessConstraints(id, updateAssetDto);
  }

  /**
   * Validate asset deletion
   * @param id - Asset ID
   * @returns Validation result with trade count and deletion permission
   */
  async validateAssetDeletion(id: string): Promise<AssetDeletionValidationResult> {
    // Check if asset has associated trades
    const hasTrades = await this.assetRepository.hasTrades(id);
    const tradeCount = hasTrades ? await this.assetRepository.getTradesForAsset(id).then(trades => trades.length) : 0;
    
    return {
      canDelete: !hasTrades,
      tradeCount: tradeCount
    };
  }

  /**
   * Validate symbol modification
   * @param id - Asset ID
   * @param newSymbol - New symbol value
   * @throws BadRequestException if symbol cannot be modified
   */
  async validateSymbolModification(id: string, newSymbol: string): Promise<void> {
    // Get existing asset
    const existingAsset = await this.assetRepository.findById(id);
    if (!existingAsset) {
      throw new BadRequestException('Asset not found');
    }

    // Check if symbol can be modified
    if (!existingAsset.canModifySymbol()) {
      throw new BadRequestException('Symbol field is read-only after asset has associated trades');
    }

    // Validate symbol format
    if (!/^[A-Z0-9-]+$/.test(newSymbol)) {
      throw new BadRequestException('Symbol must contain only uppercase letters, numbers, and dashes');
    }

    // Validate symbol uniqueness per user
    const isSymbolUnique = await this.assetRepository.isSymbolUniqueForUser(
      newSymbol,
      existingAsset.createdBy,
      id
    );

    if (!isSymbolUnique) {
      throw new ConflictException(`Asset symbol '${newSymbol}' already exists for this user`);
    }
  }

  /**
   * Validate required fields for asset creation
   * @param createAssetDto - Asset creation data
   * @throws BadRequestException if required fields are missing
   */
  private validateRequiredFields(createAssetDto: CreateAssetDto): void {
    if (!createAssetDto.name || createAssetDto.name.trim().length === 0) {
      throw new BadRequestException('Asset name is required');
    }

    if (!createAssetDto.symbol || createAssetDto.symbol.trim().length === 0) {
      throw new BadRequestException('Asset symbol is required');
    }

    if (!createAssetDto.type) {
      throw new BadRequestException('Asset type is required');
    }

    if (!createAssetDto.createdBy || createAssetDto.createdBy.trim().length === 0) {
      throw new BadRequestException('Created by user ID is required');
    }

    if (!createAssetDto.updatedBy || createAssetDto.updatedBy.trim().length === 0) {
      throw new BadRequestException('Updated by user ID is required');
    }
  }

  /**
   * Validate field formats and constraints
   * @param createAssetDto - Asset creation data
   * @throws BadRequestException if field formats are invalid
   */
  private validateFieldFormats(createAssetDto: CreateAssetDto): void {
    // Validate name length
    if (createAssetDto.name.length > 255) {
      throw new BadRequestException('Asset name cannot exceed 255 characters');
    }

    // Validate symbol length and format
    if (createAssetDto.symbol.length > 50) {
      throw new BadRequestException('Asset symbol cannot exceed 50 characters');
    }

    // Validate symbol format (alphanumeric and dash only)
    if (!/^[A-Z0-9-]+$/.test(createAssetDto.symbol)) {
      throw new BadRequestException('Asset symbol must contain only uppercase letters, numbers, and dashes');
    }

    // Validate code length if provided (deprecated field)
    if (createAssetDto.code && createAssetDto.code.length > 50) {
      throw new BadRequestException('Asset code cannot exceed 50 characters');
    }

    // Validate description length if provided
    if (createAssetDto.description && createAssetDto.description.length > 1000) {
      throw new BadRequestException('Asset description cannot exceed 1000 characters');
    }

    // Note: initialValue, initialQuantity, currentValue, currentQuantity are computed fields
    // and don't need validation as they are calculated automatically

    // Validate asset type
    if (!Object.values(AssetType).includes(createAssetDto.type)) {
      throw new BadRequestException('Invalid asset type');
    }
  }

  /**
   * Validate update field formats
   * @param updateAssetDto - Update data
   * @throws BadRequestException if field formats are invalid
   */
  private validateUpdateFieldFormats(updateAssetDto: UpdateAssetDto): void {
    // Validate name length if provided
    if (updateAssetDto.name !== undefined) {
      if (updateAssetDto.name.trim().length === 0) {
        throw new BadRequestException('Asset name cannot be empty');
      }

      if (updateAssetDto.name.length > 255) {
        throw new BadRequestException('Asset name cannot exceed 255 characters');
      }
    }

    // Note: Symbol field is read-only after creation and not included in update DTO
    // Code field is deprecated and not included in update DTO

    // Validate description length if provided
    if (updateAssetDto.description !== undefined) {
      if (updateAssetDto.description.length > 1000) {
        throw new BadRequestException('Asset description cannot exceed 1000 characters');
      }
    }

    // Note: initialValue, initialQuantity, currentValue, currentQuantity are computed fields
    // and are calculated automatically from trades. They should not be validated here.

    // Validate asset type if provided
    if (updateAssetDto.type !== undefined) {
      if (!Object.values(AssetType).includes(updateAssetDto.type)) {
        throw new BadRequestException('Invalid asset type');
      }
    }
  }

  /**
   * Validate business rules for asset creation
   * @param createAssetDto - Asset creation data
   * @throws BadRequestException if business rules are violated
   */
  private async validateBusinessRules(createAssetDto: CreateAssetDto): Promise<void> {
    // Validate portfolio exists (basic check)
    // Note: In a real implementation, you might want to check if portfolio exists
    // For now, we'll assume the portfolio ID is valid

    // Validate asset type specific rules
    await this.validateAssetTypeRules(createAssetDto.type, createAssetDto.initialValue, createAssetDto.initialQuantity);

    // Validate value consistency
    this.validateValueConsistency(createAssetDto);
  }

  /**
   * Validate business rules for asset update
   * @param id - Asset ID
   * @param updateAssetDto - Update data
   * @throws BadRequestException if business rules are violated
   */
  private async validateUpdateBusinessRules(id: string, updateAssetDto: UpdateAssetDto): Promise<void> {
    // Get existing asset for context
    const existingAsset = await this.assetRepository.findById(id);
    if (!existingAsset) {
      throw new BadRequestException('Asset not found');
    }

    // Note: Computed fields (initialValue, initialQuantity, currentValue, currentQuantity) 
    // are calculated automatically from trades and should not be validated here.
  }

  /**
   * Validate asset type specific rules
   * @param type - Asset type
   * @param value - Asset value
   * @param quantity - Asset quantity
   * @throws BadRequestException if type-specific rules are violated
   */
  private async validateAssetTypeRules(type: AssetType, value: number, quantity: number): Promise<void> {
    return; // TODO: no need to validate
    
    switch (type) {
      case AssetType.STOCK:
        // Stocks should have reasonable value and quantity
        if (value < 1000) {
          throw new BadRequestException('Stock value should be at least 1,000 VND');
        }
        if (quantity < 1) {
          throw new BadRequestException('Stock quantity should be at least 1');
        }
        break;

      case AssetType.BOND:
        // Bonds typically have higher minimum values
        if (value < 100000) {
          throw new BadRequestException('Bond value should be at least 100,000 VND');
        }
        if (quantity < 1) {
          throw new BadRequestException('Bond quantity should be at least 1');
        }
        break;

      case AssetType.GOLD:
        // Gold can have fractional quantities
        if (value < 10000) {
          throw new BadRequestException('Gold value should be at least 10,000 VND');
        }
        if (quantity < 0.001) {
          throw new BadRequestException('Gold quantity should be at least 0.001');
        }
        break;

      case AssetType.CRYPTO:
        // Crypto typically have high minimum values
        if (value < 1000000) {
          throw new BadRequestException('Crypto value should be at least 1,000,000 VND');
        }
        if (quantity < 1) {
          throw new BadRequestException('Crypto quantity should be at least 1');
        }
        break;

      case AssetType.COMMODITY:
        // Cash can have any value and quantity
        if (value < 0) {
          throw new BadRequestException('Commodity value cannot be negative');
        }
        if (quantity < 0) {
          throw new BadRequestException('Commodity quantity cannot be negative');
        }
        break;

      default:
        throw new BadRequestException('Invalid asset type');
    }
  }

  /**
   * Validate value consistency
   * @param assetData - Asset data
   * @throws BadRequestException if values are inconsistent
   */
  private validateValueConsistency(assetData: any): void {
    // If both current value and quantity are provided, validate consistency
    if (assetData.currentValue !== undefined && assetData.currentQuantity !== undefined) {
      // Basic validation - current values should be reasonable
      if (assetData.currentValue < 0 || assetData.currentQuantity < 0) {
        throw new BadRequestException('Current value and quantity must be non-negative');
      }
    }

    // Validate that current values are not significantly different from initial values
    // (This is a business rule - you might want to adjust the thresholds)
    if (assetData.currentValue !== undefined && assetData.initialValue !== undefined) {
      const valueChangeRatio = Math.abs(assetData.currentValue - assetData.initialValue) / assetData.initialValue;
      if (valueChangeRatio > 10) { // 1000% change
        throw new BadRequestException('Current value change is too significant (>1000%)');
      }
    }
  }

  /**
   * Validate uniqueness constraints for asset creation
   * @param createAssetDto - Asset creation data
   * @throws ConflictException if uniqueness constraints are violated
   */
  private async validateUniquenessConstraints(createAssetDto: CreateAssetDto): Promise<void> {
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
  }

  /**
   * Validate uniqueness constraints for asset update
   * @param id - Asset ID
   * @param updateAssetDto - Update data
   * @throws ConflictException if uniqueness constraints are violated
   */
  private async validateUpdateUniquenessConstraints(id: string, updateAssetDto: UpdateAssetDto): Promise<void> {
    // Get existing asset for context
    const existingAsset = await this.assetRepository.findById(id);
    if (!existingAsset) {
      throw new BadRequestException('Asset not found');
    }

    // Note: Symbol field is read-only after creation, so no uniqueness validation needed
    // Name can be duplicated across users, so no uniqueness validation needed
    // Code field is deprecated and not included in update DTO
  }

  /**
   * Validate asset data for bulk operations
   * @param assets - Array of asset data
   * @throws BadRequestException if any asset data is invalid
   */
  async validateBulkAssetCreation(assets: CreateAssetDto[]): Promise<void> {
    if (!assets || assets.length === 0) {
      throw new BadRequestException('Asset list cannot be empty');
    }

    if (assets.length > 100) {
      throw new BadRequestException('Cannot create more than 100 assets at once');
    }

    // Validate each asset
    for (let i = 0; i < assets.length; i++) {
      try {
        await this.validateAssetCreation(assets[i]);
      } catch (error) {
        throw new BadRequestException(`Asset ${i + 1}: ${error.message}`);
      }
    }

    // Validate uniqueness within the batch
    const symbols = assets.map(asset => asset.symbol.trim());
    const uniqueSymbols = new Set(symbols);
    if (symbols.length !== uniqueSymbols.size) {
      throw new BadRequestException('Asset symbols must be unique within the batch');
    }

    // Note: Names can be duplicated, so no uniqueness validation needed
    // Code field is deprecated and not validated for uniqueness
  }

  /**
   * Validate asset search parameters
   * @param searchTerm - Search term
   * @param portfolioId - Portfolio ID
   * @throws BadRequestException if search parameters are invalid
   */
  validateSearchParameters(searchTerm: string, portfolioId?: string): void {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new BadRequestException('Search term must be at least 2 characters long');
    }

    if (searchTerm.length > 100) {
      throw new BadRequestException('Search term cannot exceed 100 characters');
    }

    if (portfolioId !== undefined && portfolioId.trim().length === 0) {
      throw new BadRequestException('Portfolio ID cannot be empty');
    }
  }

  /**
   * Validate pagination parameters
   * @param limit - Page limit
   * @param offset - Page offset
   * @throws BadRequestException if pagination parameters are invalid
   */
  validatePaginationParameters(limit?: number, offset?: number): void {
    if (limit !== undefined) {
      if (limit < 1 || limit > 100) {
        throw new BadRequestException('Limit must be between 1 and 100');
      }
    }

    if (offset !== undefined) {
      if (offset < 0) {
        throw new BadRequestException('Offset must be non-negative');
      }
    }
  }
}
