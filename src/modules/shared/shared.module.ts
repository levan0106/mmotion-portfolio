import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Account } from './entities/account.entity';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { AccountService } from './services/account.service';
import { AuthService } from './services/auth.service';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { UserRoleService } from './services/user-role.service';
import { UserService } from './services/user.service';
import { SettingsService } from './services/settings.service';
import { AutoRoleAssignmentService } from './services/auto-role-assignment.service';
import { AccountController } from './controllers/account.controller';
import { AuthController } from './controllers/auth.controller';
import { RoleController } from './controllers/role.controller';
import { PermissionController } from './controllers/permission.controller';
import { UserRoleController } from './controllers/user-role.controller';
import { UserController } from './controllers/user.controller';
import { SettingsController } from './controllers/settings.controller';
import { CurrentUserController } from './controllers/current-user.controller';
import { DepositCalculationService } from './services/deposit-calculation.service';
import { AccountValidationService } from './services/account-validation.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PermissionGuard } from './guards/permission.guard';
import { RoleGuard } from './guards/role.guard';
import { Deposit } from '../portfolio/entities/deposit.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';

/**
 * Shared module for common entities and services.
 * Contains Account management functionality.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Account, User, Role, Permission, UserRole, Deposit, Portfolio]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [
    AccountController, 
    AuthController, 
    RoleController, 
    PermissionController, 
    UserRoleController,
    UserController,
    SettingsController,
    CurrentUserController
  ],
  providers: [
    AccountService, 
    AuthService, 
    RoleService, 
    PermissionService, 
    UserRoleService,
    UserService,
    SettingsService,
    AutoRoleAssignmentService,
    DepositCalculationService, 
    AccountValidationService, 
    JwtStrategy,
    PermissionGuard,
    RoleGuard
  ],
  exports: [
    AccountService, 
    AuthService, 
    RoleService, 
    PermissionService, 
    UserRoleService,
    UserService,
    SettingsService,
    AutoRoleAssignmentService,
    DepositCalculationService, 
    AccountValidationService,
    PermissionGuard,
    RoleGuard
  ],
})
export class SharedModule {}