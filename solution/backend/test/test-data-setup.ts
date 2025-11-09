import { DataSource } from 'typeorm';
import { AssetAllocationSnapshot } from '../src/modules/portfolio/entities/asset-allocation-snapshot.entity';
import { SnapshotGranularity } from '../src/modules/portfolio/enums/snapshot-granularity.enum';

export class TestDataSetup {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async setupTestData(): Promise<void> {
    console.log('Setting up test data...');

    // Clear existing test data
    await this.clearTestData();

    // Create test snapshots
    await this.createTestSnapshots();

    console.log('Test data setup completed');
  }

  async clearTestData(): Promise<void> {
    console.log('Clearing existing test data...');
    
    const snapshotRepository = this.dataSource.getRepository(AssetAllocationSnapshot);
    await snapshotRepository.delete({});
    
    console.log('Test data cleared');
  }

  async createTestSnapshots(): Promise<void> {
    console.log('Creating test snapshots...');

    const snapshotRepository = this.dataSource.getRepository(AssetAllocationSnapshot);

    // Create test portfolio IDs
    const testPortfolioId = '550e8400-e29b-41d4-a716-446655440000';
    const testAssetId = '550e8400-e29b-41d4-a716-446655440001';

    // Create snapshots for the last 30 days
    const snapshots = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const snapshotDate = new Date(now);
      snapshotDate.setDate(now.getDate() - i);
      
      const snapshot = snapshotRepository.create({
        id: `snapshot-${i + 1}`,
        portfolioId: testPortfolioId,
        assetId: testAssetId,
        snapshotDate,
        granularity: SnapshotGranularity.DAILY,
        currentQuantity: 100 + Math.random() * 50,
        currentPrice: 50 + Math.random() * 20,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Calculate derived values
      snapshot.currentValue = snapshot.currentQuantity * snapshot.currentPrice;
      snapshot.costBasis = snapshot.currentQuantity * 45; // Assume cost basis of 45
      snapshot.avgCost = 45;
      snapshot.unrealizedPl = snapshot.currentValue - snapshot.costBasis;
      snapshot.totalPl = snapshot.unrealizedPl;
      snapshot.allocationPercentage = 25 + Math.random() * 10; // 25-35%
      snapshot.portfolioTotalValue = snapshot.currentValue / (snapshot.allocationPercentage / 100);
      snapshot.returnPercentage = ((snapshot.currentValue - snapshot.costBasis) / snapshot.costBasis) * 100;
      snapshot.dailyReturn = i > 0 ? (Math.random() - 0.5) * 5 : 0; // Random daily return
      snapshot.cumulativeReturn = i > 0 ? snapshot.dailyReturn + (snapshots[i - 1]?.cumulativeReturn || 0) : 0;

      snapshots.push(snapshot);
    }

    await snapshotRepository.save(snapshots);
    console.log(`Created ${snapshots.length} test snapshots`);
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up test data...');
    await this.clearTestData();
    console.log('Test data cleanup completed');
  }
}
