import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { 
  ExchangeRateData, 
  MarketDataType, 
  MarketDataSource 
} from '../types/market-data.types';
import { CircuitBreakerService } from '../../shared/services/circuit-breaker.service';
// Using regex parsing instead of external HTML parser

@Injectable()
export class ExchangeRateAPIClient {
  private readonly logger = new Logger(ExchangeRateAPIClient.name);
  private readonly baseUrl = 'https://tygiausd.org';
  private readonly timeout = 10000; // 10 seconds

  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService
  ) {}

  /**
   * Get exchange rates from Exchange Rate API with circuit breaker protection
   */
  async getExchangeRates(bank: string = 'vietcombank'): Promise<ExchangeRateData[]> {
    return this.circuitBreakerService.execute(
      'exchange-rate-api',
      async () => {
        this.logger.log(`Fetching exchange rates from Tygia API for bank: ${bank}...`);

        const response = await firstValueFrom(
          this.httpService.get(
            `${this.baseUrl}/nganhang/${bank}`,
            {
              headers: {
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
              },
              timeout: this.timeout
            }
          )
        );

        const exchangeRates = this.parseExchangeRateData(response.data, bank);
        // this.logger.log(`Successfully fetched ${exchangeRates.length} exchange rates from Tygia`);
        
        return exchangeRates;
      },
      {
        failureThreshold: 3, // Open circuit after 3 failures
        timeout: 30000, // Wait 30 seconds before trying again
        successThreshold: 2, // Need 2 successes to close circuit
        monitoringPeriod: 300000 // 5 minutes monitoring window
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
    try {
      const rates = await this.getExchangeRates(bank);
      return rates.find(rate => 
        rate.currency.toUpperCase() === 'USD' || 
        rate.currency.toUpperCase() === 'USD/VND'
      ) || null;
    } catch (error) {
      this.logger.error(`Failed to get USD exchange rate for bank ${bank}:`, error.message);
      return null;
    }
  }

  /**
   * Get exchange rate by currency
   */
  async getExchangeRateByCurrency(currency: string, bank: string = 'vietcombank'): Promise<ExchangeRateData | null> {
    try {
      const rates = await this.getExchangeRates(bank);
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
   */
  private parseExchangeRateData(htmlContent: string, bank: string): ExchangeRateData[] {
    try {
      const exchangeRates: ExchangeRateData[] = [];


      // Based on market price.md, we need to look for table data
      // The Power Query uses Web.Page() which extracts tables automatically
      // Let's try to find table data in the HTML

      // Look for table elements with exchange rate data
      // Try different table selectors that might work
      const tableSelectors = [
        /<table[^>]*>.*?<\/table>/gs,
        /<tbody[^>]*>.*?<\/tbody>/gs,
        /<div[^>]*class="[^"]*table[^"]*"[^>]*>.*?<\/div>/gs
      ];

      let tableContent = '';
      for (const selector of tableSelectors) {
        const match = htmlContent.match(selector);
        if (match && match[0]) {
          tableContent = match[0];
          break;
        }
      }

      if (!tableContent) {
        this.logger.warn('No table content found, trying to parse entire HTML');
        tableContent = htmlContent;
      }

      // First, try to find table headers to understand the structure
      const headerPattern = /<th[^>]*>(.*?)<\/th>/gs;
      const headers = [];
      let headerMatch;
      while ((headerMatch = headerPattern.exec(tableContent)) !== null) {
        const headerText = headerMatch[1].replace(/<[^>]*>/g, '').trim();
        if (headerText) headers.push(headerText);
      }
      
      // Try to find currency names in the HTML content
      const currencyNames = this.extractCurrencyNamesFromHTML(htmlContent);

      // Parse table rows
      const rowPattern = /<tr[^>]*>.*?<\/tr>/gs;
      const rows = tableContent.match(rowPattern) || [];

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


        // Check if this row has exchange rate data
        // Based on debug logs, we see rows with 2 cells containing price data like "26,490 40 | 26,590 40"
        if (cells.length >= 2) {
          // Check if this looks like a price row (contains numbers with commas)
          const firstCell = cells[0];
          const secondCell = cells[1];
          
          // Check if both cells contain price-like data (numbers with commas)
          const pricePattern = /[\d,]+/;
          const isPriceRow = pricePattern.test(firstCell) && pricePattern.test(secondCell);
          
          if (isPriceRow) {
            // Parse the price data - remove commas and spaces, then parse as numbers
            const buyPriceText = firstCell.replace(/[,\s]/g, '');
            const sellPriceText = secondCell.replace(/[,\s]/g, '');

            const buyPrice = parseFloat(buyPriceText);
            const sellPrice = parseFloat(sellPriceText);


            // Validate that we have valid price data
            if (!isNaN(buyPrice) && !isNaN(sellPrice) && buyPrice > 0 && sellPrice > 0) {
              // For 2-cell format, we can only assume USD since we don't have currency info
              // This is a limitation of the 2-cell format - we need to rely on 4-cell format for other currencies
              const currency = 'USD'; // Only USD for 2-cell format
              
              // Check if we already have USD to avoid duplicates
              const existingUSD = exchangeRates.find(rate => rate.currency === 'USD');
              if (!existingUSD) {
                exchangeRates.push({
                  symbol: currency,
                  buyPrice,
                  sellPrice,
                  lastUpdated: new Date(),
                  source: bank.toUpperCase(),
                  type: MarketDataType.EXCHANGE_RATE,
                  currency,
                  transferPrice: (buyPrice + sellPrice) / 2 // Average as transfer price
                });
                
              }
            }
          }
        }
        
        // Also check for traditional 4-cell format
        if (cells.length >= 4) {
          const currency = cells[0];
          const buyPriceText = cells[1].replace(/[,\s]/g, '');
          const transferPriceText = cells[2].replace(/[,\s]/g, '');
          const sellPriceText = cells[3].replace(/[,\s]/g, '');

          const buyPrice = parseFloat(buyPriceText);
          const transferPrice = parseFloat(transferPriceText);
          const sellPrice = parseFloat(sellPriceText);


          // Validate that we have valid exchange rate data
          if (currency && !isNaN(buyPrice) && !isNaN(transferPrice) && !isNaN(sellPrice) && 
              buyPrice > 0 && transferPrice > 0 && sellPrice > 0) {
            
            // Clean currency name - remove extra spaces, special chars, and normalize
            const cleanCurrency = currency.trim()
              .toUpperCase()
              .replace(/[^\w]/g, '') // Remove special characters
              .replace(/\s+/g, ''); // Remove spaces
            
            // Enhanced currency detection with multiple patterns
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

            // Find matching currency
            let detectedCurrency = null;
            for (const [currencyCode, patterns] of Object.entries(currencyPatterns)) {
              if (patterns.some(pattern => cleanCurrency.includes(pattern))) {
                detectedCurrency = currencyCode;
                break;
              }
            }


            if (detectedCurrency) {
              // Check if we already have this currency to avoid duplicates
              const existingCurrency = exchangeRates.find(rate => 
                rate.currency === detectedCurrency
              );
              
              if (!existingCurrency) {
                // Try to get lastUpdated from API data, fallback to current time
                let lastUpdated = new Date();
                // For exchange rates, we can use the current time as they're scraped in real-time
                // But we could also parse from HTML if timestamp is available
                
                exchangeRates.push({
                  symbol: detectedCurrency,
                  buyPrice,
                  sellPrice,
                  lastUpdated: lastUpdated,
                  source: bank.toUpperCase(),
                  type: 'EXCHANGE_RATE',
                  currency: detectedCurrency,
                  transferPrice
                });
                
              }
            } else {
            }
          }
        }
      }

      
      // If we only have USD, create mock data for other currencies based on USD
      // if (exchangeRates.length === 1 && exchangeRates[0].currency === 'USD') {
      //   const usdRate = exchangeRates[0];
      //   const mockRates = this.generateMockExchangeRates(usdRate);
      //   exchangeRates.push(...mockRates);
      //   // this.logger.log(`Generated ${mockRates.length} mock exchange rates based on USD`);
      // }
      
      return exchangeRates;
    } catch (error) {
      this.logger.error('Failed to parse Tygia exchange rate data:', error.message);
      return [];
    }
  }

  /**
   * Extract currency names from HTML content
   */
  private extractCurrencyNamesFromHTML(htmlContent: string): string[] {
    const currencyNames: string[] = [];
    
    // Common currency patterns in Vietnamese websites
    const currencyPatterns = [
      // Currency codes
      /\b(USD|EUR|JPY|GBP|AUD|CAD|CHF|SGD|HKD|KRW|CNY|THB|MYR|IDR|PHP)\b/gi,
      // Currency names in Vietnamese
      /\b(Đô la|Euro|Yên|Bảng|Đô la Úc|Đô la Canada|Franc|Đô la Singapore|Đô la Hong Kong|Won|Nhân dân tệ|Baht|Ringgit|Rupiah|Peso)\b/gi,
      // Currency names in English
      /\b(Dollar|Euro|Yen|Pound|Australian|Canadian|Swiss|Singapore|Hong Kong|Korean|Chinese|Thai|Malaysian|Indonesian|Philippine)\b/gi
    ];

    for (const pattern of currencyPatterns) {
      const matches = htmlContent.match(pattern);
      if (matches) {
        currencyNames.push(...matches.map(m => m.toUpperCase()));
      }
    }

    // Remove duplicates and return unique currency names
    return [...new Set(currencyNames)];
  }

  /**
   * Generate mock exchange rates based on USD rate
   */
  private generateMockExchangeRates(usdRate: ExchangeRateData): ExchangeRateData[] {
    const mockRates: ExchangeRateData[] = [];
    
    // Currency conversion rates relative to USD (approximate)
    const currencyRates = {
      'EUR': 0.85,    // 1 USD = 0.85 EUR
      'JPY': 110,     // 1 USD = 110 JPY
      'GBP': 0.73,    // 1 USD = 0.73 GBP
      'AUD': 1.35,    // 1 USD = 1.35 AUD
      'CAD': 1.25,    // 1 USD = 1.25 CAD
      'CHF': 0.92,    // 1 USD = 0.92 CHF
      'SGD': 1.35,    // 1 USD = 1.35 SGD
      'HKD': 7.8,     // 1 USD = 7.8 HKD
      'KRW': 1200,    // 1 USD = 1200 KRW
      'CNY': 6.45,    // 1 USD = 6.45 CNY
      'THB': 33,      // 1 USD = 33 THB
      'MYR': 4.2,     // 1 USD = 4.2 MYR
      'IDR': 14500,   // 1 USD = 14500 IDR
      'PHP': 50       // 1 USD = 50 PHP
    };

    for (const [currency, rate] of Object.entries(currencyRates)) {
      // Calculate VND rates for other currencies
      const vndPerCurrency = usdRate.buyPrice / rate;
      const buyPrice = Math.round(vndPerCurrency);
      const sellPrice = Math.round(vndPerCurrency * 1.002); // 0.2% spread
      const transferPrice = Math.round((buyPrice + sellPrice) / 2);

      // Use the same lastUpdated as the USD rate for consistency
      mockRates.push({
        symbol: currency,
        buyPrice,
        sellPrice,
        lastUpdated: usdRate.lastUpdated, // Use the same timestamp as USD rate
        source: usdRate.source, // Use the same source as USD (bank name)
        type: 'EXCHANGE_RATE',
        currency,
        transferPrice
      });
    }

    return mockRates;
  }

  /**
   * Get exchange rate by symbol mapping
   */
  async getExchangeRateBySymbol(symbol: string, bank: string = 'vietcombank'): Promise<ExchangeRateData | null> {
    try {
      const rates = await this.getExchangeRates(bank);
      
      // Map common symbols to currencies
      const symbolMap: { [key: string]: string[] } = {
        'USD': ['USD', 'USD/VND', 'US Dollar'],
        'EUR': ['EUR', 'EUR/VND', 'Euro'],
        'GBP': ['GBP', 'GBP/VND', 'British Pound'],
        'JPY': ['JPY', 'JPY/VND', 'Japanese Yen'],
        'CNY': ['CNY', 'CNY/VND', 'Chinese Yuan'],
        'KRW': ['KRW', 'KRW/VND', 'Korean Won'],
        'SGD': ['SGD', 'SGD/VND', 'Singapore Dollar'],
        'THB': ['THB', 'THB/VND', 'Thai Baht']
      };

      const mappedCurrencies = symbolMap[symbol.toUpperCase()] || [symbol];
      
      for (const currency of mappedCurrencies) {
        const rate = rates.find(r => 
          r.currency.toUpperCase().includes(currency.toUpperCase())
        );
        if (rate) {
          return rate;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get exchange rate by symbol ${symbol}:`, error.message);
      return null;
    }
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
