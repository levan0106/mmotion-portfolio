import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiCallDetail, ApiCallStatus } from '../entities/api-call-detail.entity';

export interface CreateApiCallDetailDto {
  executionId: string;
  provider: string;
  endpoint: string;
  method: string;
  requestData?: Record<string, any>;
}

export interface UpdateApiCallDetailDto {
  status?: ApiCallStatus;
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
  symbolsProcessed?: number;
  successfulSymbols?: number;
  failedSymbols?: number;
  responseData?: Record<string, any>;
  completedAt?: Date;
}

@Injectable()
export class ApiCallDetailService {
  private readonly logger = new Logger(ApiCallDetailService.name);

  constructor(
    @InjectRepository(ApiCallDetail)
    private readonly apiCallDetailRepository: Repository<ApiCallDetail>,
  ) {}

  /**
   * Create a new API call detail record
   */
  async createApiCallDetail(dto: CreateApiCallDetailDto): Promise<ApiCallDetail> {
    const apiCallDetail = this.apiCallDetailRepository.create({
      ...dto,
      status: ApiCallStatus.PENDING,
      startedAt: new Date(),
      symbolsProcessed: 0,
      successfulSymbols: 0,
      failedSymbols: 0,
    });

    const saved = await this.apiCallDetailRepository.save(apiCallDetail);
    this.logger.log(`[ApiCallDetailService] Created API call detail: ${saved.id} for execution: ${dto.executionId}`);
    return saved;
  }

  /**
   * Update API call detail with results
   */
  async updateApiCallDetail(
    id: string,
    dto: UpdateApiCallDetailDto,
  ): Promise<ApiCallDetail> {
    const apiCallDetail = await this.apiCallDetailRepository.findOne({
      where: { id },
    });

    if (!apiCallDetail) {
      throw new Error(`API call detail not found: ${id}`);
    }

    // Update fields
    Object.assign(apiCallDetail, dto);

    // Set completion time if status is not pending
    if (dto.status && dto.status !== ApiCallStatus.PENDING && !dto.completedAt) {
      apiCallDetail.completedAt = new Date();
    }

    const updated = await this.apiCallDetailRepository.save(apiCallDetail);
    this.logger.log(`[ApiCallDetailService] Updated API call detail: ${id} - Status: ${dto.status}`);
    return updated;
  }

  /**
   * Get API call details by execution ID
   */
  async getApiCallDetailsByExecutionId(executionId: string): Promise<ApiCallDetail[]> {
    const apiCallDetails = await this.apiCallDetailRepository.find({
      where: { executionId },
      order: { startedAt: 'ASC' },
    });

    this.logger.log(`[ApiCallDetailService] Retrieved ${apiCallDetails.length} API call details for execution: ${executionId}`);
    return apiCallDetails;
  }

  /**
   * Get API call detail by ID
   */
  async getApiCallDetailById(id: string): Promise<ApiCallDetail | null> {
    return await this.apiCallDetailRepository.findOne({
      where: { id },
    });
  }

  /**
   * Get API call details with filtering and pagination
   */
  async getApiCallDetails(query: {
    executionId?: string;
    provider?: string;
    status?: ApiCallStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    sortBy?: 'startedAt' | 'responseTime' | 'symbolsProcessed';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{
    data: ApiCallDetail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      executionId,
      provider,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      sortBy = 'startedAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.apiCallDetailRepository.createQueryBuilder('apiCall');

    // Apply filters
    if (executionId) {
      queryBuilder.andWhere('apiCall.executionId = :executionId', { executionId });
    }
    if (provider) {
      queryBuilder.andWhere('apiCall.provider = :provider', { provider });
    }
    if (status) {
      queryBuilder.andWhere('apiCall.status = :status', { status });
    }
    if (startDate && endDate) {
      queryBuilder.andWhere('apiCall.startedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('apiCall.startedAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('apiCall.startedAt <= :endDate', { endDate });
    }

    // Apply sorting
    const sortField = `apiCall.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get API call statistics by execution ID
   */
  async getApiCallStatsByExecutionId(executionId: string): Promise<{
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    timeoutCalls: number;
    pendingCalls: number;
    averageResponseTime: number;
    totalSymbolsProcessed: number;
    totalSuccessfulSymbols: number;
    totalFailedSymbols: number;
    successRate: number;
  }> {
    const apiCallDetails = await this.getApiCallDetailsByExecutionId(executionId);

    const stats = {
      totalCalls: apiCallDetails.length,
      successfulCalls: apiCallDetails.filter(call => call.status === ApiCallStatus.SUCCESS).length,
      failedCalls: apiCallDetails.filter(call => call.status === ApiCallStatus.FAILED).length,
      timeoutCalls: apiCallDetails.filter(call => call.status === ApiCallStatus.TIMEOUT).length,
      pendingCalls: apiCallDetails.filter(call => call.status === ApiCallStatus.PENDING).length,
      averageResponseTime: 0,
      totalSymbolsProcessed: 0,
      totalSuccessfulSymbols: 0,
      totalFailedSymbols: 0,
      successRate: 0,
    };

    if (apiCallDetails.length > 0) {
      // Calculate average response time
      const completedCalls = apiCallDetails.filter(call => call.completedAt);
      if (completedCalls.length > 0) {
        stats.averageResponseTime = completedCalls.reduce((sum, call) => sum + call.responseTime, 0) / completedCalls.length;
      }

      // Calculate symbol statistics
      stats.totalSymbolsProcessed = apiCallDetails.reduce((sum, call) => sum + call.symbolsProcessed, 0);
      stats.totalSuccessfulSymbols = apiCallDetails.reduce((sum, call) => sum + call.successfulSymbols, 0);
      stats.totalFailedSymbols = apiCallDetails.reduce((sum, call) => sum + call.failedSymbols, 0);

      // Calculate success rate
      if (stats.totalCalls > 0) {
        stats.successRate = (stats.successfulCalls / stats.totalCalls) * 100;
      }
    }

    return stats;
  }

  /**
   * Clean up old API call details
   */
  async cleanupOldApiCallDetails(days: number = 90): Promise<{ deletedRecords: number; message: string }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.apiCallDetailRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();

    const deletedRecords = result.affected || 0;
    const message = `Cleaned up ${deletedRecords} API call detail records older than ${days} days`;

    this.logger.log(`[ApiCallDetailService] ${message}`);
    return { deletedRecords, message };
  }
}
