import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PortfolioPermissionService, CreatePortfolioPermissionDto } from '../services/portfolio-permission.service';
import { PortfolioPermissionType } from '../entities/portfolio-permission.entity';

@Controller('api/v1/portfolio-permissions')
@UseGuards(JwtAuthGuard)
export class PortfolioPermissionController {
  constructor(
    private readonly portfolioPermissionService: PortfolioPermissionService,
  ) {}

  /**
   * Create a new portfolio permission
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPermission(
    @Body() createDto: CreatePortfolioPermissionDto,
    @Request() req: any,
  ) {
    // Set grantedBy to current user's account ID
    createDto.grantedBy = req.user.accountId;
    
    return await this.portfolioPermissionService.createPermission(createDto);
  }

  /**
   * Get all permissions for a portfolio
   */
  @Get('portfolio/:portfolioId')
  async getPortfolioPermissions(@Param('portfolioId') portfolioId: string) {
    return await this.portfolioPermissionService.getPortfolioPermissions(portfolioId);
  }

  /**
   * Get all portfolios accessible by current account
   */
  @Get('my-portfolios')
  async getMyAccessiblePortfolios(@Request() req: any) {
    return await this.portfolioPermissionService.getAccountAccessiblePortfolios(req.user.accountId);
  }


  /**
   * Delete a portfolio permission
   */
  @Delete(':permissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePermission(
    @Param('permissionId') permissionId: string,
    @Request() req: any,
  ) {
    await this.portfolioPermissionService.deletePermission(permissionId, req.user.accountId);
  }

  /**
   * Check if current account has permission for a portfolio
   */
  @Get('check/:portfolioId')
  async checkPermission(
    @Param('portfolioId') portfolioId: string,
    @Query('action') action: 'view' | 'update' | 'delete' | 'manage_permissions',
    @Request() req: any,
  ) {
    const hasPermission = await this.portfolioPermissionService.checkPortfolioPermission(
      portfolioId,
      req.user.accountId,
      action,
    );

    return { hasPermission };
  }

  /**
   * Get permission statistics for a portfolio
   */
  @Get('stats/:portfolioId')
  async getPortfolioPermissionStats(@Param('portfolioId') portfolioId: string) {
    return await this.portfolioPermissionService.getPortfolioPermissionStats(portfolioId);
  }

  /**
   * Transfer portfolio ownership
   */
  @Post('transfer-ownership/:portfolioId')
  async transferOwnership(
    @Param('portfolioId') portfolioId: string,
    @Body() body: { newOwnerAccountId: string },
    @Request() req: any,
  ) {
    await this.portfolioPermissionService.transferOwnership(
      portfolioId,
      body.newOwnerAccountId,
      req.user.accountId,
    );
  }

  /**
   * Get available accounts for permission assignment
   */
  @Get('available-accounts')
  async getAvailableAccounts(@Query('search') search?: string) {
    // This would typically query accounts that are not already assigned to the portfolio
    // For now, return a placeholder - this should be implemented based on your account management system
    return {
      message: 'Available accounts endpoint - to be implemented based on account management system',
      search,
    };
  }
}

// DTOs for request/response validation
export class CreatePortfolioPermissionRequestDto {
  portfolioId: string;
  accountId: string;
  permissionType: PortfolioPermissionType;
}


export class TransferOwnershipRequestDto {
  newOwnerAccountId: string;
}

export class PermissionCheckResponseDto {
  hasPermission: boolean;
}

export class PortfolioPermissionStatsResponseDto {
  totalAccounts: number;
  ownerCount: number;
  updateCount: number;
  viewCount: number;
}
