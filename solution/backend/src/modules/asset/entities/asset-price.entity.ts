import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
  Unique,
  Check,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GlobalAsset } from './global-asset.entity';
import { PriceType, PriceSource } from '../enums/price-type.enum';

// Re-export for external use
export { PriceType, PriceSource };

/**
 * Asset Price entity representing current price data for a global asset.
 * This table stores the current price information for assets, with optional pricing.
 * Assets can exist without price data (price = null when joined).
 * 
 * CR-005 Global Assets System:
 * - Separated pricing data from asset metadata
 * - Support for multiple price types and sources
 * - Optional pricing - assets can exist without price data
 * - Price history tracking in separate AssetPriceHistory entity
 * - System resilience with graceful degradation when price data unavailable
 */
@Entity('asset_prices')
@Index('IDX_ASSET_PRICE_ASSET_ID', ['assetId'])
@Index('IDX_ASSET_PRICE_TYPE', ['priceType'])
@Index('IDX_ASSET_PRICE_SOURCE', ['priceSource'])
@Index('IDX_ASSET_PRICE_UPDATE', ['lastPriceUpdate'])
@Unique('UQ_ASSET_PRICE_ASSET_ID', ['assetId'])
@Check('CHK_ASSET_PRICE_POSITIVE', 'current_price > 0')
@Check('CHK_ASSET_PRICE_TYPE_VALID', "price_type IN ('MANUAL', 'EXTERNAL')")
@Check('CHK_ASSET_PRICE_SOURCE_VALID', "price_source IN ('USER_INPUT', 'EXTERNAL_API')")
export class AssetPrice {
  /**
   * Unique identifier for the asset price record.
   */
  @ApiProperty({
    description: 'Unique identifier for the asset price record',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the global asset this price belongs to.
   * Foreign key to global_assets table.
   */
  @ApiProperty({
    description: 'ID of the global asset this price belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Column({ 
    type: 'uuid', 
    name: 'asset_id',
    comment: 'Foreign key to global_assets table'
  })
  assetId: string;

  /**
   * Current price of the asset.
   * Must be positive value.
   */
  @ApiProperty({
    description: 'Current price of the asset',
    example: 150000,
    minimum: 0.01,
  })
  @Column({ 
    type: 'decimal', 
    precision: 15, 
    scale: 2, 
    name: 'current_price',
    comment: 'Current price of the asset'
  })
  currentPrice: number;

  /**
   * Type of the price (MANUAL, EXTERNAL).
   */
  @ApiProperty({
    description: 'Type of the price',
    enum: PriceType,
    example: PriceType.EXTERNAL,
  })
  @Column({ 
    type: 'varchar', 
    length: 20,
    default: 'MANUAL',
    name: 'price_type',
    comment: 'Type of the price'
  })
  priceType: string;

  /**
   * Source of the price (USER_INPUT, EXTERNAL_API).
   */
  @ApiProperty({
    description: 'Source of the price',
    enum: PriceSource,
    example: PriceSource.EXTERNAL_API,
  })
  @Column({ 
    type: 'varchar', 
    length: 30,
    default: 'USER',
    name: 'price_source',
    comment: 'Source of the price'
  })
  priceSource: string;

  /**
   * Timestamp when the price was last updated.
   */
  @ApiProperty({
    description: 'Timestamp when the price was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Column({ 
    type: 'timestamp', 
    name: 'last_price_update',
    comment: 'Timestamp when price was last updated'
  })
  lastPriceUpdate: Date;

  /**
   * Optional metadata about the price (e.g., API response, calculation details).
   */
  @ApiPropertyOptional({
    description: 'Optional metadata about the price',
    example: '{"api_provider": "yahoo_finance", "response_time": "150ms"}',
  })
  @Column({ 
    type: 'jsonb', 
    nullable: true, 
    name: 'metadata',
    comment: 'Optional metadata about the price'
  })
  metadata?: Record<string, any>;

  /**
   * Timestamp when the price record was created.
   */
  @ApiProperty({
    description: 'Timestamp when the price record was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  @CreateDateColumn({ 
    name: 'created_at',
    comment: 'Price record creation timestamp'
  })
  createdAt: Date;

  /**
   * Timestamp when the price record was last updated.
   */
  @ApiProperty({
    description: 'Timestamp when the price record was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  @UpdateDateColumn({ 
    name: 'updated_at',
    comment: 'Price record last update timestamp'
  })
  updatedAt: Date;

  /**
   * Global asset this price belongs to.
   * One-to-one relationship with GlobalAsset.
   */
  @OneToOne(() => GlobalAsset, globalAsset => globalAsset.assetPrice, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'asset_id' })
  globalAsset: GlobalAsset;

  /**
   * Check if this price is recent (updated within last 24 hours).
   * @returns True if price is recent, false otherwise
   */
  isRecent(): boolean {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return this.lastPriceUpdate >= twentyFourHoursAgo;
  }

  /**
   * Check if this price is from market data.
   * @returns True if price is from market data, false otherwise
   */
  isFromMarketData(): boolean {
    return this.priceType === 'MARKET_DATA' && 
           this.priceSource === 'MARKET_DATA_SERVICE';
  }

  /**
   * Check if this price is manually set by user.
   * @returns True if price is manual, false otherwise
   */
  isManual(): boolean {
    return this.priceType === 'MANUAL' && 
           this.priceSource === 'USER';
  }

  /**
   * Get the price age in hours.
   * @returns Age of the price in hours
   */
  getPriceAgeHours(): number {
    const now = new Date();
    const diffMs = now.getTime() - this.lastPriceUpdate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  }

  /**
   * Get the price age in days.
   * @returns Age of the price in days
   */
  getPriceAgeDays(): number {
    const now = new Date();
    const diffMs = now.getTime() - this.lastPriceUpdate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if this price needs updating based on age and type.
   * @param maxAgeHours - Maximum age in hours before price needs updating
   * @returns True if price needs updating, false otherwise
   */
  needsUpdating(maxAgeHours: number = 24): boolean {
    return this.getPriceAgeHours() > maxAgeHours;
  }

  /**
   * Get formatted price string for display.
   * @param currency - Currency code for formatting
   * @returns Formatted price string
   */
  getFormattedPrice(currency: string = 'VND'): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(this.currentPrice);
  }

  /**
   * Get price source display name.
   * @returns Human-readable price source name
   */
  getPriceSourceDisplayName(): string {
    const sourceNames: Record<string, string> = {
      'USER': 'Người dùng',
      'MARKET_DATA_SERVICE': 'Dịch vụ dữ liệu thị trường',
      'EXTERNAL_API': 'API bên ngoài',
      'CALCULATED': 'Tính toán',
    };
    return sourceNames[this.priceSource] || this.priceSource;
  }

  /**
   * Get price type display name.
   * @returns Human-readable price type name
   */
  getPriceTypeDisplayName(): string {
    const typeNames: Record<string, string> = {
      'MANUAL': 'Thủ công',
      'MARKET_DATA': 'Dữ liệu thị trường',
      'EXTERNAL': 'Bên ngoài',
      'CALCULATED': 'Tính toán',
    };
    return typeNames[this.priceType] || this.priceType;
  }

  /**
   * Validate price value.
   * @param price - Price value to validate
   * @throws Error if price is invalid
   */
  static validatePrice(price: number): void {
    if (price <= 0) {
      throw new Error('Price must be greater than 0');
    }
    if (!Number.isFinite(price)) {
      throw new Error('Price must be a finite number');
    }
  }

  /**
   * Serialize the entity to JSON with computed properties.
   */
  toJSON() {
    return {
      ...this,
      isRecent: this.isRecent(),
      isFromMarketData: this.isFromMarketData(),
      isManual: this.isManual(),
      priceAgeHours: this.getPriceAgeHours(),
      priceAgeDays: this.getPriceAgeDays(),
      needsUpdating: this.needsUpdating(),
      formattedPrice: this.getFormattedPrice(),
      priceSourceDisplayName: this.getPriceSourceDisplayName(),
      priceTypeDisplayName: this.getPriceTypeDisplayName(),
    };
  }
}
