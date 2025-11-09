import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GoalService } from '../services';
import { CreateGoalDto, UpdateGoalDto, GoalResponseDto, GoalWithAllocationDto } from '../dto';
import { GoalStatus } from '../entities';

@ApiTags('Goals')
@Controller('api/v1/goals')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}


  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  @ApiResponse({ status: 201, description: 'Goal created successfully', type: GoalResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createGoal(
    @Body() createGoalDto: CreateGoalDto, 
    @Query('accountId') accountId: string
  ): Promise<GoalResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.goalService.createGoal(createGoalDto, accountId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all goals for the current user' })
  @ApiResponse({ status: 200, description: 'Goals retrieved successfully', type: [GoalResponseDto] })
  async findAllGoals(
    @Query('accountId') accountId: string,
    @Query('portfolioId') portfolioId?: string,
  ): Promise<GoalResponseDto[]> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.goalService.findAllGoals(accountId, portfolioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific goal by ID' })
  @ApiResponse({ status: 200, description: 'Goal retrieved successfully', type: GoalWithAllocationDto })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async findGoalById(
    @Param('id') id: string, 
    @Query('accountId') accountId: string
  ): Promise<GoalWithAllocationDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.goalService.findGoalById(id, accountId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a goal' })
  @ApiResponse({ status: 200, description: 'Goal updated successfully', type: GoalResponseDto })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async updateGoal(
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
    @Query('accountId') accountId: string,
  ): Promise<GoalResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.goalService.updateGoal(id, updateGoalDto, accountId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a goal' })
  @ApiResponse({ status: 200, description: 'Goal deleted successfully' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async deleteGoal(
    @Param('id') id: string, 
    @Query('accountId') accountId: string
  ): Promise<{ message: string }> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    await this.goalService.deleteGoal(id, accountId);
    return { message: 'Goal deleted successfully' };
  }

  // Method removed - progress is now calculated real-time

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get goal progress information' })
  @ApiResponse({ status: 200, description: 'Goal progress retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async getGoalProgress(
    @Param('id') id: string, 
    @Query('accountId') accountId: string
  ) {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.goalService.getGoalProgress(id, accountId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get goals by status' })
  @ApiResponse({ status: 200, description: 'Goals retrieved successfully', type: [GoalResponseDto] })
  async getGoalsByStatus(
    @Param('status') status: GoalStatus,
    @Query('accountId') accountId: string,
  ): Promise<GoalResponseDto[]> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.goalService.getGoalsByStatus(accountId, status);
  }

  @Get('primary/list')
  @ApiOperation({ summary: 'Get primary goals' })
  @ApiResponse({ status: 200, description: 'Primary goals retrieved successfully', type: [GoalResponseDto] })
  async getPrimaryGoals(@Query('accountId') accountId: string): Promise<GoalResponseDto[]> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.goalService.getPrimaryGoals(accountId);
  }

  @Post(':id/set-primary')
  @ApiOperation({ summary: 'Set a goal as primary' })
  @ApiResponse({ status: 200, description: 'Goal set as primary successfully', type: GoalResponseDto })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async setPrimaryGoal(
    @Param('id') id: string, 
    @Query('accountId') accountId: string
  ): Promise<GoalResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.goalService.setPrimaryGoal(id, accountId);
  }

  @Get('portfolios/available')
  @ApiOperation({ summary: 'Get portfolios not linked to any goals' })
  @ApiResponse({ status: 200, description: 'Available portfolios retrieved successfully' })
  async getAvailablePortfolios(@Query('accountId') accountId: string): Promise<{ portfolios: Array<{ portfolioId: string; accountId: string; name: string }> }> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.goalService.getAvailablePortfolios(accountId);
  }
}
