// Snapshot DTOs Unit Tests for CR-006 Asset Snapshot System

import { CreateSnapshotDto, UpdateSnapshotDto, SnapshotQueryDto } from './snapshot.dto';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';

describe('Snapshot DTOs', () => {
  describe('CreateSnapshotDto', () => {
    it('should create a valid CreateSnapshotDto', () => {
      const dto: CreateSnapshotDto = {
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

      expect(dto).toBeDefined();
      expect(dto.portfolioId).toBe('portfolio-id');
      expect(dto.assetId).toBe('asset-id');
      expect(dto.assetSymbol).toBe('TEST');
      expect(dto.snapshotDate).toBe('2024-01-01');
      expect(dto.granularity).toBe(SnapshotGranularity.DAILY);
      expect(dto.quantity).toBe(100);
      expect(dto.currentPrice).toBe(10.50);
      expect(dto.currentValue).toBe(1050);
      expect(dto.costBasis).toBe(1000);
      expect(dto.avgCost).toBe(10.00);
      expect(dto.realizedPl).toBe(0);
      expect(dto.unrealizedPl).toBe(50);
      expect(dto.totalPl).toBe(50);
      expect(dto.allocationPercentage).toBe(10.5);
      expect(dto.portfolioTotalValue).toBe(10000);
      expect(dto.returnPercentage).toBe(5.0);
      expect(dto.dailyReturn).toBe(0.5);
      expect(dto.cumulativeReturn).toBe(5.0);
      expect(dto.isActive).toBe(true);
      expect(dto.createdBy).toBe('test-user');
      expect(dto.notes).toBe('Test snapshot');
    });

    it('should handle optional properties', () => {
      const dto: CreateSnapshotDto = {
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
      };

      expect(dto.createdBy).toBeUndefined();
      expect(dto.notes).toBeUndefined();
    });
  });

  describe('UpdateSnapshotDto', () => {
    it('should create a valid UpdateSnapshotDto', () => {
      const dto: UpdateSnapshotDto = {
        quantity: 150,
        currentPrice: 11.00,
        currentValue: 1650,
        costBasis: 1500,
        avgCost: 10.00,
        realizedPl: 0,
        unrealizedPl: 150,
        totalPl: 150,
        allocationPercentage: 15.0,
        portfolioTotalValue: 11000,
        returnPercentage: 10.0,
        dailyReturn: 1.0,
        cumulativeReturn: 10.0,
        isActive: true,
        notes: 'Updated snapshot',
      };

      expect(dto).toBeDefined();
      expect(dto.quantity).toBe(150);
      expect(dto.currentPrice).toBe(11.00);
      expect(dto.currentValue).toBe(1650);
      expect(dto.costBasis).toBe(1500);
      expect(dto.avgCost).toBe(10.00);
      expect(dto.realizedPl).toBe(0);
      expect(dto.unrealizedPl).toBe(150);
      expect(dto.totalPl).toBe(150);
      expect(dto.allocationPercentage).toBe(15.0);
      expect(dto.portfolioTotalValue).toBe(11000);
      expect(dto.returnPercentage).toBe(10.0);
      expect(dto.dailyReturn).toBe(1.0);
      expect(dto.cumulativeReturn).toBe(10.0);
      expect(dto.isActive).toBe(true);
      expect(dto.notes).toBe('Updated snapshot');
    });

    it('should handle partial updates', () => {
      const dto: UpdateSnapshotDto = {
        notes: 'Updated notes only',
      };

      expect(dto.notes).toBe('Updated notes only');
      expect(dto.quantity).toBeUndefined();
      expect(dto.currentPrice).toBeUndefined();
      expect(dto.currentValue).toBeUndefined();
    });
  });

  describe('SnapshotQueryDto', () => {
    it('should create a valid SnapshotQueryDto', () => {
      const dto: SnapshotQueryDto = {
        portfolioId: 'portfolio-id',
        assetId: 'asset-id',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        granularity: SnapshotGranularity.DAILY,
        isActive: true,
        page: 1,
        limit: 10,
        sortBy: 'snapshotDate',
        sortOrder: 'DESC',
      };

      expect(dto).toBeDefined();
      expect(dto.portfolioId).toBe('portfolio-id');
      expect(dto.assetId).toBe('asset-id');
      expect(dto.startDate).toBe('2024-01-01');
      expect(dto.endDate).toBe('2024-01-31');
      expect(dto.granularity).toBe(SnapshotGranularity.DAILY);
      expect(dto.isActive).toBe(true);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
      expect(dto.sortBy).toBe('snapshotDate');
      expect(dto.sortOrder).toBe('DESC');
    });

    it('should handle optional properties', () => {
      const dto: SnapshotQueryDto = {
        portfolioId: 'portfolio-id',
      };

      expect(dto.portfolioId).toBe('portfolio-id');
      expect(dto.assetId).toBeUndefined();
      expect(dto.startDate).toBeUndefined();
      expect(dto.endDate).toBeUndefined();
      expect(dto.granularity).toBeUndefined();
      expect(dto.isActive).toBeUndefined();
      expect(dto.page).toBeUndefined();
      expect(dto.limit).toBeUndefined();
      expect(dto.sortBy).toBeUndefined();
      expect(dto.sortOrder).toBeUndefined();
    });

    it('should handle pagination', () => {
      const dto: SnapshotQueryDto = {
        portfolioId: 'portfolio-id',
        page: 2,
        limit: 20,
      };

      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(20);
    });

    it('should handle sorting', () => {
      const dto: SnapshotQueryDto = {
        portfolioId: 'portfolio-id',
        sortBy: 'currentValue',
        sortOrder: 'ASC',
      };

      expect(dto.sortBy).toBe('currentValue');
      expect(dto.sortOrder).toBe('ASC');
    });
  });

  describe('Validation', () => {
    it('should accept valid granularity values', () => {
      const dto: CreateSnapshotDto = {
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
      };

      expect(dto.granularity).toBe(SnapshotGranularity.DAILY);
    });

    it('should accept valid numeric values', () => {
      const dto: CreateSnapshotDto = {
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
      };

      expect(typeof dto.quantity).toBe('number');
      expect(typeof dto.currentPrice).toBe('number');
      expect(typeof dto.currentValue).toBe('number');
      expect(typeof dto.costBasis).toBe('number');
      expect(typeof dto.avgCost).toBe('number');
      expect(typeof dto.realizedPl).toBe('number');
      expect(typeof dto.unrealizedPl).toBe('number');
      expect(typeof dto.totalPl).toBe('number');
      expect(typeof dto.allocationPercentage).toBe('number');
      expect(typeof dto.portfolioTotalValue).toBe('number');
      expect(typeof dto.returnPercentage).toBe('number');
      expect(typeof dto.dailyReturn).toBe('number');
      expect(typeof dto.cumulativeReturn).toBe('number');
    });

    it('should accept valid boolean values', () => {
      const dto: CreateSnapshotDto = {
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
      };

      expect(typeof dto.isActive).toBe('boolean');
    });

    it('should accept valid string values', () => {
      const dto: CreateSnapshotDto = {
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
      };

      expect(typeof dto.portfolioId).toBe('string');
      expect(typeof dto.assetId).toBe('string');
      expect(typeof dto.assetSymbol).toBe('string');
      expect(typeof dto.snapshotDate).toBe('string');
      expect(typeof dto.granularity).toBe('string');
    });
  });
});
