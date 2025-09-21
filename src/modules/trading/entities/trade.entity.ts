import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { Asset } from '../../asset/entities/asset.entity';
import { TradeDetail } from './trade-detail.entity';

export enum TradeSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum TradeType {
  NORMAL = 'NORMAL',
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  CANCEL = 'CANCEL',
  OPTION = 'OPTION',
}

export enum TradeSource {
  MANUAL = 'MANUAL',
  API = 'API',
  IMPORT = 'IMPORT',
}

@Entity('trades')
@Index(['portfolioId'])
@Index(['assetId'])
@Index(['tradeDate'])
@Index(['side'])
export class Trade {
  @PrimaryGeneratedColumn('uuid', { name: 'trade_id' })
  tradeId: string;

  @Column('uuid', { name: 'portfolio_id' })
  portfolioId: string;

  @Column('uuid', { name: 'asset_id' })
  assetId: string;

  @Column('timestamp', { name: 'trade_date' })
  tradeDate: Date;

  @Column({
    type: 'enum',
    enum: TradeSide,
    name: 'side'
  })
  side: TradeSide;

  @Column('decimal', { precision: 18, scale: 8, name: 'quantity' })
  quantity: number;

  @Column('decimal', { precision: 18, scale: 8, name: 'price' })
  price: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0, name: 'fee' })
  fee: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0, name: 'tax' })
  tax: number;

  @Column({
    type: 'enum',
    enum: TradeType,
    default: TradeType.NORMAL,
    name: 'trade_type'
  })
  tradeType: TradeType;

  @Column('varchar', { length: 100, nullable: true, name: 'source' })
  source: string;

  @Column('varchar', { length: 100, nullable: true, name: 'exchange' })
  exchange?: string;

  @Column('varchar', { length: 100, nullable: true, name: 'funding_source' })
  fundingSource?: string;

  @Column('text', { nullable: true, name: 'notes' })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Portfolio, (portfolio) => portfolio.trades)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @ManyToOne(() => Asset, (asset) => asset.trades)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @OneToMany(() => TradeDetail, (detail) => detail.sellTrade)
  sellDetails: TradeDetail[];

  @OneToMany(() => TradeDetail, (detail) => detail.buyTrade)
  buyDetails: TradeDetail[];

  // Computed properties
  get totalAmount(): number {
    return this.quantity * this.price;
  }

  get totalCost(): number {
    return this.totalAmount + this.fee + this.tax;
  }
}
