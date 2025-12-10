import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialFreedomPlan } from '../entities/financial-freedom-plan.entity';
import { CreatePlanDto, UpdatePlanDto, PlanResponseDto } from '../dto';

@Injectable()
export class FinancialFreedomPlanService {
  constructor(
    @InjectRepository(FinancialFreedomPlan)
    private planRepository: Repository<FinancialFreedomPlan>,
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
        account_id, name, target_method, target_present_value, future_value_required,
        monthly_expenses, withdrawal_rate, initial_investment, periodic_payment, payment_frequency, payment_type,
        investment_years, required_return_rate, inflation_rate, risk_tolerance,
        suggested_allocation, yearly_projections, scenarios,
        linked_portfolio_ids, linked_goal_ids, milestones, template_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        accountId,
        createPlanDto.name,
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

  private mapToResponseDto(plan: FinancialFreedomPlan): PlanResponseDto {
    return {
      id: plan.id,
      accountId: plan.accountId,
      name: plan.name,
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

