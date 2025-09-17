import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PortfolioForm from './PortfolioForm'

// Mock the useAccount hook
const mockUseAccount = vi.fn()
vi.mock('../../hooks/useAccount', () => ({
  useAccount: () => mockUseAccount(),
}))

describe('PortfolioForm', () => {
  const mockOnClose = vi.fn()
  const mockOnSubmit = vi.fn()

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAccount.mockReturnValue({ accountId: 'test-account-id' })
  })

  describe('Dialog Rendering', () => {
    it('should render create form when not editing', () => {
      render(<PortfolioForm {...defaultProps} />)

      expect(screen.getByText('Create New Portfolio')).toBeInTheDocument()
      expect(screen.getByLabelText('Portfolio Name')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByLabelText('Account ID')).toBeInTheDocument()
      expect(screen.getByText('Create')).toBeInTheDocument()
    })

    it('should render edit form when editing', () => {
      const initialData = {
        name: 'Test Portfolio',
        baseCurrency: 'USD',
        accountId: 'test-account-id',
      }

      render(
        <PortfolioForm
          {...defaultProps}
          isEditing={true}
          initialData={initialData}
        />
      )

      expect(screen.getByText('Edit Portfolio')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Portfolio')).toBeInTheDocument()
      expect(screen.getByText('Update')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<PortfolioForm {...defaultProps} open={false} />)

      expect(screen.queryByText('Create New Portfolio')).not.toBeInTheDocument()
    })
  })

  describe('Form Fields', () => {
    it('should have correct default values', () => {
      render(<PortfolioForm {...defaultProps} />)

      expect(screen.getByDisplayValue('')).toBeInTheDocument() // Portfolio name
      expect(screen.getByDisplayValue('VND')).toBeInTheDocument() // Base currency
      expect(screen.getByDisplayValue('test-account-id')).toBeInTheDocument() // Account ID
    })

    it('should populate form with initial data', () => {
      const initialData = {
        name: 'My Portfolio',
        baseCurrency: 'EUR',
        accountId: 'custom-account-id',
      }

      render(
        <PortfolioForm
          {...defaultProps}
          initialData={initialData}
        />
      )

      expect(screen.getByDisplayValue('My Portfolio')).toBeInTheDocument()
      expect(screen.getByDisplayValue('EUR')).toBeInTheDocument()
      expect(screen.getByDisplayValue('custom-account-id')).toBeInTheDocument()
    })

    it('should show all currency options', () => {
      render(<PortfolioForm {...defaultProps} />)

      const currencySelect = screen.getByRole('combobox')
      fireEvent.mouseDown(currencySelect)

      expect(screen.getAllByText('VND - Vietnamese Dong')).toHaveLength(2) // One in select, one in menu
      expect(screen.getByText('USD - US Dollar')).toBeInTheDocument()
      expect(screen.getByText('EUR - Euro')).toBeInTheDocument()
      expect(screen.getByText('GBP - British Pound')).toBeInTheDocument()
      expect(screen.getByText('JPY - Japanese Yen')).toBeInTheDocument()
    })

    it('should disable account ID field when editing', () => {
      const initialData = {
        name: 'Test Portfolio',
        baseCurrency: 'USD',
        accountId: 'test-account-id',
      }

      render(
        <PortfolioForm
          {...defaultProps}
          isEditing={true}
          initialData={initialData}
        />
      )

      const accountIdField = screen.getByLabelText('Account ID')
      expect(accountIdField).toBeDisabled()
    })
  })

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup()
      render(<PortfolioForm {...defaultProps} />)

      const submitButton = screen.getByText('Create')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Portfolio name is required')).toBeInTheDocument()
      })
    })

    it('should show validation error for short portfolio name', async () => {
      const user = userEvent.setup()
      render(<PortfolioForm {...defaultProps} />)

      const nameField = screen.getByLabelText('Portfolio Name')
      await user.type(nameField, 'A')

      const submitButton = screen.getByText('Create')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
      })
    })


    it('should show validation error for empty account ID', async () => {
      const user = userEvent.setup()
      render(<PortfolioForm {...defaultProps} />)

      const nameField = screen.getByLabelText('Portfolio Name')
      await user.type(nameField, 'Test Portfolio')

      const accountIdField = screen.getByLabelText('Account ID')
      await user.clear(accountIdField)

      const submitButton = screen.getByText('Create')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Account ID is required')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit with correct data when form is valid', async () => {
      const user = userEvent.setup()
      render(<PortfolioForm {...defaultProps} />)

      const nameField = screen.getByLabelText('Portfolio Name')
      await user.type(nameField, 'My Test Portfolio')

      const currencySelect = screen.getByRole('combobox')
      await user.click(currencySelect)
      await user.click(screen.getByText('USD - US Dollar'))

      const submitButton = screen.getByText('Create')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'My Test Portfolio',
          baseCurrency: 'USD',
          accountId: 'test-account-id',
        })
      }, { timeout: 25000 })
    })

    it('should not call onSubmit when form is invalid', async () => {
      const user = userEvent.setup()
      render(<PortfolioForm {...defaultProps} />)

      const submitButton = screen.getByText('Create')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it('should show loading state on submit button', () => {
      render(<PortfolioForm {...defaultProps} isLoading={true} />)

      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeDisabled()
    })
  })

  describe('Form Reset and Close', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<PortfolioForm {...defaultProps} />)

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when dialog backdrop is clicked', async () => {
      const user = userEvent.setup()
      render(<PortfolioForm {...defaultProps} />)

      // Click outside the dialog content
      const backdrop = document.querySelector('.MuiBackdrop-root')
      if (backdrop) {
        await user.click(backdrop)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      }
    })

    it('should reset form when dialog is closed and reopened', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<PortfolioForm {...defaultProps} />)

      // Fill form
      const nameField = screen.getByLabelText('Portfolio Name')
      await user.type(nameField, 'Test Portfolio')

      // Close dialog
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      // Reopen dialog
      rerender(<PortfolioForm {...defaultProps} open={true} />)

      // Form should be reset
      expect(screen.getByDisplayValue('')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Failed to create portfolio'
      render(<PortfolioForm {...defaultProps} error={errorMessage} />)

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('should not display error message when no error', () => {
      render(<PortfolioForm {...defaultProps} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Account Integration', () => {
    it('should use account ID from useAccount hook as default', () => {
      mockUseAccount.mockReturnValue({ accountId: 'custom-account-123' })
      render(<PortfolioForm {...defaultProps} />)

      expect(screen.getByDisplayValue('custom-account-123')).toBeInTheDocument()
    })

    it('should handle missing account ID', () => {
      mockUseAccount.mockReturnValue({ accountId: null })
      render(<PortfolioForm {...defaultProps} />)

      const nameField = screen.getByLabelText('Portfolio Name')
      expect(nameField).toHaveValue('')
    })

    it('should update account ID when useAccount hook changes', () => {
      const { rerender } = render(<PortfolioForm {...defaultProps} />)

      // Change account ID
      mockUseAccount.mockReturnValue({ accountId: 'new-account-id' })
      rerender(<PortfolioForm {...defaultProps} />)

      expect(screen.getByDisplayValue('new-account-id')).toBeInTheDocument()
    })
  })

  describe('Edit Mode Specific Behavior', () => {
    it('should show correct button text in edit mode', () => {
      const initialData = {
        name: 'Test Portfolio',
        baseCurrency: 'USD',
        accountId: 'test-account-id',
      }

      render(
        <PortfolioForm
          {...defaultProps}
          isEditing={true}
          initialData={initialData}
        />
      )

      expect(screen.getByText('Update')).toBeInTheDocument()
    })

    it('should show loading text in edit mode', () => {
      const initialData = {
        name: 'Test Portfolio',
        baseCurrency: 'USD',
        accountId: 'test-account-id',
      }

      render(
        <PortfolioForm
          {...defaultProps}
          isEditing={true}
          initialData={initialData}
          isLoading={true}
        />
      )

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('should preserve account ID when editing', async () => {
      const user = userEvent.setup()
      const initialData = {
        name: 'Test Portfolio',
        baseCurrency: 'USD',
        accountId: 'original-account-id',
      }

      render(
        <PortfolioForm
          {...defaultProps}
          isEditing={true}
          initialData={initialData}
        />
      )

      const nameField = screen.getByLabelText('Portfolio Name')
      await user.clear(nameField)
      await user.type(nameField, 'Updated Portfolio')

      const submitButton = screen.getByText('Update')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Updated Portfolio',
          baseCurrency: 'USD',
          accountId: 'original-account-id',
        })
      })
    })
  })

  describe('Form Field Interactions', () => {
    it('should update form state when typing in name field', async () => {
      const user = userEvent.setup()
      render(<PortfolioForm {...defaultProps} />)

      const nameField = screen.getByLabelText('Portfolio Name')
      await user.type(nameField, 'My Portfolio')

      expect(screen.getByDisplayValue('My Portfolio')).toBeInTheDocument()
    })

    it('should update form state when selecting currency', async () => {
      const user = userEvent.setup()
      render(<PortfolioForm {...defaultProps} />)

      const currencySelect = screen.getByRole('combobox')
      await user.click(currencySelect)
      await user.click(screen.getByText('EUR - Euro'))

      expect(screen.getByDisplayValue('EUR')).toBeInTheDocument()
    })

    it('should update form state when typing in account ID field', async () => {
      const user = userEvent.setup()
      render(<PortfolioForm {...defaultProps} />)

      const accountIdField = screen.getByLabelText('Account ID')
      await user.clear(accountIdField)
      await user.type(accountIdField, 'custom-account')

      expect(screen.getByDisplayValue('custom-account')).toBeInTheDocument()
    })
  })
})
