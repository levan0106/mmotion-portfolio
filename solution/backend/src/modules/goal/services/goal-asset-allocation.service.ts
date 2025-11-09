import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoalAssetAllocation, AssetType, RebalanceFrequency } from '../entities';
import { CreateGoalAssetAllocationDto, UpdateGoalAssetAllocationDto } from '../dto';
import { GoalService } from './goal.service';

@Injectable()
export class GoalAssetAllocationService {
  constructor(
    @InjectRepository(GoalAssetAllocation)
    private allocationRepository: Repository<GoalAssetAllocation>,
    private goalService: GoalService,
  ) {}

  async createAllocation(
    goalId: string,
    createAllocationDto: CreateGoalAssetAllocationDto,
    accountId: string,
  ): Promise<GoalAssetAllocation> {
    // Verify goal exists and user has access
    await this.goalService.findGoalById(goalId, accountId);

    // Check if allocation already exists for this asset type
    const existingAllocation = await this.allocationRepository.findOne({
      where: { goalId, assetType: createAllocationDto.assetType },
    });

    if (existingAllocation) {
      throw new BadRequestException(`Allocation for asset type ${createAllocationDto.assetType} already exists`);
    }

    // Validate total percentage doesn't exceed 100%
    await this.validateTotalPercentage(goalId, createAllocationDto.targetPercentage);

    const allocation = this.allocationRepository.create({
      ...createAllocationDto,
      goalId,
      nextRebalance: this.calculateNextRebalanceDate(createAllocationDto.rebalanceFrequency),
    });

    return this.allocationRepository.save(allocation);
  }

  async updateAllocation(
    allocationId: string,
    updateAllocationDto: UpdateGoalAssetAllocationDto,
    accountId: string,
  ): Promise<GoalAssetAllocation> {
    const allocation = await this.allocationRepository.findOne({
      where: { id: allocationId },
      relations: ['goal'],
    });

    if (!allocation) {
      throw new NotFoundException(`Allocation with ID ${allocationId} not found`);
    }

    // Verify user has access to the goal
    await this.goalService.findGoalById(allocation.goalId, accountId);

    // Validate total percentage if target percentage is being updated
    if (updateAllocationDto.targetPercentage !== undefined) {
      await this.validateTotalPercentage(allocation.goalId, updateAllocationDto.targetPercentage, allocationId);
    }

    Object.assign(allocation, updateAllocationDto);
    
    // Update next rebalance date if frequency changed
    if (updateAllocationDto.rebalanceFrequency) {
      allocation.nextRebalance = this.calculateNextRebalanceDate(updateAllocationDto.rebalanceFrequency);
    }

    return this.allocationRepository.save(allocation);
  }

  async deleteAllocation(allocationId: string, accountId: string): Promise<void> {
    const allocation = await this.allocationRepository.findOne({
      where: { id: allocationId },
      relations: ['goal'],
    });

    if (!allocation) {
      throw new NotFoundException(`Allocation with ID ${allocationId} not found`);
    }

    // Verify user has access to the goal
    await this.goalService.findGoalById(allocation.goalId, accountId);

    await this.allocationRepository.delete(allocationId);
  }

  async getAllocationsByGoal(goalId: string, accountId: string): Promise<GoalAssetAllocation[]> {
    // Verify goal exists and user has access
    await this.goalService.findGoalById(goalId, accountId);

    return this.allocationRepository.find({
      where: { goalId, isActive: true },
      order: { targetPercentage: 'DESC' },
    });
  }

  async getRebalancingCandidates(accountId: string): Promise<GoalAssetAllocation[]> {
    const allocations = await this.allocationRepository
      .createQueryBuilder('allocation')
      .leftJoinAndSelect('allocation.goal', 'goal')
      .where('allocation.isActive = :isActive', { isActive: true })
      .andWhere('allocation.autoRebalance = :autoRebalance', { autoRebalance: true })
      .andWhere('goal.accountId = :accountId', { accountId })
      .andWhere('goal.status = :status', { status: 'ACTIVE' })
      .getMany();

    return allocations.filter(allocation => allocation.needsRebalancing());
  }

