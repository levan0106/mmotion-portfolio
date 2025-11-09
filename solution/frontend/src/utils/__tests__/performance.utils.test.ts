/**
 * Performance Utils Tests
 * Test real performance calculations
 */

import { 
  calculatePerformancePercentage,
  calculateTimeBasedPerformance,
  calculatePerformanceWithMarketData,
  calculatePerformanceWithTrades,
  formatPerformance,
  getPerformanceColorClass
} from '../performance.utils';

describe('Performance Utils', () => {
  describe('calculatePerformancePercentage', () => {
    it('should calculate positive performance correctly', () => {
      const result = calculatePerformancePercentage(1000, 1200);
      expect(result).toBe(20);
    });

    it('should calculate negative performance correctly', () => {
      const result = calculatePerformancePercentage(1000, 800);
      expect(result).toBe(-20);
    });

    it('should handle zero initial value', () => {
      const result = calculatePerformancePercentage(0, 1000);
      expect(result).toBe(0);
    });

    it('should handle same values', () => {
      const result = calculatePerformancePercentage(1000, 1000);
      expect(result).toBe(0);
    });
  });

  describe('calculateTimeBasedPerformance', () => {
    it('should calculate performance for different time periods', () => {
      const data = {
        initialValue: 1000,
        currentValue: 1200,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const result = calculateTimeBasedPerformance(data);
      
      expect(result).toHaveProperty('daily');
      expect(result).toHaveProperty('weekly');
      expect(result).toHaveProperty('monthly');
      expect(result).toHaveProperty('yearly');
      
      // All should be positive since current > initial
      expect(result.daily).toBeGreaterThan(0);
      expect(result.weekly).toBeGreaterThan(0);
      expect(result.monthly).toBeGreaterThan(0);
      expect(result.yearly).toBeGreaterThan(0);
    });

    it('should handle negative performance', () => {
      const data = {
        initialValue: 1000,
        currentValue: 800,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const result = calculateTimeBasedPerformance(data);
      
      // All should be negative since current < initial
      expect(result.daily).toBeLessThan(0);
      expect(result.weekly).toBeLessThan(0);
      expect(result.monthly).toBeLessThan(0);
      expect(result.yearly).toBeLessThan(0);
    });
  });

  describe('calculatePerformanceWithMarketData', () => {
    it('should calculate performance with market simulation', () => {
      const data = {
        initialValue: 1000,
        currentValue: 1200,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const result = calculatePerformanceWithMarketData(data, 'GOLD');
      
      expect(result).toHaveProperty('daily');
      expect(result).toHaveProperty('weekly');
      expect(result).toHaveProperty('monthly');
      expect(result).toHaveProperty('yearly');
      
      // Should have different values due to market simulation
      expect(typeof result.daily).toBe('number');
      expect(typeof result.weekly).toBe('number');
      expect(typeof result.monthly).toBe('number');
      expect(typeof result.yearly).toBe('number');
    });

    it('should handle different symbols with different volatility', () => {
      const data = {
        initialValue: 1000,
        currentValue: 1200,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const goldResult = calculatePerformanceWithMarketData(data, 'GOLD');
      const vffResult = calculatePerformanceWithMarketData(data, 'VFF');
      
      // VFF should be more volatile than GOLD
      expect(Math.abs(vffResult.daily)).toBeGreaterThanOrEqual(Math.abs(goldResult.daily));
    });
  });

  describe('calculatePerformanceWithTrades', () => {
    it('should calculate performance based on trade history', () => {
      const data = {
        initialValue: 1000,
        currentValue: 1200,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const trades = [
        { side: 'BUY', quantity: 10, price: 100, tradeDate: new Date('2024-01-01') },
        { side: 'SELL', quantity: 5, price: 120, tradeDate: new Date('2024-01-15') },
      ];

      const result = calculatePerformanceWithTrades(data, trades);
      
      expect(result).toHaveProperty('daily');
      expect(result).toHaveProperty('weekly');
      expect(result).toHaveProperty('monthly');
      expect(result).toHaveProperty('yearly');
    });

    it('should fallback to time-based calculation when no trades', () => {
      const data = {
        initialValue: 1000,
        currentValue: 1200,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const result = calculatePerformanceWithTrades(data, []);
      
      expect(result).toHaveProperty('daily');
      expect(result).toHaveProperty('weekly');
      expect(result).toHaveProperty('monthly');
      expect(result).toHaveProperty('yearly');
    });
  });

  describe('formatPerformance', () => {
    it('should format positive performance correctly', () => {
      expect(formatPerformance(15.5)).toBe('+15.50%');
    });

    it('should format negative performance correctly', () => {
      expect(formatPerformance(-15.5)).toBe('-15.50%');
    });

    it('should format zero performance correctly', () => {
      expect(formatPerformance(0)).toBe('0.00%');
    });
  });

  describe('getPerformanceColorClass', () => {
    it('should return green class for positive performance', () => {
      expect(getPerformanceColorClass(15.5)).toBe('text-green-600');
    });

    it('should return red class for negative performance', () => {
      expect(getPerformanceColorClass(-15.5)).toBe('text-red-600');
    });

    it('should return gray class for zero performance', () => {
      expect(getPerformanceColorClass(0)).toBe('text-gray-600');
    });
  });
});
