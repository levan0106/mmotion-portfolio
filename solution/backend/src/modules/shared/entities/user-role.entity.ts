import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

/**
 * UserRole entity representing the many-to-many relationship between users and roles.
 * Tracks role assignments with additional metadata.
 */
@Entity('user_roles')
@Index(['userId'])
@Index(['roleId'])
@Index(['isActive'])
@Index(['expiresAt'])
@Unique(['userId', 'roleId'])
export class UserRole {
  /**
   * Unique identifier for the user role assignment.
   */
  @PrimaryGeneratedColumn('uuid', { name: 'user_role_id' })
  userRoleId: string;

  /**
   * ID of the user.
   */
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  /**
   * ID of the role.
   */
  @Column({ type: 'uuid', name: 'role_id' })
  roleId: string;

  /**
   * ID of the user who assigned this role.
   */
  @Column({ type: 'uuid', nullable: true, name: 'assigned_by' })
  assignedBy?: string;

  /**
   * Timestamp when the role was assigned.
   */
  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;

  /**
   * Timestamp when the role assignment expires (null = never expires).
   */
  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  /**
   * Whether the role assignment is active.
   */
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  /**
   * Additional metadata for the role assignment.
   */
  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata?: Record<string, any>;

  /**
   * User who has this role.
   */
  @ManyToOne(() => User, user => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Role assigned to the user.
   */
  @ManyToOne(() => Role, role => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  /**
   * User who assigned this role.
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser: User;

  /**
   * Check if the role assignment is currently valid.
   */
  get isValid(): boolean {
    if (!this.isActive) return false;
    if (this.expiresAt && new Date() > this.expiresAt) return false;
    return true;
  }

  /**
   * Check if the role assignment has expired.
   */
  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  /**
   * Get the time remaining until expiration.
   */
  get timeUntilExpiration(): number | null {
    if (!this.expiresAt) return null;
    const now = new Date();
    const expiration = new Date(this.expiresAt);
    return expiration.getTime() - now.getTime();
  }
}
