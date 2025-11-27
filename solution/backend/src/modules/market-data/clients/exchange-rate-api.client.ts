import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { 
  ExchangeRateData, 
  MarketDataType, 
  MarketDataSource 
} from '../types/market-data.types';
import { CircuitBreakerService } from '../../shared/services/circuit-breaker.service';
import { ApiTrackingBase } from '../base/api-tracking.base';
import { ApiResult } from '../interfaces/api-tracking.interface';
// Using regex parsing instead of external HTML parser

@Injectable()
export class ExchangeRateAPIClient extends ApiTrackingBase {
  private readonly baseUrl = 'https://tygiausd.org';
  private readonly timeout = 10000; // 10 seconds

  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService
  ) {
    super(ExchangeRateAPIClient.name);
  }

  /**
   * Get exchange rates from Exchange Rate API with circuit breaker protection
   */
  async getExchangeRates(bank: string = 'vietcombank'): Promise<ApiResult<ExchangeRateData[]>> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': 'https://tygiausd.org/',
      'Origin': 'https://tygiausd.org',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin'
    };

    const apiCall = {
      options: {
        provider: 'Tygia',
        endpoint: `${this.baseUrl}/nganhang/${bank}`,
        method: 'GET',
      },
      apiCall: () => this.fetchExchangeRates(bank, headers),
      dataProcessor: (data: ExchangeRateData[]) => ({
        symbolsProcessed: data.length,
        successfulSymbols: data.filter(item => item && item.symbol && (item.buyPrice > 0 || item.sellPrice > 0)).length,
        failedSymbols: data.filter(item => !item || !item.symbol || (item.buyPrice <= 0 && item.sellPrice <= 0)).length,
      }),
    };

    const result = await this.executeWithTracking(
      apiCall.options,
      apiCall.apiCall,
      apiCall.dataProcessor
    );

    return {
      data: result.statusCode === 200 ? await apiCall.apiCall() : [],
      apiCalls: [result],
      totalSymbols: result.symbolsProcessed,
      successfulSymbols: result.successfulSymbols,
      failedSymbols: result.failedSymbols,
    };
  }

  /**
   * Private method to fetch exchange rates
   */
  private async fetchExchangeRates(bank: string, headers: any): Promise<ExchangeRateData[]> {
    return this.circuitBreakerService.execute(
      'exchange-rate-api',
      async () => {
        this.logger.log(`Fetching exchange rates from Tygia API for bank: ${bank}...`);

        const response = await firstValueFrom(
          this.httpService.get(
            `${this.baseUrl}/nganhang/${bank}`,
            {
              headers,
              timeout: this.timeout
            }
          )
        );

        const exchangeRates = this.parseExchangeRateData(response.data, bank);
        this.logger.log(`Successfully fetched ${exchangeRates.length} exchange rates from Tygia`);
        
        return exchangeRates;
      },
      {
        failureThreshold: 3,
        timeout: 30000,
        successThreshold: 2,
        monitoringPeriod: 300000
      }
    ).catch(error => {
      this.logger.error(`Failed to fetch exchange rates from Tygia for bank ${bank}:`, error.message);
      throw new Error(`Tygia API call failed: ${error.message}`);
    });
  }


  /**
   * Get USD/VND exchange rate
   */
  async getUSDExchangeRate(bank: string = 'vietcombank'): Promise<ExchangeRateData | null> {
    return this.getExchangeRateByCurrency('USD', bank);
  }

  /**
   * Get exchange rate by currency
   */
  async getExchangeRateByCurrency(currency: string, bank: string = 'vietcombank'): Promise<ExchangeRateData | null> {
    try {
      const ratesResult = await this.getExchangeRates(bank);
      const rates = ratesResult.data;
      return rates.find(rate => 
        rate.currency.toUpperCase().includes(currency.toUpperCase())
      ) || null;
    } catch (error) {
      this.logger.error(`Failed to get exchange rate for ${currency} from bank ${bank}:`, error.message);
      return null;
    }
  }

  /**
   * Parse exchange rate data from HTML content
   * Only parse from table with 5 columns (Currency, Buy, Transfer, Sell, ...)
   */
  private parseExchangeRateData(htmlContent: string, bank: string): ExchangeRateData[] {
    try {
      const exchangeRates: ExchangeRateData[] = [];

      // Find all tables in HTML
      const tablePattern = /<table[^>]*>.*?<\/table>/gs;
      const allTables = htmlContent.match(tablePattern) || [];
      
      this.logger.debug(`Found ${allTables.length} tables in HTML`);

      // Find table with 5 columns (checking both th and td)
      let targetTable: string | null = null;
      for (const table of allTables) {
        // Check first data row (skip header if exists)
        const rowPattern = /<tr[^>]*>.*?<\/tr>/gs;
        const rows = table.match(rowPattern) || [];
        
        // Check rows to find one with 4+ cells (th or td)
        for (const row of rows) {
          // Count both th and td cells
          const thPattern = /<th[^>]*>/g;
          const tdPattern = /<td[^>]*>/g;
          const thMatches = row.match(thPattern) || [];
          const tdMatches = row.match(tdPattern) || [];
          const cellCount = thMatches.length + tdMatches.length;
          
          if (cellCount >= 4) {
            targetTable = table;
            this.logger.debug(`Found table with ${cellCount} columns (${thMatches.length} th, ${tdMatches.length} td), ${rows.length} rows`);
            break;
          }
        }
        
        if (targetTable) break;
      }

      if (!targetTable) {
        this.logger.warn('No table with 5 columns found');
        return [];
      }

      // Currency detection patterns
      const currencyPatterns = {
        'USD': ['USD', 'DOLLAR', 'US'],
        'EUR': ['EUR', 'EURO', 'EU'],
        'JPY': ['JPY', 'YEN', 'JAPAN'],
        'GBP': ['GBP', 'POUND', 'STERLING', 'UK'],
        'AUD': ['AUD', 'AUSTRALIA', 'AUSTRALIAN'],
        'CAD': ['CAD', 'CANADA', 'CANADIAN'],
        'CHF': ['CHF', 'SWISS', 'FRANC'],
        'SGD': ['SGD', 'SINGAPORE', 'SINGAPOREAN'],
        'HKD': ['HKD', 'HONGKONG', 'HONG'],
        'KRW': ['KRW', 'KOREAN', 'WON'],
        'CNY': ['CNY', 'CHINESE', 'YUAN', 'RMB'],
        'THB': ['THB', 'THAI', 'BAHT'],
        'MYR': ['MYR', 'MALAYSIA', 'RINGGIT'],
        'IDR': ['IDR', 'INDONESIA', 'RUPIAH'],
        'PHP': ['PHP', 'PHILIPPINES', 'PESO']
      };

      // Helper function to detect currency from text
      const detectCurrencyFromText = (text: string): string | null => {
        if (!text) return null;
        const cleanText = text.trim().toUpperCase().replace(/[^\w]/g, '').replace(/\s+/g, '');
        for (const [currencyCode, patterns] of Object.entries(currencyPatterns)) {
          if (patterns.some(pattern => cleanText.includes(pattern))) {
            return currencyCode;
          }
        }
        return null;
      };

      // Parse rows from target table (5-column format: Currency, Buy, Transfer, Sell, ...)
      const rowPattern = /<tr[^>]*>.*?<\/tr>/gs;
      const rows = targetTable.match(rowPattern) || [];
      
      this.logger.debug(`Parsing ${rows.length} rows from 5-column table`);

      // Helper function to extract text from child elements (for cell 0, 1)
      // Handles cases like: <th><span>...</span><a>USD</a></th>
      const extractFromChildElements = (cellHtml: string): string => {
        if (!cellHtml) return '';
        
        // Remove all HTML tags and get text content
        const strippedText = cellHtml.replace(/<[^>]*>/g, '').trim();
        if (strippedText) {
          return strippedText;
        }
        return '';
      };

      // Helper function to extract direct text from cell (only direct text, ignore child elements)
      // For cell 2, 3, 4 (price cells): <td>26,189<span>...</span></td> -> "26,189"
      const extractDirectText = (cellHtml: string): string => {
        if (!cellHtml) return '';
        
        // Extract text directly after opening tag and before first child element
        // Pattern: <td[^>]*>([^<]*?)< - captures all text (including whitespace) before first <
        // This handles cases like: <td>  26,189<span>...</span></td>
        const directTextMatch = cellHtml.match(/<t[dh][^>]*>([^<]*?)(?:<|$)/);
        if (directTextMatch && directTextMatch[1]) {
          const trimmed = directTextMatch[1].trim();
          if (trimmed) {
            return trimmed;
          }
        }
        
        // If no direct text found, return empty (don't get text from child elements)
        return '';
      };

      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        // Extract text content from table cells (both th and td)
        const thPattern = /<th[^>]*>.*?<\/th>/gs;
        const tdPattern = /<td[^>]*>.*?<\/td>/gs;
        const cells = [];
        let match;
        
        // Extract from th cells first (header row)
        while ((match = thPattern.exec(row)) !== null) {
          // For header cells, extract from child elements (like <th><a>USD</a></th>)
          const cellText = extractFromChildElements(match[0]);
          if (rowIndex === 0) {
            this.logger.debug(`Header cell ${cells.length}: "${match[0].substring(0, 100)}" -> "${cellText}"`);
          }
          cells.push(cellText);
        }
        
        // Extract from td cells (data rows)
        while ((match = tdPattern.exec(row)) !== null) {
          const cellIndex = cells.length;
          let cellText: string;
          
          // Cell 0 and 1: extract from child elements (currency and other info)
          // Cell 2, 3, 4: extract direct text only (price values)
          if (cellIndex < 2) {
            cellText = extractFromChildElements(match[0]);
          } else {
            cellText = extractDirectText(match[0]);
          }
          
          // Log all cells for debugging
          this.logger.debug(`Data cell ${cellIndex} (row ${rowIndex}): "${match[0].substring(0, 100)}" -> "${cellText}"`);
          cells.push(cellText);
        }

        // Only process rows with at least 4 cells (Currency, Buy, Transfer, Sell)
        if (cells.length < 4) {
          continue;
        }

        // Parse 5-column format: [Currency, Buy, Transfer, Sell, ...]
        const currencyText = cells[0];
        
        // Debug: log all cells for first few rows
        if (rowIndex < 3) {
          this.logger.debug(`Row ${rowIndex} cells: [${cells.map((c, i) => `cell${i}="${c}"`).join(', ')}]`);
        }
        const buyPriceText = cells[2].replace(/[,\s]/g, '');
        const transferPriceText = cells[3].replace(/[,\s]/g, '');
        const sellPriceText = cells[4].replace(/[,\s]/g, '');

        // Detect currency
        const currency = detectCurrencyFromText(currencyText);
        if (!currency) {
          this.logger.debug(`Row ${rowIndex}: Could not detect currency from "${currencyText}"`);
          continue;
        }

        // Parse prices
        const buyPrice = parseFloat(buyPriceText);
        const transferPrice = parseFloat(transferPriceText);
        const sellPrice = parseFloat(sellPriceText);

        // Validate prices
        if (isNaN(buyPrice) || isNaN(transferPrice) || isNaN(sellPrice) || 
            buyPrice <= 0 || transferPrice <= 0 || sellPrice <= 0) {
          this.logger.debug(`Row ${rowIndex}: Invalid prices for ${currency}: buy=${buyPrice}, transfer=${transferPrice}, sell=${sellPrice}`);
          continue;
        }

        // Check for duplicates
        const existingRate = exchangeRates.find(rate => rate.currency === currency);
        if (existingRate) {
          this.logger.debug(`Skipping duplicate currency: ${currency}`);
          continue;
        }

        // Add exchange rate
        exchangeRates.push({
          symbol: currency,
          buyPrice,
          sellPrice,
          lastUpdated: new Date(),
          source: bank.toUpperCase(),
          type: MarketDataType.EXCHANGE_RATE,
          currency,
          transferPrice
        });

        this.logger.debug(`Added exchange rate for ${currency}: buy=${buyPrice}, transfer=${transferPrice}, sell=${sellPrice}`);
      }

      // Debug: Log final results
      this.logger.debug(`Parsed ${exchangeRates.length} exchange rates: ${exchangeRates.map(r => r.currency).join(', ')}`);
      
      return exchangeRates;
    } catch (error) {
      this.logger.error('Failed to parse Tygia exchange rate data:', error.message);
      return [];
    }
  }

  /**
   * Get exchange rate by symbol mapping
   */
  async getExchangeRateBySymbol(symbol: string, bank: string = 'vietcombank'): Promise<ExchangeRateData | null> {
    // Try direct currency match first
    const directMatch = await this.getExchangeRateByCurrency(symbol, bank);
    if (directMatch) {
      return directMatch;
    }

    // Map common symbols to currency variations
    const symbolMap: { [key: string]: string[] } = {
      'USD': ['USD/VND', 'US Dollar'],
      'EUR': ['EUR/VND', 'Euro'],
      'GBP': ['GBP/VND', 'British Pound'],
      'JPY': ['JPY/VND', 'Japanese Yen'],
      'CNY': ['CNY/VND', 'Chinese Yuan'],
      'KRW': ['KRW/VND', 'Korean Won'],
      'SGD': ['SGD/VND', 'Singapore Dollar'],
      'THB': ['THB/VND', 'Thai Baht']
    };

    const mappedCurrencies = symbolMap[symbol.toUpperCase()] || [];
    for (const currency of mappedCurrencies) {
      const rate = await this.getExchangeRateByCurrency(currency, bank);
      if (rate) {
        return rate;
      }
    }

    return null;
  }

  /**
   * Test API connectivity with circuit breaker protection
   */
  async testConnection(bank: string = 'vietcombank'): Promise<boolean> {
    try {
      await this.getExchangeRates(bank);
      return true;
    } catch (error) {
      this.logger.error(`Tygia API connection test failed for bank ${bank}:`, error.message);
      return false;
    }
  }

  /**
   * Get circuit breaker statistics for exchange rate API
   */
  getCircuitBreakerStats() {
    return this.circuitBreakerService.getStats('exchange-rate-api');
  }

  /**
   * Reset circuit breaker for exchange rate API
   */
  resetCircuitBreaker(): void {
    this.circuitBreakerService.reset('exchange-rate-api');
  }
}
