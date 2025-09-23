import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TWRCalculationService } from '../../../src/modules/portfolio/services/twr-calculation.service';
import { PortfolioSnapshot } from '../../../src/modules/portfolio/entities/portfolio-snapshot.entity';
import { AssetAllocationSnapshot } from '../../../src/modules/portfolio/entities/asset-allocation-snapshot.entity';
import { SnapshotGranularity } from '../../../src/modules/portfolio/enums/snapshot-granularity.enum';

describe('TWRCalculationService', () => {
  let service: TWRCalculationService;
  let portfolioSnapshotRepo: Repository<PortfolioSnapshot>;
  let assetSnapshotRepo: Repository<AssetAllocationSnapshot>;

  const mockPortfolioSnapshotRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockAssetSnapshotRepo = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TWRCalculationService,
        {
          provide: getRepositoryToken(PortfolioSnapshot),
          useValue: mockPortfolioSnapshotRepo,
        },
        {
          provide: getRepositoryToken(AssetAllocationSnapshot),
          useValue: mockAssetSnapshotRepo,
        },
      ],
    }).compile();

    service = module.get<TWRCalculationService>(TWRCalculationService);
    portfolioSnapshotRepo = module.get<Repository<PortfolioSnapshot>>(
      getRepositoryToken(PortfolioSnapshot),
    );
    assetSnapshotRepo = module.get<Repository<AssetAllocationSnapshot>>(
      getRepositoryToken(AssetAllocationSnapshot),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePortfolioTWR', () => {
    it('should calculate portfolio TWR for different periods', async () => {
      const portfolioId = 'test-portfolio-id';
      const snapshotDate = new Date('2024-01-31');
      const granularity = SnapshotGranularity.DAILY;

      // Mock query builder
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            snapshotDate: new Date('2024-01-01'),
            totalPortfolioValue: 100000,
          },
          {
            snapshotDate: new Date('2024-01-15'),
            totalPortfolioValue: 105000,
          },
          {
            snapshotDate: new Date('2024-01-31'),
            totalPortfolioValue: 110000,
          },
        ]),
      };

      mockPortfolioSnapshotRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.calculatePortfolioTWR({
        portfolioId,
        snapshotDate,
        granularity,
      });

      expect(result).toBeDefined();
      expect(result.twr1D).toBeDefined();
      expect(result.twr1W).toBeDefined();
      expect(result.twr1M).toBeDefined();
      expect(result.twr3M).toBeDefined();
      expect(result.twr6M).toBeDefined();
      expect(result.twr1Y).toBeDefined();
      expect(result.twrYTD).toBeDefined();
    });

    it('should handle insufficient data gracefully', async () => {
      const portfolioId = 'test-portfolio-id';
      const snapshotDate = new Date('2024-01-31');
      const granularity = SnapshotGranularity.DAILY;

      // Mock query builder with insufficient data
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockPortfolioSnapshotRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.calculatePortfolioTWR({
        portfolioId,
        snapshotDate,
        granularity,
      });

      expect(result).toBeDefined();
      expect(result.twr1D).toBe(0);
      expect(result.twr1W).toBe(0);
      expect(result.twr1M).toBe(0);
    });
  });

  describe('calculateAssetTWR', () => {
    it('should calculate asset TWR for different periods', async () => {
      const portfolioId = 'test-portfolio-id';
      const assetId = 'test-asset-id';
      const snapshotDate = new Date('2024-01-31');
      const granularity = SnapshotGranularity.DAILY;

      // Mock query builder
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            snapshotDate: new Date('2024-01-01'),
            currentValue: 10000,
          },
          {
            snapshotDate: new Date('2024-01-15'),
            currentValue: 10500,
          },
          {
            snapshotDate: new Date('2024-01-31'),
            currentValue: 11000,
          },
        ]),
      };

      mockAssetSnapshotRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.calculateAssetTWR(
        portfolioId,
        assetId,
        snapshotDate,
        granularity
      );

      expect(result).toBeDefined();
      expect(result.twr1D).toBeDefined();
      expect(result.twr1W).toBeDefined();
      expect(result.twr1M).toBeDefined();
      expect(result.twr3M).toBeDefined();
      expect(result.twr6M).toBeDefined();
      expect(result.twr1Y).toBeDefined();
      expect(result.twrYTD).toBeDefined();
    });
  });

  describe('calculateAssetGroupTWR', () => {
    it('should calculate asset group TWR for different periods', async () => {
      const portfolioId = 'test-portfolio-id';
      const assetType = 'Stock';
      const snapshotDate = new Date('2024-01-31');
      const granularity = SnapshotGranularity.DAILY;

      // Mock query builder
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            snapshotDate: new Date('2024-01-01'),
            currentValue: 50000,
          },
          {
            snapshotDate: new Date('2024-01-15'),
            currentValue: 52500,
          },
          {
            snapshotDate: new Date('2024-01-31'),
            currentValue: 55000,
          },
        ]),
      };

      mockAssetSnapshotRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.calculateAssetGroupTWR(
        portfolioId,
        assetType,
        snapshotDate,
        granularity
      );

      expect(result).toBeDefined();
      expect(result.twr1D).toBeDefined();
      expect(result.twr1W).toBeDefined();
      expect(result.twr1M).toBeDefined();
      expect(result.twr3M).toBeDefined();
      expect(result.twr6M).toBeDefined();
      expect(result.twr1Y).toBeDefined();
      expect(result.twrYTD).toBeDefined();
    });
  });

  describe('TWR calculation logic', () => {
    it('should calculate TWR correctly from portfolio snapshots', () => {
      const snapshots = [
        {
          snapshotDate: new Date('2024-01-01'),
          totalPortfolioValue: 100000,
        },
        {
          snapshotDate: new Date('2024-01-15'),
          totalPortfolioValue: 105000,
        },
        {
          snapshotDate: new Date('2024-01-31'),
          totalPortfolioValue: 110000,
        },
      ] as PortfolioSnapshot[];

      // Access private method through any type
      const result = (service as any).calculateTWRFromSnapshots(snapshots);

      // Expected TWR: (105000/100000) * (110000/105000) - 1 = 0.10 = 10%
      expect(result).toBeCloseTo(10, 2);
    });

    it('should handle zero values in TWR calculation', () => {
      const snapshots = [
        {
          snapshotDate: new Date('2024-01-01'),
          totalPortfolioValue: 0,
        },
        {
          snapshotDate: new Date('2024-01-15'),
          totalPortfolioValue: 105000,
        },
      ] as PortfolioSnapshot[];

      const result = (service as any).calculateTWRFromSnapshots(snapshots);

      expect(result).toBe(0);
    });

    it('should handle insufficient snapshots', () => {
      const snapshots = [
        {
          snapshotDate: new Date('2024-01-01'),
          totalPortfolioValue: 100000,
        },
      ] as PortfolioSnapshot[];

      const result = (service as any).calculateTWRFromSnapshots(snapshots);

      expect(result).toBe(0);
    });
  });
});
