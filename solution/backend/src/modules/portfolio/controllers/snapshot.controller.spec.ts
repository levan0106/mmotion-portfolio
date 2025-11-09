// SnapshotController Unit Tests for CR-006 Asset Snapshot System

import { Test, TestingModule } from '@nestjs/testing';
import { SnapshotController } from './snapshot.controller';
import { SnapshotService } from '../services/snapshot.service';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { CreateSnapshotDto, UpdateSnapshotDto } from '../dto/snapshot.dto';

describe('SnapshotController', () => {
  let controller: SnapshotController;
  let service: SnapshotService;

  const mockSnapshotService = {
    createSnapshot: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByPortfolio: jest.fn(),
    findByDateRange: jest.fn(),
    getStatistics: jest.fn(),
    recalculateSnapshot: jest.fn(),
    cleanupOldSnapshots: jest.fn(),
    createPortfolioSnapshots: jest.fn(),
    bulkRecalculateSnapshots: jest.fn(),
    getTimelineData: jest.fn(),
    getAggregatedTimelineData: jest.fn(),
    getLatestSnapshot: jest.fn(),
  };

  const mockSnapshot = {
    id: 'test-id',
    portfolioId: 'portfolio-id',
    assetId: 'asset-id',
    assetSymbol: 'TEST',
    snapshotDate: '2024-01-01',
    granularity: SnapshotGranularity.DAILY,
    quantity: 100,
    currentPrice: 10.50,
    currentValue: 1050,
    costBasis: 1000,
    avgCost: 10.00,
    realizedPl: 0,
    unrealizedPl: 50,
    totalPl: 50,
    allocationPercentage: 10.5,
    portfolioTotalValue: 10000,
    returnPercentage: 5.0,
    dailyReturn: 0.5,
    cumulativeReturn: 5.0,
    isActive: true,
    createdBy: 'test-user',
    notes: 'Test snapshot',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SnapshotController],
      providers: [
        {
          provide: SnapshotService,
          useValue: mockSnapshotService,
        },
      ],
    }).compile();

    controller = module.get<SnapshotController>(SnapshotController);
    service = module.get<SnapshotService>(SnapshotService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new snapshot', async () => {
      const createSnapshotDto: CreateSnapshotDto = {
        portfolioId: 'portfolio-id',
        assetId: 'asset-id',
        assetSymbol: 'TEST',
        snapshotDate: '2024-01-01',
        granularity: SnapshotGranularity.DAILY,
        quantity: 100,
        currentPrice: 10.50,
        currentValue: 1050,
        costBasis: 1000,
        avgCost: 10.00,
        realizedPl: 0,
        unrealizedPl: 50,
        totalPl: 50,
        allocationPercentage: 10.5,
        portfolioTotalValue: 10000,
        returnPercentage: 5.0,
        dailyReturn: 0.5,
        cumulativeReturn: 5.0,
        isActive: true,
        createdBy: 'test-user',
        notes: 'Test snapshot',
      };

      mockSnapshotService.createSnapshot.mockResolvedValue(mockSnapshot);

      const result = await controller.create(createSnapshotDto);

      expect(service.createSnapshot).toHaveBeenCalledWith(createSnapshotDto);
      expect(result).toEqual(mockSnapshot);
    });
  });

  describe('findAll', () => {
    it('should return all snapshots with query parameters', async () => {
      const query = {
        portfolioId: 'portfolio-id',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        granularity: SnapshotGranularity.DAILY,
        page: 1,
        limit: 10,
      };

      const snapshots = [mockSnapshot];
      mockSnapshotService.findAll.mockResolvedValue(snapshots);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(snapshots);
    });

    it('should return all snapshots without query parameters', async () => {
      const snapshots = [mockSnapshot];
      mockSnapshotService.findAll.mockResolvedValue(snapshots);

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(snapshots);
    });
  });

  describe('findOne', () => {
    it('should return a snapshot by id', async () => {
      const id = 'test-id';
      mockSnapshotService.findOne.mockResolvedValue(mockSnapshot);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockSnapshot);
    });

    it('should return null if snapshot not found', async () => {
      const id = 'non-existent-id';
      mockSnapshotService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(id);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a snapshot', async () => {
      const id = 'test-id';
      const updateSnapshotDto: UpdateSnapshotDto = {
        notes: 'Updated notes',
      };

      const updatedSnapshot = { ...mockSnapshot, ...updateSnapshotDto };
      mockSnapshotService.update.mockResolvedValue(updatedSnapshot);

      const result = await controller.update(id, updateSnapshotDto);

      expect(service.update).toHaveBeenCalledWith(id, updateSnapshotDto);
      expect(result).toEqual(updatedSnapshot);
    });
  });

  describe('remove', () => {
    it('should remove a snapshot', async () => {
      const id = 'test-id';
      const deletedSnapshot = { ...mockSnapshot, isActive: false };
      mockSnapshotService.remove.mockResolvedValue(deletedSnapshot);

      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(deletedSnapshot);
    });
  });

  describe('createPortfolioSnapshots', () => {
    it('should create snapshots for a portfolio', async () => {
      const portfolioId = 'portfolio-id';
      const query = {
        snapshotDate: '2024-01-01',
        granularity: SnapshotGranularity.DAILY,
        createdBy: 'test-user',
      };

      const snapshots = [mockSnapshot];
      mockSnapshotService.createPortfolioSnapshots.mockResolvedValue(snapshots);

      const result = await controller.createPortfolioSnapshots(portfolioId, query);

      expect(service.createPortfolioSnapshots).toHaveBeenCalledWith(
        portfolioId,
        query.snapshotDate,
        query.granularity,
        query.createdBy,
      );
      expect(result).toEqual(snapshots);
    });
  });

  describe('recalculate', () => {
    it('should recalculate a snapshot', async () => {
      const id = 'test-id';
      const recalculatedSnapshot = { ...mockSnapshot, currentValue: 1100 };
      mockSnapshotService.recalculateSnapshot.mockResolvedValue(recalculatedSnapshot);

      const result = await controller.recalculate(id);

      expect(service.recalculateSnapshot).toHaveBeenCalledWith(id);
      expect(result).toEqual(recalculatedSnapshot);
    });
  });

  describe('bulkRecalculate', () => {
    it('should bulk recalculate snapshots', async () => {
      const portfolioId = 'portfolio-id';
      const query = {
        snapshotDate: '2024-01-01',
      };

      const result = {
        recalculatedCount: 5,
        errors: [],
      };

      mockSnapshotService.bulkRecalculateSnapshots.mockResolvedValue(result);

      const response = await controller.bulkRecalculate(portfolioId, query);

      expect(service.bulkRecalculateSnapshots).toHaveBeenCalledWith(
        portfolioId,
        query.snapshotDate,
      );
      expect(response).toEqual(result);
    });
  });

  describe('getTimeline', () => {
    it('should get timeline data', async () => {
      const query = {
        portfolioId: 'portfolio-id',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        granularity: SnapshotGranularity.DAILY,
      };

      const timelineData = [mockSnapshot];
      mockSnapshotService.getTimelineData.mockResolvedValue(timelineData);

      const result = await controller.getTimeline(query);

      expect(service.getTimelineData).toHaveBeenCalledWith(query);
      expect(result).toEqual(timelineData);
    });
  });

  describe('getAggregatedTimeline', () => {
    it('should get aggregated timeline data', async () => {
      const portfolioId = 'portfolio-id';
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        granularity: SnapshotGranularity.DAILY,
      };

      const aggregatedData = [
        {
          snapshotDate: '2024-01-01',
          totalValue: 10000,
          totalPl: 500,
          assetCount: 5,
        },
      ];

      mockSnapshotService.getAggregatedTimelineData.mockResolvedValue(aggregatedData);

      const result = await controller.getAggregatedTimeline(portfolioId, query);

      expect(service.getAggregatedTimelineData).toHaveBeenCalledWith(
        portfolioId,
        query.startDate,
        query.endDate,
        query.granularity,
      );
      expect(result).toEqual(aggregatedData);
    });
  });

  describe('getLatest', () => {
    it('should get latest snapshot', async () => {
      const portfolioId = 'portfolio-id';
      const query = {
        assetId: 'asset-id',
        granularity: SnapshotGranularity.DAILY,
      };

      mockSnapshotService.getLatestSnapshot.mockResolvedValue(mockSnapshot);

      const result = await controller.getLatest(portfolioId, query);

      expect(service.getLatestSnapshot).toHaveBeenCalledWith(
        portfolioId,
        query.assetId,
        query.granularity,
      );
      expect(result).toEqual(mockSnapshot);
    });
  });

  describe('getStatistics', () => {
    it('should get portfolio statistics', async () => {
      const portfolioId = 'portfolio-id';
      const statistics = {
        totalSnapshots: 10,
        latestSnapshotDate: '2024-01-01',
        oldestSnapshotDate: '2023-01-01',
        totalValue: 100000,
        totalPl: 5000,
        averageReturn: 5.0,
      };

      mockSnapshotService.getStatistics.mockResolvedValue(statistics);

      const result = await controller.getStatistics(portfolioId);

      expect(service.getStatistics).toHaveBeenCalledWith(portfolioId);
      expect(result).toEqual(statistics);
    });
  });

  describe('cleanup', () => {
    it('should cleanup old snapshots', async () => {
      const query = {
        portfolioId: 'portfolio-id',
      };

      const cleanupResult = {
        deletedCount: 5,
        cutoffDate: '2023-01-01',
      };

      mockSnapshotService.cleanupOldSnapshots.mockResolvedValue(cleanupResult);

      const result = await controller.cleanup(query);

      expect(service.cleanupOldSnapshots).toHaveBeenCalledWith(query.portfolioId);
      expect(result).toEqual(cleanupResult);
    });
  });

  describe('mapToResponseDto', () => {
    it('should map snapshot to response DTO', async () => {
      const snapshot = {
        ...mockSnapshot,
        snapshotDate: new Date('2024-01-01'),
      };

      const result = controller['mapToResponseDto'](snapshot);

      expect(result).toEqual({
        id: snapshot.id,
        portfolioId: snapshot.portfolioId,
        assetId: snapshot.assetId,
        assetSymbol: snapshot.assetSymbol,
        snapshotDate: '2024-01-01',
        granularity: snapshot.granularity,
        quantity: snapshot.quantity,
        currentPrice: snapshot.currentPrice,
        currentValue: snapshot.currentValue,
        costBasis: snapshot.costBasis,
        avgCost: snapshot.avgCost,
        realizedPl: snapshot.realizedPl,
        unrealizedPl: snapshot.unrealizedPl,
        totalPl: snapshot.totalPl,
        allocationPercentage: snapshot.allocationPercentage,
        portfolioTotalValue: snapshot.portfolioTotalValue,
        returnPercentage: snapshot.returnPercentage,
        dailyReturn: snapshot.dailyReturn,
        cumulativeReturn: snapshot.cumulativeReturn,
        isActive: snapshot.isActive,
        createdBy: snapshot.createdBy,
        notes: snapshot.notes,
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.updatedAt,
      });
    });

    it('should handle string snapshotDate', async () => {
      const snapshot = {
        ...mockSnapshot,
        snapshotDate: '2024-01-01',
      };

      const result = controller['mapToResponseDto'](snapshot);

      expect(result.snapshotDate).toBe('2024-01-01');
    });
  });
});
