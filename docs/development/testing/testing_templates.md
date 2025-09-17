# Testing Templates - Portfolio Management System

## 📋 Overview

This document provides reusable test templates and examples for the Portfolio Management System. Use these templates as starting points for creating new tests.

## 🏗️ Backend Test Templates

### 1. Service Test Template
```typescript
// src/modules/portfolio/services/portfolio.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioService } from './portfolio.service';
import { Portfolio } from '../entities/portfolio.entity';
import { CreatePortfolioDto } from '../dto/create-portfolio.dto';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let repository: Repository<Portfolio>;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: getRepositoryToken(Portfolio),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    repository = module.get<Repository<Portfolio>>(getRepositoryToken(Portfolio));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPortfolio', () => {
    it('should create a portfolio successfully', async () => {
      // Arrange
      const createDto: CreatePortfolioDto = {
        name: 'Test Portfolio',
        account_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const expectedPortfolio = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        ...createDto,
        total_value: 0,
        cash_balance: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.save.mockResolvedValue(expectedPortfolio);

      // Act
      const result = await service.createPortfolio(createDto);

      // Assert
      expect(result).toEqual(expectedPortfolio);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(createDto)
      );
    });

    it('should throw error when account does not exist', async () => {
      // Arrange
      const createDto: CreatePortfolioDto = {
        name: 'Test Portfolio',
        account_id: 'invalid-account-id',
      };

      mockRepository.save.mockRejectedValue(new Error('Account not found'));

      // Act & Assert
      await expect(service.createPortfolio(createDto)).rejects.toThrow(
        'Account not found'
      );
    });
  });

  describe('findAll', () => {
    it('should return all portfolios for an account', async () => {
      // Arrange
      const accountId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedPortfolios = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Portfolio 1',
          account_id: accountId,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Portfolio 2',
          account_id: accountId,
        },
      ];

      mockRepository.find.mockResolvedValue(expectedPortfolios);

      // Act
      const result = await service.findAll(accountId);

      // Assert
      expect(result).toEqual(expectedPortfolios);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { account_id: accountId },
      });
    });
  });
});
```

### 2. Controller Test Template
```typescript
// src/modules/portfolio/controllers/portfolio.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from '../services/portfolio.service';
import { CreatePortfolioDto } from '../dto/create-portfolio.dto';
import { UpdatePortfolioDto } from '../dto/update-portfolio.dto';

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let service: PortfolioService;

  const mockService = {
    createPortfolio: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updatePortfolio: jest.fn(),
    removePortfolio: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        {
          provide: PortfolioService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PortfolioController>(PortfolioController);
    service = module.get<PortfolioService>(PortfolioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPortfolio', () => {
    it('should create a portfolio', async () => {
      // Arrange
      const createDto: CreatePortfolioDto = {
        name: 'Test Portfolio',
        account_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const expectedPortfolio = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        ...createDto,
        total_value: 0,
        cash_balance: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockService.createPortfolio.mockResolvedValue(expectedPortfolio);

      // Act
      const result = await controller.createPortfolio(createDto);

      // Assert
      expect(result).toEqual(expectedPortfolio);
      expect(mockService.createPortfolio).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return portfolios for an account', async () => {
      // Arrange
      const accountId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedPortfolios = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Portfolio 1',
          account_id: accountId,
        },
      ];

      mockService.findAll.mockResolvedValue(expectedPortfolios);

      // Act
      const result = await controller.findAll(accountId);

      // Assert
      expect(result).toEqual(expectedPortfolios);
      expect(mockService.findAll).toHaveBeenCalledWith(accountId);
    });
  });
});
```

### 3. Repository Test Template
```typescript
// src/modules/portfolio/repositories/portfolio.repository.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryBuilder } from 'typeorm';
import { PortfolioRepository } from './portfolio.repository';
import { Portfolio } from '../entities/portfolio.entity';

describe('PortfolioRepository', () => {
  let repository: PortfolioRepository;
  let typeOrmRepository: Repository<Portfolio>;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  const mockTypeOrmRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioRepository,
        {
          provide: getRepositoryToken(Portfolio),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<PortfolioRepository>(PortfolioRepository);
    typeOrmRepository = module.get<Repository<Portfolio>>(getRepositoryToken(Portfolio));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByAccountId', () => {
    it('should return portfolios for an account', async () => {
      // Arrange
      const accountId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedPortfolios = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Portfolio 1',
          account_id: accountId,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(expectedPortfolios);

      // Act
      const result = await repository.findByAccountId(accountId);

      // Assert
      expect(result).toEqual(expectedPortfolios);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('portfolio.account_id = :accountId', { accountId });
    });
  });
});
```

