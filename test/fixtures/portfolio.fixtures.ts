/**
 * Test fixtures for Portfolio entities
 * Provides mock data for testing purposes
 */

import { CreatePortfolioDto } from '../../src/modules/portfolio/dto/create-portfolio.dto';
import { UpdatePortfolioDto } from '../../src/modules/portfolio/dto/update-portfolio.dto';
import { Portfolio } from '../../src/modules/portfolio/entities/portfolio.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { NavSnapshot } from '../../src/modules/portfolio/entities/nav-snapshot.entity';
import { CashFlow, CashFlowType, CashFlowStatus } from '../../src/modules/portfolio/entities/cash-flow.entity';
import { Account } from '../../src/modules/shared/entities/account.entity';
import { Asset } from '../../src/modules/asset/entities/asset.entity';
import { AssetType } from '../../src/modules/asset/enums/asset-type.enum';

/**
 * Mock UUIDs for consistent testing
 */
export const mockUUIDs = {
  user1: '550e8400-e29b-41d4-a716-446655440001',
  account1: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
  account2: '550e8400-e29b-41d4-a716-446655440002',
  portfolio1: '550e8400-e29b-41d4-a716-446655440010',
  portfolio2: '550e8400-e29b-41d4-a716-446655440011',
  asset1: '550e8400-e29b-41d4-a716-446655440020', // HPG
  asset2: '550e8400-e29b-41d4-a716-446655440021', // VCB
  portfolioAsset1: '550e8400-e29b-41d4-a716-446655440030',
  portfolioAsset2: '550e8400-e29b-41d4-a716-446655440031',
  navSnapshot1: '550e8400-e29b-41d4-a716-446655440040',
  cashFlow1: '550e8400-e29b-41d4-a716-446655440050',
};

/**
 * Mock Account fixtures
 */
export const createMockAccount = (overrides: Partial<Account> = {}): Account => ({
  accountId: mockUUIDs.account1,
  name: 'Test Account',
  email: 'test@example.com',
  baseCurrency: 'VND',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  portfolios: [],
  ...overrides,
});

/**
 * Mock Asset fixtures
 */
export const createMockAsset = (overrides: Partial<Asset> = {}): Asset => ({
  id: mockUUIDs.asset1,
  name: 'Hoa Phat Group Joint Stock Company',
  symbol: 'HPG',
  type: AssetType.STOCK,
  description: 'Leading steel manufacturer in Vietnam',
  initialValue: 25000000,
  initialQuantity: 1000,
  // currentValue removed - calculated real-time
  currentQuantity: 1000,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: mockUUIDs.user1,
  updatedBy: mockUUIDs.user1,
  trades: [],
  // getTotalValue method removed - currentValue calculated real-time
  getTotalQuantity: jest.fn().mockReturnValue(1000),
  hasTrades: jest.fn().mockReturnValue(false),
  getDisplayName: jest.fn().mockReturnValue('Hoa Phat Group Joint Stock Company (HPG)'),
  canModifySymbol: jest.fn().mockReturnValue(true),
  getPrimaryIdentifier: jest.fn().mockReturnValue('HPG'),
  validateSymbolModification: jest.fn(),
  toJSON: jest.fn().mockReturnValue({}),
  ...overrides,
});

export const createMockAssetVCB = (overrides: Partial<Asset> = {}): Asset => ({
  id: mockUUIDs.asset2,
  name: 'Joint Stock Commercial Bank for Foreign Trade of Vietnam',
  symbol: 'VCB',
  type: AssetType.STOCK,
  description: 'Leading commercial bank in Vietnam',
  initialValue: 80000000,
  initialQuantity: 500,
  // currentValue removed - calculated real-time
  currentQuantity: 500,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: mockUUIDs.user1,
  updatedBy: mockUUIDs.user1,
  trades: [],
  // getTotalValue method removed - currentValue calculated real-time
  getTotalQuantity: jest.fn().mockReturnValue(500),
  hasTrades: jest.fn().mockReturnValue(false),
  getDisplayName: jest.fn().mockReturnValue('Joint Stock Commercial Bank for Foreign Trade of Vietnam (VCB)'),
  canModifySymbol: jest.fn().mockReturnValue(true),
  getPrimaryIdentifier: jest.fn().mockReturnValue('VCB'),
  validateSymbolModification: jest.fn(),
  toJSON: jest.fn().mockReturnValue({}),
  ...overrides,
});

/**
 * Mock Portfolio fixtures
 */
export const createMockPortfolio = (overrides: Partial<Portfolio> = {}): Portfolio => ({
  portfolioId: mockUUIDs.portfolio1,
  accountId: mockUUIDs.account1,
  name: 'Growth Portfolio',
  baseCurrency: 'VND',
  totalValue: 1500000000, // 1.5 billion VND
  cashBalance: 50000000, // 50 million VND
  unrealizedPl: 150000000, // 150 million VND profit
  realizedPl: 75000000, // 75 million VND profit
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  account: createMockAccount(),
  navSnapshots: [],
  cashFlows: [],
  trades: [],
  ...overrides,
});

