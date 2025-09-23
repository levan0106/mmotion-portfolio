import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PortfolioSnapshotService, PortfolioSnapshotTimelineQuery } from '../services/portfolio-snapshot.service';
import { CreatePortfolioSnapshotDto, UpdatePortfolioSnapshotDto } from '../dto/portfolio-snapshot.dto';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';

@Controller('/api/v1/portfolio-snapshots')
export class PortfolioSnapshotController {
  private readonly logger = new Logger(PortfolioSnapshotController.name);

  constructor(private readonly portfolioSnapshotService: PortfolioSnapshotService) {}

  /**
   * This controller is deprecated. Use the snapshot controller instead.
   */

  /**
   * Create a new portfolio snapshot
   * @deprecated Use snapshot controller instead
   */
  // @Post()
  // @HttpCode(HttpStatus.CREATED)
  // async createPortfolioSnapshot(@Body() createDto: CreatePortfolioSnapshotDto) {
  //   this.logger.log(`Creating portfolio snapshot for portfolio ${createDto.portfolioId}`);
  //   const snapshot = await this.portfolioSnapshotService.createPortfolioSnapshot(createDto);
  //   return {
  //     success: true,
  //     data: snapshot,
  //     message: 'Portfolio snapshot created successfully',
  //   };
  // }

  /**
   * Create portfolio snapshot from asset snapshots
   * @deprecated Use snapshot controller instead
   */
  // @Post('from-asset-snapshots')
  // @HttpCode(HttpStatus.CREATED)
  // async createFromAssetSnapshots(
  //   @Body() body: {
  //     portfolioId: string;
  //     snapshotDate: string;
  //     granularity?: SnapshotGranularity;
  //     createdBy?: string;
  //   }
  // ) {
  //   this.logger.log(`Creating portfolio snapshot from asset snapshots for portfolio ${body.portfolioId}`);
  //   const snapshot = await this.portfolioSnapshotService.createPortfolioSnapshotFromAssetSnapshots(
  //     body.portfolioId,
  //     new Date(body.snapshotDate),
  //     body.granularity || SnapshotGranularity.DAILY,
  //     body.createdBy
  //   );
  //   return {
  //     success: true,
  //     data: snapshot,
  //     message: 'Portfolio snapshot created from asset snapshots successfully',
  //   };
  // }

  /**
   * Get portfolio snapshots with query parameters
   * @deprecated Use snapshot controller instead
   */
  @Get()
  async getPortfolioSnapshots(
    @Query('portfolioId') portfolioId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('granularity') granularity?: SnapshotGranularity,
    @Query('isActive') isActive?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('orderBy') orderBy?: string,
    @Query('orderDirection') orderDirection?: 'ASC' | 'DESC',
  ) {
    this.logger.log('Getting portfolio snapshots with filters');
    
    const options = {
      portfolioId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      granularity,
      isActive,
      page,
      limit,
      orderBy,
      orderDirection,
    };

    // Remove undefined values
    Object.keys(options).forEach(key => 
      options[key] === undefined && delete options[key]
    );

    const snapshots = await this.portfolioSnapshotService.getPortfolioSnapshots(options);
    return {
      success: true,
      data: snapshots,
      count: snapshots.length,
    };
  }

  /**
   * Get portfolio snapshot by ID
   * @deprecated Use snapshot controller instead
   */
  // @Get(':id')
  // async getPortfolioSnapshot(@Param('id') id: string) {
  //   this.logger.log(`Getting portfolio snapshot ${id}`);
  //   const snapshot = await this.portfolioSnapshotService.getPortfolioSnapshotById(id);
  //   return {
  //     success: true,
  //     data: snapshot,
  //   };
  // }

  /**
   * Get portfolio snapshots with pagination
   * @deprecated Use snapshot controller instead
   */
  // @Get('paginated')
  // async getPortfolioSnapshotsPaginated(
  //   @Query('portfolioId') portfolioId?: string,
  //   @Query('startDate') startDate?: string,
  //   @Query('endDate') endDate?: string,
  //   @Query('granularity') granularity?: SnapshotGranularity,
  //   @Query('isActive') isActive?: boolean,
  //   @Query('page') page?: number,
  //   @Query('limit') limit?: number,
  //   @Query('orderBy') orderBy?: string,
  //   @Query('orderDirection') orderDirection?: 'ASC' | 'DESC',
  // ) {
  //   this.logger.log('Getting paginated portfolio snapshots');
  //   
  //   const options = {
  //     portfolioId,
  //     startDate: startDate ? new Date(startDate) : undefined,
  //     endDate: endDate ? new Date(endDate) : undefined,
  //     granularity,
  //     isActive,
  //     page,
  //     limit,
  //     orderBy,
  //     orderDirection,
  //   };

