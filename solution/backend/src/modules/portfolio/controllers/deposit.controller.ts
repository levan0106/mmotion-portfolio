import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DepositService } from '../services/deposit.service';
import {
  CreateDepositDto,
  UpdateDepositDto,
  SettleDepositDto,
  DepositResponseDto,
  DepositAnalyticsDto,
  DepositStatisticsDto,
  PaginatedDepositResponseDto,
  DepositFiltersDto,
} from '../dto/deposit.dto';
import { DepositFilters } from '../repositories/deposit.repository';

@ApiTags('Deposits')
@Controller('api/v1/deposits')
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new deposit',
    description: 'Create a new bank deposit for a portfolio'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Deposit created successfully',
    type: DepositResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid input data'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Portfolio not found'
  })
  async createDeposit(@Body() createDepositDto: CreateDepositDto): Promise<DepositResponseDto> {
    return this.depositService.createDeposit(createDepositDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all deposits',
    description: 'Get paginated list of deposits with optional filters'
  })
  @ApiQuery({ name: 'accountId', required: true, description: 'Filter by account ID' })
  @ApiQuery({ name: 'portfolioId', required: false, description: 'Filter by portfolio ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'SETTLED'], description: 'Filter by status' })
  @ApiQuery({ name: 'bankName', required: false, description: 'Filter by bank name (partial match)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field', example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiResponse({ 
    status: 200, 
    description: 'Deposits retrieved successfully',
    type: PaginatedDepositResponseDto
  })
  async getDeposits(@Query() filters: DepositFiltersDto): Promise<PaginatedDepositResponseDto> {
    const depositFilters: DepositFilters = {
      accountId: filters.accountId,
      portfolioId: filters.portfolioId,
      status: filters.status,
      bankName: filters.bankName,
      page: filters.page || 1,
      limit: filters.limit || 100,
      sortBy: filters.sortBy || 'createdAt',
      sortOrder: filters.sortOrder || 'DESC',
    };

    return this.depositService.getDeposits(depositFilters);
  }

  @Get('analytics')
  @ApiOperation({ 
    summary: 'Get deposit analytics',
    description: 'Get comprehensive analytics and statistics for deposits filtered by account'
  })
  @ApiQuery({ name: 'accountId', required: true, description: 'Filter by account ID' })
  @ApiQuery({ name: 'portfolioId', required: false, description: 'Filter by portfolio ID. If not provided, returns analytics for all deposits in the account' })
  @ApiResponse({ 
    status: 200, 
    description: 'Deposit analytics retrieved successfully',
    type: DepositAnalyticsDto
  })
  async getDepositAnalytics(
    @Query('accountId') accountId: string,
    @Query('portfolioId') portfolioId?: string
  ): Promise<DepositAnalyticsDto> {
    if (portfolioId) {
      return this.depositService.getDepositAnalytics(accountId, portfolioId);
    }
    return this.depositService.getAccountDepositAnalytics(accountId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get deposit by ID',
    description: 'Get a specific deposit by its ID'
  })
  @ApiParam({ name: 'id', description: 'Deposit ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Deposit retrieved successfully',
    type: DepositResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Deposit not found'
  })
  async getDeposit(@Param('id') id: string): Promise<DepositResponseDto> {
    return this.depositService.getDepositById(id);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update deposit',
    description: 'Update an existing deposit (only active deposits can be updated)'
  })
  @ApiParam({ name: 'id', description: 'Deposit ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Deposit updated successfully',
    type: DepositResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Cannot update settled deposit'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Deposit not found'
  })
  async updateDeposit(
    @Param('id') id: string,
    @Body() updateDepositDto: UpdateDepositDto,
  ): Promise<DepositResponseDto> {
    return this.depositService.updateDeposit(id, updateDepositDto);
  }

  @Post(':id/settle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Settle deposit',
    description: 'Settle a deposit (mark as completed and receive principal + interest)'
  })
  @ApiParam({ name: 'id', description: 'Deposit ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Deposit settled successfully',
    type: DepositResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Deposit cannot be settled'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Deposit not found'
  })
  async settleDeposit(
    @Param('id') id: string,
    @Body() settleDepositDto: SettleDepositDto,
  ): Promise<DepositResponseDto> {
    return this.depositService.settleDeposit(id, settleDepositDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete deposit',
    description: 'Delete a deposit (only active deposits can be deleted)'
  })
  @ApiParam({ name: 'id', description: 'Deposit ID' })
  @ApiResponse({ 
    status: 204, 
    description: 'Deposit deleted successfully'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Cannot delete settled deposit'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Deposit not found'
  })
  async deleteDeposit(@Param('id') id: string): Promise<void> {
    return this.depositService.deleteDeposit(id);
  }

  @Get('portfolio/:portfolioId')
  @ApiOperation({ 
    summary: 'Get deposits by portfolio',
    description: 'Get all deposits for a specific portfolio'
  })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Deposits retrieved successfully',
    type: [DepositResponseDto]
  })
  async getDepositsByPortfolio(@Param('portfolioId') portfolioId: string): Promise<DepositResponseDto[]> {
    return this.depositService.getDepositsByPortfolioId(portfolioId);
  }

  @Get('portfolio/:portfolioId/active')
  @ApiOperation({ 
    summary: 'Get active deposits by portfolio',
    description: 'Get all active deposits for a specific portfolio'
  })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Active deposits retrieved successfully',
    type: [DepositResponseDto]
  })
  async getActiveDepositsByPortfolio(@Param('portfolioId') portfolioId: string): Promise<DepositResponseDto[]> {
    return this.depositService.getActiveDepositsByPortfolioId(portfolioId);
  }

  @Get('portfolio/:portfolioId/settled')
  @ApiOperation({ 
    summary: 'Get settled deposits by portfolio',
    description: 'Get all settled deposits for a specific portfolio'
  })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Settled deposits retrieved successfully',
    type: [DepositResponseDto]
  })
  async getSettledDepositsByPortfolio(@Param('portfolioId') portfolioId: string): Promise<DepositResponseDto[]> {
    return this.depositService.getSettledDepositsByPortfolioId(portfolioId);
  }


  @Get('portfolio/:portfolioId/statistics')
  @ApiOperation({ 
    summary: 'Get deposit statistics for portfolio',
    description: 'Get basic statistics for deposits in a portfolio'
  })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Deposit statistics retrieved successfully',
    type: DepositStatisticsDto
  })
  async getDepositStatistics(@Param('portfolioId') portfolioId: string, @Query('accountId') accountId: string): Promise<DepositStatisticsDto> {
    return this.depositService.getDepositStatistics(accountId, portfolioId);
  }

  @Get('portfolio/:portfolioId/analytics')
  @ApiOperation({ 
    summary: 'Get deposit analytics for portfolio',
    description: 'Get comprehensive analytics and statistics for deposits in a portfolio'
  })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Deposit analytics retrieved successfully',
    type: DepositAnalyticsDto
  })
  async getDepositAnalyticsByPortfolio(@Param('portfolioId') portfolioId: string, @Query('accountId') accountId: string): Promise<DepositAnalyticsDto> {
    return this.depositService.getDepositAnalytics(accountId, portfolioId);
  }

  @Get('matured')
  @ApiOperation({ 
    summary: 'Get matured deposits',
    description: 'Get all deposits that have reached maturity (ready for settlement)'
  })
  @ApiQuery({ name: 'portfolioId', required: false, description: 'Filter by portfolio ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Matured deposits retrieved successfully',
    type: [DepositResponseDto]
  })
  async getMaturedDeposits(@Query('portfolioId') portfolioId?: string): Promise<DepositResponseDto[]> {
    return this.depositService.getMaturedDeposits(portfolioId);
  }

  @Get('expiring')
  @ApiOperation({ 
    summary: 'Get deposits expiring soon',
    description: 'Get deposits that will expire within the specified number of days'
  })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days ahead to check', example: 30 })
  @ApiQuery({ name: 'portfolioId', required: false, description: 'Filter by portfolio ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Expiring deposits retrieved successfully',
    type: [DepositResponseDto]
  })
  async getExpiringDeposits(
    @Query('days') days: number = 30,
    @Query('portfolioId') portfolioId?: string,
  ): Promise<DepositResponseDto[]> {
    return this.depositService.getExpiringDeposits(days, portfolioId);
  }
}
