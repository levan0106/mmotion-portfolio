import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Account } from '../../shared/entities/account.entity';

/**
 * Portfolio permission types
 */
export enum PortfolioPermissionType {
  OWNER = 'OWNER',
  UPDATE = 'UPDATE',
  VIEW = 'VIEW',
}

/**
 * PortfolioPermission entity representing access permissions for portfolios.
 * Each permission defines what level of access an account has to a portfolio.
 */
@Entity('portfolio_permissions')
@Index(['portfolioId'])
@Index(['accountId'])
@Index(['permissionType'])
@Unique(['portfolioId', 'accountId'])
export class PortfolioPermission {
  /**
   * Unique identifier for the permission.
   */
  @PrimaryGeneratedColumn('uuid', { name: 'permission_id' })
  permissionId: string;

  /**
   * ID of the portfolio this permission applies to.
   */
  @Column({ type: 'uuid', name: 'portfolio_id' })
  portfolioId: string;

  /**
   * ID of the account that has this permission.
   */
  @Column({ type: 'uuid', name: 'account_id' })
  accountId: string;

  /**
   * Type of permission (OWNER, UPDATE, VIEW).
   */
  @Column({
    type: 'enum',
    enum: PortfolioPermissionType,
    name: 'permission_type',
  })
  permissionType: PortfolioPermissionType;

  /**
   * ID of the account that granted this permission.
   */
  @Column({ type: 'uuid', name: 'granted_by' })
  grantedBy: string;

  /**
   * Timestamp when the permission was granted.
   */
  @Column({ type: 'timestamp', name: 'granted_at' })
  grantedAt: Date;

  /**
   * Timestamp when the permission was created.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the permission was last updated.
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Portfolio this permission applies to.
   */
  @ManyToOne(() => Portfolio, (portfolio) => portfolio.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  /**
   * Account that has this permission.
   */
  @ManyToOne(() => Account, (account) => account.portfolioPermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  /**
   * Account that granted this permission.
   */
  @ManyToOne(() => Account, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'granted_by' })
  grantedByAccount: Account;

  /**
   * Check if this permission allows updating the portfolio.
   */
  canUpdate(): boolean {
    return this.permissionType === PortfolioPermissionType.OWNER || 
           this.permissionType === PortfolioPermissionType.UPDATE;
  }

  /**
   * Check if this permission allows deleting the portfolio.
   */
  canDelete(): boolean {
    return this.permissionType === PortfolioPermissionType.OWNER;
  }

  /**
   * Check if this permission allows managing other permissions.
   */
  canManagePermissions(): boolean {
    return this.permissionType === PortfolioPermissionType.OWNER;
  }

  /**
   * Check if this permission allows viewing the portfolio.
   */
  canView(): boolean {
    return true; // All permission types allow viewing
  }

  /**
   * Get human-readable permission description.
   */
  getPermissionDescription(): string {
    switch (this.permissionType) {
      case PortfolioPermissionType.OWNER:
        return 'Full access (Owner)';
      case PortfolioPermissionType.UPDATE:
        return 'Read and Update';
      case PortfolioPermissionType.VIEW:
        return 'Read only';
      default:
        return 'Unknown';
    }
  }
}
