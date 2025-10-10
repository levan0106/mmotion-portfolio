import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { Account } from '../entities/account.entity';
import { AutoRoleAssignmentService } from './auto-role-assignment.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export interface LoginResult {
  user: User;
  account: Account;
  token?: string;
}

export interface RegisterResult {
  user: User;
  account: Account;
  token?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly jwtService: JwtService,
    private readonly autoRoleAssignmentService: AutoRoleAssignmentService,
  ) {}

  /**
   * Login or register user with progressive authentication
   */
  async loginOrRegister(username: string, password?: string): Promise<LoginResult> {
    this.logger.log(`Login/Register attempt for username: ${username}`);

    let user = await this.userRepository.findOne({ 
      where: { username },
      relations: ['accounts']
    });

    if (!user) {
      // Create new user
      this.logger.log(`Creating new user: ${username}`);
      const result = await this.createUserWithMainAccount(username);
      return result;
    }

    // Check authentication requirements based on user state
    if (user.requiresPassword) {
      if (!password) {
        throw new BadRequestException('Password required for this user');
      }
      if (!await this.validatePassword(password, user.passwordHash)) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Get main account
    const mainAccount = await this.getMainAccount(user.userId);
    if (!mainAccount) {
      throw new NotFoundException('Main account not found for user');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    this.logger.log(`User ${username} logged in successfully`);
    return { user, account: mainAccount, token };
  }

  /**
   * Create new user with main account
   */
  async createUserWithMainAccount(username: string): Promise<RegisterResult> {
    this.logger.log(`Creating user and main account for: ${username}`);

    // Create user
    const user = await this.userRepository.save({
      username,
      avatarText: this.generateAvatarText(username),
    });

    // Create main account
    const mainAccount = await this.accountRepository.save({
      name: username,
      email: `${username}@demo.com`, // Default email for demo users
      baseCurrency: 'VND',
      isMainAccount: true,
      userId: user.userId,
    });

    // Auto assign default role if enabled
    try {
      await this.autoRoleAssignmentService.assignDefaultRole(user.userId);
      this.logger.log(`Auto-assigned default role to user: ${username}`);
    } catch (error) {
      this.logger.warn(`Failed to auto-assign default role to user ${username}: ${error.message}`);
      // Don't throw error - user creation should succeed even if role assignment fails
    }

    // Generate JWT token
    const token = this.generateToken(user);

    this.logger.log(`Created user ${username} with main account ${mainAccount.accountId}`);
    return { user, account: mainAccount, token };
  }


  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: {
    fullName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    address?: string;
  }): Promise<User> {
    this.logger.log(`Updating profile for user: ${userId}`);

    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it's already taken by another user
    if (profileData.email && profileData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({ 
        where: { email: profileData.email } 
      });
      
      if (existingUser && existingUser.userId !== userId) {
        throw new BadRequestException('Email is already taken by another user');
      }
      
      // Reset email verification if email changed
      user.isEmailVerified = false;
      user.emailVerificationToken = randomUUID();
    }

    // Update profile fields
    Object.assign(user, profileData);
    
    // Update profile completion status
    user.updateProfileCompletion();

    const updatedUser = await this.userRepository.save(user);
    this.logger.log(`Profile updated for user: ${userId}`);
    
    return updatedUser;
  }

  /**
   * Set password for user
   */
  async setPassword(userId: string, password: string): Promise<void> {
    this.logger.log(`Setting password for user: ${userId}`);

    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate password
    this.validatePasswordFormat(password);

    // Hash and save password
    user.passwordHash = await this.hashPassword(password);
    user.isPasswordSet = true;
    
    await this.userRepository.save(user);
    this.logger.log(`Password set for user: ${userId}`);
  }

  /**
   * Change password for user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    this.logger.log(`Changing password for user: ${userId}`);

    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('User has no password set');
    }

    // Validate current password
    if (!await this.validatePassword(currentPassword, user.passwordHash)) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password
    this.validatePasswordFormat(newPassword);

    // Hash and save new password
    user.passwordHash = await this.hashPassword(newPassword);
    await this.userRepository.save(user);
    
    this.logger.log(`Password changed for user: ${userId}`);
  }

  /**
   * Generate email verification token
   */
  async generateEmailVerificationToken(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = randomUUID();
    user.emailVerificationToken = token;
    await this.userRepository.save(user);

    this.logger.log(`Generated email verification token for user: ${userId}`);
    return token;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { emailVerificationToken: token } 
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.updateProfileCompletion();

    const updatedUser = await this.userRepository.save(user);
    this.logger.log(`Email verified for user: ${user.userId}`);
    
    return updatedUser;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { userId },
      relations: ['accounts']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get main account for user
   */
  private async getMainAccount(userId: string): Promise<Account | null> {
    return await this.accountRepository.findOne({
      where: { userId, isMainAccount: true }
    });
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Validate password
   */
  private async validatePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Validate password format
   */
  private validatePasswordFormat(password: string): void {
    if (password.length < 6) {
      throw new BadRequestException(
        'Password must be at least 6 characters'
      );
    }
  }

  /**
   * Generate avatar text from name
   */
  private generateAvatarText(name: string): string {
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return initials || name.charAt(0).toUpperCase();
  }

  /**
   * Check user status by username
   */
  async checkUserStatus(username: string): Promise<{
    exists: boolean;
    requiresPassword: boolean;
    isProfileComplete: boolean;
  }> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      return {
        exists: false,
        requiresPassword: false,
        isProfileComplete: false,
      };
    }

    return {
      exists: true,
      requiresPassword: user.isPasswordSet,
      isProfileComplete: user.isProfileComplete,
    };
  }

  /**
   * Generate JWT token for user
   */
  private generateToken(user: User): string {
    const payload = {
      userId: user.userId,
      username: user.username,
      authState: user.authState,
      isPasswordSet: user.isPasswordSet,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '24h', // Token expires in 24 hours
    });
  }
}
