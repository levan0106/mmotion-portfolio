import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BaseMarketData, MarketDataType, MarketDataSource } from '../types/market-data.types';

export interface CryptoData extends BaseMarketData {
  name: string;
  symbol: string;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  changePercent24h?: number;
  rank?: number;
}

@Injectable()
export class CryptoPriceAPIClient {
  private readonly logger = new Logger(CryptoPriceAPIClient.name);
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';
  private readonly timeout = 10000;

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get all crypto prices
   */
  async getAllCryptoPrices(): Promise<CryptoData[]> {
    try {
      this.logger.log('Fetching crypto prices from CoinGecko API...');
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/coins/markets`, {
          params: {
            vs_currency: 'vnd',
            order: 'market_cap_desc',
            per_page: 100,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h'
          },
          headers: {
            'User-Agent': 'MMotion-Portfolio/1.0'
          },
          timeout: this.timeout
        })
      );

      const cryptoPrices = this.parseCryptoData(response.data);
      this.logger.log(`Successfully fetched ${cryptoPrices.length} crypto prices from CoinGecko`);
      
      return cryptoPrices;

    } catch (error) {
      this.logger.error('Failed to fetch crypto prices from CoinGecko:', error.message);
      throw new Error(`CoinGecko API call failed: ${error.message}`);
    }
  }

  /**
   * Get specific crypto price by symbol
   */
  async getCryptoPriceBySymbol(symbol: string): Promise<CryptoData | null> {
    try {
      const allPrices = await this.getAllCryptoPrices();
      
      // Try exact match first
      let crypto = allPrices.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
      
      if (!crypto) {
        // Try common symbol mappings
        const symbolMappings: { [key: string]: string } = {
          'btc': 'bitcoin',
          'eth': 'ethereum',
          'bnb': 'binancecoin',
          'ada': 'cardano',
          'sol': 'solana',
          'xrp': 'ripple',
          'dot': 'polkadot',
          'doge': 'dogecoin',
          'avax': 'avalanche-2',
          'matic': 'matic-network',
          'link': 'chainlink',
          'ltc': 'litecoin',
          'atom': 'cosmos',
          'near': 'near',
          'ftm': 'fantom',
          'algo': 'algorand',
          'vet': 'vechain',
          'icp': 'internet-computer',
          'sand': 'the-sandbox',
          'mana': 'decentraland'
        };

        const mappedSymbol = symbolMappings[symbol.toLowerCase()];
        if (mappedSymbol) {
          crypto = allPrices.find(c => c.name.toLowerCase().includes(mappedSymbol.toLowerCase()));
        }
      }

      return crypto || null;

    } catch (error) {
      this.logger.error(`Failed to get crypto price for symbol ${symbol}:`, error.message);
      return null;
    }
  }


  /**
   * Parse crypto data from CoinGecko API response
   */
  private parseCryptoData(response: any[]): CryptoData[] {
    try {
      const cryptos: CryptoData[] = [];

      if (Array.isArray(response)) {
        response.forEach((item: any) => {
          if (item && typeof item === 'object') {
            const price = parseFloat(item.current_price || 0);
            const change24h = parseFloat(item.price_change_24h || 0);
            const changePercent24h = parseFloat(item.price_change_percentage_24h || 0);
            
            // Try to get lastUpdated from API data, fallback to current time
            let lastUpdated = new Date();
            if (item.last_updated || item.updated_at || item.timestamp) {
              const apiTime = item.last_updated || item.updated_at || item.timestamp;
              const parsedTime = new Date(apiTime);
              if (!isNaN(parsedTime.getTime())) {
                lastUpdated = parsedTime;
              }
            }
            
            const crypto: CryptoData = {
              symbol: item.symbol?.toUpperCase() || '',
              buyPrice: price,
              sellPrice: price,
              lastUpdated: lastUpdated,
              source: 'COINGECKO',
              type: 'CRYPTO',
              name: item.name || '',
              marketCap: parseFloat(item.market_cap || 0),
              volume24h: parseFloat(item.total_volume || 0),
              change24h: change24h,
              changePercent24h: changePercent24h,
              rank: parseInt(item.market_cap_rank || '0')
            };

            // Only add cryptos with valid data
            if (crypto.symbol && crypto.buyPrice > 0) {
              cryptos.push(crypto);
            }
          }
        });
      }

      // Sort by rank and return only TOP 20
      const top20Crypto = cryptos
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .slice(0, 20);
      
      return top20Crypto;

    } catch (error) {
      this.logger.error('Failed to parse CoinGecko crypto data:', error.message);
      return [];
    }
  }
}
