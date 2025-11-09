import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoalRebalancingHistory, RebalanceType } from '../entities';
import { GoalAssetAllocationService } from './goal-asset-allocation.service';
import { GoalService } from './goal.service';

@Injectable()
export class GoalRebalancingService {
  constructor(
    @InjectRepository(GoalRebalancingHistory)
    private rebalancingRepository: Repository<GoalRebalancingHistory>,
    private allocationService: GoalAssetAllocationService,
    private goalService: GoalService,
  ) {}

  async createRebalancingHistory(
    goalId: string,
    rebalanceType: RebalanceType,
    triggerReason: string,
    oldAllocation: Record<string, any>,
    newAllocation: Record<string, any>,
    changesMade: Record<string, any>,
    expectedImprovement?: number,
    costOfRebalancing: number = 0,
    accountId?: string,
  ): Promise<GoalRebalancingHistory> {
    // Verify goal exists and user has access
    if (accountId) {
      await this.goalService.findGoalById(goalId, accountId);
    }

    const history = this.rebalancingRepository.create({
      goalId,
      rebalanceDate: new Date(),
      rebalanceType,
      triggerReason,
      oldAllocation,
      newAllocation,
      changesMade,
      expectedImprovement,
      costOfRebalancing,
      createdBy: accountId,
    });

    return this.rebalancingRepository.save(history);
  }

  async getRebalancingHistory(goalId: string, accountId: string): Promise<GoalRebalancingHistory[]> {
    // Verify goal exists and user has access
    await this.goalService.findGoalById(goalId, accountId);

    return this.rebalancingRepository.find({
      where: { goalId },
      order: { rebalanceDate: 'DESC' },
    });
  }

  async getRebalancingStats(goalId: string, accountId: string): Promise<{
    totalRebalancings: number;
    averageImprovement: number;
    totalCost: number;
    netImprovement: number;
    efficiencyRatio: number;
    qualityDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
  }> {
    const history = await this.getRebalancingHistory(goalId, accountId);

    const stats = {
      totalRebalancings: history.length,
      averageImprovement: 0,
      totalCost: 0,
      netImprovement: 0,
      efficiencyRatio: 0,
      qualityDistribution: {} as Record<string, number>,
      typeDistribution: {} as Record<string, number>,
    };

    if (history.length === 0) {
      return stats;
    }

    let totalImprovement = 0;
    let totalExpectedImprovement = 0;

    history.forEach(record => {
      // Calculate improvements
      const actualImprovement = record.actualImprovement || 0;
      const expectedImprovement = record.expectedImprovement || 0;
      
      totalImprovement += actualImprovement;
      totalExpectedImprovement += expectedImprovement;
      stats.totalCost += record.costOfRebalancing || 0;

      // Count by quality
      const quality = record.getRebalancingQuality();
      stats.qualityDistribution[quality] = (stats.qualityDistribution[quality] || 0) + 1;

      // Count by type
      stats.typeDistribution[record.rebalanceType] = (stats.typeDistribution[record.rebalanceType] || 0) + 1;
    });

    stats.averageImprovement = totalImprovement / history.length;
    stats.netImprovement = totalImprovement - stats.totalCost;
    stats.efficiencyRatio = totalExpectedImprovement > 0 ? totalImprovement / totalExpectedImprovement : 0;

    return stats;
  }

  async getRebalancingCandidates(accountId: string): Promise<Array<{
    goalId: string;
    goalName: string;
    allocations: Array<{
      assetType: string;
      targetPercentage: number;
      currentPercentage: number;
      deviation: number;
      needsRebalancing: boolean;
    }>;
    summary: {
      totalAllocated: number;
      totalCurrent: number;
      deviation: number;
      needsRebalancing: boolean;
    };
  }>> {
    const candidates = await this.allocationService.getRebalancingCandidates(accountId);
    const goalGroups = new Map<string, any[]>();

    // Group allocations by goal
    candidates.forEach(allocation => {
      if (!goalGroups.has(allocation.goalId)) {
        goalGroups.set(allocation.goalId, []);
      }
      goalGroups.get(allocation.goalId)!.push(allocation);
    });

    const result = [];

    for (const [goalId, allocations] of goalGroups) {
      const goal = await this.goalService.findGoalById(goalId, accountId);
      const summary = await this.allocationService.getAssetAllocationSummary(goalId, accountId);

      result.push({
        goalId,
        goalName: goal.name,
        allocations: allocations.map(allocation => ({
          assetType: allocation.assetType,
          targetPercentage: allocation.targetPercentage,
          currentPercentage: allocation.currentPercentage,
          deviation: allocation.calculateDeviation(),
          needsRebalancing: allocation.needsRebalancing(),
        })),
        summary,
      });
    }

    return result;
  }

