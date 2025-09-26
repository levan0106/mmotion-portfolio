import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ExternalMarketDataService } from '../services/external-market-data.service';

@ApiTags('External Market Data')
@Controller('api/v1/external-market-data')
export class ExternalMarketDataController {
  private readonly logger = new Logger(ExternalMarketDataController.name);

  constructor(
    private readonly externalMarketDataService: ExternalMarketDataService
  ) {}

  @Get('all')
  @ApiOperation({ summary: 'Fetch all market data from external APIs' })
  @ApiResponse({ status: 200, description: 'Market data fetched successfully' })
  @ApiResponse({ status: 500, description: 'Failed to fetch market data' })
  async fetchAllMarketData() {
    try {
      this.logger.log('Fetching all market data from external APIs...');
      const result = await this.externalMarketDataService.fetchAllMarketData();
      
      return {
        success: true,
        data: result,
        message: 'Market data fetched successfully'
      };
    } catch (error) {
      this.logger.error('Failed to fetch all market data:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch market data'
      };
    }
  }

  @Get('price')
  @ApiOperation({ summary: 'Get price for a specific symbol' })
  @ApiQuery({ name: 'symbol', description: 'Symbol to get price for', required: true })
  @ApiResponse({ status: 200, description: 'Price fetched successfully' })
  @ApiResponse({ status: 404, description: 'Symbol not found' })
  async getPriceBySymbol(@Query('symbol') symbol: string) {
    try {
      this.logger.log(`Getting price for symbol: ${symbol}`);
      const result = await this.externalMarketDataService.getPriceBySymbol(symbol);
      
      if (!result) {
        return {
          success: false,
          message: `Symbol ${symbol} not found`
        };
      }

      return {
        success: true,
        data: result,
        message: 'Price fetched successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to get price for symbol ${symbol}:`, error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get price'
      };
    }
  }

  @Get('test-connections')
  @ApiOperation({ summary: 'Test connectivity to all external APIs' })
  @ApiResponse({ status: 200, description: 'Connection test completed' })
  async testConnections() {
    try {
      this.logger.log('Testing connections to all external APIs...');
      const results = await this.externalMarketDataService.testAllConnections();
      
      return {
        success: true,
        data: results,
        message: 'Connection test completed'
      };
    } catch (error) {
      this.logger.error('Failed to test connections:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to test connections'
      };
    }
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get market data summary' })
  @ApiResponse({ status: 200, description: 'Summary fetched successfully' })
  async getMarketDataSummary() {
    try {
      this.logger.log('Getting market data summary...');
      const summary = await this.externalMarketDataService.getMarketDataSummary();
      
      return {
        success: true,
        data: summary,
        message: 'Market data summary fetched successfully'
      };
    } catch (error) {
      this.logger.error('Failed to get market data summary:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get market data summary'
      };
    }
  }

  @Get('funds')
  @ApiOperation({ summary: 'Get fund prices' })
  @ApiResponse({ status: 200, description: 'Fund prices fetched successfully' })
  async getFundPrices() {
    try {
      this.logger.log('Getting fund prices...');
      const funds = await this.externalMarketDataService.getMarketDataByType('funds');
      
      return {
        success: true,
        data: funds,
        message: 'Fund prices fetched successfully'
      };
    } catch (error) {
      this.logger.error('Failed to get fund prices:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get fund prices'
      };
    }
  }

  @Get('gold')
  @ApiOperation({ summary: 'Get gold prices' })
  @ApiResponse({ status: 200, description: 'Gold prices fetched successfully' })
  async getGoldPrices() {
    try {
      this.logger.log('Getting gold prices...');
      const gold = await this.externalMarketDataService.getMarketDataByType('gold');
      
      return {
        success: true,
        data: gold,
        message: 'Gold prices fetched successfully'
      };
    } catch (error) {
      this.logger.error('Failed to get gold prices:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get gold prices'
      };
    }
  }

  @Get('exchange-rates')
  @ApiOperation({ summary: 'Get exchange rates' })
  @ApiResponse({ status: 200, description: 'Exchange rates fetched successfully' })
  async getExchangeRates() {
    try {
      this.logger.log('Getting exchange rates...');
      const rates = await this.externalMarketDataService.getMarketDataByType('exchangeRates');
      
      return {
        success: true,
        data: rates,
        message: 'Exchange rates fetched successfully'
      };
    } catch (error) {
      this.logger.error('Failed to get exchange rates:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get exchange rates'
      };
    }
  }

  @Get('stocks')
  @ApiOperation({ summary: 'Get stock prices' })
  @ApiResponse({ status: 200, description: 'Stock prices fetched successfully' })
  async getStockPrices() {
    try {
      this.logger.log('Getting stock prices...');
      const stocks = await this.externalMarketDataService.getMarketDataByType('stocks');
      
      return {
        success: true,
        data: stocks,
        message: 'Stock prices fetched successfully'
      };
    } catch (error) {
      this.logger.error('Failed to get stock prices:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get stock prices'
      };
    }
  }

  @Get('crypto')
  @ApiOperation({ summary: 'Get crypto prices' })
  @ApiResponse({ status: 200, description: 'Crypto prices fetched successfully' })
  async getCryptoPrices() {
    try {
      this.logger.log('Getting crypto prices...');
      const crypto = await this.externalMarketDataService.getMarketDataByType('crypto');
      
      return {
        success: true,
        data: crypto,
        message: 'Crypto prices fetched successfully'
      };
    } catch (error) {
      this.logger.error('Failed to get crypto prices:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get crypto prices'
      };
    }
  }
}
