// SnapshotGranularity Enum Unit Tests for CR-006 Asset Snapshot System

import { SnapshotGranularity } from './snapshot-granularity.enum';

describe('SnapshotGranularity', () => {
  it('should have DAILY value', () => {
    expect(SnapshotGranularity.DAILY).toBe('DAILY');
  });

  it('should have WEEKLY value', () => {
    expect(SnapshotGranularity.WEEKLY).toBe('WEEKLY');
  });

  it('should have MONTHLY value', () => {
    expect(SnapshotGranularity.MONTHLY).toBe('MONTHLY');
  });

  it('should have all expected values', () => {
    const expectedValues = ['DAILY', 'WEEKLY', 'MONTHLY'];
    const actualValues = Object.values(SnapshotGranularity);
    
    expect(actualValues).toEqual(expect.arrayContaining(expectedValues));
    expect(actualValues.length).toBe(expectedValues.length);
  });

  it('should be a string enum', () => {
    expect(typeof SnapshotGranularity.DAILY).toBe('string');
    expect(typeof SnapshotGranularity.WEEKLY).toBe('string');
    expect(typeof SnapshotGranularity.MONTHLY).toBe('string');
  });

  it('should be immutable', () => {
    expect(() => {
      (SnapshotGranularity as any).DAILY = 'INVALID';
    }).toThrow();
  });
});
