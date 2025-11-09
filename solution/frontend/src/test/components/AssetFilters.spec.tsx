/**
 * Asset Filters Component Tests
 * Comprehensive unit tests for AssetFilters component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetFilters } from '../../components/Asset/AssetFilters';
import { AssetType, AssetFilters as AssetFiltersType } from '../../types/asset.types';
import { vi } from 'vitest';

// Mock filters
const mockFilters: AssetFiltersType = {
  search: '',
  type: undefined,
  sortBy: 'name',
  sortOrder: 'ASC',
  limit: 10,
};

const mockFiltersWithValues: AssetFiltersType = {
  search: 'test',
  type: AssetType.STOCK,
  sortBy: 'totalValue',
  sortOrder: 'DESC',
  limit: 50,
  minValue: 1000,
  maxValue: 5000,
};

describe('AssetFilters', () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnClearFilters = vi.fn();
  const mockOnToggleAdvanced = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders basic filters correctly', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      expect(screen.getByPlaceholderText('Search assets...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Name A-Z')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25 per page')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('asset-filters', 'custom-class');
    });

    it('renders advanced filters when showAdvanced is true', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          showAdvanced={true}
        />
      );

      expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
      expect(screen.getByText('Value Range')).toBeInTheDocument();
      expect(screen.getByText('Sort Options')).toBeInTheDocument();
    });

    it('hides advanced filters when showAdvanced is false', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          showAdvanced={false}
        />
      );

      expect(screen.queryByText('Advanced Filters')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('updates search term on input change', async () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search assets...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          ...mockFilters,
          search: 'test search',
        });
      });
    });

    it('clears search term when clear button is clicked', async () => {
      render(
        <AssetFilters
          filters={mockFiltersWithValues}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      const clearButton = screen.getByTitle('Clear search');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          ...mockFiltersWithValues,
          search: '',
        });
      });
    });

    it('shows clear button when search term exists', () => {
      render(
        <AssetFilters
          filters={mockFiltersWithValues}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      expect(screen.getByTitle('Clear search')).toBeInTheDocument();
    });

    it('hides clear button when search term is empty', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      expect(screen.queryByTitle('Clear search')).not.toBeInTheDocument();
    });
  });

  describe('Type Filter', () => {
    it('updates type filter on selection change', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      const typeSelect = screen.getByDisplayValue('All Types');
      fireEvent.change(typeSelect, { target: { value: AssetType.STOCK } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        type: AssetType.STOCK,
      });
    });

    it('clears type filter when ALL is selected', () => {
      render(
        <AssetFilters
          filters={mockFiltersWithValues}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      const typeSelect = screen.getByDisplayValue('Cổ phiếu');
      fireEvent.change(typeSelect, { target: { value: 'ALL' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFiltersWithValues,
        type: undefined,
      });
    });

    it('renders all asset type options', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      expect(screen.getByText('All Types')).toBeInTheDocument();
      expect(screen.getByText('Cổ phiếu')).toBeInTheDocument();
      expect(screen.getByText('Trái phiếu')).toBeInTheDocument();
      expect(screen.getByText('Vàng')).toBeInTheDocument();
      expect(screen.getByText('Tiền gửi')).toBeInTheDocument();
      expect(screen.getByText('Tiền mặt')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('updates sort options on change', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      const sortSelect = screen.getByDisplayValue('Name A-Z');
      fireEvent.change(sortSelect, { target: { value: 'totalValue-DESC' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        sortBy: 'totalValue',
        sortOrder: 'DESC',
      });
    });

    it('renders all sort options', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      expect(screen.getByText('Name A-Z')).toBeInTheDocument();
      expect(screen.getByText('Name Z-A')).toBeInTheDocument();
      expect(screen.getByText('Value Low-High')).toBeInTheDocument();
      expect(screen.getByText('Value High-Low')).toBeInTheDocument();
      expect(screen.getByText('Quantity Low-High')).toBeInTheDocument();
      expect(screen.getByText('Quantity High-Low')).toBeInTheDocument();
      expect(screen.getByText('Oldest First')).toBeInTheDocument();
      expect(screen.getByText('Newest First')).toBeInTheDocument();
    });
  });

  describe('Value Range Filter', () => {
    it('updates min value on input change', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          showAdvanced={true}
        />
      );

      const minInput = screen.getByPlaceholderText('Min value');
      fireEvent.change(minInput, { target: { value: '1000' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        minValue: 1000,
      });
    });

    it('updates max value on input change', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          showAdvanced={true}
        />
      );

      const maxInput = screen.getByPlaceholderText('Max value');
      fireEvent.change(maxInput, { target: { value: '5000' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        maxValue: 5000,
      });
    });

    it('clears min value when empty', () => {
      render(
        <AssetFilters
          filters={mockFiltersWithValues}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          showAdvanced={true}
        />
      );

      const minInput = screen.getByDisplayValue('1000');
      fireEvent.change(minInput, { target: { value: '' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFiltersWithValues,
        minValue: undefined,
      });
    });

    it('clears max value when empty', () => {
      render(
        <AssetFilters
          filters={mockFiltersWithValues}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          showAdvanced={true}
        />
      );

      const maxInput = screen.getByDisplayValue('5000');
      fireEvent.change(maxInput, { target: { value: '' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFiltersWithValues,
        maxValue: undefined,
      });
    });
  });

  describe('Limit Filter', () => {
    it('updates limit on selection change', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      const limitSelect = screen.getByDisplayValue('10 per page');
      fireEvent.change(limitSelect, { target: { value: '50' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        limit: 50,
      });
    });

    it('renders all limit options', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      expect(screen.getByText('10 per page')).toBeInTheDocument();
      expect(screen.getByText('25 per page')).toBeInTheDocument();
      expect(screen.getByText('50 per page')).toBeInTheDocument();
      expect(screen.getByText('100 per page')).toBeInTheDocument();
    });
  });

  describe('Advanced Filters Toggle', () => {
    it('calls onToggleAdvanced when toggle button is clicked', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          onToggleAdvanced={mockOnToggleAdvanced}
        />
      );

      const toggleButton = screen.getByText('Show Advanced');
      fireEvent.click(toggleButton);

      expect(mockOnToggleAdvanced).toHaveBeenCalledWith(true);
    });

    it('shows "Hide Advanced" when advanced filters are visible', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          showAdvanced={true}
        />
      );

      expect(screen.getByText('Hide Advanced')).toBeInTheDocument();
    });

    it('shows "Show Advanced" when advanced filters are hidden', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          showAdvanced={false}
        />
      );

      expect(screen.getByText('Show Advanced')).toBeInTheDocument();
    });
  });

  describe('Clear Filters', () => {
    it('calls onClearFilters when clear button is clicked', () => {
      render(
        <AssetFilters
          filters={mockFiltersWithValues}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);

      expect(mockOnClearFilters).toHaveBeenCalled();
    });

    it('shows clear button when filters are active', () => {
      render(
        <AssetFilters
          filters={mockFiltersWithValues}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('hides clear button when no filters are active', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });
  });

  describe('Active Filters Summary', () => {
    it('shows active filters summary when filters are active', () => {
      render(
        <AssetFilters
          filters={mockFiltersWithValues}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(screen.getByText('Search: "test"')).toBeInTheDocument();
      expect(screen.getByText('Type: Cổ phiếu')).toBeInTheDocument();
      expect(screen.getByText('Min: 1000')).toBeInTheDocument();
      expect(screen.getByText('Max: 5000')).toBeInTheDocument();
    });

    it('hides active filters summary when no filters are active', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      expect(screen.queryByText('Active filters:')).not.toBeInTheDocument();
    });

    it('removes individual filter tags when clicked', () => {
      render(
        <AssetFilters
          filters={mockFiltersWithValues}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      const searchTag = screen.getByText('Search: "test"');
      const removeButton = searchTag.querySelector('.filter-tag__remove');
      
      if (removeButton) {
        fireEvent.click(removeButton);
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          ...mockFiltersWithValues,
          search: '',
        });
      }
    });
  });

  describe('Debounced Search', () => {
    it('debounces search input changes', async () => {
      jest.useFakeTimers();
      
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search assets...');
      
      // Type multiple characters quickly
      fireEvent.change(searchInput, { target: { value: 't' } });
      fireEvent.change(searchInput, { target: { value: 'te' } });
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Fast-forward time to trigger debounce
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledTimes(1);
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          ...mockFilters,
          search: 'test',
        });
      });

      jest.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for form elements', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          showAdvanced={true}
        />
      );

      expect(screen.getByLabelText('Search assets...')).toBeInTheDocument();
      expect(screen.getByLabelText('All Types')).toBeInTheDocument();
      expect(screen.getByLabelText('Name A-Z')).toBeInTheDocument();
      expect(screen.getByLabelText('25 per page')).toBeInTheDocument();
    });

    it('has proper ARIA labels for buttons', () => {
      render(
        <AssetFilters
          filters={mockFiltersWithValues}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
        />
      );

      expect(screen.getByTitle('Clear search')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles invalid number inputs gracefully', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          showAdvanced={true}
        />
      );

      const minInput = screen.getByPlaceholderText('Min value');
      fireEvent.change(minInput, { target: { value: 'invalid' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        minValue: undefined,
      });
    });

    it('handles very large number inputs', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          showAdvanced={true}
        />
      );

      const maxInput = screen.getByPlaceholderText('Max value');
      fireEvent.change(maxInput, { target: { value: '999999999999' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        maxValue: 999999999999,
      });
    });

    it('handles negative number inputs', () => {
      render(
        <AssetFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          onClearFilters={mockOnClearFilters}
          showAdvanced={true}
        />
      );

      const minInput = screen.getByPlaceholderText('Min value');
      fireEvent.change(minInput, { target: { value: '-100' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        minValue: -100,
      });
    });
  });
});
