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
import { CreatePlanDto, UpdatePlanDto, PlanResponseDto } from '../dto';

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
}

