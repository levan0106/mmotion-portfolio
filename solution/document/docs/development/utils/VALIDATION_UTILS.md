# Validation Utils - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Validation Utils cung cấp các functions để validate dữ liệu đầu vào một cách nhất quán trong toàn bộ hệ thống. Tất cả validation phải sử dụng các functions từ `test/utils/test-environment.utils.ts`.

## 🎯 Mục Tiêu

- **Data Integrity**: Đảm bảo tính toàn vẹn dữ liệu
- **Security**: Ngăn chặn dữ liệu không hợp lệ
- **User Experience**: Cung cấp feedback rõ ràng cho user
- **Consistency**: Đảm bảo validation nhất quán

## 📚 Danh Sách Functions

### 1. UUID Validation

#### `isValidUUID(uuid: string): boolean`

Validates UUID format.

```typescript
import { testUtils } from '@/test/utils/test-helpers';

// Basic usage
testUtils.validation.isValidUUID('550e8400-e29b-41d4-a716-446655440000') // true
testUtils.validation.isValidUUID('not-a-uuid') // false
testUtils.validation.isValidUUID('') // false

// In service
async findPortfolio(id: string) {
  if (!testUtils.validation.isValidUUID(id)) {
    throw new BadRequestException('Invalid portfolio ID format');
  }
  // ... rest of the logic
}
```

**Supported UUID versions:**
- UUID v1, v3, v4, v5
- Case insensitive
- Standard format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 2. Email Validation

#### `isValidEmail(email: string): boolean`

Validates email format.

```typescript
import { testUtils } from '@/test/utils/test-helpers';

// Basic usage
testUtils.validation.isValidEmail('user@example.com') // true
testUtils.validation.isValidEmail('invalid-email') // false
testUtils.validation.isValidEmail('') // false

// In DTO validation
export class CreateUserDto {
  @IsEmail()
  email: string;

  // Custom validation using utils
  @ValidateIf((o) => o.email)
  @CustomValidation('email', (value) => testUtils.validation.isValidEmail(value))
  emailFormat: string;
}
```

**Email format requirements:**
- Must contain @ symbol
- Must have valid domain
- Must have valid local part
- Case sensitive

### 3. Currency Validation

#### `isValidCurrency(currency: string): boolean`

Validates currency code.

```typescript
import { testUtils } from '@/test/utils/test-helpers';

// Basic usage
testUtils.validation.isValidCurrency('VND') // true
testUtils.validation.isValidCurrency('USD') // true
testUtils.validation.isValidCurrency('INVALID') // false

// In service
async createTrade(data: CreateTradeDto) {
  if (!testUtils.validation.isValidCurrency(data.currency)) {
    throw new BadRequestException('Invalid currency code');
  }
  // ... rest of the logic
}
```

**Supported currencies:**
- VND, USD, EUR, GBP, JPY, CNY, KRW
- SGD, THB, IDR, MYR, PHP, INR
- AUD, CAD, CHF, NZD

### 4. Date Validation

#### `isValidDate(date: Date): boolean`

Validates date object.

```typescript
import { testUtils } from '@/test/utils/test-helpers';

// Basic usage
testUtils.validation.isValidDate(new Date()) // true
testUtils.validation.isValidDate(new Date('invalid')) // false
testUtils.validation.isValidDate(null) // false

// In service
async getPortfolioPerformance(startDate: Date, endDate: Date) {
  if (!testUtils.validation.isValidDate(startDate)) {
    throw new BadRequestException('Invalid start date');
  }
  if (!testUtils.validation.isValidDate(endDate)) {
    throw new BadRequestException('Invalid end date');
  }
  // ... rest of the logic
}
```

**Date validation criteria:**
- Must be a valid Date object
- Must not be Invalid Date
- Must not be null or undefined

### 5. Number Validation

#### `isPositiveNumber(value: any): boolean`

Validates positive numbers.

```typescript
import { testUtils } from '@/test/utils/test-helpers';

// Basic usage
testUtils.validation.isPositiveNumber(5) // true
testUtils.validation.isPositiveNumber(-5) // false
testUtils.validation.isPositiveNumber(0) // false
testUtils.validation.isPositiveNumber('5') // false (string)
testUtils.validation.isPositiveNumber(null) // false

// In service
async updatePortfolioValue(portfolioId: string, value: number) {
  if (!testUtils.validation.isPositiveNumber(value)) {
    throw new BadRequestException('Value must be a positive number');
  }
  // ... rest of the logic
}
```

**Number validation criteria:**
- Must be a number type
- Must be greater than 0
- Must not be NaN or Infinity

## 🎯 Advanced Validation Functions

### 1. Portfolio Structure Validation

#### `validatePortfolioStructure(portfolio: any): boolean`

