# Error Handling Utils - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Error Handling Utils cung cấp các functions và classes để xử lý lỗi một cách nhất quán và hiệu quả trong toàn bộ hệ thống. Tất cả error handling phải sử dụng các utilities từ logging system và exception filters.

## 🎯 Mục Tiêu

- **Consistency**: Đảm bảo error handling nhất quán
- **Observability**: Cung cấp thông tin chi tiết về lỗi
- **Security**: Bảo vệ thông tin nhạy cảm
- **User Experience**: Cung cấp feedback rõ ràng cho user

## 📚 Danh Sách Utilities

### 1. Logging Services

#### `LoggingService`

Core logging service for application events.

```typescript
import { LoggingService } from '@/modules/logging/services/logging.service';

@Injectable()
export class PortfolioService {
  constructor(private readonly loggingService: LoggingService) {}

  async createPortfolio(data: CreatePortfolioDto) {
    try {
      // Business logic
      const portfolio = await this.portfolioRepository.create(data);
      
      // Log success
      await this.loggingService.info('Portfolio created successfully', {
        portfolioId: portfolio.id,
        accountId: data.accountId,
        portfolioName: data.name
      });
      
      return portfolio;
    } catch (error) {
      // Log error with context
      await this.loggingService.error('Failed to create portfolio', error, {
        portfolioData: data,
        errorCode: 'PORTFOLIO_CREATE_FAILED'
      });
      
      throw error;
    }
  }
}
```

**Available Methods:**
- `error(message, error?, context?, options?)` - Log error messages
- `warn(message, context?, options?)` - Log warning messages
- `info(message, context?, options?)` - Log info messages
- `debug(message, context?, options?)` - Log debug messages
- `critical(message, error?, context?, options?)` - Log critical errors

#### `WinstonLoggerService`

Winston logger service for structured logging.

```typescript
import { WinstonLoggerService } from '@/modules/logging/services/winston-logger.service';

@Injectable()
export class TradingService {
  constructor(private readonly winstonLogger: WinstonLoggerService) {}

  async executeTrade(tradeData: TradeData) {
    try {
      // Log trade execution start
      this.winstonLogger.info('Trade execution started', {
        tradeId: tradeData.id,
        symbol: tradeData.symbol,
        quantity: tradeData.quantity,
        price: tradeData.price
      });
      
      // Execute trade
      const result = await this.tradeRepository.create(tradeData);
      
      // Log success
      this.winstonLogger.info('Trade executed successfully', {
        tradeId: result.id,
        executionTime: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      // Log error
      this.winstonLogger.error('Trade execution failed', {
        tradeId: tradeData.id,
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }
}
```

### 2. Exception Filters

#### `GlobalExceptionFilter`

Global exception filter that catches all unhandled exceptions.

```typescript
import { GlobalExceptionFilter } from '@/modules/logging/filters/global-exception.filter';

// Automatically applied globally
// No need to import in individual controllers

// The filter will:
// 1. Catch all unhandled exceptions
// 2. Log them with context
// 3. Sanitize sensitive data
// 4. Return structured error response
```

**Features:**
- Automatic exception catching
- Context-aware logging
- Sensitive data sanitization
- Structured error responses
- Error categorization by severity

#### Custom Exception Filters

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { LoggingService } from '@/modules/logging/services/logging.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggingService: LoggingService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const status = exception.getStatus();
    const message = exception.message;

    // Log the exception
    this.loggingService.warn('HTTP Exception occurred', {
      status,
      message,
      url: request.url,
      method: request.method,
      userAgent: request.headers['user-agent']
    });

    // Send response
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }
}
```

### 3. Context Management

#### `ContextManager`

Manages request context for logging and error tracking.

```typescript
import { ContextManager } from '@/modules/logging/services/context-manager.service';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly contextManager: ContextManager,
    private readonly loggingService: LoggingService
  ) {}

  async getPortfolio(id: string) {
    // Get current context
    const context = this.contextManager.getContext();
    
    try {
      const portfolio = await this.portfolioRepository.findOne(id);
      
      // Log with context
      await this.loggingService.info('Portfolio retrieved', {
        portfolioId: id,
        requestId: context.requestId,
        userId: context.userId
      });
      
      return portfolio;
    } catch (error) {
      // Log error with context
      await this.loggingService.error('Failed to retrieve portfolio', error, {
        portfolioId: id,
        requestId: context.requestId,
        userId: context.userId
      });
      
      throw error;
    }
  }
}
```

### 4. Data Sanitization

#### `LogSanitizationService`

Sanitizes sensitive data in logs.

```typescript
import { LogSanitizationService } from '@/modules/logging/services/log-sanitization.service';

