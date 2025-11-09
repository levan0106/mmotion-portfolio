import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { PerformanceSnapshotController } from '../../src/modules/portfolio/controllers/performance-snapshot.controller';
import { PerformanceSnapshotService } from '../../src/modules/portfolio/services/performance-snapshot.service';
import { TWRCalculationService } from '../../src/modules/portfolio/services/twr-calculation.service';
import { MWRIRRCalculationService } from '../../src/modules/portfolio/services/mwr-irr-calculation.service';
import { AlphaBetaCalculationService } from '../../src/modules/portfolio/services/alpha-beta-calculation.service';
import { RiskMetricsCalculationService } from '../../src/modules/portfolio/services/risk-metrics-calculation.service';
import { PortfolioPerformanceSnapshot } from '../../src/modules/portfolio/entities/portfolio-performance-snapshot.entity';
import { AssetPerformanceSnapshot } from '../../src/modules/portfolio/entities/asset-performance-snapshot.entity';
import { AssetGroupPerformanceSnapshot } from '../../src/modules/portfolio/entities/asset-group-performance-snapshot.entity';
import { BenchmarkData } from '../../src/modules/portfolio/entities/benchmark-data.entity';
import { Portfolio } from '../../src/modules/portfolio/entities/portfolio.entity';
import { Asset } from '../../src/modules/asset/entities/asset.entity';
import { PortfolioSnapshot } from '../../src/modules/portfolio/entities/portfolio-snapshot.entity';
import { AssetAllocationSnapshot } from '../../src/modules/portfolio/entities/asset-allocation-snapshot.entity';
import { SnapshotGranularity } from '../../src/modules/portfolio/enums/snapshot-granularity.enum';

