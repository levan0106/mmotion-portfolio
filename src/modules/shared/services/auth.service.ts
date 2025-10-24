import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { Account } from '../entities/account.entity';
import { AutoRoleAssignmentService } from './auto-role-assignment.service';
import { NotificationGateway } from '../../../notification/notification.gateway';
import { DeviceTrustService, DeviceInfo } from './device-trust.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../events/user-created.event';
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
    private readonly notificationGateway: NotificationGateway,
    private readonly deviceTrustService: DeviceTrustService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Login or register user with progressive authentication
   */
  async loginOrRegister(username: string, password?: string, deviceInfo?: DeviceInfo): Promise<LoginResult> {
    // Normalize username: lowercase, trim, and remove all spaces
    const normalizedUsername = username.toLowerCase().trim().replace(/\s+/g, '');
    this.logger.log(`Login/Register attempt for username: ${normalizedUsername}`);

    let user = await this.userRepository.findOne({ 
      where: { username: normalizedUsername },
      relations: ['accounts']
    });

    if (!user) {
      // Create new user
      this.logger.log(`Creating new user: ${normalizedUsername}`);
      const result = await this.createUserWithMainAccount(normalizedUsername);
      
      // Add device to trusted devices if device info provided
      if (deviceInfo) {
        await this.deviceTrustService.addTrustedDevice(result.user.userId, deviceInfo);
      }
      
      return result;
    }

    // Step 1: Check if device is trusted
    let isDeviceTrusted = false;
    if (deviceInfo) {
      isDeviceTrusted = await this.deviceTrustService.isDeviceTrusted(
        user.userId, 
        deviceInfo.deviceFingerprint
      );
      
      if (isDeviceTrusted) {
        // Trusted device - allow login without password
        this.logger.log(`Trusted device login for user: ${normalizedUsername}`);
        user.lastLogin = new Date();
        await this.userRepository.save(user);
        
        const mainAccount = await this.getMainAccount(user.userId);
        if (!mainAccount) {
          throw new NotFoundException('Main account not found for user');
        }
        
        const token = this.generateToken(user);
        return { user, account: mainAccount, token };
      }
    }

    // Step 2: Device not trusted - check if user needs password
    if (user.requiresPassword) {
      // Step 3: User needs password - validate it
      if (!password) {
        throw new BadRequestException('Password required for this user');
      }
      if (!await this.validatePassword(password, user.passwordHash)) {
        throw new UnauthorizedException('Invalid password');
      }
    }
    // Step 4: User doesn't need password - allow login

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Add device to trusted devices if device info provided and login successful
    if (deviceInfo) {
      await this.deviceTrustService.addTrustedDevice(user.userId, deviceInfo);
    }

    // Get main account
    const mainAccount = await this.getMainAccount(user.userId);
    if (!mainAccount) {
      throw new NotFoundException('Main account not found for user');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    this.logger.log(`User ${normalizedUsername} logged in successfully`);
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
      email: `${username}@mmotion.cloud`, // Default email for demo users
      baseCurrency: 'VND',
      isMainAccount: true,
      userId: user.userId,
    });

    // Auto assign default role if enabled
    try {
      await this.autoRoleAssignmentService.assignDefaultRole(user.userId);
      //this.logger.log(`Auto-assigned default role to user: ${username}`);
    } catch (error) {
      this.logger.warn(`Failed to auto-assign default role to user ${username}: ${error.message}`);
      // Don't throw error - user creation should succeed even if role assignment fails
    }

    // Send welcome notification
    try {
      await this.notificationGateway.sendSystemNotification(
        user.userId,
        'Chào mừng đến với MMOTION!',
        `Xin chào ${username}! Chào mừng bạn đến với nền tảng quản lý danh mục đầu tư. Tài khoản của bạn đã sẵn sàng. Hãy cài đặt mật khẩu để bảo vệ tài khoản và tạo danh mục đầu tiên của bạn.`,
        '/welcome',
        {
          type: 'welcome',
          userId: user.userId,
          username: username,
          isDemo: true,
        }
      );
      //this.logger.log(`Đã gửi thông báo chào mừng đến user demo: ${username}`);
    } catch (error) {
      this.logger.warn(`Không thể gửi thông báo chào mừng đến user demo ${username}: ${error.message}`);
      // Don't throw error - user creation should succeed even if notification fails
    }

    // Send public portfolios notification
    try {
      await this.notificationGateway.sendSystemNotification(
        user.userId,
        'Khám phá Danh mục mẫu',
        `Khám phá bộ sưu tập mẫu danh mục công khai của chúng tôi! Những mẫu này được tạo bởi các user có kinh nghiệm và có thể giúp bạn bắt đầu nhanh chóng. Duyệt qua các mẫu, xem cấu trúc của chúng và tạo danh mục riêng của bạn dựa trên các chiến lược thành công.`,
        '/portfolios?tab=templates',
        {
          type: 'system',
          userId: user.userId,
          username: username,
          isDemo: true,
          action: 'explore_public_portfolios',
        }
      );
      this.logger.log(`Sent public portfolios notification to demo user: ${username}`);
    } catch (error) {
      this.logger.warn(`Failed to send public portfolios notification to demo user ${username}: ${error.message}`);
      // Don't throw error - user creation should succeed even if notification fails
    }

    // Emit user created event for auto asset creation
    try {
      this.eventEmitter.emit('user.created', new UserCreatedEvent(
        user.userId,
        mainAccount.accountId,
        username,
        true // isDemo
      ));
      this.logger.log(`Emitted user.created event for: ${username}`);
    } catch (error) {
      this.logger.warn(`Failed to emit user.created event for ${username}: ${error.message}`);
      // Don't throw error - user creation should succeed even if event emission fails
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
    
    // Update profile completion status after setting password
    user.updateProfileCompletion();
    
    await this.userRepository.save(user);

    // Expire all trusted devices for security when password is first set
    try {
      await this.deviceTrustService.expireAllDevices(userId);
      this.logger.log(`All trusted devices expired for user: ${userId} due to password being set`);
    } catch (error) {
      this.logger.warn(`Failed to expire trusted devices for user ${userId}: ${error.message}`);
      // Don't throw error here as password setting should still succeed
    }

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

    // Expire all trusted devices for security
    try {
      await this.deviceTrustService.expireAllDevices(userId);
      this.logger.log(`All trusted devices expired for user: ${userId} due to password change`);
    } catch (error) {
      this.logger.warn(`Failed to expire trusted devices for user ${userId}: ${error.message}`);
      // Don't throw error here as password change should still succeed
    }
    
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
   * Check if device is trusted for a user
   */
  async checkDeviceTrust(username: string, deviceFingerprint: string): Promise<boolean> {
    const normalizedUsername = username.toLowerCase().trim().replace(/\s+/g, '');
    
    const user = await this.userRepository.findOne({
      where: { username: normalizedUsername },
    });

    if (!user) {
      return false;
    }

    return await this.deviceTrustService.isDeviceTrusted(user.userId, deviceFingerprint);
  }

  /**
   * Check user status by username
   */
  async checkUserStatus(username: string): Promise<{
    exists: boolean;
    requiresPassword: boolean;
    isProfileComplete: boolean;
  }> {
    // Normalize username: lowercase, trim, and remove all spaces
    const normalizedUsername = username.toLowerCase().trim().replace(/\s+/g, '');
    
    const user = await this.userRepository.findOne({
      where: { username: normalizedUsername },
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
