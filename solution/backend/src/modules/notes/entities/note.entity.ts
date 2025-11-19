import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { Asset } from '../../asset/entities/asset.entity';

/**
 * Note entity representing notes for portfolios or assets.
 * Each note can be associated with a portfolio (required) and optionally with an asset.
 */
@Entity('notes')
@Index(['portfolioId'])
@Index(['assetId'])
@Index(['portfolioId', 'assetId'])
@Index(['createdAt'])
export class Note {
  /**
   * Unique identifier for the note.
   */
  @PrimaryGeneratedColumn('uuid', { name: 'note_id' })
  noteId: string;

  /**
   * ID of the portfolio this note belongs to (required).
   */
  @Column({ type: 'uuid', name: 'portfolio_id' })
  portfolioId: string;

  /**
   * ID of the asset this note is associated with (optional).
   * If null, the note is for the portfolio in general.
   */
  @Column({ type: 'uuid', nullable: true, name: 'asset_id' })
  assetId?: string;

  /**
   * Date and time of the note (when the note was created or refers to).
   */
  @Column({ type: 'timestamp', name: 'note_date' })
  noteDate: Date;

  /**
   * Content of the note.
   */
  @Column({ type: 'text', name: 'content' })
  content: string;

  /**
   * Timestamp when the note was created.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the note was last updated.
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Portfolio that this note belongs to.
   */
  @ManyToOne(() => Portfolio, (portfolio) => portfolio.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  /**
   * Asset that this note is associated with (optional).
   */
  @ManyToOne(() => Asset, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset?: Asset;
}

