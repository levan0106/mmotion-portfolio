import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoalAlert, AlertType, AlertStatus } from '../entities';
import { GoalService } from './goal.service';

@Injectable()
export class GoalAlertService {
  constructor(
    @InjectRepository(GoalAlert)
    private alertRepository: Repository<GoalAlert>,
    private goalService: GoalService,
  ) {}

  async createAlert(
    goalId: string,
    alertType: AlertType,
    message: string,
    thresholdValue?: number,
    currentValue?: number,
    accountId?: string,
  ): Promise<GoalAlert> {
    // Verify goal exists and user has access
    if (accountId) {
      await this.goalService.findGoalById(goalId, accountId);
    }

    const alert = this.alertRepository.create({
      goalId,
      alertType,
      message,
      thresholdValue,
      currentValue,
      createdBy: accountId,
    });

    return this.alertRepository.save(alert);
  }

  async getAlertsByGoal(goalId: string, accountId: string): Promise<GoalAlert[]> {
    // Verify goal exists and user has access
    await this.goalService.findGoalById(goalId, accountId);

    return this.alertRepository.find({
      where: { goalId },
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingAlerts(accountId: string): Promise<GoalAlert[]> {
    return this.alertRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.goal', 'goal')
      .where('alert.status = :status', { status: AlertStatus.PENDING })
      .andWhere('goal.accountId = :accountId', { accountId })
      .orderBy('alert.createdAt', 'DESC')
      .getMany();
  }

  async acknowledgeAlert(alertId: string, accountId: string): Promise<GoalAlert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
      relations: ['goal'],
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${alertId} not found`);
    }

    // Verify user has access to the goal
    await this.goalService.findGoalById(alert.goalId, accountId);

    alert.acknowledge();
    return this.alertRepository.save(alert);
  }

  async dismissAlert(alertId: string, accountId: string): Promise<GoalAlert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
      relations: ['goal'],
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${alertId} not found`);
    }

    // Verify user has access to the goal
    await this.goalService.findGoalById(alert.goalId, accountId);

    alert.dismiss();
    return this.alertRepository.save(alert);
  }

  async markAlertAsSent(alertId: string): Promise<GoalAlert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${alertId} not found`);
    }

    alert.markAsSent();
    return this.alertRepository.save(alert);
  }

  async getAlertsByType(accountId: string, alertType: AlertType): Promise<GoalAlert[]> {
    return this.alertRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.goal', 'goal')
      .where('alert.alertType = :alertType', { alertType })
      .andWhere('goal.accountId = :accountId', { accountId })
      .orderBy('alert.createdAt', 'DESC')
      .getMany();
  }

  async getCriticalAlerts(accountId: string): Promise<GoalAlert[]> {
    return this.getAlertsByType(accountId, AlertType.CRITICAL);
  }

  async getWarningAlerts(accountId: string): Promise<GoalAlert[]> {
    return this.getAlertsByType(accountId, AlertType.WARNING);
  }

  async getAchievementAlerts(accountId: string): Promise<GoalAlert[]> {
    return this.getAlertsByType(accountId, AlertType.ACHIEVEMENT);
  }

  async getRebalanceAlerts(accountId: string): Promise<GoalAlert[]> {
    return this.getAlertsByType(accountId, AlertType.REBALANCE);
  }

  async getDeadlineAlerts(accountId: string): Promise<GoalAlert[]> {
    return this.getAlertsByType(accountId, AlertType.DEADLINE);
  }

  async getAlertStats(accountId: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    acknowledged: number;
    dismissed: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const alerts = await this.alertRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.goal', 'goal')
      .where('goal.accountId = :accountId', { accountId })
      .getMany();

    const stats = {
      total: alerts.length,
      pending: 0,
      sent: 0,
      acknowledged: 0,
      dismissed: 0,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
    };

    alerts.forEach(alert => {
      // Count by status
      switch (alert.status) {
        case AlertStatus.PENDING:
          stats.pending++;
          break;
        case AlertStatus.SENT:
          stats.sent++;
          break;
        case AlertStatus.ACKNOWLEDGED:
          stats.acknowledged++;
          break;
        case AlertStatus.DISMISSED:
          stats.dismissed++;
          break;
      }

      // Count by type
      stats.byType[alert.alertType] = (stats.byType[alert.alertType] || 0) + 1;

      // Count by severity
      const severity = alert.getSeverity();
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
    });

    return stats;
  }

  async cleanupOldAlerts(accountId: string, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.alertRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('status IN (:...statuses)', { 
        statuses: [AlertStatus.ACKNOWLEDGED, AlertStatus.DISMISSED] 
      })
      .execute();

    return result.affected || 0;
  }
}
