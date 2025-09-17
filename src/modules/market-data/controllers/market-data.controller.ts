import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MarketDataService, MarketPrice } from '../services/market-data.service';

@ApiTags('Market Data')
@Controller('api/v1/market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  /**
   * Get current price for a specific symbol
   */
  @Get('price/:symbol')
  @ApiOperation({ summary: 'Get current price for a symbol' })
  @ApiParam({ name: 'symbol', description: 'Asset symbol', example: 'VFF' })
  @ApiResponse({ 
    status: 200, 
    description: 'Current price retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', example: 'VFF' },
        price: { type: 'number', example: 34000 },
        lastUpdated: { type: 'string', example: '2024-12-19T10:30:00.000Z' }
      }
    }
  })
  async getCurrentPrice(@Param('symbol') symbol: string): Promise<{ symbol: string; price: number; lastUpdated: Date }> {
    const price = await this.marketDataService.getCurrentPrice(symbol);
    const marketData = await this.marketDataService.getMarketData(symbol);
    
    return {
      symbol,
      price,
      lastUpdated: marketData?.lastUpdated || new Date(),
    };
  }

  /**
   * Get market data for a specific symbol
   */
  @Get('data/:symbol')
  @ApiOperation({ summary: 'Get market data for a symbol' })
  @ApiParam({ name: 'symbol', description: 'Asset symbol', example: 'VFF' })
  @ApiResponse({ 
    status: 200, 
    description: 'Market data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', example: 'VFF' },
        price: { type: 'number', example: 34000 },
        change: { type: 'number', example: 1000 },
        changePercent: { type: 'number', example: 1.56 },
        lastUpdated: { type: 'string', example: '2024-12-19T10:30:00.000Z' }
      }
    }
  })
  async getMarketData(@Param('symbol') symbol: string): Promise<MarketPrice | null> {
    return this.marketDataService.getMarketData(symbol);
  }

  /**
   * Get market data for multiple symbols
   */
  @Get('data')
  @ApiOperation({ summary: 'Get market data for multiple symbols' })
  @ApiQuery({ name: 'symbols', description: 'Comma-separated list of symbols', example: 'VFF,VESAF,GOLD' })
  @ApiResponse({ 
    status: 200, 
    description: 'Market data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          symbol: { type: 'string', example: 'VFF' },
          price: { type: 'number', example: 34000 },
          change: { type: 'number', example: 1000 },
          changePercent: { type: 'number', example: 1.56 },
          lastUpdated: { type: 'string', example: '2024-12-19T10:30:00.000Z' }
        }
      }
    }
  })
  async getMarketDataBatch(@Query('symbols') symbols: string): Promise<MarketPrice[]> {
    const symbolList = symbols.split(',').map(s => s.trim());
    const marketDataMap = await this.marketDataService.getMarketDataBatch(symbolList);
    return Array.from(marketDataMap.values());
  }

  /**
   * Get all market data
   */
  @Get('all')
  @ApiOperation({ summary: 'Get all market data' })
  @ApiResponse({ 
    status: 200, 
    description: 'All market data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          symbol: { type: 'string', example: 'VFF' },
          price: { type: 'number', example: 34000 },
          change: { type: 'number', example: 1000 },
          changePercent: { type: 'number', example: 1.56 },
          lastUpdated: { type: 'string', example: '2024-12-19T10:30:00.000Z' }
        }
      }
    }
  })
  async getAllMarketData(): Promise<MarketPrice[]> {
    return this.marketDataService.getAllMarketData();
  }

  /**
   * Simulate price update for testing
   */
  @Post('simulate/:symbol')
  @ApiOperation({ summary: 'Simulate price update for testing' })
  @ApiParam({ name: 'symbol', description: 'Asset symbol', example: 'VFF' })
  @ApiResponse({ status: 200, description: 'Price updated successfully' })
  async simulatePriceUpdate(
    @Param('symbol') symbol: string,
    @Body() body: { price: number }
  ): Promise<{ message: string; symbol: string; newPrice: number }> {
    await this.marketDataService.simulatePriceUpdate(symbol, body.price);
    return {
      message: 'Price updated successfully',
      symbol,
      newPrice: body.price,
    };
  }

  /**
   * Get price history for a symbol
   */
  @Get('history/:symbol')
  @ApiOperation({ summary: 'Get price history for a symbol' })
  @ApiParam({ name: 'symbol', description: 'Asset symbol', example: 'VFF' })
  @ApiQuery({ name: 'period', description: 'Time period', example: '1D', enum: ['1D', '1W', '1M', '3M', '1Y'] })
  @ApiResponse({ 
    status: 200, 
    description: 'Price history retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', example: '2024-12-19T10:30:00.000Z' },
          price: { type: 'number', example: 34000 }
        }
      }
    }
  })
  async getPriceHistory(
    @Param('symbol') symbol: string,
    @Query('period') period: '1D' | '1W' | '1M' | '3M' | '1Y' = '1D'
  ): Promise<Array<{ timestamp: Date; price: number }>> {
    return this.marketDataService.getPriceHistory(symbol, period);
  }

  /**
   * Reset all prices to base prices
   */
  @Post('reset')
  @ApiOperation({ summary: 'Reset all prices to base prices' })
  @ApiResponse({ status: 200, description: 'Prices reset successfully' })
  async resetPrices(): Promise<{ message: string }> {
    this.marketDataService.resetToBasePrices();
    return { message: 'All prices reset to base prices' };
  }
}
