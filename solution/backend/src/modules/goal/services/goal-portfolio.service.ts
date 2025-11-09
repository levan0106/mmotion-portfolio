import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoalPortfolio } from '../entities/goal-portfolio.entity';
import { PortfolioGoal } from '../entities/portfolio-goal.entity';
import { CreateGoalPortfolioDto, UpdateGoalPortfolioDto, GoalPortfolioResponseDto } from '../dto';

@Injectable()
export class GoalPortfolioService {
  constructor(
    @InjectRepository(GoalPortfolio)
    private readonly goalPortfolioRepository: Repository<GoalPortfolio>,
    @InjectRepository(PortfolioGoal)
    private readonly goalRepository: Repository<PortfolioGoal>,
  ) {}

  async addPortfolioToGoal(
    goalId: string,
    createDto: CreateGoalPortfolioDto,
    accountId: string,
  ): Promise<GoalPortfolioResponseDto> {
    // Verify goal exists and belongs to account
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, accountId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }

    // Check if portfolio is already associated with this goal
    const existingGoalPortfolio = await this.goalPortfolioRepository.findOne({
      where: { goalId, portfolioId: createDto.portfolioId },
    });

    if (existingGoalPortfolio) {
      throw new BadRequestException('Portfolio is already associated with this goal');
    }

    // If this is set as primary, unset other primary portfolios for this goal
    if (createDto.isPrimary) {
      await this.goalPortfolioRepository.update(
        { goalId },
        { isPrimary: false }
      );
    }

    const goalPortfolio = this.goalPortfolioRepository.create({
      goalId,
      portfolioId: createDto.portfolioId,
      weight: createDto.weight,
      isPrimary: createDto.isPrimary,
    });

    const savedGoalPortfolio = await this.goalPortfolioRepository.save(goalPortfolio);
    return this.mapToResponseDto(savedGoalPortfolio);
  }

  async updateGoalPortfolio(
    goalId: string,
    portfolioId: string,
    updateDto: UpdateGoalPortfolioDto,
    accountId: string,
  ): Promise<GoalPortfolioResponseDto> {
    // Verify goal exists and belongs to account
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, accountId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }

    const goalPortfolio = await this.goalPortfolioRepository.findOne({
      where: { goalId, portfolioId },
    });

    if (!goalPortfolio) {
      throw new NotFoundException(`Portfolio ${portfolioId} is not associated with goal ${goalId}`);
    }

    // If setting as primary, unset other primary portfolios
    if (updateDto.isPrimary) {
      await this.goalPortfolioRepository.update(
        { goalId },
        { isPrimary: false }
      );
    }

    Object.assign(goalPortfolio, updateDto);
    const updatedGoalPortfolio = await this.goalPortfolioRepository.save(goalPortfolio);
    return this.mapToResponseDto(updatedGoalPortfolio);
  }

  async removePortfolioFromGoal(
    goalId: string,
    portfolioId: string,
    accountId: string,
  ): Promise<void> {
    // Verify goal exists and belongs to account
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, accountId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }

    const result = await this.goalPortfolioRepository.delete({
      goalId,
      portfolioId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Portfolio ${portfolioId} is not associated with goal ${goalId}`);
    }
  }

  async getGoalPortfolios(goalId: string, accountId: string): Promise<GoalPortfolioResponseDto[]> {
    // Verify goal exists and belongs to account
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, accountId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }

    const goalPortfolios = await this.goalPortfolioRepository.find({
      where: { goalId },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });

    return goalPortfolios.map(goalPortfolio => this.mapToResponseDto(goalPortfolio));
  }

  private mapToResponseDto(goalPortfolio: GoalPortfolio): GoalPortfolioResponseDto {
    return {
      id: goalPortfolio.id,
      goalId: goalPortfolio.goalId,
      portfolioId: goalPortfolio.portfolioId,
      weight: goalPortfolio.weight,
      isPrimary: goalPortfolio.isPrimary,
      createdAt: goalPortfolio.createdAt,
      updatedAt: goalPortfolio.updatedAt,
    };
  }
}
