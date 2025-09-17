import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ContextManager } from '../services/context-manager.service';
import { randomUUID } from 'crypto';

/**
 * Middleware that sets up request context for the entire request lifecycle.
 * 
 * Features:
 * - Generates unique request IDs for each request
 * - Extracts user information from JWT tokens
 * - Sets up context for entire request lifecycle
 * - Adds request timing measurements
 * - Manages correlation IDs for distributed tracing
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestContextMiddleware.name);

  constructor(private readonly contextManager: ContextManager) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const requestId = this.generateRequestId(req);
    const correlationId = this.getCorrelationId(req);
    const userId = this.extractUserId(req);
    const userRole = this.extractUserRole(req);
    const sessionId = this.extractSessionId(req);
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Create request context
    const context = {
      requestId,
      correlationId,
      userId,
      userRole,
      sessionId,
      ipAddress,
      userAgent,
      startTime,
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      params: req.params,
    };

    // Set up context for the entire request lifecycle
    this.contextManager.run(context, async () => {
      // Add request ID to response headers for client tracking
      res.setHeader('X-Request-ID', requestId);
      res.setHeader('X-Correlation-ID', correlationId);

      // Log request start
      this.logger.log(`[${requestId}] ${req.method} ${req.url} - Request started`);

      // Set up response finish handler
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        // Log request completion
        this.logger.log(
          `[${requestId}] ${req.method} ${req.url} - Request completed in ${duration}ms with status ${statusCode}`,
        );

        // Update context with completion data
        this.contextManager.setContext({
          ...context,
          duration,
          statusCode,
          endTime: Date.now(),
        });
      });

      // Set up response close handler (for aborted requests)
      res.on('close', () => {
        const duration = Date.now() - startTime;
        this.logger.warn(
          `[${requestId}] ${req.method} ${req.url} - Request aborted after ${duration}ms`,
        );
      });

      // Continue to next middleware
      next();
    });
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(req: Request): string {
    // Check if request ID is already provided in headers
    const existingRequestId = req.headers['x-request-id'] as string;
    if (existingRequestId) {
      return existingRequestId;
    }

    // Generate new request ID
    return randomUUID();
  }

  /**
   * Get or generate correlation ID for distributed tracing
   */
  private getCorrelationId(req: Request): string {
    // Check if correlation ID is already provided in headers
    const existingCorrelationId = req.headers['x-correlation-id'] as string;
    if (existingCorrelationId) {
      return existingCorrelationId;
    }

    // Generate new correlation ID
    return randomUUID();
  }

  /**
   * Extract user ID from JWT token or other authentication mechanisms
   */
  private extractUserId(req: Request): string | undefined {
    // Check if user ID is already in request (set by auth middleware)
    if ((req as any).user?.id) {
      return (req as any).user.id;
    }

    // Check JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        // In a real implementation, you would decode and verify the JWT token
        // For now, we'll just return undefined
        return undefined;
      } catch (error) {
        this.logger.warn('Failed to extract user ID from JWT token', error);
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Extract user role from JWT token or other authentication mechanisms
   */
  private extractUserRole(req: Request): string | undefined {
    // Check if user role is already in request (set by auth middleware)
    if ((req as any).user?.role) {
      return (req as any).user.role;
    }

    // Check JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        // In a real implementation, you would decode and verify the JWT token
        // For now, we'll just return undefined
        return undefined;
      } catch (error) {
        this.logger.warn('Failed to extract user role from JWT token', error);
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Extract session ID from cookies or headers
   */
  private extractSessionId(req: Request): string | undefined {
    // Check cookies for session ID
    if (req.cookies?.sessionId) {
      return req.cookies.sessionId;
    }

    // Check headers for session ID
    const sessionHeader = req.headers['x-session-id'] as string;
    if (sessionHeader) {
      return sessionHeader;
    }

    return undefined;
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }
}
