import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Asset } from '../../asset/entities/asset.entity';

@Entity('asset_targets')
export class AssetTarget {
  @PrimaryColumn('uuid', { name: 'asset_id' })
  assetId: string;

  @Column('decimal', { precision: 18, scale: 8, nullable: true })
  stopLoss: number;

  @Column('decimal', { precision: 18, scale: 8, nullable: true })
  takeProfit: number;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  // Computed properties
  get hasStopLoss(): boolean {
    return this.stopLoss !== null && this.stopLoss > 0;
  }

  get hasTakeProfit(): boolean {
    return this.takeProfit !== null && this.takeProfit > 0;
  }

  get isConfigured(): boolean {
    return this.hasStopLoss || this.hasTakeProfit;
  }
}