  async rebalanceAllocation(
    allocationId: string,
    newAllocation: Record<string, number>,
    accountId: string,
  ): Promise<GoalAssetAllocation> {
    const allocation = await this.allocationRepository.findOne({
      where: { id: allocationId },
      relations: ['goal'],
    });

    if (!allocation) {
      throw new NotFoundException(`Allocation with ID ${allocationId} not found`);
    }

    // Verify user has access to the goal
    await this.goalService.findGoalById(allocation.goalId, accountId);

    // Update allocation percentages
    const oldAllocation = {
      [allocation.assetType]: allocation.currentPercentage,
    };

    allocation.currentPercentage = newAllocation[allocation.assetType] || allocation.currentPercentage;
    allocation.lastRebalanced = new Date();
    allocation.nextRebalance = allocation.calculateNextRebalanceDate();

    const updatedAllocation = await this.allocationRepository.save(allocation);

    // Log rebalancing history
    await this.logRebalancingHistory(
      allocation.goalId,
      'THRESHOLD',
      'Asset allocation rebalanced due to threshold breach',
      oldAllocation,
      newAllocation,
      accountId,
    );

    return updatedAllocation;
  }

  async getAssetAllocationSummary(goalId: string, accountId: string): Promise<{
    totalAllocated: number;
    totalCurrent: number;
    deviation: number;
    needsRebalancing: boolean;
    allocations: Array<{
      assetType: string;
      targetPercentage: number;
      currentPercentage: number;
      deviation: number;
      needsRebalancing: boolean;
    }>;
  }> {
    const allocations = await this.getAllocationsByGoal(goalId, accountId);
    
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.targetPercentage, 0);
    const totalCurrent = allocations.reduce((sum, alloc) => sum + alloc.currentPercentage, 0);
    const deviation = totalCurrent - totalAllocated;
    const needsRebalancing = allocations.some(alloc => alloc.needsRebalancing());

    return {
      totalAllocated,
      totalCurrent,
      deviation,
      needsRebalancing,
      allocations: allocations.map(allocation => ({
        assetType: allocation.assetType,
        targetPercentage: allocation.targetPercentage,
        currentPercentage: allocation.currentPercentage,
        deviation: allocation.calculateDeviation(),
        needsRebalancing: allocation.needsRebalancing(),
      })),
    };
  }

  private async validateTotalPercentage(goalId: string, newPercentage: number, excludeId?: string): Promise<void> {
    const query = this.allocationRepository
      .createQueryBuilder('allocation')
      .where('allocation.goalId = :goalId', { goalId })
      .andWhere('allocation.isActive = :isActive', { isActive: true });

    if (excludeId) {
      query.andWhere('allocation.id != :excludeId', { excludeId });
    }

    const allocations = await query.getMany();
    const currentTotal = allocations.reduce((sum, alloc) => sum + alloc.targetPercentage, 0);
    const newTotal = currentTotal + newPercentage;

    if (newTotal > 100) {
      throw new BadRequestException(`Total allocation percentage cannot exceed 100%. Current total: ${currentTotal}%, adding: ${newPercentage}%`);
    }
  }

  private calculateNextRebalanceDate(frequency: RebalanceFrequency = RebalanceFrequency.MONTHLY): Date {
    const now = new Date();
    const nextDate = new Date(now);

    switch (frequency) {
      case RebalanceFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case RebalanceFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RebalanceFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case RebalanceFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case RebalanceFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }

  private async logRebalancingHistory(
    goalId: string,
    type: string,
    reason: string,
    oldAllocation: Record<string, any>,
    newAllocation: Record<string, any>,
    accountId: string,
  ): Promise<void> {
    // This would be implemented with the rebalancing history service
    // For now, we'll just log the rebalancing event
    console.log(`Rebalancing logged for goal ${goalId}: ${reason}`);
  }
}
