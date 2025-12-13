import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonalFinancialAnalysis, AnalysisStatus } from '../entities/personal-financial-analysis.entity';
import { CreateAnalysisDto, UpdateAnalysisDto } from '../dto';
import { AnalysisCalculationService } from './analysis-calculation.service';
import { PortfolioAssetLoadingService } from './portfolio-asset-loading.service';
import { ScenarioManagementService } from './scenario-management.service';
import { CreateScenarioDto, UpdateScenarioDto } from '../dto/scenario.dto';
import { LinkPortfolioDto } from '../dto/link-portfolio.dto';
import { LinkPlanDto } from '../dto/link-plan.dto';
import { FinancialFreedomPlanService } from '../../financial-freedom/services/financial-freedom-plan.service';

/**
 * Personal Financial Analysis Service
 * Main service for managing personal financial analyses
 */
@Injectable()
export class PersonalFinancialAnalysisService {
  private readonly logger = new Logger(PersonalFinancialAnalysisService.name);

  constructor(
    @InjectRepository(PersonalFinancialAnalysis)
    private readonly analysisRepository: Repository<PersonalFinancialAnalysis>,
    private readonly calculationService: AnalysisCalculationService,
    private readonly portfolioAssetLoadingService: PortfolioAssetLoadingService,
    private readonly scenarioManagementService: ScenarioManagementService,
    @Inject(forwardRef(() => FinancialFreedomPlanService))
    private readonly financialFreedomPlanService: FinancialFreedomPlanService,
  ) {}

