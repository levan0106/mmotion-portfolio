import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonalFinancialAnalysis, AnalysisScenario } from '../entities/personal-financial-analysis.entity';
import { CreateScenarioDto, UpdateScenarioDto } from '../dto/scenario.dto';
import { randomUUID } from 'crypto';

/**
 * Scenario Management Service
 * Handles CRUD operations for analysis scenarios
 */
@Injectable()
export class ScenarioManagementService {
  private readonly logger = new Logger(ScenarioManagementService.name);

  constructor(
    @InjectRepository(PersonalFinancialAnalysis)
    private readonly analysisRepository: Repository<PersonalFinancialAnalysis>,
  ) {}

  /**
   * Create a new scenario for an analysis
   * @param analysisId - Analysis ID
   * @param scenarioDto - Scenario data
   * @param accountId - Account ID for access control
   * @returns Promise<AnalysisScenario> Created scenario
   */
  async createScenario(
    analysisId: string,
    scenarioDto: CreateScenarioDto,
    accountId: string,
  ): Promise<AnalysisScenario> {
    const analysis = await this.analysisRepository.findOne({
      where: { id: analysisId, accountId },
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis with ID ${analysisId} not found`);
    }

    // Verify access control
    if (analysis.accountId !== accountId) {
      throw new ForbiddenException(`Access denied to analysis ${analysisId}`);
    }

    // Create new scenario
    const newScenario: AnalysisScenario = {
      id: randomUUID(),
      name: scenarioDto.name,
      description: scenarioDto.description || '',
      assets: scenarioDto.assets || [],
      income: scenarioDto.income || [],
      expenses: scenarioDto.expenses || [],
      debts: scenarioDto.debts || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add scenario to analysis
    const scenarios = analysis.scenarios || [];
    scenarios.push(newScenario);

    // Update analysis
    analysis.scenarios = scenarios;
    analysis.updatedAt = new Date();

    await this.analysisRepository.save(analysis);

    this.logger.log(`Created scenario ${newScenario.id} for analysis ${analysisId}`);

    return newScenario;
  }

  /**
   * Update an existing scenario
   * @param analysisId - Analysis ID
   * @param scenarioId - Scenario ID
   * @param scenarioDto - Updated scenario data
   * @param accountId - Account ID for access control
   * @returns Promise<AnalysisScenario> Updated scenario
   */
  async updateScenario(
    analysisId: string,
    scenarioId: string,
    scenarioDto: UpdateScenarioDto,
    accountId: string,
  ): Promise<AnalysisScenario> {
    const analysis = await this.analysisRepository.findOne({
      where: { id: analysisId, accountId },
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis with ID ${analysisId} not found`);
    }

    // Verify access control
    if (analysis.accountId !== accountId) {
      throw new ForbiddenException(`Access denied to analysis ${analysisId}`);
    }

    // Find scenario
    const scenarios = analysis.scenarios || [];
    const scenarioIndex = scenarios.findIndex((s) => s.id === scenarioId);

    if (scenarioIndex === -1) {
      throw new NotFoundException(`Scenario with ID ${scenarioId} not found`);
    }

    // Update scenario
    const updatedScenario: AnalysisScenario = {
      ...scenarios[scenarioIndex],
      ...scenarioDto,
      updatedAt: new Date().toISOString(),
    };

    scenarios[scenarioIndex] = updatedScenario;

    // Update analysis
    analysis.scenarios = scenarios;
    analysis.updatedAt = new Date();

    await this.analysisRepository.save(analysis);

    this.logger.log(`Updated scenario ${scenarioId} for analysis ${analysisId}`);

    return updatedScenario;
  }

  /**
   * Delete a scenario
   * @param analysisId - Analysis ID
   * @param scenarioId - Scenario ID
   * @param accountId - Account ID for access control
   * @returns Promise<void>
   */
  async deleteScenario(analysisId: string, scenarioId: string, accountId: string): Promise<void> {
    const analysis = await this.analysisRepository.findOne({
      where: { id: analysisId, accountId },
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis with ID ${analysisId} not found`);
    }

    // Verify access control
    if (analysis.accountId !== accountId) {
      throw new ForbiddenException(`Access denied to analysis ${analysisId}`);
    }

    // Find and remove scenario
    const scenarios = analysis.scenarios || [];
    const scenarioIndex = scenarios.findIndex((s) => s.id === scenarioId);

    if (scenarioIndex === -1) {
      throw new NotFoundException(`Scenario with ID ${scenarioId} not found`);
    }

    scenarios.splice(scenarioIndex, 1);

    // Update analysis
    analysis.scenarios = scenarios;
    analysis.updatedAt = new Date();

    await this.analysisRepository.save(analysis);

    this.logger.log(`Deleted scenario ${scenarioId} from analysis ${analysisId}`);
  }

  /**
   * Duplicate a scenario
   * @param analysisId - Analysis ID
   * @param scenarioId - Scenario ID to duplicate
   * @param accountId - Account ID for access control
   * @returns Promise<AnalysisScenario> Duplicated scenario
   */
  async duplicateScenario(
    analysisId: string,
    scenarioId: string,
    accountId: string,
  ): Promise<AnalysisScenario> {
    const analysis = await this.analysisRepository.findOne({
      where: { id: analysisId, accountId },
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis with ID ${analysisId} not found`);
    }

    // Verify access control
    if (analysis.accountId !== accountId) {
      throw new ForbiddenException(`Access denied to analysis ${analysisId}`);
    }

    // Find scenario to duplicate
    const scenarios = analysis.scenarios || [];
    const sourceScenario = scenarios.find((s) => s.id === scenarioId);

    if (!sourceScenario) {
      throw new NotFoundException(`Scenario with ID ${scenarioId} not found`);
    }

    // Create duplicate scenario
    const duplicatedScenario: AnalysisScenario = {
      ...sourceScenario,
      id: randomUUID(),
      name: `${sourceScenario.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    scenarios.push(duplicatedScenario);

    // Update analysis
    analysis.scenarios = scenarios;
    analysis.updatedAt = new Date();

    await this.analysisRepository.save(analysis);

    this.logger.log(`Duplicated scenario ${scenarioId} to ${duplicatedScenario.id} for analysis ${analysisId}`);

    return duplicatedScenario;
  }
}

