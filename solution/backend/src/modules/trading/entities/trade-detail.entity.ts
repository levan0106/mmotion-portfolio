import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Trade } from './trade.entity';
import { Asset } from '../../asset/entities/asset.entity';

@Entity('trade_details')
@Index(['sellTradeId'])
@Index(['buyTradeId'])
@Index(['assetId'])
export class TradeDetail {
  @PrimaryGeneratedColumn('uuid', { name: 'detail_id' })
  detailId: string;

  @Column('uuid', { name: 'sell_trade_id' })
  sellTradeId: string;

  @Column('uuid', { name: 'buy_trade_id' })
  buyTradeId: string;

  @Column('uuid', { name: 'asset_id' })
  assetId: string;

  @Column('decimal', { precision: 18, scale: 8, name: 'matched_qty' })
  matchedQty: number;

  @Column('decimal', { precision: 18, scale: 8, name: 'buy_price' })
  buyPrice: number;

  @Column('decimal', { precision: 18, scale: 8, name: 'sell_price' })
  sellPrice: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0, name: 'fee_tax' })
  feeTax: number;

  @Column('decimal', { precision: 18, scale: 8 })
  pnl: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Trade, (trade) => trade.sellDetails)
  @JoinColumn({ name: 'sell_trade_id', referencedColumnName: 'tradeId' })
  sellTrade: Trade;

  @ManyToOne(() => Trade, (trade) => trade.buyDetails)
  @JoinColumn({ name: 'buy_trade_id', referencedColumnName: 'tradeId' })
  buyTrade: Trade;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  // Computed properties
  get grossPnl(): number {
    return (this.sellPrice - this.buyPrice) * this.matchedQty;
  }

  get netPnl(): number {
    return this.grossPnl - this.feeTax;
  }
}
