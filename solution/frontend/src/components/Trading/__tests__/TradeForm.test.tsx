import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TradeForm, { TradeFormData } from '../TradeForm';
import { TradeSide, TradeType, TradeSource } from '../../../types';
import { vi } from 'vitest';

// Mock the hooks
vi.mock('../../../hooks/usePortfolios', () => ({
  usePortfolios: () => ({
    portfolios: [
      { portfolioId: 'portfolio-1', name: 'Test Portfolio 1' },
      { portfolioId: 'portfolio-2', name: 'Test Portfolio 2' },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../../hooks/useAssets', () => ({
  useAssets: () => ({
    data: [
      { assetId: 'asset-1', symbol: 'HPG', name: 'Hoa Phat Group' },
      { assetId: 'asset-2', symbol: 'VCB', name: 'Vietcombank' },
    ],
  }),
}));

vi.mock('../../../hooks/useAccount', () => ({
  useAccount: () => ({
    accountId: 'account-1',
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
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('TradeForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    onSubmit: mockOnSubmit,
    mode: 'create' as const,
  };

  it('should render form fields correctly', () => {
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Portfolio')).toBeInTheDocument();
    expect(screen.getByLabelText('Asset')).toBeInTheDocument();
    expect(screen.getByLabelText('Trade Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Trade Side')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Price per Unit')).toBeInTheDocument();
    expect(screen.getByLabelText('Trading Fee')).toBeInTheDocument();
    expect(screen.getByLabelText('Tax')).toBeInTheDocument();
    expect(screen.getByLabelText('Trade Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Source')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('should populate portfolio dropdown with data', async () => {
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    const portfolioSelect = screen.getByLabelText('Portfolio');
    fireEvent.mouseDown(portfolioSelect);

    await waitFor(() => {
      expect(screen.getByText('Test Portfolio 1')).toBeInTheDocument();
      expect(screen.getByText('Test Portfolio 2')).toBeInTheDocument();
    });
  });

  it('should populate asset dropdown with data', async () => {
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    const assetSelect = screen.getByLabelText('Asset');
    fireEvent.mouseDown(assetSelect);

    await waitFor(() => {
      expect(screen.getByText('HPG - Hoa Phat Group')).toBeInTheDocument();
      expect(screen.getByText('VCB - Vietcombank')).toBeInTheDocument();
    });
  });

  it('should calculate total value and cost correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    const quantityInput = screen.getByLabelText('Quantity');
    const priceInput = screen.getByLabelText('Price per Unit');
    const feeInput = screen.getByLabelText('Trading Fee');
    const taxInput = screen.getByLabelText('Tax');

    await user.type(quantityInput, '100');
    await user.type(priceInput, '50');
    await user.type(feeInput, '5');
    await user.type(taxInput, '2');

    await waitFor(() => {
      expect(screen.getByText('$5,000.00')).toBeInTheDocument(); // Total Value
      expect(screen.getByText('$7.00')).toBeInTheDocument(); // Fees & Taxes
      expect(screen.getByText('$5,007.00')).toBeInTheDocument(); // Total Cost
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /create trade/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Portfolio is required')).toBeInTheDocument();
      expect(screen.getByText('Asset is required')).toBeInTheDocument();
      expect(screen.getByText('Quantity is required')).toBeInTheDocument();
      expect(screen.getByText('Price is required')).toBeInTheDocument();
    });
  });

  it('should validate quantity is positive', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    const quantityInput = screen.getByLabelText('Quantity');
    await user.type(quantityInput, '-10');

    const submitButton = screen.getByRole('button', { name: /create trade/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Quantity must be positive')).toBeInTheDocument();
    });
  });

  it('should validate price is non-negative', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    const priceInput = screen.getByLabelText('Price per Unit');
    await user.type(priceInput, '-5');

    const submitButton = screen.getByRole('button', { name: /create trade/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Price must be non-negative')).toBeInTheDocument();
    });
  });

  it('should allow price of 0', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    const priceInput = screen.getByLabelText('Price per Unit');
    await user.clear(priceInput);
    await user.type(priceInput, '0');

    const submitButton = screen.getByRole('button', { name: /create trade/i });
    await user.click(submitButton);

    // Should not show any price validation error
    await waitFor(() => {
      expect(screen.queryByText('Price must be non-negative')).not.toBeInTheDocument();
    });
  });

  it('should validate fee is not negative', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    const feeInput = screen.getByLabelText('Trading Fee');
    await user.type(feeInput, '-1');

    const submitButton = screen.getByRole('button', { name: /create trade/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Fee cannot be negative')).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    // Fill in all required fields
    const portfolioSelect = screen.getByLabelText('Portfolio');
    fireEvent.mouseDown(portfolioSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText('Test Portfolio 1'));
    });

    const assetSelect = screen.getByLabelText('Asset');
    fireEvent.mouseDown(assetSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText('HPG - Hoa Phat Group'));
    });

    await user.type(screen.getByLabelText('Quantity'), '100');
    await user.type(screen.getByLabelText('Price per Unit'), '50');
    await user.type(screen.getByLabelText('Trading Fee'), '5');
    await user.type(screen.getByLabelText('Tax'), '2');

    const submitButton = screen.getByRole('button', { name: /create trade/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          portfolioId: 'portfolio-1',
          assetId: 'asset-1',
          quantity: 100,
          price: 50,
          fee: 5,
          tax: 2,
          side: TradeSide.BUY,
          tradeType: TradeType.MARKET,
          source: TradeSource.MANUAL,
        })
      );
    });
  });

  it('should show loading state when submitting', async () => {
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} isLoading={true} />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /processing/i });
    expect(submitButton).toBeDisabled();
  });

  it('should display error message', () => {
    const errorMessage = 'Failed to create trade';
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} error={errorMessage} />
      </TestWrapper>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should pre-populate form in edit mode', () => {
    const initialData: Partial<TradeFormData> = {
      portfolioId: 'portfolio-1',
      assetId: 'asset-1',
      quantity: 100,
      price: 50,
      fee: 5,
      tax: 2,
      side: TradeSide.SELL,
      tradeType: TradeType.LIMIT,
      source: TradeSource.API,
      notes: 'Test notes',
    };

    render(
      <TestWrapper>
        <TradeForm {...defaultProps} mode="edit" initialData={initialData} />
      </TestWrapper>
    );

    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
  });

  it('should show correct title for edit mode', () => {
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} mode="edit" />
      </TestWrapper>
    );

    expect(screen.getByText('Edit Trade')).toBeInTheDocument();
  });

  it('should show correct button text for edit mode', () => {
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} mode="edit" />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /update trade/i })).toBeInTheDocument();
  });

  it('should handle trade side selection', async () => {
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    const sideSelect = screen.getByLabelText('Trade Side');
    fireEvent.mouseDown(sideSelect);

    await waitFor(() => {
      fireEvent.click(screen.getByText('SELL'));
    });

    // Check that SELL chip is displayed
    expect(screen.getByText('SELL')).toBeInTheDocument();
  });

  it('should handle trade type selection', async () => {
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    const typeSelect = screen.getByLabelText('Trade Type');
    fireEvent.mouseDown(typeSelect);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Limit Order'));
    });

    // Verify the selection was made
    expect(screen.getByDisplayValue('LIMIT')).toBeInTheDocument();
  });

  it('should handle source selection', async () => {
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    const sourceSelect = screen.getByLabelText('Source');
    fireEvent.mouseDown(sourceSelect);

    await waitFor(() => {
      fireEvent.click(screen.getByText('API Import'));
    });

    // Verify the selection was made
    expect(screen.getByDisplayValue('API')).toBeInTheDocument();
  });

  it('should show asset chip when asset is selected', async () => {
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    const assetSelect = screen.getByLabelText('Asset');
    fireEvent.mouseDown(assetSelect);

    await waitFor(() => {
      fireEvent.click(screen.getByText('HPG - Hoa Phat Group'));
    });

    await waitFor(() => {
      expect(screen.getByText('HPG - Hoa Phat Group')).toBeInTheDocument();
    });
  });

  it('should validate notes length', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} />
      </TestWrapper>
    );

    const notesInput = screen.getByLabelText('Notes');
    const longText = 'a'.repeat(501); // Exceeds 500 character limit
    
    await user.type(notesInput, longText);

    const submitButton = screen.getByRole('button', { name: /create trade/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Notes cannot exceed 500 characters')).toBeInTheDocument();
    });
  });

  it('should handle default portfolio ID', () => {
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} defaultPortfolioId="portfolio-2" />
      </TestWrapper>
    );

    // The default portfolio should be pre-selected
    expect(screen.getByDisplayValue('portfolio-2')).toBeInTheDocument();
  });

  it('should disable form fields when loading', () => {
    render(
      <TestWrapper>
        <TradeForm {...defaultProps} isLoading={true} />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Portfolio')).toBeDisabled();
    expect(screen.getByLabelText('Asset')).toBeDisabled();
    expect(screen.getByLabelText('Quantity')).toBeDisabled();
    expect(screen.getByLabelText('Price per Unit')).toBeDisabled();
  });
});