@Injectable()
export class UserService {
  constructor(
    private readonly sanitizationService: LogSanitizationService,
    private readonly loggingService: LoggingService
  ) {}

  async createUser(userData: CreateUserDto) {
    try {
      const user = await this.userRepository.create(userData);
      
      // Sanitize sensitive data before logging
      const sanitizedData = this.sanitizationService.sanitize({
        userId: user.id,
        email: user.email,
        password: user.password, // Will be masked
        ssn: user.ssn // Will be masked
      });
      
      await this.loggingService.info('User created', sanitizedData);
      
      return user;
    } catch (error) {
      await this.loggingService.error('Failed to create user', error, {
        userData: this.sanitizationService.sanitize(userData)
      });
      
      throw error;
    }
  }
}
```

### 5. Business Event Logging

#### `@LogBusinessEvent` Decorator

Decorator for logging business events.

```typescript
import { LogBusinessEvent } from '@/modules/logging/decorators/log-business-event.decorator';

@Injectable()
export class TradingService {
  @LogBusinessEvent('TRADE_CREATED')
  async createTrade(tradeData: CreateTradeDto) {
    // Method implementation
    // Event will be automatically logged
  }

  @LogBusinessEvent('TRADE_EXECUTED')
  async executeTrade(tradeId: string) {
    // Method implementation
    // Event will be automatically logged
  }
}
```

#### `@LogPerformance` Decorator

Decorator for logging performance metrics.

```typescript
import { LogPerformance } from '@/modules/logging/decorators/log-performance.decorator';

@Injectable()
export class PortfolioService {
  @LogPerformance('PORTFOLIO_CALCULATION')
  async calculatePortfolioValue(portfolioId: string) {
    // Method implementation
    // Performance metrics will be automatically logged
  }
}
```

## 🎯 Best Practices

### 1. Sử dụng LoggingService cho tất cả logging

```typescript
// ✅ ĐÚNG - Sử dụng LoggingService
try {
  const result = await service.operation();
  await this.loggingService.info('Operation completed', { result });
} catch (error) {
  await this.loggingService.error('Operation failed', error, { context });
}

// ❌ SAI - Sử dụng console.log
try {
  const result = await service.operation();
  console.log('Operation completed', result);
} catch (error) {
  console.error('Operation failed', error);
}
```

### 2. Cung cấp context đầy đủ

```typescript
// ✅ ĐÚNG - Cung cấp context đầy đủ
await this.loggingService.error('Failed to create portfolio', error, {
  portfolioId: data.id,
  accountId: data.accountId,
  userId: context.userId,
  requestId: context.requestId,
  errorCode: 'PORTFOLIO_CREATE_FAILED'
});

// ❌ SAI - Không cung cấp context
await this.loggingService.error('Failed to create portfolio', error);
```

### 3. Sử dụng error codes

```typescript
// ✅ ĐÚNG - Sử dụng error codes
await this.loggingService.error('Validation failed', error, {
  errorCode: 'VALIDATION_FAILED',
  field: 'email',
  value: userData.email
});

// ❌ SAI - Không sử dụng error codes
await this.loggingService.error('Validation failed', error);
```

### 4. Sanitize sensitive data

```typescript
// ✅ ĐÚNG - Sanitize sensitive data
const sanitizedData = this.sanitizationService.sanitize({
  userId: user.id,
  email: user.email,
  password: user.password, // Will be masked
  ssn: user.ssn // Will be masked
});

await this.loggingService.info('User created', sanitizedData);

