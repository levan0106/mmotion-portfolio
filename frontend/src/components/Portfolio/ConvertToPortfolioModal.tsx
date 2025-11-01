/**
 * Convert to Portfolio Modal Component
 * Modal for converting a fund back to a regular portfolio
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Transform as ConvertIcon,
} from '@mui/icons-material';
import { ResponsiveButton, ActionButton } from '../Common';
import { Portfolio } from '../../types';

interface ConvertToPortfolioModalProps {
  open: boolean;
  onClose: () => void;
  portfolio: Portfolio;
  onConvert: () => Promise<void>;
}

const ConvertToPortfolioModal: React.FC<ConvertToPortfolioModalProps> = ({
  open,
  onClose,
  portfolio,
  onConvert
}) => {
  const [isConverting, setIsConverting] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  const handleConvert = async () => {
    if (!confirmationChecked) return;
    
    setIsConverting(true);
    try {
      await onConvert();
    } catch (error) {
      console.error('Failed to convert fund to portfolio:', error);
      // Error handling is done in the parent component
    } finally {
      setIsConverting(false);
    }
  };

  const handleClose = () => {
    setConfirmationChecked(false);
    onClose();
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
          <ConvertIcon color="warning" />
          <Typography variant="h6">Convert Fund to Portfolio</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            This action will permanently remove all fund-related data!
          </Typography>
        </Alert>
        <Typography variant="body1" paragraph>
          Are you sure you want to convert the fund <strong>"{portfolio.name}"</strong> back to a regular portfolio?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          This will permanently delete:
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0, mb: 3 }}>
          <Typography component="li" variant="body2" color="text.secondary">
            All investor holdings and their transaction history
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            All fund unit transactions (subscriptions and redemptions)
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            All cash flows related to fund unit transactions
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            NAV per unit and total outstanding units will be reset to 0
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            Number of investors will be reset to 0
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          The portfolio will retain:
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0, mb: 3 }}>
          <Typography component="li" variant="body2" color="text.secondary">
            All trades and their history
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            All deposits and cash flows not related to fund units
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            All performance snapshots and analytics data
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            Cash balance will be recalculated from remaining cash flows
          </Typography>
        </Box>
        
        {/* Confirmation Checkbox */}
        <Box sx={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: 1, 
          p: 2, 
          backgroundColor: '#fafafa',
          mb: 2 
        }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmationChecked}
                onChange={(e) => setConfirmationChecked(e.target.checked)}
                color="warning"
              />
            }
            label={
              <Typography variant="body2" color="warning.main" fontWeight="bold">
                Tôi hiểu rằng hành động này sẽ xóa vĩnh viễn tất cả dữ liệu liên quan đến fund và không thể hoàn tác
              </Typography>
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <ResponsiveButton
          onClick={handleClose}
          disabled={isConverting}
          color="inherit"
        >
          Cancel
        </ResponsiveButton>
        <ActionButton
          onClick={handleConvert}
          disabled={isConverting || !confirmationChecked}
          color="warning"
          variant="contained"
          icon={isConverting ? <CircularProgress size={16} /> : <ConvertIcon />}
          mobileText="Convert"
          desktopText="Convert to Portfolio"
          forceTextOnly={true}
        >
          {isConverting ? 'Converting...' : 'Convert to Portfolio'}
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConvertToPortfolioModal;