Validates portfolio object structure.

```typescript
import { testUtils } from '@/test/utils/test-helpers';

// Basic usage
const portfolio = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'My Portfolio',
  accountId: '550e8400-e29b-41d4-a716-446655440001',
  createdAt: new Date(),
  updatedAt: new Date()
};

testUtils.validation.validatePortfolioStructure(portfolio) // true

// In service
async createPortfolio(data: any) {
  if (!testUtils.validation.validatePortfolioStructure(data)) {
    throw new BadRequestException('Invalid portfolio structure');
  }
  // ... rest of the logic
}
```

### 2. Account Structure Validation

#### `validateAccountStructure(account: any): boolean`

Validates account object structure.

```typescript
import { testUtils } from '@/test/utils/test-helpers';

// Basic usage
const account = {
  accountId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@example.com',
  baseCurrency: 'VND'
};

testUtils.validation.validateAccountStructure(account) // true
```

## 🔧 Integration với Class Validator

### Custom Validation Decorator

```typescript
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { testUtils } from '@/test/utils/test-helpers';

export function IsValidUUID(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidUUID',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return testUtils.validation.isValidUUID(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Invalid UUID format';
        }
      }
    });
  };
}

// Usage in DTO
export class CreatePortfolioDto {
  @IsValidUUID()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
```

### Custom Validation Pipe

```typescript
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { testUtils } from '@/test/utils/test-helpers';

@Injectable()
export class UUIDValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!testUtils.validation.isValidUUID(value)) {
      throw new BadRequestException('Invalid UUID format');
    }
    return value;
  }
}

// Usage in controller
@Controller('portfolios')
export class PortfolioController {
  @Get(':id')
  async findOne(@Param('id', UUIDValidationPipe) id: string) {
    return this.portfolioService.findOne(id);
  }
}
```

## 🎯 Best Practices

### 1. Validate Early và Often

```typescript
// ✅ ĐÚNG - Validate ở nhiều layer
@Controller('portfolios')
export class PortfolioController {
  @Post()
  async create(@Body() createPortfolioDto: CreatePortfolioDto) {
    // DTO validation (automatic)
    // Service validation (manual)
    if (!testUtils.validation.isValidUUID(createPortfolioDto.accountId)) {
      throw new BadRequestException('Invalid account ID');
    }
    
    return this.portfolioService.create(createPortfolioDto);
  }
}

// ❌ SAI - Chỉ validate ở một layer
@Controller('portfolios')
export class PortfolioController {
  @Post()
  async create(@Body() createPortfolioDto: CreatePortfolioDto) {
    // Chỉ dựa vào DTO validation
    return this.portfolioService.create(createPortfolioDto);
  }
}
```

### 2. Sử dụng Validation Utils thay vì Regex

```typescript
// ✅ ĐÚNG - Sử dụng validation utils
if (!testUtils.validation.isValidEmail(email)) {
  throw new BadRequestException('Invalid email format');
}

// ❌ SAI - Sử dụng regex thủ công
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new BadRequestException('Invalid email format');
}
```

### 3. Provide Clear Error Messages

```typescript
// ✅ ĐÚNG - Error message rõ ràng
if (!testUtils.validation.isValidUUID(id)) {
  throw new BadRequestException('Portfolio ID must be a valid UUID format');
}

// ❌ SAI - Error message không rõ ràng
if (!testUtils.validation.isValidUUID(id)) {
  throw new BadRequestException('Invalid ID');
}
```

### 4. Validate Business Rules

```typescript
// ✅ ĐÚNG - Validate business rules
async createTrade(data: CreateTradeDto) {
  // Basic validation
  if (!testUtils.validation.isValidUUID(data.portfolioId)) {
    throw new BadRequestException('Invalid portfolio ID');
  }
  
  if (!testUtils.validation.isPositiveNumber(data.quantity)) {
    throw new BadRequestException('Quantity must be positive');
  }
  
  // Business rule validation
  if (data.quantity > 1000000) {
    throw new BadRequestException('Quantity exceeds maximum limit');
  }
  
  // ... rest of the logic
}
```

## 🔧 Code Examples

### Service Validation Example

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { testUtils } from '@/test/utils/test-helpers';

@Injectable()
export class PortfolioService {
  async createPortfolio(data: CreatePortfolioDto) {
    // Validate account ID
    if (!testUtils.validation.isValidUUID(data.accountId)) {
      throw new BadRequestException('Invalid account ID format');
    }
    
    // Validate portfolio name
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException('Portfolio name is required');
    }
    
    // Check if account exists
    const account = await this.accountService.findOne(data.accountId);
    if (!account) {
      throw new BadRequestException('Account not found');
    }
    
