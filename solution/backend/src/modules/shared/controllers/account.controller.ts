import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AccountService } from '../services/account.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { Account } from '../entities/account.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import { User } from '../entities/user.entity';

/**
 * Controller for Account CRUD operations.
 */
@ApiTags('Accounts')
@Controller('api/v1/accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
  ) {}

  /**
   * Create a new account.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new account',
    description: 'Creates a new user account with the provided information'
  })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Account created successfully',
    type: Account
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid data or email already exists'
  })
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
    @CurrentUser() user: User
  ): Promise<Account> {
    return await this.accountService.createAccount(createAccountDto, user.userId);
  }

  /**
   * Get all accounts for the current user.
   */
  @Get()
  @ApiOperation({ 
    summary: 'Get user accounts',
    description: 'Retrieves all accounts belonging to the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user accounts retrieved successfully',
    type: [Account]
  })
  async getAllAccounts(@CurrentUser() user: User): Promise<Account[]> {
    return await this.accountService.getAccountsByUserId(user.userId);
  }

  /**
   * Get account by ID.
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Get account by ID',
    description: 'Retrieves a specific account by its ID'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Account ID (UUID format)', 
    example: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Account retrieved successfully',
    type: Account
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Account not found'
  })
  async getAccountById(
    @Param('id', ParseUUIDPipe) accountId: string,
    @CurrentUser() user: User
  ): Promise<Account> {
    return await this.accountService.getAccountByIdForUser(accountId, user.userId);
  }

  /**
   * Update account.
   */
  @Put(':id')
  @ApiOperation({ 
    summary: 'Update account',
    description: 'Updates an existing account with new information'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Account ID (UUID format)', 
    example: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5'
  })
  @ApiBody({ type: UpdateAccountDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Account updated successfully',
    type: Account
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid data or email already exists'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Account not found'
  })
  async updateAccount(
    @Param('id', ParseUUIDPipe) accountId: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @CurrentUser() user: User
  ): Promise<Account> {
    return await this.accountService.updateAccountForUser(accountId, updateAccountDto, user.userId);
  }

  /**
   * Delete account.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete account',
    description: 'Deletes an account. Account must not have any portfolios.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Account ID (UUID format)', 
    example: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Account deleted successfully'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - account has existing portfolios'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Account not found'
  })
  async deleteAccount(
    @Param('id', ParseUUIDPipe) accountId: string,
    @CurrentUser() user: User
  ): Promise<void> {
    await this.accountService.deleteAccountForUser(accountId, user.userId);
  }

  /**
   * Get account statistics.
   */
  @Get(':id/stats')
  @ApiOperation({ 
    summary: 'Get account statistics',
    description: 'Retrieves statistics for a specific account including portfolio count, total value, etc.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Account ID (UUID format)', 
    example: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Account statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalPortfolios: { type: 'number', example: 3 },
        totalValue: { type: 'number', example: 1500000000 },
        totalInvestors: { type: 'number', example: 5 },
        isInvestor: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Account not found'
  })
  async getAccountStats(
    @Param('id', ParseUUIDPipe) accountId: string,
    @CurrentUser() user: User
  ): Promise<{
    totalPortfolios: number;
    totalValue: number;
    totalInvestors: number;
    isInvestor: boolean;
  }> {
    return await this.accountService.getAccountStatsForUser(accountId, user.userId);
  }
}

