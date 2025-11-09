/**
 * Asset Deletion Dialog Component
 * Confirmation dialog for asset deletion with trade count warning
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ResponsiveButton, ActionButton } from '../Common';
import { Asset } from '../../types/asset.types';

export interface AssetDeletionDialogProps {
  /** Asset to be deleted */
  asset: Asset | null;
  /** Whether dialog is open */
  open: boolean;
  /** Callback when dialog is closed */
  onClose: () => void;
  /** Callback when deletion is confirmed */
  onConfirm: () => void;
  /** Number of trades associated with the asset */
  tradeCount: number;
  /** Whether deletion is in progress */
  loading?: boolean;
  /** Custom className */
  className?: string;
}

export const AssetDeletionDialog: React.FC<AssetDeletionDialogProps> = ({
  asset,
  open,
  onClose,
  onConfirm,
  tradeCount,
  loading = false,
  className = '',
}) => {
  if (!asset) {
    return null;
  }

  const hasTrades = tradeCount > 0;
  const assetDisplayName = `${asset.name} (${asset.symbol})`;

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className={`asset-deletion-dialog ${className}`}
    >
      <DialogTitle>
        Delete Asset
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete "{assetDisplayName}"?
          </Typography>
        </Box>

        {hasTrades && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This asset has {tradeCount} associated trade(s). 
              Deleting it will also remove all related trade records. This action cannot be undone.
            </Typography>
          </Alert>
        )}

        {!hasTrades && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              This asset has no associated trades and can be safely deleted.
            </Typography>
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary">
          This action cannot be undone.
        </Typography>
      </DialogContent>

      <DialogActions>
        <ResponsiveButton
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          mobileText="Cancel"
          desktopText="Cancel"
          forceTextOnly={true}
        >
          Cancel
        </ResponsiveButton>
        
        <ActionButton
          onClick={handleConfirm}
          disabled={loading}
          color="error"
          variant="contained"
          icon={loading ? <CircularProgress size={16} /> : undefined}
          mobileText={loading ? 'Deleting...' : 'Delete'}
          desktopText={loading ? 'Deleting...' : 'Delete Asset'}
          forceTextOnly={true}
        >
          {loading ? 'Deleting...' : 'Delete Asset'}
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
};

export default AssetDeletionDialog;
