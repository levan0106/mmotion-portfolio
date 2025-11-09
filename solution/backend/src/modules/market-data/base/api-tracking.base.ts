import { Logger } from '@nestjs/common';
import { ApiCallInfo, ApiResult, ApiTrackingOptions } from '../interfaces/api-tracking.interface';

export abstract class ApiTrackingBase {
  protected readonly logger: Logger;

  constructor(loggerContext: string) {
    this.logger = new Logger(loggerContext);
  }

  /**
   * Execute API call with automatic tracking
   */
  protected async executeWithTracking<T>(
    options: ApiTrackingOptions,
    apiCall: () => Promise<T>,
    dataProcessor?: (data: T) => { symbolsProcessed: number; successfulSymbols: number; failedSymbols: number }
  ): Promise<ApiCallInfo> {
    const startTime = Date.now();
    const { provider, endpoint, method = 'GET', requestData } = options;

    try {
      this.logger.debug(`Starting API call to ${provider}: ${endpoint}`);
      
      const data = await apiCall();
      const responseTime = Date.now() - startTime;
      
      // Process data to get symbol counts if processor provided
      let symbolsProcessed = 0;
      let successfulSymbols = 0;
      let failedSymbols = 0;
      
      if (dataProcessor) {
        const counts = dataProcessor(data);
        symbolsProcessed = counts.symbolsProcessed;
        successfulSymbols = counts.successfulSymbols;
        failedSymbols = counts.failedSymbols;
      } else if (Array.isArray(data)) {
        symbolsProcessed = data.length;
        // Default logic: assume all items are successful if no dataProcessor provided
        successfulSymbols = data.length;
        failedSymbols = 0;
      }

      const apiCallInfo: ApiCallInfo = {
        provider,
        endpoint,
        method,
        responseTime,
        statusCode: 200,
        symbolsProcessed,
        successfulSymbols,
        failedSymbols,
        requestData,
        responseData: this.sanitizeResponseData(data),
      };

      this.logger.log(`API call successful: ${provider} - ${symbolsProcessed} symbols processed in ${responseTime}ms`);
      return apiCallInfo;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const apiCallInfo: ApiCallInfo = {
        provider,
        endpoint,
        method,
        responseTime,
        statusCode: error.status || 500,
        symbolsProcessed: 0,
        successfulSymbols: 0,
        failedSymbols: 1,
        errorMessage: error.message,
        requestData,
      };

      this.logger.error(`API call failed: ${provider} - ${error.message}`, error.stack);
      return apiCallInfo;
    }
  }

  /**
   * Execute multiple API calls and aggregate results
   */
  protected async executeMultipleWithTracking<T>(
    apiCalls: Array<{
      options: ApiTrackingOptions;
      apiCall: () => Promise<T>;
      dataProcessor?: (data: T) => { symbolsProcessed: number; successfulSymbols: number; failedSymbols: number };
    }>
  ): Promise<ApiResult<T[]>> {
    const allData: T[] = [];
    const allApiCalls: ApiCallInfo[] = [];
    let totalSymbols = 0;
    let totalSuccessfulSymbols = 0;
    let totalFailedSymbols = 0;

    for (const { options, apiCall, dataProcessor } of apiCalls) {
      const apiCallInfo = await this.executeWithTracking(options, apiCall, dataProcessor);
      
      allApiCalls.push(apiCallInfo);
      totalSymbols += apiCallInfo.symbolsProcessed;
      totalSuccessfulSymbols += apiCallInfo.successfulSymbols;
      totalFailedSymbols += apiCallInfo.failedSymbols;

      // Only add data if the call was successful
      if (apiCallInfo.statusCode === 200) {
        try {
          const data = await apiCall();
          allData.push(data);
        } catch (error) {
          this.logger.warn(`Failed to get data for ${options.provider}: ${error.message}`);
        }
      }
    }

    return {
      data: allData,
      apiCalls: allApiCalls,
      totalSymbols,
      successfulSymbols: totalSuccessfulSymbols,
      failedSymbols: totalFailedSymbols,
    };
  }

  /**
   * Sanitize response data to avoid storing sensitive information
   */
  private sanitizeResponseData(data: any): Record<string, any> {
    if (!data) return {};
    
    if (Array.isArray(data)) {
      return {
        count: data.length,
        sample: data.slice(0, 3), // Only keep first 3 items as sample
      };
    }
    
    if (typeof data === 'object') {
      // Remove sensitive fields
      const sanitized = { ...data };
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.apiKey;
      return sanitized;
    }
    
    return { value: data };
  }
}
