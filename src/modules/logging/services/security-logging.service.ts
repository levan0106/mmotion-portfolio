import { Injectable, Logger } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { ContextManager } from './context-manager.service';
import { LogSanitizationService } from './log-sanitization.service';

export interface SecurityEvent {
  eventType: 'AUTHENTICATION' | 'AUTHORIZATION' | 'SUSPICIOUS_ACTIVITY' | 'AUDIT_TRAIL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface AuthenticationEvent extends SecurityEvent {
  eventType: 'AUTHENTICATION';
  authMethod: 'PASSWORD' | 'TOKEN' | 'OAUTH' | 'SSO';
  success: boolean;
  failureReason?: string;
  sessionId?: string;
}

export interface AuthorizationEvent extends SecurityEvent {
  eventType: 'AUTHORIZATION';
  resource: string;
  action: string;
  success: boolean;
  failureReason?: string;
  requiredPermissions?: string[];
  userPermissions?: string[];
}

export interface SuspiciousActivityEvent extends SecurityEvent {
  eventType: 'SUSPICIOUS_ACTIVITY';
  activityType: 'MULTIPLE_FAILED_LOGINS' | 'UNUSUAL_ACCESS_PATTERN' | 'PRIVILEGE_ESCALATION' | 'DATA_EXFILTRATION' | 'BRUTE_FORCE';
  riskScore: number; // 0-100
  indicators: string[];
  mitigationActions?: string[];
}

export interface AuditTrailEvent extends SecurityEvent {
  eventType: 'AUDIT_TRAIL';
  operation: string;
  resource: string;
  oldValue?: any;
  newValue?: any;
  sensitiveData?: boolean;
}

@Injectable()
export class SecurityLoggingService {
  private readonly logger = new Logger(SecurityLoggingService.name);
  private readonly securityAlerts: Map<string, number> = new Map(); // IP -> count
  private readonly failedLoginAttempts: Map<string, number> = new Map(); // IP -> count
  private readonly lastFailedLogin: Map<string, Date> = new Map(); // IP -> timestamp

  constructor(
    private readonly loggingService: LoggingService,
    private readonly contextManager: ContextManager,
    private readonly sanitizationService: LogSanitizationService,
  ) {}

  /**
   * Log authentication events
   */
  logAuthentication(event: AuthenticationEvent): void {
    const context = this.contextManager.getCurrentContext();
    const sanitizedEvent = this.sanitizeSecurityEvent(event);

    // Track failed login attempts
    if (!event.success && event.ipAddress) {
      this.trackFailedLogin(event.ipAddress);
    }

    // Check for suspicious patterns
    if (event.ipAddress && this.isSuspiciousActivity(event.ipAddress)) {
      this.logSuspiciousActivity({
        eventType: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        description: 'Multiple failed login attempts detected',
        activityType: 'MULTIPLE_FAILED_LOGINS',
        riskScore: this.calculateRiskScore(event.ipAddress),
        indicators: ['Multiple failed login attempts', 'Potential brute force attack'],
        ipAddress: event.ipAddress,
        userId: event.userId,
        requestId: context?.requestId,
        correlationId: context?.correlationId,
        metadata: {
          failedAttempts: this.failedLoginAttempts.get(event.ipAddress) || 0,
          lastAttempt: this.lastFailedLogin.get(event.ipAddress),
        },
      });
    }

    // Log the authentication event
    this.loggingService.info(`Authentication Event: ${event.success ? 'SUCCESS' : 'FAILURE'}`, {
      eventType: 'SECURITY_AUTHENTICATION',
      ...sanitizedEvent,
    });

    // Log as business event for audit trail
    this.loggingService.logBusinessEvent(
      'AUTHENTICATION',
      event.success ? 'User authentication successful' : 'User authentication failed',
      'SECURITY',
      event.success ? 'medium' : 'high',
      sanitizedEvent,
    );
  }

