import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deposit } from './entities/deposit.entity';
import { DepositController } from './controllers/deposit.controller';
import { DepositService } from './services/deposit.service';
import { DepositRepository } from './repositories/deposit.repository';
import { PortfolioModule } from './portfolio.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deposit]),
    forwardRef(() => PortfolioModule),
    SharedModule,
  ],
  controllers: [DepositController],
  providers: [DepositService, DepositRepository],
  exports: [DepositService, DepositRepository],
})
export class DepositModule {}
