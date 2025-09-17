import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceHistoryService, CreatePriceHistoryDto, PriceHistoryQueryDto } from './price-history.service';
import { AssetPriceHistory } from '../entities/asset-price-history.entity';
import { GlobalAsset } from '../entities/global-asset.entity';
import { LoggingService } from '../../logging/services/logging.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PriceHistoryService', () => {
  let service: PriceHistoryService;
  let priceHistoryRepository: Repository<AssetPriceHistory>;
  let globalAssetRepository: Repository<GlobalAsset>;
  let loggingService: LoggingService;

  const mockAsset = {
    id: 'asset-1',
    symbol: 'HPG',
    name: 'Hoa Phat Group',
    type: 'STOCK',
    nation: 'VN',
    marketCode: 'HOSE',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    isActive: true,
    description: 'Test asset',
    createdAt: new Date(),
    updatedAt: new Date(),
    trades: [],
    assetPrice: null,
    priceHistory: [],
    getGlobalIdentifier: jest.fn().mockReturnValue('HPG-VN'),
    getDisplayName: jest.fn().mockReturnValue('Hoa Phat Group'),
    getMarketDisplayName: jest.fn().mockReturnValue('HOSE'),
    hasTrades: jest.fn().mockReturnValue(false),
    isActiveAsset: jest.fn().mockReturnValue(true),
    getFormattedPrice: jest.fn().mockReturnValue('150,000 VND'),
    getPriceAgeHours: jest.fn().mockReturnValue(1),
    getPriceAgeDays: jest.fn().mockReturnValue(0),
    needsUpdating: jest.fn().mockReturnValue(false),
  } as any;

  const mockPriceHistory = {
    id: 'history-1',
    assetId: 'asset-1',
    price: 150000,
    priceType: 'MARKET_DATA',
    priceSource: 'MARKET_DATA_SERVICE',
    changeReason: 'Market update',
    metadata: { provider: 'test' },
    createdAt: new Date(),
    globalAsset: mockAsset,
    isMarketDataChange: jest.fn().mockReturnValue(true),
    isManualChange: jest.fn().mockReturnValue(false),
    getChangeDescription: jest.fn().mockReturnValue('Market data update'),
    getPriceChangePercentage: jest.fn().mockReturnValue(5.5),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceHistoryService,
        {
          provide: getRepositoryToken(AssetPriceHistory),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
              getOne: jest.fn(),
              delete: jest.fn().mockReturnThis(),
              execute: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(GlobalAsset),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: LoggingService,
          useValue: {
            logBusinessEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PriceHistoryService>(PriceHistoryService);
    priceHistoryRepository = module.get<Repository<AssetPriceHistory>>(
      getRepositoryToken(AssetPriceHistory),
    );
    globalAssetRepository = module.get<Repository<GlobalAsset>>(
      getRepositoryToken(GlobalAsset),
    );
    loggingService = module.get<LoggingService>(LoggingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPriceHistory', () => {
    const createDto: CreatePriceHistoryDto = {
      assetId: 'asset-1',
      price: 150000,
      priceType: 'MARKET_DATA',
      priceSource: 'MARKET_DATA_SERVICE',
      changeReason: 'Market update',
      metadata: { provider: 'test' },
    };

    it('should create price history successfully', async () => {
      jest.spyOn(globalAssetRepository, 'findOne').mockResolvedValue(mockAsset);
      jest.spyOn(priceHistoryRepository, 'create').mockReturnValue(mockPriceHistory);
      jest.spyOn(priceHistoryRepository, 'save').mockResolvedValue(mockPriceHistory);
      jest.spyOn(loggingService, 'logBusinessEvent').mockResolvedValue(undefined);

      const result = await service.createPriceHistory(createDto);

      expect(result).toEqual(mockPriceHistory);
      expect(globalAssetRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'asset-1' }
      });
      expect(priceHistoryRepository.create).toHaveBeenCalledWith(createDto);
      expect(priceHistoryRepository.save).toHaveBeenCalledWith(mockPriceHistory);
      expect(loggingService.logBusinessEvent).toHaveBeenCalled();
    });

    it('should throw NotFoundException when asset not found', async () => {
      jest.spyOn(globalAssetRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createPriceHistory(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when price is invalid', async () => {
      const invalidDto = { ...createDto, price: -100 };
      jest.spyOn(globalAssetRepository, 'findOne').mockResolvedValue(mockAsset);

      await expect(service.createPriceHistory(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history for asset', async () => {
      jest.spyOn(globalAssetRepository, 'findOne').mockResolvedValue(mockAsset);
      jest.spyOn(priceHistoryRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPriceHistory]),
      } as any);

      const result = await service.getPriceHistory('asset-1');

      expect(result).toEqual([mockPriceHistory]);
    });

    it('should throw NotFoundException when asset not found', async () => {
      jest.spyOn(globalAssetRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getPriceHistory('asset-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should apply filters correctly', async () => {
      jest.spyOn(globalAssetRepository, 'findOne').mockResolvedValue(mockAsset);
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPriceHistory]),
      };
      jest.spyOn(priceHistoryRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const query: PriceHistoryQueryDto = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        priceType: 'MARKET_DATA',
        limit: 10,
        offset: 0,
      };

      await service.getPriceHistory('asset-1', query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'priceHistory.createdAt >= :startDate',
        { startDate: query.startDate }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'priceHistory.createdAt <= :endDate',
        { endDate: query.endDate }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'priceHistory.priceType = :priceType',
        { priceType: query.priceType }
      );
    });
  });

  describe('getPriceHistoryByDateRange', () => {
    it('should return price history within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      jest.spyOn(service, 'getPriceHistory').mockResolvedValue([mockPriceHistory]);

      const result = await service.getPriceHistoryByDateRange('asset-1', startDate, endDate);

      expect(service.getPriceHistory).toHaveBeenCalledWith('asset-1', {
        startDate,
        endDate,
        orderBy: 'createdAt',
        orderDirection: 'ASC',
      });
      expect(result).toEqual([mockPriceHistory]);
    });
  });

  describe('getLatestPriceHistory', () => {
    it('should return latest price history records', async () => {
      jest.spyOn(service, 'getPriceHistory').mockResolvedValue([mockPriceHistory]);

      const result = await service.getLatestPriceHistory('asset-1', 5);

      expect(service.getPriceHistory).toHaveBeenCalledWith('asset-1', {
        limit: 5,
        orderBy: 'createdAt',
        orderDirection: 'DESC',
      });
      expect(result).toEqual([mockPriceHistory]);
    });
  });

  describe('getPriceHistoryStats', () => {
    it('should return price history statistics', async () => {
      const mockRecords = [
        { ...mockPriceHistory, price: 100000, createdAt: new Date('2024-01-01') },
        { ...mockPriceHistory, price: 120000, createdAt: new Date('2024-01-02') },
        { ...mockPriceHistory, price: 110000, createdAt: new Date('2024-01-03') },
      ];

      jest.spyOn(priceHistoryRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockRecords),
      } as any);

      const result = await service.getPriceHistoryStats('asset-1');

      expect(result.totalRecords).toBe(3);
      expect(result.priceRange.min).toBe(100000);
      expect(result.priceRange.max).toBe(120000);
      expect(result.priceRange.average).toBe(110000);
      expect(result.priceChanges.positive).toBe(1);
      expect(result.priceChanges.negative).toBe(1);
      expect(result.priceChanges.neutral).toBe(0);
    });

    it('should throw NotFoundException when no records found', async () => {
      jest.spyOn(priceHistoryRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      await expect(service.getPriceHistoryStats('asset-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteOldPriceHistory', () => {
    it('should delete old price history records', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
      };
      jest.spyOn(priceHistoryRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(loggingService, 'logBusinessEvent').mockResolvedValue(undefined);

      const result = await service.deleteOldPriceHistory('asset-1', 365);

      expect(result).toBe(5);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('createdAt < :cutoffDate', expect.any(Object));
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('assetId = :assetId', { assetId: 'asset-1' });
      expect(loggingService.logBusinessEvent).toHaveBeenCalled();
    });

    it('should delete old records for all assets when assetId not provided', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 10 }),
      };
      jest.spyOn(priceHistoryRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.deleteOldPriceHistory(undefined, 180);

      expect(result).toBe(10);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('createdAt < :cutoffDate', expect.any(Object));
    });
  });

  describe('hasPriceHistory', () => {
    it('should return true when asset has price history', async () => {
      jest.spyOn(priceHistoryRepository, 'count').mockResolvedValue(5);

      const result = await service.hasPriceHistory('asset-1');

      expect(result).toBe(true);
      expect(priceHistoryRepository.count).toHaveBeenCalledWith({
        where: { assetId: 'asset-1' }
      });
    });

    it('should return false when asset has no price history', async () => {
      jest.spyOn(priceHistoryRepository, 'count').mockResolvedValue(0);

      const result = await service.hasPriceHistory('asset-1');

      expect(result).toBe(false);
    });
  });

  describe('getPriceHistoryCount', () => {
    it('should return count of price history records', async () => {
      jest.spyOn(priceHistoryRepository, 'count').mockResolvedValue(15);

      const result = await service.getPriceHistoryCount('asset-1');

      expect(result).toBe(15);
      expect(priceHistoryRepository.count).toHaveBeenCalledWith({
        where: { assetId: 'asset-1' }
      });
    });
  });
});
