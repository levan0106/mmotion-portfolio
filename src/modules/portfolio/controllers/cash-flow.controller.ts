import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CashFlowService } from '../services/cash-flow.service';
import { 
  CreateCashFlowDto, 
  UpdateCashBalanceDto, 
  CashFlowResponseDto, 
  CashBalanceUpdateResultDto,
  CashFlowType 
} from '../dto/cash-flow.dto';

/**
 * Controller for managing cash flows and portfolio cash balance.
 */
@ApiTags('Cash Flow Management')
@Controller('api/v1/portfolios/:id/cash-flow')
export class CashFlowController {
  constructor(
    private readonly cashFlowService: CashFlowService,
  ) {}

  /**
   * Add manual cash flow to portfolio.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add manual cash flow to portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 201, description: 'Cash flow added successfully', type: CashBalanceUpdateResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async addCashFlow(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Body() createCashFlowDto: CreateCashFlowDto,
  ): Promise<CashBalanceUpdateResultDto> {
    // Override portfolioId from URL parameter
    createCashFlowDto.portfolioId = portfolioId;

    const flowDate = createCashFlowDto.flowDate ? new Date(createCashFlowDto.flowDate) : new Date();
    const currency = createCashFlowDto.currency || 'VND';

    return await this.cashFlowService.addManualCashFlow(
      portfolioId,
      createCashFlowDto.amount,
      createCashFlowDto.type,
      createCashFlowDto.description,
      flowDate,
    );
  }

  /**
   * Get cash flow history for portfolio.
   */
  @Get('history')
  @ApiOperation({ summary: 'Get cash flow history for portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)', example: 10 })
  @ApiResponse({ status: 200, description: 'Cash flow history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getCashFlowHistory(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    data: CashFlowResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const pageNum = page || 1;
    const limitNum = limit || 10;

    const result = await this.cashFlowService.getCashFlowHistory(portfolioId, start, end, pageNum, limitNum);
    
    return {
      data: result.data.map((cashFlow) => ({
        cashflowId: cashFlow.cashFlowId,
        portfolioId: cashFlow.portfolioId,
        flowDate: cashFlow.flowDate,
        amount: cashFlow.amount,
        currency: cashFlow.currency,
        type: cashFlow.type,
        description: cashFlow.description,
        status: cashFlow.status,
        reference: cashFlow.reference,
        effectiveDate: cashFlow.effectiveDate,
        createdAt: cashFlow.createdAt,
        updatedAt: cashFlow.updatedAt,
      })),
      pagination: result.pagination,
    };
  }

  /**
   * Get current cash balance for portfolio.
   */
  @Get('balance')
  @ApiOperation({ summary: 'Get current cash balance for portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Cash balance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getCurrentCashBalance(
    @Param('id', ParseUUIDPipe) portfolioId: string,
  ): Promise<{ portfolioId: string; cashBalance: number }> {
    const cashBalance = await this.cashFlowService.getCurrentCashBalance(portfolioId);
    return { portfolioId, cashBalance };
  }

  /**
   * Update cash balance directly.
   */
  @Put('balance')
  @ApiOperation({ summary: 'Update cash balance directly' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Cash balance updated successfully', type: CashBalanceUpdateResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async updateCashBalance(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Body() updateCashBalanceDto: UpdateCashBalanceDto,
  ): Promise<CashBalanceUpdateResultDto> {
    // Calculate the difference to create a cash flow record
    const currentBalance = await this.cashFlowService.getCurrentCashBalance(portfolioId);
    const difference = updateCashBalanceDto.cashBalance - currentBalance;

    if (difference === 0) {
      return {
        portfolioId,
        oldCashBalance: currentBalance,
        newCashBalance: currentBalance,
        cashFlowAmount: 0,
        cashFlowType: 'BALANCE_ADJUSTMENT',
      };
    }

    const type = difference > 0 ? CashFlowType.DEPOSIT : CashFlowType.WITHDRAWAL;
    const description = `Manual balance adjustment: ${updateCashBalanceDto.reason}`;

    return await this.cashFlowService.addManualCashFlow(
      portfolioId,
      difference,
      type,
      description,
    );
  }

  /**
   * Create a deposit
   */
  @Post('deposit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a deposit and update portfolio balance' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 201, description: 'Deposit created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async createDeposit(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Body() createDepositDto: { amount: number; description: string; reference?: string; effectiveDate?: Date },
  ) {
    return await this.cashFlowService.createCashFlow(
      portfolioId,
      'DEPOSIT' as any,
      createDepositDto.amount,
      createDepositDto.description,
      createDepositDto.reference,
      createDepositDto.effectiveDate,
    );
  }

  /**
   * Create a withdrawal
   */
  @Post('withdrawal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a withdrawal and update portfolio balance' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 201, description: 'Withdrawal created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async createWithdrawal(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Body() createWithdrawalDto: { amount: number; description: string; reference?: string; effectiveDate?: Date },
  ) {
    return await this.cashFlowService.createCashFlow(
      portfolioId,
      'WITHDRAWAL' as any,
      createWithdrawalDto.amount,
      createWithdrawalDto.description,
      createWithdrawalDto.reference,
      createWithdrawalDto.effectiveDate,
    );
  }

  /**
   * Create a dividend
   */
  @Post('dividend')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a dividend and update portfolio balance' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 201, description: 'Dividend created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async createDividend(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Body() createDividendDto: { amount: number; description: string; reference?: string; effectiveDate?: Date },
  ) {
    return await this.cashFlowService.createCashFlow(
      portfolioId,
      'DIVIDEND' as any,
      createDividendDto.amount,
      createDividendDto.description,
      createDividendDto.reference,
      createDividendDto.effectiveDate,
    );
  }

  /**
   * Update an existing cash flow.
   */
  @Put(':cashFlowId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing cash flow' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiParam({ name: 'cashFlowId', description: 'Cash Flow ID' })
  @ApiResponse({ status: 200, description: 'Cash flow updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Portfolio or cash flow not found' })
  async updateCashFlow(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Param('cashFlowId', ParseUUIDPipe) cashFlowId: string,
    @Body() updateCashFlowDto: CreateCashFlowDto,
  ) {
    return await this.cashFlowService.updateCashFlow(
      portfolioId,
      cashFlowId,
      updateCashFlowDto,
    );
  }

  /**
   * Delete an existing cash flow.
   */
  @Delete(':cashFlowId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an existing cash flow' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiParam({ name: 'cashFlowId', description: 'Cash Flow ID' })
  @ApiResponse({ status: 204, description: 'Cash flow deleted successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio or cash flow not found' })
  async deleteCashFlow(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Param('cashFlowId', ParseUUIDPipe) cashFlowId: string,
  ) {
    await this.cashFlowService.deleteCashFlow(portfolioId, cashFlowId);
  }

  /**
   * Recalculate cash balance from all cash flows.
   */
  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recalculate cash balance from all cash flows' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Cash balance recalculated successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async recalculateCashBalance(
    @Param('id', ParseUUIDPipe) portfolioId: string,
  ): Promise<{ portfolioId: string; recalculatedBalance: number }> {
    const result = await this.cashFlowService.recalculateCashBalanceFromTrades(portfolioId);
    return { portfolioId, recalculatedBalance: result.newCashBalance };
  }
}
