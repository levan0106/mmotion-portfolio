import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ApplicationLog } from '../entities/application-log.entity';
import { RequestLog } from '../entities/request-log.entity';
import { BusinessEventLog } from '../entities/business-event-log.entity';
import { PerformanceLog } from '../entities/performance-log.entity';

export interface LogAggregationOptions {
  startDate: Date;
  endDate: Date;
  groupBy: 'hour' | 'day' | 'week' | 'month';
  filters?: {
    levels?: string[];
    modules?: string[];
    userIds?: string[];
    requestIds?: string[];
  };
}

export interface AggregatedLogData {
  period: string;
  timestamp: Date;
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  debugCount: number;
  criticalCount: number;
  averageResponseTime?: number;
  uniqueUsers: number;
  uniqueRequests: number;
  topModules: Array<{ module: string; count: number }>;
  topErrors: Array<{ error: string; count: number }>;
}

export interface LogSummary {
  period: string;
  startDate: Date;
  endDate: Date;
  totalLogs: number;
  errorRate: number;
  averageResponseTime: number;
  uniqueUsers: number;
  uniqueRequests: number;
  topErrors: Array<{ error: string; count: number; percentage: number }>;
  topModules: Array<{ module: string; count: number; percentage: number }>;
  performanceMetrics: {
    slowestRequests: Array<{ endpoint: string; avgTime: number; count: number }>;
    memoryUsage: { avg: number; max: number; min: number };
    cpuUsage: { avg: number; max: number; min: number };
  };
}

