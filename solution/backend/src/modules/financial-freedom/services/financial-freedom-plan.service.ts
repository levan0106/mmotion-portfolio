import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FinancialFreedomPlan } from '../entities/financial-freedom-plan.entity';
import { CreatePlanDto, UpdatePlanDto, PlanResponseDto, ProgressResponseDto } from '../dto';
import { GoalService } from '../../goal/services/goal.service';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { PortfolioGoal, GoalPortfolio } from '../../goal/entities';
import { PortfolioValueCalculatorService } from '../../portfolio/services/portfolio-value-calculator.service';
import { TWRCalculationService } from '../../portfolio/services/twr-calculation.service';
import { SnapshotGranularity } from '../../portfolio/enums/snapshot-granularity.enum';
import { DepositCalculationService } from '../../shared/services/deposit-calculation.service';

@Injectable()
export class FinancialFreedomPlanService {
  constructor(
    @InjectRepository(FinancialFreedomPlan)
    private planRepository: Repository<FinancialFreedomPlan>,
    @InjectRepository(PortfolioGoal)
    private goalRepository: Repository<PortfolioGoal>,
    @InjectRepository(GoalPortfolio)
    private goalPortfolioRepository: Repository<GoalPortfolio>,
    @Inject(forwardRef(() => GoalService))
    private goalService: GoalService,
    @Inject(forwardRef(() => PortfolioService))
    private portfolioService: PortfolioService,
    @Inject(forwardRef(() => PortfolioValueCalculatorService))
    private portfolioValueCalculator: PortfolioValueCalculatorService,
    @Inject(forwardRef(() => TWRCalculationService))
    private twrCalculationService: TWRCalculationService,
    @Inject(forwardRef(() => DepositCalculationService))
    private depositCalculationService: DepositCalculationService,
  ) {}

  /**
   * Serialize yearlyProjections array to JSON string
   * Rounds year field to integer if present
   */
  private serializeYearlyProjections(
    yearlyProjections: any[] | null | undefined,
    forUpdate: boolean = false,
  ): string | null | undefined {
    if (yearlyProjections === undefined) {
      return forUpdate ? undefined : null;
    }
    if (yearlyProjections === null) {
      return null;
    }
    if (Array.isArray(yearlyProjections)) {
      const processedProjections = yearlyProjections.length > 0
        ? yearlyProjections.map((p: any) => ({
            ...p,
            year: p.year !== undefined && p.year !== null ? Math.round(p.year) : p.year,
          }))
        : [];
      return JSON.stringify(processedProjections);
    }
    // If it's not an array and not null, try to stringify it anyway
    return JSON.stringify(yearlyProjections);
  }

  /**
   * Serialize milestones array to JSON string
   * Rounds year field to integer if present
   */
  private serializeMilestones(
    milestones: any[] | null | undefined,
    forUpdate: boolean = false,
  ): string | null | undefined {
    if (milestones === undefined) {
      return forUpdate ? undefined : null;
    }
    if (milestones === null) {
      return null;
    }
    if (Array.isArray(milestones)) {
      const processedMilestones = milestones.length > 0
        ? milestones.map((m: any) => ({
            ...m,
            year: m.year !== undefined && m.year !== null ? Math.round(m.year) : m.year,
          }))
        : [];
      return JSON.stringify(processedMilestones);
    }
    // If it's not an array and not null, try to stringify it anyway
    return JSON.stringify(milestones);
  }

  /**
   * Serialize scenarios object to JSON string
   */
  private serializeScenarios(
    scenarios: any | null | undefined,
    forUpdate: boolean = false,
  ): string | null | undefined {
    if (scenarios === undefined) {
      return forUpdate ? undefined : null;
    }
    if (scenarios === null) {
      return null;
    }
    return JSON.stringify(scenarios);
  }

  /**
   * Serialize suggestedAllocation object to JSON string
   */
  private serializeSuggestedAllocation(
    suggestedAllocation: any | null | undefined,
    forUpdate: boolean = false,
  ): string | null | undefined {
    if (suggestedAllocation === undefined) {
      return forUpdate ? undefined : null;
    }
    if (suggestedAllocation === null) {
      return null;
    }
    return JSON.stringify(suggestedAllocation);
  }

