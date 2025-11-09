import { Test, TestingModule } from '@nestjs/testing';
import { GlobalAssetController } from './global-asset.controller';
import { GlobalAssetService } from '../services/global-asset.service';
import { NationConfigService } from '../services/nation-config.service';
import { CreateGlobalAssetDto } from '../dto/create-global-asset.dto';
import { UpdateGlobalAssetDto } from '../dto/update-global-asset.dto';
import { GlobalAssetQueryDto } from '../dto/global-asset-query.dto';
import { GlobalAsset } from '../entities/global-asset.entity';
import { AssetType } from '../enums/asset-type.enum';
import { PriceSource } from '../entities/asset-price.entity';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('GlobalAssetController', () => {
  let controller: GlobalAssetController;
  let globalAssetService: GlobalAssetService;
  let nationConfigService: NationConfigService;

  const mockGlobalAsset: GlobalAsset = {
    id: 'test-id',
    symbol: 'HPG',
    name: 'Hoa Phat Group',
    type: AssetType.STOCK,
    nation: 'VN',
    marketCode: 'HOSE',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    isActive: true,
    description: 'Leading steel manufacturer in Vietnam',
    createdAt: new Date(),
    updatedAt: new Date(),
    trades: [],
    assetPrice: null,
    priceHistory: [],
    getGlobalIdentifier: jest.fn().mockReturnValue('HPG.VN'),
    getDisplayName: jest.fn().mockReturnValue('Hoa Phat Group (HPG.VN)'),
    getMarketDisplayName: jest.fn().mockReturnValue('HOSE (VN)'),
    hasTrades: jest.fn().mockReturnValue(false),
    isAvailableForTrading: jest.fn().mockReturnValue(true),
    getMarketInfo: jest.fn().mockReturnValue({
      nation: 'VN',
      marketCode: 'HOSE',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
    }),
    canModify: jest.fn().mockReturnValue(true),
    toJSON: jest.fn().mockReturnValue({}),
  };

  const mockNationConfig = {
    name: 'Vietnam',
    displayName: 'Việt Nam',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    marketCodes: [
      { code: 'HOSE', name: 'Ho Chi Minh Stock Exchange', displayName: 'Sàn giao dịch chứng khoán TP.HCM', isDefault: true },
      { code: 'HNX', name: 'Hanoi Stock Exchange', displayName: 'Sàn giao dịch chứng khoán Hà Nội', isDefault: false },
      { code: 'UPCOM', name: 'Unlisted Public Company Market', displayName: 'Thị trường giao dịch của các công ty đại chúng chưa niêm yết', isDefault: false }
    ],
    defaultMarketCode: 'HOSE',
    assetTypes: {
      STOCK: {
        enabled: true,
        defaultMarketCode: 'HOSE',
        symbolPattern: '^[A-Z0-9]{3}$',
        description: 'Vietnamese Stock',
      },
    },
    priceSources: [
      { code: 'VNDIRECT', name: 'VnDirect', displayName: 'VnDirect', isDefault: true, enabled: true },
      { code: 'CAFEF', name: 'Cafef', displayName: 'Cafef', isDefault: false, enabled: true }
    ],
    defaultPriceSource: 'VNDIRECT',
    tradingHours: {
      timezone: 'Asia/Ho_Chi_Minh',
      sessions: [
        { name: 'Morning', start: '09:00', end: '11:30', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
        { name: 'Afternoon', start: '13:00', end: '15:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
      ]
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GlobalAssetController],
      providers: [
        {
          provide: GlobalAssetService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: NationConfigService,
          useValue: {
            getAvailableNations: jest.fn(),
            getNationConfig: jest.fn(),
            validateSymbolFormat: jest.fn(),
            isValidNationCode: jest.fn(),
            isAssetTypeEnabled: jest.fn(),
            getDefaultCurrency: jest.fn(),
            getDefaultTimezone: jest.fn(),
            getDefaultMarketCode: jest.fn(),
            isMarketOpen: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GlobalAssetController>(GlobalAssetController);
    globalAssetService = module.get<GlobalAssetService>(GlobalAssetService);
    nationConfigService = module.get<NationConfigService>(NationConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllGlobalAssets', () => {
    it('should return array of global assets', async () => {
      const queryDto: GlobalAssetQueryDto = {
        limit: 10,
        page: 1,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };
      const mockResult = {
        data: [mockGlobalAsset as any],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      jest.spyOn(globalAssetService, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.findAllGlobalAssets(queryDto);

      expect(result).toHaveLength(1);
      expect(globalAssetService.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should handle filtering by nation', async () => {
      const queryDto: GlobalAssetQueryDto = {
        nation: 'VN',
        limit: 10,
        page: 1,
      };
      const mockResult = {
        data: [mockGlobalAsset as any],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      jest.spyOn(globalAssetService, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.findAllGlobalAssets(queryDto);

      expect(result).toHaveLength(1);
      expect(globalAssetService.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should handle search functionality', async () => {
      const queryDto: GlobalAssetQueryDto = {
        search: 'HPG',
        limit: 10,
        page: 1,
      };
      const mockResult = {
        data: [mockGlobalAsset as any],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      jest.spyOn(globalAssetService, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.findAllGlobalAssets(queryDto);

      expect(result).toHaveLength(1);
      expect(globalAssetService.findAll).toHaveBeenCalledWith(queryDto);
    });
  });

  describe('findGlobalAssetById', () => {
    it('should return a global asset by id', async () => {
      const assetId = 'test-id';

      jest.spyOn(globalAssetService, 'findOne').mockResolvedValue(mockGlobalAsset as any);

      const result = await controller.findGlobalAssetById(assetId);

      expect(result).toBeDefined();
      expect(globalAssetService.findOne).toHaveBeenCalledWith(assetId);
    });

    it('should throw NotFoundException when asset not found', async () => {
      const assetId = 'non-existent-id';

      jest.spyOn(globalAssetService, 'findOne').mockResolvedValue(null);

      await expect(controller.findGlobalAssetById(assetId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createGlobalAsset', () => {
    it('should create a new global asset', async () => {
      const createDto: CreateGlobalAssetDto = {
        symbol: 'HPG',
        name: 'Hoa Phat Group',
        type: AssetType.STOCK,
        nation: 'VN',
        marketCode: 'HOSE',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        description: 'Leading steel manufacturer in Vietnam',
      };

      jest.spyOn(globalAssetService, 'create').mockResolvedValue(mockGlobalAsset as any);

      const result = await controller.createGlobalAsset(createDto);

      expect(result).toBeDefined();
      expect(globalAssetService.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when asset already exists', async () => {
      const createDto: CreateGlobalAssetDto = {
        symbol: 'HPG',
        name: 'Hoa Phat Group',
        type: AssetType.STOCK,
        nation: 'VN',
        marketCode: 'HOSE',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
      };

      jest.spyOn(globalAssetService, 'create').mockRejectedValue(
        new ConflictException(`Global asset with symbol 'HPG' and nation 'VN' already exists.`),
      );

      await expect(controller.createGlobalAsset(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid input', async () => {
      const createDto: CreateGlobalAssetDto = {
        symbol: 'invalid-symbol!',
        name: 'Test Asset',
        type: AssetType.STOCK,
        nation: 'VN',
        marketCode: 'HOSE',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
      };

      jest.spyOn(globalAssetService, 'create').mockRejectedValue(
        new BadRequestException('Invalid symbol format'),
      );

      await expect(controller.createGlobalAsset(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateGlobalAsset', () => {
    it('should update an existing global asset', async () => {
      const assetId = 'test-id';
      const updateDto: UpdateGlobalAssetDto = {
        name: 'Updated Asset Name',
        description: 'Updated description',
      };

      const updatedAsset = { ...mockGlobalAsset, ...updateDto };
      jest.spyOn(globalAssetService, 'update').mockResolvedValue(updatedAsset as any);

      const result = await controller.updateGlobalAsset(assetId, updateDto);

      expect(result).toBeDefined();
      expect(globalAssetService.update).toHaveBeenCalledWith(assetId, updateDto);
    });

    it('should throw NotFoundException when asset not found', async () => {
      const assetId = 'non-existent-id';
      const updateDto: UpdateGlobalAssetDto = {
        name: 'Updated Asset Name',
      };

      jest.spyOn(globalAssetService, 'update').mockRejectedValue(
        new NotFoundException(`Global asset with ID '${assetId}' not found.`),
      );

      await expect(controller.updateGlobalAsset(assetId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteGlobalAsset', () => {
    it('should delete a global asset', async () => {
      const assetId = 'test-id';

      jest.spyOn(globalAssetService, 'remove').mockResolvedValue({ message: 'Asset deleted' } as any);

      await controller.deleteGlobalAsset(assetId);

      expect(globalAssetService.remove).toHaveBeenCalledWith(assetId);
    });

    it('should throw NotFoundException when asset not found', async () => {
      const assetId = 'non-existent-id';

      jest.spyOn(globalAssetService, 'remove').mockRejectedValue(
        new NotFoundException(`Global asset with ID '${assetId}' not found.`),
      );

      await expect(controller.deleteGlobalAsset(assetId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSupportedNations', () => {
    it('should return list of supported nations', async () => {
      const mockNationCodes = ['VN', 'US', 'UK'];
      const mockNations = [
        { ...mockNationConfig, name: 'Vietnam' },
        { ...mockNationConfig, name: 'United States', currency: 'USD' },
        { ...mockNationConfig, name: 'United Kingdom', currency: 'GBP' },
      ];

      (nationConfigService.getAvailableNations as jest.Mock).mockReturnValue(mockNationCodes);
      jest.spyOn(nationConfigService, 'getNationConfig')
        .mockReturnValueOnce(mockNations[0])
        .mockReturnValueOnce(mockNations[1])
        .mockReturnValueOnce(mockNations[2]);

      const result = await controller.getSupportedNations();

      expect(result.nations).toHaveLength(3);
      expect(result.nations[0].code).toBe('VN');
      expect(result.nations[0].name).toBe('Vietnam');
      expect(result.nations[1].code).toBe('US');
      expect(result.nations[1].name).toBe('United States');
    });
  });

  describe('getNationConfig', () => {
    it('should return nation configuration', async () => {
      const nationCode = 'VN';

      (nationConfigService.getNationConfig as jest.Mock).mockReturnValue(mockNationConfig);

      const result = await controller.getNationConfig(nationCode);

      expect(result.code).toBe('VN');
      expect(result.name).toBe('Vietnam');
      expect(result.currency).toBe('VND');
      expect(nationConfigService.getNationConfig).toHaveBeenCalledWith('VN');
    });

    it('should throw error for invalid nation code', async () => {
      const nationCode = 'XX';

      jest.spyOn(nationConfigService, 'getNationConfig').mockImplementation(() => {
        throw new Error('Nation configuration not found for code: XX');
      });

      await expect(controller.getNationConfig(nationCode)).rejects.toThrow('Nation configuration not found for code: XX');
    });
  });

  describe('validateSymbolFormat', () => {
    it('should validate symbol format successfully', async () => {
      const nationCode = 'VN';
      const symbol = 'HPG';
      const type = 'STOCK';

      (nationConfigService.validateSymbolFormat as jest.Mock).mockReturnValue(true);

      const result = await controller.validateSymbolFormat(nationCode, symbol, type);

      expect(result.valid).toBe(true);
      expect(result.symbol).toBe('HPG');
      expect(result.nation).toBe('VN');
      expect(result.type).toBe('STOCK');
      expect(result.message).toBe('Symbol format is valid');
      expect(nationConfigService.validateSymbolFormat).toHaveBeenCalledWith('VN', 'STOCK', 'HPG');
    });

    it('should return invalid for wrong symbol format', async () => {
      const nationCode = 'VN';
      const symbol = 'invalid-symbol!';
      const type = 'STOCK';

      (nationConfigService.validateSymbolFormat as jest.Mock).mockReturnValue(false);

      const result = await controller.validateSymbolFormat(nationCode, symbol, type);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Symbol format is invalid for this nation and type');
    });

    it('should handle missing parameters', async () => {
      const nationCode = 'VN';
      const symbol = '';
      const type = '';

      const result = await controller.validateSymbolFormat(nationCode, symbol, type);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Symbol and type parameters are required');
    });

    it('should handle validation errors', async () => {
      const nationCode = 'VN';
      const symbol = 'HPG';
      const type = 'INVALID_TYPE';

      (nationConfigService.validateSymbolFormat as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid asset type');
      });

      const result = await controller.validateSymbolFormat(nationCode, symbol, type);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid asset type');
    });
  });
});
