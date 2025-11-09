import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { GoalAssetAllocationService } from '../services';
import { CreateGoalAssetAllocationDto, UpdateGoalAssetAllocationDto } from '../dto';

@ApiTags('Goal Asset Allocation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/goals/:goalId/allocations')
export class GoalAssetAllocationController {
  constructor(private readonly allocationService: GoalAssetAllocationService) {}

  @Post()
  @ApiOperation({ summary: 'Create asset allocation for a goal' })
  @ApiResponse({ status: 201, description: 'Asset allocation created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createAllocation(
    @Param('goalId') goalId: string,
    @Body() createAllocationDto: CreateGoalAssetAllocationDto,
    @Request() req,
  ) {
    return this.allocationService.createAllocation(goalId, createAllocationDto, req.user.accountId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all asset allocations for a goal' })
  @ApiResponse({ status: 200, description: 'Asset allocations retrieved successfully' })
  async getAllocationsByGoal(@Param('goalId') goalId: string, @Request() req) {
    return this.allocationService.getAllocationsByGoal(goalId, req.user.accountId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get asset allocation summary for a goal' })
  @ApiResponse({ status: 200, description: 'Asset allocation summary retrieved successfully' })
  async getAssetAllocationSummary(@Param('goalId') goalId: string, @Request() req) {
    return this.allocationService.getAssetAllocationSummary(goalId, req.user.accountId);
  }

  @Get('rebalancing-candidates')
  @ApiOperation({ summary: 'Get rebalancing candidates' })
  @ApiResponse({ status: 200, description: 'Rebalancing candidates retrieved successfully' })
  async getRebalancingCandidates(@Request() req) {
    return this.allocationService.getRebalancingCandidates(req.user.accountId);
  }

  @Put(':allocationId')
  @ApiOperation({ summary: 'Update asset allocation' })
  @ApiResponse({ status: 200, description: 'Asset allocation updated successfully' })
  @ApiResponse({ status: 404, description: 'Asset allocation not found' })
  async updateAllocation(
    @Param('goalId') goalId: string,
    @Param('allocationId') allocationId: string,
    @Body() updateAllocationDto: UpdateGoalAssetAllocationDto,
    @Request() req,
  ) {
    return this.allocationService.updateAllocation(allocationId, updateAllocationDto, req.user.accountId);
  }

  @Delete(':allocationId')
  @ApiOperation({ summary: 'Delete asset allocation' })
  @ApiResponse({ status: 200, description: 'Asset allocation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Asset allocation not found' })
  async deleteAllocation(
    @Param('goalId') goalId: string,
    @Param('allocationId') allocationId: string,
    @Request() req,
  ) {
    await this.allocationService.deleteAllocation(allocationId, req.user.accountId);
    return { message: 'Asset allocation deleted successfully' };
  }

  @Post(':allocationId/rebalance')
  @ApiOperation({ summary: 'Rebalance asset allocation' })
  @ApiResponse({ status: 200, description: 'Asset allocation rebalanced successfully' })
  @ApiResponse({ status: 404, description: 'Asset allocation not found' })
  async rebalanceAllocation(
    @Param('goalId') goalId: string,
    @Param('allocationId') allocationId: string,
    @Body() newAllocation: Record<string, number>,
    @Request() req,
  ) {
    return this.allocationService.rebalanceAllocation(allocationId, newAllocation, req.user.accountId);
  }
}
