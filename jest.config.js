module.exports = {
  // File extensions Jest will process
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // Root directory for tests
  rootDir: 'src',
  
  // Test file pattern
  testRegex: '.*\\.spec\\.ts$',
  
  // Transform files with ts-jest
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  
  // Coverage collection patterns
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.d.ts',
    '!**/main.ts',
    '!**/migrations/**',
    '!**/seeders/**',
  ],
  
  // Coverage output directory
  coverageDirectory: '../coverage',
  
  // Test environment
  testEnvironment: 'node',
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
  },
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Verbose output
  verbose: true,
  
  // Maximum number of concurrent workers
  maxWorkers: '50%',
  
  // Timeout for tests (30 seconds)
  testTimeout: 30000,
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Ignore patterns for coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '\\.d\\.ts$',
    '\\.interface\\.ts$',
    '\\.dto\\.ts$',
    '\\.entity\\.ts$',
    '/migrations/',
    '/seeders/',
    '/test/',
  ],
};
