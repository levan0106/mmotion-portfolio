import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationGateway } from '../../../notification/notification.gateway';
import { GlobalAssetTracking, GlobalAssetSyncStatus } from '../entities/global-asset-tracking.entity';
import { Account } from '../../shared/entities/account.entity';

export interface TrackingAlertData {
  executionId: string;
  status: GlobalAssetSyncStatus;
  errorMessage?: string;
  errorCode?: string;
  failedSymbolsCount?: number;
  totalSymbols?: number;
  successRate?: number;
  executionTime?: number;
  triggeredBy?: string;
  metadata?: any;
}

@Injectable()
export class TrackingAlertService {
  private readonly logger = new Logger(TrackingAlertService.name);

  constructor(
    private readonly notificationGateway: NotificationGateway,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  /**
   * Send alert to admin when tracking fails
   */
  async sendTrackingFailureAlert(
    tracking: GlobalAssetTracking,
    alertData: TrackingAlertData,
  ): Promise<void> {
    try {
      const adminUserId = await this.getAdminUserId();
      if (!adminUserId) {
        this.logger.warn('No admin user found, skipping notification');
        return;
      }

      const title = this.generateAlertTitle(tracking, alertData);
      const message = this.generateAlertMessage(tracking, alertData);
      const actionUrl = this.generateActionUrl(tracking.executionId);
      const metadata = this.generateMetadata(tracking, alertData);

      await this.notificationGateway.sendNotification(
        adminUserId,
        'system',
        title,
        message,
        actionUrl,
        metadata,
      );

      this.logger.log(`[TrackingAlertService] Sent failure alert to admin for execution: ${tracking.executionId}`);
    } catch (error) {
      this.logger.error(`[TrackingAlertService] Error sending tracking failure alert:`, error);
    }
  }

  /**
   * Send alert to admin when tracking has critical issues
   */
  async sendCriticalTrackingAlert(
    tracking: GlobalAssetTracking,
    alertData: TrackingAlertData,
  ): Promise<void> {
    try {
      const adminUserId = await this.getAdminUserId();
      if (!adminUserId) {
        this.logger.warn('No admin user found, skipping critical notification');
        return;
      }

      const title = `🚨 CRITICAL: Asset Tracking Failure - ${tracking.executionId}`;
      const message = this.generateCriticalAlertMessage(tracking, alertData);
      const actionUrl = this.generateActionUrl(tracking.executionId);
      const metadata = {
        ...this.generateMetadata(tracking, alertData),
        priority: 'critical',
        alertType: 'tracking_critical_failure',
      };

      await this.notificationGateway.sendNotification(
        adminUserId,
        'system',
        title,
        message,
        actionUrl,
        metadata,
      );

      this.logger.log(`[TrackingAlertService] Sent critical alert to admin for execution: ${tracking.executionId}`);
    } catch (error) {
      this.logger.error(`[TrackingAlertService] Error sending critical tracking alert:`, error);
    }
  }


  private async getAdminUserId(): Promise<string | null> {
    try {
        console.log('ADMIN_USERNAME', process.env.ADMIN_USERNAME);
        // Get admin username from environment variable
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        
        // Normalize username: lowercase, trim, and remove all spaces
        const normalizedUsername = adminUsername.toLowerCase().trim().replace(/\s+/g, '');
        
        // Find main account of the user by username
        const account = await this.accountRepository.findOne({
            where: { 
            user: { username: normalizedUsername },
            isMainAccount: true 
            },
            relations: ['user']
        });

        if (!account) {
            this.logger.warn(`Admin main account not found with username: ${adminUsername}`);
            return null;
        }

        this.logger.log(`Found admin user: ${account.name} (${account.userId})`);
        return account.userId;
    } catch (error) {
      this.logger.error(`Error getting admin user ID:`, error);
      return null;
    }
  }

  private generateAlertTitle(tracking: GlobalAssetTracking, alertData: TrackingAlertData): string {
    return `Asset Tracking Failed - ${tracking.executionId}`;
  }

  private generateAlertMessage(tracking: GlobalAssetTracking, alertData: TrackingAlertData): string {
    return `ExecutionId: ${tracking.executionId}\nError: ${alertData.errorMessage || 'Unknown error'}\nFailed symbols: ${alertData.failedSymbolsCount || 0}`;
  }

  private generateCriticalAlertMessage(tracking: GlobalAssetTracking, alertData: TrackingAlertData): string {
    return `ExecutionId: ${tracking.executionId}\nError: ${alertData.errorMessage || 'Unknown error'}\nFailed symbols: ${alertData.failedSymbolsCount || 0}\nSuccess rate: ${alertData.successRate ? (alertData.successRate * 100).toFixed(1) + '%' : 'N/A'}`;
  }


  private generateActionUrl(executionId: string): string {
    return `/global-assets?${executionId}`;
  }

  private generateMetadata(tracking: GlobalAssetTracking, alertData: TrackingAlertData): any {
    return {
      executionId: tracking.executionId,
      trackingId: tracking.id,
      status: alertData.status,
      type: tracking.type,
      source: tracking.source,
      startedAt: tracking.startedAt,
      completedAt: tracking.completedAt,
      errorMessage: alertData.errorMessage,
      errorCode: alertData.errorCode,
      failedSymbolsCount: alertData.failedSymbolsCount,
      totalSymbols: alertData.totalSymbols,
      successRate: alertData.successRate,
      executionTime: alertData.executionTime,
      triggeredBy: alertData.triggeredBy,
      metadata: alertData.metadata,
      timestamp: new Date().toISOString(),
    };
  }
}
