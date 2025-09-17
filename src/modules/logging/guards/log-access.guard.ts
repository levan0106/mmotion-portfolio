import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { LogAccessControlService } from './../services/log-access-control.service';

export interface LogAccessContext {
  userId?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface LogAccessPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  export: boolean;
  admin: boolean;
}

@Injectable()
export class LogAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly logAccessControlService: LogAccessControlService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const className = context.getClass().name;

    // Get access control metadata
    const requiredPermissions = this.reflector.get<string[]>(
      'logPermissions',
      handler,
    );
    const requiredRole = this.reflector.get<string>('logRole', handler);
    const isPublic = this.reflector.get<boolean>('logPublic', handler);

    // Skip access control for public endpoints
    if (isPublic) {
      return true;
    }

    // Extract context information
    const accessContext: LogAccessContext = {
      userId: this.extractUserId(request),
      role: this.extractUserRole(request),
      ipAddress: this.extractIpAddress(request),
      userAgent: request.headers['user-agent'],
      requestId: request.headers['x-correlation-id'] as string,
    };

    // Validate IP whitelist
    if (!this.logAccessControlService.isIpAllowed(accessContext.ipAddress)) {
      throw new ForbiddenException('IP address not allowed to access logs');
    }

    // Check rate limiting
    if (!this.logAccessControlService.isRateLimitAllowed(accessContext)) {
      throw new ForbiddenException('Rate limit exceeded for log access');
    }

    // Check role-based access
    if (requiredRole && !this.logAccessControlService.hasRole(accessContext.role, requiredRole)) {
      throw new ForbiddenException(`Role '${accessContext.role}' does not have permission to access this resource`);
    }

    // Check specific permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = await this.logAccessControlService.getUserPermissions(accessContext);
      
      for (const permission of requiredPermissions) {
        if (!userPermissions[permission]) {
          throw new ForbiddenException(`Permission '${permission}' required to access this resource`);
        }
      }
    }

    // Log access attempt
    await this.logAccessControlService.logAccessAttempt({
      context: accessContext,
      resource: `${className}.${handler.name}`,
      action: 'access',
      success: true,
      timestamp: new Date(),
    });

    return true;
  }

  private extractUserId(request: Request): string | undefined {
    // Extract user ID from JWT token, session, or headers
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // In a real implementation, you would decode the JWT token
      // For now, we'll extract from a custom header
      return request.headers['x-user-id'] as string;
    }
    return request.headers['x-user-id'] as string;
  }

  private extractUserRole(request: Request): string | undefined {
    // Extract user role from JWT token, session, or headers
    return request.headers['x-user-role'] as string;
  }

  private extractIpAddress(request: Request): string {
    // Extract real IP address considering proxies
    const forwarded = request.headers['x-forwarded-for'];
    const realIp = request.headers['x-real-ip'];
    
    if (forwarded) {
      return forwarded.toString().split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp.toString();
    }
    
    return request.ip || request.connection.remoteAddress || 'unknown';
  }
}

// Decorators for access control
export const LogPermissions = (permissions: string[]) => 
  SetMetadata('logPermissions', permissions);

export const LogRole = (role: string) => 
  SetMetadata('logRole', role);

export const LogPublic = () => 
  SetMetadata('logPublic', true);

// Permission constants
export const LOG_PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  EXPORT: 'export',
  ADMIN: 'admin',
} as const;

// Role constants
export const LOG_ROLES = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  VIEWER: 'viewer',
  AUDITOR: 'auditor',
} as const;
