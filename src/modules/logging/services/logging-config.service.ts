import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingConfig } from '../interfaces/logging-config.interface';

/**
 * Service for managing logging configuration
 * 
 * Features:
 * - Load configuration from environment variables
 * - Provide default configuration values
 * - Validate configuration properties
 * - Support different environments
 * - Hot reload configuration changes
 */
@Injectable()
export class LoggingConfigService {
  private readonly logger = new Logger(LoggingConfigService.name);
  private config: LoggingConfig;

  constructor(private readonly configService: ConfigService) {
    this.loadConfiguration();
  }

  /**
   * Get the current logging configuration
   */
  getConfig(): LoggingConfig {
    return { ...this.config };
  }

  /**
   * Reload configuration from environment variables
   */
  reloadConfig(): void {
    this.loadConfiguration();
    this.logger.log('Logging configuration reloaded');
  }

  /**
   * Get a specific configuration section
   */
  getSection<K extends keyof LoggingConfig>(section: K): LoggingConfig[K] {
    return { ...this.config[section] };
  }

  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(feature: string): boolean {
    const featureMap: Record<string, () => boolean> = {
      'logging': () => this.config.global.enabled,
      'console': () => this.config.transports.console.enabled,
      'file': () => this.config.transports.file.enabled,
      'database': () => this.config.transports.database.enabled,
      'performance': () => this.config.performance.enabled,
      'business-events': () => this.config.businessEvents.enabled,
      'http': () => this.config.http.enabled,
      'errors': () => this.config.errors.enabled,
      'elk': () => this.config.integrations.elk.enabled,
      'sentry': () => this.config.integrations.sentry.enabled,
      'datadog': () => this.config.integrations.datadog.enabled,
    };

    const getter = featureMap[feature];
    return getter ? getter() : false;
  }

  /**
   * Get configuration for a specific environment
   */
  getEnvironmentConfig(): Partial<LoggingConfig> {
    const environment = this.config.global.environment;
    
    switch (environment) {
      case 'development':
        return this.getDevelopmentConfig();
      case 'staging':
        return this.getStagingConfig();
      case 'production':
        return this.getProductionConfig();
      default:
        return this.getDefaultConfig();
    }
  }

