import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { ReportDataDto } from '../dto/report-response.dto';

@ApiTags('Reports')
@Controller('api/v1/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * Get comprehensive report data
   */
  @Get()
  @ApiOperation({ 
    summary: 'Get comprehensive report data',
    description: 'Retrieves cash balance, deposits, and assets data grouped by exchange/platform, funding source, and asset group'
  })
  @ApiQuery({ 
    name: 'accountId', 
    description: 'Account ID to filter data (UUID format)', 
    required: true,
    example: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    type: 'string'
  })
  @ApiQuery({ 
    name: 'portfolioId', 
    description: 'Portfolio ID to filter data (optional)', 
    required: false,
    example: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    type: 'string'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Report data retrieved successfully',
    type: ReportDataDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - accountId is required',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'accountId query parameter is required' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async getReportData(
    @Query('accountId') accountId: string,
    @Query('portfolioId') portfolioId?: string
  ): Promise<ReportDataDto> {
    if (!accountId) {
      throw new Error('accountId query parameter is required');
    }

    return await this.reportService.getReportData(accountId, portfolioId);
  }

}
