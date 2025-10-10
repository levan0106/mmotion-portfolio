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
import { UserRoleService } from '../services/user-role.service';
import { PermissionGuard } from '../guards/permission.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { CurrentUser } from '../decorators/user.decorator';
import {
  AssignRoleToUserDto,
  UpdateUserRoleDto,
  UserRoleResponseDto,
  UserPermissionsResponseDto,
} from '../dto/user-role.dto';

@ApiTags('User Role Management')
@ApiBearerAuth()
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserRoleController {
  private readonly logger = new Logger(UserRoleController.name);

  constructor(private readonly userRoleService: UserRoleService) {}

  @Post(':id/roles')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(['users.manage_roles'])
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiResponse({ status: 201, description: 'Role assigned successfully', type: UserRoleResponseDto })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  @ApiResponse({ status: 400, description: 'Bad request - user already has role' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async assignRoleToUser(
    @Param('id') userId: string,
    @Body() assignRoleDto: AssignRoleToUserDto,
  ): Promise<UserRoleResponseDto> {
    this.logger.log(`Assigning role ${assignRoleDto.roleId} to user ${userId}`);
    return this.userRoleService.assignRoleToUser(userId, assignRoleDto);
  }

  @Get(':id/roles')
  @RequirePermissions(['users.read', 'roles.read'])
  @ApiOperation({ summary: 'Get user roles' })
  @ApiResponse({ status: 200, description: 'User roles retrieved successfully', type: [UserRoleResponseDto] })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getUserRoles(@Param('id') userId: string): Promise<UserRoleResponseDto[]> {
    this.logger.log(`Fetching roles for user: ${userId}`);
    return this.userRoleService.getUserRoles(userId);
  }

  @Get(':id/permissions')
  @RequirePermissions(['users.read', 'permissions.read'])
  @ApiOperation({ summary: 'Get user permissions' })
  @ApiResponse({ status: 200, description: 'User permissions retrieved successfully', type: UserPermissionsResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getUserPermissions(@Param('id') userId: string): Promise<UserPermissionsResponseDto> {
    this.logger.log(`Fetching permissions for user: ${userId}`);
    return this.userRoleService.getUserPermissions(userId);
  }

  @Put('roles/:userRoleId')
  @RequirePermissions(['users.manage_roles'])
  @ApiOperation({ summary: 'Update user role assignment' })
  @ApiResponse({ status: 200, description: 'User role updated successfully', type: UserRoleResponseDto })
  @ApiResponse({ status: 404, description: 'User role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async updateUserRole(
    @Param('userRoleId') userRoleId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<UserRoleResponseDto> {
    this.logger.log(`Updating user role: ${userRoleId}`);
    return this.userRoleService.updateUserRole(userRoleId, updateUserRoleDto);
  }

  @Delete(':userId/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(['users.manage_roles'])
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiResponse({ status: 204, description: 'Role removed successfully' })
  @ApiResponse({ status: 404, description: 'User role assignment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ): Promise<void> {
    this.logger.log(`Removing role ${roleId} from user ${userId}`);
    return this.userRoleService.removeRoleFromUser(userId, roleId);
  }

  @Delete('roles/:userRoleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(['users.manage_roles'])
  @ApiOperation({ summary: 'Remove user role assignment by userRoleId' })
  @ApiResponse({ status: 204, description: 'User role assignment removed successfully' })
  @ApiResponse({ status: 404, description: 'User role assignment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async removeUserRoleById(@Param('userRoleId') userRoleId: string): Promise<void> {
    this.logger.log(`Removing user role assignment: ${userRoleId}`);
    return this.userRoleService.removeUserRoleById(userRoleId);
  }

  @Put('roles/:userRoleId/deactivate')
  @RequirePermissions(['users.manage_roles'])
  @ApiOperation({ summary: 'Deactivate user role assignment' })
  @ApiResponse({ status: 200, description: 'User role deactivated successfully', type: UserRoleResponseDto })
  @ApiResponse({ status: 404, description: 'User role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async deactivateUserRole(@Param('userRoleId') userRoleId: string): Promise<UserRoleResponseDto> {
    this.logger.log(`Deactivating user role: ${userRoleId}`);
    return this.userRoleService.deactivateUserRole(userRoleId);
  }

  @Get('roles/:roleId/users')
  @RequirePermissions(['roles.read', 'users.read'])
  @ApiOperation({ summary: 'Get users with specific role' })
  @ApiResponse({ status: 200, description: 'Users with role retrieved successfully', type: [UserRoleResponseDto] })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getUsersWithRole(@Param('roleId') roleId: string): Promise<UserRoleResponseDto[]> {
    this.logger.log(`Fetching users with role: ${roleId}`);
    return this.userRoleService.getUsersWithRole(roleId);
  }

  @Get(':id/permissions/check')
  @RequirePermissions(['users.read', 'permissions.read'])
  @ApiOperation({ summary: 'Check if user has specific permission' })
  @ApiResponse({ status: 200, description: 'Permission check result' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async checkUserPermission(
    @Param('id') userId: string,
    @Body() body: { permission: string },
  ): Promise<{ hasPermission: boolean }> {
    this.logger.log(`Checking permission ${body.permission} for user ${userId}`);
    const hasPermission = await this.userRoleService.userHasPermission(userId, body.permission);
    return { hasPermission };
  }

  @Get(':id/permissions/check-any')
  @RequirePermissions(['users.read', 'permissions.read'])
  @ApiOperation({ summary: 'Check if user has any of the specified permissions' })
  @ApiResponse({ status: 200, description: 'Permission check result' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async checkUserAnyPermission(
    @Param('id') userId: string,
    @Body() body: { permissions: string[] },
  ): Promise<{ hasAnyPermission: boolean }> {
    this.logger.log(`Checking any permissions for user ${userId}`);
    const hasAnyPermission = await this.userRoleService.userHasAnyPermission(userId, body.permissions);
    return { hasAnyPermission };
  }

  @Get(':id/permissions/check-all')
  @RequirePermissions(['users.read', 'permissions.read'])
  @ApiOperation({ summary: 'Check if user has all of the specified permissions' })
  @ApiResponse({ status: 200, description: 'Permission check result' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async checkUserAllPermissions(
    @Param('id') userId: string,
    @Body() body: { permissions: string[] },
  ): Promise<{ hasAllPermissions: boolean }> {
    this.logger.log(`Checking all permissions for user ${userId}`);
    const hasAllPermissions = await this.userRoleService.userHasAllPermissions(userId, body.permissions);
    return { hasAllPermissions };
  }

  @Get('roles/expired')
  @RequirePermissions(['users.read', 'roles.read'])
  @ApiOperation({ summary: 'Get expired user roles' })
  @ApiResponse({ status: 200, description: 'Expired user roles retrieved successfully', type: [UserRoleResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getExpiredUserRoles(): Promise<UserRoleResponseDto[]> {
    this.logger.log('Fetching expired user roles');
    return this.userRoleService.getExpiredUserRoles();
  }

  @Post('roles/cleanup')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(['users.manage_roles'])
  @ApiOperation({ summary: 'Clean up expired user roles' })
  @ApiResponse({ status: 200, description: 'Expired user roles cleaned up successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async cleanupExpiredUserRoles(): Promise<{ cleanedCount: number }> {
    this.logger.log('Cleaning up expired user roles');
    const cleanedCount = await this.userRoleService.cleanupExpiredUserRoles();
    return { cleanedCount };
  }

  @Get('current/roles')
  @ApiOperation({ summary: 'Get current user roles and permissions' })
  @ApiResponse({ status: 200, description: 'Current user roles and permissions retrieved successfully', type: UserPermissionsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUserRoles(@CurrentUser() user: any): Promise<UserPermissionsResponseDto> {
    this.logger.log('Fetching current user roles and permissions');
    return this.userRoleService.getCurrentUserRoles(user.userId);
  }
}
