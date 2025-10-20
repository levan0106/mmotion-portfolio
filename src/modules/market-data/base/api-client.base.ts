import { Injectable, Logger } from '@nestjs/common';
import { ApiTrackingBase } from './api-tracking.base';
import { ApiResult, ApiCallInfo } from '../interfaces/api-tracking.interface';

/**
 * Base class for all API clients with tracking support
 */
export abstract class ApiClientBase<T> extends ApiTrackingBase {
  protected readonly baseUrl: string;
  protected readonly timeout: number;

  constructor(
    loggerContext: string,
    baseUrl: string,
    timeout: number = 10000
  ) {
    super(loggerContext);
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Execute single API call with tracking
   */
  protected async executeApiCall(
    options: {
      provider: string;
      endpoint: string;
      method?: string;
      requestData?: Record<string, any>;
    },
    apiCall: () => Promise<T>,
    dataProcessor?: (data: T) => { symbolsProcessed: number; successfulSymbols: number; failedSymbols: number }
  ): Promise<ApiResult<T>> {
    const apiCallInfo = await this.executeWithTracking(options, apiCall, dataProcessor);
    
    return {
      data: apiCallInfo.statusCode === 200 ? await apiCall() : null as T,
      apiCalls: [apiCallInfo],
      totalSymbols: apiCallInfo.symbolsProcessed,
      successfulSymbols: apiCallInfo.successfulSymbols,
      failedSymbols: apiCallInfo.failedSymbols,
    };
  }

  /**
   * Execute multiple API calls with tracking
   */
  // protected async executeMultipleApiCalls(
  //   apiCalls: Array<{
  //     options: {
  //       provider: string;
  //       endpoint: string;
  //       method?: string;
  //       requestData?: Record<string, any>;
  //     };
  //     apiCall: () => Promise<T>;
  //     dataProcessor?: (data: T) => { symbolsProcessed: number; successfulSymbols: number; failedSymbols: number };
  //   }>
  // ): Promise<ApiResult<T[]>> {
  //   return this.executeMultipleWithTracking(apiCalls);
  // }

  /**
   * Get full URL for endpoint
   */
  protected getFullUrl(endpoint: string): string {
    return endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
  }

  /**
   * Create standardized API call info
   */
  protected createApiCallInfo(
    provider: string,
    endpoint: string,
    method: string = 'GET',
    responseTime: number,
    statusCode: number,
    symbolsProcessed: number,
    successfulSymbols: number,
    failedSymbols: number,
    errorMessage?: string,
    requestData?: Record<string, any>,
    responseData?: Record<string, any>
  ): ApiCallInfo {
    return {
      provider,
      endpoint,
      method,
      responseTime,
      statusCode,
      symbolsProcessed,
      successfulSymbols,
      failedSymbols,
      errorMessage,
      requestData,
      responseData,
    };
  }
}
