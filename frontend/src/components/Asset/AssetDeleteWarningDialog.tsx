/**
 * Asset Delete Warning Dialog Component
 * Shows warning when trying to delete asset with associated trades
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

export interface AssetDeleteWarningDialogProps {
  open: boolean;
  assetName: string;
  tradeCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const AssetDeleteWarningDialog: React.FC<AssetDeleteWarningDialogProps> = ({
  open,
  assetName,
  tradeCount,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6" component="div">
            {tradeCount > 0 ? 'Delete Asset with Trades' : 'Delete Asset'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="medium">
            This action cannot be undone!
          </Typography>
        </Alert>

        {tradeCount > 0 ? (
          <>
            <Typography variant="body1" paragraph>
              The asset <strong>"{assetName}"</strong> has <strong>{tradeCount}</strong> associated trade(s).
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              Deleting this asset will also permanently delete all associated trades. This action cannot be undone and may affect your portfolio calculations.
            </Typography>

            <Box sx={{ 
              bgcolor: 'grey.50', 
              p: 2, 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="body2" color="text.secondary">
                <strong>What will be deleted:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>The asset "{assetName}"</li>
                <li>{tradeCount} trade record(s)</li>
                <li>All associated transaction history</li>
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Typography variant="body1" paragraph>
              The asset <strong>"{assetName}"</strong> has no associated trades.
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              This asset can be safely deleted without affecting any trading history. This action cannot be undone.
            </Typography>

            <Box sx={{ 
              bgcolor: 'green.50', 
              p: 2, 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'green.200'
            }}>
              <Typography variant="body2" color="text.secondary">
                <strong>What will be deleted:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>The asset "{assetName}"</li>
                <li>No trade records (safe to delete)</li>
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onCancel}
          disabled={isDeleting}
          variant="outlined"
          size="large"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isDeleting}
          variant="contained"
          color="error"
          size="large"
          startIcon={isDeleting ? <CircularProgress size={20} /> : <WarningIcon />}
        >
          {isDeleting ? 'Deleting...' : tradeCount > 0 ? 'Delete Asset & Trades' : 'Delete Asset'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