export const createMockPortfolio2 = (overrides: Partial<Portfolio> = {}): Portfolio => ({
  portfolioId: mockUUIDs.portfolio2,
  accountId: mockUUIDs.account1,
  name: 'Conservative Portfolio',
  baseCurrency: 'USD',
  totalValue: 50000, // 50k USD
  cashBalance: 5000, // 5k USD
  unrealizedPl: -2000, // 2k USD loss
  realizedPl: 1000, // 1k USD profit
  createdAt: new Date('2024-01-02T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  account: createMockAccount(),
  navSnapshots: [],
  cashFlows: [],
  trades: [],
  ...overrides,
});

/**
 * Mock PortfolioAsset fixtures
 */
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
export const createMockPortfolioAsset = (overrides: any = {}): any => ({
  assetId: mockUUIDs.asset1,
  quantity: 1000,
  avgCost: 25000, // 25k VND per share
  marketValue: 30000000, // 30 million VND
  unrealizedPl: 5000000, // 5 million VND profit
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  portfolio: createMockPortfolio(),
  asset: createMockAsset(),
  ...overrides,
});

/**
 * Mock NavSnapshot fixtures
 */
export const createMockNavSnapshot = (overrides: Partial<NavSnapshot> = {}): NavSnapshot => ({
  portfolioId: mockUUIDs.portfolio1,
  navDate: new Date('2024-01-01'),
  navValue: 1500000000,
  cashBalance: 50000000,
  totalValue: 1500000000,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  portfolio: createMockPortfolio(),
  ...overrides,
});

/**
 * Mock CashFlow fixtures
 */
export const createMockCashFlow = (overrides: Partial<CashFlow> = {}): CashFlow => ({
  cashFlowId: mockUUIDs.cashFlow1,
  portfolioId: mockUUIDs.portfolio1,
  flowDate: new Date('2024-01-01T00:00:00Z'),
  effectiveDate: new Date('2024-01-01T00:00:00Z'),
  amount: 100000000, // 100 million VND
  currency: 'VND',
  type: CashFlowType.DEPOSIT,
  description: 'Initial deposit',
  reference: 'INIT-001',
  status: CashFlowStatus.COMPLETED,
  tradeId: null,
  isInflow: true,
  isOutflow: false,
  netAmount: 100000000,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  portfolio: createMockPortfolio(),
  ...overrides,
});

/**
 * Mock DTO fixtures
 */
export const createMockCreatePortfolioDto = (overrides: Partial<CreatePortfolioDto> = {}): CreatePortfolioDto => ({
  name: 'Test Portfolio',
  baseCurrency: 'VND',
  accountId: mockUUIDs.account1,
  description: 'A test portfolio for unit testing',
  ...overrides,
});

export const createMockUpdatePortfolioDto = (overrides: Partial<UpdatePortfolioDto> = {}): UpdatePortfolioDto => ({
  name: 'Updated Portfolio Name',
  description: 'Updated portfolio description',
  ...overrides,
});

/**
 * Mock arrays for testing lists
 */
export const createMockPortfolioList = (): Portfolio[] => [
  createMockPortfolio(),
  createMockPortfolio2(),
];

export const createMockPortfolioAssetList = (): any[] => [
  createMockPortfolioAsset(),
  createMockPortfolioAsset({
    assetId: mockUUIDs.asset2,
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    asset: createMockAssetVCB(),
    quantity: 500,
    avgCost: 80000, // 80k VND per share
    marketValue: 42000000, // 42 million VND
    unrealizedPl: 2000000, // 2 million VND profit
  }),
];

/**
 * Mock performance data
 */
export const createMockPerformanceData = () => ({
  totalReturn: 0.15, // 15%
  annualizedReturn: 0.12, // 12%
  volatility: 0.18, // 18%
  sharpeRatio: 0.67,
  maxDrawdown: -0.08, // -8%
  beta: 1.2,
  alpha: 0.03, // 3%
});

/**
 * Mock asset allocation data
 */
export const createMockAssetAllocation = () => [
  { assetType: 'stock', weight: 0.7, value: 1050000000 },
  { assetType: 'bond', weight: 0.2, value: 300000000 },
  { assetType: 'cash', weight: 0.1, value: 150000000 },
];

/**
 * Helper functions for test data creation
 */
export const portfolioFixtures = {
  // Basic entities
  account: createMockAccount,
  asset: createMockAsset,
  assetVCB: createMockAssetVCB,
  portfolio: createMockPortfolio,
  portfolio2: createMockPortfolio2,
  portfolioAsset: createMockPortfolioAsset,
  navSnapshot: createMockNavSnapshot,
  cashFlow: createMockCashFlow,
  
  // DTOs
  createPortfolioDto: createMockCreatePortfolioDto,
  updatePortfolioDto: createMockUpdatePortfolioDto,
  
  // Lists
  portfolioList: createMockPortfolioList,
  portfolioAssetList: createMockPortfolioAssetList,
  
  // Performance data
  performanceData: createMockPerformanceData,
  assetAllocation: createMockAssetAllocation,
  
  // UUIDs
  uuids: mockUUIDs,
};
