/**
 * Asset Delete Warning Dialog Component
 * Shows warning when trying to delete asset with associated trades
 */

import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { 
  Warning as WarningIcon,
  AccountBalance as PortfolioIcon,
  Delete as DeleteIcon,
  CheckCircle as SafeIcon,
} from '@mui/icons-material';

export interface AssetDeleteWarningDialogProps {
  open: boolean;
  assetName: string;
  tradeCount: number;
  portfolios?: Array<{ id: string; name: string }>;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const AssetDeleteWarningDialog: React.FC<AssetDeleteWarningDialogProps> = ({
  open,
  assetName,
  tradeCount,
  portfolios = [],
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Reset confirmation when dialog opens/closes
  useEffect(() => {
    if (open) {
      setIsConfirmed(false);
    }
  }, [open]);
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
        {/* <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            This action cannot be undone!
          </Typography>
        </Alert> */}

        {/* Affected Portfolios */}
        {portfolios.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* <PortfolioIcon color="primary" /> */}
              Affected Portfolios
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {portfolios.map((portfolio) => (
                <Chip
                  key={portfolio.id}
                  label={portfolio.name}
                  color="primary"
                  variant="outlined"
                  icon={<PortfolioIcon />}
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Impact Analysis */}
        {tradeCount > 0 || portfolios.length > 0 ? (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              Impact Analysis
            </Typography>
            
            <Typography variant="body1" paragraph>
              The asset <strong>"{assetName}"</strong> is actively used in your portfolio{portfolios.length > 1 ? 's' : ''} with <strong>{tradeCount}</strong> trading record{tradeCount !== 1 ? 's' : ''}.
            </Typography>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="medium">
                Deleting this asset will affect portfolio calculations and historical data.
              </Typography>
            </Alert>

            <Card sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DeleteIcon color="error" />
                  What will be deleted:
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
                  <Typography component="li" variant="body2" color="text.secondary">
                    The asset "{assetName}"
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    {tradeCount} trading record{tradeCount !== 1 ? 's' : ''}
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    All associated transaction history
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    Portfolio performance calculations will be affected
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SafeIcon color="success" />
              Safe to Delete
            </Typography>
            
            <Typography variant="body1" paragraph>
              The asset <strong>"{assetName}"</strong> has no associated trades or portfolio usage.
            </Typography>

            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="medium">
                This asset can be safely deleted without affecting any portfolio data.
              </Typography>
            </Alert>

            <Card sx={{ bgcolor: 'green.50', border: '1px solid', borderColor: 'green.200' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SafeIcon color="success" />
                  What will be deleted:
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
                  <Typography component="li" variant="body2" color="text.secondary">
                    The asset "{assetName}"
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    No trade records (safe to delete)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Confirmation Checkbox */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                color="error"
                disabled={isDeleting}
              />
            }
            label={
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                I understand that this action cannot be undone and will permanently delete the asset "{assetName}" 
                {tradeCount > 0 && ` along with ${tradeCount} trading record${tradeCount !== 1 ? 's' : ''}`}
                {portfolios.length > 0 && ` from ${portfolios.length} portfolio${portfolios.length !== 1 ? 's' : ''}`}.
              </Typography>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </Box>
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
          disabled={isDeleting || !isConfirmed}
          variant="contained"
          color="error"
          size="large"
          startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
        >
          {isDeleting ? 'Deleting...' : (tradeCount > 0 || portfolios.length > 0 ? 'Delete Asset & Impacted Data' : 'Delete Asset')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
