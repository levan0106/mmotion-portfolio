export interface ApiCallInfo {
  provider: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  symbolsProcessed: number;
  successfulSymbols: number;
  failedSymbols: number;
  errorMessage?: string;
  requestData?: Record<string, any>;
  responseData?: Record<string, any>;
}

export interface ApiResult<T> {
  data: T;
  apiCalls: ApiCallInfo[];
  totalSymbols: number;
  successfulSymbols: number;
  failedSymbols: number;
}

export interface ApiTrackingOptions {
  provider: string;
  endpoint: string;
  method?: string;
  requestData?: Record<string, any>;
}
