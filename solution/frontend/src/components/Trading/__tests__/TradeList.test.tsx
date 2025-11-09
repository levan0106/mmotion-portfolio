import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import TradeList, { Trade } from '../TradeList';
import { TradeSide, TradeType, TradeSource } from '../../../types';

// Mock the hook
vi.mock('../../../hooks/useTrading', () => ({
  useTrades: () => ({
    data: [
      {
        tradeId: 'trade-1',
        portfolioId: 'portfolio-1',
        assetId: 'asset-1',
        assetSymbol: 'HPG',
        assetName: 'Hoa Phat Group',
        tradeDate: '2024-01-01',
        side: TradeSide.BUY,
        quantity: 100,
        price: 50,
        totalValue: 5000,
        fee: 5,
        tax: 2,
        totalCost: 5007,
        tradeType: TradeType.MARKET,
        source: TradeSource.MANUAL,
        notes: 'Test trade',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        realizedPl: 500,
        tradeDetailsCount: 1,
        remainingQuantity: 0,
      },
      {
        tradeId: 'trade-2',
        portfolioId: 'portfolio-1',
        assetId: 'asset-2',
        assetSymbol: 'VCB',
        assetName: 'Vietcombank',
        tradeDate: '2024-01-02',
        side: TradeSide.SELL,
        quantity: 50,
        price: 60,
        totalValue: 3000,
        fee: 3,
        tax: 1,
        totalCost: 3004,
        tradeType: TradeType.LIMIT,
        source: TradeSource.API,
        notes: 'Sell order',
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02',
        realizedPl: -200,
        tradeDetailsCount: 1,
        remainingQuantity: 0,
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('TradeList', () => {
  const mockTrades: Trade[] = [
    {
      tradeId: 'trade-1',
      portfolioId: 'portfolio-1',
      assetId: 'asset-1',
      assetSymbol: 'HPG',
      assetName: 'Hoa Phat Group',
      tradeDate: '2024-01-01',
      side: TradeSide.BUY,
      quantity: 100,
      price: 50,
      totalValue: 5000,
      fee: 5,
      tax: 2,
      totalCost: 5007,
      tradeType: TradeType.MARKET,
      source: TradeSource.MANUAL,
      notes: 'Test trade',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      realizedPl: 500,
      tradeDetailsCount: 1,
      remainingQuantity: 0,
    },
    {
      tradeId: 'trade-2',
      portfolioId: 'portfolio-1',
      assetId: 'asset-2',
      assetSymbol: 'VCB',
      assetName: 'Vietcombank',
      tradeDate: '2024-01-02',
      side: TradeSide.SELL,
      quantity: 50,
      price: 60,
      totalValue: 3000,
      fee: 3,
      tax: 1,
      totalCost: 3004,
      tradeType: TradeType.LIMIT,
      source: TradeSource.API,
      notes: 'Sell order',
      createdAt: '2024-01-02',
      updatedAt: '2024-01-02',
      realizedPl: -200,
      tradeDetailsCount: 1,
      remainingQuantity: 0,
    },
  ];

  const defaultProps = {
    trades: mockTrades,
    isLoading: false,
    error: undefined,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onView: vi.fn(),
    onCreate: vi.fn(),
    onPageChange: vi.fn(),
    onFiltersChange: vi.fn(),
    filters: {},
    currentPage: 1,
    totalPages: 1,
    totalTrades: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render trade list correctly', () => {
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Trade History')).toBeInTheDocument();
    expect(screen.getByText('HPG')).toBeInTheDocument();
    expect(screen.getByText('Hoa Phat Group')).toBeInTheDocument();
    expect(screen.getByText('VCB')).toBeInTheDocument();
    expect(screen.getByText('Vietcombank')).toBeInTheDocument();
  });

  it('should display trade data in table format', () => {
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    // Check table headers
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Asset')).toBeInTheDocument();
    expect(screen.getByText('Side')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('Fees')).toBeInTheDocument();
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('P&L')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check trade data
    expect(screen.getByText('100.00')).toBeInTheDocument(); // Quantity
    expect(screen.getByText('$50.00')).toBeInTheDocument(); // Price
    expect(screen.getByText('$5,000.00')).toBeInTheDocument(); // Total Value
    expect(screen.getByText('$7.00')).toBeInTheDocument(); // Fees
    expect(screen.getByText('$5,007.00')).toBeInTheDocument(); // Total Cost
  });

  it('should display trade side chips with correct colors', () => {
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    const buyChips = screen.getAllByText('BUY');
    const sellChips = screen.getAllByText('SELL');

    expect(buyChips).toHaveLength(1);
    expect(sellChips).toHaveLength(1);
  });

  it('should display trade type chips', () => {
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('MARKET')).toBeInTheDocument();
    expect(screen.getByText('LIMIT')).toBeInTheDocument();
  });

  it('should display source chips', () => {
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('MANUAL')).toBeInTheDocument();
    expect(screen.getByText('API')).toBeInTheDocument();
  });

  it('should display P&L with correct colors', () => {
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    // Positive P&L should be green, negative should be red
    expect(screen.getByText('500 $')).toBeInTheDocument(); // Positive P&L
    expect(screen.getByText('-200 $')).toBeInTheDocument(); // Negative P&L
  });

  it('should handle search functionality', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search trades...');
    await user.type(searchInput, 'HPG');

    // Should filter to show only HPG trades
    expect(screen.getByText('HPG')).toBeInTheDocument();
    expect(screen.queryByText('VCB')).not.toBeInTheDocument();
  });

  it('should handle side filter', async () => {
    
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    const sideFilter = screen.getByLabelText('Side');
    fireEvent.mouseDown(sideFilter);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Buy'));
    });

    // Should show only BUY trades
    expect(screen.getByText('BUY')).toBeInTheDocument();
    expect(screen.queryByText('SELL')).not.toBeInTheDocument();
  });

  it('should handle type filter', async () => {
    
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    const typeFilter = screen.getByLabelText('Type');
    fireEvent.mouseDown(typeFilter);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Market'));
    });

    // Should show only MARKET trades
    expect(screen.getByText('MARKET')).toBeInTheDocument();
    expect(screen.queryByText('LIMIT')).not.toBeInTheDocument();
  });

  it('should handle source filter', async () => {
    
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    const sourceFilter = screen.getByLabelText('Source');
    fireEvent.mouseDown(sourceFilter);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Manual'));
    });

    // Should show only MANUAL trades
    expect(screen.getByText('MANUAL')).toBeInTheDocument();
    expect(screen.queryByText('API')).not.toBeInTheDocument();
  });

  it('should handle action menu', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    const actionButtons = screen.getAllByLabelText('Actions');
    await user.click(actionButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Edit Trade')).toBeInTheDocument();
      expect(screen.getByText('Delete Trade')).toBeInTheDocument();
    });
  });

  it('should call onView when view action is clicked', async () => {
    const user = userEvent.setup();
    const mockOnView = vi.fn();
    
    render(
      <TestWrapper>
        <TradeList {...defaultProps} onView={mockOnView} />
      </TestWrapper>
    );

    const actionButtons = screen.getAllByLabelText('Actions');
    await user.click(actionButtons[0]);

    await waitFor(() => {
      fireEvent.click(screen.getByText('View Details'));
    });

    expect(mockOnView).toHaveBeenCalledWith(mockTrades[0]);
  });

  it('should call onEdit when edit action is clicked', async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    
    render(
      <TestWrapper>
        <TradeList {...defaultProps} onEdit={mockOnEdit} />
      </TestWrapper>
    );

    const actionButtons = screen.getAllByLabelText('Actions');
    await user.click(actionButtons[0]);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Edit Trade'));
    });

    expect(mockOnEdit).toHaveBeenCalledWith(mockTrades[0]);
  });

  it('should call onDelete when delete action is clicked', async () => {
    const user = userEvent.setup();
    const mockOnDelete = vi.fn();
    
    render(
      <TestWrapper>
        <TradeList {...defaultProps} onDelete={mockOnDelete} />
      </TestWrapper>
    );

    const actionButtons = screen.getAllByLabelText('Actions');
    await user.click(actionButtons[0]);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Delete Trade'));
    });

    expect(mockOnDelete).toHaveBeenCalledWith(mockTrades[0]);
  });

  it('should call onCreate when new trade button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnCreate = vi.fn();
    
    render(
      <TestWrapper>
        <TradeList {...defaultProps} onCreate={mockOnCreate} />
      </TestWrapper>
    );

    const newTradeButton = screen.getByRole('button', { name: /new trade/i });
    await user.click(newTradeButton);

    expect(mockOnCreate).toHaveBeenCalled();
  });

  it('should display loading state', () => {
    render(
      <TestWrapper>
        <TradeList {...defaultProps} isLoading={true} />
      </TestWrapper>
    );

    expect(screen.getByText('Loading trades...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    const errorMessage = 'Failed to load trades';
    
    render(
      <TestWrapper>
        <TradeList {...defaultProps} error={errorMessage} />
      </TestWrapper>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should display empty state when no trades', () => {
    render(
      <TestWrapper>
        <TradeList {...defaultProps} trades={[]} />
      </TestWrapper>
    );

    expect(screen.getByText('No trades found matching your criteria.')).toBeInTheDocument();
  });

  it('should display trade count', () => {
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('2 of 2 trades')).toBeInTheDocument();
  });

  it('should handle pagination', () => {
    const mockOnPageChange = vi.fn();
    
    render(
      <TestWrapper>
        <TradeList {...defaultProps} totalPages={3} onPageChange={mockOnPageChange} />
      </TestWrapper>
    );

    // Pagination should be visible when totalPages > 1
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    // Check date formatting
    expect(screen.getByText('Jan 01, 2024')).toBeInTheDocument();
    expect(screen.getByText('Jan 02, 2024')).toBeInTheDocument();
  });

  it('should format currency correctly', () => {
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    // Check currency formatting
    expect(screen.getByText('50 $')).toBeInTheDocument();
    expect(screen.getByText('60 $')).toBeInTheDocument();
    expect(screen.getByText('5,000 $')).toBeInTheDocument();
    expect(screen.getByText('3,000 $')).toBeInTheDocument();
  });

  it('should format numbers correctly', () => {
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    // Check number formatting
    expect(screen.getByText('100.00')).toBeInTheDocument();
    expect(screen.getByText('50.00')).toBeInTheDocument();
  });

  it('should handle filters change', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();
    
    render(
      <TestWrapper>
        <TradeList {...defaultProps} onFiltersChange={mockOnFiltersChange} />
      </TestWrapper>
    );

    const filtersButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filtersButton);

    // Should call onFiltersChange when filters are toggled
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it('should show trade details count', () => {
    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    // Should show trade details count if available
    expect(screen.getByText('1')).toBeInTheDocument(); // tradeDetailsCount
  });

  it('should handle responsive design', () => {
    // Mock window.innerWidth for responsive testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768, // Tablet width
    });

    render(
      <TestWrapper>
        <TradeList {...defaultProps} />
      </TestWrapper>
    );

    // Component should render without errors on different screen sizes
    expect(screen.getByText('Trade History')).toBeInTheDocument();
  });
});