describe('Performance Snapshot Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let performanceSnapshotService: PerformanceSnapshotService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
          database: process.env.DB_DATABASE || 'portfolio_management_test',
          entities: [
            Portfolio,
            Asset,
            PortfolioSnapshot,
            AssetAllocationSnapshot,
            PortfolioPerformanceSnapshot,
            AssetPerformanceSnapshot,
            AssetGroupPerformanceSnapshot,
            BenchmarkData,
          ],
          synchronize: false,
          logging: false,
        }),
        TypeOrmModule.forFeature([
          Portfolio,
          Asset,
          PortfolioSnapshot,
          AssetAllocationSnapshot,
          PortfolioPerformanceSnapshot,
          AssetPerformanceSnapshot,
          AssetGroupPerformanceSnapshot,
          BenchmarkData,
        ]),
      ],
      controllers: [PerformanceSnapshotController],
      providers: [
        PerformanceSnapshotService,
        TWRCalculationService,
        MWRIRRCalculationService,
        AlphaBetaCalculationService,
        RiskMetricsCalculationService,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    performanceSnapshotService = moduleFixture.get<PerformanceSnapshotService>(PerformanceSnapshotService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await dataSource.query('DELETE FROM asset_group_performance_snapshots');
    await dataSource.query('DELETE FROM asset_performance_snapshots');
    await dataSource.query('DELETE FROM portfolio_performance_snapshots');
    await dataSource.query('DELETE FROM benchmark_data');
    await dataSource.query('DELETE FROM asset_allocation_snapshots');
    await dataSource.query('DELETE FROM portfolio_snapshots');
    await dataSource.query('DELETE FROM assets');
    await dataSource.query('DELETE FROM portfolios');
  });

  describe('Performance Snapshot Creation', () => {
    it('should create performance snapshots for a portfolio', async () => {
      // Create test portfolio
      const portfolio = await dataSource.query(`
        INSERT INTO portfolios (portfolio_id, name, description, created_by, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, ['test-portfolio-id', 'Test Portfolio', 'Test Description', 'test-user', true]);

      // Create test assets
      const asset1 = await dataSource.query(`
        INSERT INTO assets (id, symbol, name, type, created_by, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, ['asset-1', 'AAPL', 'Apple Inc', 'Stock', 'test-user', true]);

      const asset2 = await dataSource.query(`
        INSERT INTO assets (id, symbol, name, type, created_by, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, ['asset-2', 'GOOGL', 'Alphabet Inc', 'Stock', 'test-user', true]);

      // Create portfolio snapshots for TWR calculation
      const snapshotDate1 = new Date('2024-01-01');
      const snapshotDate2 = new Date('2024-01-02');
      const snapshotDate3 = new Date('2024-01-03');

      await dataSource.query(`
        INSERT INTO portfolio_snapshots (id, portfolio_id, portfolio_name, snapshot_date, granularity, total_portfolio_value, is_active)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7),
          ($2, $2, $3, $8, $5, $9, $7),
          ($3, $2, $3, $10, $5, $11, $7)
      `, [
        'snapshot-1', 'test-portfolio-id', 'Test Portfolio', snapshotDate1, 'DAILY', 100000, true,
        'snapshot-2', 'test-portfolio-id', 'Test Portfolio', snapshotDate2, 'DAILY', 105000, true,
        'snapshot-3', 'test-portfolio-id', 'Test Portfolio', snapshotDate3, 'DAILY', 110000, true,
      ]);

      // Create asset allocation snapshots
      await dataSource.query(`
        INSERT INTO asset_allocation_snapshots (id, portfolio_id, asset_id, asset_symbol, snapshot_date, granularity, current_value, is_active)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8),
          ($9, $2, $10, $11, $12, $6, $13, $8),
          ($14, $2, $3, $4, $15, $6, $16, $8),
          ($17, $2, $10, $11, $18, $6, $19, $8)
      `, [
        'asset-snapshot-1', 'test-portfolio-id', 'asset-1', 'AAPL', snapshotDate1, 'DAILY', 50000, true,
        'asset-snapshot-2', 'test-portfolio-id', 'asset-2', 'GOOGL', snapshotDate1, 'DAILY', 50000, true,
        'asset-snapshot-3', 'test-portfolio-id', 'asset-1', 'AAPL', snapshotDate2, 'DAILY', 52500, true,
        'asset-snapshot-4', 'test-portfolio-id', 'asset-2', 'GOOGL', snapshotDate2, 'DAILY', 52500, true,
      ]);

      // Create performance snapshots
      const result = await performanceSnapshotService.createPerformanceSnapshots(
        'test-portfolio-id',
        snapshotDate3,
        SnapshotGranularity.DAILY,
        'test-user'
      );

      expect(result).toBeDefined();
      expect(result.portfolioSnapshot).toBeDefined();
      expect(result.assetSnapshots).toBeDefined();
      expect(result.groupSnapshots).toBeDefined();

      // Verify portfolio performance snapshot
      expect(result.portfolioSnapshot.portfolioId).toBe('test-portfolio-id');
      expect(result.portfolioSnapshot.snapshotDate).toEqual(snapshotDate3);
      expect(result.portfolioSnapshot.granularity).toBe(SnapshotGranularity.DAILY);

      // Verify asset performance snapshots
      expect(result.assetSnapshots.length).toBe(2);
      expect(result.assetSnapshots[0].portfolioId).toBe('test-portfolio-id');
      expect(result.assetSnapshots[0].assetSymbol).toBe('AAPL');

      // Verify group performance snapshots
      expect(result.groupSnapshots.length).toBe(1);
      expect(result.groupSnapshots[0].assetType).toBe('Stock');
    });

    it('should handle portfolio with no assets gracefully', async () => {
      // Create test portfolio
      await dataSource.query(`
        INSERT INTO portfolios (portfolio_id, name, description, created_by, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, ['empty-portfolio-id', 'Empty Portfolio', 'Empty Description', 'test-user', true]);

      const snapshotDate = new Date('2024-01-01');

      const result = await performanceSnapshotService.createPerformanceSnapshots(
        'empty-portfolio-id',
        snapshotDate,
        SnapshotGranularity.DAILY,
        'test-user'
      );

      expect(result).toBeDefined();
      expect(result.portfolioSnapshot).toBeDefined();
      expect(result.assetSnapshots).toHaveLength(0);
      expect(result.groupSnapshots).toHaveLength(0);
    });
  });

  describe('Performance Snapshot Retrieval', () => {
    beforeEach(async () => {
      // Create test data
      await dataSource.query(`
        INSERT INTO portfolios (portfolio_id, name, description, created_by, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, ['test-portfolio-id', 'Test Portfolio', 'Test Description', 'test-user', true]);

      const snapshotDate = new Date('2024-01-01');

      await dataSource.query(`
        INSERT INTO portfolio_performance_snapshots (
          id, portfolio_id, snapshot_date, granularity, portfolio_twr_1d, portfolio_twr_1w, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['perf-snapshot-1', 'test-portfolio-id', snapshotDate, 'DAILY', 1.5, 5.2, true]);
    });

    it('should retrieve portfolio performance snapshots', async () => {
      const snapshots = await performanceSnapshotService.getPortfolioPerformanceSnapshots(
        'test-portfolio-id'
      );

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].portfolioId).toBe('test-portfolio-id');
      expect(snapshots[0].portfolioTWR1D).toBe(1.5);
      expect(snapshots[0].portfolioTWR1W).toBe(5.2);
    });

    it('should filter snapshots by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const snapshots = await performanceSnapshotService.getPortfolioPerformanceSnapshots(
        'test-portfolio-id',
        startDate,
        endDate
      );

      expect(snapshots).toHaveLength(1);
    });

    it('should filter snapshots by granularity', async () => {
      const snapshots = await performanceSnapshotService.getPortfolioPerformanceSnapshots(
        'test-portfolio-id',
        undefined,
        undefined,
        SnapshotGranularity.DAILY
      );

      expect(snapshots).toHaveLength(1);
    });
  });

  describe('Performance Snapshot Deletion', () => {
    beforeEach(async () => {
      // Create test data
      await dataSource.query(`
        INSERT INTO portfolios (portfolio_id, name, description, created_by, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, ['test-portfolio-id', 'Test Portfolio', 'Test Description', 'test-user', true]);

      const snapshotDate1 = new Date('2024-01-01');
      const snapshotDate2 = new Date('2024-01-02');

      await dataSource.query(`
        INSERT INTO portfolio_performance_snapshots (
          id, portfolio_id, snapshot_date, granularity, is_active
        ) VALUES 
          ($1, $2, $3, $4, $5),
          ($6, $2, $7, $4, $5)
      `, [
        'perf-snapshot-1', 'test-portfolio-id', snapshotDate1, 'DAILY', true,
        'perf-snapshot-2', 'test-portfolio-id', snapshotDate2, 'DAILY', true,
      ]);
    });

    it('should delete snapshots by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-01');

      const result = await performanceSnapshotService.deletePerformanceSnapshotsByDateRange(
        'test-portfolio-id',
        startDate,
        endDate
      );

      expect(result.deletedCount).toBe(1);
      expect(result.message).toContain('Successfully deleted 1 performance snapshots');

      // Verify deletion
      const remainingSnapshots = await performanceSnapshotService.getPortfolioPerformanceSnapshots(
        'test-portfolio-id'
      );
      expect(remainingSnapshots).toHaveLength(1);
    });
  });

  describe('API Endpoints', () => {
    beforeEach(async () => {
      // Create test data
      await dataSource.query(`
        INSERT INTO portfolios (portfolio_id, name, description, created_by, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, ['test-portfolio-id', 'Test Portfolio', 'Test Description', 'test-user', true]);

      const snapshotDate = new Date('2024-01-01');

      await dataSource.query(`
        INSERT INTO portfolio_performance_snapshots (
          id, portfolio_id, snapshot_date, granularity, portfolio_twr_1d, portfolio_twr_1w, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['perf-snapshot-1', 'test-portfolio-id', snapshotDate, 'DAILY', 1.5, 5.2, true]);
    });

    it('should create performance snapshots via API', async () => {
      const createDto = {
        portfolioId: 'test-portfolio-id',
        snapshotDate: '2024-01-01',
        granularity: 'DAILY',
        createdBy: 'test-user'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/performance-snapshots')
        .send(createDto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.portfolioSnapshot).toBeDefined();
    });

    it('should get portfolio performance snapshots via API', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/performance-snapshots/portfolio/test-portfolio-id')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get portfolio performance summary via API', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/performance-snapshots/portfolio/test-portfolio-id/summary?period=1Y')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.portfolioId).toBe('test-portfolio-id');
      expect(response.body.period).toBe('1Y');
    });

    it('should delete performance snapshots via API', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/performance-snapshots/portfolio/test-portfolio-id')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-01'
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.deletedCount).toBeDefined();
      expect(response.body.message).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent portfolio gracefully', async () => {
      const result = await performanceSnapshotService.createPerformanceSnapshots(
        'non-existent-portfolio',
        new Date('2024-01-01'),
        SnapshotGranularity.DAILY,
        'test-user'
      );

      // Should throw NotFoundException
      expect(result).rejects.toThrow();
    });

    it('should handle invalid date ranges', async () => {
      const startDate = new Date('2024-01-02');
      const endDate = new Date('2024-01-01'); // End before start

      const result = await performanceSnapshotService.getPortfolioPerformanceSnapshots(
        'test-portfolio-id',
        startDate,
        endDate
      );

      expect(result).toHaveLength(0);
    });
  });
});
