import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Delete as DeleteIcon,
} from '@mui/icons-material';
import ResponsiveTypography from '../Common/ResponsiveTypography';

interface CleanupModalProps {
  open: boolean;
  onClose: () => void;
  onCleanup: (days: number) => Promise<void>;
  loading: boolean;
  result: string | null;
}

export default function GlobalAssetCleanupModal({ 
  open, 
  onClose, 
  onCleanup, 
  loading, 
  result 
}: CleanupModalProps) {
  const [cleanupDays, setCleanupDays] = useState(30);

  const handleCleanup = async () => {
    await onCleanup(cleanupDays);
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
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <DeleteIcon color="warning" />
          <ResponsiveTypography variant="h6">
            Cleanup Old Data
          </ResponsiveTypography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This will permanently delete tracking records and API call details older than the specified number of days.
        </ResponsiveTypography>
        
        <TextField
          fullWidth
          label="Days to Keep"
          type="number"
          value={cleanupDays}
          onChange={(e) => setCleanupDays(parseInt(e.target.value) || 30)}
          inputProps={{ min: 1, max: 365 }}
          sx={{ mb: 2 }}
          helperText="Records older than this many days will be deleted"
          disabled={loading}
        />

        {result && (
          <Alert 
            severity={result.includes('Error') ? 'error' : 'success'} 
            sx={{ mt: 2 }}
          >
            {result}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCleanup}
          color="warning"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <DeleteIcon />}
        >
          {loading ? 'Cleaning...' : 'Cleanup'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
