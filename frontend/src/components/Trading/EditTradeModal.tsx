import React, { useRef } from 'react';
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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import TradeForm, { TradeFormData } from './TradeForm';

export interface EditTradeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TradeFormData) => Promise<void>;
  initialData?: Partial<TradeFormData>;
  isLoading?: boolean;
  error?: string;
}

/**
 * EditTradeModal component for editing existing trades.
 * Wraps TradeForm in a modal dialog with proper actions.
 */
export const EditTradeModal: React.FC<EditTradeModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  error,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (data: TradeFormData) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (err) {
      console.error('Error updating trade:', err);
    }
  };

  const handleUpdateClick = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: '70vh',
          maxHeight: '85vh',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Edit Trade</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

        <DialogContent
          dividers
          sx={{
            overflow: 'auto',
            maxHeight: 'calc(85vh - 100px)',
            p: 0
          }}
        >
          <Box sx={{ p: 2 }}>
          <TradeForm
            onSubmit={handleSubmit}
            initialData={initialData}
            isLoading={isLoading}
            error={error}
            mode="edit"
            showSubmitButton={false}
            formRef={formRef}
          />
        </Box>
      </DialogContent>

        <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpdateClick}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
          sx={{ 
            textTransform: 'none',
            fontWeight: 600,
            px: 3
          }}
        >
          {isLoading ? 'Updating...' : 'Update Trade'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTradeModal;
