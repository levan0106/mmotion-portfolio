/**
 * Format Utils Tests
 * Test quantity formatting with 2 decimal places
 */

import { formatNumber } from '../format';

describe('Format Utils - Quantity Formatting', () => {
  describe('formatNumber for quantity', () => {
    it('should format whole numbers with 2 decimal places', () => {
      expect(formatNumber(1, 2)).toBe('1.00');
      expect(formatNumber(10, 2)).toBe('10.00');
      expect(formatNumber(100, 2)).toBe('100.00');
    });

    it('should format decimal numbers with 2 decimal places', () => {
      expect(formatNumber(1.5, 2)).toBe('1.50');
      expect(formatNumber(10.25, 2)).toBe('10.25');
      expect(formatNumber(100.123, 2)).toBe('100.12');
    });

    it('should format zero with 2 decimal places', () => {
      expect(formatNumber(0, 2)).toBe('0.00');
    });

    it('should handle undefined and null values', () => {
      expect(formatNumber(undefined, 2)).toBe('0.00');
      expect(formatNumber(null, 2)).toBe('0.00');
    });

    it('should handle NaN values', () => {
      expect(formatNumber(NaN, 2)).toBe('0.00');
    });

    it('should format large numbers with 2 decimal places', () => {
      expect(formatNumber(1000000, 2)).toBe('1,000,000.00');
      expect(formatNumber(1234567.89, 2)).toBe('1,234,567.89');
    });

    it('should format small decimal numbers correctly', () => {
      expect(formatNumber(0.1, 2)).toBe('0.10');
      expect(formatNumber(0.01, 2)).toBe('0.01');
      expect(formatNumber(0.001, 2)).toBe('0.00');
    });
  });
});
