import { Test, TestingModule } from '@nestjs/testing';
import { PriceHistoryController } from './price-history.controller';
import { PriceHistoryService } from '../services/price-history.service';
import { CreatePriceHistoryDto, PriceHistoryQueryDto } from '../services/price-history.service';
import { AssetPriceHistory } from '../entities/asset-price-history.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PriceHistoryController', () => {
  let controller: PriceHistoryController;
  let priceHistoryService: PriceHistoryService;

  const mockAssetPriceHistory: AssetPriceHistory = {
    id: 'history-1',
    assetId: 'asset-1',
    price: 150000,
    priceType: 'MARKET_DATA',
    priceSource: 'MARKET_DATA_SERVICE',
    changeReason: 'Market update',
    metadata: { provider: 'test' },
    createdAt: new Date(),
    globalAsset: {} as any,
    isMarketDataChange: jest.fn().mockReturnValue(true),
    isManualChange: jest.fn().mockReturnValue(false),
    getChangeDescription: jest.fn().mockReturnValue('Market data update'),
    getPriceChangePercentage: jest.fn().mockReturnValue(5.5),
  };

  const mockPriceHistoryStats = {
    totalRecords: 10,
    priceRange: {
      min: 100000,
      max: 200000,
      average: 150000,
    },
    priceChanges: {
      total: 9,
      positive: 5,
      negative: 3,
      neutral: 1,
    },
    timeRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-10'),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PriceHistoryController],
      providers: [
        {
          provide: PriceHistoryService,
          useValue: {
            createPriceHistory: jest.fn(),
            getPriceHistory: jest.fn(),
            getPriceHistoryByDateRange: jest.fn(),
            getLatestPriceHistory: jest.fn(),
            getPriceHistoryStats: jest.fn(),
            getPriceHistoryByType: jest.fn(),
            getPriceHistoryBySource: jest.fn(),
            hasPriceHistory: jest.fn(),
            getPriceHistoryCount: jest.fn(),
            deleteOldPriceHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PriceHistoryController>(PriceHistoryController);
    priceHistoryService = module.get<PriceHistoryService>(PriceHistoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
      jest.spyOn(priceHistoryService, 'createPriceHistory').mockResolvedValue(mockAssetPriceHistory);

      const result = await controller.createPriceHistory(createDto);

      expect(result).toEqual(mockAssetPriceHistory);
      expect(priceHistoryService.createPriceHistory).toHaveBeenCalledWith(createDto);
    });

    it('should throw BadRequestException when service throws BadRequestException', async () => {
      jest.spyOn(priceHistoryService, 'createPriceHistory').mockRejectedValue(
        new BadRequestException('Invalid price'),
      );

      await expect(controller.createPriceHistory(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when service throws NotFoundException', async () => {
      jest.spyOn(priceHistoryService, 'createPriceHistory').mockRejectedValue(
        new NotFoundException('Asset not found'),
      );

      await expect(controller.createPriceHistory(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPriceHistory', () => {
    const assetId = 'asset-1';
    const query: PriceHistoryQueryDto = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      limit: 10,
    };

    it('should return price history for asset', async () => {
      jest.spyOn(priceHistoryService, 'getPriceHistory').mockResolvedValue([mockAssetPriceHistory]);

      const result = await controller.getPriceHistory(assetId, query);

      expect(result).toEqual([mockAssetPriceHistory]);
      expect(priceHistoryService.getPriceHistory).toHaveBeenCalledWith(assetId, query);
    });

    it('should throw NotFoundException when service throws NotFoundException', async () => {
      jest.spyOn(priceHistoryService, 'getPriceHistory').mockRejectedValue(
        new NotFoundException('Asset not found'),
      );

      await expect(controller.getPriceHistory(assetId, query)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPriceHistoryByDateRange', () => {
    const assetId = 'asset-1';
    const startDate = '2024-01-01T00:00:00Z';
    const endDate = '2024-01-31T23:59:59Z';

    it('should return price history within date range', async () => {
      jest.spyOn(priceHistoryService, 'getPriceHistoryByDateRange').mockResolvedValue([mockAssetPriceHistory]);

      const result = await controller.getPriceHistoryByDateRange(assetId, startDate, endDate);

      expect(result).toEqual([mockAssetPriceHistory]);
      expect(priceHistoryService.getPriceHistoryByDateRange).toHaveBeenCalledWith(
        assetId,
        new Date(startDate),
        new Date(endDate),
      );
    });

    it('should throw NotFoundException when service throws NotFoundException', async () => {
      jest.spyOn(priceHistoryService, 'getPriceHistoryByDateRange').mockRejectedValue(
        new NotFoundException('Asset not found'),
      );

      await expect(controller.getPriceHistoryByDateRange(assetId, startDate, endDate)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getLatestPriceHistory', () => {
    const assetId = 'asset-1';
    const limit = 5;

    it('should return latest price history records', async () => {
      jest.spyOn(priceHistoryService, 'getLatestPriceHistory').mockResolvedValue([mockAssetPriceHistory]);

      const result = await controller.getLatestPriceHistory(assetId, limit);

      expect(result).toEqual([mockAssetPriceHistory]);
      expect(priceHistoryService.getLatestPriceHistory).toHaveBeenCalledWith(assetId, limit);
    });

    it('should use default limit when not provided', async () => {
      jest.spyOn(priceHistoryService, 'getLatestPriceHistory').mockResolvedValue([mockAssetPriceHistory]);

      await controller.getLatestPriceHistory(assetId);

      expect(priceHistoryService.getLatestPriceHistory).toHaveBeenCalledWith(assetId, undefined);
    });

    it('should throw NotFoundException when service throws NotFoundException', async () => {
      jest.spyOn(priceHistoryService, 'getLatestPriceHistory').mockRejectedValue(
        new NotFoundException('Asset not found'),
      );

      await expect(controller.getLatestPriceHistory(assetId, limit)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPriceHistoryStats', () => {
    const assetId = 'asset-1';
    const startDate = '2024-01-01T00:00:00Z';
    const endDate = '2024-01-31T23:59:59Z';

    it('should return price history statistics', async () => {
      jest.spyOn(priceHistoryService, 'getPriceHistoryStats').mockResolvedValue(mockPriceHistoryStats);

      const result = await controller.getPriceHistoryStats(assetId, startDate, endDate);

      expect(result).toEqual(mockPriceHistoryStats);
      expect(priceHistoryService.getPriceHistoryStats).toHaveBeenCalledWith(
        assetId,
        new Date(startDate),
        new Date(endDate),
      );
    });

    it('should work without date parameters', async () => {
      jest.spyOn(priceHistoryService, 'getPriceHistoryStats').mockResolvedValue(mockPriceHistoryStats);

      const result = await controller.getPriceHistoryStats(assetId);

      expect(result).toEqual(mockPriceHistoryStats);
      expect(priceHistoryService.getPriceHistoryStats).toHaveBeenCalledWith(assetId, undefined, undefined);
    });

    it('should throw NotFoundException when service throws NotFoundException', async () => {
      jest.spyOn(priceHistoryService, 'getPriceHistoryStats').mockRejectedValue(
        new NotFoundException('Asset not found'),
      );

      await expect(controller.getPriceHistoryStats(assetId, startDate, endDate)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPriceHistoryByType', () => {
    const assetId = 'asset-1';
    const priceType = 'MARKET_DATA';

    it('should return price history by type', async () => {
      jest.spyOn(priceHistoryService, 'getPriceHistoryByType').mockResolvedValue([mockAssetPriceHistory]);

      const result = await controller.getPriceHistoryByType(assetId, priceType);

      expect(result).toEqual([mockAssetPriceHistory]);
      expect(priceHistoryService.getPriceHistoryByType).toHaveBeenCalledWith(assetId, priceType);
    });

    it('should throw NotFoundException when service throws NotFoundException', async () => {
      jest.spyOn(priceHistoryService, 'getPriceHistoryByType').mockRejectedValue(
        new NotFoundException('Asset not found'),
      );

      await expect(controller.getPriceHistoryByType(assetId, priceType)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPriceHistoryBySource', () => {
    const assetId = 'asset-1';
    const priceSource = 'MARKET_DATA_SERVICE';

    it('should return price history by source', async () => {
      jest.spyOn(priceHistoryService, 'getPriceHistoryBySource').mockResolvedValue([mockAssetPriceHistory]);

      const result = await controller.getPriceHistoryBySource(assetId, priceSource);

      expect(result).toEqual([mockAssetPriceHistory]);
      expect(priceHistoryService.getPriceHistoryBySource).toHaveBeenCalledWith(assetId, priceSource);
    });

    it('should throw NotFoundException when service throws NotFoundException', async () => {
      jest.spyOn(priceHistoryService, 'getPriceHistoryBySource').mockRejectedValue(
        new NotFoundException('Asset not found'),
      );

      await expect(controller.getPriceHistoryBySource(assetId, priceSource)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hasPriceHistory', () => {
    const assetId = 'asset-1';

    it('should return price history existence info', async () => {
      jest.spyOn(priceHistoryService, 'hasPriceHistory').mockResolvedValue(true);
      jest.spyOn(priceHistoryService, 'getPriceHistoryCount').mockResolvedValue(5);

      const result = await controller.hasPriceHistory(assetId);

      expect(result).toEqual({ hasPriceHistory: true, count: 5 });
      expect(priceHistoryService.hasPriceHistory).toHaveBeenCalledWith(assetId);
      expect(priceHistoryService.getPriceHistoryCount).toHaveBeenCalledWith(assetId);
    });

    it('should return false when no price history exists', async () => {
      jest.spyOn(priceHistoryService, 'hasPriceHistory').mockResolvedValue(false);
      jest.spyOn(priceHistoryService, 'getPriceHistoryCount').mockResolvedValue(0);

      const result = await controller.hasPriceHistory(assetId);

      expect(result).toEqual({ hasPriceHistory: false, count: 0 });
    });
  });

  describe('deleteOldPriceHistory', () => {
    it('should delete old price history records', async () => {
      jest.spyOn(priceHistoryService, 'deleteOldPriceHistory').mockResolvedValue(5);

      const result = await controller.deleteOldPriceHistory('asset-1', 365);

      expect(result).toEqual({
        deletedCount: 5,
        message: 'Successfully deleted 5 old price history records',
      });
      expect(priceHistoryService.deleteOldPriceHistory).toHaveBeenCalledWith('asset-1', 365);
    });

    it('should use default olderThanDays when not provided', async () => {
      jest.spyOn(priceHistoryService, 'deleteOldPriceHistory').mockResolvedValue(10);

      const result = await controller.deleteOldPriceHistory();

      expect(result).toEqual({
        deletedCount: 10,
        message: 'Successfully deleted 10 old price history records',
      });
      expect(priceHistoryService.deleteOldPriceHistory).toHaveBeenCalledWith(undefined, 365);
    });

    it('should delete records for all assets when assetId not provided', async () => {
      jest.spyOn(priceHistoryService, 'deleteOldPriceHistory').mockResolvedValue(15);

      const result = await controller.deleteOldPriceHistory(undefined, 180);

      expect(result).toEqual({
        deletedCount: 15,
        message: 'Successfully deleted 15 old price history records',
      });
      expect(priceHistoryService.deleteOldPriceHistory).toHaveBeenCalledWith(undefined, 180);
    });
  });
});
