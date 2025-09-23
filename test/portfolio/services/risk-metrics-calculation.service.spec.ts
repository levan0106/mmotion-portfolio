import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskMetricsCalculationService } from '../../../src/modules/portfolio/services/risk-metrics-calculation.service';
import { PortfolioSnapshot } from '../../../src/modules/portfolio/entities/portfolio-snapshot.entity';
import { AssetAllocationSnapshot } from '../../../src/modules/portfolio/entities/asset-allocation-snapshot.entity';
import { SnapshotGranularity } from '../../../src/modules/portfolio/enums/snapshot-granularity.enum';

describe('RiskMetricsCalculationService', () => {
  let service: RiskMetricsCalculationService;
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
        RiskMetricsCalculationService,
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

    service = module.get<RiskMetricsCalculationService>(RiskMetricsCalculationService);
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

  describe('calculatePortfolioRiskMetrics', () => {
    it('should calculate portfolio risk metrics for different periods', async () => {
      const portfolioId = 'test-portfolio-id';
      const snapshotDate = new Date('2024-01-31');
      const granularity = SnapshotGranularity.DAILY;
      const riskFreeRate = 0.02;

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
            snapshotDate: new Date('2024-01-02'),
            totalPortfolioValue: 101000,
          },
          {
            snapshotDate: new Date('2024-01-03'),
            totalPortfolioValue: 99000,
          },
          {
            snapshotDate: new Date('2024-01-04'),
            totalPortfolioValue: 102000,
          },
          {
            snapshotDate: new Date('2024-01-05'),
            totalPortfolioValue: 103000,
          },
        ]),
      };

      mockPortfolioSnapshotRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.calculatePortfolioRiskMetrics({
        portfolioId,
        snapshotDate,
        granularity,
        riskFreeRate,
      });

      expect(result).toBeDefined();
      expect(result.volatility1M).toBeDefined();
      expect(result.volatility3M).toBeDefined();
      expect(result.volatility1Y).toBeDefined();
      expect(result.sharpeRatio1M).toBeDefined();
      expect(result.sharpeRatio3M).toBeDefined();
      expect(result.sharpeRatio1Y).toBeDefined();
      expect(result.maxDrawdown1M).toBeDefined();
      expect(result.maxDrawdown3M).toBeDefined();
      expect(result.maxDrawdown1Y).toBeDefined();
      expect(result.riskAdjustedReturn1M).toBeDefined();
      expect(result.riskAdjustedReturn3M).toBeDefined();
      expect(result.riskAdjustedReturn1Y).toBeDefined();
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

      const result = await service.calculatePortfolioRiskMetrics({
        portfolioId,
        snapshotDate,
        granularity,
      });

      expect(result).toBeDefined();
      expect(result.volatility1M).toBe(0);
      expect(result.sharpeRatio1M).toBe(0);
      expect(result.maxDrawdown1M).toBe(0);
    });
  });

  describe('calculateAssetRiskMetrics', () => {
    it('should calculate asset risk metrics for different periods', async () => {
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
            snapshotDate: new Date('2024-01-02'),
            currentValue: 10100,
          },
          {
            snapshotDate: new Date('2024-01-03'),
            currentValue: 9900,
          },
          {
            snapshotDate: new Date('2024-01-04'),
            currentValue: 10200,
          },
          {
            snapshotDate: new Date('2024-01-05'),
            currentValue: 10300,
          },
        ]),
      };

      mockAssetSnapshotRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.calculateAssetRiskMetrics(
        portfolioId,
        assetId,
        snapshotDate,
        granularity
      );

      expect(result).toBeDefined();
      expect(result.volatility1M).toBeDefined();
      expect(result.sharpeRatio1M).toBeDefined();
      expect(result.maxDrawdown1M).toBeDefined();
      expect(result.riskAdjustedReturn1M).toBeDefined();
    });
  });

  describe('calculateAssetGroupRiskMetrics', () => {
    it('should calculate asset group risk metrics for different periods', async () => {
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
            snapshotDate: new Date('2024-01-02'),
            currentValue: 50500,
          },
          {
            snapshotDate: new Date('2024-01-03'),
            currentValue: 49500,
          },
          {
            snapshotDate: new Date('2024-01-04'),
            currentValue: 51000,
          },
          {
            snapshotDate: new Date('2024-01-05'),
            currentValue: 51500,
          },
        ]),
      };

      mockAssetSnapshotRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.calculateAssetGroupRiskMetrics(
        portfolioId,
        assetType,
        snapshotDate,
        granularity
      );

      expect(result).toBeDefined();
      expect(result.volatility1M).toBeDefined();
      expect(result.sharpeRatio1M).toBeDefined();
      expect(result.maxDrawdown1M).toBeDefined();
      expect(result.riskAdjustedReturn1M).toBeDefined();
    });
  });

  describe('risk metrics calculation logic', () => {
    it('should calculate volatility correctly', () => {
      const returns = [0.01, -0.02, 0.03, -0.01, 0.02]; // 1%, -2%, 3%, -1%, 2%
      
      const result = (service as any).calculateRiskMetricsFromReturns(returns, 0.02);

      expect(result.volatility).toBeGreaterThan(0);
      expect(result.volatility).toBeLessThan(100); // Should be reasonable percentage
    });

    it('should calculate Sharpe ratio correctly', () => {
      const returns = [0.01, 0.02, 0.01, 0.02, 0.01]; // Positive returns
      const riskFreeRate = 0.02;
      
      const result = (service as any).calculateRiskMetricsFromReturns(returns, riskFreeRate);

      expect(result.sharpeRatio).toBeDefined();
      expect(typeof result.sharpeRatio).toBe('number');
    });

    it('should calculate max drawdown correctly', () => {
      const returns = [0.1, -0.2, 0.15, -0.1, 0.05]; // Some negative returns
      
      const result = (service as any).calculateRiskMetricsFromReturns(returns, 0.02);

      expect(result.maxDrawdown).toBeGreaterThan(0);
      expect(result.maxDrawdown).toBeLessThan(100); // Should be reasonable percentage
    });

    it('should handle zero volatility', () => {
      const returns = [0.01, 0.01, 0.01, 0.01, 0.01]; // Constant returns
      
      const result = (service as any).calculateRiskMetricsFromReturns(returns, 0.02);

      expect(result.volatility).toBe(0);
      expect(result.sharpeRatio).toBe(0);
      expect(result.riskAdjustedReturn).toBe(0);
    });

    it('should handle insufficient data', () => {
      const returns = [0.01]; // Only one return
      
      const result = (service as any).calculateRiskMetricsFromReturns(returns, 0.02);

      expect(result.volatility).toBe(0);
      expect(result.sharpeRatio).toBe(0);
      expect(result.maxDrawdown).toBe(0);
      expect(result.riskAdjustedReturn).toBe(0);
    });
  });

  describe('max drawdown calculation', () => {
    it('should calculate max drawdown correctly', () => {
      const returns = [0.1, -0.2, 0.15, -0.1, 0.05];
      
      const result = (service as any).calculateMaxDrawdown(returns);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1); // Should be less than 100%
    });

    it('should handle all positive returns', () => {
      const returns = [0.01, 0.02, 0.01, 0.02, 0.01];
      
      const result = (service as any).calculateMaxDrawdown(returns);

      expect(result).toBe(0); // No drawdown if all returns are positive
    });

    it('should handle empty returns array', () => {
      const returns: number[] = [];
      
      const result = (service as any).calculateMaxDrawdown(returns);

      expect(result).toBe(0);
    });
  });

  describe('VaR and CVaR calculations', () => {
    it('should calculate VaR correctly', async () => {
      const portfolioId = 'test-portfolio-id';
      const snapshotDate = new Date('2024-01-31');
      const days = 30;
      const confidenceLevel = 0.95;

      // Mock query builder
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { snapshotDate: new Date('2024-01-01'), totalPortfolioValue: 100000 },
          { snapshotDate: new Date('2024-01-02'), totalPortfolioValue: 101000 },
          { snapshotDate: new Date('2024-01-03'), totalPortfolioValue: 99000 },
          { snapshotDate: new Date('2024-01-04'), totalPortfolioValue: 102000 },
          { snapshotDate: new Date('2024-01-05'), totalPortfolioValue: 103000 },
        ]),
      };

      mockPortfolioSnapshotRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.calculateVaR(
        portfolioId,
        snapshotDate,
        days,
        confidenceLevel
      );

      expect(result).toBeGreaterThanOrEqual(0);
      expect(typeof result).toBe('number');
    });

    it('should calculate CVaR correctly', async () => {
      const portfolioId = 'test-portfolio-id';
      const snapshotDate = new Date('2024-01-31');
      const days = 30;
      const confidenceLevel = 0.95;

      // Mock query builder
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { snapshotDate: new Date('2024-01-01'), totalPortfolioValue: 100000 },
          { snapshotDate: new Date('2024-01-02'), totalPortfolioValue: 101000 },
          { snapshotDate: new Date('2024-01-03'), totalPortfolioValue: 99000 },
          { snapshotDate: new Date('2024-01-04'), totalPortfolioValue: 102000 },
          { snapshotDate: new Date('2024-01-05'), totalPortfolioValue: 103000 },
        ]),
      };

      mockPortfolioSnapshotRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.calculateCVaR(
        portfolioId,
        snapshotDate,
        days,
        confidenceLevel
      );

      expect(result).toBeGreaterThanOrEqual(0);
      expect(typeof result).toBe('number');
    });
  });
});
