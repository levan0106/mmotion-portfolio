# Trading System - Testing Guide

This document provides comprehensive information about testing the Trading System, including how to run tests, understand coverage, and contribute to the test suite.

## 📋 Table of Contents

- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Test Categories](#test-categories)
- [Writing Tests](#writing-tests)
- [Troubleshooting](#troubleshooting)

## 🏗️ Test Structure

The trading system has a comprehensive test suite organized as follows:

```
my_project/
├── src/
│   └── modules/
│       └── trading/
│           ├── __tests__/
│           │   └── integration/
│           │       └── trading.integration.spec.ts
│           ├── controllers/
│           │   └── __tests__/
│           ├── services/
│           │   └── __tests__/
│           ├── engines/
│           │   └── __tests__/
│           ├── managers/
│           │   └── __tests__/
│           └── repositories/
│               └── __tests__/
├── frontend/
│   └── src/
│       └── components/
│           └── Trading/
│               └── __tests__/
└── test/
    ├── setup.ts
    ├── jest-integration.json
    └── jest-e2e.json
```

## 🚀 Running Tests

### Prerequisites

1. **Node.js**: Version 18 or higher
2. **npm**: Version 8 or higher
3. **Database**: PostgreSQL (for integration tests)

### Quick Start

#### Option 1: Run All Tests (Recommended)
```bash
# Using PowerShell (Windows)
.\scripts\run-tests.ps1

# Using Bash (Linux/Mac)
./scripts/run-tests.sh
```

#### Option 2: Run Tests Individually

**Backend Unit Tests:**
```bash
npm run test
npm run test:cov  # With coverage
```

**Backend Integration Tests:**
```bash
npm run test:integration
```

**Frontend Tests:**
```bash
cd frontend
npm test
npm run test:coverage  # With coverage
```

**All Tests:**
```bash
npm run test:all
npm run test:all:coverage  # With coverage
```

### Test Script Options

The PowerShell script supports several options:

```powershell
# Skip dependency installation
.\scripts\run-tests.ps1 -SkipInstall

# Run only unit tests
.\scripts\run-tests.ps1 -UnitOnly

# Run only integration tests
.\scripts\run-tests.ps1 -IntegrationOnly

# Run only frontend tests
.\scripts\run-tests.ps1 -FrontendOnly
```

## 📊 Test Coverage

### Coverage Requirements

- **Statements**: 80% minimum
- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

### Coverage Reports

After running tests, coverage reports are generated in:

- **Backend Unit Tests**: `coverage/index.html`
- **Backend Integration Tests**: `coverage-integration/index.html`
- **Frontend Tests**: `frontend/coverage/index.html`
- **Combined Report**: `coverage/index.html`

### Viewing Coverage

1. Open the HTML files in your browser
2. Navigate through the file tree to see detailed coverage
3. Click on files to see line-by-line coverage

## 🧪 Test Categories

### 1. Unit Tests

**Purpose**: Test individual components in isolation

**Location**: `src/**/*.spec.ts`

**Examples**:
- `TradingService` methods
- `FIFOEngine` matching logic
- `PositionManager` calculations
- `RiskManager` validation

**Key Features**:
- Fast execution
- Mocked dependencies
- Isolated testing
- High coverage

### 2. Integration Tests

**Purpose**: Test complete workflows and component interactions

**Location**: `src/**/*.integration.spec.ts`

**Examples**:
- Complete trade creation workflow
- FIFO/LIFO matching with database
- Position updates after trades
- Risk monitoring end-to-end

**Key Features**:
- Real database interactions
- Full workflow testing
- Transaction testing
- Error handling

### 3. Component Tests (Frontend)

**Purpose**: Test React components and user interactions

**Location**: `frontend/src/**/*.test.tsx`

**Examples**:
- `TradeForm` validation
- `TradeList` filtering
- `Trading` page navigation
- User interactions

**Key Features**:
- Component rendering
- User event simulation
- Hook testing
- Responsive behavior

## ✍️ Writing Tests

### Backend Test Structure

```typescript
describe('ComponentName', () => {
  let component: ComponentName;
  let mockDependency: MockType;

  beforeEach(async () => {
    // Setup
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComponentName,
        { provide: Dependency, useValue: mockDependency },
      ],
    }).compile();

    component = module.get<ComponentName>(ComponentName);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      const input = 'test';
      mockDependency.method.mockResolvedValue('result');

      // Act
      const result = await component.methodName(input);

      // Assert
      expect(result).toBe('expected');
      expect(mockDependency.method).toHaveBeenCalledWith(input);
    });

    it('should handle error case', async () => {
      // Arrange
      const input = 'invalid';
      mockDependency.method.mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(component.methodName(input)).rejects.toThrow('Test error');
    });
  });
});
```

### Frontend Test Structure

```typescript
describe('ComponentName', () => {
  const defaultProps = {
    // Default props
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    render(
      <TestWrapper>
        <ComponentName {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const mockHandler = jest.fn();

    render(
      <TestWrapper>
        <ComponentName {...defaultProps} onAction={mockHandler} />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /action/i });
    await user.click(button);

    expect(mockHandler).toHaveBeenCalled();
  });
});
```

### Test Naming Conventions

- **Describe blocks**: Use component/class name
- **Test cases**: Use "should [expected behavior] when [condition]"
- **Mock variables**: Prefix with `mock` (e.g., `mockRepository`)
- **Test data**: Use descriptive names (e.g., `validTradeData`)

### Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One assertion per test**: Focus on single behavior
3. **Descriptive names**: Make test purpose clear
4. **Mock external dependencies**: Isolate units under test
5. **Test edge cases**: Include error scenarios
6. **Clean up**: Reset mocks between tests

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure PostgreSQL is running and accessible

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution**: Kill existing processes or use different ports

#### 3. Module Not Found
```
Error: Cannot find module 'module-name'
```
**Solution**: Run `npm install` to install dependencies

#### 4. Test Timeout
```
Error: Timeout - Async callback was not invoked
```
**Solution**: Increase timeout or fix async/await issues

### Debug Mode

Run tests in debug mode for detailed output:

```bash
# Backend tests
npm run test:debug

# Frontend tests
cd frontend
npm test -- --verbose
```

### Performance Issues

If tests are running slowly:

1. **Check database connections**: Ensure proper cleanup
2. **Review test data**: Use minimal test datasets
3. **Parallel execution**: Some tests can run in parallel
4. **Mock heavy operations**: Mock external API calls

### Coverage Issues

If coverage is below thresholds:

1. **Identify uncovered code**: Check coverage reports
2. **Add missing tests**: Focus on critical paths
3. **Review test quality**: Ensure tests actually execute code
4. **Exclude non-testable code**: Use coverage ignore comments

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Documentation](https://testing-library.com/docs/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contributing

When adding new features:

1. **Write tests first**: Follow TDD principles
2. **Maintain coverage**: Ensure new code is tested
3. **Update documentation**: Keep this guide current
4. **Review test quality**: Ensure tests are meaningful

## 📞 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review existing test examples
3. Ask team members for help
4. Create an issue with detailed information

---

**Happy Testing! 🧪✨**
