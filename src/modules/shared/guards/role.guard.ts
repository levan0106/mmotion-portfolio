import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoleService } from '../services/user-role.service';

/**
 * Role guard that checks if user has required roles
 */
@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(
    private reflector: Reflector,
    private userRoleService: UserRoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    try {
      // Get user roles
      const userRoles = await this.userRoleService.getUserRoles(user.userId);
      const userRoleNames = userRoles
        .filter(userRole => userRole.isValid)
        .map(userRole => userRole.roleName);

      // Check if user has any of the required roles
      const hasRequiredRole = requiredRoles.some(role => userRoleNames.includes(role));

      if (!hasRequiredRole) {
        this.logger.warn(`User ${user.userId} lacks required roles: ${requiredRoles.join(', ')}`);
        throw new ForbiddenException(`Insufficient role. Required: ${requiredRoles.join(', ')}`);
      }

      this.logger.log(`User ${user.userId} has required role: ${requiredRoles.join(', ')}`);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error(`Error checking roles for user ${user.userId}:`, error);
      throw new ForbiddenException('Role check failed');
    }
  }
}
