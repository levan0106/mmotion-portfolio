import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { BenchmarkMockService, BenchmarkData } from '../services/benchmark-mock.service';

@ApiTags('Benchmark Mock')
@Controller('api/v1/benchmark-mock')
export class BenchmarkMockController {
  private readonly logger = new Logger(BenchmarkMockController.name);

  constructor(private readonly benchmarkMockService: BenchmarkMockService) {}

  @Get('data')
  @ApiOperation({ 
    summary: 'Get mock benchmark data for a specific date',
    description: 'Returns mock benchmark data for testing purposes. In production, this will call real market data API.'
  })
  @ApiQuery({ name: 'benchmarkId', required: false, description: 'Benchmark ID (default: 00000000-0000-0000-0000-000000000001)' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format (default: today)' })
  @ApiQuery({ name: 'granularity', required: false, description: 'Data granularity (default: DAILY)' })
  @ApiResponse({ status: 200, description: 'Mock benchmark data retrieved successfully' })
  async getBenchmarkData(
    @Query('benchmarkId') benchmarkId?: string,
    @Query('date') date?: string,
    @Query('granularity') granularity?: string,
  ): Promise<BenchmarkData> {
    const benchmarkIdParam = benchmarkId || '00000000-0000-0000-0000-000000000001';
    const snapshotDate = date ? new Date(date) : new Date();
    const granularityParam = granularity || 'DAILY';

    this.logger.log(`Getting mock benchmark data for ${benchmarkIdParam} on ${snapshotDate.toISOString().split('T')[0]}`);

    const data = await this.benchmarkMockService.getBenchmarkData(
      benchmarkIdParam,
      snapshotDate,
      granularityParam
    );

    return data!;
  }

  @Get('data/range')
  @ApiOperation({ 
    summary: 'Get mock benchmark data for a date range',
    description: 'Returns mock benchmark data for a date range for testing purposes.'
  })
  @ApiQuery({ name: 'benchmarkId', required: false, description: 'Benchmark ID (default: 00000000-0000-0000-0000-000000000001)' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'granularity', required: false, description: 'Data granularity (default: DAILY)' })
  @ApiResponse({ status: 200, description: 'Mock benchmark data range retrieved successfully' })
  async getBenchmarkDataRange(
    @Query('benchmarkId') benchmarkId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('granularity') granularity?: string,
  ): Promise<BenchmarkData[]> {
    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required');
    }

    const benchmarkIdParam = benchmarkId || '00000000-0000-0000-0000-000000000001';
    const startDateParam = new Date(startDate);
    const endDateParam = new Date(endDate);
    const granularityParam = granularity || 'DAILY';

    this.logger.log(`Getting mock benchmark data range for ${benchmarkIdParam} from ${startDate} to ${endDate}`);

    const data = await this.benchmarkMockService.getBenchmarkDataRange(
      benchmarkIdParam,
      startDateParam,
      endDateParam,
      granularityParam
    );

    return data;
  }

  @Get('data/generate')
  @ApiOperation({ 
    summary: 'Generate and insert mock benchmark data into database',
    description: 'Generates mock benchmark data for a date range and inserts it into the database for testing.'
  })
  @ApiQuery({ name: 'benchmarkId', required: false, description: 'Benchmark ID (default: 00000000-0000-0000-0000-000000000001)' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'granularity', required: false, description: 'Data granularity (default: DAILY)' })
  @ApiResponse({ status: 200, description: 'Mock benchmark data generated and inserted successfully' })
  async generateAndInsertBenchmarkData(
    @Query('benchmarkId') benchmarkId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('granularity') granularity?: string,
  ): Promise<{ message: string; count: number; data: BenchmarkData[] }> {
    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required');
    }

    const benchmarkIdParam = benchmarkId || '00000000-0000-0000-0000-000000000001';
    const startDateParam = new Date(startDate);
    const endDateParam = new Date(endDate);
    const granularityParam = granularity || 'DAILY';

    this.logger.log(`Generating mock benchmark data for ${benchmarkIdParam} from ${startDate} to ${endDate}`);

    const data = await this.benchmarkMockService.getBenchmarkDataRange(
      benchmarkIdParam,
      startDateParam,
      endDateParam,
      granularityParam
    );

    // TODO: Insert data into database
    // For now, just return the generated data
    this.logger.log(`Generated ${data.length} mock benchmark data records`);

    return {
      message: `Generated ${data.length} mock benchmark data records`,
      count: data.length,
      data: data
    };
  }
}
