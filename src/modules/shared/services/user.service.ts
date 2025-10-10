import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { AutoRoleAssignmentService } from './auto-role-assignment.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UserSearchParamsDto,
  UserStatsResponseDto,
} from '../dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly autoRoleAssignmentService: AutoRoleAssignmentService,
  ) {}

  async getUsers(params: UserSearchParamsDto): Promise<{ users: UserResponseDto[]; total: number; page: number; limit: number }> {
    const {
      query,
      isActive,
      isEmailVerified,
      roleId,
      page = 1,
      limit = 10,
    } = params;

    const options: FindManyOptions<User> = {
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    };

    // Build where conditions
    const whereConditions: any = {};

    if (query) {
      whereConditions.email = Like(`%${query}%`);
    }

    if (isEmailVerified !== undefined) {
      whereConditions.isEmailVerified = isEmailVerified;
    }

    if (Object.keys(whereConditions).length > 0) {
      options.where = whereConditions;
    }

    // If filtering by role, we need to join with user_roles
    if (roleId) {
      const usersWithRole = await this.userRoleRepository
        .createQueryBuilder('ur')
        .leftJoinAndSelect('ur.user', 'user')
        .where('ur.roleId = :roleId', { roleId })
        .andWhere('ur.isActive = :isActive', { isActive: true })
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const users = usersWithRole.map(ur => this.mapUserToResponse(ur.user));
      const total = await this.userRoleRepository
        .createQueryBuilder('ur')
        .where('ur.roleId = :roleId', { roleId })
        .andWhere('ur.isActive = :isActive', { isActive: true })
        .getCount();

      return {
        users,
        total,
        page,
        limit,
      };
    }

    const [users, total] = await this.userRepository.findAndCount(options);

    return {
      users: users.map(user => this.mapUserToResponse(user)),
      total,
      page,
      limit,
    };
  }

  async searchUsers(params: UserSearchParamsDto): Promise<{ users: UserResponseDto[]; total: number; page: number; limit: number }> {
    return this.getUsers(params);
  }

  async getUserStats(): Promise<UserStatsResponseDto> {
    const [
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isEmailVerified: true } }),
      this.userRepository.count({ where: { isEmailVerified: false } }),
    ]);

    return {
      totalUsers,
      activeUsers: totalUsers, // All users are considered active in this system
      inactiveUsers: 0, // No inactive users in this system
      verifiedUsers,
      unverifiedUsers,
    };
  }

  async getUser(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapUserToResponse(user);
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (createUserDto.password) {
      hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    }

    const user = this.userRepository.create({
      username: createUserDto.email, // Use email as username
      email: createUserDto.email,
      passwordHash: hashedPassword,
      fullName: createUserDto.displayName || createUserDto.firstName + ' ' + createUserDto.lastName,
      isEmailVerified: false,
      isPasswordSet: !!createUserDto.password,
    });

    const savedUser = await this.userRepository.save(user);

    // Auto assign default role if enabled
    try {
      await this.autoRoleAssignmentService.assignDefaultRole(savedUser.userId);
      this.logger.log(`Auto-assigned default role to user: ${savedUser.email}`);
    } catch (error) {
      this.logger.warn(`Failed to auto-assign default role to user ${savedUser.email}: ${error.message}`);
      // Don't throw error - user creation should succeed even if role assignment fails
    }

    return this.mapUserToResponse(savedUser);
  }


  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Update only allowed fields
    if (updateUserDto.displayName) {
      user.fullName = updateUserDto.displayName;
    }

    const updatedUser = await this.userRepository.save(user);
    return this.mapUserToResponse(updatedUser);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.remove(user);
  }

  async activateUser(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // In this system, users are always active
    return this.mapUserToResponse(user);
  }

  async deactivateUser(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // In this system, users cannot be deactivated
    return this.mapUserToResponse(user);
  }

  private mapUserToResponse(user: User): UserResponseDto {
    // Handle null/empty fullName
    const fullName = user.fullName?.trim() || '';
    const nameParts = fullName ? fullName.split(' ').filter(part => part.trim()) : [];
    
    return {
      userId: user.userId,
      email: user.email || '',
      firstName: nameParts.length > 0 ? nameParts[0] : '',
      lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : '',
      displayName: fullName || user.username || 'Unknown User',
      isActive: true, // All users are active in this system
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLogin?.toISOString(),
    };
  }
}