@Injectable()
export class LogAggregationService {
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
   * Aggregate logs by time period
   */
  async aggregateLogs(options: LogAggregationOptions): Promise<AggregatedLogData[]> {
    const { startDate, endDate, groupBy, filters } = options;
    
    // Build base query conditions
    const whereConditions: any = {
      createdAt: Between(startDate, endDate),
    };

    if (filters?.levels) {
      whereConditions.level = In(filters.levels);
    }
    if (filters?.modules) {
      whereConditions.moduleName = In(filters.modules);
    }
    if (filters?.userIds) {
      whereConditions.userId = In(filters.userIds);
    }
    if (filters?.requestIds) {
      whereConditions.requestId = In(filters.requestIds);
    }

    // Get application logs
    const applicationLogs = await this.applicationLogRepository.find({
      where: whereConditions,
      order: { createdAt: 'ASC' },
    });

    // Get request logs for response time data
    const requestLogs = await this.requestLogRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        ...(filters?.requestIds && { requestId: In(filters.requestIds) }),
      },
      order: { createdAt: 'ASC' },
    });

    // Group logs by time period
    const groupedLogs = this.groupLogsByPeriod(applicationLogs, groupBy);
    const groupedRequestLogs = this.groupLogsByPeriod(requestLogs, groupBy);

    // Calculate aggregated data for each period
    const aggregatedData: AggregatedLogData[] = [];

    for (const [period, logs] of groupedLogs.entries()) {
      const requestLogsForPeriod = groupedRequestLogs.get(period) || [];
      
      const aggregated = this.calculateAggregatedData(period, logs, requestLogsForPeriod);
      aggregatedData.push(aggregated);
    }

    return aggregatedData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Generate log summary for a time period
   */
  async generateLogSummary(options: LogAggregationOptions): Promise<LogSummary> {
    const { startDate, endDate } = options;
    
    // Get all logs for the period
    const applicationLogs = await this.applicationLogRepository.find({
      where: { createdAt: Between(startDate, endDate) },
    });

    const requestLogs = await this.requestLogRepository.find({
      where: { createdAt: Between(startDate, endDate) },
    });

    const performanceLogs = await this.performanceLogRepository.find({
      where: { createdAt: Between(startDate, endDate) },
    });

    // Calculate summary data
    const totalLogs = applicationLogs.length;
    const errorCount = applicationLogs.filter(log => log.level === 'error' || log.level === 'critical').length;
    const errorRate = totalLogs > 0 ? (errorCount / totalLogs) * 100 : 0;

    const averageResponseTime = requestLogs.length > 0 
      ? requestLogs.reduce((sum, log) => sum + (log.responseTimeMs || 0), 0) / requestLogs.length
      : 0;

    const uniqueUsers = new Set(applicationLogs.map(log => log.userId).filter(Boolean)).size;
    const uniqueRequests = new Set(applicationLogs.map(log => log.requestId).filter(Boolean)).size;

    // Calculate top errors
    const errorCounts = new Map<string, number>();
    applicationLogs
      .filter(log => log.level === 'error' || log.level === 'critical')
      .forEach(log => {
        const error = log.message || 'Unknown error';
        errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
      });

    const topErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({
        error,
        count,
        percentage: totalLogs > 0 ? (count / totalLogs) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate top modules
    const moduleCounts = new Map<string, number>();
    applicationLogs.forEach(log => {
      const module = log.moduleName || 'Unknown';
      moduleCounts.set(module, (moduleCounts.get(module) || 0) + 1);
    });

    const topModules = Array.from(moduleCounts.entries())
      .map(([module, count]) => ({
        module,
        count,
        percentage: totalLogs > 0 ? (count / totalLogs) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(requestLogs, performanceLogs);

    return {
      period: this.formatPeriod(startDate, endDate),
      startDate,
      endDate,
      totalLogs,
      errorRate,
      averageResponseTime,
      uniqueUsers,
      uniqueRequests,
      topErrors,
      topModules,
      performanceMetrics,
    };
  }

  /**
   * Get log analytics data
   */
  async getLogAnalytics(options: LogAggregationOptions): Promise<any> {
    const summary = await this.generateLogSummary(options);
    const aggregatedData = await this.aggregateLogs(options);

    return {
      summary,
      trends: aggregatedData,
      insights: this.generateInsights(summary, aggregatedData),
    };
  }

  /**
   * Group logs by time period
   */
  private groupLogsByPeriod(logs: any[], groupBy: string): Map<string, any[]> {
    const grouped = new Map<string, any[]>();

    logs.forEach(log => {
      const period = this.getPeriodKey(log.createdAt, groupBy);
      if (!grouped.has(period)) {
        grouped.set(period, []);
      }
      grouped.get(period)!.push(log);
    });

    return grouped;
  }

  /**
   * Get period key for grouping
   */
  private getPeriodKey(date: Date, groupBy: string): string {
    const d = new Date(date);
    
    switch (groupBy) {
      case 'hour':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
      case 'day':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate()) / 7)).padStart(2, '0')}`;
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      default:
        return d.toISOString().split('T')[0];
    }
  }

  /**
   * Calculate aggregated data for a period
   */
  private calculateAggregatedData(period: string, logs: any[], requestLogs: any[]): AggregatedLogData {
    const totalLogs = logs.length;
    const errorCount = logs.filter(log => log.level === 'error').length;
    const warningCount = logs.filter(log => log.level === 'warn').length;
    const infoCount = logs.filter(log => log.level === 'info').length;
    const debugCount = logs.filter(log => log.level === 'debug').length;
    const criticalCount = logs.filter(log => log.level === 'critical').length;

    const averageResponseTime = requestLogs.length > 0
      ? requestLogs.reduce((sum, log) => sum + (log.responseTimeMs || 0), 0) / requestLogs.length
      : undefined;

    const uniqueUsers = new Set(logs.map(log => log.userId).filter(Boolean)).size;
    const uniqueRequests = new Set(logs.map(log => log.requestId).filter(Boolean)).size;

    // Calculate top modules
    const moduleCounts = new Map<string, number>();
    logs.forEach(log => {
      const module = log.moduleName || 'Unknown';
      moduleCounts.set(module, (moduleCounts.get(module) || 0) + 1);
    });

    const topModules = Array.from(moduleCounts.entries())
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate top errors
    const errorCounts = new Map<string, number>();
    logs
      .filter(log => log.level === 'error' || log.level === 'critical')
      .forEach(log => {
        const error = log.message || 'Unknown error';
        errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
      });

    const topErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      period,
      timestamp: new Date(period),
      totalLogs,
      errorCount,
      warningCount,
      infoCount,
      debugCount,
      criticalCount,
      averageResponseTime,
      uniqueUsers,
      uniqueRequests,
      topModules,
      topErrors,
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(requestLogs: any[], performanceLogs: any[]): any {
    // Calculate slowest requests
    const endpointTimes = new Map<string, { totalTime: number; count: number }>();
    requestLogs.forEach(log => {
      const endpoint = log.url || 'Unknown';
      const time = log.responseTimeMs || 0;
      const existing = endpointTimes.get(endpoint) || { totalTime: 0, count: 0 };
      endpointTimes.set(endpoint, {
        totalTime: existing.totalTime + time,
        count: existing.count + 1,
      });
    });

    const slowestRequests = Array.from(endpointTimes.entries())
      .map(([endpoint, data]) => ({
        endpoint,
        avgTime: data.count > 0 ? data.totalTime / data.count : 0,
        count: data.count,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);

    // Calculate memory usage
    const memoryUsages = performanceLogs
      .filter(log => log.memoryUsageMb !== null && log.memoryUsageMb !== undefined)
      .map(log => log.memoryUsageMb);

    const memoryUsage = memoryUsages.length > 0 ? {
      avg: memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length,
      max: Math.max(...memoryUsages),
      min: Math.min(...memoryUsages),
    } : { avg: 0, max: 0, min: 0 };

    // Calculate CPU usage
    const cpuUsages = performanceLogs
      .filter(log => log.cpuUsagePercent !== null && log.cpuUsagePercent !== undefined)
      .map(log => log.cpuUsagePercent);

    const cpuUsage = cpuUsages.length > 0 ? {
      avg: cpuUsages.reduce((sum, usage) => sum + usage, 0) / cpuUsages.length,
      max: Math.max(...cpuUsages),
      min: Math.min(...cpuUsages),
    } : { avg: 0, max: 0, min: 0 };

    return {
      slowestRequests,
      memoryUsage,
      cpuUsage,
    };
  }

  /**
   * Generate insights from log data
   */
  private generateInsights(summary: LogSummary, trends: AggregatedLogData[]): any[] {
    const insights: any[] = [];

    // Error rate insight
    if (summary.errorRate > 5) {
      insights.push({
        type: 'warning',
        message: `High error rate detected: ${summary.errorRate.toFixed(2)}%`,
        severity: summary.errorRate > 10 ? 'high' : 'medium',
      });
    }

    // Response time insight
    if (summary.averageResponseTime > 1000) {
      insights.push({
        type: 'performance',
        message: `Slow average response time: ${summary.averageResponseTime.toFixed(2)}ms`,
        severity: summary.averageResponseTime > 2000 ? 'high' : 'medium',
      });
    }

    // Trend analysis
    if (trends.length > 1) {
      const latest = trends[trends.length - 1];
      const previous = trends[trends.length - 2];
      
      if (latest.errorCount > previous.errorCount * 1.5) {
        insights.push({
          type: 'trend',
          message: 'Error count is increasing significantly',
          severity: 'medium',
        });
      }
    }

    return insights;
  }

  /**
   * Format period string
   */
  private formatPeriod(startDate: Date, endDate: Date): string {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return `${start} to ${end}`;
  }
}
