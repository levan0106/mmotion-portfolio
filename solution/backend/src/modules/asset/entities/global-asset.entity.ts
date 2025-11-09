import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
  Unique,
  Check,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType } from '../enums/asset-type.enum';
import { PriceMode } from '../enums/price-mode.enum';
import { Trade } from '../../trading/entities/trade.entity';
import { AssetPrice } from './asset-price.entity';
import { AssetPriceHistory } from './asset-price-history.entity';

/**
 * Global Asset entity representing a financial asset with multi-national support.
 * Assets are identified by symbol + nation combination for global uniqueness.
 * Each asset can have multiple trades and portfolio relationships.
 * 
 * CR-005 Global Assets System:
 * - Support for multi-national assets with separate pricing
 * - Symbol + nation combination for global uniqueness
 * - Nation-specific market codes, currencies, and timezones
 * - Separated pricing data in AssetPrice entity
 * - System resilience with core functionality always available
 */
@Entity('global_assets')
@Index('IDX_GLOBAL_ASSET_SYMBOL', ['symbol'])
@Index('IDX_GLOBAL_ASSET_NATION', ['nation'])
@Index('IDX_GLOBAL_ASSET_TYPE', ['type'])
@Index('IDX_GLOBAL_ASSET_ACTIVE', ['isActive'])
@Index('IDX_GLOBAL_ASSET_SYMBOL_NATION', ['symbol', 'nation'])
@Unique('UQ_GLOBAL_ASSET_SYMBOL_NATION', ['symbol', 'nation'])
@Check('CHK_GLOBAL_ASSET_SYMBOL_FORMAT', "symbol ~ '^[A-Z0-9-]+$'")
@Check('CHK_GLOBAL_ASSET_NATION_FORMAT', "nation ~ '^[A-Z]{2}$'")
@Check('CHK_GLOBAL_ASSET_MARKET_CODE_FORMAT', "market_code ~ '^[A-Z0-9-]+$'")
@Check('CHK_GLOBAL_ASSET_CURRENCY_FORMAT', "currency ~ '^[A-Z]{3}$'")
@Check('CHK_GLOBAL_ASSET_TIMEZONE_FORMAT', "timezone ~ '^[A-Za-z_/]+$'")
export class GlobalAsset {
  /**
   * Unique identifier for the global asset.
   */
  @ApiProperty({
    description: 'Unique identifier for the global asset',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Asset symbol for trading (e.g., 'HPG', 'VCB', 'GOLD').
   * Must be uppercase alphanumeric with dashes allowed.
   * Combined with nation for global uniqueness.
   */
  @ApiProperty({
    description: 'Asset symbol for trading - must be uppercase alphanumeric',
    example: 'HPG',
    pattern: '^[A-Z0-9-]+$',
  })
  @Column({ 
    type: 'varchar', 
    length: 50, 
    name: 'symbol',
    comment: 'Asset symbol for trading - uppercase alphanumeric with dashes'
  })
  symbol: string;

  /**
   * Name of the asset (e.g., 'Hoa Phat Group', 'Vietcombank').
   */
  @ApiProperty({
    description: 'Name of the asset',
    example: 'Hoa Phat Group',
  })
  @Column({ 
    type: 'varchar', 
    length: 255, 
    name: 'name',
    comment: 'Asset name'
  })
  name: string;

  /**
   * Type of the asset (STOCK, BOND, GOLD, DEPOSIT, CASH).
   */
  @ApiProperty({
    description: 'Type of the asset',
    enum: AssetType,
    example: AssetType.STOCK,
  })
  @Column({ 
    type: 'enum', 
    enum: AssetType,
    default: AssetType.STOCK,
    name: 'type',
    comment: 'Asset type'
  })
  type: AssetType;

  /**
   * Price mode for the global asset (AUTOMATIC or MANUAL).
   * AUTOMATIC: Auto-sync from market data
   * MANUAL: Manual price entry only
   */
  @ApiProperty({
    description: 'Price mode for the global asset',
    enum: PriceMode,
    example: PriceMode.AUTOMATIC,
  })
  @Column({ 
    type: 'enum', 
    enum: PriceMode,
    default: PriceMode.AUTOMATIC,
    name: 'price_mode',
    comment: 'Price mode for the global asset'
  })
  priceMode: PriceMode;

  /**
   * Nation code where this asset is traded (e.g., 'VN', 'US', 'UK').
   * Must be 2-letter ISO country code.
   */
  @ApiProperty({
    description: 'Nation code where this asset is traded',
    example: 'VN',
    pattern: '^[A-Z]{2}$',
  })
  @Column({ 
    type: 'varchar', 
    length: 2, 
    name: 'nation',
    comment: 'Nation code - 2-letter ISO country code'
  })
  nation: string;

  /**
   * Market code where this asset is traded (e.g., 'HOSE', 'NYSE', 'LSE').
   * Must be uppercase alphanumeric with dashes allowed.
   */
  @ApiProperty({
    description: 'Market code where this asset is traded',
    example: 'HOSE',
    pattern: '^[A-Z0-9-]+$',
  })
  @Column({ 
    type: 'varchar', 
    length: 20, 
    name: 'market_code',
    comment: 'Market code where asset is traded'
  })
  marketCode: string;

  /**
   * Currency used for this asset (e.g., 'VND', 'USD', 'EUR').
   * Must be 3-letter ISO currency code.
   */
  @ApiProperty({
    description: 'Currency used for this asset',
    example: 'VND',
    pattern: '^[A-Z]{3}$',
  })
  @Column({ 
    type: 'varchar', 
    length: 3, 
    name: 'currency',
    comment: 'Currency code - 3-letter ISO currency code'
  })
  currency: string;

  /**
   * Timezone for this asset's market (e.g., 'Asia/Ho_Chi_Minh', 'America/New_York').
   * Must follow IANA timezone format.
   */
  @ApiProperty({
    description: 'Timezone for this asset\'s market',
    example: 'Asia/Ho_Chi_Minh',
    pattern: '^[A-Za-z_/]+$',
  })
  @Column({ 
    type: 'varchar', 
    length: 50, 
    name: 'timezone',
    comment: 'Timezone for asset market'
  })
  timezone: string;

  /**
   * Whether this asset is active and available for trading.
   */
  @ApiProperty({
    description: 'Whether this asset is active and available for trading',
    example: true,
    default: true,
  })
  @Column({ 
    type: 'boolean', 
    default: true, 
    name: 'is_active',
    comment: 'Asset active status'
  })
  isActive: boolean;

  /**
   * Optional description of the asset.
   */
  @ApiPropertyOptional({
    description: 'Asset description',
    example: 'Leading steel manufacturer in Vietnam',
  })
  @Column({ 
    type: 'text', 
    nullable: true, 
    name: 'description',
    comment: 'Asset description'
  })
  description?: string;

  /**
   * User ID who created this global asset.
   */
  @ApiProperty({
    description: 'User ID who created this global asset',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ 
    type: 'uuid', 
    nullable: true,
    name: 'created_by',
    comment: 'User ID who created this global asset'
  })
  createdBy?: string;

  /**
   * Timestamp when the asset was created.
   */
  @ApiProperty({
    description: 'Timestamp when the asset was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  @CreateDateColumn({ 
    name: 'created_at',
    comment: 'Asset creation timestamp'
  })
  createdAt: Date;

  /**
   * Timestamp when the asset was last updated.
   */
  @ApiProperty({
    description: 'Timestamp when the asset was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  @UpdateDateColumn({ 
    name: 'updated_at',
    comment: 'Asset last update timestamp'
  })
  updatedAt: Date;

  /**
   * Trades associated with this global asset.
   */
  @OneToMany(() => Trade, trade => trade.asset, {
    cascade: false
  })
  trades: Trade[];

  /**
   * Current price data for this global asset.
   * One-to-one relationship with AssetPrice (optional).
   */
  @OneToOne(() => AssetPrice, assetPrice => assetPrice.globalAsset, {
    cascade: false
  })
  assetPrice?: AssetPrice;

  /**
   * Price history for this global asset.
   * One-to-many relationship with AssetPriceHistory.
   */
  @OneToMany(() => AssetPriceHistory, priceHistory => priceHistory.globalAsset, {
    cascade: false
  })
  priceHistory?: AssetPriceHistory[];

  /**
   * Get the unique global identifier for this asset.
   * @returns Combined symbol and nation for global uniqueness
   */
  getGlobalIdentifier(): string {
    return `${this.symbol}.${this.nation}`;
  }

  /**
   * Get the asset display name for UI.
   * @returns Formatted display name with nation
   */
  getDisplayName(): string {
    return `${this.name} (${this.symbol}.${this.nation})`;
  }

  /**
   * Get the market display name for UI.
   * @returns Formatted market name
   */
  getMarketDisplayName(): string {
    return `${this.marketCode} (${this.nation})`;
  }

  /**
   * Check if this asset has any associated trades.
   * @returns True if asset has trades, false otherwise
   */
  hasTrades(): boolean {
    return !!(this.trades && this.trades.length > 0);
  }

  /**
   * Check if this asset is available for trading.
   * @returns True if asset is active and available, false otherwise
   */
  isAvailableForTrading(): boolean {
    return this.isActive;
  }

  /**
   * Get the asset's market information.
   * @returns Market information object
   */
  getMarketInfo(): {
    nation: string;
    marketCode: string;
    currency: string;
    timezone: string;
  } {
    return {
      nation: this.nation,
      marketCode: this.marketCode,
      currency: this.currency,
      timezone: this.timezone,
    };
  }

  /**
   * Validate if the asset can be modified.
   * @returns True if asset can be modified, false otherwise
   */
  canModify(): boolean {
    // Asset can be modified if it has no trades or is not active
    return !this.hasTrades() || !this.isActive;
  }

  /**
   * Validate symbol format.
   * @param symbol - Symbol to validate
   * @throws Error if symbol format is invalid
   */
  static validateSymbolFormat(symbol: string): void {
    if (!/^[A-Z0-9-]+$/.test(symbol)) {
      throw new Error('Symbol must contain only uppercase letters, numbers, and dashes');
    }
  }

  /**
   * Validate nation code format.
   * @param nation - Nation code to validate
   * @throws Error if nation code format is invalid
   */
  static validateNationFormat(nation: string): void {
    if (!/^[A-Z]{2}$/.test(nation)) {
      throw new Error('Nation code must be 2-letter ISO country code');
    }
  }

  /**
   * Validate market code format.
   * @param marketCode - Market code to validate
   * @throws Error if market code format is invalid
   */
  static validateMarketCodeFormat(marketCode: string): void {
    if (!/^[A-Z0-9-]+$/.test(marketCode)) {
      throw new Error('Market code must contain only uppercase letters, numbers, and dashes');
    }
  }

  /**
   * Validate currency code format.
   * @param currency - Currency code to validate
   * @throws Error if currency code format is invalid
   */
  static validateCurrencyFormat(currency: string): void {
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error('Currency code must be 3-letter ISO currency code');
    }
  }

  /**
   * Validate timezone format.
   * @param timezone - Timezone to validate
   * @throws Error if timezone format is invalid
   */
  static validateTimezoneFormat(timezone: string): void {
    if (!/^[A-Za-z_/]+$/.test(timezone)) {
      throw new Error('Timezone must follow IANA timezone format');
    }
  }

  /**
   * Serialize the entity to JSON with computed properties.
   */
  toJSON() {
    return {
      ...this,
      globalIdentifier: this.getGlobalIdentifier(),
      displayName: this.getDisplayName(),
      marketDisplayName: this.getMarketDisplayName(),
      hasTrades: this.hasTrades(),
      isAvailableForTrading: this.isAvailableForTrading(),
      marketInfo: this.getMarketInfo(),
      canModify: this.canModify(),
    };
  }
}
