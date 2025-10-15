import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setError(t('portfolio.copy.validation.nameRequired'));
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
        t('portfolio.copy.error.copyFailed')
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
      title={t('portfolio.copy.title')}
      icon={<ContentCopy color="primary" />}
      loading={loading}
      maxWidth="sm"
      fullWidth={true}
      actions={
        <>
          <ResponsiveButton 
            onClick={handleClose}
            disabled={loading}
            mobileText={t('common.cancel')}
            desktopText={t('common.cancel')}
            sx={{ mr: 1 }}
          >
            {t('common.cancel')}
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleCopy}
            variant="contained"
            disabled={loading || !newPortfolioName.trim()}
            icon={loading ? <CircularProgress size={16} /> : <ContentCopy />}
            mobileText={loading ? t('portfolio.copy.copying') : t('portfolio.copy.copy')}
            desktopText={loading ? t('portfolio.copy.copying') : t('portfolio.copy.copyPortfolio')}
            sx={{
              borderRadius: 1,
              px: 3,
            }}
          >
            {loading ? t('portfolio.copy.copying') : t('portfolio.copy.copyPortfolio')}
          </ResponsiveButton>
        </>
      }
    >
      {sourcePortfolio && (
        <Box sx={{ m: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t('portfolio.copy.copyingFrom')}:
          </Typography>
          <Typography variant="h6" color="primary">
            {sourcePortfolio.name}
          </Typography>
        </Box>
      )}

      <TextField
        autoFocus
        fullWidth
        label={t('portfolio.copy.newPortfolioName')}
        placeholder={t('portfolio.copy.newPortfolioNamePlaceholder')}
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
          <strong>{t('portfolio.copy.whatWillBeCopied')}:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • {t('portfolio.copy.copyItems.trades')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • {t('portfolio.copy.copyItems.cashFlows')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • {t('portfolio.copy.copyItems.deposits')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • {t('portfolio.copy.copyItems.settings')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
          {t('portfolio.copy.note')}
        </Typography>
      </Box>
    </ModalWrapper>
  );
};