  /**
   * Log authorization events
   */
  logAuthorization(event: AuthorizationEvent): void {
    const context = this.contextManager.getCurrentContext();
    const sanitizedEvent = this.sanitizeSecurityEvent(event);

    // Log authorization event
    this.loggingService.info(`Authorization Event: ${event.success ? 'GRANTED' : 'DENIED'}`, {
      eventType: 'SECURITY_AUTHORIZATION',
      ...sanitizedEvent,
    });

    // Log as business event for audit trail
    this.loggingService.logBusinessEvent(
      'AUTHORIZATION',
      event.success ? 'User authorization granted' : 'User authorization denied',
      'SECURITY',
      event.success ? 'medium' : 'high',
      sanitizedEvent,
    );

    // Check for privilege escalation attempts
    if (!event.success && event.requiredPermissions && event.userPermissions) {
      const missingPermissions = event.requiredPermissions.filter(
        perm => !event.userPermissions?.includes(perm),
      );
      
      if (missingPermissions.length > 0) {
        this.logSuspiciousActivity({
          eventType: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          description: 'Privilege escalation attempt detected',
          activityType: 'PRIVILEGE_ESCALATION',
          riskScore: 60,
          indicators: ['Missing required permissions', 'Potential privilege escalation'],
          userId: event.userId,
          ipAddress: event.ipAddress,
          requestId: context?.requestId,
          correlationId: context?.correlationId,
          metadata: {
            resource: event.resource,
            action: event.action,
            missingPermissions,
            userPermissions: event.userPermissions,
          },
        });
      }
    }
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(event: SuspiciousActivityEvent): void {
    const context = this.contextManager.getCurrentContext();
    const sanitizedEvent = this.sanitizeSecurityEvent(event);

    // Log suspicious activity
    this.loggingService.warn(`Suspicious Activity Detected: ${event.activityType}`, {
      eventType: 'SECURITY_SUSPICIOUS_ACTIVITY',
      ...sanitizedEvent,
    });

    // Generate security alert for high-risk activities
    if (event.riskScore >= 80) {
      this.generateSecurityAlert(event);
    }

    // Log as business event for audit trail
    this.loggingService.logBusinessEvent(
      'SUSPICIOUS_ACTIVITY',
      `Suspicious activity detected: ${event.activityType}`,
      'SECURITY',
      'high',
      sanitizedEvent,
    );
  }

  /**
   * Log audit trail events
   */
  logAuditTrail(event: AuditTrailEvent): void {
    const context = this.contextManager.getCurrentContext();
    const sanitizedEvent = this.sanitizeSecurityEvent(event);

    // Log audit trail event
    this.loggingService.info(`Audit Trail: ${event.operation} on ${event.resource}`, {
      eventType: 'SECURITY_AUDIT_TRAIL',
      ...sanitizedEvent,
    });

    // Log as business event for audit trail
    this.loggingService.logBusinessEvent(
      'AUDIT_TRAIL',
      `${event.operation} operation on ${event.resource}`,
      'SECURITY',
      event.sensitiveData ? 'high' : 'medium',
      sanitizedEvent,
    );
  }

  /**
   * Generate security alert
   */
  private generateSecurityAlert(event: SuspiciousActivityEvent): void {
    const alertData = {
      alertType: 'SECURITY_THREAT',
      severity: event.severity,
      riskScore: event.riskScore,
      activityType: event.activityType,
      description: event.description,
      indicators: event.indicators,
      mitigationActions: event.mitigationActions || ['Monitor user activity', 'Review access logs'],
      timestamp: new Date(),
      userId: event.userId,
      ipAddress: event.ipAddress,
      requestId: event.requestId,
      correlationId: event.correlationId,
    };

    this.loggingService.error('SECURITY ALERT: High-risk activity detected', alertData as any);

    // TODO: Integrate with external security systems (SIEM, alerting systems)
    // This could include sending alerts to security teams, blocking IPs, etc.
  }

  /**
   * Track failed login attempts
   */
  private trackFailedLogin(ipAddress: string): void {
    const currentCount = this.failedLoginAttempts.get(ipAddress) || 0;
    this.failedLoginAttempts.set(ipAddress, currentCount + 1);
    this.lastFailedLogin.set(ipAddress, new Date());

    // Reset counter after 1 hour
    setTimeout(() => {
      this.failedLoginAttempts.delete(ipAddress);
      this.lastFailedLogin.delete(ipAddress);
    }, 60 * 60 * 1000);
  }

  /**
   * Check if activity is suspicious
   */
  private isSuspiciousActivity(ipAddress: string): boolean {
    const failedAttempts = this.failedLoginAttempts.get(ipAddress) || 0;
    const lastAttempt = this.lastFailedLogin.get(ipAddress);
    
    if (failedAttempts >= 5) {
      return true;
    }

    if (lastAttempt && failedAttempts >= 3) {
      const timeSinceLastAttempt = Date.now() - lastAttempt.getTime();
      if (timeSinceLastAttempt < 5 * 60 * 1000) { // 5 minutes
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate risk score based on activity patterns
   */
  private calculateRiskScore(ipAddress: string): number {
    const failedAttempts = this.failedLoginAttempts.get(ipAddress) || 0;
    const lastAttempt = this.lastFailedLogin.get(ipAddress);
    
    let riskScore = failedAttempts * 10; // Base score

    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - lastAttempt.getTime();
      if (timeSinceLastAttempt < 5 * 60 * 1000) { // Recent attempts
        riskScore += 20;
      }
    }

    return Math.min(riskScore, 100); // Cap at 100
  }

  /**
   * Sanitize security event data
   */
  private sanitizeSecurityEvent(event: SecurityEvent): any {
    const sanitized = this.sanitizationService.sanitizeObject(event);
    
    // Additional security-specific sanitization
    if (sanitized.metadata) {
      sanitized.metadata = this.sanitizationService.sanitizeObject(sanitized.metadata);
    }

    return sanitized;
  }

  /**
   * Get security statistics
   */
  getSecurityStatistics(): {
    totalFailedLogins: number;
    activeSuspiciousIPs: number;
    recentAlerts: number;
    riskDistribution: Record<string, number>;
  } {
    const totalFailedLogins = Array.from(this.failedLoginAttempts.values()).reduce((sum, count) => sum + count, 0);
    const activeSuspiciousIPs = Array.from(this.failedLoginAttempts.keys()).length;
    
    return {
      totalFailedLogins,
      activeSuspiciousIPs,
      recentAlerts: 0, // TODO: Implement alert tracking
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
    };
  }

  /**
   * Clear security tracking data
   */
  clearSecurityData(): void {
    this.failedLoginAttempts.clear();
    this.lastFailedLogin.clear();
    this.securityAlerts.clear();
  }
}