    // Create portfolio
    return this.portfolioRepository.create(data);
  }
  
  async updatePortfolioValue(portfolioId: string, value: number) {
    // Validate portfolio ID
    if (!testUtils.validation.isValidUUID(portfolioId)) {
      throw new BadRequestException('Invalid portfolio ID format');
    }
    
    // Validate value
    if (!testUtils.validation.isPositiveNumber(value)) {
      throw new BadRequestException('Value must be a positive number');
    }
    
    // Update portfolio
    return this.portfolioRepository.update(portfolioId, { value });
  }
}
```

### Controller Validation Example

```typescript
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { testUtils } from '@/test/utils/test-helpers';

@Controller('portfolios')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}
  
  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (!testUtils.validation.isValidUUID(id)) {
      throw new BadRequestException('Invalid portfolio ID format');
    }
    
    return this.portfolioService.findOne(id);
  }
  
  @Get()
  async findAll(@Query('accountId') accountId?: string) {
    if (accountId && !testUtils.validation.isValidUUID(accountId)) {
      throw new BadRequestException('Invalid account ID format');
    }
    
    return this.portfolioService.findAll(accountId);
  }
}
```

### Frontend Validation Example

```typescript
import { testUtils } from '@/test/utils/test-helpers';

export const PortfolioForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    accountId: '',
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const validateForm = () => {
    const newErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Portfolio name is required';
    }
    
    // Validate account ID
    if (!testUtils.validation.isValidUUID(formData.accountId)) {
      newErrors.accountId = 'Invalid account ID format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Submit form
      onSubmit(formData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        placeholder="Portfolio name"
      />
      {errors.name && <span className="error">{errors.name}</span>}
      
      <input
        type="text"
        value={formData.accountId}
        onChange={(e) => setFormData({...formData, accountId: e.target.value})}
        placeholder="Account ID"
      />
      {errors.accountId && <span className="error">{errors.accountId}</span>}
      
      <button type="submit">Create Portfolio</button>
    </form>
  );
};
```

## 🚨 Common Mistakes

### 1. Không validate input

```typescript
// ❌ SAI - Không validate input
async findPortfolio(id: string) {
  return this.portfolioRepository.findOne(id);
}

// ✅ ĐÚNG - Validate input
async findPortfolio(id: string) {
  if (!testUtils.validation.isValidUUID(id)) {
    throw new BadRequestException('Invalid portfolio ID format');
  }
  return this.portfolioRepository.findOne(id);
}
```

### 2. Validate không đầy đủ

```typescript
// ❌ SAI - Chỉ validate một phần
async createTrade(data: CreateTradeDto) {
  if (!testUtils.validation.isValidUUID(data.portfolioId)) {
    throw new BadRequestException('Invalid portfolio ID');
  }
  // Thiếu validation cho quantity, price, etc.
}

// ✅ ĐÚNG - Validate đầy đủ
async createTrade(data: CreateTradeDto) {
  if (!testUtils.validation.isValidUUID(data.portfolioId)) {
    throw new BadRequestException('Invalid portfolio ID');
  }
  
  if (!testUtils.validation.isPositiveNumber(data.quantity)) {
    throw new BadRequestException('Quantity must be positive');
  }
  
  if (!testUtils.validation.isPositiveNumber(data.price)) {
    throw new BadRequestException('Price must be positive');
  }
}
```

### 3. Error message không rõ ràng

```typescript
// ❌ SAI - Error message không rõ ràng
if (!testUtils.validation.isValidUUID(id)) {
  throw new BadRequestException('Invalid');
}

// ✅ ĐÚNG - Error message rõ ràng
if (!testUtils.validation.isValidUUID(id)) {
  throw new BadRequestException('Portfolio ID must be a valid UUID format');
}
```

## 📝 Testing

### Unit Test Example

```typescript
import { testUtils } from '@/test/utils/test-helpers';

describe('Validation Utils', () => {
  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(testUtils.validation.isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });
    
    it('should reject invalid UUIDs', () => {
      expect(testUtils.validation.isValidUUID('not-a-uuid')).toBe(false);
      expect(testUtils.validation.isValidUUID('')).toBe(false);
      expect(testUtils.validation.isValidUUID(null)).toBe(false);
    });
  });
  
  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(testUtils.validation.isValidEmail('user@example.com')).toBe(true);
    });
    
    it('should reject invalid emails', () => {
      expect(testUtils.validation.isValidEmail('invalid-email')).toBe(false);
      expect(testUtils.validation.isValidEmail('')).toBe(false);
    });
  });
});
```

---

**Lưu ý**: Tất cả validation trong hệ thống phải sử dụng các functions từ `testUtils.validation`. Không được tự viết validation logic thủ công.
