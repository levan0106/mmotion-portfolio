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
import { Asset, PriceMode } from '../../types/asset.types';


export interface AssetFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (assetData: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  editingAsset?: Asset | null;
  globalAsset?: any; // Global asset data for permission checking
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
  globalAsset,
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
        <Box           >
          <AssetForm
            userId={accountId}
            currentUserId={accountId}
            globalAsset={globalAsset}
            asset={editingAsset || undefined}
            initialData={editingAsset ? (() => {
              const initialData = {
                name: editingAsset.name || '',
                symbol: editingAsset.symbol || '',
                type: editingAsset.type as any,
                description: editingAsset.description || '',
                priceMode: editingAsset.priceMode || PriceMode.AUTOMATIC,
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
