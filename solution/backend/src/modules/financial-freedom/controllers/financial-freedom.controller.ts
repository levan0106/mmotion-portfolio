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
import { FinancialFreedomPlanService } from '../services';
import { 
  CreatePlanDto, 
  UpdatePlanDto, 
  PlanResponseDto,
  LinkGoalRequestDto,
  LinkPortfolioRequestDto,
  UnlinkGoalRequestDto,
  UnlinkPortfolioRequestDto,
  ProgressResponseDto,
  AllocationComparisonResponseDto,
} from '../dto';

@ApiTags('Financial Freedom')
@Controller('api/v1/financial-freedom')
export class FinancialFreedomController {
  constructor(
    private readonly planService: FinancialFreedomPlanService,
  ) {}

  @Post('plans')
  @ApiOperation({ summary: 'Create a new financial freedom plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully', type: PlanResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createPlan(
    @Body() createPlanDto: CreatePlanDto,
    @Query('accountId') accountId: string,
  ): Promise<PlanResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.planService.createPlan(createPlanDto, accountId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all financial freedom plans for the current user' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully', type: [PlanResponseDto] })
  async findAllPlans(
    @Query('accountId') accountId: string,
  ): Promise<PlanResponseDto[]> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.planService.findAllPlans(accountId);
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get a specific financial freedom plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan retrieved successfully', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async findPlanById(
    @Param('id') id: string,
    @Query('accountId') accountId: string,
  ): Promise<PlanResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.planService.findPlanById(id, accountId);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update a financial freedom plan' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async updatePlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
    @Query('accountId') accountId: string,
  ): Promise<PlanResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.planService.updatePlan(id, updatePlanDto, accountId);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete a financial freedom plan' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async deletePlan(
    @Param('id') id: string,
    @Query('accountId') accountId: string,
  ): Promise<{ message: string }> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.planService.deletePlan(id, accountId);
  }

  @Post('plans/:id/duplicate')
  @ApiOperation({ summary: 'Duplicate a financial freedom plan' })
  @ApiResponse({ status: 201, description: 'Plan duplicated successfully', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async duplicatePlan(
    @Param('id') id: string,
    @Query('accountId') accountId: string,
  ): Promise<PlanResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.planService.duplicatePlan(id, accountId);
  }

  @Post('plans/:id/link-goal')
  @ApiOperation({ summary: 'Link a goal to a financial freedom plan' })
  @ApiResponse({ status: 200, description: 'Goal linked successfully', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan or Goal not found' })
  @ApiResponse({ status: 400, description: 'Goal is already linked' })
  async linkGoal(
    @Param('id') id: string,
    @Body() linkGoalDto: LinkGoalRequestDto,
    @Query('accountId') accountId: string,
  ): Promise<PlanResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.planService.linkToGoal(id, linkGoalDto.goalId, accountId);
  }

  @Post('plans/:id/unlink-goal')
  @ApiOperation({ summary: 'Unlink a goal from a financial freedom plan' })
  @ApiResponse({ status: 200, description: 'Goal unlinked successfully', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Goal is not linked' })
  async unlinkGoal(
    @Param('id') id: string,
    @Body() unlinkGoalDto: UnlinkGoalRequestDto,
    @Query('accountId') accountId: string,
  ): Promise<PlanResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.planService.unlinkGoal(id, unlinkGoalDto.goalId, accountId);
  }

  @Post('plans/:id/link-portfolio')
  @ApiOperation({ summary: 'Link a portfolio to a financial freedom plan' })
  @ApiResponse({ status: 200, description: 'Portfolio linked successfully', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan or Portfolio not found' })
  @ApiResponse({ status: 403, description: 'Access denied to portfolio' })
  @ApiResponse({ status: 400, description: 'Portfolio is already linked' })
  async linkPortfolio(
    @Param('id') id: string,
    @Body() linkPortfolioDto: LinkPortfolioRequestDto,
    @Query('accountId') accountId: string,
  ): Promise<PlanResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.planService.linkToPortfolio(id, linkPortfolioDto.portfolioId, accountId);
  }

  @Post('plans/:id/unlink-portfolio')
  @ApiOperation({ summary: 'Unlink a portfolio from a financial freedom plan' })
  @ApiResponse({ status: 200, description: 'Portfolio unlinked successfully', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Portfolio is not linked' })
  async unlinkPortfolio(
    @Param('id') id: string,
    @Body() unlinkPortfolioDto: UnlinkPortfolioRequestDto,
    @Query('accountId') accountId: string,
  ): Promise<PlanResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.planService.unlinkPortfolio(id, unlinkPortfolioDto.portfolioId, accountId);
  }

  @Get('plans/:id/progress')
  @ApiOperation({ summary: 'Get progress tracking for a financial freedom plan' })
  @ApiResponse({ status: 200, description: 'Progress retrieved successfully', type: ProgressResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getProgress(
    @Param('id') id: string,
    @Query('accountId') accountId: string,
  ): Promise<ProgressResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.planService.calculateProgress(id, accountId);
  }

  @Get('plans/:id/allocation-comparison')
  @ApiOperation({ summary: 'Compare current allocation with suggested allocation' })
  @ApiResponse({ status: 200, description: 'Allocation comparison retrieved successfully', type: AllocationComparisonResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getAllocationComparison(
    @Param('id') id: string,
    @Query('accountId') accountId: string,
  ): Promise<AllocationComparisonResponseDto> {
    if (!accountId) {
      throw new UnauthorizedException('accountId query parameter is required');
    }
    return this.planService.compareAllocationWithCurrent(id, accountId);
  }
}

