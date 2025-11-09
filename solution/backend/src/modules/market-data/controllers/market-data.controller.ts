import { Controller, Get, Param, Post, Body, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MarketDataService, MarketPrice, BulkPriceResult } from '../services/market-data.service';

// ==================== DTOs ====================

export class SymbolRequest {
  @IsString()
  symbol: string;

  @IsString()
  assetType: string;
}

export class BulkPriceRequest {
  @ApiProperty({
    description: 'Array of market symbols with asset types to fetch',
    example: [
      { symbol: 'VFF', assetType: 'STOCK' },
      { symbol: 'VESAF', assetType: 'FUND' },
      { symbol: 'DOJI', assetType: 'GOLD' },
      { symbol: 'HPG', assetType: 'STOCK' },
      { symbol: 'VCB', assetType: 'STOCK' }
    ],
    type: [Object]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SymbolRequest)
  symbols: Array<{symbol: string, assetType: string}>;

  @ApiProperty({
    description: 'Start date for historical data',
    example: '2024-01-01',
    type: String
  })
  @IsString()
  startDate: string;

  @ApiProperty({
    description: 'End date for historical data',
    example: '2024-01-31',
    type: String
  })
  @IsString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Asset ID for specific asset (optional)',
    example: 'asset-123',
    type: String
  })
  @IsOptional()
  @IsString()
  assetId?: string;

  @ApiPropertyOptional({
    description: 'Force update - always insert new records to keep history',
    example: false,
    type: Boolean,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  forceUpdate?: boolean;

  @ApiPropertyOptional({
    description: 'Cleanup type: none (keep all), external_api (delete only External API data), all (delete everything)',
    example: 'external_api',
    enum: ['none', 'external_api', 'all'],
    default: 'external_api'
  })
  @IsOptional()
  @IsString()
  cleanup?: 'none' | 'external_api' | 'all';
}

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
   * Update historical prices for one or multiple symbols (with forceUpdate support)
   */
  @Post('historical-prices/update')
  @ApiOperation({ summary: 'Update historical prices for one or multiple symbols' })
  @ApiResponse({ 
    status: 200, 
    description: 'Historical prices updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number', example: 5 },
        failed: { type: 'number', example: 1 },
        errors: { type: 'array', items: { type: 'string' } },
        totalRecords: { type: 'number', example: 1250 },
        processedSymbols: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string', example: 'VFF' },
              recordCount: { type: 'number', example: 250 },
              dateRange: {
                type: 'object',
                properties: {
                  start: { type: 'string', example: '2024-01-01' },
                  end: { type: 'string', example: '2024-01-31' }
                }
              }
            }
          }
        }
      }
    }
  })
  async updateHistoricalPrices(
    @Body() request: BulkPriceRequest
  ): Promise<BulkPriceResult> {
    console.log('=== API CALLED ===');
    console.log('Request:', JSON.stringify(request, null, 2));
    console.log('Symbols:', request.symbols);
    console.log('StartDate:', request.startDate);
    console.log('EndDate:', request.endDate);
    console.log('ForceUpdate:', request.forceUpdate);
    console.log('Cleanup:', request.cleanup);
    
    try {
      const result = await this.marketDataService.fetchHistoricalPricesFromAPIAndStoreInDB(
        request.symbols,
        new Date(request.startDate),
        new Date(request.endDate),
        request.assetId,
        request.forceUpdate,
        request.cleanup
      );
      console.log('=== API SUCCESS ===');
      console.log('Result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.log('=== API ERROR ===');
      console.log('Error:', error.message);
      console.log('Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Get historical prices for one or multiple symbols
   */
  @Get('historical-prices')
  @ApiOperation({ summary: 'Get historical prices for one or multiple symbols' })
  @ApiQuery({ name: 'symbols', description: 'Comma-separated list of symbols (optional - if not provided, returns all)', example: 'VFF,VESAF,GOLD' })
  @ApiQuery({ name: 'startDate', description: 'Start date for historical data', example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', description: 'End date for historical data', example: '2024-01-31' })
  @ApiResponse({ 
    status: 200, 
    description: 'Historical prices retrieved successfully'
  })
  async getHistoricalPrices(
    @Query('symbols') symbols?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    if (!symbols) {
      // Get all historical prices if no symbols specified
      return this.marketDataService.getAllHistoricalPricesFromDB(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
    }

    // Get historical prices for specific symbols
    const symbolList = symbols.split(',').map(s => s.trim());
    return this.marketDataService.getBulkHistoricalPriceDataFromDB(
      symbolList,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

}