  /**
   * Validate configuration
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate global config
    if (!this.config.global.appName) {
      errors.push('Global appName is required');
    }
    if (!this.config.global.appVersion) {
      errors.push('Global appVersion is required');
    }
    if (!['development', 'staging', 'production'].includes(this.config.global.environment)) {
      errors.push('Global environment must be one of: development, staging, production');
    }

    // Validate transport configs
    if (this.config.transports.file.enabled && (!this.config.transports.file.filename || this.config.transports.file.filename.trim() === '')) {
      errors.push('File transport filename is required when file transport is enabled');
    }

    // Validate integration configs
    if (this.config.integrations.elk.enabled && !this.config.integrations.elk.elasticsearchUrl) {
      errors.push('ELK elasticsearchUrl is required when ELK integration is enabled');
    }
    if (this.config.integrations.sentry.enabled && !this.config.integrations.sentry.dsn) {
      errors.push('Sentry DSN is required when Sentry integration is enabled');
    }
    if (this.config.integrations.datadog.enabled && !this.config.integrations.datadog.apiKey) {
      errors.push('Datadog API key is required when Datadog integration is enabled');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfiguration(): void {
    this.config = {
      global: {
        enabled: this.configService.get<boolean>('LOGGING_ENABLED', true),
        level: this.configService.get<string>('LOGGING_LEVEL', 'info') as any,
        appName: this.configService.get<string>('APP_NAME', 'portfolio-management-system'),
        appVersion: this.configService.get<string>('APP_VERSION', '1.0.0'),
        environment: this.configService.get<string>('NODE_ENV', 'development'),
      },
      transports: {
        console: {
          enabled: this.configService.get<boolean>('LOGGING_CONSOLE_ENABLED', true),
          level: this.configService.get<string>('LOGGING_CONSOLE_LEVEL', 'info'),
          format: this.configService.get<string>('LOGGING_CONSOLE_FORMAT', 'pretty') as any,
          colorize: this.configService.get<boolean>('LOGGING_CONSOLE_COLORIZE', true),
        },
        file: {
          enabled: this.configService.get<boolean>('LOGGING_FILE_ENABLED', true),
          level: this.configService.get<string>('LOGGING_FILE_LEVEL', 'error'),
          filename: this.configService.get<string>('LOGGING_FILE_FILENAME', 'logs/app.log'),
          maxSize: this.configService.get<string>('LOGGING_FILE_MAX_SIZE', '20m'),
          maxFiles: this.configService.get<number>('LOGGING_FILE_MAX_FILES', 14),
          datePattern: this.configService.get<string>('LOGGING_FILE_DATE_PATTERN', 'YYYY-MM-DD'),
        },
        database: {
          enabled: this.configService.get<boolean>('LOGGING_DATABASE_ENABLED', true),
          level: this.configService.get<string>('LOGGING_DATABASE_LEVEL', 'info'),
          tableName: this.configService.get<string>('LOGGING_DATABASE_TABLE', 'application_logs'),
          batchSize: this.configService.get<number>('LOGGING_DATABASE_BATCH_SIZE', 100),
          flushInterval: this.configService.get<number>('LOGGING_DATABASE_FLUSH_INTERVAL', 5000),
        },
      },
      retention: {
        enabled: this.configService.get<boolean>('LOGGING_RETENTION_ENABLED', true),
        days: this.configService.get<number>('LOGGING_RETENTION_DAYS', 30),
        intervalHours: this.configService.get<number>('LOGGING_RETENTION_INTERVAL_HOURS', 24),
      },
      performance: {
        enabled: this.configService.get<boolean>('LOGGING_PERFORMANCE_ENABLED', true),
        slowThresholdMs: this.configService.get<number>('LOGGING_PERFORMANCE_SLOW_THRESHOLD_MS', 1000),
        trackMemoryUsage: this.configService.get<boolean>('LOGGING_PERFORMANCE_TRACK_MEMORY', true),
        trackCpuUsage: this.configService.get<boolean>('LOGGING_PERFORMANCE_TRACK_CPU', false),
      },
      security: {
        sanitizeData: this.configService.get<boolean>('LOGGING_SECURITY_SANITIZE', true),
        sensitiveFields: this.configService.get<string[]>('LOGGING_SECURITY_SENSITIVE_FIELDS', [
          'password', 'token', 'secret', 'key', 'authorization', 'cookie', 'ssn', 'creditCard'
        ]),
        logIpAddresses: this.configService.get<boolean>('LOGGING_SECURITY_LOG_IP', true),
        logUserAgents: this.configService.get<boolean>('LOGGING_SECURITY_LOG_USER_AGENT', true),
      },
      businessEvents: {
        enabled: this.configService.get<boolean>('LOGGING_BUSINESS_EVENTS_ENABLED', true),
        defaultSeverity: this.configService.get<string>('LOGGING_BUSINESS_EVENTS_DEFAULT_SEVERITY', 'medium') as any,
        includeRequestData: this.configService.get<boolean>('LOGGING_BUSINESS_EVENTS_INCLUDE_REQUEST', false),
        includeResponseData: this.configService.get<boolean>('LOGGING_BUSINESS_EVENTS_INCLUDE_RESPONSE', false),
        includeUserContext: this.configService.get<boolean>('LOGGING_BUSINESS_EVENTS_INCLUDE_USER', true),
      },
      http: {
        enabled: this.configService.get<boolean>('LOGGING_HTTP_ENABLED', true),
        logRequestBody: this.configService.get<boolean>('LOGGING_HTTP_LOG_REQUEST_BODY', false),
        logResponseBody: this.configService.get<boolean>('LOGGING_HTTP_LOG_RESPONSE_BODY', false),
        maxBodySize: this.configService.get<number>('LOGGING_HTTP_MAX_BODY_SIZE', 10000),
        sensitiveHeaders: this.configService.get<string[]>('LOGGING_HTTP_SENSITIVE_HEADERS', [
          'authorization', 'cookie', 'set-cookie'
        ]),
        sensitiveBodyFields: this.configService.get<string[]>('LOGGING_HTTP_SENSITIVE_BODY_FIELDS', [
          'password', 'token', 'creditCard', 'ssn'
        ]),
      },
      errors: {
        enabled: this.configService.get<boolean>('LOGGING_ERRORS_ENABLED', true),
        logStackTraces: this.configService.get<boolean>('LOGGING_ERRORS_LOG_STACK_TRACES', true),
        logErrorContext: this.configService.get<boolean>('LOGGING_ERRORS_LOG_CONTEXT', true),
        maxStackTraceDepth: this.configService.get<number>('LOGGING_ERRORS_MAX_STACK_DEPTH', 10),
      },
      integrations: {
        elk: {
          enabled: this.configService.get<boolean>('LOGGING_ELK_ENABLED', false),
          elasticsearchUrl: this.configService.get<string>('LOGGING_ELK_ELASTICSEARCH_URL', ''),
          indexName: this.configService.get<string>('LOGGING_ELK_INDEX_NAME', 'portfolio-logs'),
          username: this.configService.get<string>('LOGGING_ELK_USERNAME'),
          password: this.configService.get<string>('LOGGING_ELK_PASSWORD'),
        },
        sentry: {
          enabled: this.configService.get<boolean>('LOGGING_SENTRY_ENABLED', false),
          dsn: this.configService.get<string>('LOGGING_SENTRY_DSN', ''),
          environment: this.configService.get<string>('LOGGING_SENTRY_ENVIRONMENT', 'development'),
          release: this.configService.get<string>('LOGGING_SENTRY_RELEASE'),
        },
        datadog: {
          enabled: this.configService.get<boolean>('LOGGING_DATADOG_ENABLED', false),
          apiKey: this.configService.get<string>('LOGGING_DATADOG_API_KEY', ''),
          site: this.configService.get<string>('LOGGING_DATADOG_SITE', 'datadoghq.com'),
          service: this.configService.get<string>('LOGGING_DATADOG_SERVICE', 'portfolio-management-system'),
        },
      },
    };

    // Validate configuration
    const validation = this.validateConfig();
    if (!validation.isValid) {
      this.logger.warn('Logging configuration validation failed:', validation.errors);
    }
  }

  /**
   * Get development environment configuration
   */
  private getDevelopmentConfig(): Partial<LoggingConfig> {
    return {
      global: {
        level: 'debug',
      },
      transports: {
        console: {
          enabled: true,
          format: 'pretty',
          colorize: true,
        },
        file: {
          enabled: false,
        },
        database: {
          enabled: false,
        },
      },
      performance: {
        enabled: true,
        slowThresholdMs: 500,
      },
      http: {
        logRequestBody: true,
        logResponseBody: true,
      },
    } as any;
  }

