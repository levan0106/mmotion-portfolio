import { DataSource } from 'typeorm';
import { AssetAllocationSnapshot } from '../src/modules/portfolio/entities/asset-allocation-snapshot.entity';
import { SnapshotGranularity } from '../src/modules/portfolio/enums/snapshot-granularity.enum';
import { testConfig } from './test-env';

export class TestUtils {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Create a test snapshot
   */
  async createTestSnapshot(overrides: Partial<AssetAllocationSnapshot> = {}): Promise<AssetAllocationSnapshot> {
    const snapshotRepository = this.dataSource.getRepository(AssetAllocationSnapshot);
    
    const defaultSnapshot = {
      id: `test-snapshot-${Date.now()}`,
      portfolioId: testConfig.testData.portfolioId,
      assetId: testConfig.testData.assetId,
      snapshotDate: new Date(),
      granularity: SnapshotGranularity.DAILY,
      currentQuantity: 100,
      currentPrice: 50,
      currentValue: 5000,
      costBasis: 4500,
      avgCost: 45,
      realizedPl: 0,
      unrealizedPl: 500,
      totalPl: 500,
      allocationPercentage: 25,
      portfolioTotalValue: 20000,
      returnPercentage: 11.11,
      dailyReturn: 2.5,
      cumulativeReturn: 15.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const snapshot = snapshotRepository.create({ ...defaultSnapshot, ...overrides });
    return await snapshotRepository.save(snapshot);
  }

  /**
   * Create multiple test snapshots
   */
  async createTestSnapshots(count: number, overrides: Partial<AssetAllocationSnapshot> = {}): Promise<AssetAllocationSnapshot[]> {
    const snapshots = [];
    
    for (let i = 0; i < count; i++) {
      const snapshotDate = new Date();
      snapshotDate.setDate(snapshotDate.getDate() - i);
      
      const snapshot = await this.createTestSnapshot({
        ...overrides,
        id: `test-snapshot-${i + 1}`,
        snapshotDate,
      });
      
      snapshots.push(snapshot);
    }
    
    return snapshots;
  }

  /**
   * Get a snapshot by ID
   */
  async getSnapshotById(id: string): Promise<AssetAllocationSnapshot | null> {
    const snapshotRepository = this.dataSource.getRepository(AssetAllocationSnapshot);
    return await snapshotRepository.findOne({ where: { id } });
  }

  /**
   * Get all snapshots for a portfolio
   */
  async getSnapshotsByPortfolio(portfolioId: string): Promise<AssetAllocationSnapshot[]> {
    const snapshotRepository = this.dataSource.getRepository(AssetAllocationSnapshot);
    return await snapshotRepository.find({ where: { portfolioId } });
  }

  /**
   * Count snapshots
   */
  async countSnapshots(): Promise<number> {
    const snapshotRepository = this.dataSource.getRepository(AssetAllocationSnapshot);
    return await snapshotRepository.count();
  }

  /**
   * Clear all snapshots
   */
  async clearAllSnapshots(): Promise<void> {
    const snapshotRepository = this.dataSource.getRepository(AssetAllocationSnapshot);
    await snapshotRepository.delete({});
  }

  /**
   * Wait for a condition to be true
   */
  async waitFor(condition: () => boolean, timeout: number = 5000): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Generate random test data
   */
  generateRandomSnapshotData(): Partial<AssetAllocationSnapshot> {
    const now = new Date();
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const snapshotDate = new Date(now);
    snapshotDate.setDate(now.getDate() - randomDaysAgo);

    return {
      id: `random-snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      portfolioId: testConfig.testData.portfolioId,
      assetId: testConfig.testData.assetId,
      snapshotDate,
      granularity: SnapshotGranularity.DAILY,
      currentQuantity: Math.floor(Math.random() * 1000) + 100,
      currentPrice: Math.floor(Math.random() * 100) + 10,
      currentValue: 0, // Will be calculated
      costBasis: 0, // Will be calculated
      avgCost: 0, // Will be calculated
      realizedPl: 0,
      unrealizedPl: 0,
      totalPl: 0,
      allocationPercentage: 0, // Will be calculated
      portfolioTotalValue: 0, // Will be calculated
      returnPercentage: 0,
      dailyReturn: 0,
      cumulativeReturn: 0,
    };
  }

  /**
   * Calculate derived values for a snapshot
   */
  calculateDerivedValues(snapshot: Partial<AssetAllocationSnapshot>): Partial<AssetAllocationSnapshot> {
    const currentQuantity = snapshot.currentQuantity || 0;
    const currentPrice = snapshot.currentPrice || 0;
    const avgCost = snapshot.avgCost || 0;

    const currentValue = currentQuantity * currentPrice;
    const costBasis = currentQuantity * avgCost;
    const unrealizedPl = currentValue - costBasis;
    const totalPl = unrealizedPl;
    const returnPercentage = costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0;

    return {
      ...snapshot,
      currentValue,
      costBasis,
      unrealizedPl,
      totalPl,
      returnPercentage,
    };
  }
}
