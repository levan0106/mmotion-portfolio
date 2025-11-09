import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { TradeListContainer } from '../TradeList';
import { vi } from 'vitest';

// Mock the useTrades hook
const mockUseTrades = vi.fn();

const theme = createTheme();

const mockTrades = [
  {
    tradeId: 'trade-1',
    portfolioId: 'portfolio-1',
    assetId: 'asset-1',
    assetSymbol: 'AAPL',
    assetName: 'Apple Inc.',
    tradeDate: '2024-01-15T10:00:00Z',
    side: 'BUY',
    quantity: 100,
    price: 150.0,
    totalValue: 15000,
    fee: 10.0,
    tax: 5.0,
    totalCost: 15015,
    tradeType: 'MARKET',
    source: 'MANUAL',
    notes: 'Test trade',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    realizedPl: 500,
    tradeDetailsCount: 0,
    remainingQuantity: 100,
  },
  {
    tradeId: 'trade-2',
    portfolioId: 'portfolio-1',
    assetId: 'asset-2',
    assetSymbol: 'GOOGL',
    assetName: 'Alphabet Inc.',
    tradeDate: '2024-01-16T11:00:00Z',
    side: 'SELL',
    quantity: 50,
    price: 2800.0,
    totalValue: 140000,
    fee: 20.0,
    tax: 10.0,
    totalCost: 140030,
    tradeType: 'LIMIT',
    source: 'API',
    notes: 'Sell order',
    createdAt: '2024-01-16T11:00:00Z',
    updatedAt: '2024-01-16T11:00:00Z',
    realizedPl: 2000,
    tradeDetailsCount: 1,
    remainingQuantity: 0,
  },
];

// Mock the hooks
vi.mock('../../hooks/useTrading', () => ({
  useTrades: mockUseTrades,
  useDeleteTrade: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
  })),
  useUpdateTrade: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
  })),
  useTradeDetails: vi.fn(() => ({
    data: {
      tradeDetails: [
        {
          detailId: 'detail-1',
          buyTradeId: 'trade-1',
          sellTradeId: 'trade-2',
          assetId: 'asset-1',
          matchedQty: 50,
          buyPrice: 150.0,
          sellPrice: 160.0,
          pnl: 500,
          createdAt: '2024-01-20T12:00:00Z',
        },
      ],
    },
    isLoading: false,
    error: null,
  })),
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('TradeListContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock return value
    mockUseTrades.mockReturnValue({
      data: mockTrades,
      isLoading: false,
      error: null,
    });
  });

  it('renders trade list with trades', () => {
    renderWithProviders(<TradeListContainer portfolioId="portfolio-1" />);

    expect(screen.getByText('Trade History')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('GOOGL')).toBeInTheDocument();
  });

  it('opens edit modal when edit action is clicked', async () => {
    renderWithProviders(<TradeListContainer portfolioId="portfolio-1" />);

    // Find the first trade's action button
    const actionButtons = screen.getAllByRole('button', { name: /actions/i });
    fireEvent.click(actionButtons[0]);

    // Click edit option
    const editOption = screen.getByText('Edit Trade');
    fireEvent.click(editOption);

    // Check if edit modal opens
    await waitFor(() => {
      expect(screen.getByText('Edit Trade')).toBeInTheDocument();
    });
  });

  it('opens details modal when view action is clicked', async () => {
    renderWithProviders(<TradeListContainer portfolioId="portfolio-1" />);

    // Find the first trade's action button
    const actionButtons = screen.getAllByRole('button', { name: /actions/i });
    fireEvent.click(actionButtons[0]);

    // Click view option
    const viewOption = screen.getByText('View Details');
    fireEvent.click(viewOption);

    // Check if details modal opens
    await waitFor(() => {
      expect(screen.getByText('Trade Details')).toBeInTheDocument();
    });
  });

  it('shows loading state when trades are loading', () => {
    // Mock the hook to return loading state
    mockUseTrades.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    renderWithProviders(<TradeListContainer portfolioId="portfolio-1" />);

    expect(screen.getByText('Loading trades...')).toBeInTheDocument();
  });

  it('shows error state when trades fail to load', () => {
    // Mock the hook to return error state
    mockUseTrades.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'Failed to load trades' },
    });

    renderWithProviders(<TradeListContainer portfolioId="portfolio-1" />);

    expect(screen.getByText('Failed to load trades')).toBeInTheDocument();
  });

  it('filters trades by search term', () => {
    renderWithProviders(<TradeListContainer portfolioId="portfolio-1" />);

    const searchInput = screen.getByPlaceholderText('Search trades...');
    fireEvent.change(searchInput, { target: { value: 'AAPL' } });

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.queryByText('GOOGL')).not.toBeInTheDocument();
  });

  it('filters trades by side', () => {
    renderWithProviders(<TradeListContainer portfolioId="portfolio-1" />);

    const sideSelect = screen.getByLabelText('Side');
    fireEvent.mouseDown(sideSelect);
    
    const buyOption = screen.getByText('Buy');
    fireEvent.click(buyOption);

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.queryByText('GOOGL')).not.toBeInTheDocument();
  });
});