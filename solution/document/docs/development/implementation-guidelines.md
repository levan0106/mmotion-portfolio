# Implementation Guidelines for New Features

## Overview
This document provides guidelines for implementing new features in the Portfolio Management System, with a focus on calculation-related features and maintaining consistency with existing patterns.

## Table of Contents
1. [Calculation Service Guidelines](#calculation-service-guidelines)
2. [Database Guidelines](#database-guidelines)
3. [API Guidelines](#api-guidelines)
4. [Frontend Guidelines](#frontend-guidelines)
5. [Testing Guidelines](#testing-guidelines)
6. [Documentation Guidelines](#documentation-guidelines)

## Calculation Service Guidelines

### When to Create New Calculation Services
Create a new calculation service when:
- You need to calculate values that don't fit existing services
- You have complex calculation logic that should be centralized
- You need to support multiple calculation strategies
- You want to provide detailed calculation breakdowns

### Service Structure
```typescript
@Injectable()
export class YourCalculationService {
  constructor(
    // Inject dependencies
  ) {}

  // Main calculation method
  calculateValue(input: InputType, options?: OptionsType): number {
    // Implementation
  }

  // Detailed breakdown method
  calculateValueWithBreakdown(input: InputType, options?: OptionsType): BreakdownType {
    // Implementation
  }

  // Batch calculation method
  calculateMultiple(inputs: InputType[], options?: OptionsType): Map<string, number> {
    // Implementation
  }

  // Static helper methods
  static createOptions(...): OptionsType {
    // Implementation
  }
}
```

### Calculation Rules
1. **Always calculate real-time** - Never store calculated values in database
2. **Use centralized services** - Don't duplicate calculation logic
3. **Support both percentage and fixed values** - Use `TaxFeeOption` interface
4. **Provide detailed breakdowns** - For transparency and debugging
5. **Handle edge cases** - Zero values, negative values, large numbers
6. **Implement error handling** - With fallback mechanisms
7. **Use caching** - For performance optimization

### Example Implementation
```typescript
@Injectable()
export class DividendCalculationService {
  constructor(
    private readonly assetValueCalculator: AssetValueCalculatorService,
    private readonly cacheService: CacheService
  ) {}

  async calculateDividendValue(
    assetId: string, 
    dividendRate: number, 
    options?: DividendCalculationOptions
  ): Promise<number> {
    const cacheKey = `dividend:${assetId}:${dividendRate}`;
    
    return await this.cacheService.getOrCalculate(cacheKey, async () => {
      const asset = await this.getAsset(assetId);
      const baseValue = this.assetValueCalculator.calculateCurrentValue(
        asset.currentQuantity,
        asset.currentPrice
      );
      
      return this.calculateDividend(baseValue, dividendRate, options);
    });
  }

  private calculateDividend(
    baseValue: number, 
    rate: number, 
    options?: DividendCalculationOptions
  ): number {
    const grossDividend = baseValue * (rate / 100);
    
    if (!options) return grossDividend;
    
    // Apply tax and fees
    const taxAmount = this.calculateTaxFeeAmount(grossDividend, options.tax);
    const feeAmount = this.calculateTaxFeeAmount(grossDividend, options.fee);
    
    return Math.max(0, grossDividend - taxAmount - feeAmount);
  }
}
```

## Database Guidelines

### Schema Design
1. **Never store calculated values** - Always calculate real-time
2. **Use proper indexes** - For frequently queried columns
3. **Follow naming conventions** - snake_case for columns, camelCase for properties
4. **Add constraints** - For data integrity
5. **Use appropriate data types** - decimal for money, timestamp for dates

### Migration Guidelines
```typescript
// Example migration for removing calculated value columns
export class RemoveCalculatedValues1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('assets', 'current_value');
    await queryRunner.dropColumn('portfolios', 'total_value');
    await queryRunner.dropColumn('portfolios', 'realized_pl');
    await queryRunner.dropColumn('portfolios', 'unrealized_pl');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('assets', new TableColumn({
      name: 'current_value',
      type: 'decimal',
      precision: 15,
      scale: 2,
      isNullable: true
    }));
    // ... other columns
  }
}
```

### Query Guidelines
```typescript
// Use joins instead of multiple queries
const query = `
  SELECT 
    a.id,
    a.current_quantity,
    COALESCE(ap.current_price, 0) as current_price,
    ga.symbol
  FROM assets a
  LEFT JOIN global_assets ga ON a.symbol = ga.symbol
  LEFT JOIN asset_prices ap ON ga.id = ap.asset_id
  WHERE a.portfolio_id = ?
`;

// Use parameterized queries
const result = await this.repository.query(query, [portfolioId]);
```

## API Guidelines

### Controller Structure
```typescript
@Controller('api/v1/your-feature')
@ApiTags('Your Feature')
export class YourFeatureController {
  constructor(
    private readonly yourService: YourService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get your feature data' })
  @ApiResponse({ status: 200, description: 'Data retrieved successfully' })
  async getData(@Query() query: YourQueryDto): Promise<YourResponseDto> {
    return await this.yourService.getData(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create new item' })
  @ApiResponse({ status: 201, description: 'Item created successfully' })
  async create(@Body() createDto: CreateYourDto): Promise<YourResponseDto> {
    return await this.yourService.create(createDto);
  }
}
```

### DTO Guidelines
```typescript
export class YourCalculationDto {
  @ApiProperty({ description: 'Asset ID', example: 'uuid' })
  @IsUUID()
  assetId: string;

  @ApiProperty({ description: 'Calculation options' })
  @ValidateNested()
  @Type(() => AssetValueCalculationOptions)
  options?: AssetValueCalculationOptions;
}

export class YourResponseDto {
  @ApiProperty({ description: 'Calculated value', example: 100000 })
  value: number;

  @ApiProperty({ description: 'Calculation breakdown' })
  breakdown: CalculationBreakdown;

  @ApiProperty({ description: 'Calculation timestamp' })
  calculatedAt: string;
}
```

### Error Handling
```typescript
@Catch(CalculationError)
export class CalculationExceptionFilter implements ExceptionFilter {
  catch(exception: CalculationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.statusCode;
    const message = exception.message;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
      code: exception.code
    });
  }
}
```

## Frontend Guidelines

### Hook Structure
```typescript
export const useYourCalculation = (assetId: string, options?: CalculationOptions) => {
  return useQuery({
    queryKey: ['your-calculation', assetId, options],
    queryFn: () => yourApiService.calculate(assetId, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
};
```

### Component Structure
```typescript
interface YourCalculationComponentProps {
  assetId: string;
  options?: CalculationOptions;
  onCalculationChange?: (value: number) => void;
}

export const YourCalculationComponent: React.FC<YourCalculationComponentProps> = ({
  assetId,
  options,
  onCalculationChange
}) => {
  const { data, isLoading, error } = useYourCalculation(assetId, options);

  useEffect(() => {
    if (data?.value && onCalculationChange) {
      onCalculationChange(data.value);
    }
  }, [data?.value, onCalculationChange]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="calculation-result">
      <h3>Calculation Result</h3>
      <div className="value">{formatCurrency(data.value)}</div>
      {data.breakdown && (
        <CalculationBreakdown breakdown={data.breakdown} />
      )}
    </div>
  );
};
```

### State Management
```typescript
// Use React Query for server state
const { data: calculations } = useQuery({
  queryKey: ['calculations', portfolioId],
  queryFn: () => calculationApiService.getPortfolioCalculations(portfolioId)
});

// Use local state for UI state
const [selectedOptions, setSelectedOptions] = useState<CalculationOptions>({});
const [showBreakdown, setShowBreakdown] = useState(false);
```

## Testing Guidelines

### Unit Tests
```typescript
describe('YourCalculationService', () => {
  let service: YourCalculationService;
  let mockDependency: jest.Mocked<YourDependency>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourCalculationService,
        {
          provide: YourDependency,
          useValue: mockDependency
        }
      ]
    }).compile();

    service = module.get<YourCalculationService>(YourCalculationService);
  });

  describe('calculateValue', () => {
    it('should calculate basic value', () => {
      const result = service.calculateValue(100, 1000);
      expect(result).toBe(100000);
    });

    it('should handle edge cases', () => {
      expect(service.calculateValue(0, 1000)).toBe(0);
      expect(service.calculateValue(100, 0)).toBe(0);
    });

    it('should apply options correctly', () => {
      const options = {
        tax: { type: 'percentage', value: 10 },
        fee: { type: 'fixed', value: 500 }
      };
      
      const result = service.calculateValue(100, 1000, options);
      expect(result).toBe(89500); // 100000 - 10000 - 500
    });
  });
});
```

### Integration Tests
```typescript
describe('YourCalculationController (Integration)', () => {
  let app: INestApplication;
  let calculationService: YourCalculationService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    calculationService = moduleFixture.get<YourCalculationService>(YourCalculationService);
  });

  it('/api/v1/your-feature (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/your-feature')
      .send({
        assetId: 'test-asset-1',
        options: {
          tax: { type: 'percentage', value: 10 }
        }
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.value).toBeDefined();
        expect(res.body.breakdown).toBeDefined();
      });
  });
});
```

### E2E Tests
```typescript
describe('YourFeature (E2E)', () => {
  it('should calculate values correctly', () => {
    cy.visit('/your-feature');
    
    cy.get('[data-testid="asset-select"]').select('test-asset-1');
    cy.get('[data-testid="tax-input"]').type('10');
    cy.get('[data-testid="calculate-button"]').click();
    
    cy.get('[data-testid="result-value"]').should('contain', '89,500');
    cy.get('[data-testid="breakdown"]').should('be.visible');
  });
});
```

## Documentation Guidelines

### Code Documentation
```typescript
/**
 * Service for calculating your feature values.
 * 
 * This service provides centralized calculation logic for your feature,
 * supporting both percentage and fixed value options.
 * 
 * @example
 * ```typescript
 * const result = await yourCalculationService.calculateValue(
 *   assetId,
 *   { tax: { type: 'percentage', value: 10 } }
 * );
 * ```
 */
@Injectable()
export class YourCalculationService {
  /**
   * Calculate value for your feature
   * @param assetId - Asset identifier
   * @param options - Calculation options
   * @returns Calculated value
   */
  async calculateValue(assetId: string, options?: YourOptions): Promise<number> {
    // Implementation
  }
}
```

### API Documentation
```typescript
@ApiOperation({ 
  summary: 'Calculate your feature value',
  description: 'Calculates the value for your feature with optional tax and fee deductions'
})
@ApiResponse({ 
  status: 200, 
  description: 'Value calculated successfully',
  type: YourCalculationResponseDto
})
@ApiResponse({ 
  status: 400, 
  description: 'Invalid input parameters',
  type: ErrorResponseDto
})
async calculateValue(@Body() dto: YourCalculationDto): Promise<YourCalculationResponseDto> {
  // Implementation
}
```

### README Updates
```markdown
## Your Feature

### Overview
Your feature provides calculation capabilities for...

### Usage
```typescript
import { YourCalculationService } from './your-calculation.service';

const service = new YourCalculationService();
const result = await service.calculateValue(assetId, options);
```

### Configuration
- Tax options: Percentage or fixed value
- Fee options: Percentage or fixed value
- Commission options: Percentage or fixed value

### Examples
See [examples/your-feature-examples.ts](./examples/your-feature-examples.ts)
```

## Code Review Checklist

### Before Submitting PR
- [ ] All calculations use centralized services
- [ ] No calculated values stored in database
- [ ] Proper error handling implemented
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] API documentation updated
- [ ] Frontend components tested
- [ ] Performance considerations addressed
- [ ] Security considerations addressed
- [ ] Code follows existing patterns

### Review Focus Areas
1. **Calculation Logic**: Is it using the right service?
2. **Error Handling**: Are edge cases covered?
3. **Performance**: Are there unnecessary database calls?
4. **Testing**: Is coverage adequate?
5. **Documentation**: Is it clear and complete?
6. **Security**: Are inputs validated?
7. **Consistency**: Does it follow existing patterns?

## Common Pitfalls to Avoid

### ❌ Don't Do This
```typescript
// Don't store calculated values
await this.repository.save({
  ...asset,
  currentValue: calculatedValue // ❌ Never store calculated values
});

// Don't duplicate calculation logic
const value1 = quantity * price - tax; // ❌ Duplicated logic
const value2 = quantity * price - fee; // ❌ Duplicated logic

// Don't ignore error handling
const result = calculateValue(input); // ❌ No error handling
```

### ✅ Do This Instead
```typescript
// Calculate real-time
const currentValue = await this.assetValueCalculator.calculateCurrentValue(
  asset.currentQuantity,
  asset.currentPrice,
  options
);

// Use centralized services
const value1 = this.assetValueCalculator.calculateCurrentValue(quantity, price, { tax });
const value2 = this.assetValueCalculator.calculateCurrentValue(quantity, price, { fee });

// Handle errors properly
try {
  const result = await this.calculateValue(input);
  return result;
} catch (error) {
  this.logger.error('Calculation failed', error);
  throw new CalculationError('Failed to calculate value');
}
```

## Conclusion

Following these guidelines ensures:
- **Consistency** across all features
- **Maintainability** of the codebase
- **Performance** optimization
- **Reliability** of calculations
- **Testability** of components
- **Documentation** completeness

Always refer to existing implementations for examples and patterns, and don't hesitate to ask for code reviews to ensure adherence to these guidelines.
