# 📋 Test Templates - Copy & Paste Ready

## 🧪 **Service Test Template**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ServiceName } from './service-name.service';
import { EntityName } from '../entities/entity-name.entity';
import { CreateDtoName } from '../dto/create-dto-name.dto';
import { UpdateDtoName } from '../dto/update-dto-name.dto';
import { testUtils } from '../../../../test/utils/test-helpers';

describe('ServiceName', () => {
  let service: ServiceName;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = global.createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: getRepositoryToken(EntityName),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMethod', () => {
    it('should create entity successfully', async () => {
      // Arrange
      const createDto: CreateDtoName = testUtils.fixtures.createDtoName();
      const expectedEntity = testUtils.fixtures.entityName();
      mockRepository.save.mockResolvedValue(expectedEntity);

      // Act
      const result = await service.createMethod(createDto);

      // Assert
      expect(result).toEqual(expectedEntity);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          // Add expected properties
        })
      );
    });

    it('should throw BadRequestException with invalid data', async () => {
      // Arrange
      const invalidDto: CreateDtoName = {
        // Add invalid data
      } as CreateDtoName;

      // Act & Assert
      await expect(service.createMethod(invalidDto))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return entity when found', async () => {
      // Arrange
      const entityId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedEntity = testUtils.fixtures.entityName({
        entity_id: entityId,
      });
      mockRepository.findOne.mockResolvedValue(expectedEntity);

      // Act
      const result = await service.findById(entityId);

      // Assert
      expect(result).toEqual(expectedEntity);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { entity_id: entityId },
        // Add relations if needed
      });
    });

    it('should throw NotFoundException when entity not found', async () => {
      // Arrange
      const entityId = 'non-existent-id';
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(entityId))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('updateMethod', () => {
    it('should update entity successfully', async () => {
      // Arrange
      const entityId = '550e8400-e29b-41d4-a716-446655440000';
      const updateDto: UpdateDtoName = {
        // Add update data
      };
      const existingEntity = testUtils.fixtures.entityName({
        entity_id: entityId,
      });
      const updatedEntity = { ...existingEntity, ...updateDto };

      mockRepository.findOne.mockResolvedValue(existingEntity);
      mockRepository.save.mockResolvedValue(updatedEntity);

      // Act
      const result = await service.updateMethod(entityId, updateDto);

      // Assert
      expect(result).toEqual(updatedEntity);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_id: entityId,
          // Add expected updated properties
        })
      );
    });

    it('should throw NotFoundException when updating non-existent entity', async () => {
      // Arrange
      const entityId = 'non-existent-id';
      const updateDto: UpdateDtoName = {
        // Add update data
      };
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateMethod(entityId, updateDto))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('deleteMethod', () => {
    it('should delete entity successfully', async () => {
      // Arrange
      const entityId = '550e8400-e29b-41d4-a716-446655440000';
      const existingEntity = testUtils.fixtures.entityName({
        entity_id: entityId,
      });
      mockRepository.findOne.mockResolvedValue(existingEntity);
      mockRepository.remove.mockResolvedValue(existingEntity);

      // Act
      const result = await service.deleteMethod(entityId);

      // Assert
      expect(result).toEqual(existingEntity);
      expect(mockRepository.remove).toHaveBeenCalledWith(existingEntity);
    });

    it('should throw NotFoundException when deleting non-existent entity', async () => {
      // Arrange
      const entityId = 'non-existent-id';
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteMethod(entityId))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
```

## 🎮 **Controller Test Template**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ControllerName } from './controller-name.controller';
import { ServiceName } from '../services/service-name.service';
import { testUtils } from '../../../../test/utils/test-helpers';

describe('ControllerName', () => {
  let controller: ControllerName;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      createMethod: jest.fn(),
      updateMethod: jest.fn(),
      deleteMethod: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControllerName],
      providers: [
        {
          provide: ServiceName,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ControllerName>(ControllerName);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return array of entities', async () => {
      // Arrange
      const queryParam = 'test-param';
      const expectedEntities = [
        testUtils.fixtures.entityName(),
        testUtils.fixtures.entityName(),
      ];
      mockService.findAll.mockResolvedValue(expectedEntities);

      // Act
      const result = await controller.getAll(queryParam);

      // Assert
      expect(result).toEqual(expectedEntities);
      expect(mockService.findAll).toHaveBeenCalledWith(queryParam);
    });
  });

  describe('getById', () => {
    it('should return entity by id', async () => {
      // Arrange
      const entityId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedEntity = testUtils.fixtures.entityName({
        entity_id: entityId,
      });
      mockService.findById.mockResolvedValue(expectedEntity);

      // Act
      const result = await controller.getById(entityId);

      // Assert
      expect(result).toEqual(expectedEntity);
      expect(mockService.findById).toHaveBeenCalledWith(entityId);
    });
  });

  describe('create', () => {
    it('should create entity', async () => {
      // Arrange
      const createDto = testUtils.fixtures.createDtoName();
      const expectedEntity = testUtils.fixtures.entityName();
      mockService.createMethod.mockResolvedValue(expectedEntity);

      // Act
      const result = await controller.create(createDto);

      // Assert
      expect(result).toEqual(expectedEntity);
      expect(mockService.createMethod).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update entity', async () => {
      // Arrange
      const entityId = '550e8400-e29b-41d4-a716-446655440000';
      const updateDto = testUtils.fixtures.updateDtoName();
      const expectedEntity = testUtils.fixtures.entityName({
        entity_id: entityId,
      });
      mockService.updateMethod.mockResolvedValue(expectedEntity);

      // Act
      const result = await controller.update(entityId, updateDto);

      // Assert
      expect(result).toEqual(expectedEntity);
      expect(mockService.updateMethod).toHaveBeenCalledWith(entityId, updateDto);
    });
  });

  describe('delete', () => {
    it('should delete entity', async () => {
      // Arrange
      const entityId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedEntity = testUtils.fixtures.entityName({
        entity_id: entityId,
      });
      mockService.deleteMethod.mockResolvedValue(expectedEntity);

      // Act
      const result = await controller.delete(entityId);

      // Assert
      expect(result).toEqual(expectedEntity);
      expect(mockService.deleteMethod).toHaveBeenCalledWith(entityId);
    });
  });
});
```

## 📝 **DTO Validation Test Template**

```typescript
import { validate } from 'class-validator';
import { DtoName } from './dto-name.dto';

describe('DtoName', () => {
  let dto: DtoName;

  beforeEach(() => {
    dto = new DtoName();
  });

  describe('propertyName validation', () => {
    it('should pass with valid propertyName', async () => {
      // Arrange
      dto.propertyName = 'valid value';
      // Set other required properties
      dto.otherProperty = 'other value';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail with empty propertyName', async () => {
      // Arrange
      dto.propertyName = '';
      dto.otherProperty = 'other value';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('propertyName');
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('should fail with invalid propertyName format', async () => {
      // Arrange
      dto.propertyName = 'invalid format';
      dto.otherProperty = 'other value';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('propertyName');
      expect(errors[0].constraints?.isValidFormat).toBeDefined();
    });
  });

  describe('otherProperty validation', () => {
    it('should pass with valid otherProperty', async () => {
      // Arrange
      dto.propertyName = 'valid value';
      dto.otherProperty = 'valid other value';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid otherProperty', async () => {
      // Arrange
      dto.propertyName = 'valid value';
      dto.otherProperty = 'invalid value';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('otherProperty');
      expect(errors[0].constraints?.isValidOtherProperty).toBeDefined();
    });
  });
});
```

## 🗄️ **Repository Test Template**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RepositoryName } from './repository-name.repository';
import { EntityName } from '../entities/entity-name.entity';
import { testUtils } from '../../../../test/utils/test-helpers';

describe('RepositoryName', () => {
  let repository: RepositoryName;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = global.createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoryName,
        {
          provide: getRepositoryToken(EntityName),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<RepositoryName>(RepositoryName);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByCondition', () => {
    it('should return entities matching condition', async () => {
      // Arrange
      const condition = { property: 'value' };
      const expectedEntities = [
        testUtils.fixtures.entityName(),
        testUtils.fixtures.entityName(),
      ];
      mockRepository.find.mockResolvedValue(expectedEntities);

      // Act
      const result = await repository.findByCondition(condition);

      // Assert
      expect(result).toEqual(expectedEntities);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: condition,
        // Add other options if needed
      });
    });

    it('should return empty array when no entities found', async () => {
      // Arrange
      const condition = { property: 'non-existent' };
      mockRepository.find.mockResolvedValue([]);

      // Act
      const result = await repository.findByCondition(condition);

      // Assert
      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: condition,
      });
    });
  });

  describe('saveEntity', () => {
    it('should save entity successfully', async () => {
      // Arrange
      const entity = testUtils.fixtures.entityName();
      const savedEntity = { ...entity, id: 'new-id' };
      mockRepository.save.mockResolvedValue(savedEntity);

      // Act
      const result = await repository.saveEntity(entity);

      // Assert
      expect(result).toEqual(savedEntity);
      expect(mockRepository.save).toHaveBeenCalledWith(entity);
    });
  });

  describe('deleteEntity', () => {
    it('should delete entity successfully', async () => {
      // Arrange
      const entityId = '550e8400-e29b-41d4-a716-446655440000';
      const entityToDelete = testUtils.fixtures.entityName({
        entity_id: entityId,
      });
      mockRepository.remove.mockResolvedValue(entityToDelete);

      // Act
      const result = await repository.deleteEntity(entityToDelete);

      // Assert
      expect(result).toEqual(entityToDelete);
      expect(mockRepository.remove).toHaveBeenCalledWith(entityToDelete);
    });
  });
});
```

## 🔧 **Custom Test Utilities Template**

```typescript
// test/utils/custom-test-utils.ts
import { testUtils } from './test-helpers';

