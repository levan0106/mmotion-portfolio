// SnapshotService Unit Tests for CR-006 Asset Snapshot System

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SnapshotService } from './snapshot.service';
import { AssetAllocationSnapshot } from '../entities/asset-allocation-snapshot.entity';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { CreateSnapshotDto } from '../dto/snapshot.dto';

describe('SnapshotService', () => {
  let service: SnapshotService;
  let repository: Repository<AssetAllocationSnapshot>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAssetAllocationSnapshot = {
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
      providers: [
        SnapshotService,
        {
          provide: getRepositoryToken(AssetAllocationSnapshot),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SnapshotService>(SnapshotService);
    repository = module.get<Repository<AssetAllocationSnapshot>>(
      getRepositoryToken(AssetAllocationSnapshot),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSnapshot', () => {
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

      mockRepository.create.mockReturnValue(mockAssetAllocationSnapshot);
      mockRepository.save.mockResolvedValue(mockAssetAllocationSnapshot);

      const result = await service.createSnapshot(createSnapshotDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createSnapshotDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockAssetAllocationSnapshot);
      expect(result).toEqual(mockAssetAllocationSnapshot);
    });

    it('should throw error if creation fails', async () => {
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

      mockRepository.create.mockReturnValue(mockAssetAllocationSnapshot);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createSnapshot(createSnapshotDto)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all snapshots', async () => {
      const snapshots = [mockAssetAllocationSnapshot];
      mockRepository.find.mockResolvedValue(snapshots);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(snapshots);
    });

    it('should return empty array if no snapshots found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a snapshot by id', async () => {
      const id = 'test-id';
      mockRepository.findOne.mockResolvedValue(mockAssetAllocationSnapshot);

      const result = await service.findOne(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(mockAssetAllocationSnapshot);
    });

    it('should return null if snapshot not found', async () => {
      const id = 'non-existent-id';
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(id);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a snapshot', async () => {
      const id = 'test-id';
      const updateData = { notes: 'Updated notes' };
      const updatedSnapshot = { ...mockAssetAllocationSnapshot, ...updateData };

      mockRepository.findOne.mockResolvedValue(mockAssetAllocationSnapshot);
      mockRepository.save.mockResolvedValue(updatedSnapshot);

      const result = await service.update(id, updateData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedSnapshot);
      expect(result).toEqual(updatedSnapshot);
    });

    it('should throw error if snapshot not found', async () => {
      const id = 'non-existent-id';
      const updateData = { notes: 'Updated notes' };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(id, updateData)).rejects.toThrow('Snapshot not found');
    });
  });

  describe('remove', () => {
    it('should soft delete a snapshot', async () => {
      const id = 'test-id';
      const deletedSnapshot = { ...mockAssetAllocationSnapshot, isActive: false };

      mockRepository.findOne.mockResolvedValue(mockAssetAllocationSnapshot);
      mockRepository.save.mockResolvedValue(deletedSnapshot);

      const result = await service.remove(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(mockRepository.save).toHaveBeenCalledWith({ ...mockAssetAllocationSnapshot, isActive: false });
      expect(result).toEqual(deletedSnapshot);
    });

    it('should throw error if snapshot not found', async () => {
      const id = 'non-existent-id';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow('Snapshot not found');
    });
  });

  describe('findByPortfolio', () => {
    it('should return snapshots by portfolio id', async () => {
      const portfolioId = 'portfolio-id';
      const snapshots = [mockAssetAllocationSnapshot];

      mockRepository.find.mockResolvedValue(snapshots);

      const result = await service.findByPortfolio(portfolioId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { portfolioId, isActive: true },
        order: { snapshotDate: 'DESC' },
      });
      expect(result).toEqual(snapshots);
    });
  });

  describe('findByDateRange', () => {
    it('should return snapshots within date range', async () => {
      const portfolioId = 'portfolio-id';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const snapshots = [mockAssetAllocationSnapshot];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(snapshots),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByDateRange(portfolioId, startDate, endDate);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('snapshot');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('snapshot.portfolioId = :portfolioId', { portfolioId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('snapshot.snapshotDate >= :startDate', { startDate });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('snapshot.snapshotDate <= :endDate', { endDate });
      expect(result).toEqual(snapshots);
    });
  });

  describe('getStatistics', () => {
    it('should return portfolio statistics', async () => {
      const portfolioId = 'portfolio-id';
      const snapshots = [mockAssetAllocationSnapshot];

      mockRepository.find.mockResolvedValue(snapshots);

      const result = await service.getStatistics(portfolioId);

      expect(result).toEqual({
        totalSnapshots: 1,
        latestSnapshotDate: mockAssetAllocationSnapshot.snapshotDate,
        oldestSnapshotDate: mockAssetAllocationSnapshot.snapshotDate,
        totalValue: mockAssetAllocationSnapshot.portfolioTotalValue,
        totalPl: mockAssetAllocationSnapshot.totalPl,
        averageReturn: mockAssetAllocationSnapshot.returnPercentage,
      });
    });
  });

  describe('recalculateSnapshot', () => {
    it('should recalculate snapshot values', async () => {
      const id = 'test-id';
      const recalculatedSnapshot = {
        ...mockAssetAllocationSnapshot,
        currentValue: 1100,
        unrealizedPl: 100,
        totalPl: 100,
        returnPercentage: 10.0,
      };

      mockRepository.findOne.mockResolvedValue(mockAssetAllocationSnapshot);
      mockRepository.save.mockResolvedValue(recalculatedSnapshot);

      const result = await service.recalculateSnapshot(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(recalculatedSnapshot);
    });

    it('should throw error if snapshot not found', async () => {
      const id = 'non-existent-id';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.recalculateSnapshot(id)).rejects.toThrow('Snapshot not found');
    });
  });

  describe('cleanupOldSnapshots', () => {
    it('should cleanup old snapshots', async () => {
      const portfolioId = 'portfolio-id';
      const cutoffDate = '2023-01-01';
      const deletedCount = 5;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: deletedCount }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.cleanupOldSnapshots(portfolioId, cutoffDate);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('snapshot');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('snapshot.portfolioId = :portfolioId', { portfolioId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('snapshot.snapshotDate < :cutoffDate', { cutoffDate });
      expect(result).toEqual({ deletedCount });
    });
  });
});
