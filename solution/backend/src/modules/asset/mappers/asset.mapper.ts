import { Asset } from '../entities/asset.entity';
import { AssetResponseDto, PaginatedAssetResponseDto } from '../dto/asset-response.dto';
import { PaginatedResponse } from '../repositories/asset.repository';
import { AssetValueRangeResponseDto, AssetPerformanceItemDto } from '../dto/asset-analytics-response.dto';

/**
 * Asset Mapper
 * Maps Asset entities to DTOs for API responses
 */
export class AssetMapper {
  /**
   * Map Asset entity to AssetResponseDto
   * @param asset - Asset entity
   * @returns AssetResponseDto
   */
  static toResponseDto(asset: Asset, computedFields?: {
    currentPrice?: number;
    avgCost?: number;
    currentQuantity?: number;
    priceUpdatedAt?: Date;
  }): AssetResponseDto {
    // Use computed currentQuantity if available, otherwise fall back to asset.currentQuantity
    const currentQuantity = computedFields?.currentQuantity ?? asset.currentQuantity ?? 0;
    
    // Calculate currentValue real-time as currentQuantity * currentPrice
    const currentValue = currentQuantity && computedFields?.currentPrice 
      ? currentQuantity * computedFields.currentPrice 
      : 0;

    return {
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      type: asset.type,
      description: asset.description,
      priceMode: asset.priceMode,
      initialValue: asset.initialValue,
      initialQuantity: asset.initialQuantity,
      currentValue: currentValue, // Calculated real-time
      currentQuantity: currentQuantity, // Use computed or fallback to asset value
      currentPrice: computedFields?.currentPrice,
      avgCost: computedFields?.avgCost,
      priceUpdatedAt: computedFields?.priceUpdatedAt,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
      createdBy: asset.createdBy,
      updatedBy: asset.updatedBy,
      totalValue: currentValue, // Use calculated currentValue as totalValue
      totalQuantity: currentQuantity || 0,
      hasTrades: (currentQuantity || 0) > 0,
      displayName: asset.getDisplayName(),
      canModifySymbol: asset.canModifySymbol(),
      primaryIdentifier: asset.getPrimaryIdentifier(),
    };
  }

  /**
   * Map array of Asset entities to AssetResponseDto array
   * @param assets - Array of Asset entities
   * @returns Array of AssetResponseDto
   */
  static toResponseDtoArray(assets: Asset[]): AssetResponseDto[] {
    return assets.map(asset => this.toResponseDto(asset));
  }

  /**
   * Map PaginatedResponse<Asset> to PaginatedAssetResponseDto
   * @param paginatedResponse - Paginated response with Asset entities
   * @returns PaginatedAssetResponseDto
   */
  static toPaginatedResponseDto(paginatedResponse: PaginatedResponse<Asset>): PaginatedAssetResponseDto {
    return {
      data: this.toResponseDtoArray(paginatedResponse.data),
      total: paginatedResponse.total,
      page: paginatedResponse.page,
      limit: paginatedResponse.limit,
    };
  }

  /**
   * Map Asset entity to AssetPerformanceItemDto
   * @param asset - Asset entity
   * @param portfolioWeight - Weight in portfolio (percentage)
   * @returns AssetPerformanceItemDto
   */
  static toPerformanceItemDto(asset: Asset, portfolioWeight: number = 0, currentPrice?: number): AssetPerformanceItemDto {
    // Calculate currentValue real-time as currentQuantity * currentPrice
    const currentValue = asset.currentQuantity && currentPrice 
      ? asset.currentQuantity * currentPrice 
      : 0;
    
    const absoluteReturn = currentValue - asset.initialValue;
    const percentageReturn = asset.initialValue > 0 ? (absoluteReturn / asset.initialValue) * 100 : 0;

    return {
      assetId: asset.id,
      assetName: asset.name,
      assetSymbol: asset.symbol,
      assetType: asset.type,
      currentValue: currentValue, // Calculated real-time
      initialValue: asset.initialValue,
      absoluteReturn,
      percentageReturn,
      portfolioWeight,
    };
  }

  /**
   * Map Asset array to AssetValueRangeResponseDto
   * @param assets - Array of Asset entities
   * @param minValue - Minimum value filter
   * @param maxValue - Maximum value filter
   * @returns AssetValueRangeResponseDto
   */
  static toValueRangeResponseDto(
    assets: Asset[],
    minValue: number,
    maxValue: number
  ): AssetValueRangeResponseDto {
    return {
      assets: assets.map(asset => this.toPerformanceItemDto(asset)),
      minValue,
      maxValue,
      count: assets.length,
    };
  }
}
