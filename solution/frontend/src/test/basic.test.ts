import { describe, it, expect } from 'vitest'

describe('Basic Test Setup', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have test environment', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })
})
