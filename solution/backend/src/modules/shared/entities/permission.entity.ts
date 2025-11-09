import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Index,
} from 'typeorm';
import { Role } from './role.entity';

/**
 * Permission entity representing system permissions.
 * Permissions define specific actions users can perform.
 */
@Entity('permissions')
@Index(['name'])
@Index(['category'])
export class Permission {
  /**
   * Unique identifier for the permission.
   */
  @PrimaryGeneratedColumn('uuid', { name: 'permission_id' })
  permissionId: string;

  /**
   * Unique permission name (e.g., 'users.create', 'portfolios.read').
   */
  @Column({ type: 'varchar', length: 100, unique: true, name: 'name' })
  name: string;

  /**
   * Human-readable permission name.
   */
  @Column({ type: 'varchar', length: 150, name: 'display_name' })
  displayName: string;

  /**
   * Permission description.
   */
  @Column({ type: 'text', nullable: true, name: 'description' })
  description?: string;

  /**
   * Permission category for grouping (e.g., 'user_management', 'portfolio_management').
   */
  @Column({ type: 'varchar', length: 50, name: 'category' })
  category: string;

  /**
   * Whether this is a system permission (cannot be deleted).
   */
  @Column({ type: 'boolean', default: false, name: 'is_system_permission' })
  isSystemPermission: boolean;

  /**
   * Permission priority for hierarchy (higher number = higher priority).
   */
  @Column({ type: 'integer', default: 0, name: 'priority' })
  priority: number;

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
   * Roles that have this permission.
   */
  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];

  /**
   * Check if permission belongs to a specific category.
   */
  belongsToCategory(categoryName: string): boolean {
    return this.category === categoryName;
  }

  /**
   * Get permission action (e.g., 'create', 'read', 'update', 'delete').
   */
  getAction(): string {
    const parts = this.name.split('.');
    return parts[parts.length - 1];
  }

  /**
   * Get permission resource (e.g., 'users', 'portfolios', 'trades').
   */
  getResource(): string {
    const parts = this.name.split('.');
    return parts[0];
  }
}
