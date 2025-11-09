import { Injectable, Logger } from '@nestjs/common';

export interface BenchmarkData {
  benchmarkId: string;
  benchmarkName: string;
  benchmarkType: string;
  snapshotDate: Date;
  granularity: string;
  benchmarkValue: number;
  benchmarkReturn1d: number;
  benchmarkReturn1w: number;
  benchmarkReturn1m: number;
  benchmarkReturn3m: number;
  benchmarkReturn6m: number;
  benchmarkReturn1y: number;
  benchmarkReturnYtd: number;
  benchmarkVolatility1m: number;
  benchmarkVolatility3m: number;
  benchmarkVolatility1y: number;
  benchmarkMaxDrawdown1m: number;
  benchmarkMaxDrawdown3m: number;
  benchmarkMaxDrawdown1y: number;
  isActive: boolean;
}

@Injectable()
export class BenchmarkMockService {
  private readonly logger = new Logger(BenchmarkMockService.name);

  /**
   * Generate mock benchmark data for a specific date
   */
  generateMockBenchmarkData(
    benchmarkId: string = '00000000-0000-0000-0000-000000000001',
    snapshotDate: Date = new Date(),
    granularity: string = 'DAILY'
  ): BenchmarkData {
    // Generate realistic mock data based on date
    const dateStr = snapshotDate.toISOString().split('T')[0];
    const dayOfYear = this.getDayOfYear(snapshotDate);
    
    // Simulate market movements with some randomness
    const baseValue = 1000;
    const dailyVariation = Math.sin(dayOfYear * 0.1) * 0.02; // 2% daily variation
    const randomFactor = (Math.random() - 0.5) * 0.01; // ±0.5% random
    
    const benchmarkValue = baseValue * (1 + dailyVariation + randomFactor);
    
    // Calculate returns based on value changes
    const benchmarkReturn1d = dailyVariation * 100; // Convert to percentage
    const benchmarkReturn1w = benchmarkReturn1d * 7 * 0.8; // Weekly return (slightly less volatile)
    const benchmarkReturn1m = benchmarkReturn1d * 30 * 0.7; // Monthly return
    const benchmarkReturn3m = benchmarkReturn1m * 3 * 0.6; // 3-month return
    const benchmarkReturn6m = benchmarkReturn1m * 6 * 0.5; // 6-month return
    const benchmarkReturn1y = benchmarkReturn1m * 12 * 0.4; // 1-year return
    const benchmarkReturnYtd = benchmarkReturn1m * (dayOfYear / 30) * 0.5; // YTD return
    
    // Generate volatility and risk metrics
    const benchmarkVolatility1m = Math.abs(benchmarkReturn1d) * 15; // 15x daily return
    const benchmarkVolatility3m = benchmarkVolatility1m * 0.8;
    const benchmarkVolatility1y = benchmarkVolatility1m * 0.6;
    
    const benchmarkMaxDrawdown1m = Math.min(0, benchmarkReturn1m * 0.3); // Max drawdown is negative
    const benchmarkMaxDrawdown3m = benchmarkMaxDrawdown1m * 1.5;
    const benchmarkMaxDrawdown1y = benchmarkMaxDrawdown1m * 2;

    return {
      benchmarkId,
      benchmarkName: 'VN-Index Mock',
      benchmarkType: 'INDEX',
      snapshotDate,
      granularity,
      benchmarkValue: Number(benchmarkValue.toFixed(2)),
      benchmarkReturn1d: Number(benchmarkReturn1d.toFixed(4)),
      benchmarkReturn1w: Number(benchmarkReturn1w.toFixed(4)),
      benchmarkReturn1m: Number(benchmarkReturn1m.toFixed(4)),
      benchmarkReturn3m: Number(benchmarkReturn3m.toFixed(4)),
      benchmarkReturn6m: Number(benchmarkReturn6m.toFixed(4)),
      benchmarkReturn1y: Number(benchmarkReturn1y.toFixed(4)),
      benchmarkReturnYtd: Number(benchmarkReturnYtd.toFixed(4)),
      benchmarkVolatility1m: Number(benchmarkVolatility1m.toFixed(4)),
      benchmarkVolatility3m: Number(benchmarkVolatility3m.toFixed(4)),
      benchmarkVolatility1y: Number(benchmarkVolatility1y.toFixed(4)),
      benchmarkMaxDrawdown1m: Number(benchmarkMaxDrawdown1m.toFixed(4)),
      benchmarkMaxDrawdown3m: Number(benchmarkMaxDrawdown3m.toFixed(4)),
      benchmarkMaxDrawdown1y: Number(benchmarkMaxDrawdown1y.toFixed(4)),
      isActive: true,
    };
  }

  /**
   * Generate mock benchmark data for a date range
   */
  generateMockBenchmarkDataRange(
    benchmarkId: string = '00000000-0000-0000-0000-000000000001',
    startDate: Date,
    endDate: Date,
    granularity: string = 'DAILY'
  ): BenchmarkData[] {
    const data: BenchmarkData[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      data.push(this.generateMockBenchmarkData(benchmarkId, new Date(current), granularity));
      current.setDate(current.getDate() + 1);
    }
    
    return data;
  }

  /**
   * Get benchmark data for a specific date (mock implementation)
   */
  async getBenchmarkData(
    benchmarkId: string,
    snapshotDate: Date,
    granularity: string = 'DAILY'
  ): Promise<BenchmarkData | null> {
    this.logger.log(`Getting mock benchmark data for ${benchmarkId} on ${snapshotDate.toISOString().split('T')[0]}`);
    
    // For now, always return mock data
    // In the future, this will call real market data API
    return this.generateMockBenchmarkData(benchmarkId, snapshotDate, granularity);
  }

  /**
   * Get benchmark data for a date range (mock implementation)
   */
  async getBenchmarkDataRange(
    benchmarkId: string,
    startDate: Date,
    endDate: Date,
    granularity: string = 'DAILY'
  ): Promise<BenchmarkData[]> {
    this.logger.log(`Getting mock benchmark data range for ${benchmarkId} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    // For now, always return mock data
    // In the future, this will call real market data API
    return this.generateMockBenchmarkDataRange(benchmarkId, startDate, endDate, granularity);
  }

  /**
   * Helper method to get day of year
   */
  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
