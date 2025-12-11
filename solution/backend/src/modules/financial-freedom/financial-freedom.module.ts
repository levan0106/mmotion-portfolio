import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialFreedomPlan } from './entities';
import { FinancialFreedomPlanService } from './services';
import { FinancialFreedomController } from './controllers';
import { GoalModule } from '../goal/goal.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { AssetModule } from '../asset/asset.module';
import { PortfolioGoal, GoalPortfolio } from '../goal/entities';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialFreedomPlan, PortfolioGoal, GoalPortfolio]),
    forwardRef(() => GoalModule),
    forwardRef(() => PortfolioModule),
    forwardRef(() => AssetModule),
    forwardRef(() => SharedModule),
  ],
  controllers: [FinancialFreedomController],
  providers: [FinancialFreedomPlanService],
  exports: [FinancialFreedomPlanService],
})
export class FinancialFreedomModule {}

