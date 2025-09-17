import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from './logging.service';

export interface LogAccessContext {
  userId?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface LogAccessAttempt {
  context: LogAccessContext;
  resource: string;
  action: string;
  success: boolean;
  timestamp: Date;
  error?: string;
}

export interface LogAccessPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  export: boolean;
  admin: boolean;
}

export interface RateLimitInfo {
  count: number;
  resetTime: number;
  limit: number;
}

@Injectable()
export class LogAccessControlService {
  private readonly logger = new Logger(LogAccessControlService.name);
  private readonly rateLimitCache = new Map<string, RateLimitInfo>();
  private readonly accessAttempts = new Map<string, LogAccessAttempt[]>();

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Check if IP address is allowed to access logs
   */
  isIpAllowed(ipAddress?: string): boolean {
    if (!ipAddress || ipAddress === 'unknown') {
      return false;
    }

    const whitelist = this.getIpWhitelist();
    
    // If no whitelist is configured, allow all IPs
    if (whitelist.length === 0) {
      return true;
    }

    // Check if IP is in whitelist
    return whitelist.some(allowedIp => this.isIpInRange(ipAddress, allowedIp));
  }

  /**
   * Check if rate limit is allowed for the given context
   */
  isRateLimitAllowed(context: LogAccessContext): boolean {
    const rateLimit = this.getRateLimit();
    const key = this.getRateLimitKey(context);
    const now = Date.now();

    // Get current rate limit info
    let rateLimitInfo = this.rateLimitCache.get(key);
    
    if (!rateLimitInfo || now > rateLimitInfo.resetTime) {
      // Reset rate limit
      rateLimitInfo = {
        count: 0,
        resetTime: now + rateLimit.windowMs,
        limit: rateLimit.maxRequests,
      };
      this.rateLimitCache.set(key, rateLimitInfo);
    }

    // Check if limit exceeded
    if (rateLimitInfo.count >= rateLimitInfo.limit) {
      this.logger.warn(`Rate limit exceeded for ${key}`, {
        ipAddress: context.ipAddress,
        userId: context.userId,
        count: rateLimitInfo.count,
        limit: rateLimitInfo.limit,
      });
      return false;
    }

    // Increment counter
    rateLimitInfo.count++;
    this.rateLimitCache.set(key, rateLimitInfo);

    return true;
  }

  /**
   * Check if user has the required role
   */
  hasRole(requiredRole: string, userRole?: string): boolean {
    if (!userRole) {
      return false;
    }

    // Define role hierarchy
    const roleHierarchy = {
      admin: ['admin', 'developer', 'viewer', 'auditor'],
      developer: ['developer', 'viewer'],
      viewer: ['viewer'],
      auditor: ['auditor', 'viewer'],
    };

    const allowedRoles = roleHierarchy[requiredRole] || [requiredRole];
    return allowedRoles.includes(userRole);
  }

  /**
   * Get user permissions based on role and context
   */
  async getUserPermissions(context: LogAccessContext): Promise<LogAccessPermissions> {
    const role = context.role || 'viewer';
    
    // Define role-based permissions
    const rolePermissions: Record<string, LogAccessPermissions> = {
      admin: {
        read: true,
        write: true,
        delete: true,
        export: true,
        admin: true,
      },
      developer: {
        read: true,
        write: true,
        delete: false,
        export: true,
        admin: false,
      },
      viewer: {
        read: true,
        write: false,
        delete: false,
        export: false,
        admin: false,
      },
      auditor: {
        read: true,
        write: false,
        delete: false,
        export: true,
        admin: false,
      },
    };

    const permissions = rolePermissions[role] || rolePermissions.viewer;

    // Apply additional restrictions based on context
    if (this.isSensitiveLogAccess(context)) {
      // Restrict sensitive log access
      permissions.write = false;
      permissions.delete = false;
    }

    return permissions;
  }

  /**
   * Log access attempt for audit purposes
   */
  async logAccessAttempt(attempt: LogAccessAttempt): Promise<void> {
    try {
      // Store access attempt
      const key = this.getAccessAttemptKey(attempt.context);
      const attempts = this.accessAttempts.get(key) || [];
      attempts.push(attempt);
      
      // Keep only last 100 attempts per user/IP
      if (attempts.length > 100) {
        attempts.splice(0, attempts.length - 100);
      }
      this.accessAttempts.set(key, attempts);

      // Log to application logs
      await this.loggingService.info(
        `Log access attempt: ${attempt.action} on ${attempt.resource}`,
        {
          userId: attempt.context.userId,
          role: attempt.context.role,
          ipAddress: attempt.context.ipAddress,
          resource: attempt.resource,
          action: attempt.action,
          success: attempt.success,
          error: attempt.error,
        },
        {
          serviceName: 'LogAccessControl',
          moduleName: 'LoggingModule'
        }
      );

      // Log security event for failed attempts
      if (!attempt.success) {
        await this.loggingService.logBusinessEvent(
          'LOG_ACCESS_DENIED',
          'LogAccess',
          attempt.context.userId || 'anonymous',
          'READ',
          {
            userId: attempt.context.userId,
            metadata: {
              resource: attempt.resource,
              action: attempt.action,
              ipAddress: attempt.context.ipAddress,
              userAgent: attempt.context.userAgent,
              error: attempt.error,
            },
          }
        );
      }
    } catch (error) {
      this.logger.error('Failed to log access attempt', error);
    }
  }

