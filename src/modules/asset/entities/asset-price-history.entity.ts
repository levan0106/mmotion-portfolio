import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GlobalAsset } from './global-asset.entity';
import { PriceType, PriceSource } from '../enums/price-type.enum';

/**
 * AssetPriceHistory entity representing historical price changes for global assets.
 * This table stores all price changes with timestamps for audit and analytics purposes.
 */
@Entity('asset_price_history')
@Index('IDX_ASSET_PRICE_HISTORY_ASSET_ID', ['assetId'])
@Index('IDX_ASSET_PRICE_HISTORY_CREATED_AT', ['createdAt'])
@Index('IDX_ASSET_PRICE_HISTORY_PRICE_TYPE', ['priceType'])
@Index('IDX_ASSET_PRICE_HISTORY_PRICE_SOURCE', ['priceSource'])
@Check('CHK_ASSET_PRICE_HISTORY_POSITIVE', 'price > 0')
@Check('CHK_ASSET_PRICE_HISTORY_TYPE_VALID', 'price_type IN (\'MANUAL\', \'MARKET_DATA\', \'EXTERNAL\', \'CALCULATED\')')
@Check('CHK_ASSET_PRICE_HISTORY_SOURCE_VALID', 'price_source IN (\'USER\', \'MARKET_DATA_SERVICE\', \'EXTERNAL_API\', \'CALCULATED\')')
export class AssetPriceHistory {
  @ApiProperty({
    description: 'Unique identifier for the price history record',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Foreign key to global_assets table',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'asset_id' })
  assetId: string;

  @ApiProperty({
    description: 'Price value at the time of this record',
    example: 150.75,
  })
  @Column({ type: 'numeric', precision: 15, scale: 2, name: 'price' })
  price: number;

  @ApiProperty({
    description: 'Type of the price (e.g., MANUAL, MARKET_DATA)',
    enum: PriceType,
    example: PriceType.MARKET_DATA,
  })
  @Column({
    type: 'varchar',
    length: 20,
    default: 'MANUAL',
    name: 'price_type',
  })
  priceType: string;

  @ApiProperty({
    description: 'Source of the price (e.g., USER, MARKET_DATA_SERVICE)',
    enum: PriceSource,
    example: PriceSource.MARKET_DATA_SERVICE,
  })
  @Column({
    type: 'varchar',
    length: 30,
    default: 'USER',
    name: 'price_source',
  })
  priceSource: string;

  @ApiPropertyOptional({
    description: 'Reason for the price change',
    example: 'Market data update',
  })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'change_reason' })
  changeReason?: string;

  @ApiPropertyOptional({
    description: 'Optional metadata about the price change',
    type: 'object',
    example: { provider: 'Yahoo Finance', timestamp: '2024-01-15T10:29:50.000Z' },
  })
  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata?: object;

  @ApiProperty({
    description: 'Timestamp when this price record was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Column({ type: 'timestamp', name: 'created_at', comment: 'Price history record creation timestamp' })
  createdAt: Date;

  /**
   * Many-to-one relationship with GlobalAsset.
   * Each price history record belongs to one global asset.
   */
  @ManyToOne(() => GlobalAsset, globalAsset => globalAsset.id, {
    onDelete: 'CASCADE', // If GlobalAsset is deleted, delete all its price history
  })
  @JoinColumn({ name: 'asset_id' })
  globalAsset: GlobalAsset;

  /**
   * Check if the price change is from a market data source.
   * @returns True if market data, false otherwise
   */
  isMarketDataChange(): boolean {
    return this.priceSource === 'MARKET_DATA_SERVICE' || this.priceSource === 'EXTERNAL_API';
  }

  /**
   * Check if the price change is manually entered.
   * @returns True if manual, false otherwise
   */
  isManualChange(): boolean {
    return this.priceSource === 'USER';
  }

  /**
   * Get a formatted description of the price change.
   * @returns Formatted string describing the change
   */
  getChangeDescription(): string {
    const reason = this.changeReason || 'No reason provided';
    const source = this.priceSource.toLowerCase().replace('_', ' ');
    return `${reason} (${source})`;
  }

  /**
   * Get the price change percentage compared to a previous price.
   * @param previousPrice The previous price to compare against
   * @returns Percentage change (positive for increase, negative for decrease)
   */
  getPriceChangePercentage(previousPrice: number): number {
    if (previousPrice === 0) return 0;
    return ((this.price - previousPrice) / previousPrice) * 100;
  }
}
