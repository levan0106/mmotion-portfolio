import { Test, TestingModule } from '@nestjs/testing';
import { AssetController } from '../../../../src/modules/asset/controllers/asset.controller';
import { AssetService } from '../../../../src/modules/asset/services/asset.service';
import { AssetValidationService } from '../../../../src/modules/asset/services/asset-validation.service';
import { AssetAnalyticsService } from '../../../../src/modules/asset/services/asset-analytics.service';
import { AssetType } from '../../../../src/modules/asset/enums/asset-type.enum';
import { CreateAssetDto } from '../../../../src/modules/asset/dto/create-asset.dto';
import { UpdateAssetDto } from '../../../../src/modules/asset/dto/update-asset.dto';
import { Asset } from '../../../../src/modules/asset/entities/asset.entity';
import { AssetResponseDto } from '../../../../src/modules/asset/dto/asset-response.dto';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('AssetController', () => {
  let controller: AssetController;
  let assetService: jest.Mocked<AssetService>;
  let assetValidationService: jest.Mocked<AssetValidationService>;
  let assetAnalyticsService: jest.Mocked<AssetAnalyticsService>;

  const mockAsset: Asset = {
    id: 'test-asset-id',
    name: 'Test Asset',
    symbol: 'TEST',
    type: AssetType.STOCK,
    description: 'Test asset description',
    initialValue: 1000000,
    initialQuantity: 100,
    currentValue: 1200000,
    currentQuantity: 100,
    createdBy: 'test-user-id',
    updatedBy: 'test-user-id',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    trades: [],
    getTotalValue: jest.fn().mockReturnValue(1200000),
    getTotalQuantity: jest.fn().mockReturnValue(100),
    hasTrades: jest.fn().mockReturnValue(false),
    getDisplayName: jest.fn().mockReturnValue('Test Asset (TEST)'),
    canModifySymbol: jest.fn().mockReturnValue(true),
    getPrimaryIdentifier: jest.fn().mockReturnValue('TEST'),
    validateSymbolModification: jest.fn(),
    toJSON: jest.fn().mockReturnValue({}),
  } as any;

  const mockAssetResponse: AssetResponseDto = {
    id: 'test-asset-id',
    name: 'Test Asset',
    symbol: 'TEST',
    type: AssetType.STOCK,
    description: 'Test asset description',
    initialValue: 1000000,
    initialQuantity: 100,
    currentValue: 1200000,
    currentQuantity: 100,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'test-user-id',
    updatedBy: 'test-user-id',
    totalValue: 1200000,
    totalQuantity: 100,
    hasTrades: false,
    displayName: 'Test Asset (TEST)',
    canModifySymbol: true,
    primaryIdentifier: 'TEST',
  };

  beforeEach(async () => {
    const mockAssetService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      getAssetStatistics: jest.fn(),
      exists: jest.fn(),
      getAssetCount: jest.fn(),
      countByPortfolioId: jest.fn(),
      findByValueRange: jest.fn(),
    };

    const mockAssetValidationService = {
      validateAssetCreation: jest.fn(),
      validateAssetUpdate: jest.fn(),
      validateAssetDeletion: jest.fn(),
    };

    const mockAssetAnalyticsService = {
      calculateAssetAllocation: jest.fn(),
      getAssetPerformanceComparison: jest.fn(),
      calculateRiskMetrics: jest.fn(),
      generateAssetSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetController],
      providers: [
        {
          provide: AssetService,
          useValue: mockAssetService,
        },
        {
          provide: AssetValidationService,
          useValue: mockAssetValidationService,
        },
        {
          provide: AssetAnalyticsService,
          useValue: mockAssetAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AssetController>(AssetController);
    assetService = module.get(AssetService);
    assetValidationService = module.get(AssetValidationService);
    assetAnalyticsService = module.get(AssetAnalyticsService);
  });

  describe('create', () => {
    it('should create an asset successfully', async () => {
      const createAssetDto: CreateAssetDto = {
        name: 'Test Asset',
        symbol: 'TEST',
        type: AssetType.STOCK,
        description: 'Test asset description',
        createdBy: 'test-user-id',
        updatedBy: 'test-user-id',
      };

      assetValidationService.validateAssetCreation.mockResolvedValue(undefined);
      assetService.create.mockResolvedValue(mockAsset);

      const result = await controller.create(createAssetDto);

      expect(assetValidationService.validateAssetCreation).toHaveBeenCalledWith(createAssetDto);
      expect(assetService.create).toHaveBeenCalledWith(createAssetDto);
      expect(result).toEqual(mockAssetResponse);
    });

    it('should throw ConflictException when validation fails', async () => {
      const createAssetDto: CreateAssetDto = {
        name: 'Test Asset',
        symbol: 'TEST',
        type: AssetType.STOCK,
        description: 'Test asset description',
        createdBy: 'test-user-id',
        updatedBy: 'test-user-id',
      };

      assetValidationService.validateAssetCreation.mockRejectedValue(
        new ConflictException('Asset symbol must be unique within your account')
      );

      await expect(controller.create(createAssetDto)).rejects.toThrow(ConflictException);
      expect(assetValidationService.validateAssetCreation).toHaveBeenCalledWith(createAssetDto);
      expect(assetService.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated assets', async () => {
      const mockPaginatedResponse = {
        data: [mockAsset],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      assetService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll({
        offset: 0,
        limit: 10,
        type: AssetType.STOCK,
        search: 'test',
        sortBy: 'name',
        sortOrder: 'ASC',
      });

      expect(assetService.findAll).toHaveBeenCalledWith({
        offset: 0,
        limit: 10,
        type: AssetType.STOCK,
        search: 'test',
        sortBy: 'name',
        sortOrder: 'ASC',
      });
      expect(result).toEqual({
        data: [mockAssetResponse],
        total: 1,
        offset: 0,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findById', () => {
    it('should return an asset by id', async () => {
      assetService.findById.mockResolvedValue(mockAsset);

      const result = await controller.findById('test-asset-id');

      expect(assetService.findById).toHaveBeenCalledWith('test-asset-id');
      expect(result).toEqual(mockAssetResponse);
    });

    it('should throw NotFoundException when asset not found', async () => {
      assetService.findById.mockRejectedValue(new NotFoundException('Asset not found'));

      await expect(controller.findById('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(assetService.findById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('update', () => {
    it('should update an asset successfully', async () => {
      const updateAssetDto: UpdateAssetDto = {
        name: 'Updated Asset',
        description: 'Updated description',
        updatedBy: 'test-user-id',
      };

      assetValidationService.validateAssetUpdate.mockResolvedValue(undefined);
      assetService.update.mockResolvedValue(mockAsset);

      const result = await controller.update('test-asset-id', updateAssetDto);

      expect(assetValidationService.validateAssetUpdate).toHaveBeenCalledWith('test-asset-id', updateAssetDto);
      expect(assetService.update).toHaveBeenCalledWith('test-asset-id', updateAssetDto);
      expect(result).toEqual(mockAssetResponse);
    });

    it('should throw BadRequestException when trying to update symbol', async () => {
      const updateAssetDto: UpdateAssetDto = {
        name: 'Updated Asset',
        symbol: 'NEW_SYMBOL', // This should be rejected
        updatedBy: 'test-user-id',
      } as any;

      assetValidationService.validateAssetUpdate.mockRejectedValue(
        new BadRequestException('Symbol cannot be updated after asset creation')
      );

      await expect(controller.update('test-asset-id', updateAssetDto)).rejects.toThrow(BadRequestException);
      expect(assetValidationService.validateAssetUpdate).toHaveBeenCalledWith('test-asset-id', updateAssetDto);
      expect(assetService.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete an asset successfully', async () => {
      assetValidationService.validateAssetDeletion.mockResolvedValue(undefined);
      assetService.delete.mockResolvedValue(undefined);

      await controller.delete('test-asset-id');

      expect(assetValidationService.validateAssetDeletion).toHaveBeenCalledWith('test-asset-id');
      expect(assetService.delete).toHaveBeenCalledWith('test-asset-id');
    });

    it('should throw error when asset has associated trades', async () => {
      assetValidationService.validateAssetDeletion.mockRejectedValue(
        new BadRequestException('Asset has associated trades')
      );

      await expect(controller.delete('test-asset-id')).rejects.toThrow(BadRequestException);
      expect(assetValidationService.validateAssetDeletion).toHaveBeenCalledWith('test-asset-id');
      expect(assetService.delete).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search assets by query', async () => {
      assetService.search.mockResolvedValue([mockAsset]);

      const result = await controller.search('test query', {});

      expect(assetService.search).toHaveBeenCalledWith('test query');
      expect(result).toEqual([mockAssetResponse]);
    });
  });

  describe('getStatisticsByUser', () => {
    it('should return asset statistics', async () => {
      const mockStats = {
        totalAssets: 10,
        totalValue: 10000000,
        assetsByType: {
          [AssetType.STOCK]: 5,
          [AssetType.BOND]: 3,
          [AssetType.CASH]: 2,
          [AssetType.GOLD]: 0,
          [AssetType.COMMODITY]: 0,
          [AssetType.DEPOSIT]: 0,
        },
        averageValue: 1000000,
      };

      assetService.getAssetStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatisticsByUser('test-user-id');

      expect(assetService.getAssetStatistics).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual({
        totalAssets: 10,
        assetsByType: {
          [AssetType.STOCK]: 5,
          [AssetType.BOND]: 3,
          [AssetType.CASH]: 2,
          [AssetType.GOLD]: 0,
          [AssetType.COMMODITY]: 0,
          [AssetType.DEPOSIT]: 0,
        },
        totalValue: 10000000,
        averageValue: 1000000,
      });
    });
  });

  describe('checkAssetExists', () => {
    it('should check if asset exists by id', async () => {
      assetService.exists.mockResolvedValue(true);

      const result = await controller.checkAssetExists('test-asset-id');

      expect(assetService.exists).toHaveBeenCalledWith('test-asset-id');
      expect(result).toEqual({ exists: true });
    });
  });

  describe('getCountByPortfolio', () => {
    it('should return asset count', async () => {
      assetService.countByPortfolioId.mockResolvedValue(10);

      const result = await controller.getCountByPortfolio('test-portfolio-id');

      expect(assetService.countByPortfolioId).toHaveBeenCalledWith('test-portfolio-id');
      expect(result).toEqual({ count: 10 });
    });
  });

  describe('Analytics endpoints', () => {
    it('should get asset allocation', async () => {
      const mockAllocation = {
        [AssetType.STOCK]: 0.6,
        [AssetType.BOND]: 0.4,
        [AssetType.CASH]: 0,
        [AssetType.GOLD]: 0,
        [AssetType.COMMODITY]: 0,
        [AssetType.DEPOSIT]: 0,
      };

      assetAnalyticsService.calculateAssetAllocation.mockResolvedValue(mockAllocation);

      const result = await controller.getAllocation('test-portfolio-id');

      expect(assetAnalyticsService.calculateAssetAllocation).toHaveBeenCalledWith('test-portfolio-id');
      expect(result).toEqual(mockAllocation);
    });

    it('should get asset performance', async () => {
      const mockPerformance = {
        period: 'ALL',
        assets: [],
      };

      assetAnalyticsService.getAssetPerformanceComparison.mockResolvedValue(mockPerformance);

      const result = await controller.getPerformanceComparison('test-portfolio-id', 'ALL');

      expect(assetAnalyticsService.getAssetPerformanceComparison).toHaveBeenCalledWith('test-portfolio-id', 'ALL');
      expect(result).toEqual(mockPerformance);
    });

    it('should get asset risk metrics', async () => {
      const mockRiskMetrics = {
        maxDrawdown: 0.05,
        sharpeRatio: 1.2,
        valueAtRisk: 1000,
        concentrationRisk: 0.15,
      };

      assetAnalyticsService.calculateRiskMetrics.mockResolvedValue(mockRiskMetrics);

      const result = await controller.getRiskMetrics('test-portfolio-id');

      expect(assetAnalyticsService.calculateRiskMetrics).toHaveBeenCalledWith('test-portfolio-id');
      expect(result).toEqual(mockRiskMetrics);
    });

    it('should get analytics summary', async () => {
      const mockSummary = {
        overview: {
          totalAssets: 10,
          totalValue: 10000000,
          averageValue: 1000000,
        },
        allocation: {
          [AssetType.STOCK]: 0.6,
          [AssetType.BOND]: 0.4,
          [AssetType.CASH]: 0,
          [AssetType.GOLD]: 0,
          [AssetType.COMMODITY]: 0,
          [AssetType.DEPOSIT]: 0,
        },
        performance: {
          totalReturn: 0.1,
          averageReturn: 0.1,
          bestPerformer: mockAsset,
          worstPerformer: mockAsset,
          volatility: 0.15,
        },
        risk: {
          maxDrawdown: 0.05,
          sharpeRatio: 1.2,
          valueAtRisk: 1000,
          concentrationRisk: 0.15,
        },
        topAssets: [mockAsset],
        recentActivity: [mockAsset],
      };

      assetAnalyticsService.generateAssetSummary.mockResolvedValue(mockSummary);

      const result = await controller.getAnalyticsSummary('test-user-id');

      expect(assetAnalyticsService.generateAssetSummary).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual(mockSummary);
    });

    it('should get value range', async () => {
      const mockAssets = [mockAsset];
      const expectedResponse = {
        assets: [mockAssetResponse],
        minValue: 1000,
        maxValue: 1000000,
        count: 1
      };

      assetService.findByValueRange.mockResolvedValue(mockAssets);

      const result = await controller.getByValueRange(1000, 1000000, 'test-user-id');

      expect(assetService.findByValueRange).toHaveBeenCalledWith(1000, 1000000, 'test-user-id');
      expect(result).toEqual(expectedResponse);
    });
  });
});
