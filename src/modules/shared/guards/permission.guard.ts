import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoleService } from '../services/user-role.service';

/**
 * Permission guard that checks if user has required permissions
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private reflector: Reflector,
    private userRoleService: UserRoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    try {
      // Check if user has all required permissions
      const hasAllPermissions = await this.userRoleService.userHasAllPermissions(
        user.userId,
        requiredPermissions
      );

      if (!hasAllPermissions) {
        this.logger.warn(`User ${user.userId} lacks required permissions: ${requiredPermissions.join(', ')}`);
        throw new ForbiddenException(`Insufficient permissions. Required: ${requiredPermissions.join(', ')}`);
      }

      this.logger.log(`User ${user.userId} has required permissions: ${requiredPermissions.join(', ')}`);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error(`Error checking permissions for user ${user.userId}:`, error);
      throw new ForbiddenException('Permission check failed');
    }
  }
}
