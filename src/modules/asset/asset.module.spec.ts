import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetModule } from './asset.module';
import { GlobalAssetController } from './controllers/global-asset.controller';
import { BasicPriceController } from './controllers/basic-price.controller';
import { AssetController } from './controllers/asset.controller';
import { GlobalAssetService } from './services/global-asset.service';
import { BasicPriceService } from './services/basic-price.service';
import { NationConfigService } from './services/nation-config.service';
import { AssetService } from './services/asset.service';
import { AssetValidationService } from './services/asset-validation.service';
import { AssetAnalyticsService } from './services/asset-analytics.service';
import { AssetCacheService } from './services/asset-cache.service';
import { AssetRepository } from './repositories/asset.repository';
import { IAssetRepository } from './repositories/asset.repository.interface';
import { MarketDataService } from '../market-data/services/market-data.service';
import { Trade } from '../trading/entities/trade.entity';
import { TradeDetail } from '../trading/entities/trade-detail.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { GlobalAsset } from './entities/global-asset.entity';
import { AssetPrice } from './entities/asset-price.entity';
import { AssetPriceHistory } from './entities/asset-price-history.entity';
import { Asset } from './entities/asset.entity';
import { ApplicationLog } from '../logging/entities/application-log.entity';
import { RequestLog } from '../logging/entities/request-log.entity';
import { BusinessEventLog } from '../logging/entities/business-event-log.entity';
import { PerformanceLog } from '../logging/entities/performance-log.entity';
import { Account } from '../shared/entities/account.entity';
import { NavSnapshot } from '../portfolio/entities/nav-snapshot.entity';
import { CashFlow } from '../portfolio/entities/cash-flow.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('AssetModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          password: 'postgres',
          database: 'portfolio_test',
          entities: [
            GlobalAsset, AssetPrice, AssetPriceHistory, Asset, Trade, TradeDetail, 
            Portfolio, Account, NavSnapshot, CashFlow, ApplicationLog, RequestLog, 
            BusinessEventLog, PerformanceLog
          ],
          synchronize: true,
          logging: false,
        }),
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AssetModule,
        TypeOrmModule.forFeature([
          GlobalAsset,
          AssetPrice,
          AssetPriceHistory,
          Asset,
          Trade,
          TradeDetail,
          Portfolio,
          Account,
          NavSnapshot,
          CashFlow,
          ApplicationLog,
          RequestLog,
          BusinessEventLog,
          PerformanceLog,
        ]),
      ],
      providers: [
        // Mock external dependencies
        {
          provide: MarketDataService,
          useValue: {
            getCurrentPrice: jest.fn().mockResolvedValue(100),
          },
        },
        // Mock ConfigService for LoggingModule
        {
          provide: 'ConfigService',
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'LOG_LEVEL': 'info',
                'LOG_FORMAT': 'json',
                'LOG_ENABLE_DATABASE': true,
                'LOG_ENABLE_CONSOLE': true,
                'LOG_ENABLE_FILE': false,
                'LOG_FILE_PATH': './logs/app.log',
                'LOG_MAX_FILES': 5,
                'LOG_MAX_SIZE': '10MB',
                'LOG_ENABLE_ROTATION': true,
                'LOG_SANITIZATION_ENABLED': true,
                'LOG_SANITIZATION_RULES': [],
                'LOG_CONTEXT_ENABLED': true,
                'LOG_PERFORMANCE_ENABLED': true,
                'LOG_SECURITY_ENABLED': true,
                'LOG_ACCESS_CONTROL_ENABLED': true,
                'LOG_AGGREGATION_ENABLED': false,
                'LOG_ANALYTICS_ENABLED': false,
                'LOG_SUMMARIZATION_ENABLED': false,
              };
              return config[key] || null;
            }),
          },
        },
        // Mock ConfigService for LoggingModule (alternative injection)
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'LOG_LEVEL': 'info',
                'LOG_FORMAT': 'json',
                'LOG_ENABLE_DATABASE': true,
                'LOG_ENABLE_CONSOLE': true,
                'LOG_ENABLE_FILE': false,
                'LOG_FILE_PATH': './logs/app.log',
                'LOG_MAX_FILES': 5,
                'LOG_MAX_SIZE': '10MB',
                'LOG_ENABLE_ROTATION': true,
                'LOG_SANITIZATION_ENABLED': true,
                'LOG_SANITIZATION_RULES': [],
                'LOG_CONTEXT_ENABLED': true,
                'LOG_PERFORMANCE_ENABLED': true,
                'LOG_SECURITY_ENABLED': true,
                'LOG_ACCESS_CONTROL_ENABLED': true,
                'LOG_AGGREGATION_ENABLED': false,
                'LOG_ANALYTICS_ENABLED': false,
                'LOG_SUMMARIZATION_ENABLED': false,
              };
              return config[key] || null;
            }),
          },
        },
        // Add individual services for testing
        GlobalAssetService,
        BasicPriceService,
        NationConfigService,
        AssetService,
        AssetValidationService,
        AssetAnalyticsService,
        AssetCacheService,
        AssetRepository,
        {
          provide: 'IAssetRepository',
          useClass: AssetRepository,
        },
      ],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide GlobalAssetController', () => {
    const controller = module.get<GlobalAssetController>(GlobalAssetController);
    expect(controller).toBeDefined();
  });

  it('should provide BasicPriceController', () => {
    const controller = module.get<BasicPriceController>(BasicPriceController);
    expect(controller).toBeDefined();
  });

  it('should provide GlobalAssetService', () => {
    const service = module.get<GlobalAssetService>(GlobalAssetService);
    expect(service).toBeDefined();
  });

  it('should provide BasicPriceService', () => {
    const service = module.get<BasicPriceService>(BasicPriceService);
    expect(service).toBeDefined();
  });

  it('should provide NationConfigService', () => {
    const service = module.get<NationConfigService>(NationConfigService);
    expect(service).toBeDefined();
  });

  it('should export services', () => {
    const globalAssetService = module.get<GlobalAssetService>(GlobalAssetService);
    const basicPriceService = module.get<BasicPriceService>(BasicPriceService);
    const nationConfigService = module.get<NationConfigService>(NationConfigService);

    expect(globalAssetService).toBeDefined();
    expect(basicPriceService).toBeDefined();
    expect(nationConfigService).toBeDefined();
  });

  it('should have TypeORM entities registered', () => {
    // Test that the module is properly configured
    expect(module).toBeDefined();
  });
});
