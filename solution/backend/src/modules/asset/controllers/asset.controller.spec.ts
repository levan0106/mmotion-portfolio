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
    findByUserId: jest.fn(),
    findByPortfolioId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
    getAssetStatistics: jest.fn(),
    updateAssetWithComputedFields: jest.fn(),
  };

    const mockAssetValidationService = {
      validateAssetCreation: jest.fn(),
      validateAssetUpdate: jest.fn(),
      validateAssetDeletion: jest.fn(),
    };

    const mockAssetAnalyticsService = {
      getAllocation: jest.fn(),
      getPerformance: jest.fn(),
      getRiskMetrics: jest.fn(),
      getAnalyticsSummary: jest.fn(),
      getByValueRange: jest.fn(),
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
      assetService.updateAssetWithComputedFields.mockResolvedValue(mockAsset);

      const result = await controller.create(createAssetDto);

      expect(assetValidationService.validateAssetCreation).toHaveBeenCalledWith(createAssetDto);
      expect(assetService.create).toHaveBeenCalledWith(createAssetDto);
      expect(assetService.updateAssetWithComputedFields).toHaveBeenCalledWith(mockAsset.id);
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
        createdBy: 'test-user-id',
        type: AssetType.STOCK,
        search: 'test',
        sortBy: 'name',
        sortOrder: 'ASC',
        limit: 10,
        offset: 0,
      });

      expect(assetService.findAll).toHaveBeenCalledWith({
        createdBy: 'test-user-id',
        type: AssetType.STOCK,
        search: 'test',
        sortBy: 'name',
        sortOrder: 'ASC',
        limit: 10,
        offset: 0,
      });
      expect(result).toEqual({
        data: [mockAssetResponse],
        total: 1,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findByUserId', () => {
    it('should return assets by user id', async () => {
      const mockPaginatedResponse = {
        data: [mockAsset],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      assetService.findByUserId.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findByUserId('test-user-id', {
        type: AssetType.STOCK,
        search: 'test',
        sortBy: 'name',
        sortOrder: 'ASC',
        limit: 10,
        offset: 0,
      });

      expect(assetService.findByUserId).toHaveBeenCalledWith('test-user-id', {
        type: AssetType.STOCK,
        search: 'test',
        sortBy: 'name',
        sortOrder: 'ASC',
        limit: 10,
        offset: 0,
      });
      expect(result).toEqual({
        data: [mockAssetResponse],
        total: 1,
        page: 1,
        limit: 10,
      });
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
      assetService.updateAssetWithComputedFields.mockResolvedValue(mockAsset);

      const result = await controller.update('test-asset-id', updateAssetDto);

      expect(assetValidationService.validateAssetUpdate).toHaveBeenCalledWith('test-asset-id', updateAssetDto);
      expect(assetService.update).toHaveBeenCalledWith('test-asset-id', updateAssetDto);
      expect(assetService.updateAssetWithComputedFields).toHaveBeenCalledWith(mockAsset.id);
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

  describe('search', () => {
    it('should search assets by query', async () => {
      assetService.search.mockResolvedValue([mockAsset]);

      const result = await controller.search('test query', {
        type: AssetType.STOCK,
        limit: 10,
      });

      expect(assetService.search).toHaveBeenCalledWith('test query');
      expect(result).toEqual([mockAssetResponse]);
    });
  });

  describe('getStatisticsByUser', () => {
    it('should return asset statistics by user', async () => {
      const mockStats = {
        totalAssets: 10,
        assetsByType: {
          STOCK: 5,
          BOND: 3,
          CASH: 2,
          GOLD: 0,
          COMMODITY: 0,
          DEPOSIT: 0,
        },
        totalValue: 10000000,
        averageValue: 1000000,
      };

      assetService.getAssetStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatisticsByUser('test-user-id');

      expect(assetService.getAssetStatistics).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual({
        totalAssets: 10,
        assetsByType: {
          STOCK: 5,
          BOND: 3,
          CASH: 2,
          GOLD: 0,
          COMMODITY: 0,
          DEPOSIT: 0,
        },
        totalValue: 10000000,
        averageValue: 1000000,
      });
    });
  });
});
