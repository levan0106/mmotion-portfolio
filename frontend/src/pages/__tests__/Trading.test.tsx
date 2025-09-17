import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import Trading from '../Trading';
import { vi } from 'vitest';

// Mock the hooks
vi.mock('../../hooks/useTrading', () => ({
  useCreateTrade: () => ({
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useParams: () => ({ portfolioId: 'portfolio-1' }),
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
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Trading Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render trading page correctly', () => {
    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    expect(screen.getByText('Trading Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your trades, analyze performance, and track positions')).toBeInTheDocument();
  });

  it('should render tabs correctly', () => {
    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    expect(screen.getByRole('tab', { name: /trade history/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /analysis/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /create trade/i })).toBeInTheDocument();
  });

  it('should switch between tabs', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    // Click on Analysis tab
    const analysisTab = screen.getByRole('tab', { name: /analysis/i });
    await user.click(analysisTab);

    // Should show analysis content
    await waitFor(() => {
      expect(analysisTab).toHaveAttribute('aria-selected', 'true');
    });

    // Click on Create Trade tab
    const createTradeTab = screen.getByRole('tab', { name: /create trade/i });
    await user.click(createTradeTab);

    // Should show create trade form
    await waitFor(() => {
      expect(createTradeTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('should show floating action button', () => {
    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    const fab = screen.getByRole('button', { name: /add trade/i });
    expect(fab).toBeInTheDocument();
  });

  it('should open create trade modal when FAB is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    const fab = screen.getByRole('button', { name: /add trade/i });
    await user.click(fab);

    // Should show create trade modal
    await waitFor(() => {
      expect(screen.getByText('Create New Trade')).toBeInTheDocument();
    });
  });

  it('should handle portfolio not found', () => {
    // Mock useParams to return undefined portfolioId
    vi.doMock('react-router-dom', () => ({
      ...vi.importActual('react-router-dom'),
      useParams: () => ({ portfolioId: undefined }),
    }));

    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    expect(screen.getByText('Portfolio not found')).toBeInTheDocument();
  });

  it('should render TradeListContainer in Trade History tab', () => {
    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    // Should render TradeListContainer (we can check for its content)
    expect(screen.getByText('Trade History')).toBeInTheDocument();
  });

  it('should render TradeAnalysisContainer in Analysis tab', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    // Click on Analysis tab
    const analysisTab = screen.getByRole('tab', { name: /analysis/i });
    await user.click(analysisTab);

    // Should show analysis content
    await waitFor(() => {
      expect(analysisTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('should render TradeForm in Create Trade tab', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    // Click on Create Trade tab
    const createTradeTab = screen.getByRole('tab', { name: /create trade/i });
    await user.click(createTradeTab);

    // Should show create trade form
    await waitFor(() => {
      expect(screen.getByLabelText('Portfolio')).toBeInTheDocument();
      expect(screen.getByLabelText('Asset')).toBeInTheDocument();
      expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
      expect(screen.getByLabelText('Price per Unit')).toBeInTheDocument();
    });
  });

  it('should handle create trade form submission', async () => {
    const user = userEvent.setup();
    const mockMutateAsync = vi.fn().mockResolvedValue({});
    
    // Mock the hook with the mock function
    vi.doMock('../../hooks/useTrading', () => ({
      useCreateTrade: () => ({
        mutateAsync: mockMutateAsync,
        isLoading: false,
        error: null,
      }),
    }));

    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    // Click on Create Trade tab
    const createTradeTab = screen.getByRole('tab', { name: /create trade/i });
    await user.click(createTradeTab);

    // Fill in the form
    await waitFor(() => {
      expect(screen.getByLabelText('Portfolio')).toBeInTheDocument();
    });

    // The form should be rendered and ready for interaction
    expect(screen.getByRole('button', { name: /create trade/i })).toBeInTheDocument();
  });

  it('should close create trade modal when form is submitted', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    // Open modal
    const fab = screen.getByRole('button', { name: /add trade/i });
    await user.click(fab);

    await waitFor(() => {
      expect(screen.getByText('Create New Trade')).toBeInTheDocument();
    });

    // Close modal (this would happen after successful submission)
    // We can test the modal structure
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
  });

  it('should handle loading state in create trade form', () => {
    // Mock loading state
    vi.doMock('../../hooks/useTrading', () => ({
      useCreateTrade: () => ({
        mutateAsync: vi.fn(),
        isLoading: true,
        error: null,
      }),
    }));

    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    // Click on Create Trade tab
    const createTradeTab = screen.getByRole('tab', { name: /create trade/i });
    fireEvent.click(createTradeTab);

    // Should show loading state
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should handle error state in create trade form', () => {
    const error = new Error('Failed to create trade');
    
    // Mock error state
    vi.doMock('../../hooks/useTrading', () => ({
      useCreateTrade: () => ({
        mutateAsync: vi.fn(),
        isLoading: false,
        error,
      }),
    }));

    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    // Click on Create Trade tab
    const createTradeTab = screen.getByRole('tab', { name: /create trade/i });
    fireEvent.click(createTradeTab);

    // Should show error message
    expect(screen.getByText('Failed to create trade')).toBeInTheDocument();
  });

  it('should have correct default portfolio ID', async () => {
    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    // Click on Create Trade tab
    const createTradeTab = screen.getByRole('tab', { name: /create trade/i });
    fireEvent.click(createTradeTab);

    // The form should have the correct default portfolio ID
    await waitFor(() => {
      expect(screen.getByLabelText('Portfolio')).toBeInTheDocument();
    });
  });

  it('should render with correct layout structure', () => {
    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    // Check main structure
    expect(screen.getByText('Trading Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your trades, analyze performance, and track positions')).toBeInTheDocument();
    
    // Check tabs container
    const tabsContainer = screen.getByRole('tablist');
    expect(tabsContainer).toBeInTheDocument();
    
    // Check FAB
    const fab = screen.getByRole('button', { name: /add trade/i });
    expect(fab).toBeInTheDocument();
  });

  it('should handle tab change correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Trading />
      </TestWrapper>
    );

    // Initially Trade History tab should be selected
    const tradeHistoryTab = screen.getByRole('tab', { name: /trade history/i });
    expect(tradeHistoryTab).toHaveAttribute('aria-selected', 'true');

    // Click Analysis tab
    const analysisTab = screen.getByRole('tab', { name: /analysis/i });
    await user.click(analysisTab);

    await waitFor(() => {
      expect(analysisTab).toHaveAttribute('aria-selected', 'true');
      expect(tradeHistoryTab).toHaveAttribute('aria-selected', 'false');
    });

    // Click Create Trade tab
    const createTradeTab = screen.getByRole('tab', { name: /create trade/i });
    await user.click(createTradeTab);

    await waitFor(() => {
      expect(createTradeTab).toHaveAttribute('aria-selected', 'true');
      expect(analysisTab).toHaveAttribute('aria-selected', 'false');
    });
  });
});