export class CustomTestUtils {
  static async createTestEntity(overrides: any = {}) {
    const baseEntity = testUtils.fixtures.entityName();
    return { ...baseEntity, ...overrides };
  }

  static async setupTestDatabase() {
    // Database setup logic
    await testUtils.database.setup();
  }

  static async cleanupTestDatabase() {
    // Database cleanup logic
    await testUtils.database.cleanup();
  }

  static expectEntityToMatch(entity: any, expected: any) {
    expect(entity).toMatchObject(expected);
    expect(entity.entity_id).toBeUUID();
    expect(entity.created_at).toBeValidDate();
  }

  static async expectAsyncToThrow(promise: Promise<any>, errorType: any) {
    await expect(promise).rejects.toThrow(errorType);
  }
}
```

## 📋 **Test Checklist Template**

```markdown
## Test Checklist for [Component Name]

### ✅ Setup
- [ ] Test module created with proper providers
- [ ] Mocks configured correctly
- [ ] beforeEach/afterEach setup
- [ ] jest.clearAllMocks() called

### ✅ Happy Path Tests
- [ ] Create method with valid data
- [ ] Find method with existing entity
- [ ] Update method with valid data
- [ ] Delete method with existing entity
- [ ] List method returns array

### ✅ Error Handling Tests
- [ ] Create with invalid data throws BadRequestException
- [ ] Find with non-existent ID throws NotFoundException
- [ ] Update with non-existent ID throws NotFoundException
- [ ] Delete with non-existent ID throws NotFoundException
- [ ] Validation errors properly handled

### ✅ Edge Cases
- [ ] Empty arrays returned when no data
- [ ] Null/undefined inputs handled
- [ ] Boundary values tested
- [ ] Special characters in inputs

### ✅ Mock Verification
- [ ] Repository methods called with correct parameters
- [ ] Service methods called expected number of times
- [ ] Cache operations verified
- [ ] Logger calls verified

### ✅ Coverage
- [ ] All public methods tested
- [ ] All branches covered
- [ ] Error paths covered
- [ ] Edge cases covered
```

---

## 🎯 **Sử Dụng Templates**

1. **Copy template** phù hợp với component bạn đang test
2. **Thay thế** tên class, method, entity với tên thực tế
3. **Điều chỉnh** test cases theo business logic
4. **Thêm** test cases cụ thể cho component
5. **Chạy test** để đảm bảo hoạt động đúng

**🚀 Bắt đầu với template phù hợp và customize theo nhu cầu!** 🧪✅
