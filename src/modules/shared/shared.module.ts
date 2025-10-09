import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Account } from './entities/account.entity';
import { User } from './entities/user.entity';
import { AccountService } from './services/account.service';
import { AuthService } from './services/auth.service';
import { AccountController } from './controllers/account.controller';
import { AuthController } from './controllers/auth.controller';
import { DepositCalculationService } from './services/deposit-calculation.service';
import { AccountValidationService } from './services/account-validation.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Deposit } from '../portfolio/entities/deposit.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';

/**
 * Shared module for common entities and services.
 * Contains Account management functionality.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Account, User, Deposit, Portfolio]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AccountController, AuthController],
  providers: [AccountService, AuthService, DepositCalculationService, AccountValidationService, JwtStrategy],
  exports: [AccountService, AuthService, DepositCalculationService, AccountValidationService],
})
export class SharedModule {}