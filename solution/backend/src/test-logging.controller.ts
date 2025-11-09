import { Controller, Get, Post } from '@nestjs/common';
import { WinstonLoggerService } from './modules/logging/services/winston-logger.service';
import { LoggingService } from './modules/logging/services/logging.service';

@Controller('test-logging')
export class TestLoggingController {
  constructor(
    private readonly winstonLogger: WinstonLoggerService,
    private readonly loggingService: LoggingService,
  ) {}

  @Get('winston')
  testWinstonLogging() {
    console.log('Testing Winston logger...');
    
    // Test different log levels
    this.winstonLogger.error('Test error from Winston logger', { test: true, timestamp: new Date().toISOString() });
    this.winstonLogger.warn('Test warning from Winston logger', { test: true, timestamp: new Date().toISOString() });
    this.winstonLogger.info('Test info from Winston logger', { test: true, timestamp: new Date().toISOString() });
    
    return { message: 'Winston logging test completed. Check logs/app.log for entries.' };
  }

  @Get('database')
  async testDatabaseLogging() {
    console.log('Testing database logging...');
    
    // Test different log levels
    await this.loggingService.error('Test error from database logger', new Error('Test error'), { test: true, timestamp: new Date().toISOString() });
    await this.loggingService.warn('Test warning from database logger', { test: true, timestamp: new Date().toISOString() });
    await this.loggingService.info('Test info from database logger', { test: true, timestamp: new Date().toISOString() });
    
    return { message: 'Database logging test completed. Check database for entries.' };
  }

  @Get('error')
  testError() {
    // This should trigger the GlobalExceptionFilter
    throw new Error('Test error for GlobalExceptionFilter');
  }
}