  /**
   * Get access statistics for monitoring
   */
  getAccessStatistics(context: LogAccessContext): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    lastAttempt?: Date;
    rateLimitInfo?: RateLimitInfo;
  } {
    const key = this.getAccessAttemptKey(context);
    const attempts = this.accessAttempts.get(key) || [];
    const rateLimitInfo = this.rateLimitCache.get(this.getRateLimitKey(context));

    const successfulAttempts = attempts.filter(a => a.success).length;
    const failedAttempts = attempts.filter(a => !a.success).length;
    const lastAttempt = attempts.length > 0 ? attempts[attempts.length - 1].timestamp : undefined;

    return {
      totalAttempts: attempts.length,
      successfulAttempts,
      failedAttempts,
      lastAttempt,
      rateLimitInfo,
    };
  }

  /**
   * Check if access is for sensitive logs
   */
  private isSensitiveLogAccess(context: LogAccessContext): boolean {
    // Define sensitive log patterns
    const sensitivePatterns = [
      'password',
      'token',
      'secret',
      'key',
      'private',
      'auth',
      'security',
    ];

    // Check if any sensitive pattern is in the context
    const contextString = JSON.stringify(context).toLowerCase();
    return sensitivePatterns.some(pattern => contextString.includes(pattern));
  }

  /**
   * Get IP whitelist from configuration
   */
  private getIpWhitelist(): string[] {
    const whitelist = this.configService.get<string>('LOG_ACCESS_CONTROL_IP_WHITELIST', '');
    return whitelist ? whitelist.split(',').map(ip => ip.trim()) : [];
  }

  /**
   * Get rate limit configuration
   */
  private getRateLimit(): { maxRequests: number; windowMs: number } {
    return {
      maxRequests: this.configService.get<number>('LOG_ACCESS_CONTROL_RATE_LIMIT', 100),
      windowMs: this.configService.get<number>('LOG_ACCESS_CONTROL_RATE_WINDOW', 60000),
    };
  }

  /**
   * Generate rate limit key
   */
  private getRateLimitKey(context: LogAccessContext): string {
    return `rateLimit:${context.userId || context.ipAddress || 'anonymous'}`;
  }

  /**
   * Generate access attempt key
   */
  private getAccessAttemptKey(context: LogAccessContext): string {
    return `accessAttempts:${context.userId || context.ipAddress || 'anonymous'}`;
  }

  /**
   * Check if IP is in the given range
   */
  private isIpInRange(ip: string, range: string): boolean {
    if (range.includes('/')) {
      // CIDR notation
      return this.isIpInCidr(ip, range);
    } else {
      // Exact match
      return ip === range;
    }
  }

  /**
   * Check if IP is in CIDR range
   */
  private isIpInCidr(ip: string, cidr: string): boolean {
    try {
      const [network, prefixLength] = cidr.split('/');
      const ipNum = this.ipToNumber(ip);
      const networkNum = this.ipToNumber(network);
      const mask = (0xffffffff << (32 - parseInt(prefixLength))) >>> 0;
      
      return (ipNum & mask) === (networkNum & mask);
    } catch (error) {
      this.logger.warn(`Invalid CIDR range: ${cidr}`, error);
      return false;
    }
  }

  /**
   * Convert IP address to number
   */
  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  /**
   * Clean up old rate limit entries
   */
  cleanupRateLimitCache(): void {
    const now = Date.now();
    const entries = Array.from(this.rateLimitCache.entries());
    for (const [key, info] of entries) {
      if (now > info.resetTime) {
        this.rateLimitCache.delete(key);
      }
    }
  }

  /**
   * Clean up old access attempts
   */
  cleanupAccessAttempts(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const entries = Array.from(this.accessAttempts.entries());
    
    for (const [key, attempts] of entries) {
      const filteredAttempts = attempts.filter(attempt => attempt.timestamp > cutoffTime);
      if (filteredAttempts.length === 0) {
        this.accessAttempts.delete(key);
      } else {
        this.accessAttempts.set(key, filteredAttempts);
      }
    }
  }
}
