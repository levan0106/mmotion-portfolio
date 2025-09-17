import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { AssetMigrationService } from './asset-migration.service';
import { Asset } from '../entities/asset.entity';
import { AssetType } from '../enums/asset-type.enum';

describe('AssetMigrationService', () => {
  let service: AssetMigrationService;
  let repository: Repository<Asset>;

  const mockRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetMigrationService,
        {
          provide: getRepositoryToken(Asset),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AssetMigrationService>(AssetMigrationService);
    repository = module.get<Repository<Asset>>(getRepositoryToken(Asset));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeDataDistribution', () => {
    it('should analyze data distribution correctly', async () => {
      // Mock repository responses
      mockRepository.count.mockResolvedValue(100);
      
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };
      
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      
      // Mock different query results
      mockQueryBuilder.getCount
        .mockResolvedValueOnce(30) // assetsWithCodeOnly
        .mockResolvedValueOnce(20) // assetsWithSymbolOnly
        .mockResolvedValueOnce(25) // assetsWithBothFields
        .mockResolvedValueOnce(25); // assetsWithNeitherField
      
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { createdBy: 'user1', symbol: 'HPG' },
        { createdBy: 'user2', symbol: 'VCB' },
      ]); // duplicate symbols

      const result = await service.analyzeDataDistribution();

      expect(result).toEqual({
        totalAssets: 100,
        assetsWithCodeOnly: 30,
        assetsWithSymbolOnly: 20,
        assetsWithBothFields: 25,
        assetsWithNeitherField: 25,
        assetsNeedingSymbolGeneration: 25,
        potentialConflicts: 2,
      });
    });

    it('should throw BadRequestException on error', async () => {
      mockRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(service.analyzeDataDistribution()).rejects.toThrow(BadRequestException);
    });
  });

  describe('migrateCodeToSymbol', () => {
    it('should migrate code to symbol successfully', async () => {
      const mockAssets = [
        { id: '1', code: 'HPG', symbol: null, createdBy: 'user1' },
        { id: '2', code: 'VCB', symbol: null, createdBy: 'user1' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getCount: jest.fn(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany
        .mockResolvedValueOnce(mockAssets) // assets with code only
        .mockResolvedValueOnce([]); // assets needing symbols
      
      mockQueryBuilder.getRawMany.mockResolvedValue([]); // no conflicts
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.migrateCodeToSymbol();

      expect(result.migratedCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.generatedSymbolsCount).toBe(0);
      expect(result.conflictsResolved).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should generate symbols for assets without code or symbol', async () => {
      const mockAssets = [
        { id: '1', name: 'Hoa Phat Group', code: null, symbol: null, createdBy: 'user1' },
        { id: '2', name: 'Vietcombank', code: null, symbol: null, createdBy: 'user2' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getCount: jest.fn(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany
        .mockResolvedValueOnce([]) // no assets with code only
        .mockResolvedValueOnce(mockAssets); // assets needing symbols
      
      mockQueryBuilder.getRawMany.mockResolvedValue([]); // no conflicts
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.migrateCodeToSymbol();

      expect(result.migratedCount).toBe(0);
      expect(result.generatedSymbolsCount).toBe(2);
      expect(result.failedCount).toBe(0);
    });

    it('should handle migration errors gracefully', async () => {
      const mockAssets = [
        { id: '1', code: 'HPG', symbol: null, createdBy: 'user1' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getCount: jest.fn(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany
        .mockResolvedValueOnce(mockAssets)
        .mockResolvedValueOnce([]);
      
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      mockRepository.update.mockRejectedValue(new Error('Update failed'));

      const result = await service.migrateCodeToSymbol();

      expect(result.migratedCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Asset ID 1: Failed to migrate code to symbol');
    });
  });

  describe('generateSymbolFromName', () => {
    it('should generate symbol from name correctly', () => {
      const result = service['generateSymbolFromName']('Hoa Phat Group', 'user123');
      
      expect(result).toMatch(/^HOAPHATGRO_[A-Z0-9]{4}$/);
    });

    it('should handle special characters in name', () => {
      const result = service['generateSymbolFromName']('Hoa Phat Group (HPG)', 'user123');
      
      expect(result).toMatch(/^HOAPHATGRO_[A-Z0-9]{4}$/);
    });

    it('should handle empty name', () => {
      const result = service['generateSymbolFromName']('', 'user123');
      
      expect(result).toMatch(/^ASSET_[A-Z0-9]{4}$/);
    });
  });

  describe('validateMigration', () => {
    it('should validate migration successfully', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getCount
        .mockResolvedValueOnce(0) // no assets without symbol
        .mockResolvedValueOnce(0); // no assets with code
      
      mockQueryBuilder.getRawMany.mockResolvedValue([]); // no conflicts

      const result = await service.validateMigration();

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify validation issues', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getCount
        .mockResolvedValueOnce(5) // 5 assets without symbol
        .mockResolvedValueOnce(10); // 10 assets with code
      
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { createdBy: 'user1', symbol: 'HPG' },
      ]); // 1 conflict

      const result = await service.validateMigration();

      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(3);
      expect(result.issues[0]).toContain('5 assets still missing symbol field');
      expect(result.issues[1]).toContain('1 duplicate symbol conflicts remain');
      expect(result.issues[2]).toContain('10 assets still have code field');
    });
  });

  describe('rollbackMigration', () => {
    it('should rollback migration successfully', async () => {
      const mockAssets = [
        { id: '1', symbol: 'HPG', code: null },
        { id: '2', symbol: 'VCB', code: null },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(mockAssets);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.rollbackMigration();

      expect(result.rolledBackCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle rollback errors gracefully', async () => {
      const mockAssets = [
        { id: '1', symbol: 'HPG', code: null },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(mockAssets);
      mockRepository.update.mockRejectedValue(new Error('Update failed'));

      const result = await service.rollbackMigration();

      expect(result.rolledBackCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Asset ID 1: Failed to rollback');
    });
  });
});
