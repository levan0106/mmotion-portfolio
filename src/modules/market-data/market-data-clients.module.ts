import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { 
  FundPriceAPIClient, 
  GoldPriceAPIClient, 
  ExchangeRateAPIClient, 
  StockPriceAPIClient,
  CryptoPriceAPIClient
} from './clients';
import { ExternalMarketDataService } from './services/external-market-data.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 seconds
      maxRedirects: 3,
      headers: {
        'User-Agent': 'MMotion-Portfolio/1.0'
      }
    })
  ],
  providers: [
    FundPriceAPIClient,
    GoldPriceAPIClient,
    ExchangeRateAPIClient,
    StockPriceAPIClient,
    CryptoPriceAPIClient,
    ExternalMarketDataService
  ],
  exports: [
    FundPriceAPIClient,
    GoldPriceAPIClient,
    ExchangeRateAPIClient,
    StockPriceAPIClient,
    CryptoPriceAPIClient,
    ExternalMarketDataService
  ]
})
export class MarketDataClientsModule {}