  /**
   * Prepare JSONB fields for database operations
   */
  private prepareJsonbFields(
    dto: CreatePlanDto | UpdatePlanDto,
    forUpdate: boolean = false,
  ) {
    return {
      yearlyProjectionsJson: this.serializeYearlyProjections(dto.yearlyProjections, forUpdate),
      milestonesJson: this.serializeMilestones(dto.milestones, forUpdate),
      scenariosJson: this.serializeScenarios(dto.scenarios, forUpdate),
      suggestedAllocationJson: this.serializeSuggestedAllocation(dto.suggestedAllocation, forUpdate),
    };
  }

  async createPlan(createPlanDto: CreatePlanDto, accountId: string): Promise<PlanResponseDto> {
    // investmentYears can now be decimal, no rounding needed
    const investmentYears = createPlanDto.investmentYears ?? null;

    // Prepare JSONB fields using shared helper functions
    const { yearlyProjectionsJson, milestonesJson, scenariosJson, suggestedAllocationJson } = 
      this.prepareJsonbFields(createPlanDto, false);

    // Use raw query to ensure proper JSONB handling
    const result = await this.planRepository.query(
      `INSERT INTO financial_freedom_plans (
        account_id, name, description, start_date, target_method, target_present_value, future_value_required,
        monthly_expenses, withdrawal_rate, initial_investment, periodic_payment, payment_frequency, payment_type,
        investment_years, required_return_rate, inflation_rate, risk_tolerance,
        suggested_allocation, yearly_projections, scenarios,
        linked_portfolio_ids, linked_goal_ids, milestones, template_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
      [
        accountId,
        createPlanDto.name,
        createPlanDto.description ?? null,
        createPlanDto.startDate ?? null,
        createPlanDto.targetMethod ?? null,
        createPlanDto.targetPresentValue,
        createPlanDto.futureValueRequired,
        createPlanDto.monthlyExpenses ?? null,
        createPlanDto.withdrawalRate ?? null,
        createPlanDto.initialInvestment ?? null,
        createPlanDto.periodicPayment ?? null,
        createPlanDto.paymentFrequency,
        createPlanDto.paymentType,
        investmentYears,
        createPlanDto.requiredReturnRate ?? null,
        createPlanDto.inflationRate,
        createPlanDto.riskTolerance,
        suggestedAllocationJson,
        yearlyProjectionsJson,
        scenariosJson,
        createPlanDto.linkedPortfolioIds || [],
        createPlanDto.linkedGoalIds || [],
        milestonesJson,
        createPlanDto.templateId ?? null,
      ]
    );

    if (!result || result.length === 0) {
      throw new BadRequestException('Failed to create plan');
    }

    // Get the saved entity using TypeORM to ensure proper deserialization
    const savedEntity = await this.planRepository.findOne({
      where: { id: result[0].id },
    });

    if (!savedEntity) {
      throw new BadRequestException('Failed to retrieve created plan');
    }

    return this.mapToResponseDto(savedEntity);
  }

  async findAllPlans(accountId: string): Promise<PlanResponseDto[]> {
    const plans = await this.planRepository.find({
      where: { accountId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    return plans.map(plan => this.mapToResponseDto(plan));
  }

  async findPlanById(id: string, accountId: string): Promise<PlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id, accountId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return this.mapToResponseDto(plan);
  }

  async updatePlan(id: string, updatePlanDto: UpdatePlanDto, accountId: string): Promise<PlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id, accountId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    // investmentYears can now be decimal, no rounding needed
    const investmentYears = updatePlanDto.investmentYears;

    // Prepare JSONB fields using shared helper functions
    const { yearlyProjectionsJson, milestonesJson, scenariosJson, suggestedAllocationJson } = 
      this.prepareJsonbFields(updatePlanDto, true);

    // Build dynamic UPDATE query for JSONB fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    // Handle regular fields
    if (updatePlanDto.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(updatePlanDto.name);
    }
    if (updatePlanDto.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(updatePlanDto.description ?? null);
    }
    if (updatePlanDto.startDate !== undefined) {
      updateFields.push(`start_date = $${paramIndex++}`);
      updateValues.push(updatePlanDto.startDate ?? null);
    }
    if (updatePlanDto.targetMethod !== undefined) {
      updateFields.push(`target_method = $${paramIndex++}`);
      updateValues.push(updatePlanDto.targetMethod);
    }
    if (updatePlanDto.targetPresentValue !== undefined) {
      updateFields.push(`target_present_value = $${paramIndex++}`);
      updateValues.push(updatePlanDto.targetPresentValue);
    }
    if (updatePlanDto.futureValueRequired !== undefined) {
      updateFields.push(`future_value_required = $${paramIndex++}`);
      updateValues.push(updatePlanDto.futureValueRequired);
    }
    if (updatePlanDto.monthlyExpenses !== undefined) {
      updateFields.push(`monthly_expenses = $${paramIndex++}`);
      updateValues.push(updatePlanDto.monthlyExpenses);
    }
    if (updatePlanDto.withdrawalRate !== undefined) {
      updateFields.push(`withdrawal_rate = $${paramIndex++}`);
      updateValues.push(updatePlanDto.withdrawalRate);
    }
    if (updatePlanDto.initialInvestment !== undefined) {
      updateFields.push(`initial_investment = $${paramIndex++}`);
      updateValues.push(updatePlanDto.initialInvestment);
    }
    if (updatePlanDto.periodicPayment !== undefined) {
      updateFields.push(`periodic_payment = $${paramIndex++}`);
      updateValues.push(updatePlanDto.periodicPayment);
    }
    if (updatePlanDto.paymentFrequency !== undefined) {
      updateFields.push(`payment_frequency = $${paramIndex++}`);
      updateValues.push(updatePlanDto.paymentFrequency);
    }
    if (updatePlanDto.paymentType !== undefined) {
      updateFields.push(`payment_type = $${paramIndex++}`);
      updateValues.push(updatePlanDto.paymentType);
    }
    if (investmentYears !== undefined) {
      updateFields.push(`investment_years = $${paramIndex++}`);
      updateValues.push(investmentYears);
    }
    if (updatePlanDto.requiredReturnRate !== undefined) {
      updateFields.push(`required_return_rate = $${paramIndex++}`);
      updateValues.push(updatePlanDto.requiredReturnRate);
    }
    if (updatePlanDto.inflationRate !== undefined) {
      updateFields.push(`inflation_rate = $${paramIndex++}`);
      updateValues.push(updatePlanDto.inflationRate);
    }
    if (updatePlanDto.riskTolerance !== undefined) {
      updateFields.push(`risk_tolerance = $${paramIndex++}`);
      updateValues.push(updatePlanDto.riskTolerance);
    }
    if (updatePlanDto.linkedPortfolioIds !== undefined) {
      updateFields.push(`linked_portfolio_ids = $${paramIndex++}`);
      updateValues.push(updatePlanDto.linkedPortfolioIds || []);
    }
    if (updatePlanDto.linkedGoalIds !== undefined) {
      updateFields.push(`linked_goal_ids = $${paramIndex++}`);
      updateValues.push(updatePlanDto.linkedGoalIds || []);
    }
    if (updatePlanDto.templateId !== undefined) {
      updateFields.push(`template_id = $${paramIndex++}`);
      updateValues.push(updatePlanDto.templateId);
    }

    // Handle JSONB fields
    if (suggestedAllocationJson !== undefined) {
      updateFields.push(`suggested_allocation = $${paramIndex++}::jsonb`);
      updateValues.push(suggestedAllocationJson);
    }
    if (yearlyProjectionsJson !== undefined) {
      updateFields.push(`yearly_projections = $${paramIndex++}::jsonb`);
      updateValues.push(yearlyProjectionsJson);
    }
    if (scenariosJson !== undefined) {
      updateFields.push(`scenarios = $${paramIndex++}::jsonb`);
      updateValues.push(scenariosJson);
    }
    if (milestonesJson !== undefined) {
      updateFields.push(`milestones = $${paramIndex++}::jsonb`);
      updateValues.push(milestonesJson);
    }

    if (updateFields.length === 0) {
      // No fields to update, return existing plan
      return this.mapToResponseDto(plan);
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    // Add WHERE clause parameters
    updateValues.push(id, accountId);

    // Execute raw UPDATE query to ensure proper JSONB handling
    await this.planRepository.query(
      `UPDATE financial_freedom_plans 
       SET ${updateFields.join(', ')} 
       WHERE id = $${paramIndex++} AND account_id = $${paramIndex++}`,
      updateValues
    );

    // Get the updated entity using TypeORM to ensure proper deserialization
    const updatedEntity = await this.planRepository.findOne({
      where: { id, accountId },
    });

    if (!updatedEntity) {
      throw new NotFoundException(`Plan with ID ${id} not found after update`);
    }

    return this.mapToResponseDto(updatedEntity);
  }

  async deletePlan(id: string, accountId: string): Promise<{ message: string }> {
    const plan = await this.planRepository.findOne({
      where: { id, accountId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    // Soft delete by setting isActive to false
    plan.isActive = false;
    await this.planRepository.save(plan);

    return { message: 'Plan deleted successfully' };
  }

  async duplicatePlan(id: string, accountId: string): Promise<PlanResponseDto> {
    const originalPlan = await this.planRepository.findOne({
      where: { id, accountId },
    });

    if (!originalPlan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    // Create a copy excluding id, timestamps, and some fields
    const { id: _, createdAt, updatedAt, ...planData } = originalPlan;
    
    const duplicatedPlan = this.planRepository.create({
      ...planData,
      name: `${originalPlan.name} (Copy)`,
    });

    const savedPlan = await this.planRepository.save(duplicatedPlan);
    // TypeORM save() can return array or single entity depending on input
    // Ensure we get single entity
    const savedEntity = Array.isArray(savedPlan) ? savedPlan[0] : savedPlan;
    return this.mapToResponseDto(savedEntity);
  }

  /**
   * Link a goal to a plan
   * @param planId - Plan ID
   * @param goalId - Goal ID to link
   * @param accountId - Account ID (for ownership verification)
   * @returns Promise<PlanResponseDto>
   */
  async linkToGoal(planId: string, goalId: string, accountId: string): Promise<PlanResponseDto> {
    // Verify plan ownership
    const plan = await this.planRepository.findOne({
      where: { id: planId, accountId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Verify goal exists and user has access (simple check without loading relations)
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, accountId },
      select: ['id', 'accountId'], // Only select minimal fields
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found or access denied`);
    }

