import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioGoal, GoalStatus } from '../entities';
import { CreateGoalDto, UpdateGoalDto, GoalResponseDto, GoalWithAllocationDto } from '../dto';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { PortfolioCalculationService } from '../../portfolio/services/portfolio-calculation.service';
import { PortfolioService } from '../../portfolio/services/portfolio.service';

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(PortfolioGoal)
    private goalRepository: Repository<PortfolioGoal>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    private portfolioCalculationService: PortfolioCalculationService,
    private portfolioService: PortfolioService,
  ) {}

  async createGoal(createGoalDto: CreateGoalDto, accountId: string): Promise<GoalResponseDto> {
    const { portfolioIds, ...goalData } = createGoalDto;
    
    // Allow portfolios to be linked to multiple goals - removed validation restriction
    
    const goal = this.goalRepository.create({
      ...goalData,
      accountId,
      createdBy: accountId,
    });

    const savedGoal = await this.goalRepository.save(goal);

    // Create GoalPortfolio relationships
    if (portfolioIds && portfolioIds.length > 0) {
      const goalPortfolios = portfolioIds.map(portfolioId => ({
        goalId: savedGoal.id,
        portfolioId: portfolioId,
        weight: 1.0 / portfolioIds.length, // Equal weight distribution
        isPrimary: false,
      }));

      await this.goalRepository.manager
        .createQueryBuilder()
        .insert()
        .into('goal_portfolios')
        .values(goalPortfolios)
        .execute();
    }

    return await this.getGoalProgressReport(savedGoal.id, accountId);
  }

  async findAllGoals(accountId: string, portfolioId?: string): Promise<GoalResponseDto[]> {
    const query = this.goalRepository
      .createQueryBuilder('goal')
      .where('goal.accountId = :accountId', { accountId });

    if (portfolioId) {
      query.leftJoin('goal.goalPortfolios', 'goalPortfolios')
        .andWhere('goalPortfolios.portfolioId = :portfolioId', { portfolioId });
    }

    const goals = await query
      .leftJoinAndSelect('goal.goalPortfolios', 'goalPortfolios')
      .orderBy('goal.priority', 'ASC')
      .addOrderBy('goal.createdAt', 'DESC')
      .getMany();

    // Real-time calculation using getGoalProgressReport

    const responseDtos = [];
    for (const goal of goals) {
      const progressReport = await this.getGoalProgressReport(goal.id, accountId);
      responseDtos.push(progressReport);
    }
    return responseDtos;
  }

  async findGoalById(id: string, accountId: string): Promise<GoalWithAllocationDto> {
    const goal = await this.goalRepository.findOne({
      where: { id, accountId },
      relations: ['assetAllocations', 'metrics', 'alerts'],
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    // Real-time calculation is done in mapToAllocationDto

    return await this.mapToAllocationDto(goal, accountId);
  }

  async updateGoal(id: string, updateGoalDto: UpdateGoalDto, accountId: string): Promise<GoalResponseDto> {
    const goal = await this.goalRepository.findOne({
      where: { id, accountId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    const { portfolioIds, ...goalData } = updateGoalDto;

    // Allow portfolios to be linked to multiple goals - removed validation restriction

    // Update goal data
    Object.assign(goal, goalData);
    const updatedGoal = await this.goalRepository.save(goal);

    // Update portfolio relationships if portfolioIds is provided
    if (portfolioIds !== undefined) {
      // Remove existing portfolio relationships
      await this.goalRepository.manager
        .createQueryBuilder()
        .delete()
        .from('goal_portfolios')
        .where('goalId = :goalId', { goalId: id })
        .execute();

      // Create new portfolio relationships
      if (portfolioIds && portfolioIds.length > 0) {
        const goalPortfolios = portfolioIds.map(portfolioId => ({
          goalId: id,
          portfolioId: portfolioId,
          weight: 1.0 / portfolioIds.length, // Equal weight distribution
          isPrimary: false,
        }));

        await this.goalRepository.manager
          .createQueryBuilder()
          .insert()
          .into('goal_portfolios')
          .values(goalPortfolios)
          .execute();
      }
    }

    return await this.getGoalProgressReport(updatedGoal.id, accountId);
  }

  async deleteGoal(id: string, accountId: string): Promise<void> {
    const result = await this.goalRepository.delete({ id, accountId });
    if (result.affected === 0) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }
  }

  // Method removed - will calculate real-time values instead of storing in database

  async getGoalProgress(goalId: string, accountId: string): Promise<{
    currentValue: number;
    achievementPercentage: number;
    daysRemaining: number;
    progressStatus: string;
    isAchieved: boolean;
    isOverdue: boolean;
  }> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, accountId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }

    return {
      currentValue: goal.currentValue,
      achievementPercentage: goal.achievementPercentage,
      daysRemaining: goal.daysRemaining,
      progressStatus: goal.getProgressStatus(),
      isAchieved: goal.isAchieved(),
      isOverdue: goal.isOverdue(),
    };
  }

  async getGoalProgressReport(goalId: string, accountId: string): Promise<GoalResponseDto> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, accountId },
      relations: ['goalPortfolios'],
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }

    // Calculate portfolio contributions
    const portfolioContributions = [];
    if (goal.goalPortfolios && goal.goalPortfolios.length > 0) {
      // First, calculate total value of all portfolios in this goal
      let totalGoalValue = 0;
      const portfolioData = [];
      
      for (const goalPortfolio of goal.goalPortfolios) {
        const portfolio = await this.portfolioRepository.findOne({
          where: { portfolioId: goalPortfolio.portfolioId }
        });
        
        if (portfolio) {
          const portfolioFields = await this.portfolioService.calculateNewPortfolioFields(goalPortfolio.portfolioId);
          const contribution = portfolioFields.totalAllValue;
          totalGoalValue += contribution;
          
          portfolioData.push({
            portfolioId: goalPortfolio.portfolioId,
            portfolioName: portfolio.name,
            contribution: contribution,
            rawWeight: goalPortfolio.weight,
          });
        }
      }
      
      // Calculate actual weight percentage for each portfolio
      for (const data of portfolioData) {
        const actualWeight = totalGoalValue > 0 ? (data.contribution / totalGoalValue) * 100 : 0;
        
        portfolioContributions.push({
          portfolioId: data.portfolioId,
          portfolioName: data.portfolioName,
          contribution: data.contribution,
          weight: actualWeight, // Tỷ trọng thực tế (%)
        });
      }
    }

    // Calculate real-time current value and achievement percentage
    let realTimeCurrentValue = 0;
    if (goal.goalPortfolios && goal.goalPortfolios.length > 0) {
      for (const goalPortfolio of goal.goalPortfolios) {
        const portfolioFields = await this.portfolioService.calculateNewPortfolioFields(goalPortfolio.portfolioId);
        realTimeCurrentValue += portfolioFields.totalAllValue;
      }
    }

    const realTimeAchievementPercentage = goal.targetValue && goal.targetValue > 0 
      ? (realTimeCurrentValue / goal.targetValue) * 100 
      : 0;

    const realTimeDaysRemaining = goal.targetDate 
      ? Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: goal.id,
      portfolioId: goal.goalPortfolios?.map(gp => gp.portfolioId) || [],
      accountId: goal.accountId,
      name: goal.name,
      description: goal.description,
      targetValue: goal.targetValue,
      targetDate: goal.targetDate,
      priority: goal.priority,
      status: goal.status,
      isPrimary: goal.isPrimary,
      autoTrack: goal.autoTrack,
      currentValue: realTimeCurrentValue,
      achievementPercentage: realTimeAchievementPercentage,
      daysRemaining: realTimeDaysRemaining,
      lastUpdated: new Date(),
      createdBy: goal.createdBy,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      progressStatus: realTimeAchievementPercentage >= 100 ? 'ACHIEVED' : 
                     realTimeAchievementPercentage >= 80 ? 'ON_TRACK' : 
                     realTimeAchievementPercentage >= 50 ? 'NEEDS_ATTENTION' : 'AT_RISK',
      isAchieved: realTimeAchievementPercentage >= 100,
      isOverdue: realTimeDaysRemaining !== null && realTimeDaysRemaining < 0,
      portfolioContributions,
    };
  }

  async getGoalsByStatus(accountId: string, status: GoalStatus): Promise<GoalResponseDto[]> {
    const goals = await this.goalRepository.find({
      where: { accountId, status },
      order: { priority: 'ASC', createdAt: 'DESC' },
    });

    const responseDtos = [];
    for (const goal of goals) {
      const progressReport = await this.getGoalProgressReport(goal.id, accountId);
      responseDtos.push(progressReport);
    }
    return responseDtos;
  }

  async getPrimaryGoals(accountId: string): Promise<GoalResponseDto[]> {
    const goals = await this.goalRepository.find({
      where: { accountId, isPrimary: true, status: GoalStatus.ACTIVE },
      order: { priority: 'ASC' },
    });

    const responseDtos = [];
    for (const goal of goals) {
      const progressReport = await this.getGoalProgressReport(goal.id, accountId);
      responseDtos.push(progressReport);
    }
    return responseDtos;
  }

  async setPrimaryGoal(goalId: string, accountId: string): Promise<GoalResponseDto> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, accountId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }

    // Remove primary status from other goals for the same account
    await this.goalRepository.update(
      { accountId: goal.accountId, isPrimary: true },
      { isPrimary: false }
    );

    // Set this goal as primary
    goal.isPrimary = true;
    const updatedGoal = await this.goalRepository.save(goal);
    return await this.getGoalProgressReport(updatedGoal.id, accountId);
  }

  // Method removed - using getGoalProgressReport for real-time calculation

  private async mapToAllocationDto(goal: PortfolioGoal, accountId: string): Promise<GoalWithAllocationDto> {
    const progressReport = await this.getGoalProgressReport(goal.id, accountId);
    
    return {
      // Map from progressReport to GoalResponseDto structure
      id: goal.id,
      portfolioId: goal.goalPortfolios?.map(gp => gp.portfolioId) || [],
      accountId: goal.accountId,
      name: goal.name,
      description: goal.description,
      targetValue: goal.targetValue,
      targetDate: goal.targetDate,
      priority: goal.priority,
      status: goal.status,
      isPrimary: goal.isPrimary,
      autoTrack: goal.autoTrack,
      currentValue: progressReport.currentValue,
      achievementPercentage: progressReport.achievementPercentage,
      daysRemaining: progressReport.daysRemaining,
      lastUpdated: new Date(),
      createdBy: goal.createdBy,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      progressStatus: progressReport.progressStatus,
      isAchieved: progressReport.isAchieved,
      isOverdue: progressReport.isOverdue,
      portfolioContributions: progressReport.portfolioContributions,
    };
  }

  async getUsedPortfolios(accountId: string): Promise<{ portfolioIds: string[] }> {
    const usedPortfolios = await this.goalRepository.manager
      .createQueryBuilder()
      .select('gp.portfolioId')
      .from('goal_portfolios', 'gp')
      .leftJoin('portfolio_goals', 'pg', 'pg.id = gp.goalId')
      .where('pg.accountId = :accountId', { accountId })
      .getRawMany();

    return {
      portfolioIds: usedPortfolios.map(p => p.portfolioId)
    };
  }

  async getAvailablePortfolios(accountId: string): Promise<{ portfolios: Array<{ portfolioId: string; accountId: string; name: string }> }> {
    // Get all portfolios that the account owns OR has UPDATE/VIEW permissions for
    const portfoliosWithPermissions = await this.portfolioRepository
      .createQueryBuilder('portfolio')
      .leftJoin('portfolio.permissions', 'permission', 'permission.accountId = :accountId', { accountId })
      .where('portfolio.accountId = :accountId', { accountId })
      .orWhere('permission.permissionType IN (:...permissionTypes)', { 
        permissionTypes: ['UPDATE', 'VIEW'] 
      })
      .select(['portfolio.portfolioId', 'portfolio.accountId', 'portfolio.name'])
      .distinct(true)
      .getMany();

    // Return all portfolios that the account can access
    const availablePortfolios = portfoliosWithPermissions.map(portfolio => ({
      portfolioId: portfolio.portfolioId,
      accountId: portfolio.accountId,
      name: portfolio.name
    }));

    return {
      portfolios: availablePortfolios
    };
  }
}
