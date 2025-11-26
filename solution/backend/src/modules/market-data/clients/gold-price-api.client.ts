import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { 
  GoldData, 
  MarketDataType, 
  MarketDataSource 
} from '../types/market-data.types';
import { CircuitBreakerService } from '../../shared/services/circuit-breaker.service';
import { ApiTrackingBase } from '../base/api-tracking.base';
import { ApiResult } from '../interfaces/api-tracking.interface';
// Using regex parsing instead of external HTML parser

@Injectable()
export class GoldPriceAPIClient extends ApiTrackingBase {
  private readonly baseUrl = 'https://giavang.doji.vn';
  private readonly timeout = 10000; // 10 seconds

  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService
  ) {
    super(GoldPriceAPIClient.name);
  }

  /**
   * Get all gold prices from Gold API with circuit breaker protection
   */
  async getAllGoldPrices(): Promise<ApiResult<GoldData[]>> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': 'https://giavang.doji.vn/',
      'Origin': 'https://giavang.doji.vn',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin'
    };

    const apiCall = {
      options: {
        provider: 'Doji',
        endpoint: `${this.baseUrl}/sites/default/files/data/hienthi/vungmien_109.dat`,
        method: 'GET',
      },
      apiCall: () => this.fetchGoldPrices(headers),
      dataProcessor: (data: { goldPrices: GoldData[]; rejectedCount: number }) => {
        const validGoldPrices = data.goldPrices;
        return {
          symbolsProcessed: validGoldPrices.length + data.rejectedCount, // Total: valid + rejected
          successfulSymbols: validGoldPrices.filter(item => item && item.symbol && (item.buyPrice > 0 || item.sellPrice > 0)).length,
          failedSymbols: data.rejectedCount + validGoldPrices.filter(item => !item || !item.symbol || (item.buyPrice <= 0 && item.sellPrice <= 0)).length, // Include rejected count
        };
      },
    };

    const result = await this.executeWithTracking(
      apiCall.options,
      apiCall.apiCall,
      apiCall.dataProcessor
    );

    // Fetch actual data
    const fetchResult = result.statusCode === 200 ? await apiCall.apiCall() : { goldPrices: [], rejectedCount: 0 };

    return {
      data: fetchResult.goldPrices, // Return only valid gold prices
      apiCalls: [result],
      totalSymbols: result.symbolsProcessed,
      successfulSymbols: result.successfulSymbols,
      failedSymbols: result.failedSymbols,
    };
  }

  /**
   * Private method to fetch gold prices
   * Returns both valid gold prices and rejected count for proper tracking
   */
  private async fetchGoldPrices(headers: any): Promise<{ goldPrices: GoldData[]; rejectedCount: number }> {
    return this.circuitBreakerService.execute(
      'gold-price-api',
      async () => {
        this.logger.log('Fetching gold prices from Doji API...');

        const response = await firstValueFrom(
          this.httpService.get(
            `${this.baseUrl}/sites/default/files/data/hienthi/vungmien_109.dat`,
            {
              headers,
              timeout: this.timeout,
              responseType: 'arraybuffer'
            }
          )
        );

        const htmlText = Buffer.from(response.data).toString('utf-8');
        const cleanText = htmlText
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');

        const parseResult = this.parseGoldData(cleanText);
        this.logger.log(`Successfully fetched ${parseResult.goldPrices.length} gold prices from Doji (${parseResult.rejectedCount} rejected)`);
        
        return parseResult;
      },
      {
        failureThreshold: 3,
        timeout: 30000,
        successThreshold: 2,
        monitoringPeriod: 300000
      }
    ).catch(error => {
      this.logger.error('Failed to fetch gold prices from Doji:', error.message);
      throw new Error(`Doji API call failed: ${error.message}`);
    });
  }

  /**
   * Get specific gold price by type
   */
  async getGoldPrice(type: string): Promise<GoldData | null> {
    try {
      const allPricesResult = await this.getAllGoldPrices();
      const allPrices = allPricesResult.data;
      return allPrices.find(price => 
        price.type.toLowerCase().includes(type.toLowerCase())
      ) || null;
    } catch (error) {
      this.logger.error(`Failed to get gold price for ${type}:`, error.message);
      return null;
    }
  }

  /**
   * Parse gold data from HTML content
   * Returns both valid gold prices and rejected count for proper tracking
   */
  private parseGoldData(htmlContent: string): { goldPrices: GoldData[]; rejectedCount: number } {
    try {
      const goldPrices: GoldData[] = [];
      let rejectedCount = 0; // Track rejected records due to invalid price

      // Debug: Log HTML content length and first 500 chars
      //this.logger.debug(`HTML content length: ${htmlContent.length}`);
      //this.logger.debug(`HTML content preview: ${htmlContent.substring(0, 500)}`);

      // Based on market price.md, we need to look for table with class "goldprice-view"
      // The Power Query uses: table.goldprice-view tbody tr td.label
      // Let's try to find this specific table structure

      // Look for the gold price table specifically
      const goldTablePattern = /<table[^>]*class="[^"]*goldprice-view[^"]*"[^>]*>.*?<\/table>/gs;
      let tableContent = htmlContent.match(goldTablePattern)?.[0] || '';

      if (!tableContent) {
        // Fallback: look for any table
        const tablePattern = /<table[^>]*>.*?<\/table>/gs;
        tableContent = htmlContent.match(tablePattern)?.[0] || htmlContent;
        this.logger.debug('Using fallback table parsing');
      } else {
        // this.logger.debug('Found goldprice-view table');
      }

      // Parse table rows
      const rowPattern = /<tr[^>]*>.*?<\/tr>/gs;
      const rows = tableContent.match(rowPattern) || [];

      if (rows.length === 0) {
        this.logger.error('No gold price table found in HTML content' + htmlContent);
        return { goldPrices: [], rejectedCount: 0 };
      }

      for (const row of rows) {
        // Extract text content from table cells
        const cellPattern = /<td[^>]*>(.*?)<\/td>/gs;
        const cells = [];
        let match;
        
        while ((match = cellPattern.exec(row)) !== null) {
          // Remove HTML tags and get clean text
          const cellText = match[1].replace(/<[^>]*>/g, '').trim();
          cells.push(cellText);
        }

        // Debug: Log cells found
        // if (cells.length > 0) {
        //   this.logger.debug(`Row with ${cells.length} cells: ${cells.join(' | ')}`);
        // }

        // Check if this row has gold price data (should have at least 3 cells)
        if (cells.length >= 3) {
          const type = cells[0];
          const buyPriceText = cells[1].replace(/,/g, '');
          const sellPriceText = cells[2].replace(/,/g, '');

          const buyPrice = parseFloat(buyPriceText);
          const sellPrice = parseFloat(sellPriceText);

          // this.logger.debug(`Parsed: ${type} | ${buyPrice} | ${sellPrice}`);

          // Validate that we have valid gold price data
          if (type && !isNaN(buyPrice) && !isNaN(sellPrice) && buyPrice > 0 && sellPrice > 0) {
            // Check if this looks like a gold price row (contains gold-related keywords)
            const goldKeywords = [
              'vàng', 'gold', 'doji', 'sjc', '9999', 'pnj',
              'bán lẻ', 'ban le', 'retail', 'vàng sjc', 'gold sjc',
              'hưng thịnh vượng', 'nhẫn tròn', 'nhan tron'
            ];
            const isGoldRow = goldKeywords.some(keyword => 
              type.toLowerCase().includes(keyword.toLowerCase())
            );

            if (isGoldRow) {
              // Calculate final prices (multiply by 1000 to convert from thousands to VND)
              const finalBuyPrice = buyPrice * 1000;
              const finalSellPrice = sellPrice * 1000;
              
              // Validate gold price: if price < 2 million VND per chi (1 chi = 3.75g)
              // This indicates API error or invalid data
              // Note: Gold prices from Doji API are per chi (not per luong)
              // Gold prices in Vietnam are typically 14-15 million VND per chi
              // If price < 2 million, it's likely an error (wrong unit, corrupted data, etc.)
              const MIN_VALID_GOLD_PRICE_PER_CHI = 2000000; // 2 million VND per chi
              
              // Check if prices are too low (likely API error)
              if (finalBuyPrice < MIN_VALID_GOLD_PRICE_PER_CHI || finalSellPrice < MIN_VALID_GOLD_PRICE_PER_CHI) {
                rejectedCount++;
                this.logger.warn(
                  `Invalid gold price detected for ${type}: Buy=${finalBuyPrice.toLocaleString('vi-VN')} VND, ` +
                  `Sell=${finalSellPrice.toLocaleString('vi-VN')} VND. ` +
                  `Price is below minimum threshold (${MIN_VALID_GOLD_PRICE_PER_CHI.toLocaleString('vi-VN')} VND/chi). ` +
                  `Skipping this record as API error.`
                );
                continue; // Skip this record
              }
              
              // Try to get lastUpdated from API data, fallback to current time
              let lastUpdated = new Date();
              // For gold prices, we can use the current time as they're scraped in real-time
              // But we could also parse from HTML if timestamp is available
              
              // Create better symbol and name for gold types
              let symbol = type;
              let name = type;
              
              // Log successful gold price parsing for debugging (after symbol is declared)
              this.logger.debug(
                `[DEBUG] Valid gold price parsed for ${type}: ` +
                `Symbol=${symbol || type}, Buy=${finalBuyPrice.toLocaleString('vi-VN')} VND, ` +
                `Sell=${finalSellPrice.toLocaleString('vi-VN')} VND`
              );
              
              // Special handling for SJC
              if (type.toLowerCase().includes('sjc')) {
                symbol = 'GOLDSJC';
                name = 'Vàng miếng SJC';
              }
              // Special handling for 9999 gold
              else if (type.toLowerCase().includes('9999')) {
                symbol = 'GOLDDOJI';
                name = 'Nhẫn tròn 9999 DOJI';
              }
              // Special handling for PNJ
              else if (type.toLowerCase().includes('pnj')) {
                symbol = 'GOLDPNJ';
                name = 'PNJ Gold';
              }else {
                symbol = 'GOLD';
              }
              
              goldPrices.push({
                symbol: symbol,
                buyPrice: finalBuyPrice,
                sellPrice: finalSellPrice,
                lastUpdated: lastUpdated,
                source: MarketDataSource.DOJI,
                type: MarketDataType.GOLD,
                name: name,
                region: 'Vietnam'
              });
            }
            else {
              this.logger.error(
                `Invalid gold type detected for ${type} not in list of gold types: ${row}`
              );
            }
          }
          else {
            this.logger.error(
              `Validation failed for valid gold price data: ${cells.join(' | ')}`
            );
          }
        }else {
          this.logger.error(
            `Invalid gold row detected: ${cells.join(' | ')}`
          );
        }
      }

      // Log warning if all records were rejected (API likely has issues)
      if (rejectedCount > 0 && goldPrices.length === 0) {
        this.logger.error(
          `All gold price records were rejected due to invalid prices (< 2 million VND/chi). ` +
          `Rejected ${rejectedCount} record(s). This indicates API error - cannot crawl gold price data.`
        );
      } else if (rejectedCount > 0) {
        this.logger.warn(
          `Rejected ${rejectedCount} invalid gold price record(s) (price < 2 million VND/chi). ` +
          `Successfully parsed ${goldPrices.length} valid record(s).`
        );
      }

      return { goldPrices, rejectedCount };
    } catch (error) {
      this.logger.error('Failed to parse Doji gold data:', error.message);
      return { goldPrices: [], rejectedCount: 0 };
    }
  }

  /**
   * Get gold price by symbol mapping
   */
  async getGoldPriceBySymbol(symbol: string): Promise<GoldData | null> {
    try {
      const allPricesResult = await this.getAllGoldPrices();
      const allPrices = allPricesResult.data;
      
      // Map common symbols to gold types
      const symbolMap: { [key: string]: string[] } = {
        'SJC': ['SJC', 'SJC 9999', 'SJC 999', 'GOLDSJC', 'SJCGOLD'],
        'PNJ': ['PNJ', 'PNJ 9999', 'GOLDPNJ', 'PNJGOLD'],
        'DOJI': ['DOJI', 'DOJI 9999', 'DOJIGOLD', 'GOLDDOJI'],
        'GOLD': ['Vàng', 'Gold', 'Vàng 9999', 'GOLD', '9999','VANG9999'],
        'SILVER': ['Bạc', 'Silver']
      };

      const mappedTypes = symbolMap[symbol.toUpperCase()] || [symbol];
      
      for (const type of mappedTypes) {
        const price = allPrices.find(p => 
          p.type.toLowerCase().includes(type.toLowerCase())
        );
        if (price) {
          return price;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get gold price by symbol ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Test API connectivity with circuit breaker protection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAllGoldPrices();
      return true;
    } catch (error) {
      this.logger.error('Doji API connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Get circuit breaker statistics for gold price API
   */
  getCircuitBreakerStats() {
    return this.circuitBreakerService.getStats('gold-price-api');
  }

  /**
   * Reset circuit breaker for gold price API
   */
  resetCircuitBreaker(): void {
    this.circuitBreakerService.reset('gold-price-api');
  }
}
