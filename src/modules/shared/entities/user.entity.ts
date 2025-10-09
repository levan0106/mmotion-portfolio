import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Account } from './account.entity';

/**
 * User entity representing system users with progressive authentication.
 * Supports demo mode (username only) to full authentication (password + profile).
 */
@Entity('users')
@Index(['username'])
@Index(['email'])
export class User {
  /**
   * Unique identifier for the user.
   */
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId: string;

  /**
   * Unique username for the user.
   */
  @Column({ type: 'varchar', length: 255, unique: true, name: 'username' })
  username: string;

  /**
   * User's email address (unique, nullable for demo users).
   */
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true, name: 'email' })
  email?: string;

  /**
   * Hashed password (nullable for demo users).
   */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'password_hash' })
  passwordHash?: string;

  /**
   * User's full name.
   */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'full_name' })
  fullName?: string;

  /**
   * User's phone number.
   */
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone' })
  phone?: string;

  /**
   * User's date of birth.
   */
  @Column({ type: 'date', nullable: true, name: 'date_of_birth' })
  dateOfBirth?: Date;

  /**
   * User's address.
   */
  @Column({ type: 'text', nullable: true, name: 'address' })
  address?: string;

  /**
   * Text-based avatar (generated from initials).
   */
  @Column({ type: 'varchar', length: 10, nullable: true, name: 'avatar_text' })
  avatarText?: string;

  /**
   * Whether email has been verified.
   */
  @Column({ type: 'boolean', default: false, name: 'is_email_verified' })
  isEmailVerified: boolean;

  /**
   * Whether user profile is complete.
   */
  @Column({ type: 'boolean', default: false, name: 'is_profile_complete' })
  isProfileComplete: boolean;

  /**
   * Whether user has set a password.
   */
  @Column({ type: 'boolean', default: false, name: 'is_password_set' })
  isPasswordSet: boolean;

  /**
   * Email verification token.
   */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'email_verification_token' })
  emailVerificationToken?: string;

  /**
   * Timestamp of last login.
   */
  @Column({ type: 'timestamp', nullable: true, name: 'last_login' })
  lastLogin?: Date;

  /**
   * Timestamp when the user was created.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the user was last updated.
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Accounts owned by this user.
   */
  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];

  /**
   * Get user's authentication state.
   */
  get authState(): 'DEMO' | 'PARTIAL' | 'COMPLETE' {
    if (this.isPasswordSet) return 'COMPLETE';
    if (this.isProfileComplete) return 'PARTIAL';
    return 'DEMO';
  }

  /**
   * Check if user can login with just username.
   */
  get canLoginWithUsernameOnly(): boolean {
    return this.authState === 'DEMO' || this.authState === 'PARTIAL';
  }

  /**
   * Check if user requires password for login.
   */
  get requiresPassword(): boolean {
    return this.authState === 'COMPLETE';
  }

  /**
   * Generate avatar text from user's name.
   */
  generateAvatarText(): string {
    const name = this.fullName || this.username;
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return initials || name.charAt(0).toUpperCase();
  }

  /**
   * Update avatar text when profile changes.
   */
  updateAvatarText(): void {
    this.avatarText = this.generateAvatarText();
  }

  /**
   * Check if profile is complete based on required fields.
   */
  checkProfileComplete(): boolean {
    // Profile is complete if user has fullName, email, and password set
    const isComplete = !!(
      this.fullName &&
      this.email &&
      this.isPasswordSet
    );
    
    return isComplete;
  }

  /**
   * Update profile completion status.
   */
  updateProfileCompletion(): void {
    this.isProfileComplete = this.checkProfileComplete();
    this.updateAvatarText();
  }
}
