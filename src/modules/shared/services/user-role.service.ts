import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserRole } from '../entities/user-role.entity';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { AssignRoleToUserDto, UpdateUserRoleDto, UserRoleResponseDto, UserPermissionsResponseDto } from '../dto/user-role.dto';

@Injectable()
export class UserRoleService {
  private readonly logger = new Logger(UserRoleService.name);

  constructor(
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, assignRoleDto: AssignRoleToUserDto): Promise<UserRoleResponseDto> {
    this.logger.log(`Assigning role ${assignRoleDto.roleId} to user ${userId}`);

    // Validate user exists
    const user = await this.userRepository.findOne({
      where: { userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    // Validate role exists
    const role = await this.roleRepository.findOne({
      where: { roleId: assignRoleDto.roleId }
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${assignRoleDto.roleId}' not found`);
    }

    // Check if user already has this role
    const existingUserRole = await this.userRoleRepository.findOne({
      where: { userId, roleId: assignRoleDto.roleId }
    });

    if (existingUserRole) {
      if (existingUserRole.isActive) {
        throw new BadRequestException(`User already has role '${role.name}'`);
      } else {
        // Reactivate existing role
        existingUserRole.isActive = true;
        existingUserRole.assignedAt = new Date();
        existingUserRole.expiresAt = assignRoleDto.expiresAt ? new Date(assignRoleDto.expiresAt) : null;
        existingUserRole.metadata = assignRoleDto.metadata;

        const updatedUserRole = await this.userRoleRepository.save(existingUserRole);
        this.logger.log(`Reactivated role ${role.name} for user ${user.username}`);
        return this.mapUserRoleToResponseDto(updatedUserRole);
      }
    }

    // Create new user role assignment
    const userRole = this.userRoleRepository.create({
      userId,
      roleId: assignRoleDto.roleId,
      expiresAt: assignRoleDto.expiresAt ? new Date(assignRoleDto.expiresAt) : null,
      metadata: assignRoleDto.metadata,
    });

    const savedUserRole = await this.userRoleRepository.save(userRole);

    this.logger.log(`Assigned role ${role.name} to user ${user.username}`);
    return this.mapUserRoleToResponseDto(savedUserRole);
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<UserRoleResponseDto[]> {
    this.logger.log(`Fetching roles for user: ${userId}`);

    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
      order: { assignedAt: 'DESC' }
    });

    return userRoles.map(userRole => this.mapUserRoleToResponseDto(userRole));
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string): Promise<UserPermissionsResponseDto> {
    this.logger.log(`Fetching permissions for user: ${userId}`);

    // Get user roles with permissions
    const userRoles = await this.userRoleRepository.find({
      where: { userId, isActive: true },
      relations: ['role', 'role.permissions']
    });

    // Filter valid roles (not expired)
    const validRoles = userRoles.filter(userRole => userRole.isValid);

    // Get all unique permissions
    const allPermissions = new Set<string>();
    const permissionsByCategory: Record<string, string[]> = {};

    validRoles.forEach(userRole => {
      if (userRole.role.permissions) {
        userRole.role.permissions.forEach(permission => {
          allPermissions.add(permission.name);
          
          if (!permissionsByCategory[permission.category]) {
            permissionsByCategory[permission.category] = [];
          }
          if (!permissionsByCategory[permission.category].includes(permission.name)) {
            permissionsByCategory[permission.category].push(permission.name);
          }
        });
      }
    });

    return {
      userId,
      roles: validRoles.map(userRole => this.mapUserRoleToResponseDto(userRole)),
      permissions: Array.from(allPermissions),
      permissionsByCategory,
    };
  }

  /**
   * Update user role
   */
  async updateUserRole(userRoleId: string, updateUserRoleDto: UpdateUserRoleDto): Promise<UserRoleResponseDto> {
    this.logger.log(`Updating user role: ${userRoleId}`);

    const userRole = await this.userRoleRepository.findOne({
      where: { userRoleId },
      relations: ['role']
    });

    if (!userRole) {
      throw new NotFoundException(`User role with ID '${userRoleId}' not found`);
    }

    // Update user role properties
    Object.assign(userRole, updateUserRoleDto);
    
    if (updateUserRoleDto.expiresAt) {
      userRole.expiresAt = new Date(updateUserRoleDto.expiresAt);
    }

    const updatedUserRole = await this.userRoleRepository.save(userRole);

    this.logger.log(`Updated user role: ${userRoleId}`);
    return this.mapUserRoleToResponseDto(updatedUserRole);
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    this.logger.log(`Removing role ${roleId} from user ${userId}`);

    const userRole = await this.userRoleRepository.findOne({
      where: { userId, roleId }
    });

    if (!userRole) {
      throw new NotFoundException(`User role assignment not found`);
    }

    await this.userRoleRepository.remove(userRole);
    this.logger.log(`Removed role from user`);
  }

  /**
   * Deactivate user role
   */
  async deactivateUserRole(userRoleId: string): Promise<UserRoleResponseDto> {
    this.logger.log(`Deactivating user role: ${userRoleId}`);

    const userRole = await this.userRoleRepository.findOne({
      where: { userRoleId },
      relations: ['role']
    });

    if (!userRole) {
      throw new NotFoundException(`User role with ID '${userRoleId}' not found`);
    }

    userRole.isActive = false;
    const updatedUserRole = await this.userRoleRepository.save(userRole);

    this.logger.log(`Deactivated user role: ${userRoleId}`);
    return this.mapUserRoleToResponseDto(updatedUserRole);
  }

  /**
   * Remove user role assignment by userRoleId
   */
  async removeUserRoleById(userRoleId: string): Promise<void> {
    this.logger.log(`Removing user role assignment: ${userRoleId}`);

    const userRole = await this.userRoleRepository.findOne({
      where: { userRoleId }
    });

    if (!userRole) {
      throw new NotFoundException(`User role assignment with ID '${userRoleId}' not found`);
    }

    await this.userRoleRepository.remove(userRole);
    this.logger.log(`Removed user role assignment: ${userRoleId}`);
  }

  /**
   * Get users with specific role
   */
  async getUsersWithRole(roleId: string): Promise<UserRoleResponseDto[]> {
    this.logger.log(`Fetching users with role: ${roleId}`);

    const userRoles = await this.userRoleRepository.find({
      where: { roleId, isActive: true },
      relations: ['user', 'role'],
      order: { assignedAt: 'DESC' }
    });

    return userRoles.map(userRole => this.mapUserRoleToResponseDto(userRole));
  }

  /**
   * Check if user has specific permission
   */
  async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    this.logger.log(`Checking permission ${permissionName} for user ${userId}`);

    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.permissions.includes(permissionName);
  }

  /**
   * Check if user has any of the specified permissions
   */
  async userHasAnyPermission(userId: string, permissionNames: string[]): Promise<boolean> {
    this.logger.log(`Checking any permissions for user ${userId}`);

    const userPermissions = await this.getUserPermissions(userId);
    return permissionNames.some(permission => userPermissions.permissions.includes(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  async userHasAllPermissions(userId: string, permissionNames: string[]): Promise<boolean> {
    this.logger.log(`Checking all permissions for user ${userId}`);

    const userPermissions = await this.getUserPermissions(userId);
    return permissionNames.every(permission => userPermissions.permissions.includes(permission));
  }

  /**
   * Get expired user roles
   */
  async getExpiredUserRoles(): Promise<UserRoleResponseDto[]> {
    this.logger.log('Fetching expired user roles');

    const expiredUserRoles = await this.userRoleRepository
      .createQueryBuilder('userRole')
      .where('userRole.expiresAt < :now', { now: new Date() })
      .andWhere('userRole.isActive = :isActive', { isActive: true })
      .leftJoinAndSelect('userRole.user', 'user')
      .leftJoinAndSelect('userRole.role', 'role')
      .getMany();

    return expiredUserRoles.map(userRole => this.mapUserRoleToResponseDto(userRole));
  }

  /**
   * Clean up expired user roles
   */
  async cleanupExpiredUserRoles(): Promise<number> {
    this.logger.log('Cleaning up expired user roles');

    const expiredUserRoles = await this.getExpiredUserRoles();
    
    if (expiredUserRoles.length === 0) {
      return 0;
    }

    // Deactivate expired roles
    const userRoleIds = expiredUserRoles.map(ur => ur.userRoleId);
    await this.userRoleRepository.update(
      { userRoleId: In(userRoleIds) },
      { isActive: false }
    );

    this.logger.log(`Cleaned up ${expiredUserRoles.length} expired user roles`);
    return expiredUserRoles.length;
  }

  /**
   * Map user role entity to response DTO
   */
  private mapUserRoleToResponseDto(userRole: UserRole): UserRoleResponseDto {
    return {
      userRoleId: userRole.userRoleId,
      userId: userRole.userId,
      roleId: userRole.roleId,
      roleName: userRole.role?.name || '',
      roleDisplayName: userRole.role?.displayName || '',
      assignedBy: userRole.assignedBy,
      assignedAt: userRole.assignedAt,
      expiresAt: userRole.expiresAt,
      isActive: userRole.isActive,
      metadata: userRole.metadata,
      isValid: userRole.isValid,
      isExpired: userRole.isExpired,
    };
  }
}