### 4. DTO Validation Test Template
```typescript
// src/modules/portfolio/dto/create-portfolio.dto.spec.ts
import { validate } from 'class-validator';
import { CreatePortfolioDto } from './create-portfolio.dto';

describe('CreatePortfolioDto', () => {
  let dto: CreatePortfolioDto;

  beforeEach(() => {
    dto = new CreatePortfolioDto();
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      // Arrange
      dto.name = 'Test Portfolio';
      dto.account_id = '550e8400-e29b-41d4-a716-446655440000';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when name is empty', async () => {
      // Arrange
      dto.name = '';
      dto.account_id = '550e8400-e29b-41d4-a716-446655440000';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when account_id is not a valid UUID', async () => {
      // Arrange
      dto.name = 'Test Portfolio';
      dto.account_id = 'invalid-uuid';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('account_id');
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });
  });
});
```

## 🎨 Frontend Test Templates

### 1. Component Test Template
```typescript
// frontend/src/components/Portfolio/PortfolioList.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PortfolioList from './PortfolioList';
import { Portfolio } from '../../types';

// Mock API service
vi.mock('../../services/api', () => ({
  getPortfolios: vi.fn(),
  deletePortfolio: vi.fn(),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={createTheme()}>
      {component}
    </ThemeProvider>
  );
};

describe('PortfolioList', () => {
  const mockPortfolios: Portfolio[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test Portfolio 1',
      account_id: '550e8400-e29b-41d4-a716-446655440000',
      total_value: 100000,
      cash_balance: 10000,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Test Portfolio 2',
      account_id: '550e8400-e29b-41d4-a716-446655440000',
      total_value: 200000,
      cash_balance: 20000,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render portfolio list with data', async () => {
      // Arrange
      const { getPortfolios } = await import('../../services/api');
      vi.mocked(getPortfolios).mockResolvedValue(mockPortfolios);

      // Act
      renderWithTheme(<PortfolioList accountId="550e8400-e29b-41d4-a716-446655440000" />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Test Portfolio 1')).toBeInTheDocument();
        expect(screen.getByText('Test Portfolio 2')).toBeInTheDocument();
      });
    });

    it('should render empty state when no portfolios', async () => {
      // Arrange
      const { getPortfolios } = await import('../../services/api');
      vi.mocked(getPortfolios).mockResolvedValue([]);

      // Act
      renderWithTheme(<PortfolioList accountId="550e8400-e29b-41d4-a716-446655440000" />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('No portfolios found')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should delete portfolio when delete button is clicked', async () => {
      // Arrange
      const { getPortfolios, deletePortfolio } = await import('../../services/api');
      vi.mocked(getPortfolios).mockResolvedValue(mockPortfolios);
      vi.mocked(deletePortfolio).mockResolvedValue(undefined);

      renderWithTheme(<PortfolioList accountId="550e8400-e29b-41d4-a716-446655440000" />);

      await waitFor(() => {
        expect(screen.getByText('Test Portfolio 1')).toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByLabelText('Delete portfolio')[0];
      fireEvent.click(deleteButton);

      // Assert
      await waitFor(() => {
        expect(deletePortfolio).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001');
      });
    });
  });
});
```

### 2. Hook Test Template
```typescript
// frontend/src/hooks/usePortfolios.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePortfolios } from './usePortfolios';
import { Portfolio } from '../types';

// Mock API service
vi.mock('../services/api', () => ({
  getPortfolios: vi.fn(),
  createPortfolio: vi.fn(),
  updatePortfolio: vi.fn(),
  deletePortfolio: vi.fn(),
}));

describe('usePortfolios', () => {
  const mockPortfolios: Portfolio[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test Portfolio',
      account_id: '550e8400-e29b-41d4-a716-446655440000',
      total_value: 100000,
      cash_balance: 10000,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchPortfolios', () => {
    it('should fetch portfolios successfully', async () => {
      // Arrange
      const { getPortfolios } = await import('../services/api');
      vi.mocked(getPortfolios).mockResolvedValue(mockPortfolios);

      const { result } = renderHook(() => usePortfolios());

      // Act
      await result.current.fetchPortfolios('550e8400-e29b-41d4-a716-446655440000');

      // Assert
      await waitFor(() => {
        expect(result.current.portfolios).toEqual(mockPortfolios);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle fetch error', async () => {
      // Arrange
      const { getPortfolios } = await import('../services/api');
      const error = new Error('Failed to fetch portfolios');
      vi.mocked(getPortfolios).mockRejectedValue(error);

      const { result } = renderHook(() => usePortfolios());

      // Act
      await result.current.fetchPortfolios('550e8400-e29b-41d4-a716-446655440000');

      // Assert
      await waitFor(() => {
        expect(result.current.portfolios).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(error.message);
      });
    });
  });

  describe('createPortfolio', () => {
    it('should create portfolio successfully', async () => {
      // Arrange
      const { createPortfolio } = await import('../services/api');
      const newPortfolio = {
        name: 'New Portfolio',
        account_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const createdPortfolio = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        ...newPortfolio,
        total_value: 0,
        cash_balance: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(createPortfolio).mockResolvedValue(createdPortfolio);

      const { result } = renderHook(() => usePortfolios());

      // Act
      await result.current.createPortfolio(newPortfolio);

      // Assert
      await waitFor(() => {
        expect(result.current.portfolios).toContain(createdPortfolio);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });
});
```

