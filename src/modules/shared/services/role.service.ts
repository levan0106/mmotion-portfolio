import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { UserRole } from '../entities/user-role.entity';
import { User } from '../entities/user.entity';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsToRoleDto, RoleResponseDto } from '../dto/role.dto';
import { PermissionResponseDto } from '../dto/permission.dto';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a new role
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    this.logger.log(`Creating role: ${createRoleDto.name}`);

    // Check if role name already exists
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name }
    });

    if (existingRole) {
      throw new BadRequestException(`Role with name '${createRoleDto.name}' already exists`);
    }

    // Create role
    const role = this.roleRepository.create({
      name: createRoleDto.name,
      displayName: createRoleDto.displayName,
      description: createRoleDto.description,
      isSystemRole: createRoleDto.isSystemRole || false,
      priority: createRoleDto.priority || 0,
    });

    const savedRole = await this.roleRepository.save(role);

    // Assign permissions if provided
    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      await this.assignPermissionsToRole(savedRole.roleId, createRoleDto.permissionIds);
    }

    this.logger.log(`Created role: ${savedRole.name} (${savedRole.roleId})`);
    return this.mapRoleToResponseDto(savedRole);
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<RoleResponseDto[]> {
    this.logger.log('Fetching all roles');
    
    const roles = await this.roleRepository.find({
      relations: ['permissions'],
      order: { priority: 'DESC', displayName: 'ASC' }
    });

    return roles.map(role => this.mapRoleToResponseDto(role));
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: string): Promise<RoleResponseDto> {
    this.logger.log(`Fetching role: ${roleId}`);

    const role = await this.roleRepository.findOne({
      where: { roleId },
      relations: ['permissions']
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    return this.mapRoleToResponseDto(role);
  }

  /**
   * Update role
   */
  async updateRole(roleId: string, updateRoleDto: UpdateRoleDto): Promise<RoleResponseDto> {
    this.logger.log(`Updating role: ${roleId}`);

    const role = await this.roleRepository.findOne({
      where: { roleId },
      relations: ['permissions']
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Check if trying to update system role
    if (role.isSystemRole && (updateRoleDto.displayName || updateRoleDto.description)) {
      this.logger.warn(`Attempted to update system role: ${role.name}`);
      throw new BadRequestException('Cannot update system role properties');
    }

    // Update role properties
    Object.assign(role, updateRoleDto);
    const updatedRole = await this.roleRepository.save(role);

    this.logger.log(`Updated role: ${updatedRole.name}`);
    return this.mapRoleToResponseDto(updatedRole);
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string): Promise<void> {
    this.logger.log(`Deleting role: ${roleId}`);

    const role = await this.roleRepository.findOne({
      where: { roleId }
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Check if system role
    if (role.isSystemRole) {
      throw new BadRequestException('Cannot delete system role');
    }

    // Check if role is assigned to any users
    const userRoles = await this.userRoleRepository.find({
      where: { roleId, isActive: true }
    });

    if (userRoles.length > 0) {
      throw new BadRequestException(`Cannot delete role. It is assigned to ${userRoles.length} user(s)`);
    }

    await this.roleRepository.remove(role);
    this.logger.log(`Deleted role: ${role.name}`);
  }

  /**
   * Assign permissions to role
   */
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    this.logger.log(`Assigning permissions to role: ${roleId}`);

    const role = await this.roleRepository.findOne({
      where: { roleId },
      relations: ['permissions']
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Validate permissions exist
    const permissions = await this.permissionRepository.find({
      where: { permissionId: In(permissionIds) }
    });

    if (permissions.length !== permissionIds.length) {
      const foundIds = permissions.map(p => p.permissionId);
      const missingIds = permissionIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(`Permissions not found: ${missingIds.join(', ')}`);
    }

    // Assign permissions
    role.permissions = permissions;
    await this.roleRepository.save(role);

    this.logger.log(`Assigned ${permissions.length} permissions to role: ${role.name}`);
  }

  /**
   * Remove permissions from role
   */
  async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<void> {
    this.logger.log(`Removing permissions from role: ${roleId}`);

    const role = await this.roleRepository.findOne({
      where: { roleId },
      relations: ['permissions']
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Remove permissions
    role.permissions = role.permissions.filter(
      permission => !permissionIds.includes(permission.permissionId)
    );

    await this.roleRepository.save(role);
    this.logger.log(`Removed permissions from role: ${role.name}`);
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: string): Promise<PermissionResponseDto[]> {
    this.logger.log(`Fetching permissions for role: ${roleId}`);

    const role = await this.roleRepository.findOne({
      where: { roleId },
      relations: ['permissions']
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    return role.permissions.map(permission => ({
      permissionId: permission.permissionId,
      name: permission.name,
      displayName: permission.displayName,
      description: permission.description,
      category: permission.category,
      isSystemPermission: permission.isSystemPermission,
      priority: permission.priority,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    }));
  }

  /**
   * Get users with specific role
   */
  async getUsersWithRole(roleId: string): Promise<any[]> {
    this.logger.log(`Fetching users with role: ${roleId}`);

    const userRoles = await this.userRoleRepository.find({
      where: { roleId, isActive: true },
      relations: ['user', 'role']
    });

    return userRoles.map(userRole => ({
      userRoleId: userRole.userRoleId,
      userId: userRole.userId,
      username: userRole.user.username,
      fullName: userRole.user.fullName,
      email: userRole.user.email,
      displayName: userRole.user.fullName || userRole.user.username,
      firstName: userRole.user.fullName?.split(' ')[0] || '',
      lastName: userRole.user.fullName?.split(' ').slice(1).join(' ') || '',
      lastLoginAt: userRole.user.lastLogin?.toISOString(),
      assignedAt: userRole.assignedAt,
      expiresAt: userRole.expiresAt,
      isActive: userRole.isActive,
      isValid: userRole.isValid,
      isExpired: userRole.isExpired,
    }));
  }

  /**
   * Map role entity to response DTO
   */
  private mapRoleToResponseDto(role: Role): RoleResponseDto {
    return {
      roleId: role.roleId,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystemRole: role.isSystemRole,
      priority: role.priority,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions?.map(permission => ({
        permissionId: permission.permissionId,
        name: permission.name,
        displayName: permission.displayName,
        description: permission.description,
        category: permission.category,
        isSystemPermission: permission.isSystemPermission,
        priority: permission.priority,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      })) || [],
    };
  }

  /**
   * Get role statistics
   */
  async getRoleStats(roleId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    expiredUsers: number;
    inactiveUsers: number;
  }> {
    this.logger.log(`Fetching statistics for role: ${roleId}`);

    // Check if role exists
    const role = await this.roleRepository.findOne({
      where: { roleId }
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Get user role statistics
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
    ] = await Promise.all([
      this.userRoleRepository.count({
        where: { roleId }
      }),
      this.userRoleRepository.count({
        where: { 
          roleId,
          isActive: true
        }
      }),
      this.userRoleRepository.count({
        where: { 
          roleId,
          isActive: false
        }
      }),
    ]);

    // Get expired users by checking expiresAt field
    const now = new Date();
    const expiredUsers = await this.userRoleRepository
      .createQueryBuilder('ur')
      .where('ur.roleId = :roleId', { roleId })
      .andWhere('ur.expiresAt < :now', { now })
      .getCount();

    return {
      totalUsers,
      activeUsers,
      expiredUsers,
      inactiveUsers,
    };
  }

  /**
   * Bulk assign users to role
   */
  async bulkAssignUsersToRole(roleId: string, userIds: string[], expiresAt?: string): Promise<any[]> {
    this.logger.log(`Bulk assigning users to role: ${roleId}`);

    // Check if role exists
    const role = await this.roleRepository.findOne({
      where: { roleId }
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Check if users exist
    const users = await this.userRepository.findByIds(userIds);
    if (users.length !== userIds.length) {
      throw new BadRequestException('Some users not found');
    }

    // Create user role assignments
    const userRoles = userIds.map(userId => {
      const userRole = this.userRoleRepository.create({
        userId,
        roleId,
        isActive: true,
        assignedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      return userRole;
    });

    // Save all assignments
    const savedUserRoles = await this.userRoleRepository.save(userRoles);

    // Return with user details
    return savedUserRoles.map(userRole => ({
      userRoleId: userRole.userRoleId,
      userId: userRole.userId,
      roleId: userRole.roleId,
      assignedAt: userRole.assignedAt,
      expiresAt: userRole.expiresAt,
      isActive: userRole.isActive,
      isValid: userRole.isValid,
      isExpired: userRole.isExpired,
    }));
  }

  /**
   * Get permissions grouped by category
   */
  async getPermissionsByCategory(): Promise<any[]> {
    this.logger.log('Fetching permissions by category');
    
    // Get all permissions
    const permissions = await this.permissionRepository.find({
      order: { category: 'ASC', name: 'ASC' }
    });

    // Group permissions by category
    const categoriesMap = new Map();
    
    permissions.forEach(permission => {
      const category = permission.category;
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, {
          name: category,
          displayName: this.getCategoryDisplayName(category),
          permissions: []
        });
      }
      
      categoriesMap.get(category).permissions.push({
        permissionId: permission.permissionId,
        resource: permission.category,
        action: permission.name.split('.')[1] || 'read',
        name: permission.name,
        displayName: permission.displayName,
        description: permission.description
      });
    });

    return Array.from(categoriesMap.values());
  }

  /**
   * Get display name for category
   */
  private getCategoryDisplayName(resource: string): string {
    const categoryNames: { [key: string]: string } = {
      'snapshots': 'Snapshot Management',
      'global_assets': 'Global Assets',
      'roles': 'Role Management',
      'users': 'User Management',
      'settings': 'System Settings',
      'portfolios': 'Portfolio Management',
      'transactions': 'Transaction Management'
    };
    
    return categoryNames[resource] || resource.charAt(0).toUpperCase() + resource.slice(1);
  }
}
