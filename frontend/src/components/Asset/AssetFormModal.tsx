/**
 * Asset Form Modal Component
 * Modal wrapper for asset creation and editing using ModalWrapper for consistency
 */

import React from 'react';
import { Alert, Box } from '@mui/material';
import { ModalWrapper } from '../Common/ModalWrapper';
import { AssetForm } from './AssetForm';
import { Asset } from '../../types/asset.types';

// Utility functions for data formatting
const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number | undefined, decimals: number = 4): string => {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Removed unused formatAssetType function

// Helper component for formatted data display
// @ts-ignore
const FormattedDataDisplay: React.FC<{
  label: string;
  value: string | number | undefined;
  type: 'currency' | 'number' | 'text';
  helperText?: string;
}> = ({ label, value, type, helperText }) => {
  const formatValue = () => {
    if (value === undefined || value === null || value === '') {
      return 'Chưa có dữ liệu';
    }
    
    switch (type) {
      case 'currency':
        return formatCurrency(Number(value));
      case 'number':
        return formatNumber(Number(value));
      default:
        return String(value);
    }
  };

  return (
    <Box sx={{
      p: 2,
      border: '1px solid #e0e0e0',
      borderRadius: 1,
      backgroundColor: '#f8f9fa',
      '& .label': {
        fontSize: '0.75rem',
        fontWeight: 500,
        color: '#666',
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      },
      '& .value': {
        fontSize: '1rem',
        fontWeight: 600,
        color: type === 'currency' ? '#1976d2' : '#333',
        fontFamily: type === 'currency' || type === 'number' ? 'monospace' : 'inherit',
        textAlign: type === 'currency' || type === 'number' ? 'right' : 'left',
      },
      '& .helper': {
        fontSize: '0.75rem',
        color: '#666',
        marginTop: '4px',
        fontStyle: 'italic',
      }
    }}>
      <div className="label">{label}</div>
      <div className="value">{formatValue()}</div>
      {helperText && <div className="helper">{helperText}</div>}
    </Box>
  );
};

export interface AssetFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (assetData: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  editingAsset?: Asset | null;
  accountId?: string;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  editingAsset,
  accountId,
}) => {
  const isEditing = !!editingAsset;
  const title = isEditing ? 'Edit Asset' : 'Create New Asset';
  const icon = isEditing ? '✏️' : '➕';

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={title}
      icon={icon}
      maxWidth="md"
      fullWidth={true}
      loading={loading}
      disableCloseOnBackdrop={loading}
      disableCloseOnEscape={loading}
      actions={null}
      size="large"
    >
      <Box sx={{ 
        pt: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, flexShrink: 0 }}>
            {error}
          </Alert>
        )}

        {/* Asset Summary Display (for edit mode) */}
        {/* {isEditing && editingAsset && (
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            backgroundColor: '#f8f9fa', 
            borderRadius: 1,
            border: '1px solid #e0e0e0',
            flexShrink: 0
          }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
              mb: 2
            }}>
              <FormattedDataDisplay
                label="Giá trị ban đầu"
                value={editingAsset.initialValue}
                type="currency"
                helperText="Từ giao dịch đầu tiên"
              />
              <FormattedDataDisplay
                label="Số lượng ban đầu"
                value={editingAsset.initialQuantity}
                type="number"
                helperText="Từ giao dịch đầu tiên"
              />
              <FormattedDataDisplay
                label="Giá trị hiện tại"
                value={editingAsset.currentValue}
                type="currency"
                helperText="Tính từ giá thị trường"
              />
              <FormattedDataDisplay
                label="Số lượng hiện tại"
                value={editingAsset.currentQuantity}
                type="number"
                helperText="Tổng từ tất cả giao dịch"
              />
            </Box>
            
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              backgroundColor: '#fff',
              borderRadius: 1,
              border: '1px solid #e0e0e0'
            }}>
              <Box sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                minWidth: '80px'
              }}>
                Loại tài sản:
              </Box>
              <Box sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#1976d2',
                backgroundColor: '#e3f2fd',
                px: 1.5,
                py: 0.5,
                borderRadius: 1
              }}>
                {formatAssetType(editingAsset.type)}
              </Box>
            </Box>
          </Box>
        )} */}

        {/* Asset Form - Optimized layout for modal */}
        <Box sx={{ 
          // Remove nested modal styling
          '& .asset-form': {
            boxShadow: 'none',
            borderRadius: 0,
            background: 'transparent',
            height: 'auto',
            display: 'flex',
            flexDirection: 'column',
          },
          '& .asset-form__header': {
            display: 'none', // Hide the form header since ModalWrapper provides it
          },
          '& .asset-form__content': {
            padding: 0,
            minHeight: 'auto',
            flex: 1,
            overflow: 'visible',
          },
          '& .asset-form__actions': {
            padding: '16px 0 0 0',
            borderTop: 'none',
            background: 'transparent',
            marginTop: 'auto',
          },
          // Enhanced field styling for better UX
          '& .MuiTextField-root': {
            '& .MuiInputBase-root': {
              height: '48px',
              fontSize: '0.875rem',
            },
            '& .MuiInputBase-input': {
              padding: '12px 14px',
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.875rem',
              fontWeight: 500,
            },
            '& .MuiFormHelperText-root': {
              fontSize: '0.75rem',
              marginTop: '4px',
            },
            // Format for currency fields
            '&[data-field-type="currency"] .MuiInputBase-input': {
              fontFamily: 'monospace',
              fontWeight: 500,
              color: '#1976d2',
            },
            // Format for number fields
            '&[data-field-type="number"] .MuiInputBase-input': {
              fontFamily: 'monospace',
              textAlign: 'right',
            },
            // Format for disabled fields (computed values)
            '& .MuiInputBase-root.Mui-disabled': {
              backgroundColor: '#f8f9fa',
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontWeight: 500,
                color: '#666',
                textAlign: 'right',
              }
            }
          },
          '& .MuiFormControl-root': {
            '& .MuiInputBase-root': {
              height: '48px',
              fontSize: '0.875rem',
            },
            '& .MuiInputBase-input': {
              padding: '12px 14px',
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.875rem',
              fontWeight: 500,
            }
          },
          // Better grid layout
          '& .MuiGrid-container': {
            margin: 0,
            width: '100%',
          },
          '& .MuiGrid-item': {
            padding: '4px',
          }
        }}>
          
          {/* Responsive grid layout wrapper */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr', // Mobile: single column
              sm: 'repeat(1, 1fr)', // Tablet+: two columns
            },
            gap: '16px',
            width: '100%',
            '& > *': {
              '&[data-full-width="true"]': {
                gridColumn: '1 / -1',
              }
            }
          }}>
          <AssetForm
          userId={accountId}
          initialData={editingAsset ? (() => {
            const initialData = {
              name: editingAsset.name || '',
              symbol: editingAsset.symbol || '',
              type: editingAsset.type as any,
              description: editingAsset.description || '',
              // Computed fields are shown as read-only for display purposes
              initialValue: editingAsset.initialValue || undefined,
              initialQuantity: editingAsset.initialQuantity || undefined,
              currentValue: editingAsset.currentValue || undefined,
              currentQuantity: editingAsset.currentQuantity || undefined,
              createdBy: editingAsset.createdBy || accountId,
              updatedBy: editingAsset.updatedBy || accountId,
            };
            return initialData;
          })() : undefined}
          submitText={isEditing ? 'Update Asset' : 'Create Asset'}
          mode={isEditing ? 'edit' : 'create'}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
        />
          </Box>
        </Box>
      </Box>
    </ModalWrapper>
  );
};

export default AssetFormModal;
