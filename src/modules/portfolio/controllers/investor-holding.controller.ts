import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { InvestorHoldingService, SubscribeToFundDto, RedeemFromFundDto } from '../services/investor-holding.service';
import { InvestorHolding } from '../entities/investor-holding.entity';
import { HoldingDetailDto } from '../dto/holding-detail.dto';

@ApiTags('Investor Holdings')
@Controller('api/v1/investor-holdings')
export class InvestorHoldingController {
  constructor(
    private readonly investorHoldingService: InvestorHoldingService,
  ) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Subscribe to a fund (buy fund units)' })
  @ApiBody({
    description: 'Fund subscription details',
    schema: {
      type: 'object',
      required: ['accountId', 'portfolioId', 'amount'],
      properties: {
        accountId: { type: 'string', format: 'uuid', description: 'Investor account ID' },
        portfolioId: { type: 'string', format: 'uuid', description: 'Fund portfolio ID' },
        amount: { type: 'number', description: 'Amount to invest' },
        description: { type: 'string', description: 'Optional description' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Fund subscription successful' })
  @ApiResponse({ status: 400, description: 'Invalid subscription request' })
  @ApiResponse({ status: 404, description: 'Portfolio or account not found' })
  async subscribeToFund(@Body() dto: SubscribeToFundDto) {
    return this.investorHoldingService.subscribeToFund(dto);
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem from a fund (sell fund units)' })
  @ApiBody({
    description: 'Fund redemption details',
    schema: {
      type: 'object',
      required: ['accountId', 'portfolioId', 'units'],
      properties: {
        accountId: { type: 'string', format: 'uuid', description: 'Investor account ID' },
        portfolioId: { type: 'string', format: 'uuid', description: 'Fund portfolio ID' },
        units: { type: 'number', description: 'Number of units to redeem' },
        description: { type: 'string', description: 'Optional description' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Fund redemption successful' })
  @ApiResponse({ status: 400, description: 'Invalid redemption request' })
  @ApiResponse({ status: 404, description: 'Portfolio, account, or holding not found' })
  async redeemFromFund(@Body() dto: RedeemFromFundDto) {
    return this.investorHoldingService.redeemFromFund(dto);
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Get all holdings for an investor' })
  @ApiParam({ name: 'accountId', description: 'Investor account ID' })
  @ApiResponse({ status: 200, description: 'Investor holdings retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getInvestorHoldings(@Param('accountId', ParseUUIDPipe) accountId: string): Promise<InvestorHolding[]> {
    return this.investorHoldingService.getInvestorHoldings(accountId);
  }

  @Get('fund/:portfolioId')
  @ApiOperation({ summary: 'Get all investors in a fund' })
  @ApiParam({ name: 'portfolioId', description: 'Fund portfolio ID' })
  @ApiResponse({ status: 200, description: 'Fund investors retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getFundInvestors(@Param('portfolioId', ParseUUIDPipe) portfolioId: string): Promise<InvestorHolding[]> {
    return this.investorHoldingService.getFundInvestors(portfolioId);
  }

  @Get('holding/:accountId/:portfolioId')
  @ApiOperation({ summary: 'Get specific holding' })
  @ApiParam({ name: 'accountId', description: 'Investor account ID' })
  @ApiParam({ name: 'portfolioId', description: 'Fund portfolio ID' })
  @ApiResponse({ status: 200, description: 'Holding retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Holding not found' })
  async getHolding(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
  ): Promise<InvestorHolding | null> {
    return this.investorHoldingService.getHolding(accountId, portfolioId);
  }

  @Get('nav-per-unit/:portfolioId')
  @ApiOperation({ summary: 'Get current NAV per unit for a fund' })
  @ApiParam({ name: 'portfolioId', description: 'Fund portfolio ID' })
  @ApiResponse({ status: 200, description: 'NAV per unit retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getNavPerUnit(@Param('portfolioId', ParseUUIDPipe) portfolioId: string): Promise<{ navPerUnit: number }> {
    const navPerUnit = await this.investorHoldingService.calculateNavPerUnit(portfolioId);
    return { navPerUnit };
  }

  @Post('convert-to-fund/:portfolioId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert portfolio to fund' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID to convert' })
  @ApiResponse({ status: 200, description: 'Portfolio converted to fund successfully' })
  @ApiResponse({ status: 400, description: 'Portfolio is already a fund' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async convertPortfolioToFund(@Param('portfolioId', ParseUUIDPipe) portfolioId: string) {
    return this.investorHoldingService.convertPortfolioToFund(portfolioId);
  }

  @Get(':holdingId/detail')
  @ApiOperation({ summary: 'Get detailed holding information with transactions' })
  @ApiParam({ name: 'holdingId', description: 'Holding ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Holding detail retrieved successfully',
    type: HoldingDetailDto
  })
  @ApiResponse({ status: 404, description: 'Holding not found' })
  async getHoldingDetail(@Param('holdingId', ParseUUIDPipe) holdingId: string): Promise<HoldingDetailDto> {
    return this.investorHoldingService.getHoldingDetail(holdingId);
  }
}