    // Check if goal is already linked
    if (plan.linkedGoalIds && plan.linkedGoalIds.includes(goalId)) {
      throw new BadRequestException('Goal is already linked to this plan');
    }

    // Add goal to linked goals array
    const updatedLinkedGoalIds = [...(plan.linkedGoalIds || []), goalId];

    // Update plan
    await this.planRepository.update(
      { id: planId },
      {
        linkedGoalIds: updatedLinkedGoalIds,
        updatedAt: new Date(),
      }
    );

    // Return updated plan
    const updatedPlan = await this.planRepository.findOne({
      where: { id: planId },
    });

    if (!updatedPlan) {
      throw new NotFoundException(`Plan with ID ${planId} not found after update`);
    }

    return this.mapToResponseDto(updatedPlan);
  }

  /**
   * Unlink a goal from a plan
   * @param planId - Plan ID
   * @param goalId - Goal ID to unlink
   * @param accountId - Account ID (for ownership verification)
   * @returns Promise<PlanResponseDto>
   */
  async unlinkGoal(planId: string, goalId: string, accountId: string): Promise<PlanResponseDto> {
    // Verify plan ownership
    const plan = await this.planRepository.findOne({
      where: { id: planId, accountId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Check if goal is linked
    if (!plan.linkedGoalIds || !plan.linkedGoalIds.includes(goalId)) {
      throw new BadRequestException('Goal is not linked to this plan');
    }

    // Remove goal from linked goals array
    const updatedLinkedGoalIds = plan.linkedGoalIds.filter(id => id !== goalId);

    // Update plan
    await this.planRepository.update(
      { id: planId },
      {
        linkedGoalIds: updatedLinkedGoalIds,
        updatedAt: new Date(),
      }
    );

    // Return updated plan
    const updatedPlan = await this.planRepository.findOne({
      where: { id: planId },
    });

    if (!updatedPlan) {
      throw new NotFoundException(`Plan with ID ${planId} not found after update`);
    }

    return this.mapToResponseDto(updatedPlan);
  }

  /**
   * Link a portfolio to a plan
   * @param planId - Plan ID
   * @param portfolioId - Portfolio ID to link
   * @param accountId - Account ID (for ownership verification)
   * @returns Promise<PlanResponseDto>
   */
  async linkToPortfolio(planId: string, portfolioId: string, accountId: string): Promise<PlanResponseDto> {
    // Verify plan ownership
    const plan = await this.planRepository.findOne({
      where: { id: planId, accountId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Verify portfolio exists and user has access (VIEW permission required)
    const hasAccess = await this.portfolioService.checkPortfolioAccess(portfolioId, accountId, 'view');
    if (!hasAccess) {
      throw new ForbiddenException('Portfolio not found or access denied');
    }

    // Check if portfolio is already linked
    if (plan.linkedPortfolioIds && plan.linkedPortfolioIds.includes(portfolioId)) {
      throw new BadRequestException('Portfolio is already linked to this plan');
    }

    // Add portfolio to linked portfolios array
    const updatedLinkedPortfolioIds = [...(plan.linkedPortfolioIds || []), portfolioId];

    // Update plan
    await this.planRepository.update(
      { id: planId },
      {
        linkedPortfolioIds: updatedLinkedPortfolioIds,
        updatedAt: new Date(),
      }
    );

    // Return updated plan
    const updatedPlan = await this.planRepository.findOne({
      where: { id: planId },
    });

    if (!updatedPlan) {
      throw new NotFoundException(`Plan with ID ${planId} not found after update`);
    }

    return this.mapToResponseDto(updatedPlan);
  }

  /**
   * Unlink a portfolio from a plan
   * @param planId - Plan ID
   * @param portfolioId - Portfolio ID to unlink
   * @param accountId - Account ID (for ownership verification)
   * @returns Promise<PlanResponseDto>
   */
  async unlinkPortfolio(planId: string, portfolioId: string, accountId: string): Promise<PlanResponseDto> {
    // Verify plan ownership
    const plan = await this.planRepository.findOne({
      where: { id: planId, accountId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Check if portfolio is linked
    if (!plan.linkedPortfolioIds || !plan.linkedPortfolioIds.includes(portfolioId)) {
      throw new BadRequestException('Portfolio is not linked to this plan');
    }

    // Remove portfolio from linked portfolios array
    const updatedLinkedPortfolioIds = plan.linkedPortfolioIds.filter(id => id !== portfolioId);

    // Update plan
    await this.planRepository.update(
      { id: planId },
      {
        linkedPortfolioIds: updatedLinkedPortfolioIds,
        updatedAt: new Date(),
      }
    );

    // Return updated plan
    const updatedPlan = await this.planRepository.findOne({
      where: { id: planId },
    });

    if (!updatedPlan) {
      throw new NotFoundException(`Plan with ID ${planId} not found after update`);
    }

    return this.mapToResponseDto(updatedPlan);
  }

  /**
   * Calculate progress for a plan based on linked portfolios
   * @param planId - Plan ID
   * @param accountId - Account ID (for ownership verification)
   * @returns Promise<ProgressResponseDto>
   */
  async calculateProgress(planId: string, accountId: string): Promise<ProgressResponseDto> {
    // Verify plan ownership
    const plan = await this.planRepository.findOne({
      where: { id: planId, accountId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Get all portfolio IDs: combine direct linked portfolios + portfolios from linked goals
    const allPortfolioIds = await this.getAllPortfolioIds(plan);

    // Get current portfolio value from all portfolios (direct + from goals)
    const currentValue = await this.getCurrentPortfolioValue(allPortfolioIds);

    // Get actual return rate (weighted average TWR across all portfolios)
    const actualReturnRate = await this.getActualReturnRate(allPortfolioIds);

    // Calculate progress percentage
    const targetValue = plan.futureValueRequired || 0;
    const progressPercentage = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

    // Calculate remaining amount
    const remainingAmount = Math.max(0, targetValue - currentValue);

    // Calculate remaining years (simplified - can be enhanced with proper calculation)
    const remainingYears = this.calculateRemainingYears(
      currentValue,
      targetValue,
      plan.periodicPayment || 0,
      plan.paymentFrequency,
      actualReturnRate,
    );

    // Check milestones
    const milestones = this.checkMilestones(plan, currentValue);

    // Generate alerts
    const alerts = await this.generateAlerts(plan, currentValue, actualReturnRate);

    // Calculate yearly comparison (last 3 years if available)
    const yearlyComparison = this.calculateYearlyComparison(plan, currentValue);

    return {
      planId: plan.id,
      currentValue,
      targetValue,
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
      remainingAmount,
      remainingYears,
      currentReturnRate: actualReturnRate,
      requiredReturnRate: Number(plan.requiredReturnRate) || 0,
      gap: (Number(plan.requiredReturnRate) || 0) - actualReturnRate,
      milestones,
      alerts,
      yearlyComparison,
    };
  }

  /**
   * Get current portfolio value from all linked portfolios
   * Formula: totalValue = totalAssetValue + totalDepositValue + cashBalance
   */
  private async getCurrentPortfolioValue(portfolioIds: string[]): Promise<number> {
    if (!portfolioIds || portfolioIds.length === 0) {
      return 0;
    }

    let totalValue = 0;
    for (const portfolioId of portfolioIds) {
      try {
        // Calculate asset values (includes cashBalance)
        const values = await this.portfolioValueCalculator.calculateAllValues(portfolioId);
        
        // Calculate deposit values
        const depositData = await this.depositCalculationService.calculateDepositDataByPortfolioId(portfolioId);
        
        // Total value = assetValue + cashBalance + depositValue
        // Note: values.totalValue already includes cashBalance, so we just add depositValue
        totalValue += values.totalValue + depositData.totalDepositValue;
      } catch (error) {
        // Log error but continue with other portfolios
        console.error(`Error calculating value for portfolio ${portfolioId}:`, error);
      }
    }

    return totalValue;
  }

  /**
   * Get all portfolio IDs for a plan:
   * - Direct linked portfolios (plan.linkedPortfolioIds)
   * - Portfolios from linked goals (via goal_portfolios table)
   * @param plan - The financial freedom plan
   * @returns Array of unique portfolio IDs
   */
  private async getAllPortfolioIds(plan: FinancialFreedomPlan): Promise<string[]> {
    const portfolioIds = new Set<string>();

    // Add direct linked portfolios
    if (plan.linkedPortfolioIds && plan.linkedPortfolioIds.length > 0) {
      plan.linkedPortfolioIds.forEach(id => portfolioIds.add(id));
    }

    // Add portfolios from linked goals
    if (plan.linkedGoalIds && plan.linkedGoalIds.length > 0) {
      const goalPortfolios = await this.goalPortfolioRepository.find({
        where: { goalId: In(plan.linkedGoalIds) },
        select: ['portfolioId'],
      });

      goalPortfolios.forEach(gp => portfolioIds.add(gp.portfolioId));
    }

    return Array.from(portfolioIds);
  }

  /**
   * Get actual return rate (weighted average TWR across portfolios)
   */
  private async getActualReturnRate(portfolioIds: string[]): Promise<number> {
    if (!portfolioIds || portfolioIds.length === 0) {
      return 0;
    }

    const now = new Date();
    const portfolioReturns: Array<{ portfolioId: string; twr: number; value: number }> = [];

    // Calculate TWR and value for each portfolio
    for (const portfolioId of portfolioIds) {
      try {
        const [twrResult, values] = await Promise.all([
          this.twrCalculationService.calculatePortfolioTWR({
            portfolioId,
            snapshotDate: now,
            granularity: SnapshotGranularity.DAILY,
          }),
          this.portfolioValueCalculator.calculateAllValues(portfolioId),
        ]);

        // Use 1-year TWR for comparison
        const twr1Y = twrResult.twr1Y || 0;
        portfolioReturns.push({
          portfolioId,
          twr: twr1Y,
          value: values.totalValue,
        });
      } catch (error) {
        // Log error but continue with other portfolios
        console.error(`Error calculating TWR for portfolio ${portfolioId}:`, error);
      }
    }

    if (portfolioReturns.length === 0) {
      return 0;
    }

    // Calculate weighted average TWR
    const totalValue = portfolioReturns.reduce((sum, p) => sum + p.value, 0);
    if (totalValue === 0) {
      return 0;
    }

    const weightedTWR = portfolioReturns.reduce((sum, p) => {
      const weight = p.value / totalValue;
      return sum + (p.twr * weight);
    }, 0);

    return weightedTWR;
  }

  /**
   * Calculate remaining years to reach goal
   */
  private calculateRemainingYears(
    currentValue: number,
    targetValue: number,
    periodicPayment: number,
    paymentFrequency: string,
    returnRate: number,
  ): number {
    if (targetValue <= currentValue) {
      return 0;
    }

    if (returnRate <= 0 && periodicPayment <= 0) {
      return Infinity; // Cannot reach goal
    }

    // Simplified calculation - can be enhanced with proper FV formula
    // Using approximation: FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
    const periodsPerYear = this.getPeriodsPerYear(paymentFrequency);
    const returnRatePerPeriod = returnRate / 100 / periodsPerYear;

    // Binary search for remaining years
    let low = 0;
    let high = 100; // Max 100 years
    let bestGuess = 0;

    for (let i = 0; i < 50; i++) {
      const mid = (low + high) / 2;
      const periods = mid * periodsPerYear;
      const futureValue = this.calculateFutureValueApprox(
        currentValue,
        periodicPayment,
        returnRatePerPeriod,
        periods,
      );

      if (futureValue >= targetValue) {
        bestGuess = mid;
        high = mid;
      } else {
        low = mid;
      }

      if (high - low < 0.01) {
        break;
      }
    }

    return Math.ceil(bestGuess);
  }

  /**
   * Calculate future value approximation
   */
  private calculateFutureValueApprox(
    presentValue: number,
    periodicPayment: number,
    returnRatePerPeriod: number,
    periods: number,
  ): number {
    if (returnRatePerPeriod === 0) {
      return presentValue + periodicPayment * periods;
    }

    const compoundFactor = Math.pow(1 + returnRatePerPeriod, periods);
    const fvFromPV = presentValue * compoundFactor;
    const fvFromPMT = periodicPayment * ((compoundFactor - 1) / returnRatePerPeriod);

    return fvFromPV + fvFromPMT;
  }

  /**
   * Get periods per year based on payment frequency
   */
  private getPeriodsPerYear(frequency: string): number {
    switch (frequency?.toLowerCase()) {
      case 'monthly':
        return 12;
      case 'quarterly':
        return 4;
      case 'yearly':
        return 1;
      default:
        return 12; // Default to monthly
    }
  }

  /**
   * Check milestones achievement
   */
  private checkMilestones(plan: FinancialFreedomPlan, currentValue: number): Array<{
    year: number;
    description: string;
    targetValue: number;
    achieved: boolean;
    achievedAt?: Date;
  }> {
    if (!plan.milestones || !Array.isArray(plan.milestones)) {
      return [];
    }

    return plan.milestones.map((milestone: any) => {
      const achieved = currentValue >= milestone.targetValue;
      return {
        year: milestone.year,
        description: milestone.description,
        targetValue: milestone.targetValue,
        achieved,
        achievedAt: achieved && !milestone.achievedAt ? new Date() : milestone.achievedAt,
      };
    });
  }

  /**
   * Generate alerts based on progress and performance
   */
  private async generateAlerts(
    plan: FinancialFreedomPlan,
    currentValue: number,
    actualReturnRate: number,
  ): Promise<Array<{
    type: 'rebalancing' | 'performance' | 'milestone';
    severity: 'info' | 'warning' | 'error';
    message: string;
    action?: string;
  }>> {
    const alerts: Array<{
      type: 'rebalancing' | 'performance' | 'milestone';
      severity: 'info' | 'warning' | 'error';
      message: string;
      action?: string;
    }> = [];

    // Performance gap alert
    const requiredReturnRate = Number(plan.requiredReturnRate) || 0;
    const gap = requiredReturnRate - actualReturnRate;

    if (gap > 2) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `Lợi nhuận thực tế (${actualReturnRate.toFixed(2)}%) thấp hơn lợi nhuận yêu cầu (${requiredReturnRate.toFixed(2)}%)`,
        action: 'Xem xét điều chỉnh phân bổ danh mục đầu tư hoặc tăng số tiền đóng góp định kỳ',
      });
    } else if (gap > 5) {
      alerts.push({
        type: 'performance',
        severity: 'error',
        message: `Chênh lệch lớn giữa lợi nhuận thực tế (${actualReturnRate.toFixed(2)}%) và lợi nhuận yêu cầu (${requiredReturnRate.toFixed(2)}%)`,
        action: 'Cần hành động ngay: xem xét lại chiến lược phân bổ hoặc điều chỉnh thông số kế hoạch',
      });
    }

    // Progress alert
    const progressPercentage = plan.futureValueRequired > 0
      ? (currentValue / plan.futureValueRequired) * 100
      : 0;

    if (progressPercentage < 50 && plan.investmentYears) {
      const yearsElapsed = (new Date().getTime() - new Date(plan.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
      const expectedProgress = (yearsElapsed / plan.investmentYears) * 100;

      if (progressPercentage < expectedProgress * 0.8) {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `Tiến độ (${progressPercentage.toFixed(1)}%) thấp hơn dự kiến (${expectedProgress.toFixed(1)}%)`,
          action: 'Xem xét tăng số tiền đóng góp hoặc rà soát lại chiến lược đầu tư',
        });
      }
    }

    return alerts;
  }

  /**
   * Calculate yearly comparison (simplified - can be enhanced with historical data)
   */
  private calculateYearlyComparison(
    plan: FinancialFreedomPlan,
    currentValue: number,
  ): Array<{
    year: number;
    targetValue: number;
    actualValue: number;
    difference: number;
  }> {
    if (!plan.yearlyProjections || !Array.isArray(plan.yearlyProjections)) {
      return [];
    }

    const currentYear = new Date().getFullYear();
    const comparisons: Array<{
      year: number;
      targetValue: number;
      actualValue: number;
      difference: number;
    }> = [];

    // Get last 3 years of projections
    const recentProjections = plan.yearlyProjections
      .filter((p: any) => p.year <= currentYear)
      .slice(-3);

    for (const projection of recentProjections) {
      const targetValue = projection.portfolioValue || 0;
      // For now, use current value for all years (can be enhanced with historical data)
      const actualValue = projection.year === currentYear ? currentValue : targetValue * 0.8; // Placeholder
      comparisons.push({
        year: projection.year,
        targetValue,
        actualValue,
        difference: actualValue - targetValue,
      });
    }

    return comparisons;
  }

  private mapToResponseDto(plan: FinancialFreedomPlan): PlanResponseDto {
    return {
      id: plan.id,
      accountId: plan.accountId,
      name: plan.name,
      description: plan.description,
      startDate: plan.startDate,
      targetMethod: plan.targetMethod,
      targetPresentValue: plan.targetPresentValue,
      futureValueRequired: plan.futureValueRequired,
      monthlyExpenses: plan.monthlyExpenses,
      withdrawalRate: plan.withdrawalRate,
      initialInvestment: plan.initialInvestment,
      periodicPayment: plan.periodicPayment,
      paymentFrequency: plan.paymentFrequency,
      paymentType: plan.paymentType,
      investmentYears: plan.investmentYears,
      requiredReturnRate: plan.requiredReturnRate,
      inflationRate: plan.inflationRate,
      riskTolerance: plan.riskTolerance,
      suggestedAllocation: plan.suggestedAllocation,
      yearlyProjections: plan.yearlyProjections,
      scenarios: plan.scenarios,
      linkedPortfolioIds: plan.linkedPortfolioIds,
      linkedGoalIds: plan.linkedGoalIds,
      currentPortfolioValue: plan.currentPortfolioValue,
      currentProgressPercentage: plan.currentProgressPercentage,
      milestones: plan.milestones,
      status: plan.status,
      baseCurrency: plan.baseCurrency,
      templateId: plan.templateId,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}

