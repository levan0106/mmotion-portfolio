import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from '../services/role.service';
import { PermissionGuard } from '../guards/permission.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { Public } from '../decorators/public.decorator';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsToRoleDto,
  RoleResponseDto,
} from '../dto/role.dto';
import { PermissionResponseDto } from '../dto/permission.dto';

@ApiTags('Role Management')
@ApiBearerAuth()
@Controller('api/v1/roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RoleController {
  private readonly logger = new Logger(RoleController.name);

  constructor(private readonly roleService: RoleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(['roles.create'])
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully', type: RoleResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - role name already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createRole(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    this.logger.log(`Creating role: ${createRoleDto.name}`);
    return this.roleService.createRole(createRoleDto);
  }

  @Get()
  @RequirePermissions(['roles.read'])
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully', type: [RoleResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getAllRoles(): Promise<RoleResponseDto[]> {
    this.logger.log('Fetching all roles');
    return this.roleService.getAllRoles();
  }

  @Get(':id/stats')
  @RequirePermissions(['roles.read'])
  @ApiOperation({ summary: 'Get role statistics' })
  @ApiResponse({ status: 200, description: 'Role statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getRoleStats(@Param('id') roleId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    expiredUsers: number;
    inactiveUsers: number;
  }> {
    this.logger.log(`Fetching statistics for role: ${roleId}`);
    return this.roleService.getRoleStats(roleId);
  }

  @Post(':id/users/bulk')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(['roles.manage_users'])
  @ApiOperation({ summary: 'Bulk assign users to role' })
  @ApiResponse({ status: 201, description: 'Users assigned successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid user IDs' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async bulkAssignUsersToRole(
    @Param('id') roleId: string,
    @Body() body: { userIds: string[]; expiresAt?: string },
  ): Promise<any[]> {
    this.logger.log(`Bulk assigning users to role: ${roleId}`);
    return this.roleService.bulkAssignUsersToRole(roleId, body.userIds, body.expiresAt);
  }

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async testEndpoint(): Promise<{ message: string }> {
    this.logger.log('Test endpoint called');
    return { message: 'Test successful' };
  }

  @Get(':id')
  @RequirePermissions(['roles.read'])
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getRoleById(@Param('id') roleId: string): Promise<RoleResponseDto> {
    this.logger.log(`Fetching role: ${roleId}`);
    return this.roleService.getRoleById(roleId);
  }

  @Put(':id')
  @RequirePermissions(['roles.update'])
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot update system role' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async updateRole(
    @Param('id') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    this.logger.log(`Updating role: ${roleId}`);
    return this.roleService.updateRole(roleId, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(['roles.delete'])
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot delete system role or role in use' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async deleteRole(@Param('id') roleId: string): Promise<void> {
    this.logger.log(`Deleting role: ${roleId}`);
    return this.roleService.deleteRole(roleId);
  }

  @Post(':id/permissions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(['roles.manage_permissions'])
  @ApiOperation({ summary: 'Assign permissions to role' })
  @ApiResponse({ status: 204, description: 'Permissions assigned successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid permission IDs' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async assignPermissionsToRole(
    @Param('id') roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsToRoleDto,
  ): Promise<void> {
    this.logger.log(`Assigning permissions to role: ${roleId}`);
    return this.roleService.assignPermissionsToRole(roleId, assignPermissionsDto.permissionIds);
  }

  @Delete(':id/permissions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(['roles.manage_permissions'])
  @ApiOperation({ summary: 'Remove permissions from role' })
  @ApiResponse({ status: 204, description: 'Permissions removed successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async removePermissionsFromRole(
    @Param('id') roleId: string,
    @Body() removePermissionsDto: AssignPermissionsToRoleDto,
  ): Promise<void> {
    this.logger.log(`Removing permissions from role: ${roleId}`);
    return this.roleService.removePermissionsFromRole(roleId, removePermissionsDto.permissionIds);
  }

  @Get(':id/permissions')
  @RequirePermissions(['roles.read'])
  @ApiOperation({ summary: 'Get role permissions' })
  @ApiResponse({ status: 200, description: 'Role permissions retrieved successfully', type: [PermissionResponseDto] })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getRolePermissions(@Param('id') roleId: string): Promise<PermissionResponseDto[]> {
    this.logger.log(`Fetching permissions for role: ${roleId}`);
    return this.roleService.getRolePermissions(roleId);
  }

  @Get(':id/users')
  @RequirePermissions(['roles.read', 'users.read'])
  @ApiOperation({ summary: 'Get users with specific role' })
  @ApiResponse({ status: 200, description: 'Users with role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getUsersWithRole(@Param('id') roleId: string): Promise<any[]> {
    this.logger.log(`Fetching users with role: ${roleId}`);
    return this.roleService.getUsersWithRole(roleId);
  }

  @Get('permissions/categories')
  @ApiOperation({ summary: 'Get permissions grouped by category' })
  @ApiResponse({ status: 200, description: 'Permissions by category retrieved successfully' })
  async getPermissionsByCategory(): Promise<any[]> {
    this.logger.log('Fetching permissions by category');
    return this.roleService.getPermissionsByCategory();
  }
}
