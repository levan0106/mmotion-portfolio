import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ApplicationLog } from '../entities/application-log.entity';
import { RequestLog } from '../entities/request-log.entity';
import { BusinessEventLog } from '../entities/business-event-log.entity';
import { PerformanceLog } from '../entities/performance-log.entity';
import { LogAggregationService } from './log-aggregation.service';
import { LogSummarizationService } from './log-summarization.service';

export interface LogAnalyticsOptions {
  startDate: Date;
  endDate: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
  filters?: {
    levels?: string[];
    modules?: string[];
    userIds?: string[];
    requestIds?: string[];
  };
}

export interface LogAnalytics {
  summary: {
    totalLogs: number;
    errorRate: number;
    averageResponseTime: number;
    uniqueUsers: number;
    uniqueRequests: number;
    topErrors: Array<{ error: string; count: number; percentage: number }>;
    topModules: Array<{ module: string; count: number; percentage: number }>;
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
  patterns: {
    errorPatterns: Array<{
      pattern: string;
      frequency: number;
      severity: 'low' | 'medium' | 'high';
      examples: string[];
    }>;
    performancePatterns: Array<{
      pattern: string;
      impact: 'low' | 'medium' | 'high';
      frequency: number;
      examples: string[];
    }>;
    userBehaviorPatterns: Array<{
      pattern: string;
      frequency: number;
      impact: 'low' | 'medium' | 'high';
      examples: string[];
    }>;
  };
  recommendations: Array<{
    category: 'performance' | 'errorHandling' | 'userExperience' | 'security';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  timeSeries: Array<{
    timestamp: Date;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    averageResponseTime: number;
    uniqueUsers: number;
    uniqueRequests: number;
  }>;
}

export interface LogAnalyticsComparison {
  current: LogAnalytics;
  previous: LogAnalytics;
  changes: {
    errorRate: { current: number; previous: number; change: number; percentage: number };
    performance: { current: number; previous: number; change: number; percentage: number };
    userActivity: { current: number; previous: number; change: number; percentage: number };
  };
  insights: Array<{
    type: 'improvement' | 'degradation' | 'stable';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

@Injectable()
export class LogAnalyticsService {
  constructor(
    @InjectRepository(ApplicationLog)
    private readonly applicationLogRepository: Repository<ApplicationLog>,
    @InjectRepository(RequestLog)
    private readonly requestLogRepository: Repository<RequestLog>,
    @InjectRepository(BusinessEventLog)
    private readonly businessEventLogRepository: Repository<BusinessEventLog>,
    @InjectRepository(PerformanceLog)
    private readonly performanceLogRepository: Repository<PerformanceLog>,
    private readonly logAggregationService: LogAggregationService,
    private readonly logSummarizationService: LogSummarizationService,
  ) {}

  /**
   * Generate comprehensive log analytics
   */
  async generateAnalytics(options: LogAnalyticsOptions): Promise<LogAnalytics> {
    const { startDate, endDate, granularity, filters } = options;

    // Get aggregated data
    const aggregatedData = await this.logAggregationService.aggregateLogs({
      startDate,
      endDate,
      groupBy: granularity,
      filters,
    });

    // Get summary data
    const summaryData = await this.logSummarizationService.generateSummary({
      startDate,
      endDate,
      summaryType: granularity === 'hour' ? 'daily' : granularity === 'day' ? 'daily' : granularity === 'week' ? 'weekly' : 'monthly',
      filters,
    });

    // Generate insights
    const insights = await this.generateInsights(summaryData, aggregatedData);

    // Analyze patterns
    const patterns = await this.analyzePatterns(startDate, endDate, filters);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(summaryData, patterns);

    // Create time series data
    const timeSeries = this.createTimeSeries(aggregatedData);

    // Calculate trends
    const trends = this.calculateTrends(aggregatedData);

    return {
      summary: {
        totalLogs: summaryData.totalLogs,
        errorRate: summaryData.errorRate,
        averageResponseTime: summaryData.averageResponseTime,
        uniqueUsers: summaryData.uniqueUsers,
        uniqueRequests: summaryData.uniqueRequests,
        topErrors: summaryData.topErrors,
        topModules: summaryData.topModules,
      },
      trends,
      insights,
      patterns,
      recommendations,
      timeSeries,
    };
  }

  /**
   * Generate analytics comparison between two periods
   */
  async generateComparisonAnalytics(
    currentOptions: LogAnalyticsOptions,
    previousOptions: LogAnalyticsOptions
  ): Promise<LogAnalyticsComparison> {
    const current = await this.generateAnalytics(currentOptions);
    const previous = await this.generateAnalytics(previousOptions);

    const changes = {
      errorRate: {
        current: current.summary.errorRate,
        previous: previous.summary.errorRate,
        change: current.summary.errorRate - previous.summary.errorRate,
        percentage: previous.summary.errorRate > 0 
          ? ((current.summary.errorRate - previous.summary.errorRate) / previous.summary.errorRate) * 100 
          : 0,
      },
      performance: {
        current: current.summary.averageResponseTime,
        previous: previous.summary.averageResponseTime,
        change: current.summary.averageResponseTime - previous.summary.averageResponseTime,
        percentage: previous.summary.averageResponseTime > 0 
          ? ((current.summary.averageResponseTime - previous.summary.averageResponseTime) / previous.summary.averageResponseTime) * 100 
          : 0,
      },
      userActivity: {
        current: current.summary.uniqueUsers,
        previous: previous.summary.uniqueUsers,
        change: current.summary.uniqueUsers - previous.summary.uniqueUsers,
        percentage: previous.summary.uniqueUsers > 0 
          ? ((current.summary.uniqueUsers - previous.summary.uniqueUsers) / previous.summary.uniqueUsers) * 100 
          : 0,
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
   * Generate insights from summary and aggregated data
   */
  private async generateInsights(summary: any, aggregatedData: any[]): Promise<Array<{
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

    // Trend insights
    if (aggregatedData.length > 1) {
      const latest = aggregatedData[aggregatedData.length - 1];
      const previous = aggregatedData[aggregatedData.length - 2];
      
      if (latest.errorCount > previous.errorCount * 1.5) {
        insights.push({
          type: 'warning',
          message: 'Error count is increasing significantly',
          severity: 'medium',
          recommendation: 'Investigate recent changes that might have caused the increase',
        });
      }
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
   * Analyze patterns in log data
   */
  private async analyzePatterns(
    startDate: Date,
    endDate: Date,
    filters?: any
  ): Promise<any> {
    const applicationLogs = await this.getApplicationLogs(startDate, endDate, filters);
    const requestLogs = await this.getRequestLogs(startDate, endDate, filters);
    const performanceLogs = await this.getPerformanceLogs(startDate, endDate, filters);

    return {
      errorPatterns: this.analyzeErrorPatterns(applicationLogs),
      performancePatterns: this.analyzePerformancePatterns(requestLogs, performanceLogs),
      userBehaviorPatterns: this.analyzeUserBehaviorPatterns(applicationLogs),
    };
  }

  /**
   * Analyze error patterns
   */
  private analyzeErrorPatterns(logs: ApplicationLog[]): Array<{
    pattern: string;
    frequency: number;
    severity: 'low' | 'medium' | 'high';
    examples: string[];
  }> {
    const errorLogs = logs.filter(log => log.level === 'error' || log.level === 'critical');
    const patterns: Array<{
      pattern: string;
      frequency: number;
      severity: 'low' | 'medium' | 'high';
      examples: string[];
    }> = [];

    // Group by error message patterns
    const errorGroups = new Map<string, ApplicationLog[]>();
    errorLogs.forEach(log => {
      const pattern = this.extractErrorPattern(log.message);
      if (!errorGroups.has(pattern)) {
        errorGroups.set(pattern, []);
      }
      errorGroups.get(pattern)!.push(log);
    });

    // Analyze each pattern
    errorGroups.forEach((group, pattern) => {
      const frequency = group.length;
      const severity = this.determineErrorSeverity(frequency, group.length);
      const examples = group.slice(0, 3).map(log => log.message);

      patterns.push({
        pattern,
        frequency,
        severity,
        examples,
      });
    });

    return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  }

  /**
   * Analyze performance patterns
   */
  private analyzePerformancePatterns(requestLogs: RequestLog[], performanceLogs: PerformanceLog[]): Array<{
    pattern: string;
    impact: 'low' | 'medium' | 'high';
    frequency: number;
    examples: string[];
  }> {
    const patterns: Array<{
      pattern: string;
      impact: 'low' | 'medium' | 'high';
      frequency: number;
      examples: string[];
    }> = [];

    // Analyze slow requests
    const slowRequests = requestLogs.filter(log => (log.responseTimeMs || 0) > 1000);
    if (slowRequests.length > 0) {
      const endpointGroups = new Map<string, RequestLog[]>();
      slowRequests.forEach(log => {
        const endpoint = log.url || 'Unknown';
        if (!endpointGroups.has(endpoint)) {
          endpointGroups.set(endpoint, []);
        }
        endpointGroups.get(endpoint)!.push(log);
      });

      endpointGroups.forEach((group, endpoint) => {
        const avgTime = group.reduce((sum, log) => sum + (log.responseTimeMs || 0), 0) / group.length;
        const impact = avgTime > 2000 ? 'high' : avgTime > 1000 ? 'medium' : 'low';
        
        patterns.push({
          pattern: `Slow endpoint: ${endpoint}`,
          impact,
          frequency: group.length,
          examples: group.slice(0, 3).map(log => `${log.method} ${log.url} - ${log.responseTimeMs}ms`),
        });
      });
    }

    // Analyze high memory usage
    const highMemoryLogs = performanceLogs.filter(log => (log.memoryUsageMb || 0) > 500);
    if (highMemoryLogs.length > 0) {
      patterns.push({
        pattern: 'High memory usage',
        impact: 'medium',
        frequency: highMemoryLogs.length,
        examples: highMemoryLogs.slice(0, 3).map(log => `${log.operationName} - ${log.memoryUsageMb}MB`),
      });
    }

    // Analyze high CPU usage
    const highCpuLogs = performanceLogs.filter(log => (log.cpuUsagePercent || 0) > 80);
    if (highCpuLogs.length > 0) {
      patterns.push({
        pattern: 'High CPU usage',
        impact: 'high',
        frequency: highCpuLogs.length,
        examples: highCpuLogs.slice(0, 3).map(log => `${log.operationName} - ${log.cpuUsagePercent}%`),
      });
    }

    return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  }

  /**
   * Analyze user behavior patterns
   */
  private analyzeUserBehaviorPatterns(logs: ApplicationLog[]): Array<{
    pattern: string;
    frequency: number;
    impact: 'low' | 'medium' | 'high';
    examples: string[];
  }> {
    const patterns: Array<{
      pattern: string;
      frequency: number;
      impact: 'low' | 'medium' | 'high';
      examples: string[];
    }> = [];

    // Analyze user activity patterns
    const userGroups = new Map<string, ApplicationLog[]>();
    logs.forEach(log => {
      const userId = log.userId || 'anonymous';
      if (!userGroups.has(userId)) {
        userGroups.set(userId, []);
      }
      userGroups.get(userId)!.push(log);
    });

    // Find users with high activity
    userGroups.forEach((group, userId) => {
      if (group.length > 100) {
        patterns.push({
          pattern: `High user activity: ${userId}`,
          frequency: group.length,
          impact: 'low',
          examples: group.slice(0, 3).map(log => `${log.moduleName} - ${log.message}`),
        });
      }
    });

    // Analyze module usage patterns
    const moduleGroups = new Map<string, ApplicationLog[]>();
    logs.forEach(log => {
      const module = log.moduleName || 'Unknown';
      if (!moduleGroups.has(module)) {
        moduleGroups.set(module, []);
      }
      moduleGroups.get(module)!.push(log);
    });

    moduleGroups.forEach((group, module) => {
      if (group.length > 50) {
        patterns.push({
          pattern: `High module usage: ${module}`,
          frequency: group.length,
          impact: 'low',
          examples: group.slice(0, 3).map(log => log.message),
        });
      }
    });

    return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  }

  /**
   * Generate recommendations based on analytics
   */
  private async generateRecommendations(summary: any, patterns: any): Promise<Array<{
    category: 'performance' | 'errorHandling' | 'userExperience' | 'security';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }>> {
    const recommendations: Array<{
      category: 'performance' | 'errorHandling' | 'userExperience' | 'security';
      priority: 'low' | 'medium' | 'high';
      title: string;
      description: string;
      impact: string;
      effort: 'low' | 'medium' | 'high';
    }> = [];

    // Performance recommendations
    if (summary.averageResponseTime > 1000) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Optimize Database Queries',
        description: 'Implement query optimization and caching to reduce response times',
        impact: 'Significant improvement in user experience and system performance',
        effort: 'medium',
      });
    }

    // Error handling recommendations
    if (summary.errorRate > 5) {
      recommendations.push({
        category: 'errorHandling',
        priority: 'high',
        title: 'Improve Error Handling',
        description: 'Implement better error handling and monitoring to reduce error rates',
        impact: 'Reduced system downtime and improved reliability',
        effort: 'medium',
      });
    }

    // User experience recommendations
    if (summary.uniqueUsers > 1000) {
      recommendations.push({
        category: 'userExperience',
        priority: 'medium',
        title: 'Scale Infrastructure',
        description: 'Consider scaling infrastructure to handle high user load',
        impact: 'Better user experience during peak usage',
        effort: 'high',
      });
    }

    // Security recommendations
    const securityErrors = patterns.errorPatterns.filter((p: any) => 
      p.pattern.toLowerCase().includes('security') || 
      p.pattern.toLowerCase().includes('auth') ||
      p.pattern.toLowerCase().includes('permission')
    );

    if (securityErrors.length > 0) {
      recommendations.push({
        category: 'security',
        priority: 'high',
        title: 'Review Security Logs',
        description: 'Investigate security-related errors and implement additional security measures',
        impact: 'Improved system security and reduced security risks',
        effort: 'medium',
      });
    }

    return recommendations;
  }

  /**
   * Create time series data from aggregated data
   */
  private createTimeSeries(aggregatedData: any[]): Array<{
    timestamp: Date;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    averageResponseTime: number;
    uniqueUsers: number;
    uniqueRequests: number;
  }> {
    return aggregatedData.map(data => ({
      timestamp: data.timestamp,
      errorCount: data.errorCount,
      warningCount: data.warningCount,
      infoCount: data.infoCount,
      averageResponseTime: data.averageResponseTime || 0,
      uniqueUsers: data.uniqueUsers,
      uniqueRequests: data.uniqueRequests,
    }));
  }

  /**
   * Calculate trends from aggregated data
   */
  private calculateTrends(aggregatedData: any[]): {
    errorTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'degrading' | 'stable';
    userActivityTrend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (aggregatedData.length < 2) {
      return {
        errorTrend: 'stable',
        performanceTrend: 'stable',
        userActivityTrend: 'stable',
      };
    }

    const errorCounts = aggregatedData.map(d => d.errorCount);
    const responseTimes = aggregatedData.map(d => d.averageResponseTime || 0);
    const userCounts = aggregatedData.map(d => d.uniqueUsers);

    return {
      errorTrend: this.calculateTrend(errorCounts),
      performanceTrend: this.calculatePerformanceTrend(responseTimes),
      userActivityTrend: this.calculateTrend(userCounts),
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
   * Calculate performance trend (inverted logic)
   */
  private calculatePerformanceTrend(values: number[]): 'improving' | 'degrading' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 10) return 'degrading';
    if (change < -10) return 'improving';
    return 'stable';
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
    if (changes.performance.change > 500) {
      insights.push({
        type: 'degradation',
        message: `Response time increased by ${changes.performance.percentage.toFixed(2)}%`,
        severity: 'high',
      });
    } else if (changes.performance.change < -500) {
      insights.push({
        type: 'improvement',
        message: `Response time improved by ${Math.abs(changes.performance.percentage).toFixed(2)}%`,
        severity: 'medium',
      });
    }

    // User activity comparison
    if (changes.userActivity.change > 50) {
      insights.push({
        type: 'improvement',
        message: `User activity increased by ${changes.userActivity.percentage.toFixed(2)}%`,
        severity: 'low',
      });
    } else if (changes.userActivity.change < -50) {
      insights.push({
        type: 'degradation',
        message: `User activity decreased by ${Math.abs(changes.userActivity.percentage).toFixed(2)}%`,
        severity: 'medium',
      });
    }

    return insights;
  }

  /**
   * Extract error pattern from error message
   */
  private extractErrorPattern(message: string): string {
    // Simple pattern extraction - can be enhanced with more sophisticated logic
    if (message.includes('Database')) return 'Database Error';
    if (message.includes('Connection')) return 'Connection Error';
    if (message.includes('Timeout')) return 'Timeout Error';
    if (message.includes('Permission')) return 'Permission Error';
    if (message.includes('Authentication')) return 'Authentication Error';
    return 'Generic Error';
  }

  /**
   * Determine error severity based on frequency
   */
  private determineErrorSeverity(frequency: number, totalErrors: number): 'low' | 'medium' | 'high' {
    const percentage = (frequency / totalErrors) * 100;
    if (percentage > 20) return 'high';
    if (percentage > 10) return 'medium';
    return 'low';
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
}
