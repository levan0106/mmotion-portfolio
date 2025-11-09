/**
 * Configuration interface for the logging system
 */
export interface LoggingConfig {
  /**
   * Global logging configuration
   */
  global: {
    /** Enable or disable logging system */
    enabled: boolean;
    /** Default log level */
    level: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
    /** Application name for log identification */
    appName: string;
    /** Application version */
    appVersion: string;
    /** Environment (development, staging, production) */
    environment: string;
  };

  /**
   * Winston transports configuration
   */
  transports: {
    /** Console transport configuration */
    console: {
      enabled: boolean;
      level: string;
      format: 'simple' | 'json' | 'pretty';
      colorize: boolean;
    };
    /** File transport configuration */
    file: {
      enabled: boolean;
      level: string;
      filename: string;
      maxSize: string;
      maxFiles: number;
      datePattern: string;
    };
    /** Database transport configuration */
    database: {
      enabled: boolean;
      level: string;
      tableName: string;
      batchSize: number;
      flushInterval: number;
    };
  };

  /**
   * Log retention and cleanup configuration
   */
  retention: {
    /** Enable automatic log cleanup */
    enabled: boolean;
    /** Retention period in days */
    days: number;
    /** Cleanup interval in hours */
    intervalHours: number;
  };

  /**
   * Performance monitoring configuration
   */
  performance: {
    /** Enable performance logging */
    enabled: boolean;
    /** Slow operation threshold in milliseconds */
    slowThresholdMs: number;
    /** Enable memory usage tracking */
    trackMemoryUsage: boolean;
    /** Enable CPU usage tracking */
    trackCpuUsage: boolean;
  };

  /**
   * Security and sanitization configuration
   */
  security: {
    /** Enable data sanitization */
    sanitizeData: boolean;
    /** Sensitive fields to redact */
    sensitiveFields: string[];
    /** Enable IP address logging */
    logIpAddresses: boolean;
    /** Enable user agent logging */
    logUserAgents: boolean;
  };

  /**
   * Business event logging configuration
   */
  businessEvents: {
    /** Enable business event logging */
    enabled: boolean;
    /** Default severity level */
    defaultSeverity: 'low' | 'medium' | 'high' | 'critical';
    /** Include request data by default */
    includeRequestData: boolean;
    /** Include response data by default */
    includeResponseData: boolean;
    /** Include user context by default */
    includeUserContext: boolean;
  };

  /**
   * HTTP request/response logging configuration
   */
  http: {
    /** Enable HTTP request/response logging */
    enabled: boolean;
    /** Log request bodies */
    logRequestBody: boolean;
    /** Log response bodies */
    logResponseBody: boolean;
    /** Maximum body size to log */
    maxBodySize: number;
    /** Sensitive headers to redact */
    sensitiveHeaders: string[];
    /** Sensitive body fields to redact */
    sensitiveBodyFields: string[];
  };

  /**
   * Error logging configuration
   */
  errors: {
    /** Enable error logging */
    enabled: boolean;
    /** Log stack traces */
    logStackTraces: boolean;
    /** Log error context */
    logErrorContext: boolean;
    /** Maximum stack trace depth */
    maxStackTraceDepth: number;
  };

  /**
   * External integrations configuration
   */
  integrations: {
    /** ELK Stack integration */
    elk: {
      enabled: boolean;
      elasticsearchUrl: string;
      indexName: string;
      username?: string;
      password?: string;
    };
    /** Sentry integration */
    sentry: {
      enabled: boolean;
      dsn: string;
      environment: string;
      release?: string;
    };
    /** Datadog integration */
    datadog: {
      enabled: boolean;
      apiKey: string;
      site: string;
      service: string;
    };
  };
}
