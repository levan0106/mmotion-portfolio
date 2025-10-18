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
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 seconds
      maxRedirects: 3,
      headers: {
        'User-Agent': 'Portfolio/1.0'
      }
    }),
    SharedModule // Import SharedModule to get CircuitBreakerService
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
