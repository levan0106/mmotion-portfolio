import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalFinancialAnalysis } from './entities/personal-financial-analysis.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { SharedModule } from '../shared/shared.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { FinancialFreedomModule } from '../financial-freedom/financial-freedom.module';
import { PersonalFinancialAnalysisService } from './services/personal-financial-analysis.service';
import { AnalysisCalculationService } from './services/analysis-calculation.service';
import { PortfolioAssetLoadingService } from './services/portfolio-asset-loading.service';
import { ScenarioManagementService } from './services/scenario-management.service';
import { PersonalFinancialAnalysisController } from './controllers/personal-financial-analysis.controller';

/**
 * Personal Financial Analysis Module
 * Provides comprehensive financial analysis functionality including:
 * - Cash flow survey
 * - Financial analysis with metrics
 * - Asset restructuring with scenarios
 * - Financial planning integration
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PersonalFinancialAnalysis, Portfolio]),
    SharedModule,
    forwardRef(() => PortfolioModule),
    forwardRef(() => FinancialFreedomModule),
  ],
  controllers: [
    PersonalFinancialAnalysisController,
  ],
  providers: [
    PersonalFinancialAnalysisService,
    AnalysisCalculationService,
    PortfolioAssetLoadingService,
    ScenarioManagementService,
  ],
  exports: [
    PersonalFinancialAnalysisService,
    AnalysisCalculationService,
  ],
})
export class PersonalFinancialAnalysisModule {}

