import { Injectable, Logger } from '@nestjs/common';
import { ApiCallDetailService, CreateApiCallDetailDto, UpdateApiCallDetailDto } from '../../asset/services/api-call-detail.service';
import { ApiCallStatus } from '../../asset/entities/api-call-detail.entity';
import { ApiCallInfo } from '../interfaces/api-tracking.interface';

@Injectable()
export class ApiTrackingHelper {
  private readonly logger = new Logger(ApiTrackingHelper.name);

  constructor(
    private readonly apiCallDetailService: ApiCallDetailService,
  ) {}

  /**
   * Record API call details to database
   */
  async recordApiCallDetails(
    executionId: string,
    apiCalls: ApiCallInfo[]
  ): Promise<void> {
    try {
      for (const apiCall of apiCalls) {
        const apiCallId = (await this.apiCallDetailService.createApiCallDetail({
          executionId,
          provider: apiCall.provider,
          endpoint: apiCall.endpoint,
          method: apiCall.method,
          requestData: apiCall.requestData,
        })).id;

        await this.apiCallDetailService.updateApiCallDetail(apiCallId, {
          status: apiCall.statusCode === 200 ? ApiCallStatus.SUCCESS : ApiCallStatus.FAILED,
          responseTime: apiCall.responseTime,
          statusCode: apiCall.statusCode,
          errorMessage: apiCall.errorMessage,
          symbolsProcessed: apiCall.symbolsProcessed,
          successfulSymbols: apiCall.successfulSymbols,
          failedSymbols: apiCall.failedSymbols,
          responseData: apiCall.responseData,
        });

        this.logger.debug(`Recorded API call detail for ${apiCall.provider}: ${apiCall.endpoint}`);
      }
    } catch (error) {
      this.logger.error(`Failed to record API call details: ${error.message}`, error.stack);
    }
  }

  /**
   * Record single API call detail
   */
  async recordSingleApiCall(
    executionId: string,
    apiCall: ApiCallInfo
  ): Promise<void> {
    try {
      const apiCallId = (await this.apiCallDetailService.createApiCallDetail({
        executionId,
        provider: apiCall.provider,
        endpoint: apiCall.endpoint,
        method: apiCall.method,
        requestData: apiCall.requestData,
      })).id;

      await this.apiCallDetailService.updateApiCallDetail(apiCallId, {
        status: apiCall.statusCode === 200 ? ApiCallStatus.SUCCESS : ApiCallStatus.FAILED,
        responseTime: apiCall.responseTime,
        statusCode: apiCall.statusCode,
        errorMessage: apiCall.errorMessage,
        symbolsProcessed: apiCall.symbolsProcessed,
        successfulSymbols: apiCall.successfulSymbols,
        failedSymbols: apiCall.failedSymbols,
        responseData: apiCall.responseData,
      });

      this.logger.debug(`Recorded single API call detail for ${apiCall.provider}: ${apiCall.endpoint}`);
    } catch (error) {
      this.logger.error(`Failed to record single API call detail: ${error.message}`, error.stack);
    }
  }
}
