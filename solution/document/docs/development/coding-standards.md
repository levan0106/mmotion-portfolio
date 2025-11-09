# Coding Standards for Portfolio Management System

## Overview
This document defines the coding standards and best practices for the Portfolio Management System, with a focus on calculation-related code and maintaining consistency across the codebase.

## Table of Contents
1. [General Standards](#general-standards)
2. [Calculation Service Standards](#calculation-service-standards)
3. [Database Standards](#database-standards)
4. [API Standards](#api-standards)
5. [Frontend Standards](#frontend-standards)
6. [Testing Standards](#testing-standards)
7. [Documentation Standards](#documentation-standards)

## General Standards

### TypeScript Standards
- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Define explicit types for all variables and functions
- **Interfaces**: Use interfaces for object shapes, types for unions
- **Enums**: Use enums for fixed sets of values
- **Generics**: Use generics for reusable components

```typescript
// ✅ Good
interface AssetValueCalculationOptions {
  tax?: TaxFeeOption | number;
  fee?: TaxFeeOption | number;
}

// ❌ Bad
const options = {
  tax: 10,
  fee: 500
};
```

### Naming Conventions
- **PascalCase**: Classes, interfaces, enums, types
- **camelCase**: Variables, functions, methods, properties
- **UPPER_SNAKE_CASE**: Constants
- **kebab-case**: File names, URLs, CSS classes

```typescript
// ✅ Good
class AssetValueCalculatorService {}
interface CalculationBreakdown {}
const MAX_RETRY_ATTEMPTS = 3;
const calculationOptions: AssetValueCalculationOptions = {};

// ❌ Bad
class assetValueCalculatorService {}
interface calculationBreakdown {}
const maxRetryAttempts = 3;
const calculation_options = {};
```

### Code Organization
- **Single Responsibility**: Each class/function should have one purpose
- **Dependency Injection**: Use constructor injection for dependencies
- **Error Handling**: Always handle errors appropriately
- **Logging**: Log important events and errors

```typescript
// ✅ Good
@Injectable()
export class AssetValueCalculatorService {
  constructor(
    private readonly logger: Logger,
    private readonly cacheService: CacheService
  ) {}

  calculateCurrentValue(quantity: number, price: number, options?: AssetValueCalculationOptions): number {
    try {
      this.logger.debug('Starting calculation', { quantity, price, options });
      
      if (!this.validateInputs(quantity, price)) {
        throw new InvalidInputError('Invalid input parameters');
      }

      const result = this.performCalculation(quantity, price, options);
      
      this.logger.debug('Calculation completed', { result });
      return result;
    } catch (error) {
      this.logger.error('Calculation failed', error);
      throw error;
    }
  }
}
```

## Calculation Service Standards

### Service Structure
```typescript
@Injectable()
export class YourCalculationService {
  // Private properties
  private readonly logger = new Logger(YourCalculationService.name);
  
  // Constructor with dependency injection
  constructor(
    private readonly dependency: YourDependency
  ) {}

  // Public methods
  public async calculateValue(input: InputType, options?: OptionsType): Promise<number> {
    // Implementation
  }

  // Private helper methods
  private validateInput(input: InputType): void {
    // Validation logic
  }

  // Static helper methods
  public static createOptions(...): OptionsType {
    // Factory method
  }
}
```

### Calculation Method Standards
1. **Always validate inputs** before calculation
2. **Use centralized calculation logic** - don't duplicate
3. **Handle edge cases** - zero values, negative values, large numbers
4. **Provide detailed breakdowns** for transparency
5. **Use caching** for performance optimization
6. **Log calculation details** for debugging

```typescript
// ✅ Good
public calculateCurrentValue(
  quantity: number, 
  currentPrice: number, 
  options?: AssetValueCalculationOptions
): number {
  // Validate inputs
  if (!this.validateInputs(quantity, currentPrice)) {
    throw new InvalidInputError('Invalid input parameters');
  }

  // Calculate base value
  const baseValue = quantity * currentPrice;
  
  if (!options) {
    return baseValue;
  }

  // Apply deductions
  const deductions = this.calculateDeductions(baseValue, options);
  const result = Math.max(0, baseValue - deductions);
  
  this.logger.debug('Calculation completed', {
    quantity,
    currentPrice,
    baseValue,
    deductions,
    result
  });
  
  return result;
}

private validateInputs(quantity: number, currentPrice: number): boolean {
  return quantity >= 0 && currentPrice >= 0 && 
         quantity <= 1000000 && currentPrice <= 1000000;
}
```

### Error Handling Standards
```typescript
// Custom error classes
export class CalculationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'CalculationError';
  }
}

export class InvalidInputError extends CalculationError {
  constructor(message: string) {
    super(message, 'INVALID_INPUT');
  }
}

// Error handling in services
try {
  const result = await this.calculateValue(input);
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    this.logger.warn('Validation failed', { input, error: error.message });
    throw new InvalidInputError('Invalid input parameters');
  }
  
  this.logger.error('Calculation failed', { input, error });
  throw new CalculationError('Failed to calculate value', 'CALCULATION_FAILED');
}
```

## Database Standards

### Entity Standards
```typescript
@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  symbol: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  currentQuantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Repository Standards
```typescript
@Injectable()
export class AssetRepository {
  constructor(
    @InjectRepository(Asset)
    private readonly repository: Repository<Asset>
  ) {}

  async findById(id: string): Promise<Asset | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findBySymbol(symbol: string): Promise<Asset | null> {
    return await this.repository.findOne({ where: { symbol } });
  }

  async findWithPrices(portfolioId: string): Promise<Asset[]> {
    return await this.repository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.globalAsset', 'globalAsset')
      .leftJoinAndSelect('globalAsset.assetPrice', 'assetPrice')
      .where('asset.portfolioId = :portfolioId', { portfolioId })
      .getMany();
  }
}
```

### Query Standards
```typescript
// Use parameterized queries
const query = `
  SELECT 
    a.id,
    a.current_quantity,
    COALESCE(ap.current_price, 0) as current_price
  FROM assets a
  LEFT JOIN global_assets ga ON a.symbol = ga.symbol
  LEFT JOIN asset_prices ap ON ga.id = ap.asset_id
  WHERE a.portfolio_id = $1
`;

const result = await this.repository.query(query, [portfolioId]);

// Use TypeORM query builder for complex queries
const assets = await this.repository
  .createQueryBuilder('asset')
  .leftJoin('asset.globalAsset', 'globalAsset')
  .leftJoin('globalAsset.assetPrice', 'assetPrice')
  .select([
    'asset.id',
    'asset.currentQuantity',
    'assetPrice.currentPrice'
  ])
  .where('asset.portfolioId = :portfolioId', { portfolioId })
  .getMany();
```

## API Standards

### Controller Standards
```typescript
@Controller('api/v1/assets')
@ApiTags('Assets')
export class AssetController {
  constructor(
    private readonly assetService: AssetService
  ) {}

  @Get(':id/calculate-value')
  @ApiOperation({ summary: 'Calculate asset value' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Value calculated successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async calculateValue(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() options: AssetValueCalculationOptions
  ): Promise<AssetValueResponseDto> {
    return await this.assetService.calculateValue(id, options);
  }
}
```

### DTO Standards
```typescript
export class AssetValueCalculationOptions {
  @ApiProperty({ description: 'Tax options', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => TaxFeeOption)
  tax?: TaxFeeOption;

  @ApiProperty({ description: 'Fee options', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => TaxFeeOption)
  fee?: TaxFeeOption;
}

export class AssetValueResponseDto {
  @ApiProperty({ description: 'Calculated value', example: 100000 })
  value: number;

  @ApiProperty({ description: 'Calculation breakdown' })
  breakdown: CalculationBreakdown;

  @ApiProperty({ description: 'Calculation timestamp' })
  calculatedAt: string;
}
```

### Validation Standards
```typescript
export class TaxFeeOption {
  @ApiProperty({ description: 'Type of calculation', enum: ['percentage', 'fixed'] })
  @IsEnum(['percentage', 'fixed'])
  type: 'percentage' | 'fixed';

  @ApiProperty({ description: 'Value for calculation', example: 10 })
  @IsNumber()
  @Min(0)
  @Max(1000000)
  value: number;
}
```

## Frontend Standards

### Component Standards
```typescript
interface AssetValueCalculatorProps {
  assetId: string;
  options?: AssetValueCalculationOptions;
  onValueChange?: (value: number) => void;
}

export const AssetValueCalculator: React.FC<AssetValueCalculatorProps> = ({
  assetId,
  options,
  onValueChange
}) => {
  const { data, isLoading, error } = useAssetValueCalculation(assetId, options);

  useEffect(() => {
    if (data?.value && onValueChange) {
      onValueChange(data.value);
    }
  }, [data?.value, onValueChange]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="asset-value-calculator">
      <h3>Asset Value</h3>
      <div className="value">{formatCurrency(data.value)}</div>
      {data.breakdown && (
        <CalculationBreakdown breakdown={data.breakdown} />
      )}
    </div>
  );
};
```

### Hook Standards
```typescript
export const useAssetValueCalculation = (
  assetId: string, 
  options?: AssetValueCalculationOptions
) => {
  return useQuery({
    queryKey: ['asset-value', assetId, options],
    queryFn: () => assetApiService.calculateValue(assetId, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};
```

### State Management Standards
```typescript
// Use React Query for server state
const { data: calculations } = useQuery({
  queryKey: ['calculations', portfolioId],
  queryFn: () => calculationApiService.getPortfolioCalculations(portfolioId)
});

// Use local state for UI state
const [selectedOptions, setSelectedOptions] = useState<AssetValueCalculationOptions>({});
const [showBreakdown, setShowBreakdown] = useState(false);

// Use context for shared state
const { user } = useUser();
const { portfolio } = usePortfolio();
```

## Testing Standards

### Unit Test Standards
```typescript
describe('AssetValueCalculatorService', () => {
  let service: AssetValueCalculatorService;
  let mockCacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetValueCalculatorService,
        {
          provide: CacheService,
          useValue: mockCacheService
        }
      ]
    }).compile();

    service = module.get<AssetValueCalculatorService>(AssetValueCalculatorService);
  });

  describe('calculateCurrentValue', () => {
    it('should calculate basic value correctly', () => {
      const result = service.calculateCurrentValue(100, 1000);
      expect(result).toBe(100000);
    });

    it('should handle edge cases', () => {
      expect(service.calculateCurrentValue(0, 1000)).toBe(0);
      expect(service.calculateCurrentValue(100, 0)).toBe(0);
    });

    it('should apply options correctly', () => {
      const options = {
        tax: { type: 'percentage', value: 10 },
        fee: { type: 'fixed', value: 500 }
      };
      
      const result = service.calculateCurrentValue(100, 1000, options);
      expect(result).toBe(89500);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => service.calculateCurrentValue(-1, 1000)).toThrow(InvalidInputError);
      expect(() => service.calculateCurrentValue(100, -1)).toThrow(InvalidInputError);
    });
  });
});
```

### Integration Test Standards
```typescript
describe('AssetController (Integration)', () => {
  let app: INestApplication;
  let assetService: AssetService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    assetService = moduleFixture.get<AssetService>(AssetService);
  });

  it('/api/v1/assets/:id/calculate-value (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/assets/test-asset-1/calculate-value')
      .query({
        tax: JSON.stringify({ type: 'percentage', value: 10 }),
        fee: JSON.stringify({ type: 'fixed', value: 500 })
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.value).toBeDefined();
        expect(res.body.breakdown).toBeDefined();
        expect(res.body.calculatedAt).toBeDefined();
      });
  });
});
```

### E2E Test Standards
```typescript
describe('Asset Value Calculator (E2E)', () => {
  it('should calculate asset value correctly', () => {
    cy.visit('/assets/test-asset-1');
    
    cy.get('[data-testid="tax-input"]').type('10');
    cy.get('[data-testid="fee-input"]').type('500');
    cy.get('[data-testid="calculate-button"]').click();
    
    cy.get('[data-testid="result-value"]').should('contain', '89,500');
    cy.get('[data-testid="breakdown"]').should('be.visible');
  });
});
```

## Documentation Standards

### Code Documentation
```typescript
/**
 * Service for calculating asset values with various deductions.
 * 
 * This service provides centralized calculation logic for asset values,
 * supporting both percentage and fixed value options for tax, fee,
 * commission, and other deductions.
 * 
 * @example
 * ```typescript
 * const service = new AssetValueCalculatorService();
 * const value = service.calculateCurrentValue(100, 1000, {
 *   tax: { type: 'percentage', value: 10 },
 *   fee: { type: 'fixed', value: 500 }
 * });
 * // Result: 89500
 * ```
 */
@Injectable()
export class AssetValueCalculatorService {
  /**
   * Calculate current value of an asset with optional deductions
   * @param quantity - Current quantity of the asset
   * @param currentPrice - Current price per unit
   * @param options - Optional calculation options (tax, fee, etc.)
   * @returns Calculated current value
   * @throws {InvalidInputError} When inputs are invalid
   * @throws {CalculationError} When calculation fails
   */
  calculateCurrentValue(
    quantity: number, 
    currentPrice: number, 
    options?: AssetValueCalculationOptions
  ): number {
    // Implementation
  }
}
```

### API Documentation
```typescript
@ApiOperation({ 
  summary: 'Calculate asset value',
  description: 'Calculates the current value of an asset with optional tax and fee deductions'
})
@ApiParam({ 
  name: 'id', 
  description: 'Asset ID', 
  example: '550e8400-e29b-41d4-a716-446655440000' 
})
@ApiQuery({ 
  name: 'tax', 
  description: 'Tax options (percentage or fixed)', 
  required: false,
  example: '{"type": "percentage", "value": 10}'
})
@ApiResponse({ 
  status: 200, 
  description: 'Value calculated successfully',
  type: AssetValueResponseDto
})
@ApiResponse({ 
  status: 400, 
  description: 'Invalid input parameters',
  type: ErrorResponseDto
})
@ApiResponse({ 
  status: 404, 
  description: 'Asset not found',
  type: ErrorResponseDto
})
async calculateValue(
  @Param('id', ParseUUIDPipe) id: string,
  @Query() options: AssetValueCalculationOptions
): Promise<AssetValueResponseDto> {
  // Implementation
}
```

## Performance Standards

### Caching Standards
```typescript
// Use caching for expensive calculations
async calculateValue(assetId: string, options: CalculationOptions): Promise<number> {
  const cacheKey = `calculation:${assetId}:${JSON.stringify(options)}`;
  
  return await this.cacheService.getOrCalculate(cacheKey, async () => {
    return await this.performCalculation(assetId, options);
  }, 5 * 60 * 1000); // 5 minutes TTL
}
```

### Database Optimization
```typescript
// Use joins instead of multiple queries
const assets = await this.repository
  .createQueryBuilder('asset')
  .leftJoinAndSelect('asset.globalAsset', 'globalAsset')
  .leftJoinAndSelect('globalAsset.assetPrice', 'assetPrice')
  .where('asset.portfolioId = :portfolioId', { portfolioId })
  .getMany();

// Use indexes for frequently queried columns
@Entity('assets')
@Index(['portfolioId', 'symbol'])
@Index(['createdAt'])
export class Asset {
  // Entity definition
}
```

## Security Standards

### Input Validation
```typescript
// Always validate inputs
private validateInputs(quantity: number, currentPrice: number): void {
  if (quantity < 0 || quantity > 1000000) {
    throw new InvalidInputError('Quantity must be between 0 and 1,000,000');
  }
  
  if (currentPrice < 0 || currentPrice > 1000000) {
    throw new InvalidInputError('Price must be between 0 and 1,000,000');
  }
}
```

### Data Sanitization
```typescript
// Sanitize user inputs
private sanitizeOptions(options: AssetValueCalculationOptions): AssetValueCalculationOptions {
  return {
    tax: this.sanitizeTaxFeeOption(options.tax),
    fee: this.sanitizeTaxFeeOption(options.fee),
    commission: this.sanitizeTaxFeeOption(options.commission)
  };
}

private sanitizeTaxFeeOption(option: TaxFeeOption | undefined): TaxFeeOption | undefined {
  if (!option) return undefined;
  
  return {
    type: option.type,
    value: Math.max(0, Math.min(option.value, 1000000))
  };
}
```

## Conclusion

Following these standards ensures:
- **Consistency** across the codebase
- **Maintainability** of the code
- **Performance** optimization
- **Security** best practices
- **Testability** of components
- **Documentation** completeness

Always refer to existing code for examples and patterns, and don't hesitate to ask for code reviews to ensure adherence to these standards.
