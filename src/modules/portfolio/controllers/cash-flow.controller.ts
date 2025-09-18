import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
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
  @ApiResponse({ status: 200, description: 'Cash flow history retrieved successfully', type: [CashFlowResponseDto] })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getCashFlowHistory(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<CashFlowResponseDto[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const cashFlows = await this.cashFlowService.getCashFlowHistory(portfolioId, start, end);
    
    return cashFlows.map((cashFlow) => ({
      cashflowId: cashFlow.cashFlowId,
      portfolioId: cashFlow.portfolioId,
      flowDate: cashFlow.flowDate,
      amount: cashFlow.amount,
      currency: cashFlow.currency,
      type: cashFlow.type,
      description: cashFlow.description,
      createdAt: cashFlow.createdAt,
      updatedAt: cashFlow.updatedAt,
    }));
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
