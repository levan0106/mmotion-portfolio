import { Injectable, Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
  requestId?: string;
  userId?: string;
  serviceName?: string;
  moduleName?: string;
  functionName?: string;
  correlationId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * ContextManager provides context management for logging across async operations.
 * Uses AsyncLocalStorage to maintain context throughout the request lifecycle
 * and enables automatic context propagation for all logging operations.
 */
@Injectable()
export class ContextManager {
  private readonly logger = new Logger(ContextManager.name);
  private readonly asyncLocalStorage = new AsyncLocalStorage<LogContext>();

  /**
   * Run a function with the provided context.
   * The context will be available throughout the entire async execution chain.
   * @param context - Context data to set
   * @param fn - Function to execute with context
   * @returns Result of the function execution
   */
  async run<T>(context: LogContext, fn: () => Promise<T>): Promise<T> {
    return this.asyncLocalStorage.run(context, fn);
  }

  /**
   * Run a synchronous function with the provided context.
   * @param context - Context data to set
   * @param fn - Function to execute with context
   * @returns Result of the function execution
   */
  runSync<T>(context: LogContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn);
  }

  /**
   * Get the current context.
   * @returns Current context or empty object if no context is set
   */
  getCurrentContext(): LogContext {
    return this.asyncLocalStorage.getStore() || {};
  }

  /**
   * Set or update context data.
   * Merges with existing context data.
   * @param context - Context data to set or merge
   */
  setContext(context: Partial<LogContext>): void {
    const currentContext = this.getCurrentContext();
    const mergedContext = { ...currentContext, ...context };
    
    // Note: AsyncLocalStorage doesn't support updating context directly
    // This method is provided for API compatibility but won't actually update
    // the context in the current async scope. Use run() method instead.
    this.logger.warn('setContext() called but AsyncLocalStorage context cannot be updated directly. Use run() method instead.');
  }

  /**
   * Get a specific context value.
   * @param key - Context key to retrieve
   * @returns Context value or undefined if not found
   */
  getContextValue(key: string): any {
    const context = this.getCurrentContext();
    return context[key];
  }

  /**
   * Check if context has a specific key.
   * @param key - Context key to check
   * @returns True if key exists in context
   */
  hasContextKey(key: string): boolean {
    const context = this.getCurrentContext();
    return key in context;
  }

  /**
   * Get request ID from current context.
   * @returns Request ID or undefined
   */
  getRequestId(): string | undefined {
    return this.getContextValue('requestId');
  }

  /**
   * Get user ID from current context.
   * @returns User ID or undefined
   */
  getUserId(): string | undefined {
    return this.getContextValue('userId');
  }

  /**
   * Get service name from current context.
   * @returns Service name or undefined
   */
  getServiceName(): string | undefined {
    return this.getContextValue('serviceName');
  }

  /**
   * Get module name from current context.
   * @returns Module name or undefined
   */
  getModuleName(): string | undefined {
    return this.getContextValue('moduleName');
  }

  /**
   * Get function name from current context.
   * @returns Function name or undefined
   */
  getFunctionName(): string | undefined {
    return this.getContextValue('functionName');
  }

  /**
   * Get correlation ID from current context.
   * @returns Correlation ID or undefined
   */
  getCorrelationId(): string | undefined {
    return this.getContextValue('correlationId');
  }

  /**
   * Get session ID from current context.
   * @returns Session ID or undefined
   */
  getSessionId(): string | undefined {
    return this.getContextValue('sessionId');
  }

  /**
   * Get IP address from current context.
   * @returns IP address or undefined
   */
  getIpAddress(): string | undefined {
    return this.getContextValue('ipAddress');
  }

  /**
   * Get user agent from current context.
   * @returns User agent or undefined
   */
  getUserAgent(): string | undefined {
    return this.getContextValue('userAgent');
  }

  /**
   * Create a new context with additional data.
   * This creates a new context scope without affecting the current one.
   * @param additionalContext - Additional context data to merge
   * @returns New context object
   */
  createContext(additionalContext: Partial<LogContext> = {}): LogContext {
    const currentContext = this.getCurrentContext();
    return { ...currentContext, ...additionalContext };
  }

  /**
   * Clear the current context.
   * Note: This doesn't actually clear AsyncLocalStorage context,
   * but provides a way to create an empty context for new scopes.
   * @returns Empty context object
   */
  clearContext(): LogContext {
    return {};
  }

  /**
   * Check if context is currently active.
   * @returns True if context is active
   */
  isContextActive(): boolean {
    return this.asyncLocalStorage.getStore() !== undefined;
  }

  /**
   * Get context summary for logging.
   * @returns Formatted context summary
   */
  getContextSummary(): string {
    const context = this.getCurrentContext();
    const keys = Object.keys(context);
    
    if (keys.length === 0) {
      return 'No context';
    }

    const summary = keys
      .map(key => `${key}=${context[key]}`)
      .join(', ');
    
    return `Context: ${summary}`;
  }

  /**
   * Create context from HTTP request data.
   * @param request - HTTP request object or request data
   * @returns Context object
   */
  createContextFromRequest(request: {
    headers?: Record<string, any>;
    ip?: string;
    user?: { id?: string };
    session?: { id?: string };
    correlationId?: string;
  }): LogContext {
    const context: LogContext = {};

    // Extract request ID from headers
    if (request.headers?.['x-request-id']) {
      context.requestId = request.headers['x-request-id'];
    }

    // Extract correlation ID from headers
    if (request.headers?.['x-correlation-id']) {
      context.correlationId = request.headers['x-correlation-id'];
    } else if (request.correlationId) {
      context.correlationId = request.correlationId;
    }

    // Extract user agent
    if (request.headers?.['user-agent']) {
      context.userAgent = request.headers['user-agent'];
    }

    // Extract IP address
    if (request.ip) {
      context.ipAddress = request.ip;
    }

    // Extract user ID
    if (request.user?.id) {
      context.userId = request.user.id;
    }

    // Extract session ID
    if (request.session?.id) {
      context.sessionId = request.session.id;
    }

    return context;
  }

  /**
   * Create context from service data.
   * @param serviceName - Name of the service
   * @param moduleName - Name of the module
   * @param functionName - Name of the function
   * @param additionalContext - Additional context data
   * @returns Context object
   */
  createContextFromService(
    serviceName: string,
    moduleName?: string,
    functionName?: string,
    additionalContext: Partial<LogContext> = {},
  ): LogContext {
    return {
      serviceName,
      moduleName,
      functionName,
      ...additionalContext,
    };
  }
}
