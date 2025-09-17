import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ApplicationLog } from '../entities/application-log.entity';
import { RequestLog } from '../entities/request-log.entity';
import { BusinessEventLog } from '../entities/business-event-log.entity';
import { PerformanceLog } from '../entities/performance-log.entity';

export interface LogSummaryOptions {
  startDate: Date;
  endDate: Date;
  summaryType: 'daily' | 'weekly' | 'monthly' | 'custom';
  filters?: {
    levels?: string[];
    modules?: string[];
    userIds?: string[];
    requestIds?: string[];
  };
}

export interface LogSummary {
  id: string;
  period: string;
  startDate: Date;
  endDate: Date;
  summaryType: string;
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  debugCount: number;
  criticalCount: number;
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
  trends: {
    errorTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'degrading' | 'stable';
    userActivityTrend: 'increasing' | 'decreasing' | 'stable';
  };
  insights: Array<{
    type: 'warning' | 'info' | 'success' | 'error';
    message: string;
    severity: 'low' | 'medium' | 'high';
    recommendation?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LogSummaryComparison {
  current: LogSummary;
  previous: LogSummary;
  changes: {
    totalLogs: { current: number; previous: number; change: number; percentage: number };
    errorRate: { current: number; previous: number; change: number; percentage: number };
    averageResponseTime: { current: number; previous: number; change: number; percentage: number };
    uniqueUsers: { current: number; previous: number; change: number; percentage: number };
  };
  insights: Array<{
    type: 'improvement' | 'degradation' | 'stable';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

@Injectable()
export class LogSummarizationService {
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
   * Generate log summary for a specific period
   */
  async generateSummary(options: LogSummaryOptions): Promise<LogSummary> {
    const { startDate, endDate, summaryType, filters } = options;
    
    // Get logs for the period
    const applicationLogs = await this.getApplicationLogs(startDate, endDate, filters);
    const requestLogs = await this.getRequestLogs(startDate, endDate, filters);
    const performanceLogs = await this.getPerformanceLogs(startDate, endDate, filters);

    // Calculate summary data
    const summary = this.calculateSummaryData(
      applicationLogs,
      requestLogs,
      performanceLogs,
      startDate,
      endDate,
      summaryType
    );

    return summary;
  }

  /**
   * Generate multiple summaries for comparison
   */
  async generateComparisonSummaries(
    currentOptions: LogSummaryOptions,
    previousOptions: LogSummaryOptions
  ): Promise<LogSummaryComparison> {
    const current = await this.generateSummary(currentOptions);
    const previous = await this.generateSummary(previousOptions);

    const comparison = this.calculateComparison(current, previous);

    return comparison;
  }

  /**
   * Generate trend analysis for a period
   */
  async generateTrendAnalysis(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' = 'day'
  ): Promise<any> {
    const period = this.calculatePeriodLength(startDate, endDate, granularity);
    const summaries: LogSummary[] = [];

    for (let i = 0; i < period; i++) {
      const periodStart = this.getPeriodStart(startDate, granularity, i);
      const periodEnd = this.getPeriodEnd(periodStart, granularity);

      const summary = await this.generateSummary({
        startDate: periodStart,
        endDate: periodEnd,
        summaryType: granularity === 'hour' ? 'daily' : granularity === 'day' ? 'daily' : granularity === 'week' ? 'weekly' : 'monthly',
      });

      summaries.push(summary);
    }

    return this.analyzeTrends(summaries);
  }

  /**
   * Generate insights and recommendations
   */
  async generateInsights(summary: LogSummary): Promise<Array<{
    type: 'warning' | 'info' | 'success' | 'error';
    message: string;
    severity: 'low' | 'medium' | 'high';
    recommendation?: string;
  }>> {
    const insights: Array<{
      type: 'warning' | 'info' | 'success' | 'error';
      message: string;
      severity: 'low' | 'medium' | 'high';
      recommendation?: string;
    }> = [];

    // Error rate insights
    if (summary.errorRate > 10) {
      insights.push({
        type: 'error',
        message: `Critical error rate: ${summary.errorRate.toFixed(2)}%`,
        severity: 'high',
        recommendation: 'Investigate error patterns and implement fixes immediately',
      });
    } else if (summary.errorRate > 5) {
      insights.push({
        type: 'warning',
        message: `High error rate: ${summary.errorRate.toFixed(2)}%`,
        severity: 'medium',
        recommendation: 'Monitor error trends and consider preventive measures',
      });
    } else if (summary.errorRate < 1) {
      insights.push({
        type: 'success',
        message: `Excellent error rate: ${summary.errorRate.toFixed(2)}%`,
        severity: 'low',
        recommendation: 'Maintain current error handling practices',
      });
    }

    // Performance insights
    if (summary.averageResponseTime > 2000) {
      insights.push({
        type: 'error',
        message: `Critical performance issue: ${summary.averageResponseTime.toFixed(2)}ms average response time`,
        severity: 'high',
        recommendation: 'Optimize database queries and implement caching',
      });
    } else if (summary.averageResponseTime > 1000) {
      insights.push({
        type: 'warning',
        message: `Performance degradation: ${summary.averageResponseTime.toFixed(2)}ms average response time`,
        severity: 'medium',
        recommendation: 'Review slow queries and consider performance optimizations',
      });
    }

    // Memory usage insights
    if (summary.performanceMetrics.memoryUsage.avg > 1000) {
      insights.push({
        type: 'warning',
        message: `High memory usage: ${summary.performanceMetrics.memoryUsage.avg.toFixed(2)}MB average`,
        severity: 'medium',
        recommendation: 'Monitor memory leaks and consider memory optimization',
      });
    }

    // CPU usage insights
    if (summary.performanceMetrics.cpuUsage.avg > 80) {
      insights.push({
        type: 'warning',
        message: `High CPU usage: ${summary.performanceMetrics.cpuUsage.avg.toFixed(2)}% average`,
        severity: 'medium',
        recommendation: 'Investigate CPU-intensive operations and optimize algorithms',
      });
    }

    // User activity insights
    if (summary.uniqueUsers > 1000) {
      insights.push({
        type: 'info',
        message: `High user activity: ${summary.uniqueUsers} unique users`,
        severity: 'low',
        recommendation: 'Consider scaling infrastructure for high user load',
      });
    }

    return insights;
  }

  /**
   * Get application logs with filters
   */
  private async getApplicationLogs(
    startDate: Date,
    endDate: Date,
    filters?: any
  ): Promise<ApplicationLog[]> {
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

    return this.applicationLogRepository.find({
      where: whereConditions,
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get request logs with filters
   */
  private async getRequestLogs(
    startDate: Date,
    endDate: Date,
    filters?: any
  ): Promise<RequestLog[]> {
    const whereConditions: any = {
      createdAt: Between(startDate, endDate),
    };

    if (filters?.requestIds) {
      whereConditions.requestId = In(filters.requestIds);
    }

    return this.requestLogRepository.find({
      where: whereConditions,
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get performance logs with filters
   */
  private async getPerformanceLogs(
    startDate: Date,
    endDate: Date,
    filters?: any
  ): Promise<PerformanceLog[]> {
    const whereConditions: any = {
      createdAt: Between(startDate, endDate),
    };

    return this.performanceLogRepository.find({
      where: whereConditions,
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Calculate summary data from logs
   */
  private calculateSummaryData(
    applicationLogs: ApplicationLog[],
    requestLogs: RequestLog[],
    performanceLogs: PerformanceLog[],
    startDate: Date,
    endDate: Date,
    summaryType: string
  ): LogSummary {
    const totalLogs = applicationLogs.length;
    const errorCount = applicationLogs.filter(log => log.level === 'error').length;
    const warningCount = applicationLogs.filter(log => log.level === 'warn').length;
    const infoCount = applicationLogs.filter(log => log.level === 'info').length;
    const debugCount = applicationLogs.filter(log => log.level === 'debug').length;
    const criticalCount = applicationLogs.filter(log => log.level === 'critical').length;

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

    // Calculate trends (simplified for now)
    const trends = {
      errorTrend: 'stable' as const,
      performanceTrend: 'stable' as const,
      userActivityTrend: 'stable' as const,
    };

    return {
      id: this.generateSummaryId(startDate, endDate, summaryType),
      period: this.formatPeriod(startDate, endDate),
      startDate,
      endDate,
      summaryType,
      totalLogs,
      errorCount,
      warningCount,
      infoCount,
      debugCount,
      criticalCount,
      errorRate,
      averageResponseTime,
      uniqueUsers,
      uniqueRequests,
      topErrors,
      topModules,
      performanceMetrics,
      trends,
      insights: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(requestLogs: RequestLog[], performanceLogs: PerformanceLog[]): any {
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
   * Calculate comparison between two summaries
   */
  private calculateComparison(current: LogSummary, previous: LogSummary): LogSummaryComparison {
    const changes = {
      totalLogs: {
        current: current.totalLogs,
        previous: previous.totalLogs,
        change: current.totalLogs - previous.totalLogs,
        percentage: previous.totalLogs > 0 ? ((current.totalLogs - previous.totalLogs) / previous.totalLogs) * 100 : 0,
      },
      errorRate: {
        current: current.errorRate,
        previous: previous.errorRate,
        change: current.errorRate - previous.errorRate,
        percentage: previous.errorRate > 0 ? ((current.errorRate - previous.errorRate) / previous.errorRate) * 100 : 0,
      },
      averageResponseTime: {
        current: current.averageResponseTime,
        previous: previous.averageResponseTime,
        change: current.averageResponseTime - previous.averageResponseTime,
        percentage: previous.averageResponseTime > 0 ? ((current.averageResponseTime - previous.averageResponseTime) / previous.averageResponseTime) * 100 : 0,
      },
      uniqueUsers: {
        current: current.uniqueUsers,
        previous: previous.uniqueUsers,
        change: current.uniqueUsers - previous.uniqueUsers,
        percentage: previous.uniqueUsers > 0 ? ((current.uniqueUsers - previous.uniqueUsers) / previous.uniqueUsers) * 100 : 0,
      },
    };

    const insights = this.generateComparisonInsights(changes);

    return {
      current,
      previous,
      changes,
      insights,
    };
  }

  /**
   * Generate comparison insights
   */
  private generateComparisonInsights(changes: any): Array<{
    type: 'improvement' | 'degradation' | 'stable';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }> {
    const insights: Array<{
      type: 'improvement' | 'degradation' | 'stable';
      message: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    // Error rate comparison
    if (changes.errorRate.change > 5) {
      insights.push({
        type: 'degradation',
        message: `Error rate increased by ${changes.errorRate.percentage.toFixed(2)}%`,
        severity: 'high',
      });
    } else if (changes.errorRate.change < -5) {
      insights.push({
        type: 'improvement',
        message: `Error rate decreased by ${Math.abs(changes.errorRate.percentage).toFixed(2)}%`,
        severity: 'medium',
      });
    }

    // Performance comparison
    if (changes.averageResponseTime.change > 500) {
      insights.push({
        type: 'degradation',
        message: `Response time increased by ${changes.averageResponseTime.percentage.toFixed(2)}%`,
        severity: 'high',
      });
    } else if (changes.averageResponseTime.change < -500) {
      insights.push({
        type: 'improvement',
        message: `Response time improved by ${Math.abs(changes.averageResponseTime.percentage).toFixed(2)}%`,
        severity: 'medium',
      });
    }

    // User activity comparison
    if (changes.uniqueUsers.change > 50) {
      insights.push({
        type: 'improvement',
        message: `User activity increased by ${changes.uniqueUsers.percentage.toFixed(2)}%`,
        severity: 'low',
      });
    } else if (changes.uniqueUsers.change < -50) {
      insights.push({
        type: 'degradation',
        message: `User activity decreased by ${Math.abs(changes.uniqueUsers.percentage).toFixed(2)}%`,
        severity: 'medium',
      });
    }

    return insights;
  }

  /**
   * Calculate period length for trend analysis
   */
  private calculatePeriodLength(startDate: Date, endDate: Date, granularity: string): number {
    const diffMs = endDate.getTime() - startDate.getTime();
    
    switch (granularity) {
      case 'hour':
        return Math.ceil(diffMs / (1000 * 60 * 60));
      case 'day':
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      case 'week':
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
      default:
        return 1;
    }
  }

  /**
   * Get period start date
   */
  private getPeriodStart(baseDate: Date, granularity: string, offset: number): Date {
    const date = new Date(baseDate);
    
    switch (granularity) {
      case 'hour':
        date.setHours(date.getHours() + offset);
        break;
      case 'day':
        date.setDate(date.getDate() + offset);
        break;
      case 'week':
        date.setDate(date.getDate() + (offset * 7));
        break;
    }
    
    return date;
  }

  /**
   * Get period end date
   */
  private getPeriodEnd(startDate: Date, granularity: string): Date {
    const endDate = new Date(startDate);
    
    switch (granularity) {
      case 'hour':
        endDate.setHours(endDate.getHours() + 1);
        break;
      case 'day':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'week':
        endDate.setDate(endDate.getDate() + 7);
        break;
    }
    
    return endDate;
  }

  /**
   * Analyze trends from multiple summaries
   */
  private analyzeTrends(summaries: LogSummary[]): any {
    if (summaries.length < 2) {
      return { trend: 'insufficientData' };
    }

    const errorRates = summaries.map(s => s.errorRate);
    const responseTimes = summaries.map(s => s.averageResponseTime);
    const userCounts = summaries.map(s => s.uniqueUsers);

    return {
      errorTrend: this.calculateTrend(errorRates),
      performanceTrend: this.calculateTrend(responseTimes),
      userActivityTrend: this.calculateTrend(userCounts),
      summaries,
    };
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate summary ID
   */
  private generateSummaryId(startDate: Date, endDate: Date, summaryType: string): string {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return `${summaryType}_${start}_${end}`;
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
