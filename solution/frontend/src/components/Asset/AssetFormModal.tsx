/**
 * Asset Form Modal Component
 * Modal wrapper for asset creation and editing using ModalWrapper
 */

import React from 'react';
import { Alert, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AssetForm } from './AssetForm';
import { Asset, PriceMode } from '../../types/asset.types';
import { ModalWrapper } from '../Common/ModalWrapper';


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
  const isEditing = !!editingAsset;
  const title = isEditing ? t('asset.modal.editTitle') : t('asset.modal.createTitle');

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={title}
      loading={loading}
      maxWidth="md"
      size="medium"
      titleColor="primary"
    >
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
      <Box>
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
    </ModalWrapper>
  );
};

export default AssetFormModal;
