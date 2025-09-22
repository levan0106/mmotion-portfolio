import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import TradeDetails from './TradeDetails';

export interface TradeDetailsModalProps {
  open: boolean;
  onClose: () => void;
  onEdit?: (trade: any) => void;
  trade: any | null;
  tradeDetails?: any[];
  isLoading?: boolean;
  error?: string;
}

/**
 * TradeDetailsModal component for viewing trade details in a modal.
 * Wraps TradeDetails component in a modal dialog.
 */
export const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({
  open,
  onClose,
  onEdit,
  trade,
  tradeDetails = [],
  isLoading = false,
  error,
}) => {
  if (!trade) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          maxHeight: '90vh',
          borderRadius: 2,
          boxShadow: 24,
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'grey.50', 
        borderBottom: 1, 
        borderColor: 'divider',
        py: 1.5
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" fontWeight="bold">
              Trade Details
            </Typography>
            {trade && (
              <Typography variant="body2" color="text.secondary">
                {trade.assetSymbol} - {trade.assetName}
              </Typography>
            )}
          </Box>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{
              '&:hover': {
                bgcolor: 'error.main',
                color: 'white',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2, mb: 0 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <Box textAlign="center">
              <CircularProgress size={40} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Loading trade details...
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: 2, overflow: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
            <TradeDetails
              trade={trade}
              tradeDetails={tradeDetails}
              onEdit={onEdit}
              isLoading={isLoading}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        bgcolor: 'grey.50', 
        borderTop: 1, 
        borderColor: 'divider',
        py: 1.5,
        px: 2
      }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{ textTransform: 'none', px: 3 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TradeDetailsModal;
