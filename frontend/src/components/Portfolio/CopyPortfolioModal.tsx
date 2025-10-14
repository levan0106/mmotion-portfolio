import React, { useState } from 'react';
import {
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { apiService } from '../../services/api';
import { Portfolio } from '../../types';
import { ResponsiveButton, ModalWrapper } from '../Common';

interface CopyPortfolioModalProps {
  open: boolean;
  onClose: () => void;
  sourcePortfolio: Portfolio | null;
  onPortfolioCopied: (newPortfolio: Portfolio) => void;
  onModalClose?: () => void; // Add method to close modal from parent
}

export const CopyPortfolioModal: React.FC<CopyPortfolioModalProps> = ({
  open,
  onClose,
  sourcePortfolio,
  onPortfolioCopied,
  onModalClose,
}) => {
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setNewPortfolioName('');
    setError(null);
    onClose();
  };

  const handleCopy = async () => {
    if (!sourcePortfolio || !newPortfolioName.trim()) {
      setError('Please enter a portfolio name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newPortfolio = await apiService.copyPortfolio({
        sourcePortfolioId: sourcePortfolio.portfolioId,
        name: newPortfolioName.trim(),
      });

      // Trigger navigation first
      onPortfolioCopied(newPortfolio);
      
      // Close modal after a delay to ensure navigation starts
      setTimeout(() => {
        if (onModalClose) {
          onModalClose();
        }
        handleClose();
      }, 500);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to copy portfolio'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !loading) {
      handleCopy();
    }
  };


  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title="Copy Portfolio"
      icon={<ContentCopy color="primary" />}
      loading={loading}
      maxWidth="sm"
      fullWidth={true}
      actions={
        <>
          <ResponsiveButton 
            onClick={handleClose}
            disabled={loading}
            mobileText="Cancel"
            desktopText="Cancel"
            sx={{ mr: 1 }}
          >
            Cancel
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleCopy}
            variant="contained"
            disabled={loading || !newPortfolioName.trim()}
            icon={loading ? <CircularProgress size={16} /> : <ContentCopy />}
            mobileText={loading ? 'Copying...' : 'Copy'}
            desktopText={loading ? 'Copying...' : 'Copy Portfolio'}
            sx={{
              borderRadius: 1,
              px: 3,
            }}
          >
            {loading ? 'Copying...' : 'Copy Portfolio'}
          </ResponsiveButton>
        </>
      }
    >
      {sourcePortfolio && (
        <Box sx={{ m: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Copying from:
          </Typography>
          <Typography variant="h6" color="primary">
            {sourcePortfolio.name}
          </Typography>
        </Box>
      )}

      <TextField
        autoFocus
        fullWidth
        label="New Portfolio Name"
        placeholder="Enter name for the copied portfolio"
        value={newPortfolioName}
        onChange={(e) => setNewPortfolioName(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={loading}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
          }
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>What will be copied:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • All trades and trade history
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Cash flows and transactions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Deposits and interest settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Portfolio settings and configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
          Note: The new portfolio will start with zero cash balance and current market values.
        </Typography>
      </Box>
    </ModalWrapper>
  );
};
