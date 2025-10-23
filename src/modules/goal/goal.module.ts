import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef } from '@nestjs/common';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { SharedModule } from '../shared/shared.module';
import { 
  PortfolioGoal, 
  GoalMetric, 
  GoalAssetAllocation, 
  GoalAchievement, 
  GoalAlert, 
  GoalAllocationStrategy, 
  GoalRebalancingHistory,
  GoalPortfolio
} from './entities';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { GoalService, GoalAssetAllocationService, GoalAlertService, GoalRebalancingService, GoalPortfolioService } from './services';
import { 
  GoalController, 
  GoalAssetAllocationController, 
  GoalAlertController, 
  GoalRebalancingController,
  GoalPortfolioController
} from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PortfolioGoal,
      GoalMetric,
      GoalAssetAllocation,
      GoalAchievement,
      GoalAlert,
      GoalAllocationStrategy,
      GoalRebalancingHistory,
      GoalPortfolio,
      Portfolio,
    ]),
    forwardRef(() => PortfolioModule),
    forwardRef(() => SharedModule),
  ],
  controllers: [
    GoalController,
    GoalAssetAllocationController,
    GoalAlertController,
    GoalRebalancingController,
    GoalPortfolioController,
  ],
  providers: [
    GoalService,
    GoalAssetAllocationService,
    GoalAlertService,
    GoalRebalancingService,
    GoalPortfolioService,
  ],
  exports: [
    GoalService,
    GoalAssetAllocationService,
    GoalAlertService,
    GoalRebalancingService,
    GoalPortfolioService,
  ],
})
export class GoalModule {}
