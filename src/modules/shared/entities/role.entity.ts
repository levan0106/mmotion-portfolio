import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Permission } from './permission.entity';
import { UserRole } from './user-role.entity';

/**
 * Role entity representing user roles in the system.
 * Roles define what users can do in the system.
 */
@Entity('roles')
@Index(['name'])
@Index(['isSystemRole'])
export class Role {
  /**
   * Unique identifier for the role.
   */
  @PrimaryGeneratedColumn('uuid', { name: 'role_id' })
  roleId: string;

  /**
   * Unique role name (e.g., 'admin', 'investor', 'analyst').
   */
  @Column({ type: 'varchar', length: 50, unique: true, name: 'name' })
  name: string;

  /**
   * Human-readable role name.
   */
  @Column({ type: 'varchar', length: 100, name: 'display_name' })
  displayName: string;

  /**
   * Role description.
   */
  @Column({ type: 'text', nullable: true, name: 'description' })
  description?: string;

  /**
   * Whether this is a system role (cannot be deleted).
   */
  @Column({ type: 'boolean', default: false, name: 'is_system_role' })
  isSystemRole: boolean;

  /**
   * Role priority for hierarchy (higher number = higher priority).
   */
  @Column({ type: 'integer', default: 0, name: 'priority' })
  priority: number;

  /**
   * Timestamp when the role was created.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the role was last updated.
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Permissions assigned to this role.
   */
  @ManyToMany(() => Permission, permission => permission.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'roleId' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'permissionId' }
  })
  permissions: Permission[];

  /**
   * User role assignments.
   */
  @OneToMany(() => UserRole, userRole => userRole.role)
  userRoles: UserRole[];

  /**
   * Check if role has a specific permission.
   */
  hasPermission(permissionName: string): boolean {
    if (!this.permissions) return false;
    return this.permissions.some(permission => permission.name === permissionName);
  }

  /**
   * Check if role has any of the specified permissions.
   */
  hasAnyPermission(permissionNames: string[]): boolean {
    if (!this.permissions) return false;
    return this.permissions.some(permission => permissionNames.includes(permission.name));
  }

  /**
   * Check if role has all of the specified permissions.
   */
  hasAllPermissions(permissionNames: string[]): boolean {
    if (!this.permissions) return false;
    return permissionNames.every(permissionName => 
      this.permissions.some(permission => permission.name === permissionName)
    );
  }
}
