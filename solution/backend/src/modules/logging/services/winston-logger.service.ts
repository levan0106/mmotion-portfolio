import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { LoggingConfigService } from './logging-config.service';
import { LogRepository } from '../repositories/log.repository';

/**
 * Winston logger service that provides multiple transports for logging
 * 
 * Features:
 * - Console transport for development
 * - File transport with rotation
 * - Database transport for persistence
 * - Custom formatters and filters
 * - Environment-specific configuration
 */
@Injectable()
export class WinstonLoggerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WinstonLoggerService.name);
  private winstonLogger: winston.Logger;

  constructor(
    private readonly configService: LoggingConfigService,
    private readonly logRepository: LogRepository,
  ) {}

  async onModuleInit() {
    await this.initializeWinston();
  }

  async onModuleDestroy() {
    if (this.winstonLogger) {
      await this.winstonLogger.close();
    }
  }

  /**
   * Get the Winston logger instance
   */
  getWinstonLogger(): winston.Logger {
    return this.winstonLogger;
  }

  /**
   * Log a message with the specified level
   */
  log(level: string, message: string, meta?: any): void {
    if (this.winstonLogger) {
      this.winstonLogger.log(level, message, meta);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, meta?: any): void {
    this.log('error', message, meta);
  }

  /**
   * Log a warning message
   */
  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  /**
   * Log an info message
   */
  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  /**
   * Log a debug message
   */
  debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }

  /**
   * Log a verbose message
   */
  verbose(message: string, meta?: any): void {
    this.log('verbose', message, meta);
  }

  /**
   * Initialize Winston logger with configured transports
   */
  private async initializeWinston(): Promise<void> {
    const config = this.configService.getConfig();
    
    if (!config.global.enabled) {
      this.logger.warn('Logging is disabled in configuration');
      return;
    }

    const transports: winston.transport[] = [];

    // Add console transport if enabled
    if (config.transports.console.enabled) {
      transports.push(this.createConsoleTransport(config.transports.console));
    }

    // Add file transport if enabled
    if (config.transports.file.enabled) {
      transports.push(this.createFileTransport(config.transports.file));
    }

    // Add database transport if enabled
    if (config.transports.database.enabled) {
      transports.push(this.createDatabaseTransport(config.transports.database));
    }

    // Create Winston logger
    this.winstonLogger = winston.createLogger({
      level: config.global.level,
      format: this.createLogFormat(),
      transports,
      exitOnError: false,
      silent: false,
    });

    this.logger.log('Winston logger initialized with transports:', transports.map(t => t.constructor.name));
  }

  /**
   * Create console transport
   */
  private createConsoleTransport(consoleConfig: any): winston.transport {
    const format = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    if (consoleConfig.format === 'pretty') {
      return new winston.transports.Console({
        level: consoleConfig.level,
        format: winston.format.combine(
          winston.format.colorize({ all: consoleConfig.colorize }),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${level}]: ${message} ${metaStr}`;
          }),
        ),
      });
    }

    return new winston.transports.Console({
      level: consoleConfig.level,
      format: format,
    });
  }

  /**
   * Create file transport with rotation
   */
  private createFileTransport(fileConfig: any): winston.transport {
    return new DailyRotateFile({
      level: fileConfig.level,
      filename: fileConfig.filename,
      datePattern: fileConfig.datePattern,
      maxSize: fileConfig.maxSize,
      maxFiles: fileConfig.maxFiles,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    });
  }

  /**
   * Create database transport
   */
  private createDatabaseTransport(databaseConfig: any): winston.transport {
    const { PassThrough } = require('stream');
    const stream = new PassThrough();
    
    stream.on('data', (chunk: Buffer) => {
      try {
        const message = chunk.toString();
        const logData = JSON.parse(message);
        this.logRepository.storeApplicationLog({
          level: logData.level,
          message: logData.message,
          context: logData,
          timestamp: new Date(logData.timestamp),
        }).catch(() => {
          // Silently handle database write errors to prevent logging loops
        });
      } catch (error) {
        // Silently handle database write errors to prevent logging loops
      }
    });

    return new winston.transports.Stream({
      level: databaseConfig.level,
      stream,
    });
  }

  /**
   * Create log format
   */
  private createLogFormat(): winston.Logform.Format {
    const config = this.configService.getConfig();
    
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
      winston.format.printf(({ timestamp, level, message, metadata }) => {
        const logEntry: any = {
          timestamp,
          level,
          message,
          appName: config.global.appName,
          appVersion: config.global.appVersion,
          environment: config.global.environment,
        };
        
        if (metadata && typeof metadata === 'object') {
          Object.assign(logEntry, metadata);
        }
        
        return JSON.stringify(logEntry);
      }),
    );
  }

  /**
   * Create a child logger with additional context
   */
  createChildLogger(context: Record<string, any>): winston.Logger {
    if (!this.winstonLogger) {
      throw new Error('Winston logger not initialized');
    }

    return this.winstonLogger.child(context);
  }

  /**
   * Add a transport to the logger
   */
  addTransport(transport: winston.transport): void {
    if (this.winstonLogger) {
      this.winstonLogger.add(transport);
    }
  }

  /**
   * Remove a transport from the logger
   */
  removeTransport(transport: winston.transport): void {
    if (this.winstonLogger) {
      this.winstonLogger.remove(transport);
    }
  }

  /**
   * Get current log level
   */
  getLevel(): string {
    return this.winstonLogger?.level || 'info';
  }

  /**
   * Set log level
   */
  setLevel(level: string): void {
    if (this.winstonLogger) {
      this.winstonLogger.level = level;
    }
  }

  /**
   * Check if a level is enabled
   */
  isLevelEnabled(level: string): boolean {
    if (!this.winstonLogger) {
      return false;
    }

    const levels = winston.config.npm.levels;
    const currentLevel = levels[this.winstonLogger.level] || 0;
    const checkLevel = levels[level] || 0;
    
    return checkLevel <= currentLevel;
  }
}
