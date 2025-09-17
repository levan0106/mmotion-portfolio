import { Injectable, Logger } from '@nestjs/common';
import { GlobalAssetException } from '../exceptions/global-asset.exceptions';
import { AssetPriceException } from '../exceptions/asset-price.exceptions';
import { ValidationException } from '../exceptions/validation.exceptions';

/**
 * Error handling service for Global Assets System
 */
@Injectable()
export class ErrorHandlingService {
  private readonly logger = new Logger(ErrorHandlingService.name);

  /**
   * Handle and log errors
   */
  handleError(error: Error, context: string, additionalInfo?: any): void {
    this.logger.error(`Error in ${context}:`, error);
    
    if (additionalInfo) {
      this.logger.error('Additional info:', additionalInfo);
    }

    // Log error to external service if needed
    this.logToExternalService(error, context, additionalInfo);
  }

  /**
   * Handle validation errors
   */
  handleValidationError(field: string, value: any, rule: string): ValidationException {
    const message = `Validation failed for ${field}: ${rule}`;
    this.logger.warn(`Validation error: ${message}`, { field, value, rule });
    return new ValidationException(message, field);
  }

  /**
   * Handle business logic errors
   */
  handleBusinessError(errorType: string, message: string, context?: any): GlobalAssetException {
    this.logger.warn(`Business error: ${message}`, { errorType, context });
    
    switch (errorType) {
      case 'ASSET_NOT_FOUND':
        return new GlobalAssetException(message, 404);
      case 'ASSET_ALREADY_EXISTS':
        return new GlobalAssetException(message, 409);
      case 'ASSET_CANNOT_BE_MODIFIED':
        return new GlobalAssetException(message, 400);
      case 'INVALID_SYMBOL_FORMAT':
        return new GlobalAssetException(message, 400);
      case 'INVALID_NATION_CODE':
        return new GlobalAssetException(message, 400);
      case 'NATION_CONFIG_NOT_FOUND':
        return new GlobalAssetException(message, 404);
      case 'ASSET_TYPE_NOT_ENABLED':
        return new GlobalAssetException(message, 400);
      default:
        return new GlobalAssetException(message, 400);
    }
  }

  /**
   * Handle price-related errors
   */
  handlePriceError(errorType: string, message: string, context?: any): AssetPriceException {
    this.logger.warn(`Price error: ${message}`, { errorType, context });
    
    switch (errorType) {
      case 'PRICE_NOT_FOUND':
        return new AssetPriceException(message, 404);
      case 'INVALID_PRICE_VALUE':
        return new AssetPriceException(message, 400);
      case 'INVALID_PRICE_TYPE':
        return new AssetPriceException(message, 400);
      case 'INVALID_PRICE_SOURCE':
        return new AssetPriceException(message, 400);
      case 'PRICE_ALREADY_EXISTS':
        return new AssetPriceException(message, 409);
      case 'BULK_UPDATE_FAILED':
        return new AssetPriceException(message, 400);
      default:
        return new AssetPriceException(message, 400);
    }
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error: Error, operation: string): GlobalAssetException {
    this.logger.error(`Database error during ${operation}:`, error);
    
    if (error.message.includes('duplicate key')) {
      return new GlobalAssetException('Resource already exists', 409);
    } else if (error.message.includes('not found')) {
      return new GlobalAssetException('Resource not found', 404);
    } else if (error.message.includes('validation failed')) {
      return new GlobalAssetException('Validation failed', 400);
    } else {
      return new GlobalAssetException('Database operation failed', 500);
    }
  }

  /**
   * Handle external service errors
   */
  handleExternalServiceError(error: Error, service: string): GlobalAssetException {
    this.logger.error(`External service error from ${service}:`, error);
    
    if (error.message.includes('timeout')) {
      return new GlobalAssetException(`${service} service timeout`, 504);
    } else if (error.message.includes('not found')) {
      return new GlobalAssetException(`${service} service not available`, 503);
    } else if (error.message.includes('unauthorized')) {
      return new GlobalAssetException(`${service} service unauthorized`, 401);
    } else {
      return new GlobalAssetException(`${service} service error`, 502);
    }
  }

  /**
   * Handle rate limiting errors
   */
  handleRateLimitError(limit: number, window: string): GlobalAssetException {
    const message = `Rate limit exceeded: ${limit} requests per ${window}`;
    this.logger.warn(message);
    return new GlobalAssetException(message, 429);
  }

  /**
   * Handle timeout errors
   */
  handleTimeoutError(operation: string, timeout: number): GlobalAssetException {
    const message = `Operation ${operation} timed out after ${timeout}ms`;
    this.logger.warn(message);
    return new GlobalAssetException(message, 408);
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: Error): GlobalAssetException {
    this.logger.error('Network error:', error);
    
    if (error.message.includes('ECONNREFUSED')) {
      return new GlobalAssetException('Connection refused', 503);
    } else if (error.message.includes('ENOTFOUND')) {
      return new GlobalAssetException('Host not found', 503);
    } else if (error.message.includes('ETIMEDOUT')) {
      return new GlobalAssetException('Connection timeout', 504);
    } else {
      return new GlobalAssetException('Network error', 502);
    }
  }

  /**
   * Handle file system errors
   */
  handleFileSystemError(error: Error, operation: string): GlobalAssetException {
    this.logger.error(`File system error during ${operation}:`, error);
    
    if (error.message.includes('ENOENT')) {
      return new GlobalAssetException('File not found', 404);
    } else if (error.message.includes('EACCES')) {
      return new GlobalAssetException('Permission denied', 403);
    } else if (error.message.includes('ENOSPC')) {
      return new GlobalAssetException('No space left on device', 507 as any);
    } else {
      return new GlobalAssetException('File system error', 500);
    }
  }

  /**
   * Handle memory errors
   */
  handleMemoryError(error: Error): GlobalAssetException {
    this.logger.error('Memory error:', error);
    return new GlobalAssetException('Insufficient memory', 507 as any);
  }

  /**
   * Handle configuration errors
   */
  handleConfigurationError(error: Error, configKey: string): GlobalAssetException {
    this.logger.error(`Configuration error for ${configKey}:`, error);
    return new GlobalAssetException(`Configuration error: ${configKey}`, 500);
  }

  /**
   * Log error to external service
   */
  private logToExternalService(error: Error, context: string, additionalInfo?: any): void {
    // This would typically send to an external logging service
    // For now, we'll just log it
    this.logger.log('Error logged to external service', {
      error: error.message,
      context,
      additionalInfo,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): any {
    // This would typically return error statistics from a monitoring service
    return {
      totalErrors: 0,
      errorsByType: {},
      errorsByContext: {},
      lastError: null,
    };
  }

  /**
   * Clear error statistics
   */
  clearErrorStatistics(): void {
    // This would typically clear error statistics in a monitoring service
    this.logger.log('Error statistics cleared');
  }
}
