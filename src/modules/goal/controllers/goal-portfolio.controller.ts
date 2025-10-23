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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GoalPortfolioService } from '../services/goal-portfolio.service';
import { CreateGoalPortfolioDto, UpdateGoalPortfolioDto, GoalPortfolioResponseDto } from '../dto';

@ApiTags('Goal Portfolios')
@Controller('api/v1/goals/:goalId/portfolios')
export class GoalPortfolioController {
  constructor(private readonly goalPortfolioService: GoalPortfolioService) {}

  @Post()
  @ApiOperation({ summary: 'Add a portfolio to a goal' })
  @ApiResponse({ status: 201, description: 'Portfolio added to goal successfully', type: GoalPortfolioResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async addPortfolioToGoal(
    @Param('goalId') goalId: string,
    @Body() createDto: CreateGoalPortfolioDto,
    @Query('accountId') accountId: string,
  ): Promise<GoalPortfolioResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.goalPortfolioService.addPortfolioToGoal(goalId, createDto, accountId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all portfolios associated with a goal' })
  @ApiResponse({ status: 200, description: 'Portfolios retrieved successfully', type: [GoalPortfolioResponseDto] })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async getGoalPortfolios(
    @Param('goalId') goalId: string,
    @Query('accountId') accountId: string,
  ): Promise<GoalPortfolioResponseDto[]> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.goalPortfolioService.getGoalPortfolios(goalId, accountId);
  }

  @Put(':portfolioId')
  @ApiOperation({ summary: 'Update a goal-portfolio association' })
  @ApiResponse({ status: 200, description: 'Goal-portfolio association updated successfully', type: GoalPortfolioResponseDto })
  @ApiResponse({ status: 404, description: 'Goal or portfolio not found' })
  async updateGoalPortfolio(
    @Param('goalId') goalId: string,
    @Param('portfolioId') portfolioId: string,
    @Body() updateDto: UpdateGoalPortfolioDto,
    @Query('accountId') accountId: string,
  ): Promise<GoalPortfolioResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.goalPortfolioService.updateGoalPortfolio(goalId, portfolioId, updateDto, accountId);
  }

  @Delete(':portfolioId')
  @ApiOperation({ summary: 'Remove a portfolio from a goal' })
  @ApiResponse({ status: 200, description: 'Portfolio removed from goal successfully' })
  @ApiResponse({ status: 404, description: 'Goal or portfolio not found' })
  async removePortfolioFromGoal(
    @Param('goalId') goalId: string,
    @Param('portfolioId') portfolioId: string,
    @Query('accountId') accountId: string,
  ): Promise<{ message: string }> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    await this.goalPortfolioService.removePortfolioFromGoal(goalId, portfolioId, accountId);
    return { message: 'Portfolio removed from goal successfully' };
  }
}
