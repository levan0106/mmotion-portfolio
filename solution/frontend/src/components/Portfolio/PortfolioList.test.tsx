import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PortfolioList from './PortfolioList'
import { createTestPortfolio } from '../../test/config'

// Mock the hooks
const mockUseAccount = vi.fn()
const mockUsePortfolios = vi.fn()

vi.mock('../../hooks/useAccount', () => ({
  useAccount: () => mockUseAccount(),
}))

vi.mock('../../hooks/usePortfolios', () => ({
  usePortfolios: () => mockUsePortfolios(),
}))

// Mock PortfolioCard component
vi.mock('./PortfolioCard', () => ({
  default: vi.fn(({ portfolio, onView, onEdit }) => (
    <div data-testid={`portfolio-card-${portfolio.portfolioId}`}>
      <div>{portfolio.name}</div>
      <button onClick={() => onView(portfolio.portfolioId)}>View</button>
      {onEdit && (
        <button onClick={() => onEdit(portfolio.portfolioId)}>Edit</button>
      )}
    </div>
  )),
}))

describe('PortfolioList', () => {
  const mockOnViewPortfolio = vi.fn()
  const mockOnEditPortfolio = vi.fn()
  const mockOnCreatePortfolio = vi.fn()

  const defaultProps = {
    onViewPortfolio: mockOnViewPortfolio,
    onEditPortfolio: mockOnEditPortfolio,
    onCreatePortfolio: mockOnCreatePortfolio,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAccount.mockReturnValue({ accountId: 'test-account-id' })
  })

  describe('Loading State', () => {
    it('should display loading spinner when portfolios are loading', () => {
      mockUsePortfolios.mockReturnValue({
        portfolios: [],
        isLoading: true,
        error: null,
      })

      render(<PortfolioList {...defaultProps} />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error message when there is an error', () => {
      mockUsePortfolios.mockReturnValue({
        portfolios: [],
        isLoading: false,
        error: new Error('Failed to fetch'),
      })

      render(<PortfolioList {...defaultProps} />)

      expect(screen.getByText('Failed to load portfolios. Please try again.')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no portfolios exist', () => {
      mockUsePortfolios.mockReturnValue({
        portfolios: [],
        isLoading: false,
        error: null,
      })

      render(<PortfolioList {...defaultProps} />)

      expect(screen.getByText('No portfolios found. Create your first portfolio to get started.')).toBeInTheDocument()
      expect(screen.getByText('Create Your First Portfolio')).toBeInTheDocument()
    })

    it('should call onCreatePortfolio when "Create Your First Portfolio" button is clicked', async () => {
      const user = userEvent.setup()
      mockUsePortfolios.mockReturnValue({
        portfolios: [],
        isLoading: false,
        error: null,
      })

      render(<PortfolioList {...defaultProps} />)

      const createButton = screen.getByText('Create Your First Portfolio')
      await user.click(createButton)

      expect(mockOnCreatePortfolio).toHaveBeenCalledTimes(1)
    })

    it('should not show create button when onCreatePortfolio is not provided', () => {
      mockUsePortfolios.mockReturnValue({
        portfolios: [],
        isLoading: false,
        error: null,
      })

      render(<PortfolioList onViewPortfolio={mockOnViewPortfolio} />)

      expect(screen.queryByText('Create Your First Portfolio')).not.toBeInTheDocument()
    })
  })

  describe('Portfolio Display', () => {
    const mockPortfolios = [
      createTestPortfolio({
        portfolioId: 'portfolio-1',
        name: 'Growth Portfolio',
        baseCurrency: 'USD',
      }),
      createTestPortfolio({
        portfolioId: 'portfolio-2',
        name: 'Conservative Portfolio',
        baseCurrency: 'EUR',
      }),
      createTestPortfolio({
        portfolioId: 'portfolio-3',
        name: 'Balanced Portfolio',
        baseCurrency: 'USD',
      }),
    ]

    beforeEach(() => {
      mockUsePortfolios.mockReturnValue({
        portfolios: mockPortfolios,
        isLoading: false,
        error: null,
      })
    })

    it('should render all portfolios when no filters are applied', () => {
      render(<PortfolioList {...defaultProps} />)

      expect(screen.getByTestId('portfolio-card-portfolio-1')).toBeInTheDocument()
      expect(screen.getByTestId('portfolio-card-portfolio-2')).toBeInTheDocument()
      expect(screen.getByTestId('portfolio-card-portfolio-3')).toBeInTheDocument()
    })

    it('should display portfolio names correctly', () => {
      render(<PortfolioList {...defaultProps} />)

      expect(screen.getByText('Growth Portfolio')).toBeInTheDocument()
      expect(screen.getByText('Conservative Portfolio')).toBeInTheDocument()
      expect(screen.getByText('Balanced Portfolio')).toBeInTheDocument()
    })

    it('should call onViewPortfolio when portfolio view button is clicked', async () => {
      const user = userEvent.setup()
      render(<PortfolioList {...defaultProps} />)

      const viewButtons = screen.getAllByText('View')
      await user.click(viewButtons[0])

      expect(mockOnViewPortfolio).toHaveBeenCalledWith('portfolio-1')
    })

    it('should call onEditPortfolio when portfolio edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<PortfolioList {...defaultProps} />)

      const editButtons = screen.getAllByText('Edit')
      await user.click(editButtons[0])

      expect(mockOnEditPortfolio).toHaveBeenCalledWith('portfolio-1')
    })

    it('should not show edit buttons when onEditPortfolio is not provided', () => {
      render(<PortfolioList onViewPortfolio={mockOnViewPortfolio} onCreatePortfolio={mockOnCreatePortfolio} />)

      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    const mockPortfolios = [
      createTestPortfolio({
        portfolioId: 'portfolio-1',
        name: 'Growth Portfolio',
        baseCurrency: 'USD',
      }),
      createTestPortfolio({
        portfolioId: 'portfolio-2',
        name: 'Conservative Portfolio',
        baseCurrency: 'EUR',
      }),
      createTestPortfolio({
        portfolioId: 'portfolio-3',
        name: 'Balanced Portfolio',
        baseCurrency: 'USD',
      }),
    ]

    beforeEach(() => {
      mockUsePortfolios.mockReturnValue({
        portfolios: mockPortfolios,
        isLoading: false,
        error: null,
      })
    })

    it('should filter portfolios by search term', async () => {
      const user = userEvent.setup()
      render(<PortfolioList {...defaultProps} />)

      const searchInput = screen.getByLabelText('Search portfolios')
      await user.type(searchInput, 'Growth')

      expect(screen.getByTestId('portfolio-card-portfolio-1')).toBeInTheDocument()
      expect(screen.queryByTestId('portfolio-card-portfolio-2')).not.toBeInTheDocument()
      expect(screen.queryByTestId('portfolio-card-portfolio-3')).not.toBeInTheDocument()
    })

    it('should filter portfolios case-insensitively', async () => {
      const user = userEvent.setup()
      render(<PortfolioList {...defaultProps} />)

      const searchInput = screen.getByLabelText('Search portfolios')
      await user.type(searchInput, 'conservative')

      expect(screen.queryByTestId('portfolio-card-portfolio-1')).not.toBeInTheDocument()
      expect(screen.getByTestId('portfolio-card-portfolio-2')).toBeInTheDocument()
      expect(screen.queryByTestId('portfolio-card-portfolio-3')).not.toBeInTheDocument()
    })

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup()
      render(<PortfolioList {...defaultProps} />)

      const searchInput = screen.getByLabelText('Search portfolios')
      await user.type(searchInput, 'NonExistent')

      expect(screen.getByText('No portfolios match your search criteria.')).toBeInTheDocument()
    })

    it('should clear search and show all portfolios', async () => {
      const user = userEvent.setup()
      render(<PortfolioList {...defaultProps} />)

      const searchInput = screen.getByLabelText('Search portfolios')
      await user.type(searchInput, 'Growth')
      await user.clear(searchInput)

      expect(screen.getByTestId('portfolio-card-portfolio-1')).toBeInTheDocument()
      expect(screen.getByTestId('portfolio-card-portfolio-2')).toBeInTheDocument()
      expect(screen.getByTestId('portfolio-card-portfolio-3')).toBeInTheDocument()
    })
  })

  describe('Currency Filter', () => {
    const mockPortfolios = [
      createTestPortfolio({
        portfolioId: 'portfolio-1',
        name: 'Growth Portfolio',
        baseCurrency: 'USD',
      }),
      createTestPortfolio({
        portfolioId: 'portfolio-2',
        name: 'Conservative Portfolio',
        baseCurrency: 'EUR',
      }),
      createTestPortfolio({
        portfolioId: 'portfolio-3',
        name: 'Balanced Portfolio',
        baseCurrency: 'USD',
      }),
    ]

    beforeEach(() => {
      mockUsePortfolios.mockReturnValue({
        portfolios: mockPortfolios,
        isLoading: false,
        error: null,
      })
    })

    it('should show all currencies in filter dropdown', () => {
      render(<PortfolioList {...defaultProps} />)

      const currencySelect = screen.getByRole('combobox')
      fireEvent.mouseDown(currencySelect)

      expect(screen.getByText('All Currencies')).toBeInTheDocument()
      expect(screen.getByText('USD')).toBeInTheDocument()
      expect(screen.getByText('EUR')).toBeInTheDocument()
    })

    it('should filter portfolios by currency', async () => {
      const user = userEvent.setup()
      render(<PortfolioList {...defaultProps} />)

      const currencySelect = screen.getByRole('combobox')
      await user.click(currencySelect)
      await user.click(screen.getByText('USD'))

      expect(screen.getByTestId('portfolio-card-portfolio-1')).toBeInTheDocument()
      expect(screen.queryByTestId('portfolio-card-portfolio-2')).not.toBeInTheDocument()
      expect(screen.getByTestId('portfolio-card-portfolio-3')).toBeInTheDocument()
    })

    it('should show all portfolios when "All Currencies" is selected', async () => {
      const user = userEvent.setup()
      render(<PortfolioList {...defaultProps} />)

      // First filter by USD
      const currencySelect = screen.getByRole('combobox')
      await user.click(currencySelect)
      await user.click(screen.getByText('USD'))

      // Then select "All Currencies"
      await user.click(currencySelect)
      await user.click(screen.getByText('All Currencies'))

      await waitFor(() => {
        expect(screen.getByTestId('portfolio-card-portfolio-1')).toBeInTheDocument()
        expect(screen.getByTestId('portfolio-card-portfolio-2')).toBeInTheDocument()
        expect(screen.getByTestId('portfolio-card-portfolio-3')).toBeInTheDocument()
      }, { timeout: 30000 })
    })
  })

  describe('Combined Filters', () => {
    const mockPortfolios = [
      createTestPortfolio({
        portfolioId: 'portfolio-1',
        name: 'Growth Portfolio',
        baseCurrency: 'USD',
      }),
      createTestPortfolio({
        portfolioId: 'portfolio-2',
        name: 'Conservative Portfolio',
        baseCurrency: 'EUR',
      }),
      createTestPortfolio({
        portfolioId: 'portfolio-3',
        name: 'Balanced Portfolio',
        baseCurrency: 'USD',
      }),
    ]

    beforeEach(() => {
      mockUsePortfolios.mockReturnValue({
        portfolios: mockPortfolios,
        isLoading: false,
        error: null,
      })
    })

    it('should apply both search and currency filters', async () => {
      const user = userEvent.setup()
      render(<PortfolioList {...defaultProps} />)

      // Apply search filter
      const searchInput = screen.getByLabelText('Search portfolios')
      await user.type(searchInput, 'Portfolio')

      // Apply currency filter
      const currencySelect = screen.getByRole('combobox')
      await user.click(currencySelect)
      await user.click(screen.getByText('USD'))

      await waitFor(() => {
        expect(screen.getByTestId('portfolio-card-portfolio-1')).toBeInTheDocument()
        expect(screen.queryByTestId('portfolio-card-portfolio-2')).not.toBeInTheDocument()
        expect(screen.getByTestId('portfolio-card-portfolio-3')).toBeInTheDocument()
      }, { timeout: 20000 })
    })

    it('should show no results when combined filters have no matches', async () => {
      const user = userEvent.setup()
      render(<PortfolioList {...defaultProps} />)

      // Apply search filter
      const searchInput = screen.getByLabelText('Search portfolios')
      await user.type(searchInput, 'Growth')

      // Apply currency filter that doesn't match
      const currencySelect = screen.getByRole('combobox')
      await user.click(currencySelect)
      await user.click(screen.getByText('EUR'))

      await waitFor(() => {
        expect(screen.getByText('No portfolios match your search criteria.')).toBeInTheDocument()
      }, { timeout: 20000 })
    })
  })

  describe('Header and Actions', () => {
    const mockPortfolios = [
      createTestPortfolio({
        portfolioId: 'portfolio-1',
        name: 'Growth Portfolio',
        baseCurrency: 'USD',
      }),
    ]

    beforeEach(() => {
      mockUsePortfolios.mockReturnValue({
        portfolios: mockPortfolios,
        isLoading: false,
        error: null,
      })
    })

    it('should display "Portfolios" header', () => {
      render(<PortfolioList {...defaultProps} />)

      expect(screen.getByText('Portfolios')).toBeInTheDocument()
    })

    it('should call onCreatePortfolio when "Create Portfolio" button is clicked', async () => {
      const user = userEvent.setup()
      render(<PortfolioList {...defaultProps} />)

      const createButton = screen.getByText('Create Portfolio')
      await user.click(createButton)

      expect(mockOnCreatePortfolio).toHaveBeenCalledTimes(1)
    })

    it('should not show "Create Portfolio" button when onCreatePortfolio is not provided', () => {
      render(<PortfolioList onViewPortfolio={mockOnViewPortfolio} onEditPortfolio={mockOnEditPortfolio} />)

      expect(screen.queryByText('Create Portfolio')).not.toBeInTheDocument()
    })
  })

  describe('Mobile FAB', () => {
    const mockPortfolios = [
      createTestPortfolio({
        portfolioId: 'portfolio-1',
        name: 'Growth Portfolio',
        baseCurrency: 'USD',
      }),
    ]

    beforeEach(() => {
      mockUsePortfolios.mockReturnValue({
        portfolios: mockPortfolios,
        isLoading: false,
        error: null,
      })
    })

    it('should display floating action button for mobile', () => {
      render(<PortfolioList {...defaultProps} />)

      const fab = screen.getByLabelText('add portfolio')
      expect(fab).toBeInTheDocument()
    })

    it('should call onCreatePortfolio when FAB is clicked', async () => {
      const user = userEvent.setup()
      render(<PortfolioList {...defaultProps} />)

      const fab = screen.getByLabelText('add portfolio')
      await user.click(fab)

      expect(mockOnCreatePortfolio).toHaveBeenCalledTimes(1)
    })

    it('should not show FAB when onCreatePortfolio is not provided', () => {
      render(<PortfolioList onViewPortfolio={mockOnViewPortfolio} onEditPortfolio={mockOnEditPortfolio} />)

      expect(screen.queryByLabelText('add portfolio')).not.toBeInTheDocument()
    })
  })

})
