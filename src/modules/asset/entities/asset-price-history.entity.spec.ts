import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetPriceHistory } from './asset-price-history.entity';
import { GlobalAsset } from './global-asset.entity';
import { PriceType, PriceSource } from './asset-price.entity';

describe('AssetPriceHistory Entity', () => {
  let repository: Repository<AssetPriceHistory>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(AssetPriceHistory),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<Repository<AssetPriceHistory>>(getRepositoryToken(AssetPriceHistory));
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Entity Creation', () => {
    it('should create AssetPriceHistory entity with required properties', () => {
      const assetPriceHistory = new AssetPriceHistory();
      assetPriceHistory.id = 'test-id';
      assetPriceHistory.assetId = 'asset-id';
      assetPriceHistory.price = 100.50;
      assetPriceHistory.priceType = PriceType.MANUAL;
      assetPriceHistory.priceSource = PriceSource.USER;
      assetPriceHistory.changeReason = 'Manual update';
      assetPriceHistory.createdAt = new Date();

      expect(assetPriceHistory).toBeDefined();
      expect(assetPriceHistory.id).toBe('test-id');
      expect(assetPriceHistory.assetId).toBe('asset-id');
      expect(assetPriceHistory.price).toBe(100.50);
      expect(assetPriceHistory.priceType).toBe(PriceType.MANUAL);
      expect(assetPriceHistory.priceSource).toBe(PriceSource.USER);
      expect(assetPriceHistory.changeReason).toBe('Manual update');
    });

    it('should create AssetPriceHistory entity with optional properties', () => {
      const assetPriceHistory = new AssetPriceHistory();
      assetPriceHistory.id = 'test-id';
      assetPriceHistory.assetId = 'asset-id';
      assetPriceHistory.price = 100.50;
      assetPriceHistory.priceType = PriceType.MARKET_DATA;
      assetPriceHistory.priceSource = PriceSource.MARKET_DATA_SERVICE;
      assetPriceHistory.changeReason = 'Market data update';
      assetPriceHistory.metadata = { provider: 'Yahoo Finance', timestamp: '2024-01-15T10:30:00.000Z' };
      assetPriceHistory.createdAt = new Date();

      expect(assetPriceHistory).toBeDefined();
      expect(assetPriceHistory.metadata).toEqual({ provider: 'Yahoo Finance', timestamp: '2024-01-15T10:30:00.000Z' });
    });
  });

  describe('Entity Methods', () => {
    let assetPriceHistory: AssetPriceHistory;

    beforeEach(() => {
      assetPriceHistory = new AssetPriceHistory();
      assetPriceHistory.id = 'test-id';
      assetPriceHistory.assetId = 'asset-id';
      assetPriceHistory.price = 100.50;
      assetPriceHistory.priceType = PriceType.MARKET_DATA;
      assetPriceHistory.priceSource = PriceSource.MARKET_DATA_SERVICE;
      assetPriceHistory.changeReason = 'Market data update';
      assetPriceHistory.createdAt = new Date();
    });

    describe('isMarketDataChange', () => {
      it('should return true for MARKET_DATA_SERVICE source', () => {
        assetPriceHistory.priceSource = PriceSource.MARKET_DATA_SERVICE;
        expect(assetPriceHistory.isMarketDataChange()).toBe(true);
      });

      it('should return true for EXTERNAL_API source', () => {
        assetPriceHistory.priceSource = PriceSource.EXTERNAL_API;
        expect(assetPriceHistory.isMarketDataChange()).toBe(true);
      });

      it('should return false for USER source', () => {
        assetPriceHistory.priceSource = PriceSource.USER;
        expect(assetPriceHistory.isMarketDataChange()).toBe(false);
      });

      it('should return false for CALCULATED source', () => {
        assetPriceHistory.priceSource = PriceSource.CALCULATED;
        expect(assetPriceHistory.isMarketDataChange()).toBe(false);
      });
    });

    describe('isManualChange', () => {
      it('should return true for USER source', () => {
        assetPriceHistory.priceSource = PriceSource.USER;
        expect(assetPriceHistory.isManualChange()).toBe(true);
      });

      it('should return false for MARKET_DATA_SERVICE source', () => {
        assetPriceHistory.priceSource = PriceSource.MARKET_DATA_SERVICE;
        expect(assetPriceHistory.isManualChange()).toBe(false);
      });

      it('should return false for EXTERNAL_API source', () => {
        assetPriceHistory.priceSource = PriceSource.EXTERNAL_API;
        expect(assetPriceHistory.isManualChange()).toBe(false);
      });

      it('should return false for CALCULATED source', () => {
        assetPriceHistory.priceSource = PriceSource.CALCULATED;
        expect(assetPriceHistory.isManualChange()).toBe(false);
      });
    });

    describe('getChangeDescription', () => {
      it('should return formatted description with reason and source', () => {
        assetPriceHistory.changeReason = 'Market data update';
        assetPriceHistory.priceSource = PriceSource.MARKET_DATA_SERVICE;
        
        const description = assetPriceHistory.getChangeDescription();
        expect(description).toBe('Market data update (market data_service)');
      });

      it('should return default reason when changeReason is null', () => {
        assetPriceHistory.changeReason = null;
        assetPriceHistory.priceSource = PriceSource.USER;
        
        const description = assetPriceHistory.getChangeDescription();
        expect(description).toBe('No reason provided (user)');
      });

      it('should return default reason when changeReason is undefined', () => {
        assetPriceHistory.changeReason = undefined;
        assetPriceHistory.priceSource = PriceSource.EXTERNAL_API;
        
        const description = assetPriceHistory.getChangeDescription();
        expect(description).toBe('No reason provided (external api)');
      });
    });

    describe('getPriceChangePercentage', () => {
      it('should calculate positive percentage change correctly', () => {
        assetPriceHistory.price = 110.50;
        const previousPrice = 100.00;
        
        const percentage = assetPriceHistory.getPriceChangePercentage(previousPrice);
        expect(percentage).toBe(10.5);
      });

      it('should calculate negative percentage change correctly', () => {
        assetPriceHistory.price = 90.00;
        const previousPrice = 100.00;
        
        const percentage = assetPriceHistory.getPriceChangePercentage(previousPrice);
        expect(percentage).toBe(-10);
      });

      it('should return 0 when previous price is 0', () => {
        assetPriceHistory.price = 100.00;
        const previousPrice = 0;
        
        const percentage = assetPriceHistory.getPriceChangePercentage(previousPrice);
        expect(percentage).toBe(0);
      });

      it('should calculate percentage change with decimal precision', () => {
        assetPriceHistory.price = 105.25;
        const previousPrice = 100.00;
        
        const percentage = assetPriceHistory.getPriceChangePercentage(previousPrice);
        expect(percentage).toBe(5.25);
      });

      it('should handle very small price changes', () => {
        assetPriceHistory.price = 100.01;
        const previousPrice = 100.00;
        
        const percentage = assetPriceHistory.getPriceChangePercentage(previousPrice);
        expect(percentage).toBeCloseTo(0.01, 2);
      });
    });
  });

  describe('Entity Validation', () => {
    it('should accept valid price values', () => {
      const assetPriceHistory = new AssetPriceHistory();
      assetPriceHistory.price = 0.01; // Minimum valid price
      expect(assetPriceHistory.price).toBe(0.01);
    });

    it('should accept valid price types', () => {
      const assetPriceHistory = new AssetPriceHistory();
      
      assetPriceHistory.priceType = PriceType.MANUAL;
      expect(assetPriceHistory.priceType).toBe(PriceType.MANUAL);
      
      assetPriceHistory.priceType = PriceType.MARKET_DATA;
      expect(assetPriceHistory.priceType).toBe(PriceType.MARKET_DATA);
      
      assetPriceHistory.priceType = PriceType.EXTERNAL;
      expect(assetPriceHistory.priceType).toBe(PriceType.EXTERNAL);
      
      assetPriceHistory.priceType = PriceType.CALCULATED;
      expect(assetPriceHistory.priceType).toBe(PriceType.CALCULATED);
    });

    it('should accept valid price sources', () => {
      const assetPriceHistory = new AssetPriceHistory();
      
      assetPriceHistory.priceSource = PriceSource.USER;
      expect(assetPriceHistory.priceSource).toBe(PriceSource.USER);
      
      assetPriceHistory.priceSource = PriceSource.MARKET_DATA_SERVICE;
      expect(assetPriceHistory.priceSource).toBe(PriceSource.MARKET_DATA_SERVICE);
      
      assetPriceHistory.priceSource = PriceSource.EXTERNAL_API;
      expect(assetPriceHistory.priceSource).toBe(PriceSource.EXTERNAL_API);
      
      assetPriceHistory.priceSource = PriceSource.CALCULATED;
      expect(assetPriceHistory.priceSource).toBe(PriceSource.CALCULATED);
    });
  });

  describe('Entity Relationships', () => {
    it('should have relationship with GlobalAsset', () => {
      const assetPriceHistory = new AssetPriceHistory();
      const globalAsset = new GlobalAsset();
      
      assetPriceHistory.globalAsset = globalAsset;
      expect(assetPriceHistory.globalAsset).toBe(globalAsset);
    });

    it('should have assetId property for foreign key', () => {
      const assetPriceHistory = new AssetPriceHistory();
      assetPriceHistory.assetId = 'test-asset-id';
      
      expect(assetPriceHistory.assetId).toBe('test-asset-id');
    });
  });

  describe('Entity Timestamps', () => {
    it('should have createdAt timestamp', () => {
      const assetPriceHistory = new AssetPriceHistory();
      const now = new Date();
      assetPriceHistory.createdAt = now;
      
      expect(assetPriceHistory.createdAt).toBe(now);
    });

    it('should automatically set createdAt when using CreateDateColumn', () => {
      // This test verifies that the entity has the createdAt property
      // The actual automatic setting is handled by TypeORM
      const assetPriceHistory = new AssetPriceHistory();
      expect(assetPriceHistory.createdAt).toBeUndefined();
    });
  });

  describe('Entity Metadata', () => {
    it('should accept JSON metadata', () => {
      const assetPriceHistory = new AssetPriceHistory();
      const metadata = {
        provider: 'Yahoo Finance',
        timestamp: '2024-01-15T10:30:00.000Z',
        confidence: 0.95,
        rawData: { open: 100, high: 105, low: 98, close: 102 }
      };
      
      assetPriceHistory.metadata = metadata;
      expect(assetPriceHistory.metadata).toEqual(metadata);
    });

    it('should accept null metadata', () => {
      const assetPriceHistory = new AssetPriceHistory();
      assetPriceHistory.metadata = null;
      
      expect(assetPriceHistory.metadata).toBeNull();
    });

    it('should accept undefined metadata', () => {
      const assetPriceHistory = new AssetPriceHistory();
      assetPriceHistory.metadata = undefined;
      
      expect(assetPriceHistory.metadata).toBeUndefined();
    });
  });
});