// ❌ SAI - Log sensitive data
await this.loggingService.info('User created', {
  userId: user.id,
  email: user.email,
  password: user.password, // Sensitive data exposed
  ssn: user.ssn // Sensitive data exposed
});
```

## 🔧 Code Examples

### Service Error Handling Example

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { LoggingService } from '@/modules/logging/services/logging.service';
import { ContextManager } from '@/modules/logging/services/context-manager.service';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly contextManager: ContextManager,
    private readonly portfolioRepository: PortfolioRepository
  ) {}

  async createPortfolio(data: CreatePortfolioDto) {
    const context = this.contextManager.getContext();
    
    try {
      // Validate input
      if (!data.name || data.name.trim().length === 0) {
        throw new BadRequestException('Portfolio name is required');
      }

      // Check if account exists
      const account = await this.accountService.findOne(data.accountId);
      if (!account) {
        throw new NotFoundException('Account not found');
      }

      // Create portfolio
      const portfolio = await this.portfolioRepository.create(data);
      
      // Log success
      await this.loggingService.info('Portfolio created successfully', {
        portfolioId: portfolio.id,
        accountId: data.accountId,
        portfolioName: data.name,
        requestId: context.requestId,
        userId: context.userId
      });
      
      return portfolio;
    } catch (error) {
      // Log error with context
      await this.loggingService.error('Failed to create portfolio', error, {
        portfolioData: data,
        requestId: context.requestId,
        userId: context.userId,
        errorCode: 'PORTFOLIO_CREATE_FAILED'
      });
      
      throw error;
    }
  }

  async getPortfolio(id: string) {
    const context = this.contextManager.getContext();
    
    try {
      const portfolio = await this.portfolioRepository.findOne(id);
      
      if (!portfolio) {
        throw new NotFoundException('Portfolio not found');
      }
      
      // Log success
      await this.loggingService.info('Portfolio retrieved', {
        portfolioId: id,
        requestId: context.requestId,
        userId: context.userId
      });
      
      return portfolio;
    } catch (error) {
      // Log error
      await this.loggingService.error('Failed to retrieve portfolio', error, {
        portfolioId: id,
        requestId: context.requestId,
        userId: context.userId,
        errorCode: 'PORTFOLIO_RETRIEVE_FAILED'
      });
      
      throw error;
    }
  }
}
```

### Controller Error Handling Example

```typescript
import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { LoggingService } from '@/modules/logging/services/logging.service';
import { ContextManager } from '@/modules/logging/services/context-manager.service';

@Controller('portfolios')
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly loggingService: LoggingService,
    private readonly contextManager: ContextManager
  ) {}

  @Post()
  async create(@Body() createPortfolioDto: CreatePortfolioDto) {
    const context = this.contextManager.getContext();
    
    try {
      const portfolio = await this.portfolioService.createPortfolio(createPortfolioDto);
      
      // Log success
      await this.loggingService.info('Portfolio creation request completed', {
        portfolioId: portfolio.id,
        requestId: context.requestId,
        userId: context.userId
      });
      
      return portfolio;
    } catch (error) {
      // Log error
      await this.loggingService.error('Portfolio creation request failed', error, {
        portfolioData: createPortfolioDto,
        requestId: context.requestId,
        userId: context.userId,
        errorCode: 'PORTFOLIO_CREATE_REQUEST_FAILED'
      });
      
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const context = this.contextManager.getContext();
    
    try {
      const portfolio = await this.portfolioService.getPortfolio(id);
      
      // Log success
      await this.loggingService.info('Portfolio retrieval request completed', {
        portfolioId: id,
        requestId: context.requestId,
        userId: context.userId
      });
      
      return portfolio;
    } catch (error) {
      // Log error
      await this.loggingService.error('Portfolio retrieval request failed', error, {
        portfolioId: id,
        requestId: context.requestId,
        userId: context.userId,
        errorCode: 'PORTFOLIO_RETRIEVE_REQUEST_FAILED'
      });
      
      throw error;
    }
  }
}
```

### Custom Exception Example

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class PortfolioNotFoundException extends HttpException {
  constructor(portfolioId: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Portfolio not found',
        error: 'Portfolio Not Found',
        portfolioId
      },
      HttpStatus.NOT_FOUND
    );
  }
}

