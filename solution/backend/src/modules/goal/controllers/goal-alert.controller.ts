import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { GoalAlertService } from '../services';
import { AlertType } from '../entities';

@ApiTags('Goal Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/goals/:goalId/alerts')
export class GoalAlertController {
  constructor(private readonly alertService: GoalAlertService) {}

  @Post()
  @ApiOperation({ summary: 'Create an alert for a goal' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createAlert(
    @Param('goalId') goalId: string,
    @Body() body: {
      alertType: AlertType;
      message: string;
      thresholdValue?: number;
      currentValue?: number;
    },
    @Request() req,
  ) {
    return this.alertService.createAlert(
      goalId,
      body.alertType,
      body.message,
      body.thresholdValue,
      body.currentValue,
      req.user.accountId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all alerts for a goal' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  async getAlertsByGoal(@Param('goalId') goalId: string, @Request() req) {
    return this.alertService.getAlertsByGoal(goalId, req.user.accountId);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending alerts for the current user' })
  @ApiResponse({ status: 200, description: 'Pending alerts retrieved successfully' })
  async getPendingAlerts(@Request() req) {
    return this.alertService.getPendingAlerts(req.user.accountId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get alert statistics for the current user' })
  @ApiResponse({ status: 200, description: 'Alert statistics retrieved successfully' })
  async getAlertStats(@Request() req) {
    return this.alertService.getAlertStats(req.user.accountId);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get alerts by type' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  async getAlertsByType(@Param('type') type: AlertType, @Request() req) {
    return this.alertService.getAlertsByType(req.user.accountId, type);
  }

  @Get('critical')
  @ApiOperation({ summary: 'Get critical alerts' })
  @ApiResponse({ status: 200, description: 'Critical alerts retrieved successfully' })
  async getCriticalAlerts(@Request() req) {
    return this.alertService.getCriticalAlerts(req.user.accountId);
  }

  @Get('warnings')
  @ApiOperation({ summary: 'Get warning alerts' })
  @ApiResponse({ status: 200, description: 'Warning alerts retrieved successfully' })
  async getWarningAlerts(@Request() req) {
    return this.alertService.getWarningAlerts(req.user.accountId);
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get achievement alerts' })
  @ApiResponse({ status: 200, description: 'Achievement alerts retrieved successfully' })
  async getAchievementAlerts(@Request() req) {
    return this.alertService.getAchievementAlerts(req.user.accountId);
  }

  @Get('rebalance')
  @ApiOperation({ summary: 'Get rebalance alerts' })
  @ApiResponse({ status: 200, description: 'Rebalance alerts retrieved successfully' })
  async getRebalanceAlerts(@Request() req) {
    return this.alertService.getRebalanceAlerts(req.user.accountId);
  }

  @Get('deadlines')
  @ApiOperation({ summary: 'Get deadline alerts' })
  @ApiResponse({ status: 200, description: 'Deadline alerts retrieved successfully' })
  async getDeadlineAlerts(@Request() req) {
    return this.alertService.getDeadlineAlerts(req.user.accountId);
  }

  @Put(':alertId/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async acknowledgeAlert(@Param('alertId') alertId: string, @Request() req) {
    return this.alertService.acknowledgeAlert(alertId, req.user.accountId);
  }

  @Put(':alertId/dismiss')
  @ApiOperation({ summary: 'Dismiss an alert' })
  @ApiResponse({ status: 200, description: 'Alert dismissed successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async dismissAlert(@Param('alertId') alertId: string, @Request() req) {
    return this.alertService.dismissAlert(alertId, req.user.accountId);
  }

  @Delete('cleanup')
  @ApiOperation({ summary: 'Cleanup old alerts' })
  @ApiResponse({ status: 200, description: 'Old alerts cleaned up successfully' })
  async cleanupOldAlerts(
    @Request() req,
    @Query('daysOld') daysOld?: number,
  ) {
    const deletedCount = await this.alertService.cleanupOldAlerts(req.user.accountId, daysOld);
    return { message: `${deletedCount} old alerts cleaned up successfully` };
  }
}
