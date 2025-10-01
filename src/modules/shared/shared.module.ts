import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { AccountService } from './services/account.service';
import { AccountController } from './controllers/account.controller';
import { DepositCalculationService } from './services/deposit-calculation.service';
import { AccountValidationService } from './services/account-validation.service';
import { Deposit } from '../portfolio/entities/deposit.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';

/**
 * Shared module for common entities and services.
 * Contains Account management functionality.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Deposit, Portfolio]),
  ],
  controllers: [AccountController],
  providers: [AccountService, DepositCalculationService, AccountValidationService],
  exports: [AccountService, DepositCalculationService, AccountValidationService],
})
export class SharedModule {}