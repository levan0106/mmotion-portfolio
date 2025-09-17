import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, Like } from 'typeorm';
import { ApplicationLog } from '../entities/application-log.entity';
import { RequestLog } from '../entities/request-log.entity';
import { BusinessEventLog } from '../entities/business-event-log.entity';
import { PerformanceLog } from '../entities/performance-log.entity';

export interface LogFilterOptions {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  level?: string;
  userId?: string;
  serviceName?: string;
  moduleName?: string;
  eventType?: string;
  entityType?: string;
  operationName?: string;
  operationType?: string;
  requestId?: string;
  responseStatus?: number;
  minDuration?: number;
  maxDuration?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * LogRepository provides centralized data access for all logging entities.
 * Handles CRUD operations, filtering, pagination, and query optimization
 * for application logs, request logs, business event logs, and performance logs.
 */
@Injectable()
export class LogRepository {
  constructor(
    @InjectRepository(ApplicationLog)
    private readonly applicationLogRepository: Repository<ApplicationLog>,
    @InjectRepository(RequestLog)
    private readonly requestLogRepository: Repository<RequestLog>,
    @InjectRepository(BusinessEventLog)
    private readonly businessEventLogRepository: Repository<BusinessEventLog>,
    @InjectRepository(PerformanceLog)
    private readonly performanceLogRepository: Repository<PerformanceLog>,
  ) {}

  /**
   * Store application log entry.
   * @param logData - Application log data
   * @returns Created log entry
   */
  async storeApplicationLog(logData: Partial<ApplicationLog>): Promise<ApplicationLog> {
    const logEntry = this.applicationLogRepository.create({
      ...logData,
        serviceName: logData.serviceName || 'unknown',
    });
    return await this.applicationLogRepository.save(logEntry);
  }

  /**
   * Store request log entry.
   * @param logData - Request log data
   * @returns Created log entry
   */
  async storeRequestLog(logData: Partial<RequestLog>): Promise<RequestLog> {
    const logEntry = this.requestLogRepository.create(logData);
    return await this.requestLogRepository.save(logEntry);
  }

  /**
   * Store business event log entry.
   * @param logData - Business event log data
   * @returns Created log entry
   */
  async storeBusinessEventLog(logData: Partial<BusinessEventLog>): Promise<BusinessEventLog> {
    const logEntry = this.businessEventLogRepository.create(logData);
    return await this.businessEventLogRepository.save(logEntry);
  }

  /**
   * Store performance log entry.
   * @param logData - Performance log data
   * @returns Created log entry
   */
  async storePerformanceLog(logData: Partial<PerformanceLog>): Promise<PerformanceLog> {
    const logEntry = this.performanceLogRepository.create(logData);
    return await this.performanceLogRepository.save(logEntry);
  }

  /**
   * Find application logs with filtering and pagination.
   * @param filters - Filter options
   * @returns Paginated application logs
   */
  async findApplicationLogs(filters: LogFilterOptions = {}): Promise<PaginatedResult<ApplicationLog>> {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      level,
      userId,
      serviceName,
      moduleName,
      requestId,
    } = filters;

    const where: FindOptionsWhere<ApplicationLog> = {};

    if (startDate && endDate) {
      where.timestamp = Between(startDate, endDate);
    } else if (startDate) {
      where.timestamp = Between(startDate, new Date());
    }

    if (level) {
      where.level = level;
    }

    if (userId) {
      where.userId = userId;
    }

    if (serviceName) {
      where.serviceName = serviceName;
    }

    if (moduleName) {
      where.moduleName = moduleName;
    }

    if (requestId) {
      where.requestId = requestId;
    }

    const [data, total] = await this.applicationLogRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find request logs with filtering and pagination.
   * @param filters - Filter options
   * @returns Paginated request logs
   */
  async findRequestLogs(filters: LogFilterOptions = {}): Promise<PaginatedResult<RequestLog>> {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      userId,
      requestId,
      responseStatus,
    } = filters;

    const where: FindOptionsWhere<RequestLog> = {};

    if (startDate && endDate) {
      where.timestamp = Between(startDate, endDate);
    } else if (startDate) {
      where.timestamp = Between(startDate, new Date());
    }

    if (userId) {
      where.userId = userId;
    }

    if (requestId) {
      where.requestId = requestId;
    }

    if (responseStatus) {
      where.responseStatus = responseStatus;
    }

    const [data, total] = await this.requestLogRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find business event logs with filtering and pagination.
   * @param filters - Filter options
   * @returns Paginated business event logs
   */
  async findBusinessEventLogs(filters: LogFilterOptions = {}): Promise<PaginatedResult<BusinessEventLog>> {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      userId,
      eventType,
      entityType,
    } = filters;

    const where: FindOptionsWhere<BusinessEventLog> = {};

    if (startDate && endDate) {
      where.timestamp = Between(startDate, endDate);
    } else if (startDate) {
      where.timestamp = Between(startDate, new Date());
    }