// Usage in service
async getPortfolio(id: string) {
  const portfolio = await this.portfolioRepository.findOne(id);
  
  if (!portfolio) {
    throw new PortfolioNotFoundException(id);
  }
  
  return portfolio;
}
```

## 🚨 Common Mistakes

### 1. Không sử dụng LoggingService

```typescript
// ❌ SAI - Sử dụng console.log
try {
  const result = await service.operation();
  console.log('Operation completed', result);
} catch (error) {
  console.error('Operation failed', error);
}

// ✅ ĐÚNG - Sử dụng LoggingService
try {
  const result = await service.operation();
  await this.loggingService.info('Operation completed', { result });
} catch (error) {
  await this.loggingService.error('Operation failed', error, { context });
}
```

### 2. Không cung cấp context

```typescript
// ❌ SAI - Không cung cấp context
await this.loggingService.error('Operation failed', error);

// ✅ ĐÚNG - Cung cấp context
await this.loggingService.error('Operation failed', error, {
  operationId: 'op-123',
  userId: 'user-456',
  requestId: 'req-789'
});
```

### 3. Log sensitive data

```typescript
// ❌ SAI - Log sensitive data
await this.loggingService.info('User created', {
  userId: user.id,
  password: user.password, // Sensitive data
  ssn: user.ssn // Sensitive data
});

// ✅ ĐÚNG - Sanitize sensitive data
const sanitizedData = this.sanitizationService.sanitize({
  userId: user.id,
  password: user.password, // Will be masked
  ssn: user.ssn // Will be masked
});
await this.loggingService.info('User created', sanitizedData);
```

### 4. Không sử dụng error codes

```typescript
// ❌ SAI - Không sử dụng error codes
await this.loggingService.error('Validation failed', error);

// ✅ ĐÚNG - Sử dụng error codes
await this.loggingService.error('Validation failed', error, {
  errorCode: 'VALIDATION_FAILED',
  field: 'email'
});
```

## 📝 Testing Error Handling

### Unit Test Example

```typescript
import { TestHelper } from '@/test/utils/test-helpers';
import { LoggingService } from '@/modules/logging/services/logging.service';

describe('PortfolioService Error Handling', () => {
  let service: PortfolioService;
  let mocks: any;

  beforeAll(async () => {
    const { service: s, mocks: m } = await TestHelper.createServiceTest(
      PortfolioService,
      [LoggingService, ContextManager]
    );
    service = s;
    mocks = m;
  });

  afterAll(async () => {
    await TestHelper.cleanupTest();
  });

  beforeEach(() => {
    TestModuleFactory.resetAllMocks(mocks);
  });

  describe('createPortfolio', () => {
    it('should log error when portfolio creation fails', async () => {
      // Arrange
      const testData = TestHelper.createTestData();
      const createDto = testData.createPortfolioDto;
      const error = new Error('Database connection failed');
      
      mocks.portfolioRepository.create.mockRejectedValue(error);

      // Act
      await expect(service.createPortfolio(createDto)).rejects.toThrow();

      // Assert
      expect(mocks.loggingService.error).toHaveBeenCalledWith(
        'Failed to create portfolio',
        error,
        expect.objectContaining({
          portfolioData: createDto,
          errorCode: 'PORTFOLIO_CREATE_FAILED'
        })
      );
    });

    it('should log success when portfolio creation succeeds', async () => {
      // Arrange
      const testData = TestHelper.createTestData();
      const createDto = testData.createPortfolioDto;
      const portfolio = testData.portfolio;
      
      mocks.portfolioRepository.create.mockResolvedValue(portfolio);

      // Act
      const result = await service.createPortfolio(createDto);

      // Assert
      expect(result).toBe(portfolio);
      expect(mocks.loggingService.info).toHaveBeenCalledWith(
        'Portfolio created successfully',
        expect.objectContaining({
          portfolioId: portfolio.id,
          accountId: createDto.accountId
        })
      );
    });
  });
});
```

---

**Lưu ý**: Tất cả error handling trong hệ thống phải sử dụng các utilities từ logging system. Không được sử dụng console.log hoặc tự xử lý lỗi thủ công.
