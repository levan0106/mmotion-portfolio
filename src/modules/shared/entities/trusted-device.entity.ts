import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn, 
  Index,
  JoinColumn
} from 'typeorm';
import { User } from './user.entity';

@Entity('trusted_devices')
@Index(['userId', 'deviceFingerprint'], { unique: true })
export class TrustedDevice {
  /**
   * Unique identifier for the trusted device
   */
  @PrimaryGeneratedColumn('uuid', { name: 'device_id' })
  deviceId: string;

  /**
   * User ID who owns this trusted device
   */
  @Column({ name: 'user_id' })
  userId: string;

  /**
   * User relationship
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Unique device fingerprint
   */
  @Column({ name: 'device_fingerprint' })
  deviceFingerprint: string;

  /**
   * Human-readable device name
   */
  @Column({ name: 'device_name' })
  deviceName: string;

  /**
   * Browser information
   */
  @Column({ name: 'browser_info' })
  browserInfo: string;

  /**
   * IP address when device was first trusted
   */
  @Column({ name: 'ip_address' })
  ipAddress: string;

  /**
   * Location when device was first trusted
   */
  @Column({ name: 'location' })
  location: string;

  /**
   * Whether device is currently trusted
   */
  @Column({ name: 'is_trusted', default: true })
  isTrusted: boolean;

  /**
   * Trust level of the device
   */
  @Column({ 
    name: 'trust_level', 
    type: 'enum', 
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  })
  trustLevel: 'LOW' | 'MEDIUM' | 'HIGH';

  /**
   * Last time device was used for authentication
   */
  @Column({ name: 'last_used' })
  lastUsed: Date;

  /**
   * When this device trust expires
   */
  @Column({ name: 'expires_at' })
  expiresAt: Date;

  /**
   * When device was first trusted
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * When device information was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Check if device trust is still valid
   */
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if device is currently trusted and not expired
   */
  get isActive(): boolean {
    return this.isTrusted && !this.isExpired;
  }

  /**
   * Get device display name
   */
  get displayName(): string {
    return `${this.deviceName} (${this.browserInfo})`;
  }

  /**
   * Get time since last used
   */
  get timeSinceLastUsed(): string {
    const now = new Date();
    const diff = now.getTime() - this.lastUsed.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }
}
