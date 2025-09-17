import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { GlobalAssetService } from './global-asset.service';
import { GlobalAsset } from '../entities/global-asset.entity';
import { NationConfigService } from './nation-config.service';
import { CreateGlobalAssetDto } from '../dto/create-global-asset.dto';
import { UpdateGlobalAssetDto } from '../dto/update-global-asset.dto';
import { GlobalAssetQueryDto } from '../dto/global-asset-query.dto';
import { AssetType } from '../enums/asset-type.enum';

describe('GlobalAssetService', () => {
  let service: GlobalAssetService;
  let repository: Repository<GlobalAsset>;
  let nationConfigService: NationConfigService;

  const mockGlobalAsset: GlobalAsset = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    symbol: 'HPG',
    name: 'Hoa Phat Group',
    type: AssetType.STOCK,
    nation: 'VN',
    marketCode: 'HOSE',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    isActive: true,
    description: 'Leading steel manufacturer in Vietnam',
    createdAt: new Date('2024-01-15T10:30:00.000Z'),
    updatedAt: new Date('2024-01-15T10:30:00.000Z'),
    trades: [],
    assetPrice: undefined,
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
    toJSON: jest.fn().mockReturnValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      symbol: 'HPG',
      name: 'Hoa Phat Group',
      type: 'STOCK',
      nation: 'VN',
      marketCode: 'HOSE',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
      isActive: true,
      description: 'Leading steel manufacturer in Vietnam',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z'
    }),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  const mockNationConfigService = {
    isValidNationCode: jest.fn(),
    isAssetTypeEnabled: jest.fn(),
    validateSymbolFormat: jest.fn(),
    getNationDefaults: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalAssetService,
        {
          provide: getRepositoryToken(GlobalAsset),
          useValue: mockRepository,
        },
        {
          provide: NationConfigService,
          useValue: mockNationConfigService,
        },
      ],
    }).compile();

    service = module.get<GlobalAssetService>(GlobalAssetService);
    repository = module.get<Repository<GlobalAsset>>(getRepositoryToken(GlobalAsset));
    nationConfigService = module.get<NationConfigService>(NationConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateGlobalAssetDto = {
      symbol: 'HPG',
      name: 'Hoa Phat Group',
      type: AssetType.STOCK,
      nation: 'VN',
      marketCode: 'HOSE',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
      isActive: true,
      description: 'Leading steel manufacturer in Vietnam',
    };

    it('should create a new global asset', async () => {
      mockNationConfigService.isValidNationCode.mockReturnValue(true);
      mockNationConfigService.isAssetTypeEnabled.mockReturnValue(true);
      mockNationConfigService.validateSymbolFormat.mockReturnValue(true);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockGlobalAsset);
      mockRepository.save.mockResolvedValue(mockGlobalAsset);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.symbol).toBe('HPG');
      expect(result.nation).toBe('VN');
      expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining(createDto));
      expect(mockRepository.save).toHaveBeenCalledWith(mockGlobalAsset);
    });

    it('should throw BadRequestException for invalid nation code', async () => {
      mockNationConfigService.isValidNationCode.mockReturnValue(false);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for disabled asset type', async () => {
      mockNationConfigService.isValidNationCode.mockReturnValue(true);
      mockNationConfigService.isAssetTypeEnabled.mockReturnValue(false);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for existing asset', async () => {
      mockNationConfigService.isValidNationCode.mockReturnValue(true);
      mockNationConfigService.isAssetTypeEnabled.mockReturnValue(true);
      mockNationConfigService.validateSymbolFormat.mockReturnValue(true);
      mockRepository.findOne.mockResolvedValue(mockGlobalAsset);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid symbol format', async () => {
      mockNationConfigService.isValidNationCode.mockReturnValue(true);
      mockNationConfigService.isAssetTypeEnabled.mockReturnValue(true);
      mockNationConfigService.validateSymbolFormat.mockReturnValue(false);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    const queryDto: GlobalAssetQueryDto = {
      page: 1,
      limit: 10,
      sortBy: 'symbol',
      sortOrder: 'ASC',
    };

    it('should find all global assets with pagination', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockGlobalAsset], 1]);

      const result = await service.findAll(queryDto);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by search term', async () => {
      const searchQuery = { ...queryDto, search: 'HPG' };
      mockRepository.findAndCount.mockResolvedValue([[mockGlobalAsset], 1]);

      await service.findAll(searchQuery);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            symbol: expect.any(Object),
          }),
        }),
      );
    });

    it('should filter by nation', async () => {
      const nationQuery = { ...queryDto, nation: 'VN' };
      mockRepository.findAndCount.mockResolvedValue([[mockGlobalAsset], 1]);

      await service.findAll(nationQuery);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nation: 'VN',
          }),
        }),
      );
    });

    it('should filter by type', async () => {
      const typeQuery = { ...queryDto, type: AssetType.STOCK };
      mockRepository.findAndCount.mockResolvedValue([[mockGlobalAsset], 1]);

      await service.findAll(typeQuery);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: AssetType.STOCK,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should find a global asset by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockGlobalAsset);

      const result = await service.findOne('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBeDefined();
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
        relations: ['assetPrice'],
      });
    });

    it('should return null if asset not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findBySymbolAndNation', () => {
    it('should find a global asset by symbol and nation', async () => {
      mockRepository.findOne.mockResolvedValue(mockGlobalAsset);

      const result = await service.findBySymbolAndNation('HPG', 'VN');

      expect(result).toBeDefined();
      expect(result.symbol).toBe('HPG');
      expect(result.nation).toBe('VN');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { symbol: 'HPG', nation: 'VN' },
        relations: ['assetPrice'],
      });
    });

    it('should return null if asset not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findBySymbolAndNation('NONEXISTENT', 'VN');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateDto: UpdateGlobalAssetDto = {
      name: 'Updated Hoa Phat Group',
      description: 'Updated description',
    };

    it('should update a global asset', async () => {
      mockRepository.findOne.mockResolvedValue(mockGlobalAsset);
      mockRepository.save.mockResolvedValue({ ...mockGlobalAsset, ...updateDto });

      const result = await service.update('550e8400-e29b-41d4-a716-446655440000', updateDto);

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
    });

    it('should throw NotFoundException if asset not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if asset cannot be modified', async () => {
      const assetWithTrades = { ...mockGlobalAsset, hasTrades: jest.fn().mockReturnValue(true) };
      mockRepository.findOne.mockResolvedValue(assetWithTrades);

      await expect(service.update('550e8400-e29b-41d4-a716-446655440000', updateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a global asset', async () => {
      mockRepository.findOne.mockResolvedValue(mockGlobalAsset);
      mockRepository.remove.mockResolvedValue(mockGlobalAsset);

      const result = await service.remove('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBeDefined();
      expect(result.message).toBe('Global asset deleted successfully');
      expect(mockRepository.remove).toHaveBeenCalledWith(mockGlobalAsset);
    });

    it('should throw NotFoundException if asset not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if asset has trades', async () => {
      const assetWithTrades = { ...mockGlobalAsset, hasTrades: jest.fn().mockReturnValue(true) };
      mockRepository.findOne.mockResolvedValue(assetWithTrades);

      await expect(service.remove('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByNation', () => {
    it('should find assets by nation', async () => {
      mockRepository.find.mockResolvedValue([mockGlobalAsset]);

      const result = await service.findByNation('VN');

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { nation: 'VN', isActive: true },
        relations: ['assetPrice'],
        order: { symbol: 'ASC' },
      });
    });
  });

  describe('findByType', () => {
    it('should find assets by type', async () => {
      mockRepository.find.mockResolvedValue([mockGlobalAsset]);

      const result = await service.findByType(AssetType.STOCK);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { type: AssetType.STOCK, isActive: true },
        relations: ['assetPrice'],
        order: { symbol: 'ASC' },
      });
    });
  });

  describe('getStatistics', () => {
    it('should return asset statistics', async () => {
      mockRepository.find.mockResolvedValue([mockGlobalAsset]);

      const result = await service.getStatistics();

      expect(result).toBeDefined();
      expect(result.total).toBe(1);
      expect(result.byNation).toHaveProperty('VN');
      expect(result.byType).toHaveProperty('STOCK');
      expect(result.byMarketCode).toHaveProperty('HOSE');
      expect(result.byCurrency).toHaveProperty('VND');
      expect(result.active).toBe(1);
      expect(result.inactive).toBe(0);
    });
  });
});
