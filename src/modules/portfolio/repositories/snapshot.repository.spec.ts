// SnapshotRepository Unit Tests for CR-006 Asset Snapshot System

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SnapshotRepository } from './snapshot.repository';
import { AssetAllocationSnapshot } from '../entities/asset-allocation-snapshot.entity';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';

describe('SnapshotRepository', () => {
  let repository: SnapshotRepository;
  let typeOrmRepository: Repository<AssetAllocationSnapshot>;

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

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
    getRawMany: jest.fn(),
    execute: jest.fn(),
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
      providers: [
        SnapshotRepository,
        {
          provide: getRepositoryToken(AssetAllocationSnapshot),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<SnapshotRepository>(SnapshotRepository);
    typeOrmRepository = module.get<Repository<AssetAllocationSnapshot>>(
      getRepositoryToken(AssetAllocationSnapshot),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSnapshot', () => {
    it('should create a new snapshot', async () => {
      const snapshotData = {
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

      mockRepository.create.mockReturnValue(mockSnapshot);
      mockRepository.save.mockResolvedValue(mockSnapshot);

      const result = await repository.createSnapshot(snapshotData);

      expect(mockRepository.create).toHaveBeenCalledWith(snapshotData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockSnapshot);
      expect(result).toEqual(mockSnapshot);
    });
  });

  describe('findAllSnapshots', () => {
    it('should find all snapshots with filters', async () => {
      const filters = {
        portfolioId: 'portfolio-id',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        granularity: SnapshotGranularity.DAILY,
        page: 1,
        limit: 10,
      };

      const snapshots = [mockSnapshot];
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(snapshots);

      const result = await repository.findAllSnapshots(filters);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('snapshot');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('snapshot.portfolioId = :portfolioId', { portfolioId: filters.portfolioId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('snapshot.snapshotDate >= :startDate', { startDate: filters.startDate });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('snapshot.snapshotDate <= :endDate', { endDate: filters.endDate });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('snapshot.granularity = :granularity', { granularity: filters.granularity });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('snapshot.snapshotDate', 'DESC');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(filters.limit);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith((filters.page - 1) * filters.limit);
      expect(result).toEqual(snapshots);
    });

    it('should find all snapshots without filters', async () => {
      const snapshots = [mockSnapshot];
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(snapshots);

      const result = await repository.findAllSnapshots({});

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('snapshot');
      expect(result).toEqual(snapshots);
    });
  });

  describe('findSnapshotById', () => {
    it('should find snapshot by id', async () => {
      const id = 'test-id';
      mockRepository.findOne.mockResolvedValue(mockSnapshot);

      const result = await repository.findSnapshotById(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(mockSnapshot);
    });

    it('should return null if snapshot not found', async () => {
      const id = 'non-existent-id';
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findSnapshotById(id);

      expect(result).toBeNull();
    });
  });

  describe('updateSnapshot', () => {
    it('should update a snapshot', async () => {
      const id = 'test-id';
      const updateData = { notes: 'Updated notes' };
      const updatedSnapshot = { ...mockSnapshot, ...updateData };

      mockRepository.findOne.mockResolvedValue(mockSnapshot);
      mockRepository.save.mockResolvedValue(updatedSnapshot);

      const result = await repository.updateSnapshot(id, updateData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(mockRepository.save).toHaveBeenCalledWith({ ...mockSnapshot, ...updateData });
      expect(result).toEqual(updatedSnapshot);
    });

    it('should return null if snapshot not found', async () => {
      const id = 'non-existent-id';
      const updateData = { notes: 'Updated notes' };

      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.updateSnapshot(id, updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteSnapshot', () => {
    it('should soft delete a snapshot', async () => {
      const id = 'test-id';
      const deletedSnapshot = { ...mockSnapshot, isActive: false };

      mockRepository.findOne.mockResolvedValue(mockSnapshot);
      mockRepository.save.mockResolvedValue(deletedSnapshot);

      const result = await repository.deleteSnapshot(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(mockRepository.save).toHaveBeenCalledWith({ ...mockSnapshot, isActive: false });
      expect(result).toEqual(deletedSnapshot);
    });

    it('should return null if snapshot not found', async () => {
      const id = 'non-existent-id';

      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.deleteSnapshot(id);

      expect(result).toBeNull();
    });
  });

  describe('findSnapshotsByPortfolio', () => {
    it('should find snapshots by portfolio id', async () => {
      const portfolioId = 'portfolio-id';
      const snapshots = [mockSnapshot];

      mockRepository.find.mockResolvedValue(snapshots);

      const result = await repository.findSnapshotsByPortfolio(portfolioId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { portfolioId, isActive: true },
        order: { snapshotDate: 'DESC' },
      });
      expect(result).toEqual(snapshots);
    });
  });

  describe('findSnapshotsByDateRange', () => {
    it('should find snapshots by date range', async () => {
      const portfolioId = 'portfolio-id';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const snapshots = [mockSnapshot];

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(snapshots);

      const result = await repository.findSnapshotsByDateRange(portfolioId, startDate, endDate);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('snapshot');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('snapshot.portfolioId = :portfolioId', { portfolioId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('snapshot.snapshotDate >= :startDate', { startDate });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('snapshot.snapshotDate <= :endDate', { endDate });
      expect(result).toEqual(snapshots);
    });
  });

  describe('findSnapshotsByAsset', () => {
    it('should find snapshots by asset id', async () => {
      const assetId = 'asset-id';
      const snapshots = [mockSnapshot];

      mockRepository.find.mockResolvedValue(snapshots);

      const result = await repository.findSnapshotsByAsset(assetId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { assetId, isActive: true },
        order: { snapshotDate: 'DESC' },
      });
      expect(result).toEqual(snapshots);
    });
  });

  describe('findLatestSnapshot', () => {
    it('should find latest snapshot for portfolio', async () => {
      const portfolioId = 'portfolio-id';
      const assetId = 'asset-id';

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(mockSnapshot);

      const result = await repository.findLatestSnapshot(portfolioId, assetId);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('snapshot');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('snapshot.portfolioId = :portfolioId', { portfolioId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('snapshot.assetId = :assetId', { assetId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('snapshot.isActive = :isActive', { isActive: true });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('snapshot.snapshotDate', 'DESC');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSnapshot);
    });
  });

  describe('getSnapshotCount', () => {
    it('should get snapshot count with filters', async () => {
      const filters = {
        portfolioId: 'portfolio-id',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getCount.mockResolvedValue(5);

      const result = await repository.getSnapshotCount(filters);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('snapshot');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('snapshot.portfolioId = :portfolioId', { portfolioId: filters.portfolioId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('snapshot.snapshotDate >= :startDate', { startDate: filters.startDate });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('snapshot.snapshotDate <= :endDate', { endDate: filters.endDate });
      expect(result).toBe(5);
    });
  });

  describe('getSnapshotStatistics', () => {
    it('should get snapshot statistics', async () => {
      const portfolioId = 'portfolio-id';
      const statistics = {
        totalSnapshots: 10,
        latestSnapshotDate: '2024-01-01',
        oldestSnapshotDate: '2023-01-01',
        totalValue: 100000,
        totalPl: 5000,
        averageReturn: 5.0,
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawMany.mockResolvedValue([statistics]);

      const result = await repository.getSnapshotStatistics(portfolioId);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('snapshot');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('snapshot.portfolioId = :portfolioId', { portfolioId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('snapshot.isActive = :isActive', { isActive: true });
      expect(result).toEqual(statistics);
    });
  });

  describe('updateMany', () => {
    it('should update multiple snapshots', async () => {
      const criteria = { portfolioId: 'portfolio-id' };
      const updateData = { isActive: false };
      const updateResult = { affected: 5 };

      mockRepository.update.mockResolvedValue(updateResult);

      const result = await repository.updateMany(criteria, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(criteria, updateData);
      expect(result).toEqual(updateResult);
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple snapshots', async () => {
      const criteria = { portfolioId: 'portfolio-id' };
      const deleteResult = { affected: 5 };

      mockRepository.delete.mockResolvedValue(deleteResult);

      const result = await repository.deleteMany(criteria);

      expect(mockRepository.delete).toHaveBeenCalledWith(criteria);
      expect(result).toEqual(deleteResult);
    });
  });

  describe('exists', () => {
    it('should check if snapshot exists', async () => {
      const criteria = { id: 'test-id' };

      mockRepository.count.mockResolvedValue(1);

      const result = await repository.exists(criteria);

      expect(mockRepository.count).toHaveBeenCalledWith({ where: criteria });
      expect(result).toBe(true);
    });

    it('should return false if snapshot does not exist', async () => {
      const criteria = { id: 'non-existent-id' };

      mockRepository.count.mockResolvedValue(0);

      const result = await repository.exists(criteria);

      expect(result).toBe(false);
    });
  });
});