    if (userId) {
      where.userId = userId;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    const [data, total] = await this.businessEventLogRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find performance logs with filtering and pagination.
   * @param filters - Filter options
   * @returns Paginated performance logs
   */
  async findPerformanceLogs(filters: LogFilterOptions = {}): Promise<PaginatedResult<PerformanceLog>> {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      operationName,
      operationType,
      minDuration,
      maxDuration,
    } = filters;

    const where: FindOptionsWhere<PerformanceLog> = {};

    if (startDate && endDate) {
      where.timestamp = Between(startDate, endDate);
    } else if (startDate) {
      where.timestamp = Between(startDate, new Date());
    }

    if (operationName) {
      where.operationName = Like(`%${operationName}%`);
    }

    if (operationType) {
      where.operationType = operationType;
    }

    if (minDuration !== undefined || maxDuration !== undefined) {
      if (minDuration !== undefined && maxDuration !== undefined) {
        where.durationMs = Between(minDuration, maxDuration);
      } else if (minDuration !== undefined) {
        where.durationMs = Between(minDuration, 999999999);
      } else if (maxDuration !== undefined) {
        where.durationMs = Between(0, maxDuration);
      }
    }

    const [data, total] = await this.performanceLogRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find logs by generic criteria with filtering and pagination.
   * @param logType - Type of logs to find
   * @param filters - Filter options
   * @returns Paginated logs
   */
  async findLogs(
    logType: 'application' | 'request' | 'business-event' | 'performance',
    filters: LogFilterOptions = {},
  ): Promise<PaginatedResult<any>> {
    switch (logType) {
      case 'application':
        return await this.findApplicationLogs(filters);
      case 'request':
        return await this.findRequestLogs(filters);
      case 'business-event':
        return await this.findBusinessEventLogs(filters);
      case 'performance':
        return await this.findPerformanceLogs(filters);
      default:
        throw new Error(`Unsupported log type: ${logType}`);
    }
  }

  /**
   * Get log statistics for dashboard.
   * @param startDate - Start date for statistics
   * @param endDate - End date for statistics
   * @returns Log statistics
   */
  async getLogStatistics(startDate: Date, endDate: Date): Promise<{
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    criticalCount: number;
    averageResponseTime: number;
    topErrors: Array<{ message: string; count: number }>;
    topOperations: Array<{ operation: string; count: number; avgDuration: number }>;
  }> {
    // Get total logs count
    const totalLogs = await this.applicationLogRepository.count({
      where: {
        timestamp: Between(startDate, endDate),
      },
    });

    // Get logs by level
    const [errorCount, warningCount, infoCount, criticalCount] = await Promise.all([
      this.applicationLogRepository.count({
        where: { level: 'error', timestamp: Between(startDate, endDate) },
      }),
      this.applicationLogRepository.count({
        where: { level: 'warn', timestamp: Between(startDate, endDate) },
      }),
      this.applicationLogRepository.count({
        where: { level: 'info', timestamp: Between(startDate, endDate) },
      }),
      this.applicationLogRepository.count({
        where: { level: 'critical', timestamp: Between(startDate, endDate) },
      }),
    ]);

    // Get average response time
    const avgResponseTimeResult = await this.requestLogRepository
      .createQueryBuilder('request_log')
      .select('AVG(request_log.responseTimeMs)', 'avgResponseTime')
      .where('request_log.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('request_log.responseTimeMs IS NOT NULL')
      .getRawOne();

    const averageResponseTime = avgResponseTimeResult?.avgResponseTime || 0;

    // Get top errors
    const topErrors = await this.applicationLogRepository
      .createQueryBuilder('app_log')
      .select('app_log.message', 'message')
      .addSelect('COUNT(*)', 'count')
      .where('app_log.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('app_log.level IN (:...levels)', { levels: ['error', 'critical'] })
      .groupBy('app_log.message')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Get top operations
    const topOperations = await this.performanceLogRepository
      .createQueryBuilder('perf_log')
      .select('perf_log.operationName', 'operation')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(perf_log.durationMs)', 'avgDuration')
      .where('perf_log.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('perf_log.operationName')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalLogs,
      errorCount,
      warningCount,
      infoCount,
      criticalCount,
      averageResponseTime: Math.round(averageResponseTime),
      topErrors: topErrors.map(item => ({
        message: item.message,
        count: parseInt(item.count),
      })),
      topOperations: topOperations.map(item => ({
        operation: item.operation,
        count: parseInt(item.count),
        avgDuration: Math.round(item.avgDuration),
      })),
    };
  }

  /**
   * Clean up old logs based on retention policy.
   * @param retentionDays - Number of days to retain logs
   * @returns Number of deleted logs
   */
  async cleanupOldLogs(retentionDays: number = 30): Promise<{
    applicationLogsDeleted: number;
    requestLogsDeleted: number;
    businessEventLogsDeleted: number;
    performanceLogsDeleted: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const [applicationLogsDeleted, requestLogsDeleted, businessEventLogsDeleted, performanceLogsDeleted] = await Promise.all([
      this.applicationLogRepository
        .createQueryBuilder()
        .delete()
        .where('timestamp < :cutoffDate', { cutoffDate })
        .execute()
        .then(result => result.affected || 0),
      this.requestLogRepository
        .createQueryBuilder()
        .delete()
        .where('timestamp < :cutoffDate', { cutoffDate })
        .execute()
        .then(result => result.affected || 0),
      this.businessEventLogRepository
        .createQueryBuilder()
        .delete()
        .where('timestamp < :cutoffDate', { cutoffDate })
        .execute()
        .then(result => result.affected || 0),
      this.performanceLogRepository
        .createQueryBuilder()
        .delete()
        .where('timestamp < :cutoffDate', { cutoffDate })
        .execute()
        .then(result => result.affected || 0),
    ]);

    return {
      applicationLogsDeleted,
      requestLogsDeleted,
      businessEventLogsDeleted,
      performanceLogsDeleted,
    };
  }
}
