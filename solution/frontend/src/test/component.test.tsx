import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Simple test component
const TestComponent = () => {
  return (
    <div>
      <h1>Test Component</h1>
      <p>This is a test component.</p>
    </div>
  )
}

describe('Component Test', () => {
  it('should render test component', () => {
    render(<TestComponent />)
    
    expect(screen.getByText('Test Component')).toBeInTheDocument()
    expect(screen.getByText('This is a test component.')).toBeInTheDocument()
  })
})