  /**
   * Get all analyses for an account
   * @param accountId - Account ID
   * @returns Promise<PersonalFinancialAnalysis[]>
   */
  async findAll(accountId: string): Promise<PersonalFinancialAnalysis[]> {
    return await this.analysisRepository.find({
      where: { accountId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single analysis by ID with access control
   * @param id - Analysis ID
   * @param accountId - Account ID
   * @returns Promise<PersonalFinancialAnalysis>
   */
  async findOne(id: string, accountId: string): Promise<PersonalFinancialAnalysis> {
    const analysis = await this.analysisRepository.findOne({
      where: { id },
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis with ID ${id} not found`);
    }

    // Verify access control
    if (analysis.accountId !== accountId) {
      throw new ForbiddenException(`Access denied to analysis ${id}`);
    }

    return analysis;
  }

  /**
   * Create a new analysis
   * @param createDto - Create analysis DTO
   * @param accountId - Account ID
   * @returns Promise<PersonalFinancialAnalysis>
   */
  async create(
    createDto: CreateAnalysisDto,
    accountId: string,
  ): Promise<PersonalFinancialAnalysis> {
    const analysis = this.analysisRepository.create({
      accountId,
      name: createDto.name,
      analysisDate: createDto.analysisDate ? new Date(createDto.analysisDate) : new Date(),
      baseCurrency: createDto.baseCurrency || 'VND',
      status: AnalysisStatus.DRAFT,
      isActive: true,
      assets: createDto.assets || [],
      income: createDto.income || [],
      expenses: createDto.expenses || [],
      debts: createDto.debts || [],
      scenarios: [],
      linkedPortfolioIds: [],
    });

    const savedAnalysis = await this.analysisRepository.save(analysis);

    // Calculate and update metrics
    await this.calculateAndUpdateMetrics(savedAnalysis.id, accountId);

    this.logger.log(`Created analysis ${savedAnalysis.id} for account ${accountId}`);

    return savedAnalysis;
  }

  /**
   * Update an analysis
   * @param id - Analysis ID
   * @param updateDto - Update analysis DTO
   * @param accountId - Account ID
   * @returns Promise<PersonalFinancialAnalysis>
   */
  async update(
    id: string,
    updateDto: UpdateAnalysisDto,
    accountId: string,
  ): Promise<PersonalFinancialAnalysis> {
    const analysis = await this.findOne(id, accountId);

    // Update fields
    if (updateDto.name !== undefined) {
      analysis.name = updateDto.name;
    }
    if (updateDto.analysisDate !== undefined) {
      analysis.analysisDate = new Date(updateDto.analysisDate);
    }
    if (updateDto.baseCurrency !== undefined) {
      analysis.baseCurrency = updateDto.baseCurrency;
    }
    if (updateDto.status !== undefined) {
      analysis.status = updateDto.status;
    }
    if (updateDto.notes !== undefined) {
      analysis.notes = updateDto.notes;
    }
    if (updateDto.assets !== undefined) {
      analysis.assets = updateDto.assets;
    }
    if (updateDto.income !== undefined) {
      analysis.income = updateDto.income;
    }
    if (updateDto.expenses !== undefined) {
      analysis.expenses = updateDto.expenses;
    }
    if (updateDto.debts !== undefined) {
      analysis.debts = updateDto.debts;
    }
    if (updateDto.scenarios !== undefined) {
      // Convert ScenarioDto[] to AnalysisScenario[] by ensuring all required fields are present
      analysis.scenarios = updateDto.scenarios.map((scenario) => ({
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        assets: scenario.assets || [],
        income: scenario.income || [],
        expenses: scenario.expenses || [],
        debts: scenario.debts || [],
        createdAt: scenario.createdAt,
        updatedAt: scenario.updatedAt,
      }));
    }

    analysis.updatedAt = new Date();

    const savedAnalysis = await this.analysisRepository.save(analysis);

    // Recalculate metrics if data changed
    if (
      updateDto.assets !== undefined ||
      updateDto.income !== undefined ||
      updateDto.expenses !== undefined ||
      updateDto.debts !== undefined
    ) {
      await this.calculateAndUpdateMetrics(savedAnalysis.id, accountId);
    }

    this.logger.log(`Updated analysis ${id}`);

    return savedAnalysis;
  }

  /**
   * Delete an analysis (soft delete by setting isActive to false)
   * @param id - Analysis ID
   * @param accountId - Account ID
   * @returns Promise<void>
   */
  async remove(id: string, accountId: string): Promise<void> {
    const analysis = await this.findOne(id, accountId);

    analysis.isActive = false;
    analysis.updatedAt = new Date();

    await this.analysisRepository.save(analysis);

    this.logger.log(`Deleted (deactivated) analysis ${id}`);
  }

  /**
   * Link a portfolio and load assets
   * @param id - Analysis ID
   * @param linkDto - Link portfolio DTO
   * @param accountId - Account ID
   * @returns Promise<PersonalFinancialAnalysis>
   */
  async linkPortfolio(
    id: string,
    linkDto: LinkPortfolioDto,
    accountId: string,
  ): Promise<PersonalFinancialAnalysis> {
    const analysis = await this.findOne(id, accountId);

    // Check if portfolio is already linked
    if (analysis.linkedPortfolioIds.includes(linkDto.portfolioId)) {
      throw new BadRequestException(`Portfolio ${linkDto.portfolioId} is already linked`);
    }

    // Load assets from portfolio
    const portfolioAssets = await this.portfolioAssetLoadingService.loadAssetsFromPortfolio(
      linkDto.portfolioId,
      analysis.baseCurrency,
      accountId,
    );

    // Add portfolio assets to analysis assets
    const existingAssets = analysis.assets || [];
    const updatedAssets = [...existingAssets, ...portfolioAssets];

    // Add portfolio ID to linked portfolios
    const linkedPortfolioIds = [...analysis.linkedPortfolioIds, linkDto.portfolioId];

    // Update analysis
    analysis.assets = updatedAssets;
    analysis.linkedPortfolioIds = linkedPortfolioIds;
    analysis.updatedAt = new Date();

    const savedAnalysis = await this.analysisRepository.save(analysis);

    // Recalculate metrics
    await this.calculateAndUpdateMetrics(savedAnalysis.id, accountId);

    this.logger.log(`Linked portfolio ${linkDto.portfolioId} to analysis ${id}`);

    return savedAnalysis;
  }

  /**
   * Unlink a portfolio
   * @param id - Analysis ID
   * @param portfolioId - Portfolio ID to unlink
   * @param accountId - Account ID
   * @returns Promise<PersonalFinancialAnalysis>
   */
  async unlinkPortfolio(
    id: string,
    portfolioId: string,
    accountId: string,
  ): Promise<PersonalFinancialAnalysis> {
    const analysis = await this.findOne(id, accountId);

    // Remove portfolio ID from linked portfolios
    const linkedPortfolioIds = analysis.linkedPortfolioIds.filter((pid) => pid !== portfolioId);

    // Remove assets from this portfolio
    const assets = (analysis.assets || []).filter(
      (asset) => asset.portfolioId !== portfolioId,
    );

    // Update analysis
    analysis.linkedPortfolioIds = linkedPortfolioIds;
    analysis.assets = assets;
    analysis.updatedAt = new Date();

    const savedAnalysis = await this.analysisRepository.save(analysis);

    // Recalculate metrics
    await this.calculateAndUpdateMetrics(savedAnalysis.id, accountId);

    this.logger.log(`Unlinked portfolio ${portfolioId} from analysis ${id}`);

    return savedAnalysis;
  }

  /**
   * Link a Financial Freedom Plan
   * @param id - Analysis ID
   * @param linkDto - Link plan DTO
   * @param accountId - Account ID
   * @returns Promise<PersonalFinancialAnalysis>
   */
  async linkFinancialFreedomPlan(
    id: string,
    linkDto: LinkPlanDto,
    accountId: string,
  ): Promise<PersonalFinancialAnalysis> {
    const analysis = await this.findOne(id, accountId);

    // Verify plan exists and belongs to same account
    try {
      await this.financialFreedomPlanService.findPlanById(linkDto.planId, accountId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Financial Freedom Plan with ID ${linkDto.planId} not found`);
      }
      throw error;
    }

    // Update analysis
    analysis.linkedFinancialFreedomPlanId = linkDto.planId;
    analysis.updatedAt = new Date();

    const savedAnalysis = await this.analysisRepository.save(analysis);

    this.logger.log(`Linked Financial Freedom Plan ${linkDto.planId} to analysis ${id}`);

    return savedAnalysis;
  }

  /**
   * Unlink Financial Freedom Plan
   * @param id - Analysis ID
   * @param accountId - Account ID
   * @returns Promise<PersonalFinancialAnalysis>
   */
  async unlinkFinancialFreedomPlan(
    id: string,
    accountId: string,
  ): Promise<PersonalFinancialAnalysis> {
    const analysis = await this.findOne(id, accountId);

    // Update analysis
    analysis.linkedFinancialFreedomPlanId = null;
    analysis.updatedAt = new Date();

    const savedAnalysis = await this.analysisRepository.save(analysis);

    this.logger.log(`Unlinked Financial Freedom Plan from analysis ${id}`);

    return savedAnalysis;
  }

  /**
   * Calculate and update metrics for an analysis
   * @param id - Analysis ID
   * @param accountId - Account ID
   * @returns Promise<PersonalFinancialAnalysis>
   */
  async calculateMetrics(id: string, accountId: string): Promise<PersonalFinancialAnalysis> {
    return await this.calculateAndUpdateMetrics(id, accountId);
  }

  /**
   * Create a scenario (delegates to ScenarioManagementService)
   */
  async createScenario(
    id: string,
    scenarioDto: CreateScenarioDto,
    accountId: string,
  ) {
    return await this.scenarioManagementService.createScenario(id, scenarioDto, accountId);
  }

  /**
   * Update a scenario (delegates to ScenarioManagementService)
   */
  async updateScenario(
    id: string,
    scenarioId: string,
    scenarioDto: UpdateScenarioDto,
    accountId: string,
  ) {
    return await this.scenarioManagementService.updateScenario(id, scenarioId, scenarioDto, accountId);
  }

  /**
   * Delete a scenario (delegates to ScenarioManagementService)
   */
  async deleteScenario(id: string, scenarioId: string, accountId: string): Promise<void> {
    return await this.scenarioManagementService.deleteScenario(id, scenarioId, accountId);
  }

  /**
   * Duplicate a scenario (delegates to ScenarioManagementService)
   */
  async duplicateScenario(id: string, scenarioId: string, accountId: string) {
    return await this.scenarioManagementService.duplicateScenario(id, scenarioId, accountId);
  }

  /**
   * Calculate and update metrics for an analysis
   * @private
   */
  private async calculateAndUpdateMetrics(
    id: string,
    accountId: string,
  ): Promise<PersonalFinancialAnalysis> {
    const analysis = await this.findOne(id, accountId);

    // Calculate summary metrics
    const summaryMetrics = this.calculationService.calculateSummaryMetrics(analysis);

    // Calculate income expense breakdown
    const incomeExpenseBreakdown = this.calculationService.calculateIncomeExpenseBreakdown(analysis);

    // Update analysis with calculated metrics
    analysis.summaryMetrics = summaryMetrics;
    analysis.incomeExpenseBreakdown = incomeExpenseBreakdown;
    analysis.updatedAt = new Date();

    const savedAnalysis = await this.analysisRepository.save(analysis);

    return savedAnalysis;
  }
}

