// AssetAllocationSnapshot Entity Unit Tests for CR-006 Asset Snapshot System

import { AssetAllocationSnapshot } from './asset-allocation-snapshot.entity';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';

describe('AssetAllocationSnapshot', () => {
  let entity: AssetAllocationSnapshot;

  beforeEach(() => {
    entity = new AssetAllocationSnapshot();
  });

  describe('Entity Creation', () => {
    it('should create an instance', () => {
      expect(entity).toBeInstanceOf(AssetAllocationSnapshot);
    });

    it('should have all required properties', () => {
      const properties = [
        'id',
        'portfolioId',
        'assetId',
        'assetSymbol',
        'snapshotDate',
        'granularity',
        'quantity',
        'currentPrice',
        'currentValue',
        'costBasis',
        'avgCost',
        'realizedPl',
        'unrealizedPl',
        'totalPl',
        'allocationPercentage',
        'portfolioTotalValue',
        'returnPercentage',
        'dailyReturn',
        'cumulativeReturn',
        'isActive',
        'createdBy',
        'notes',
        'createdAt',
        'updatedAt',
      ];

      properties.forEach(prop => {
        expect(entity).toHaveProperty(prop);
      });
    });
  });

  describe('Property Types', () => {
    it('should have correct property types', () => {
      entity.id = 'test-id';
      entity.portfolioId = 'portfolio-id';
      entity.assetId = 'asset-id';
      entity.assetSymbol = 'TEST';
      entity.snapshotDate = '2024-01-01';
      entity.granularity = SnapshotGranularity.DAILY;
      entity.quantity = 100;
      entity.currentPrice = 10.50;
      entity.currentValue = 1050;
      entity.costBasis = 1000;
      entity.avgCost = 10.00;
      entity.realizedPl = 0;
      entity.unrealizedPl = 50;
      entity.totalPl = 50;
      entity.allocationPercentage = 10.5;
      entity.portfolioTotalValue = 10000;
      entity.returnPercentage = 5.0;
      entity.dailyReturn = 0.5;
      entity.cumulativeReturn = 5.0;
      entity.isActive = true;
      entity.createdBy = 'test-user';
      entity.notes = 'Test snapshot';
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      expect(typeof entity.id).toBe('string');
      expect(typeof entity.portfolioId).toBe('string');
      expect(typeof entity.assetId).toBe('string');
      expect(typeof entity.assetSymbol).toBe('string');
      expect(typeof entity.snapshotDate).toBe('string');
      expect(typeof entity.granularity).toBe('string');
      expect(typeof entity.quantity).toBe('number');
      expect(typeof entity.currentPrice).toBe('number');
      expect(typeof entity.currentValue).toBe('number');
      expect(typeof entity.costBasis).toBe('number');
      expect(typeof entity.avgCost).toBe('number');
      expect(typeof entity.realizedPl).toBe('number');
      expect(typeof entity.unrealizedPl).toBe('number');
      expect(typeof entity.totalPl).toBe('number');
      expect(typeof entity.allocationPercentage).toBe('number');
      expect(typeof entity.portfolioTotalValue).toBe('number');
      expect(typeof entity.returnPercentage).toBe('number');
      expect(typeof entity.dailyReturn).toBe('number');
      expect(typeof entity.cumulativeReturn).toBe('number');
      expect(typeof entity.isActive).toBe('boolean');
      expect(typeof entity.createdBy).toBe('string');
      expect(typeof entity.notes).toBe('string');
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Default Values', () => {
    it('should have correct default values', () => {
      expect(entity.quantity).toBe(0);
      expect(entity.currentPrice).toBe(0);
      expect(entity.currentValue).toBe(0);
      expect(entity.costBasis).toBe(0);
      expect(entity.avgCost).toBe(0);
      expect(entity.realizedPl).toBe(0);
      expect(entity.unrealizedPl).toBe(0);
      expect(entity.totalPl).toBe(0);
      expect(entity.allocationPercentage).toBe(0);
      expect(entity.portfolioTotalValue).toBe(0);
      expect(entity.returnPercentage).toBe(0);
      expect(entity.dailyReturn).toBe(0);
      expect(entity.cumulativeReturn).toBe(0);
      expect(entity.isActive).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should accept valid granularity values', () => {
      entity.granularity = SnapshotGranularity.DAILY;
      expect(entity.granularity).toBe(SnapshotGranularity.DAILY);

      entity.granularity = SnapshotGranularity.WEEKLY;
      expect(entity.granularity).toBe(SnapshotGranularity.WEEKLY);

      entity.granularity = SnapshotGranularity.MONTHLY;
      expect(entity.granularity).toBe(SnapshotGranularity.MONTHLY);
    });

    it('should accept valid numeric values', () => {
      entity.quantity = 100;
      entity.currentPrice = 10.50;
      entity.currentValue = 1050;
      entity.costBasis = 1000;
      entity.avgCost = 10.00;
      entity.realizedPl = 0;
      entity.unrealizedPl = 50;
      entity.totalPl = 50;
      entity.allocationPercentage = 10.5;
      entity.portfolioTotalValue = 10000;
      entity.returnPercentage = 5.0;
      entity.dailyReturn = 0.5;
      entity.cumulativeReturn = 5.0;

      expect(entity.quantity).toBe(100);
      expect(entity.currentPrice).toBe(10.50);
      expect(entity.currentValue).toBe(1050);
      expect(entity.costBasis).toBe(1000);
      expect(entity.avgCost).toBe(10.00);
      expect(entity.realizedPl).toBe(0);
      expect(entity.unrealizedPl).toBe(50);
      expect(entity.totalPl).toBe(50);
      expect(entity.allocationPercentage).toBe(10.5);
      expect(entity.portfolioTotalValue).toBe(10000);
      expect(entity.returnPercentage).toBe(5.0);
      expect(entity.dailyReturn).toBe(0.5);
      expect(entity.cumulativeReturn).toBe(5.0);
    });

    it('should accept valid boolean values', () => {
      entity.isActive = true;
      expect(entity.isActive).toBe(true);

      entity.isActive = false;
      expect(entity.isActive).toBe(false);
    });

    it('should accept valid string values', () => {
      entity.id = 'test-id';
      entity.portfolioId = 'portfolio-id';
      entity.assetId = 'asset-id';
      entity.assetSymbol = 'TEST';
      entity.snapshotDate = '2024-01-01';
      entity.createdBy = 'test-user';
      entity.notes = 'Test snapshot';

      expect(entity.id).toBe('test-id');
      expect(entity.portfolioId).toBe('portfolio-id');
      expect(entity.assetId).toBe('asset-id');
      expect(entity.assetSymbol).toBe('TEST');
      expect(entity.snapshotDate).toBe('2024-01-01');
      expect(entity.createdBy).toBe('test-user');
      expect(entity.notes).toBe('Test snapshot');
    });
  });

  describe('Date Handling', () => {
    it('should handle date strings', () => {
      entity.snapshotDate = '2024-01-01';
      expect(entity.snapshotDate).toBe('2024-01-01');
    });

    it('should handle date objects', () => {
      const date = new Date('2024-01-01');
      entity.createdAt = date;
      entity.updatedAt = date;

      expect(entity.createdAt).toBe(date);
      expect(entity.updatedAt).toBe(date);
    });
  });

  describe('Optional Properties', () => {
    it('should handle optional string properties', () => {
      entity.createdBy = undefined;
      entity.notes = undefined;

      expect(entity.createdBy).toBeUndefined();
      expect(entity.notes).toBeUndefined();
    });
  });
});
