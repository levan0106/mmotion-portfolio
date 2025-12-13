import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PersonalFinancialAnalysisService } from '../services/personal-financial-analysis.service';
import { CreateAnalysisDto, UpdateAnalysisDto } from '../dto';
import { CreateScenarioDto, UpdateScenarioDto } from '../dto/scenario.dto';
import { LinkPortfolioDto } from '../dto/link-portfolio.dto';
import { LinkPlanDto } from '../dto/link-plan.dto';
import { AnalysisResponseDto } from '../dto/analysis-response.dto';
import { PersonalFinancialAnalysis } from '../entities/personal-financial-analysis.entity';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

/**
 * Personal Financial Analysis Controller
 * Handles all HTTP requests for personal financial analysis operations
 */
@ApiTags('Personal Financial Analysis')
@Controller('api/v1/personal-financial-analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PersonalFinancialAnalysisController {
  constructor(
    private readonly analysisService: PersonalFinancialAnalysisService,
  ) {}

  /**
   * Get all analyses for current user
   */
  @Get()
  @ApiOperation({
    summary: 'Get all analyses',
    description: 'Retrieves all personal financial analyses for the current account.',
  })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID' })
  @ApiResponse({
    status: 200,
    description: 'Analyses retrieved successfully',
    type: [AnalysisResponseDto],
  })
  async getAllAnalyses(
    @Query('accountId') accountId: string,
  ): Promise<PersonalFinancialAnalysis[]> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    return await this.analysisService.findAll(accountId);
  }

  /**
   * Get analysis by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get analysis by ID',
    description: 'Retrieves a single personal financial analysis by its ID.',
  })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID' })
  @ApiResponse({
    status: 200,
    description: 'Analysis retrieved successfully',
    type: AnalysisResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async getAnalysisById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
  ): Promise<PersonalFinancialAnalysis> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    return await this.analysisService.findOne(id, accountId);
  }

  /**
   * Create new analysis
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new analysis',
    description: 'Creates a new personal financial analysis.',
  })
  @ApiBody({ type: CreateAnalysisDto })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID' })
  @ApiResponse({
    status: 201,
    description: 'Analysis created successfully',
    type: AnalysisResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async createAnalysis(
    @Body() createDto: CreateAnalysisDto,
    @Query('accountId') accountId: string,
  ): Promise<PersonalFinancialAnalysis> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    return await this.analysisService.create(createDto, accountId);
  }

  /**
   * Update analysis
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update analysis',
    description: 'Updates an existing personal financial analysis.',
  })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID' })
  @ApiBody({ type: UpdateAnalysisDto })
  @ApiResponse({
    status: 200,
    description: 'Analysis updated successfully',
    type: AnalysisResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async updateAnalysis(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
    @Body() updateDto: UpdateAnalysisDto,
  ): Promise<PersonalFinancialAnalysis> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    return await this.analysisService.update(id, updateDto, accountId);
  }

  /**
   * Delete analysis
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete analysis',
    description: 'Deletes (soft delete) a personal financial analysis.',
  })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID' })
  @ApiResponse({ status: 204, description: 'Analysis deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async deleteAnalysis(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
  ): Promise<void> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    return await this.analysisService.remove(id, accountId);
  }

  /**
   * Link portfolio and load assets
   */
  @Post(':id/link-portfolio')
  @ApiOperation({
    summary: 'Link portfolio',
    description: 'Links a portfolio to the analysis and loads assets from it.',
  })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID' })
  @ApiBody({ type: LinkPortfolioDto })
  @ApiResponse({
    status: 200,
    description: 'Portfolio linked successfully',
    type: AnalysisResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - portfolio already linked' })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied' })
  @ApiResponse({ status: 404, description: 'Analysis or portfolio not found' })
  async linkPortfolio(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
    @Body() linkDto: LinkPortfolioDto,
  ): Promise<PersonalFinancialAnalysis> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    return await this.analysisService.linkPortfolio(id, linkDto, accountId);
  }

  /**
   * Unlink portfolio
   */
  @Delete(':id/unlink-portfolio/:portfolioId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Unlink portfolio',
    description: 'Unlinks a portfolio from the analysis and removes its assets.',
  })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID' })
  @ApiResponse({ status: 204, description: 'Portfolio unlinked successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async unlinkPortfolio(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('accountId') accountId: string,
  ): Promise<void> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    await this.analysisService.unlinkPortfolio(id, portfolioId, accountId);
  }

  /**
   * Create scenario
   */
  @Post(':id/scenarios')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create scenario',
    description: 'Creates a new scenario for asset restructuring.',
  })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID' })
  @ApiBody({ type: CreateScenarioDto })
  @ApiResponse({
    status: 201,
    description: 'Scenario created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async createScenario(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
    @Body() scenarioDto: CreateScenarioDto,
  ) {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    return await this.analysisService.createScenario(id, scenarioDto, accountId);
  }

  /**
   * Update scenario
   */
  @Put(':id/scenarios/:scenarioId')
  @ApiOperation({
    summary: 'Update scenario',
    description: 'Updates an existing scenario.',
  })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiParam({ name: 'scenarioId', description: 'Scenario ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID' })
  @ApiBody({ type: UpdateScenarioDto })
  @ApiResponse({
    status: 200,
    description: 'Scenario updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied' })
  @ApiResponse({ status: 404, description: 'Analysis or scenario not found' })
  async updateScenario(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('scenarioId', ParseUUIDPipe) scenarioId: string,
    @Query('accountId') accountId: string,
    @Body() scenarioDto: UpdateScenarioDto,
  ) {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    return await this.analysisService.updateScenario(id, scenarioId, scenarioDto, accountId);
  }

  /**
   * Delete scenario
   */
  @Delete(':id/scenarios/:scenarioId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete scenario',
    description: 'Deletes a scenario from the analysis.',
  })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiParam({ name: 'scenarioId', description: 'Scenario ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID' })
  @ApiResponse({ status: 204, description: 'Scenario deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied' })
  @ApiResponse({ status: 404, description: 'Analysis or scenario not found' })
  async deleteScenario(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('scenarioId', ParseUUIDPipe) scenarioId: string,
    @Query('accountId') accountId: string,
  ): Promise<void> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    return await this.analysisService.deleteScenario(id, scenarioId, accountId);
  }

  /**
   * Link Financial Freedom Plan
   */
  @Post(':id/link-plan')
  @ApiOperation({
    summary: 'Link Financial Freedom Plan',
    description: 'Links a Financial Freedom Plan to the analysis.',
  })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID' })
  @ApiBody({ type: LinkPlanDto })
  @ApiResponse({
    status: 200,
    description: 'Plan linked successfully',
    type: AnalysisResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied' })
  @ApiResponse({ status: 404, description: 'Analysis or plan not found' })
  async linkPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
    @Body() linkDto: LinkPlanDto,
  ): Promise<PersonalFinancialAnalysis> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    return await this.analysisService.linkFinancialFreedomPlan(id, linkDto, accountId);
  }

  /**
   * Unlink Financial Freedom Plan
   */
  @Delete(':id/unlink-plan')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Unlink Financial Freedom Plan',
    description: 'Unlinks the Financial Freedom Plan from the analysis.',
  })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID' })
  @ApiResponse({ status: 204, description: 'Plan unlinked successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async unlinkPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
  ): Promise<void> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    await this.analysisService.unlinkFinancialFreedomPlan(id, accountId);
  }

  /**
   * Calculate metrics
   */
  @Get(':id/calculate-metrics')
  @ApiOperation({
    summary: 'Calculate metrics',
    description: 'Calculates and returns summary metrics for the analysis.',
  })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID' })
  @ApiResponse({
    status: 200,
    description: 'Metrics calculated successfully',
    type: AnalysisResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - access denied' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async calculateMetrics(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('accountId') accountId: string,
  ): Promise<PersonalFinancialAnalysis> {
    if (!accountId) {
      throw new BadRequestException('accountId query parameter is required');
    }
    return await this.analysisService.calculateMetrics(id, accountId);
  }
}