  async executeRebalancing(
    goalId: string,
    newAllocations: Record<string, number>,
    rebalanceType: RebalanceType = RebalanceType.MANUAL,
    triggerReason: string = 'Manual rebalancing',
    accountId: string,
  ): Promise<{
    success: boolean;
    message: string;
    rebalancingHistory: GoalRebalancingHistory;
  }> {
    try {
      // Get current allocations
      const currentAllocations = await this.allocationService.getAllocationsByGoal(goalId, accountId);
      const oldAllocation = {};
      const changesMade = {};

      // Prepare old allocation data
      currentAllocations.forEach(allocation => {
        oldAllocation[allocation.assetType] = allocation.currentPercentage;
      });

      // Execute rebalancing for each allocation
      for (const [assetType, newPercentage] of Object.entries(newAllocations)) {
        const allocation = currentAllocations.find(a => a.assetType === assetType);
        if (allocation) {
          const oldPercentage = allocation.currentPercentage;
          changesMade[assetType] = {
            old: oldPercentage,
            new: newPercentage,
            change: newPercentage - oldPercentage,
          };

          await this.allocationService.rebalanceAllocation(
            allocation.id,
            { [assetType]: newPercentage },
            accountId,
          );
        }
      }

      // Create rebalancing history
      const rebalancingHistory = await this.createRebalancingHistory(
        goalId,
        rebalanceType,
        triggerReason,
        oldAllocation,
        newAllocations,
        changesMade,
        undefined, // expectedImprovement - would be calculated based on strategy
        0, // costOfRebalancing - would be calculated based on trades
        accountId,
      );

      return {
        success: true,
        message: 'Rebalancing executed successfully',
        rebalancingHistory,
      };
    } catch (error) {
      return {
        success: false,
        message: `Rebalancing failed: ${error.message}`,
        rebalancingHistory: null,
      };
    }
  }

  async getRebalancingPerformance(goalId: string, accountId: string, days: number = 30): Promise<{
    period: string;
    totalRebalancings: number;
    averageImprovement: number;
    bestImprovement: number;
    worstImprovement: number;
    totalCost: number;
    netImprovement: number;
    efficiencyRatio: number;
    recommendations: string[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = await this.rebalancingRepository
      .createQueryBuilder('history')
      .where('history.goalId = :goalId', { goalId })
      .andWhere('history.rebalanceDate >= :cutoffDate', { cutoffDate })
      .orderBy('history.rebalanceDate', 'DESC')
      .getMany();

    const stats = {
      period: `${days} days`,
      totalRebalancings: history.length,
      averageImprovement: 0,
      bestImprovement: 0,
      worstImprovement: 0,
      totalCost: 0,
      netImprovement: 0,
      efficiencyRatio: 0,
      recommendations: [] as string[],
    };

    if (history.length === 0) {
      stats.recommendations.push('No rebalancing activity in the selected period');
      return stats;
    }

    const improvements = history.map(h => h.actualImprovement || 0);
    const costs = history.map(h => h.costOfRebalancing || 0);
    const expectedImprovements = history.map(h => h.expectedImprovement || 0);

    stats.averageImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / history.length;
    stats.bestImprovement = Math.max(...improvements);
    stats.worstImprovement = Math.min(...improvements);
    stats.totalCost = costs.reduce((sum, cost) => sum + cost, 0);
    stats.netImprovement = improvements.reduce((sum, imp) => sum + imp, 0) - stats.totalCost;

    const totalExpected = expectedImprovements.reduce((sum, exp) => sum + exp, 0);
    stats.efficiencyRatio = totalExpected > 0 ? stats.averageImprovement / (totalExpected / history.length) : 0;

    // Generate recommendations
    if (stats.efficiencyRatio < 0.8) {
      stats.recommendations.push('Consider improving rebalancing strategy - efficiency is below 80%');
    }
    if (stats.totalCost > stats.netImprovement) {
      stats.recommendations.push('Rebalancing costs exceed benefits - consider reducing frequency');
    }
    if (stats.averageImprovement < 0) {
      stats.recommendations.push('Recent rebalancings have been negative - review strategy');
    }
    if (history.length > 10) {
      stats.recommendations.push('High rebalancing frequency - consider reducing to minimize costs');
    }

    return stats;
  }
}
