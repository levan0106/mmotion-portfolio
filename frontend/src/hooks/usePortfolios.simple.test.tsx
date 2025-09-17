import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'

// Simple test component
const TestComponent = () => {
  return <div>Test</div>
}

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('usePortfolios Hook Setup', () => {
  it('should have proper test environment', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })

  it('should render with QueryClient provider', () => {
    const { result } = renderHook(() => TestComponent, {
      wrapper: createWrapper(),
    })

    expect(result.current).toBeDefined()
  })
})
