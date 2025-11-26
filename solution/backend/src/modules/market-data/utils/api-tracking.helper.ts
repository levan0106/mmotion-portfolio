import { Injectable, Logger } from '@nestjs/common';
import { ApiCallDetailService } from '../../asset/services/api-call-detail.service';
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

        // Determine status: HTTP 200 is not enough - must have valid data
        // If all records were rejected (successfulSymbols === 0 && failedSymbols > 0), consider it FAILED
        let status: ApiCallStatus;
        let errorMessage = apiCall.errorMessage;
        
        if (apiCall.statusCode !== 200) {
          status = ApiCallStatus.FAILED;
        } else if (apiCall.successfulSymbols === 0 && apiCall.failedSymbols > 0) {
          // HTTP 200 but all records rejected due to validation - consider as FAILED
          status = ApiCallStatus.FAILED;
          // Update error message to indicate validation failure
          if (!errorMessage) {
            errorMessage = `All ${apiCall.failedSymbols} record(s) were rejected due to validation errors (no valid data)`;
          }
        } else if (apiCall.successfulSymbols > 0) {
          // Has at least some valid data
          status = ApiCallStatus.SUCCESS;
        } else {
          // HTTP 200 but no symbols processed (edge case)
          status = ApiCallStatus.FAILED;
        }

        await this.apiCallDetailService.updateApiCallDetail(apiCallId, {
          status: status,
          responseTime: apiCall.responseTime,
          statusCode: apiCall.statusCode,
          errorMessage: errorMessage,
          symbolsProcessed: apiCall.symbolsProcessed,
          successfulSymbols: apiCall.successfulSymbols,
          failedSymbols: apiCall.failedSymbols,
          responseData: apiCall.responseData,
        });
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

      // Determine status: HTTP 200 is not enough - must have valid data
      // If all records were rejected (successfulSymbols === 0 && failedSymbols > 0), consider it FAILED
      let status: ApiCallStatus;
      let errorMessage = apiCall.errorMessage;
      
      if (apiCall.statusCode !== 200) {
        status = ApiCallStatus.FAILED;
      } else if (apiCall.successfulSymbols === 0 && apiCall.failedSymbols > 0) {
        // HTTP 200 but all records rejected due to validation - consider as FAILED
        status = ApiCallStatus.FAILED;
        // Update error message to indicate validation failure
        if (!errorMessage) {
          errorMessage = `All ${apiCall.failedSymbols} record(s) were rejected due to validation errors (no valid data)`;
        }
      } else if (apiCall.successfulSymbols > 0) {
        // Has at least some valid data
        status = ApiCallStatus.SUCCESS;
      } else {
        // HTTP 200 but no symbols processed (edge case)
        status = ApiCallStatus.FAILED;
      }

      await this.apiCallDetailService.updateApiCallDetail(apiCallId, {
        status: status,
        responseTime: apiCall.responseTime,
        statusCode: apiCall.statusCode,
        errorMessage: errorMessage,
        symbolsProcessed: apiCall.symbolsProcessed,
        successfulSymbols: apiCall.successfulSymbols,
        failedSymbols: apiCall.failedSymbols,
        responseData: apiCall.responseData,
      });
    } catch (error) {
      this.logger.error(`Failed to record single API call detail: ${error.message}`, error.stack);
    }
  }
}
