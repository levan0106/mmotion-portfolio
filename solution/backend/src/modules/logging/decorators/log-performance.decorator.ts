import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for performance logging
 */
export const LOG_PERFORMANCE_KEY = 'log_performance';

/**
 * Interface for performance monitoring metadata
 */
export interface PerformanceMetadata {
  operationName?: string;
  operationType?: string;
  includeMemoryUsage?: boolean;
  includeCpuUsage?: boolean;
  includeDatabaseMetrics?: boolean;
  includeCacheMetrics?: boolean;
  includeExternalApiMetrics?: boolean;
  customMetrics?: Record<string, any>;
  thresholdMs?: number;
  logOnlyIfSlow?: boolean;
}

/**
 * Decorator to automatically log performance metrics when a method is called.
 * 
 * Usage:
 * ```typescript
 * @LogPerformance({
 *   operationName: 'user_authentication',
 *   operationType: 'AUTHENTICATION',
 *   includeMemoryUsage: true,
 *   includeDatabaseMetrics: true,
 *   thresholdMs: 1000,
 *   logOnlyIfSlow: true
 * })
 * async authenticateUser(credentials: LoginDto): Promise<AuthResult> {
 *   // Business logic here
 * }
 * ```
 * 
 * @param metadata - Performance monitoring configuration
 */
export function LogPerformance(metadata: PerformanceMetadata = {}) {
  return SetMetadata(LOG_PERFORMANCE_KEY, metadata);
}
