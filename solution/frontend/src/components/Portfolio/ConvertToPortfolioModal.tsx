/**
 * Convert to Portfolio Modal Component
 * Modal for converting a fund back to a regular portfolio
 */

import React, { useState } from 'react';
import {
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Transform as ConvertIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ResponsiveButton, ActionButton } from '../Common';
import { ModalWrapper } from '../Common/ModalWrapper';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
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
  const { t } = useTranslation();
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

  const modalActions = (
    <>
      <ResponsiveButton
        onClick={handleClose}
        disabled={isConverting}
        color="inherit"
        size="medium"
      >
        {t('common.cancel')}
      </ResponsiveButton>
      <ActionButton
        onClick={handleConvert}
        disabled={isConverting || !confirmationChecked}
        color="warning"
        variant="contained"
        icon={isConverting ? <CircularProgress size={20} /> : <ConvertIcon />}
        mobileText={t('nav.holdings.convertToPortfolioModal.convert')}
        desktopText={t('nav.holdings.convertToPortfolioModal.convertToPortfolio')}
        forceTextOnly={true}
        size="medium"
      >
        {isConverting ? t('nav.holdings.convertToPortfolioModal.converting') : t('nav.holdings.convertToPortfolioModal.convertToPortfolio')}
      </ActionButton>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title={t('nav.holdings.convertToPortfolioModal.title')}
      icon={<ConvertIcon color="warning" />}
      actions={modalActions}
      loading={isConverting}
      maxWidth="md"
      titleColor="warning"
      size="medium"
    >
      <Box sx={{ pt: 1 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <ResponsiveTypography variant="body2" fontWeight="bold" ellipsis={false}>
            {t('nav.holdings.convertToPortfolioModal.warningTitle')}
          </ResponsiveTypography>
        </Alert>
        
        <ResponsiveTypography variant="labelMedium" paragraph ellipsis={false}>
          {t('nav.holdings.convertToPortfolioModal.confirmationQuestion', { name: portfolio.name })}
        </ResponsiveTypography>
        
        <ResponsiveTypography variant="cardTitle" paragraph>
          {t('nav.holdings.convertToPortfolioModal.willDelete')}
        </ResponsiveTypography>
        
        <Box component="ul" sx={{ pl: 2, m: 0, mb: 3 }}>
          <Box component="li">
            <ResponsiveTypography variant="body2" color="text.secondary" ellipsis={false}>
              {t('nav.holdings.convertToPortfolioModal.deleteItem1')}
            </ResponsiveTypography>
          </Box>
          <Box component="li">
            <ResponsiveTypography variant="body2" color="text.secondary" ellipsis={false}>
              {t('nav.holdings.convertToPortfolioModal.deleteItem2')}
            </ResponsiveTypography>
          </Box>
          <Box component="li">
            <ResponsiveTypography variant="body2" color="text.secondary" ellipsis={false}>
              {t('nav.holdings.convertToPortfolioModal.deleteItem3')}
            </ResponsiveTypography>
          </Box>
          <Box component="li">
            <ResponsiveTypography variant="body2" color="text.secondary" ellipsis={false}>
              {t('nav.holdings.convertToPortfolioModal.deleteItem4')}
            </ResponsiveTypography>
          </Box>
          <Box component="li">
            <ResponsiveTypography variant="body2" color="text.secondary" ellipsis={false}>
              {t('nav.holdings.convertToPortfolioModal.deleteItem5')}
            </ResponsiveTypography>
          </Box>
        </Box>
        
        <ResponsiveTypography variant="cardTitle" paragraph>
          {t('nav.holdings.convertToPortfolioModal.willRetain')}
        </ResponsiveTypography>
        
        <Box component="ul" sx={{ pl: 2, m: 0, mb: 3 }}>
          <Box component="li">
            <ResponsiveTypography variant="body2" color="text.secondary" ellipsis={false}>
              {t('nav.holdings.convertToPortfolioModal.retainItem1')}
            </ResponsiveTypography>
          </Box>
          <Box component="li">
            <ResponsiveTypography variant="body2" color="text.secondary" ellipsis={false}>
              {t('nav.holdings.convertToPortfolioModal.retainItem2')}
            </ResponsiveTypography>
          </Box>
          <Box component="li">
            <ResponsiveTypography variant="body2" color="text.secondary" ellipsis={false}>
              {t('nav.holdings.convertToPortfolioModal.retainItem3')}
            </ResponsiveTypography>
          </Box>
          <Box component="li">
            <ResponsiveTypography variant="body2" color="text.secondary" ellipsis={false}>
              {t('nav.holdings.convertToPortfolioModal.retainItem4')}
            </ResponsiveTypography>
          </Box>
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
                disabled={isConverting}
              />
            }
            label={
              <ResponsiveTypography variant="body2" color="warning.main" fontWeight="bold" ellipsis={false}>
                {t('nav.holdings.convertToPortfolioModal.confirmationLabel')}
              </ResponsiveTypography>
            }
          />
        </Box>
      </Box>
    </ModalWrapper>
  );
};

export default ConvertToPortfolioModal;
