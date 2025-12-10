import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialFreedomPlan } from './entities';
import { FinancialFreedomPlanService } from './services';
import { FinancialFreedomController } from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialFreedomPlan]),
  ],
  controllers: [FinancialFreedomController],
  providers: [FinancialFreedomPlanService],
  exports: [FinancialFreedomPlanService],
})
export class FinancialFreedomModule {}

