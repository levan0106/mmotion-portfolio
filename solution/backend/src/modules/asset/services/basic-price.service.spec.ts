import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { BasicPriceService } from './basic-price.service';
import { AssetPrice, PriceType, PriceSource } from '../entities/asset-price.entity';
import { GlobalAssetService } from './global-asset.service';
import { CreateAssetPriceDto } from '../dto/create-asset-price.dto';
import { UpdateAssetPriceDto } from '../dto/update-asset-price.dto';
import { AssetPriceQueryDto } from '../dto/asset-price-query.dto';

describe('BasicPriceService', () => {
  let service: BasicPriceService;
  let repository: Repository<AssetPrice>;
  let globalAssetService: GlobalAssetService;

  const mockAssetPrice: AssetPrice = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    assetId: '550e8400-e29b-41d4-a716-446655440001',
    currentPrice: 150000,
    priceType: PriceType.MARKET_DATA,
    priceSource: PriceSource.MARKET_DATA_SERVICE,
    lastPriceUpdate: new Date('2024-01-15T10:30:00.000Z'),
    metadata: { api_provider: 'yahoo_finance', response_time: '150ms' },
    createdAt: new Date('2024-01-15T10:30:00.000Z'),
    updatedAt: new Date('2024-01-15T10:30:00.000Z'),
    globalAsset: undefined,
    isRecent: jest.fn().mockReturnValue(true),
    isFromMarketData: jest.fn().mockReturnValue(true),
    isManual: jest.fn().mockReturnValue(false),
    getPriceAgeHours: jest.fn().mockReturnValue(2),
    getPriceAgeDays: jest.fn().mockReturnValue(0),
    needsUpdating: jest.fn().mockReturnValue(false),
    getFormattedPrice: jest.fn().mockReturnValue('150.000 ₫'),
    getPriceSourceDisplayName: jest.fn().mockReturnValue('Dịch vụ dữ liệu thị trường'),
    getPriceTypeDisplayName: jest.fn().mockReturnValue('Dữ liệu thị trường'),
    toJSON: jest.fn().mockReturnValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      assetId: '550e8400-e29b-41d4-a716-446655440001',
      currentPrice: 150000,
      priceType: 'MARKET_DATA',
      priceSource: 'MARKET_DATA_SERVICE',
      lastPriceUpdate: '2024-01-15T10:30:00.000Z',
      metadata: { api_provider: 'yahoo_finance', response_time: '150ms' },
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

  const mockGlobalAssetService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BasicPriceService,
        {
          provide: getRepositoryToken(AssetPrice),
          useValue: mockRepository,
        },
        {
          provide: GlobalAssetService,
          useValue: mockGlobalAssetService,
        },
      ],
    }).compile();

    service = module.get<BasicPriceService>(BasicPriceService);
    repository = module.get<Repository<AssetPrice>>(getRepositoryToken(AssetPrice));
    globalAssetService = module.get<GlobalAssetService>(GlobalAssetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateAssetPriceDto = {
      assetId: '550e8400-e29b-41d4-a716-446655440001',
      currentPrice: 150000,
      priceType: PriceType.MARKET_DATA,
      priceSource: PriceSource.MARKET_DATA_SERVICE,
      lastPriceUpdate: '2024-01-15T10:30:00.000Z',
      metadata: { api_provider: 'yahoo_finance', response_time: '150ms' },
    };

    it('should create a new asset price', async () => {
      mockGlobalAssetService.findOne.mockResolvedValue({ id: createDto.assetId });
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockAssetPrice);
      mockRepository.save.mockResolvedValue(mockAssetPrice);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.assetId).toBe(createDto.assetId);
      expect(result.currentPrice).toBe(createDto.currentPrice);
      expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining(createDto));
      expect(mockRepository.save).toHaveBeenCalledWith(mockAssetPrice);
    });

    it('should throw NotFoundException if asset not found', async () => {
      mockGlobalAssetService.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if price already exists', async () => {
      mockGlobalAssetService.findOne.mockResolvedValue({ id: createDto.assetId });
      mockRepository.findOne.mockResolvedValue(mockAssetPrice);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid price', async () => {
      const invalidDto = { ...createDto, currentPrice: -100 };
      mockGlobalAssetService.findOne.mockResolvedValue({ id: createDto.assetId });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    const queryDto: AssetPriceQueryDto = {
      page: 1,
      limit: 10,
      sortBy: 'lastPriceUpdate',
      sortOrder: 'DESC',
    };

    it('should find all asset prices with pagination', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockAssetPrice], 1]);

      const result = await service.findAll(queryDto);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by asset ID', async () => {
      const assetIdQuery = { ...queryDto, assetId: '550e8400-e29b-41d4-a716-446655440001' };
      mockRepository.findAndCount.mockResolvedValue([[mockAssetPrice], 1]);

      await service.findAll(assetIdQuery);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assetId: '550e8400-e29b-41d4-a716-446655440001',
          }),
        }),
      );
    });

    it('should filter by price type', async () => {
      const typeQuery = { ...queryDto, priceType: PriceType.MARKET_DATA };
      mockRepository.findAndCount.mockResolvedValue([[mockAssetPrice], 1]);

      await service.findAll(typeQuery);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priceType: PriceType.MARKET_DATA,
          }),
        }),
      );
    });

    it('should filter by price source', async () => {
      const sourceQuery = { ...queryDto, priceSource: PriceSource.MARKET_DATA_SERVICE };
      mockRepository.findAndCount.mockResolvedValue([[mockAssetPrice], 1]);

      await service.findAll(sourceQuery);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priceSource: PriceSource.MARKET_DATA_SERVICE,
          }),
        }),
      );
    });

    it('should filter by recent prices only', async () => {
      const recentQuery = { ...queryDto, recentOnly: true };
      mockRepository.findAndCount.mockResolvedValue([[mockAssetPrice], 1]);

      await service.findAll(recentQuery);

      expect(mockRepository.findAndCount).toHaveBeenCalled();
    });

    it('should filter by market data only', async () => {
      const marketDataQuery = { ...queryDto, marketDataOnly: true };
      mockRepository.findAndCount.mockResolvedValue([[mockAssetPrice], 1]);

      await service.findAll(marketDataQuery);

      expect(mockRepository.findAndCount).toHaveBeenCalled();
    });

    it('should filter by manual prices only', async () => {
      const manualQuery = { ...queryDto, manualOnly: true };
      mockRepository.findAndCount.mockResolvedValue([[mockAssetPrice], 1]);

      await service.findAll(manualQuery);

      expect(mockRepository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should find an asset price by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockAssetPrice);

      const result = await service.findOne('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBeDefined();
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
        relations: ['globalAsset'],
      });
    });

    it('should return null if price not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByAssetId', () => {
    it('should find an asset price by asset ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockAssetPrice);

      const result = await service.findByAssetId('550e8400-e29b-41d4-a716-446655440001');

      expect(result).toBeDefined();
      expect(result.assetId).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { assetId: '550e8400-e29b-41d4-a716-446655440001' },
        relations: ['globalAsset'],
      });
    });

    it('should return null if price not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByAssetId('non-existent-asset-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateDto: UpdateAssetPriceDto = {
      currentPrice: 160000,
      priceType: PriceType.MANUAL,
      priceSource: PriceSource.USER_INPUT,
    };

    it('should update an asset price', async () => {
      mockRepository.findOne.mockResolvedValue(mockAssetPrice);
      mockRepository.save.mockResolvedValue({ ...mockAssetPrice, ...updateDto });

      const result = await service.update('550e8400-e29b-41d4-a716-446655440000', updateDto);

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
    });

    it('should throw NotFoundException if price not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid price', async () => {
      const invalidDto = { ...updateDto, currentPrice: -100 };
      mockRepository.findOne.mockResolvedValue(mockAssetPrice);

      await expect(service.update('550e8400-e29b-41d4-a716-446655440000', invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete an asset price', async () => {
      mockRepository.findOne.mockResolvedValue(mockAssetPrice);
      mockRepository.remove.mockResolvedValue(mockAssetPrice);

      const result = await service.remove('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBeDefined();
      expect(result.message).toBe('Asset price deleted successfully');
      expect(mockRepository.remove).toHaveBeenCalledWith(mockAssetPrice);
    });

    it('should throw NotFoundException if price not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByAsset', () => {
    it('should find prices by asset ID', async () => {
      mockRepository.find.mockResolvedValue([mockAssetPrice]);

      const result = await service.findByAsset('550e8400-e29b-41d4-a716-446655440001');

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { assetId: '550e8400-e29b-41d4-a716-446655440001' },
        relations: ['globalAsset'],
        order: { lastPriceUpdate: 'DESC' },
      });
    });
  });

  describe('findByType', () => {
    it('should find prices by type', async () => {
      mockRepository.find.mockResolvedValue([mockAssetPrice]);

      const result = await service.findByType(PriceType.MARKET_DATA);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { priceType: PriceType.MARKET_DATA },
        relations: ['globalAsset'],
        order: { lastPriceUpdate: 'DESC' },
      });
    });
  });

  describe('findBySource', () => {
    it('should find prices by source', async () => {
      mockRepository.find.mockResolvedValue([mockAssetPrice]);

      const result = await service.findBySource(PriceSource.MARKET_DATA_SERVICE);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { priceSource: PriceSource.MARKET_DATA_SERVICE },
        relations: ['globalAsset'],
        order: { lastPriceUpdate: 'DESC' },
      });
    });
  });

  describe('findPricesNeedingUpdate', () => {
    it('should find prices that need updating', async () => {
      const oldPrice = { ...mockAssetPrice, needsUpdating: jest.fn().mockReturnValue(true) };
      mockRepository.find.mockResolvedValue([oldPrice]);

      const result = await service.findPricesNeedingUpdate(24);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
    });
  });

  describe('findRecentPrices', () => {
    it('should find recent prices', async () => {
      mockRepository.find.mockResolvedValue([mockAssetPrice]);

      const result = await service.findRecentPrices();

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
    });
  });

  describe('getStatistics', () => {
    it('should return price statistics', async () => {
      mockRepository.find.mockResolvedValue([mockAssetPrice]);

      const result = await service.getStatistics();

      expect(result).toBeDefined();
      expect(result.total).toBe(1);
      expect(result.byType).toHaveProperty('MARKET_DATA');
      expect(result.bySource).toHaveProperty('MARKET_DATA_SERVICE');
      expect(result.recent).toBe(1);
      expect(result.needsUpdate).toBe(0);
      expect(result.marketData).toBe(1);
      expect(result.manual).toBe(0);
    });
  });
});
