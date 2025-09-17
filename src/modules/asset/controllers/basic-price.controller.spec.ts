import { Test, TestingModule } from '@nestjs/testing';
import { BasicPriceController } from './basic-price.controller';
import { BasicPriceService } from '../services/basic-price.service';
import { CreateAssetPriceDto } from '../dto/create-asset-price.dto';
import { UpdateAssetPriceDto } from '../dto/update-asset-price.dto';
import { AssetPriceQueryDto } from '../dto/asset-price-query.dto';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PriceType, PriceSource } from '../enums/price-type.enum';

describe('BasicPriceController', () => {
  let controller: BasicPriceController;
  let basicPriceService: BasicPriceService;

  const mockAssetPrice = {
    id: 'test-price-id',
    assetId: 'test-asset-id',
    currentPrice: 150.75,
    priceType: PriceType.MANUAL,
    priceSource: PriceSource.USER,
    lastPriceUpdate: new Date(),
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    globalAsset: null,
    priceHistory: [],
    isActive: jest.fn().mockReturnValue(true),
    getPriceChangePercentage: jest.fn().mockReturnValue(5.25),
    getPriceChangeDescription: jest.fn().mockReturnValue('Price increased by 5.25%'),
    toJSON: jest.fn().mockReturnValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BasicPriceController],
      providers: [
        {
          provide: BasicPriceService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            findByAssetId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getStatistics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BasicPriceController>(BasicPriceController);
    basicPriceService = module.get<BasicPriceService>(BasicPriceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllAssetPrices', () => {
    it('should return array of asset prices', async () => {
      const queryDto: AssetPriceQueryDto = {
        limit: 10,
        page: 1,
        sortBy: 'lastPriceUpdate',
        sortOrder: 'DESC',
      };
      const mockResult = {
        data: [mockAssetPrice as any],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      jest.spyOn(basicPriceService, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.findAllAssetPrices(queryDto);

      expect(result).toHaveLength(1);
      expect(basicPriceService.findAll).toHaveBeenCalledWith(queryDto);
    });
  });

  describe('findAssetPriceById', () => {
    it('should return an asset price by id', async () => {
      const priceId = 'test-price-id';

      jest.spyOn(basicPriceService, 'findOne').mockResolvedValue(mockAssetPrice as any);

      const result = await controller.findAssetPriceById(priceId);

      expect(result).toBeDefined();
      expect(basicPriceService.findOne).toHaveBeenCalledWith(priceId);
    });

    it('should throw NotFoundException when price not found', async () => {
      const priceId = 'non-existent-id';

      jest.spyOn(basicPriceService, 'findOne').mockResolvedValue(null);

      await expect(controller.findAssetPriceById(priceId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAssetPriceByAssetId', () => {
    it('should return an asset price by asset id', async () => {
      const assetId = 'test-asset-id';

      jest.spyOn(basicPriceService, 'findByAssetId').mockResolvedValue(mockAssetPrice as any);

      const result = await controller.findAssetPriceByAssetId(assetId);

      expect(result).toBeDefined();
      expect(basicPriceService.findByAssetId).toHaveBeenCalledWith(assetId);
    });

    it('should throw NotFoundException when price not found for asset', async () => {
      const assetId = 'non-existent-asset-id';

      jest.spyOn(basicPriceService, 'findByAssetId').mockResolvedValue(null);

      await expect(controller.findAssetPriceByAssetId(assetId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createAssetPrice', () => {
    it('should create a new asset price', async () => {
      const createDto: CreateAssetPriceDto = {
        assetId: 'test-asset-id',
        currentPrice: 150.75,
        priceType: PriceType.MANUAL,
        priceSource: PriceSource.USER,
        lastPriceUpdate: new Date().toISOString(),
      };

      jest.spyOn(basicPriceService, 'create').mockResolvedValue(mockAssetPrice as any);

      const result = await controller.createAssetPrice(createDto);

      expect(result).toBeDefined();
      expect(basicPriceService.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when price already exists for asset', async () => {
      const createDto: CreateAssetPriceDto = {
        assetId: 'test-asset-id',
        currentPrice: 150.75,
        priceType: PriceType.MANUAL,
        priceSource: PriceSource.USER,
        lastPriceUpdate: new Date().toISOString(),
      };

      jest.spyOn(basicPriceService, 'create').mockRejectedValue(
        new ConflictException(`Price already exists for asset ${createDto.assetId}`),
      );

      await expect(controller.createAssetPrice(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid input', async () => {
      const createDto: CreateAssetPriceDto = {
        assetId: 'test-asset-id',
        currentPrice: -10, // Invalid negative price
        priceType: PriceType.MANUAL,
        priceSource: PriceSource.USER,
        lastPriceUpdate: new Date().toISOString(),
      };

      jest.spyOn(basicPriceService, 'create').mockRejectedValue(
        new BadRequestException('Price must be greater than 0'),
      );

      await expect(controller.createAssetPrice(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateAssetPrice', () => {
    it('should update an existing asset price', async () => {
      const priceId = 'test-price-id';
      const updateDto: UpdateAssetPriceDto = {
        currentPrice: 155.00,
      };

      const updatedPrice = { ...mockAssetPrice, ...updateDto };
      jest.spyOn(basicPriceService, 'update').mockResolvedValue(updatedPrice as any);

      const result = await controller.updateAssetPrice(priceId, updateDto);

      expect(result).toBeDefined();
      expect(basicPriceService.update).toHaveBeenCalledWith(priceId, updateDto);
    });

    it('should throw NotFoundException when price not found', async () => {
      const priceId = 'non-existent-id';
      const updateDto: UpdateAssetPriceDto = {
        currentPrice: 155.00,
      };

      jest.spyOn(basicPriceService, 'update').mockRejectedValue(
        new NotFoundException(`Asset price with ID '${priceId}' not found.`),
      );

      await expect(controller.updateAssetPrice(priceId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAssetPrice', () => {
    it('should delete an asset price', async () => {
      const priceId = 'test-price-id';

      jest.spyOn(basicPriceService, 'remove').mockResolvedValue({ message: 'Asset price deleted successfully' } as any);

      await controller.deleteAssetPrice(priceId);

      expect(basicPriceService.remove).toHaveBeenCalledWith(priceId);
    });

    it('should throw NotFoundException when price not found', async () => {
      const priceId = 'non-existent-id';

      jest.spyOn(basicPriceService, 'remove').mockRejectedValue(
        new NotFoundException(`Asset price with ID '${priceId}' not found.`),
      );

      await expect(controller.deleteAssetPrice(priceId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history for an asset', async () => {
      const assetId = 'test-asset-id';

      const result = await controller.getPriceHistory(assetId, 10, 0);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getPriceStatistics', () => {
    it('should return price statistics for an asset', async () => {
      const assetId = 'test-asset-id';

      const result = await controller.getPriceStatistics(assetId, '30D');

      expect(result).toBeDefined();
      expect(result.currentPrice).toBe(150.75);
      expect(result.period).toBe('30D');
    });
  });

  describe('bulkUpdatePrices', () => {
    it('should bulk update prices for multiple assets', async () => {
      const bulkUpdateDto = {
        updates: [
          { assetId: 'asset-1', currentPrice: 150.75 },
          { assetId: 'asset-2', currentPrice: 75.25 },
        ],
        priceType: PriceType.MARKET_DATA,
        priceSource: PriceSource.MARKET_DATA_SERVICE,
        changeReason: 'End of day market data update',
      };

      const result = await controller.bulkUpdatePrices(bulkUpdateDto);

      expect(result).toBeDefined();
      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
    });
  });
});