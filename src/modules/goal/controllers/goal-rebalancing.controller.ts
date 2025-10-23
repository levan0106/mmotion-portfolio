import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { GoalRebalancingService } from '../services';
import { RebalanceType } from '../entities';

@ApiTags('Goal Rebalancing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/goals/:goalId/rebalancing')
export class GoalRebalancingController {
  constructor(private readonly rebalancingService: GoalRebalancingService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get rebalancing history for a goal' })
  @ApiResponse({ status: 200, description: 'Rebalancing history retrieved successfully' })
  async getRebalancingHistory(@Param('goalId') goalId: string, @Request() req) {
    return this.rebalancingService.getRebalancingHistory(goalId, req.user.accountId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get rebalancing statistics for a goal' })
  @ApiResponse({ status: 200, description: 'Rebalancing statistics retrieved successfully' })
  async getRebalancingStats(@Param('goalId') goalId: string, @Request() req) {
    return this.rebalancingService.getRebalancingStats(goalId, req.user.accountId);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get rebalancing performance for a goal' })
  @ApiResponse({ status: 200, description: 'Rebalancing performance retrieved successfully' })
  async getRebalancingPerformance(
    @Param('goalId') goalId: string,
    @Request() req,
    @Query('days') days?: number,
  ) {
    return this.rebalancingService.getRebalancingPerformance(goalId, req.user.accountId, days);
  }

  @Get('candidates')
  @ApiOperation({ summary: 'Get rebalancing candidates' })
  @ApiResponse({ status: 200, description: 'Rebalancing candidates retrieved successfully' })
  async getRebalancingCandidates(@Request() req) {
    return this.rebalancingService.getRebalancingCandidates(req.user.accountId);
  }

  @Post('execute')
  @ApiOperation({ summary: 'Execute rebalancing for a goal' })
  @ApiResponse({ status: 200, description: 'Rebalancing executed successfully' })
  @ApiResponse({ status: 400, description: 'Rebalancing failed' })
  async executeRebalancing(
    @Param('goalId') goalId: string,
    @Body() body: {
      newAllocations: Record<string, number>;
      rebalanceType?: RebalanceType;
      triggerReason?: string;
    },
    @Request() req,
  ) {
    return this.rebalancingService.executeRebalancing(
      goalId,
      body.newAllocations,
      body.rebalanceType,
      body.triggerReason,
      req.user.accountId,
    );
  }

  @Post('history')
  @ApiOperation({ summary: 'Create rebalancing history record' })
  @ApiResponse({ status: 201, description: 'Rebalancing history created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createRebalancingHistory(
    @Param('goalId') goalId: string,
    @Body() body: {
      rebalanceType: RebalanceType;
      triggerReason: string;
      oldAllocation: Record<string, any>;
      newAllocation: Record<string, any>;
      changesMade: Record<string, any>;
      expectedImprovement?: number;
      costOfRebalancing?: number;
    },
    @Request() req,
  ) {
    return this.rebalancingService.createRebalancingHistory(
      goalId,
      body.rebalanceType,
      body.triggerReason,
      body.oldAllocation,
      body.newAllocation,
      body.changesMade,
      body.expectedImprovement,
      body.costOfRebalancing,
      req.user.accountId,
    );
  }
}
