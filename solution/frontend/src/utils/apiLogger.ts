// API Logger utility to track API calls
let apiCallCount = 0;
const apiCalls: Array<{ url: string; timestamp: number; count: number }> = [];

export const logApiCall = (url: string) => {
  apiCallCount++;
  const existingCall = apiCalls.find(call => call.url === url);
  
  if (existingCall) {
    existingCall.count++;
    existingCall.timestamp = Date.now();
  } else {
    apiCalls.push({
      url,
      timestamp: Date.now(),
      count: 1
    });
  }
  // Log summary every 10 calls
  if (apiCallCount % 10 === 0) {
  }
};

export const getApiCallStats = () => {
  return {
    totalCalls: apiCallCount,
    callsByUrl: apiCalls
  };
};

export const resetApiCallStats = () => {
  apiCallCount = 0;
  apiCalls.length = 0;
};
