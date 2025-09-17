import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TradeDetailsModal from '../TradeDetailsModal';
import { vi } from 'vitest';

const theme = createTheme();

const mockTrade = {
  tradeId: 'test-trade-1',
  portfolioId: 'test-portfolio-1',
  assetId: 'test-asset-1',
  assetSymbol: 'AAPL',
  assetName: 'Apple Inc.',
  tradeDate: new Date('2024-01-15'),
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
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  realizedPl: 500,
  tradeDetailsCount: 0,
  remainingQuantity: 100,
};

const mockTradeDetails = [
  {
    detailId: 'detail-1',
    buyTradeId: 'test-trade-1',
    sellTradeId: 'test-trade-2',
    assetId: 'test-asset-1',
    matchedQty: 50,
    buyPrice: 150.0,
    sellPrice: 160.0,
    pnl: 500,
    createdAt: new Date('2024-01-20'),
  },
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('TradeDetailsModal', () => {
  const mockOnClose = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trade details when trade is provided', () => {
    renderWithTheme(
      <TradeDetailsModal
        open={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        trade={mockTrade}
        tradeDetails={mockTradeDetails}
        isLoading={false}
      />
    );

    expect(screen.getByText('Trade Details')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    renderWithTheme(
      <TradeDetailsModal
        open={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        trade={mockTrade}
        tradeDetails={[]}
        isLoading={true}
      />
    );

    expect(screen.getByText('Loading trade details...')).toBeInTheDocument();
  });

  it('shows error message when error is provided', () => {
    const errorMessage = 'Failed to load trade details';
    renderWithTheme(
      <TradeDetailsModal
        open={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        trade={mockTrade}
        tradeDetails={[]}
        isLoading={false}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    renderWithTheme(
      <TradeDetailsModal
        open={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        trade={mockTrade}
        tradeDetails={[]}
        isLoading={false}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when trade is null', () => {
    renderWithTheme(
      <TradeDetailsModal
        open={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        trade={null}
        tradeDetails={[]}
        isLoading={false}
      />
    );

    expect(screen.queryByText('Trade Details')).not.toBeInTheDocument();
  });
});
