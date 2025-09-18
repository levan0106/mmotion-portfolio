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

    return await this.cashFlowService.getCashFlowHistory(portfolioId, start, end);
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
    const recalculatedBalance = await this.cashFlowService.recalculateCashBalance(portfolioId);
    return { portfolioId, recalculatedBalance };
  }
}
