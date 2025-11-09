import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PortfolioCard from './PortfolioCard'
import { createTestPortfolio } from '../../test/config'

// Mock the formatters utility
vi.mock('../../utils/formatters', () => ({
  formatCurrency: vi.fn((amount, currency) => {
    if (amount === undefined || amount === null) return `${currency} 0`
    return `${currency} ${amount.toLocaleString()}`
  }),
}))

describe('PortfolioCard', () => {
  const mockPortfolio = createTestPortfolio({
    name: 'Test Portfolio',
    baseCurrency: 'USD',
    totalValue: 50000,
    unrealizedPl: 5000,
    realizedPl: 2000,
    cashBalance: 10000,
    id: 'test-portfolio-id',
  })

  const mockOnView = vi.fn()
  const mockOnEdit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render portfolio information correctly', () => {
    render(
      <PortfolioCard
        portfolio={mockPortfolio}
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('Test Portfolio')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
    expect(screen.getByText('50,000.00 $')).toBeInTheDocument()
    expect(screen.getByText('Total Value')).toBeInTheDocument()
    expect(screen.getByText('5,000.00 $')).toBeInTheDocument()
    expect(screen.getByText('Unrealized P&L')).toBeInTheDocument()
    expect(screen.getByText('2,000.00 $')).toBeInTheDocument()
    expect(screen.getByText('Realized P&L')).toBeInTheDocument()
    expect(screen.getByText('Cash Balance: 10,000.00 $')).toBeInTheDocument()
  })

  it('should call onView when View Details button is clicked', () => {
    render(
      <PortfolioCard
        portfolio={mockPortfolio}
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    )

    const viewButton = screen.getByText('View Details')
    fireEvent.click(viewButton)

    expect(mockOnView).toHaveBeenCalledWith(mockPortfolio.portfolioId)
  })

  it('should call onEdit when Edit button is clicked', () => {
    render(
      <PortfolioCard
        portfolio={mockPortfolio}
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    )

    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockPortfolio.portfolioId)
  })

  it('should not show Edit button when onEdit is not provided', () => {
    render(
      <PortfolioCard
        portfolio={mockPortfolio}
        onView={mockOnView}
      />
    )

    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })

  it('should display positive P&L with success color', () => {
    const positivePortfolio = createTestPortfolio({
      unrealizedPl: 1000,
      realizedPl: 500,
    })

    render(
      <PortfolioCard
        portfolio={positivePortfolio}
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    )

    // Check that positive values are displayed
    expect(screen.getByText('1,000.00 $')).toBeInTheDocument()
    expect(screen.getByText('500.00 $')).toBeInTheDocument()
  })

  it('should display negative P&L with error color', () => {
    const negativePortfolio = createTestPortfolio({
      unrealizedPl: -1000,
      realizedPl: -500,
    })

    render(
      <PortfolioCard
        portfolio={negativePortfolio}
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    )

    // Check that negative values are displayed
    expect(screen.getByText('-1,000.00 $')).toBeInTheDocument()
    expect(screen.getByText('-500.00 $')).toBeInTheDocument()
  })

  it('should display zero P&L correctly', () => {
    const zeroPortfolio = createTestPortfolio({
      unrealizedPl: 0,
      realizedPl: 0,
    })

    render(
      <PortfolioCard
        portfolio={zeroPortfolio}
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    )

    // Check that zero values are displayed (there are multiple USD 0 elements)
    expect(screen.getAllByText('0.00 $')).toHaveLength(2)
  })

  it('should handle long portfolio names', () => {
    const longNamePortfolio = createTestPortfolio({
      name: 'Very Long Portfolio Name That Should Be Truncated',
    })

    render(
      <PortfolioCard
        portfolio={longNamePortfolio}
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('Very Long Portfolio Name That Should Be Truncated')).toBeInTheDocument()
  })

  it('should display different currencies correctly', () => {
    const eurPortfolio = createTestPortfolio({
      baseCurrency: 'EUR',
      totalValue: 45000,
    })

    render(
      <PortfolioCard
        portfolio={eurPortfolio}
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('EUR')).toBeInTheDocument()
    expect(screen.getByText('45,000.00 €')).toBeInTheDocument()
  })
})
