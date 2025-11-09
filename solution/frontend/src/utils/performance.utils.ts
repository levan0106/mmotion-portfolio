/**
 * Performance calculation utilities
 * Real performance calculations based on asset data
 */

export interface PerformanceData {
  initialValue: number;
  currentValue: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PerformanceResult {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

/**
 * Calculate performance percentage
 * @param initialValue - Initial value
 * @param currentValue - Current value
 * @returns Performance percentage
 */
export function calculatePerformancePercentage(initialValue: number, currentValue: number): number {
  if (!initialValue || initialValue === 0) {
    return 0;
  }
  return ((currentValue - initialValue) / initialValue) * 100;
}

/**
 * Calculate time-based performance
 * @param data - Performance data
 * @returns Performance metrics for different time periods
 */
export function calculateTimeBasedPerformance(data: PerformanceData): PerformanceResult {
  const { initialValue, currentValue, createdAt } = data;
  
  // Convert dates to Date objects if they're strings
  const createdDate = new Date(createdAt);
  const now = new Date();
  
  // Calculate total performance
  const totalPerformance = calculatePerformancePercentage(initialValue, currentValue);
  
  // Calculate time periods in days
  const totalDays = Math.max(1, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Calculate performance for different periods
  const daily = calculatePeriodPerformance(totalPerformance, totalDays, 1);
  const weekly = calculatePeriodPerformance(totalPerformance, totalDays, 7);
  const monthly = calculatePeriodPerformance(totalPerformance, totalDays, 30);
  const yearly = calculatePeriodPerformance(totalPerformance, totalDays, 365);
  
  return {
    daily: Math.round(daily * 100) / 100, // Round to 2 decimal places
    weekly: Math.round(weekly * 100) / 100,
    monthly: Math.round(monthly * 100) / 100,
    yearly: Math.round(yearly * 100) / 100,
  };
}

/**
 * Calculate performance for a specific period
 * @param totalPerformance - Total performance percentage
 * @param totalDays - Total days since creation
 * @param periodDays - Period in days
 * @returns Performance for the period
 */
function calculatePeriodPerformance(totalPerformance: number, totalDays: number, periodDays: number): number {
  if (totalDays < periodDays) {
    // If asset is newer than the period, return total performance
    return totalPerformance;
  }
  
  // Calculate annualized performance for the period
  const periods = totalDays / periodDays;
  return totalPerformance / periods;
}

/**
 * Calculate performance with market data simulation
 * @param data - Performance data
 * @param symbol - Asset symbol for market data
 * @returns Performance metrics with market simulation
 */
export function calculatePerformanceWithMarketData(data: PerformanceData, symbol: string): PerformanceResult {
  // Calculate base performance
  const basePerformance = calculateTimeBasedPerformance(data);
  
  // Add market simulation
  const marketFactor = getMarketFactor(symbol);
  
  return {
    daily: Math.round((basePerformance.daily * marketFactor.daily) * 100) / 100,
    weekly: Math.round((basePerformance.weekly * marketFactor.weekly) * 100) / 100,
    monthly: Math.round((basePerformance.monthly * marketFactor.monthly) * 100) / 100,
    yearly: Math.round((basePerformance.yearly * marketFactor.yearly) * 100) / 100,
  };
}

/**
 * Get volatility factor by symbol
 * @param symbol - Asset symbol
 * @returns Volatility factor
 */
function getVolatilityBySymbol(symbol: string): number {
  const volatilityMap: Record<string, number> = {
    'GOLD': 0.8,      // Gold is less volatile
    'VFF': 1.2,       // VFF is more volatile
    'VESAF': 1.1,     // VESAF is moderately volatile
    'SSISCA': 1.0,    // SSISCA is average volatility
    'HPG': 1.3,       // HPG is highly volatile
    'VCB': 0.9,       // VCB is less volatile (bank stock)
  };
  
  return volatilityMap[symbol.toUpperCase()] || 1.0;
}

/**
 * Get market factor for different periods
 * @param symbol - Asset symbol
 * @returns Market factors for different periods
 */
function getMarketFactor(symbol: string): { daily: number; weekly: number; monthly: number; yearly: number } {
  const volatility = getVolatilityBySymbol(symbol);
  
  // Simulate different market conditions for different periods
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  // Daily factor (more volatile during market hours)
  const dailyFactor = hour >= 9 && hour <= 15 ? 1.0 + (volatility - 1) * 0.5 : 0.8;
  
  // Weekly factor (more volatile on weekdays)
  const weeklyFactor = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.0 + (volatility - 1) * 0.3 : 0.9;
  
  // Monthly factor (seasonal effects)
  const monthlyFactor = 1.0 + (volatility - 1) * 0.2;
  
  // Yearly factor (long-term trends)
  const yearlyFactor = 1.0 + (volatility - 1) * 0.1;
  
  return {
    daily: dailyFactor,
    weekly: weeklyFactor,
    monthly: monthlyFactor,
    yearly: yearlyFactor,
  };
}

/**
 * Calculate performance with trade data
 * @param data - Performance data
 * @param trades - Array of trade data
 * @returns Performance metrics based on trade history
 */
export function calculatePerformanceWithTrades(
  data: PerformanceData, 
  trades: Array<{ side: string; quantity: number; price: number; tradeDate: Date | string }>
): PerformanceResult {
  if (!trades || trades.length === 0) {
    return calculateTimeBasedPerformance(data);
  }
  
  // Calculate performance based on trade history
  const { currentValue } = data;
  
  // Calculate total invested amount
  const totalInvested = trades
    .filter(trade => trade.side === 'BUY')
    .reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);
  
  // Calculate total sold amount
  const totalSold = trades
    .filter(trade => trade.side === 'SELL')
    .reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);
  
  // Calculate net investment
  const netInvestment = totalInvested - totalSold;
  
  // Calculate performance based on net investment
  const performance = calculatePerformancePercentage(netInvestment, currentValue);
  
  // Calculate time-based performance
  const createdDate = new Date(data.createdAt);
  const now = new Date();
  const totalDays = Math.max(1, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  return {
    daily: calculatePeriodPerformance(performance, totalDays, 1),
    weekly: calculatePeriodPerformance(performance, totalDays, 7),
    monthly: calculatePeriodPerformance(performance, totalDays, 30),
    yearly: calculatePeriodPerformance(performance, totalDays, 365),
  };
}

/**
 * Format performance percentage for display
 * @param performance - Performance percentage
 * @returns Formatted performance string
 */
export function formatPerformance(performance: number): string {
  if (performance === 0) return '0.00%';
  if (performance > 0) return `+${performance.toFixed(2)}%`;
  return `${performance.toFixed(2)}%`;
}

/**
 * Get performance color class for UI
 * @param performance - Performance percentage
 * @returns CSS class name
 */
export function getPerformanceColorClass(performance: number): string {
  if (performance > 0) return 'text-green-600';
  if (performance < 0) return 'text-red-600';
  return 'text-gray-600';
}
