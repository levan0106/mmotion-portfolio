import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { 
  FundPriceAPIClient, 
  GoldPriceAPIClient, 
  ExchangeRateAPIClient, 
  StockPriceAPIClient,
  CryptoPriceAPIClient
} from './clients';
import { ExternalMarketDataService } from './services/external-market-data.service';
import { ApiTrackingHelper } from './utils/api-tracking.helper';
import { SharedModule } from '../shared/shared.module';
import { AssetModule } from '../asset/asset.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 seconds
      maxRedirects: 3,
      headers: {
        'User-Agent': 'Portfolio/1.0'
      }
    }),
    SharedModule, // Import SharedModule to get CircuitBreakerService
    forwardRef(() => AssetModule) // Import AssetModule to get ApiCallDetailService
  ],
  providers: [
    FundPriceAPIClient,
    GoldPriceAPIClient,
    ExchangeRateAPIClient,
    StockPriceAPIClient,
    CryptoPriceAPIClient,
    ExternalMarketDataService,
    ApiTrackingHelper
  ],
  exports: [
    FundPriceAPIClient,
    GoldPriceAPIClient,
    ExchangeRateAPIClient,
    StockPriceAPIClient,
    CryptoPriceAPIClient,
    ExternalMarketDataService,
    ApiTrackingHelper
  ]
})
export class MarketDataClientsModule {}
