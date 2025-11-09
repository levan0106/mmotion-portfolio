import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingService } from './services/logging.service';
import { LogRepository } from './repositories/log.repository';
import { ContextManager } from './services/context-manager.service';
import { LogSanitizationService } from './services/log-sanitization.service';
import { SecurityLoggingService } from './services/security-logging.service';
import { LogAggregationService } from './services/log-aggregation.service';
import { LogSummarizationService } from './services/log-summarization.service';
import { LogAnalyticsService } from './services/log-analytics.service';
import { LogAccessControlService } from './services/log-access-control.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { LogController } from './controllers/log.controller';
import { WinstonLoggerService } from './services/winston-logger.service';
import { LoggingConfigService } from './services/logging-config.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { ApplicationLog } from './entities/application-log.entity';
import { RequestLog } from './entities/request-log.entity';
import { BusinessEventLog } from './entities/business-event-log.entity';
import { PerformanceLog } from './entities/performance-log.entity';

/**
 * LoggingModule provides comprehensive logging functionality for the application.
 * 
 * Features:
 * - Application logging (info, warn, error, debug)
 * - Request/response logging with performance metrics
 * - Business event logging for audit trails
 * - Performance monitoring and metrics
 * - Context management for request correlation
 * - Data sanitization for sensitive information
 * - Database persistence with TypeORM
 * - RESTful API for log management
 * 
 * The module exports all services and the interceptor for use in other modules.
 * The LoggingInterceptor should be registered globally to capture all HTTP requests.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationLog,
      RequestLog,
      BusinessEventLog,
      PerformanceLog,
    ]),
  ],
  providers: [
    LoggingService,
    LogRepository,
    ContextManager,
    {
      provide: 'SANITIZATION_CONFIG',
      useValue: {
        enablePasswordMasking: true,
        enableTokenRedaction: true,
        enablePIIProtection: true,
        enableCreditCardMasking: true,
        enableSSNMasking: true,
        enableEmailMasking: false,
        customRules: [],
        maxStringLength: 10000,
        redactionPlaceholder: '[REDACTED]',
      },
    },
    LogSanitizationService,
    SecurityLoggingService,
    LogAggregationService,
    LogSummarizationService,
    LogAnalyticsService,
    LogAccessControlService,
    LoggingInterceptor,
    WinstonLoggerService,
    LoggingConfigService,
    GlobalExceptionFilter,
  ],
  controllers: [LogController],
  exports: [
    LoggingService,
    LogRepository,
    ContextManager,
    LogSanitizationService,
    SecurityLoggingService,
    LogAggregationService,
    LogSummarizationService,
    LogAnalyticsService,
    LogAccessControlService,
    LoggingInterceptor,
    WinstonLoggerService,
    LoggingConfigService,
    GlobalExceptionFilter,
  ],
})
export class LoggingModule {}