### 3. Service Test Template
```typescript
// frontend/src/services/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPortfolios, createPortfolio, updatePortfolio, deletePortfolio } from './api';
import { Portfolio, CreatePortfolioDto, UpdatePortfolioDto } from '../types';

// Mock fetch
global.fetch = vi.fn();

describe('API Service', () => {
  const mockPortfolio: Portfolio = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Test Portfolio',
    account_id: '550e8400-e29b-41d4-a716-446655440000',
    total_value: 100000,
    cash_balance: 10000,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPortfolios', () => {
    it('should fetch portfolios successfully', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([mockPortfolio]),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      // Act
      const result = await getPortfolios('550e8400-e29b-41d4-a716-446655440000');

      // Assert
      expect(result).toEqual([mockPortfolio]);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/portfolios?accountId=550e8400-e29b-41d4-a716-446655440000'
      );
    });

    it('should handle fetch error', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      // Act & Assert
      await expect(getPortfolios('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        'Failed to fetch portfolios: 500 Internal Server Error'
      );
    });
  });

  describe('createPortfolio', () => {
    it('should create portfolio successfully', async () => {
      // Arrange
      const createDto: CreatePortfolioDto = {
        name: 'New Portfolio',
        account_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockPortfolio),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      // Act
      const result = await createPortfolio(createDto);

      // Assert
      expect(result).toEqual(mockPortfolio);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/portfolios',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createDto),
        })
      );
    });
  });
});
```

## 🧪 Integration Test Templates

### 1. E2E Test Template
```typescript
// test/portfolio.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Portfolio } from '../src/modules/portfolio/entities/portfolio.entity';
import { TestHelper } from './utils/test-helpers';

describe('Portfolio E2E', () => {
  let app: INestApplication;
  let testHelper: TestHelper;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    testHelper = new TestHelper();
    await testHelper.setupTest();
  });

  afterAll(async () => {
    await testHelper.cleanupTest();
    await app.close();
  });

  beforeEach(async () => {
    await testHelper.cleanupTestData();
    await testHelper.seedTestData();
  });

  describe('POST /api/v1/portfolios', () => {
    it('should create a portfolio', async () => {
      // Arrange
      const createDto = {
        name: 'Test Portfolio',
        account_id: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/portfolios')
        .send(createDto)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        name: createDto.name,
        account_id: createDto.account_id,
      });
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      // Arrange
      const invalidDto = {
        name: '',
        account_id: 'invalid-uuid',
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/v1/portfolios')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /api/v1/portfolios', () => {
    it('should return portfolios for an account', async () => {
      // Arrange
      const accountId = '550e8400-e29b-41d4-a716-446655440000';
      await testHelper.createTestPortfolio({ account_id: accountId });

      // Act
      const response = await request(app.getHttpServer())
        .get(`/api/v1/portfolios?accountId=${accountId}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveLength(1);
      expect(response.body[0].account_id).toBe(accountId);
    });
  });
});
```

## 📝 Test Data Templates

### 1. Test Fixtures
```typescript
// test/fixtures/portfolio.fixtures.ts
import { Portfolio } from '../../src/modules/portfolio/entities/portfolio.entity';

export const createMockPortfolio = (overrides: Partial<Portfolio> = {}): Portfolio => ({
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Test Portfolio',
  account_id: '550e8400-e29b-41d4-a716-446655440000',
  total_value: 100000,
  cash_balance: 10000,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createMockPortfolios = (count: number): Portfolio[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockPortfolio({
      id: `550e8400-e29b-41d4-a716-44665544000${index + 1}`,
      name: `Test Portfolio ${index + 1}`,
    })
  );
};
```

### 2. Test Utilities
```typescript
// test/utils/test-helpers.ts
export class TestHelper {
  static async setupTest(): Promise<void> {
    // Setup test database
    // Seed test data
  }

  static async cleanupTest(): Promise<void> {
    // Cleanup test database
  }

  static async createTestPortfolio(data: Partial<Portfolio> = {}): Promise<Portfolio> {
    // Create test portfolio
  }

  static async createTestAccount(data: Partial<Account> = {}): Promise<Account> {
    // Create test account
  }
}
```

---

**Last Updated**: September 7, 2025
**Version**: 1.0.0
**Maintainer**: Development Team
