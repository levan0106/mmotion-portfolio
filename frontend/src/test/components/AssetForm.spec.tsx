/**
 * Asset Form Component Tests
 * Unit tests for AssetForm component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { AssetForm } from '../../components/Asset/AssetForm';
import { Asset, AssetType } from '../../types/asset.types';
import { useAssetForm } from '../../hooks/useAssetForm';
import { vi } from 'vitest';

// Mock the useAssetForm hook
vi.mock('../../hooks/useAssetForm');
const mockUseAssetForm = useAssetForm as jest.MockedFunction<typeof useAssetForm>;

const mockAsset: Asset = {
  id: 'asset-1',
  symbol: 'AAPL',
  name: 'Apple Stock',
  type: 'STOCK',
  assetClass: 'Equity',
  currency: 'USD',
  isActive: true,
  description: 'Apple Inc. stock',
  initialValue: 1000000,
  initialQuantity: 100,
  currentValue: 1200000,
  currentQuantity: 100,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'user-1',
  updatedBy: 'user-1',
  totalValue: 1200000,
  totalQuantity: 100,
  hasTrades: false,
  displayName: 'Apple Stock (AAPL)',
};

const mockFormData = {
  name: 'Test Asset',
  symbol: 'TEST',
  type: AssetType.STOCK,
  description: 'Test description',
  initialValue: 1000000,
  initialQuantity: 100,
  currentValue: 1200000,
  currentQuantity: 100,
};

const mockUseAssetFormReturn = {
  data: mockFormData,
  errors: {},
  isSubmitting: false,
  isDirty: false,
  isValid: true,
  setField: vi.fn(),
  setFields: vi.fn(),
  validateField: vi.fn(),
  validateForm: jest.fn(() => true),
  reset: vi.fn(),
  submit: vi.fn(),
  setError: vi.fn(),
  clearError: vi.fn(),
  clearAllErrors: vi.fn(),
};

describe('AssetForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockUseAssetForm.mockReturnValue(mockUseAssetFormReturn);
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render create form by default', () => {
    render(<AssetForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Create New Asset')).toBeInTheDocument();
    expect(screen.getByLabelText('Asset Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Asset Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Initial Value')).toBeInTheDocument();
    expect(screen.getByLabelText('Initial Quantity')).toBeInTheDocument();
  });

  it('should render edit form when asset is provided', () => {
    render(<AssetForm asset={mockAsset} mode="edit" onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Edit Asset')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Apple Stock')).toBeInTheDocument();
    expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
    expect(screen.getByDisplayValue('STOCK')).toBeInTheDocument();
  });

  it('should show dirty indicator when form is dirty', () => {
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      isDirty: true,
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      submit: mockSubmit,
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    expect(mockSubmit).toHaveBeenCalled();
  });

  it('should handle field changes', () => {
    const mockSetField = vi.fn();
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      setField: mockSetField,
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText('Asset Name');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    expect(mockSetField).toHaveBeenCalledWith('name', 'New Name');
  });

  it('should handle field blur validation', () => {
    const mockValidateField = vi.fn();
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      validateField: mockValidateField,
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText('Asset Name');
    fireEvent.blur(nameInput);

    expect(mockValidateField).toHaveBeenCalledWith('name');
  });

  it('should display field errors', () => {
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      errors: {
        name: 'Name is required',
        initialValue: 'Value must be positive',
      },
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Value must be positive')).toBeInTheDocument();
  });

  it('should show error styling for invalid fields', () => {
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      errors: {
        name: 'Name is required',
      },
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText('Asset Name');
    expect(nameInput).toHaveClass('form-input--error');
  });

  it('should handle cancel action', () => {
    render(<AssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should handle reset action', () => {
    const mockReset = vi.fn();
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      reset: mockReset,
      isDirty: true,
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    expect(mockReset).toHaveBeenCalled();
  });

  it('should disable reset button when form is not dirty', () => {
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      isDirty: false,
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    const resetButton = screen.getByText('Reset');
    expect(resetButton).toBeDisabled();
  });

  it('should disable submit button when form is invalid', () => {
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      isValid: false,
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByText('Create Asset');
    expect(submitButton).toBeDisabled();
  });

  it('should show loading state during submission', () => {
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      isSubmitting: true,
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
  });

  it('should show edit loading state', () => {
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      isSubmitting: true,
    });

    render(<AssetForm asset={mockAsset} mode="edit" onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should disable all inputs when loading', () => {
    render(<AssetForm onSubmit={mockOnSubmit} loading={true} />);

    const nameInput = screen.getByLabelText('Asset Name');
    const typeSelect = screen.getByLabelText('Asset Type');
    const valueInput = screen.getByLabelText('Initial Value');

    expect(nameInput).toBeDisabled();
    expect(typeSelect).toBeDisabled();
    expect(valueInput).toBeDisabled();
  });

  it('should disable all inputs when submitting', () => {
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      isSubmitting: true,
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText('Asset Name');
    const typeSelect = screen.getByLabelText('Asset Type');
    const valueInput = screen.getByLabelText('Initial Value');

    expect(nameInput).toBeDisabled();
    expect(typeSelect).toBeDisabled();
    expect(valueInput).toBeDisabled();
  });

  it('should handle number input changes correctly', () => {
    const mockSetField = vi.fn();
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      setField: mockSetField,
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    const valueInput = screen.getByLabelText('Initial Value');
    fireEvent.change(valueInput, { target: { value: '1500000' } });

    expect(mockSetField).toHaveBeenCalledWith('initialValue', 1500000);
  });

  it('should handle empty number inputs', () => {
    const mockSetField = vi.fn();
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      setField: mockSetField,
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    const valueInput = screen.getByLabelText('Current Value');
    fireEvent.change(valueInput, { target: { value: '' } });

    expect(mockSetField).toHaveBeenCalledWith('currentValue', undefined);
  });

  it('should display asset type descriptions', () => {
    render(<AssetForm onSubmit={mockOnSubmit} />);

    // Check if description is shown for the selected type
    expect(screen.getByText(/Cổ phiếu của các công ty niêm yết/)).toBeInTheDocument();
  });

  it('should show help text for optional fields', () => {
    render(<AssetForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Optional unique identifier for the asset')).toBeInTheDocument();
    expect(screen.getByText('Optional current market value')).toBeInTheDocument();
    expect(screen.getByText('Optional current quantity held')).toBeInTheDocument();
  });

  it('should mark required fields with asterisk', () => {
    render(<AssetForm onSubmit={mockOnSubmit} />);

    const nameLabel = screen.getByText('Asset Name');
    const typeLabel = screen.getByText('Asset Type');
    const valueLabel = screen.getByText('Initial Value');
    const quantityLabel = screen.getByText('Initial Quantity');

    expect(nameLabel).toHaveTextContent('*');
    expect(typeLabel).toHaveTextContent('*');
    expect(valueLabel).toHaveTextContent('*');
    expect(quantityLabel).toHaveTextContent('*');
  });

  it('should apply custom className', () => {
    const { container } = render(<AssetForm onSubmit={mockOnSubmit} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('asset-form', 'custom-class');
  });

  it('should handle form reset when no onCancel provided', () => {
    const mockReset = vi.fn();
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      reset: mockReset,
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockReset).toHaveBeenCalled();
  });

  it('should clear errors when field changes', () => {
    const mockClearError = vi.fn();
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      clearError: mockClearError,
    });

    render(<AssetForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText('Asset Name');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    expect(mockClearError).toHaveBeenCalledWith('name');
  });

  it('should update form when asset prop changes', () => {
    const mockSetFields = vi.fn();
    mockUseAssetForm.mockReturnValue({
      ...mockUseAssetFormReturn,
      setFields: mockSetFields,
    });

    const { rerender } = render(<AssetForm onSubmit={mockOnSubmit} />);

    // Change asset prop
    rerender(<AssetForm asset={mockAsset} onSubmit={mockOnSubmit} />);

    expect(mockSetFields).toHaveBeenCalledWith({
      name: mockAsset.name,
      symbol: mockAsset.symbol,
      type: mockAsset.type,
      description: mockAsset.description,
      initialValue: mockAsset.initialValue,
      initialQuantity: mockAsset.initialQuantity,
      currentValue: mockAsset.currentValue,
      currentQuantity: mockAsset.currentQuantity,
    });
  });
});
