/**
 * Asset Form Modal Component
 * Modal wrapper for asset creation and editing using Material-UI Dialog
 */

import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent,
  Alert, 
  Box,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { AssetForm } from './AssetForm';
import { Asset } from '../../types/asset.types';


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
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isEditing = !!editingAsset;
  const title = isEditing ? t('asset.modal.editTitle') : t('asset.modal.createTitle');

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          minHeight: isMobile ? '100vh' : 'auto',
          maxHeight: isMobile ? '100vh' : '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          disabled={loading}
          sx={{ 
            color: 'text.secondary',
            '&:hover': { backgroundColor: 'action.hover' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        p: 3,
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '3px',
        },
      }}>
        {/* Error Message */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            {error}
          </Alert>
        )}

        {/* Asset Form */}
        <Box sx={{
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
          '& .MuiGrid-container': {
            margin: 0,
            width: '100%',
          },
          '& .MuiGrid-item': {
            padding: '4px',
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
            submitText={isEditing ? t('asset.modal.updateAsset') : t('asset.modal.createAsset')}
            mode={isEditing ? 'edit' : 'create'}
            onSubmit={onSubmit}
            onCancel={onCancel}
            loading={loading}
            standalone={false} // Use form content only, no Card wrapper
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AssetFormModal;
