import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { CreatePermissionDto, UpdatePermissionDto, PermissionResponseDto, PermissionCategoryDto } from '../dto/permission.dto';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Create a new permission
   */
  async createPermission(createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    this.logger.log(`Creating permission: ${createPermissionDto.name}`);

    // Check if permission name already exists
    const existingPermission = await this.permissionRepository.findOne({
      where: { name: createPermissionDto.name }
    });

    if (existingPermission) {
      throw new BadRequestException(`Permission with name '${createPermissionDto.name}' already exists`);
    }

    // Create permission
    const permission = this.permissionRepository.create({
      name: createPermissionDto.name,
      displayName: createPermissionDto.displayName,
      description: createPermissionDto.description,
      category: createPermissionDto.category,
      isSystemPermission: createPermissionDto.isSystemPermission || false,
      priority: createPermissionDto.priority || 0,
    });

    const savedPermission = await this.permissionRepository.save(permission);

    this.logger.log(`Created permission: ${savedPermission.name} (${savedPermission.permissionId})`);
    return this.mapPermissionToResponseDto(savedPermission);
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<PermissionResponseDto[]> {
    this.logger.log('Fetching all permissions');
    
    const permissions = await this.permissionRepository.find({
      order: { category: 'ASC', priority: 'DESC', displayName: 'ASC' }
    });

    return permissions.map(permission => this.mapPermissionToResponseDto(permission));
  }

  /**
   * Get permissions by category
   */
  async getPermissionsByCategory(): Promise<PermissionCategoryDto[]> {
    this.logger.log('Fetching permissions grouped by category');
    
    const permissions = await this.permissionRepository.find({
      order: { category: 'ASC', priority: 'DESC', displayName: 'ASC' }
    });

    // Group permissions by category
    const categoryMap = new Map<string, PermissionResponseDto[]>();
    
    permissions.forEach(permission => {
      const permissionDto = this.mapPermissionToResponseDto(permission);
      const category = permission.category;
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(permissionDto);
    });

    // Convert to category DTOs
    const categories: PermissionCategoryDto[] = [];
    categoryMap.forEach((permissions, categoryName) => {
      categories.push({
        name: categoryName,
        displayName: this.getCategoryDisplayName(categoryName),
        permissionCount: permissions.length,
        permissions: permissions,
      });
    });

    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(permissionId: string): Promise<PermissionResponseDto> {
    this.logger.log(`Fetching permission: ${permissionId}`);

    const permission = await this.permissionRepository.findOne({
      where: { permissionId }
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID '${permissionId}' not found`);
    }

    return this.mapPermissionToResponseDto(permission);
  }

  /**
   * Update permission
   */
  async updatePermission(permissionId: string, updatePermissionDto: UpdatePermissionDto): Promise<PermissionResponseDto> {
    this.logger.log(`Updating permission: ${permissionId}`);

    const permission = await this.permissionRepository.findOne({
      where: { permissionId }
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID '${permissionId}' not found`);
    }

    // Check if trying to update system permission
    if (permission.isSystemPermission && (updatePermissionDto.displayName || updatePermissionDto.description)) {
      this.logger.warn(`Attempted to update system permission: ${permission.name}`);
      throw new BadRequestException('Cannot update system permission properties');
    }

    // Update permission properties
    Object.assign(permission, updatePermissionDto);
    const updatedPermission = await this.permissionRepository.save(permission);

    this.logger.log(`Updated permission: ${updatedPermission.name}`);
    return this.mapPermissionToResponseDto(updatedPermission);
  }

  /**
   * Delete permission
   */
  async deletePermission(permissionId: string): Promise<void> {
    this.logger.log(`Deleting permission: ${permissionId}`);

    const permission = await this.permissionRepository.findOne({
      where: { permissionId }
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID '${permissionId}' not found`);
    }

    // Check if system permission
    if (permission.isSystemPermission) {
      throw new BadRequestException('Cannot delete system permission');
    }

    // Check if permission is assigned to any roles
    const roleCount = await this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoin('permission.roles', 'role')
      .where('permission.permissionId = :permissionId', { permissionId })
      .getCount();

    if (roleCount > 0) {
      throw new BadRequestException(`Cannot delete permission. It is assigned to ${roleCount} role(s)`);
    }

    await this.permissionRepository.remove(permission);
    this.logger.log(`Deleted permission: ${permission.name}`);
  }

  /**
   * Get permission categories
   */
  async getPermissionCategories(): Promise<string[]> {
    this.logger.log('Fetching permission categories');
    
    const categories = await this.permissionRepository
      .createQueryBuilder('permission')
      .select('DISTINCT permission.category', 'category')
      .orderBy('permission.category', 'ASC')
      .getRawMany();

    return categories.map(cat => cat.category);
  }

  /**
   * Search permissions
   */
  async searchPermissions(query: string): Promise<PermissionResponseDto[]> {
    this.logger.log(`Searching permissions with query: ${query}`);
    
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.name ILIKE :query', { query: `%${query}%` })
      .orWhere('permission.displayName ILIKE :query', { query: `%${query}%` })
      .orWhere('permission.description ILIKE :query', { query: `%${query}%` })
      .orderBy('permission.category', 'ASC')
      .addOrderBy('permission.priority', 'DESC')
      .addOrderBy('permission.displayName', 'ASC')
      .getMany();

    return permissions.map(permission => this.mapPermissionToResponseDto(permission));
  }

  /**
   * Get category display name
   */
  private getCategoryDisplayName(category: string): string {
    const categoryMap: Record<string, string> = {
      'user_management': 'User Management',
      'portfolio_management': 'Portfolio Management',
      'trading_operations': 'Trading Operations',
      'asset_management': 'Asset Management',
      'financial_data': 'Financial Data',
      'system_administration': 'System Administration',
      'reporting': 'Reporting',
      'audit': 'Audit & Compliance',
    };

    return categoryMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Map permission entity to response DTO
   */
  private mapPermissionToResponseDto(permission: Permission): PermissionResponseDto {
    return {
      permissionId: permission.permissionId,
      name: permission.name,
      displayName: permission.displayName,
      description: permission.description,
      category: permission.category,
      isSystemPermission: permission.isSystemPermission,
      priority: permission.priority,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }
}