  //   // Remove undefined values
  //   Object.keys(options).forEach(key => 
  //     options[key] === undefined && delete options[key]
  //   );

  //   const result = await this.portfolioSnapshotService.getPortfolioSnapshotsWithPagination(options);
  //   return {
  //     success: true,
  //     data: result.data,
  //     pagination: {
  //       total: result.total,
  //       page: result.page,
  //       limit: result.limit,
  //       totalPages: result.totalPages,
  //     },
  //   };
  // }

  /**
   * Get portfolio snapshot timeline
   * @deprecated Use snapshot controller instead
   */
  // @Get('timeline/:portfolioId')
  // async getPortfolioSnapshotTimeline(
  //   @Param('portfolioId') portfolioId: string,
  //   @Query('startDate') startDate: string,
  //   @Query('endDate') endDate: string,
  //   @Query('granularity') granularity?: SnapshotGranularity,
  // ) {
  //   this.logger.log(`Getting portfolio snapshot timeline for portfolio ${portfolioId}`);
  //   
  //   const query: PortfolioSnapshotTimelineQuery = {
  //     portfolioId,
  //     startDate: new Date(startDate),
  //     endDate: new Date(endDate),
  //     granularity: granularity || SnapshotGranularity.DAILY,
  //   };

  //   const snapshots = await this.portfolioSnapshotService.getPortfolioSnapshotTimeline(query);
  //   return {
  //     success: true,
  //     data: snapshots,
  //     count: snapshots.length,
  //   };
  // }

  /**
   * Get aggregated portfolio snapshot timeline
   * @deprecated Use snapshot controller instead
   */
  // @Get('timeline/:portfolioId/aggregated')
  // async getAggregatedPortfolioSnapshotTimeline(
  //   @Param('portfolioId') portfolioId: string,
  //   @Query('startDate') startDate: string,
  //   @Query('endDate') endDate: string,
  //   @Query('granularity') granularity?: SnapshotGranularity,
  // ) {
  //   this.logger.log(`Getting aggregated portfolio snapshot timeline for portfolio ${portfolioId}`);
  //   
  //   const snapshots = await this.portfolioSnapshotService.getAggregatedPortfolioSnapshotTimeline(
  //     portfolioId,
  //     new Date(startDate),
  //     new Date(endDate),
  //     granularity || SnapshotGranularity.DAILY
  //   );
  //   
  //   return {
  //     success: true,
  //     data: snapshots,
  //     count: snapshots.length,
  //   };
  // }

  /**
   * Get latest portfolio snapshot
   * @deprecated Use snapshot controller instead
   */
  // @Get('latest/:portfolioId')
  // async getLatestPortfolioSnapshot(
  //   @Param('portfolioId') portfolioId: string,
  //   @Query('granularity') granularity?: SnapshotGranularity,
  // ) {
  //   this.logger.log(`Getting latest portfolio snapshot for portfolio ${portfolioId}`);
  //   
  //   const snapshot = await this.portfolioSnapshotService.getLatestPortfolioSnapshot(
  //     portfolioId,
  //     granularity
  //   );
  //   
  //   return {
  //     success: true,
  //     data: snapshot,
  //   };
  // }

  /**
   * Get portfolios with snapshots
   * @deprecated Use snapshot controller instead
   */
  // @Get('portfolios/with-snapshots')
  // async getPortfoliosWithSnapshots() {
  //   this.logger.log('Getting portfolios with portfolio snapshots');
  //   
  //   const portfolios = await this.portfolioSnapshotService.getPortfoliosWithSnapshots();
  //   return {
  //     success: true,
  //     data: portfolios,
  //     count: portfolios.length,
  //   };
  // }

  /**
   * Update portfolio snapshot
   * @deprecated Use snapshot controller instead
   */
  // @Put(':id')
  // async updatePortfolioSnapshot(
  //   @Param('id') id: string,
  //   @Body() updateDto: UpdatePortfolioSnapshotDto,
  // ) {
  //   this.logger.log(`Updating portfolio snapshot ${id}`);
  //   
  //   const snapshot = await this.portfolioSnapshotService.updatePortfolioSnapshot(id, updateDto);
  //   return {
  //     success: true,
  //     data: snapshot,
  //     message: 'Portfolio snapshot updated successfully',
  //   };
  // }

  /**
   * Get portfolio snapshot statistics
   * @deprecated Use snapshot controller instead
   */
  // @Get('statistics/:portfolioId')
  // async getPortfolioSnapshotStatistics(@Param('portfolioId') portfolioId: string) {
  //   this.logger.log(`Getting portfolio snapshot statistics for portfolio ${portfolioId}`);
  //   
  //   const statistics = await this.portfolioSnapshotService.getPortfolioSnapshotStatistics(portfolioId);
  //   return {
  //     success: true,
  //     data: statistics,
  //   };
  // }
  
}
