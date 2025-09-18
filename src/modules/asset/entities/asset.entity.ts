import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType } from '../enums/asset-type.enum';
import { Trade } from '../../trading/entities/trade.entity';

/**
 * Asset entity representing a financial asset.
 * Assets are user-scoped and can be used across multiple portfolios.
 * Each asset can have multiple trades and portfolio relationships.
 * 
 * CR-003 Changes:
 * - Symbol field is now the primary identifier (replaces code)
 * - Symbol must be unique per user (not globally)
 * - Name can be duplicated across users
 * - Symbol field is read-only after creation
 */
@Entity('assets')
@Index('IDX_ASSET_TYPE', ['type'])
@Index('IDX_ASSET_SYMBOL', ['symbol'])
@Index('IDX_ASSET_USER_NAME', ['createdBy', 'name'])
@Index('IDX_ASSET_CREATED_BY', ['createdBy'])
@Unique('UQ_ASSET_USER_SYMBOL', ['createdBy', 'symbol'])
export class Asset {
  /**
   * Unique identifier for the asset.
   */
  @ApiProperty({
    description: 'Unique identifier for the asset',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;


  /**
   * Name of the asset (e.g., 'Hoa Phat Group', 'Vietcombank').
   */
  @ApiProperty({
    description: 'Name of the asset',
    example: 'Hoa Phat Group',
  })
  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  /**
   * Asset symbol for trading (e.g., 'HPG', 'VCB', 'GOLD').
   * This is the primary identifier for the asset within a user's scope.
   * Must be unique per user, but can be duplicated across users.
   * This field is read-only after creation to maintain data integrity.
   */
  @ApiProperty({
    description: 'Asset symbol for trading - unique per user',
    example: 'HPG',
  })
  @Column({ type: 'varchar', length: 50, name: 'symbol' })
  symbol: string;


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
    name: 'type'
  })
  type: AssetType;

  /**
   * Optional description of the asset.
   */
  @ApiPropertyOptional({
    description: 'Asset description',
    example: 'Leading steel manufacturer in Vietnam',
  })
  @Column({ type: 'text', nullable: true, name: 'description' })
  description?: string;

  /**
   * Initial value of the asset when first added to portfolio.
   */
  @ApiPropertyOptional({
    description: 'Initial value of the asset when first added to portfolio',
    example: 1000000,
  })
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'initial_value' })
  initialValue?: number;

  /**
   * Initial quantity of the asset when first added to portfolio.
   */
  @ApiPropertyOptional({
    description: 'Initial quantity of the asset when first added to portfolio',
    example: 1000,
  })
  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true, name: 'initial_quantity' })
  initialQuantity?: number;

  // currentValue is now calculated real-time as currentQuantity * currentPrice
  // No longer stored in database for accuracy

  /**
   * Current quantity of the asset held.
   * Updated based on buy/sell trades.
   */
  @ApiPropertyOptional({
    description: 'Current quantity of the asset held',
    example: 1000,
  })
  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true, name: 'current_quantity' })
  currentQuantity?: number;

  /**
   * Timestamp when the asset was created.
   */
  @ApiProperty({
    description: 'Timestamp when the asset was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the asset was last updated.
   */
  @ApiProperty({
    description: 'Timestamp when the asset was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * ID of the user who created this asset.
   */
  @ApiProperty({
    description: 'ID of the user who created this asset',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  /**
   * ID of the user who last updated this asset.
   */
  @ApiProperty({
    description: 'ID of the user who last updated this asset',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @Column({ type: 'uuid', name: 'updated_by' })
  updatedBy: string;

  // Note: Assets are no longer directly linked to portfolios
  // They are linked through trades only


  /**
   * Trades associated with this asset.
   */
  @OneToMany(() => Trade, trade => trade.asset, {
    cascade: false
  })
  trades: Trade[];

  // Note: Assets are linked to Portfolios through Trades only
  // No direct relationship with PortfolioAsset

  // getTotalValue() removed - currentValue is now calculated real-time
  // Use currentQuantity * currentPrice for real-time calculation

  /**
   * Calculate the current total quantity of this asset.
   * @returns Current quantity or initial quantity if current quantity is not set
   */
  getTotalQuantity(): number {
    return this.currentQuantity ?? this.initialQuantity;
  }

  /**
   * Check if this asset has any associated trades.
   * @returns True if asset has trades, false otherwise
   */
  hasTrades(): boolean {
    return !!(this.trades && this.trades.length > 0);
  }

  /**
   * Get the asset display name for UI.
   * @returns Formatted display name
   */
  getDisplayName(): string {
    return `${this.name} (${this.symbol})`;
  }

  /**
   * Check if the symbol field can be modified.
   * Symbol is read-only after creation to maintain data integrity.
   * @returns True if symbol can be modified, false otherwise
   */
  canModifySymbol(): boolean {
    // Symbol can only be modified if the asset has no trades
    return !this.hasTrades();
  }

  /**
   * Get the primary identifier for this asset.
   * @returns The symbol field as the primary identifier
   */
  getPrimaryIdentifier(): string {
    return this.symbol;
  }

  /**
   * Validate if symbol can be modified.
   * @param newSymbol - New symbol value
   * @throws Error if symbol cannot be modified
   */
  validateSymbolModification(newSymbol: string): void {
    if (!this.canModifySymbol()) {
      throw new Error('Symbol field is read-only after asset has associated trades');
    }

    if (newSymbol !== this.symbol) {
      // Additional validation can be added here if needed
      // For example, checking if the new symbol is valid format
      if (!/^[A-Z0-9-]+$/.test(newSymbol)) {
        throw new Error('Symbol must contain only uppercase letters, numbers, and dashes');
      }
    }
  }

  /**
   * Serialize the entity to JSON with computed properties.
   */
  toJSON() {
    return {
      ...this,
      // totalValue removed - calculated real-time as currentQuantity * currentPrice
      totalQuantity: this.getTotalQuantity(),
      hasTrades: this.hasTrades(),
      displayName: this.getDisplayName(),
      canModifySymbol: this.canModifySymbol(),
      primaryIdentifier: this.getPrimaryIdentifier(),
    };
  }
}