  /**
   * Get staging environment configuration
   */
  private getStagingConfig(): Partial<LoggingConfig> {
    return {
      global: {
        level: 'info',
      },
      transports: {
        console: {
          enabled: true,
          format: 'json',
        },
        file: {
          enabled: true,
        },
        database: {
          enabled: true,
        },
      },
      performance: {
        enabled: true,
        slowThresholdMs: 1000,
      },
      http: {
        logRequestBody: false,
        logResponseBody: false,
      },
    } as any;
  }

  /**
   * Get production environment configuration
   */
  private getProductionConfig(): Partial<LoggingConfig> {
    return {
      global: {
        level: 'warn',
      },
      transports: {
        console: {
          enabled: false,
        },
        file: {
          enabled: true,
        },
        database: {
          enabled: true,
        },
      },
      performance: {
        enabled: true,
        slowThresholdMs: 2000,
      },
      http: {
        logRequestBody: false,
        logResponseBody: false,
      },
      integrations: {
        elk: {
          enabled: true,
        },
        sentry: {
          enabled: true,
        },
      },
    } as any;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): Partial<LoggingConfig> {
    return {
      global: {
        level: 'info',
      },
      transports: {
        console: {
          enabled: true,
        },
        file: {
          enabled: true,
        },
        database: {
          enabled: true,
        },
      },
    } as any;
  }
}
