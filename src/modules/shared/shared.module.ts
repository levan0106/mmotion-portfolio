import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deposit } from '../portfolio/entities/deposit.entity';
import { DepositCalculationService } from './services/deposit-calculation.service';

/**
 * Shared module for services that need to be used across multiple modules
 * This helps break circular dependencies
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Deposit]),
  ],
  providers: [DepositCalculationService],
  exports: [DepositCalculationService],
})
export class SharedModule {}