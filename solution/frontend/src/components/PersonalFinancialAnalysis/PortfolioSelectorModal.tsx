/**
 * Portfolio Selector Modal Component
 * Allows users to select a portfolio to link to the analysis
 */

import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { AccountBalance as PortfolioIcon } from '@mui/icons-material';
import { ModalWrapper } from '../Common/ModalWrapper';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import { useTranslation } from 'react-i18next';
import { usePortfolios } from '../../hooks/usePortfolios';
import { useAccount } from '../../contexts/AccountContext';
import { formatCurrency } from '../../utils/format';

interface PortfolioSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (portfolioId: string) => void;
  excludePortfolioIds?: string[]; // Portfolios already linked
  loading?: boolean;
}

export const PortfolioSelectorModal: React.FC<PortfolioSelectorModalProps> = ({
  open,
  onClose,
  onSelect,
  excludePortfolioIds = [],
  loading = false,
}) => {
  const { t } = useTranslation();
  const { accountId, baseCurrency } = useAccount();
  const { portfolios, isLoading } = usePortfolios(accountId);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);

  // Filter out already linked portfolios
  const availablePortfolios = portfolios.filter(
    (p) => !excludePortfolioIds.includes(p.portfolioId)
  );

  const handlePortfolioClick = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
  };

  const handleConfirm = () => {
    if (selectedPortfolioId) {
      onSelect(selectedPortfolioId);
      setSelectedPortfolioId(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedPortfolioId(null);
    onClose();
  };

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title={t('personalFinancialAnalysis.portfolioLinking.selectPortfolio')}
      maxWidth="sm"
      fullWidth
      actions={
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', width: '100%' }}>
          <ResponsiveButton
            variant="text"
            onClick={handleClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </ResponsiveButton>
          <ResponsiveButton
            variant="contained"
            onClick={handleConfirm}
            disabled={!selectedPortfolioId || loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
          >
            {t('common.confirm')}
          </ResponsiveButton>
        </Box>
      }
      loading={loading || isLoading}
    >
      <Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : availablePortfolios.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {excludePortfolioIds.length > 0
              ? t('personalFinancialAnalysis.portfolioLinking.allPortfoliosLinked')
              : t('personalFinancialAnalysis.portfolioLinking.noPortfoliosAvailable')}
          </Alert>
        ) : (
          <>
            <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 2 }} ellipsis={false}>
              {t('personalFinancialAnalysis.portfolioLinking.selectPortfolioDescription')}
            </ResponsiveTypography>
            <List>
              {availablePortfolios.map((portfolio, index) => (
                <React.Fragment key={portfolio.portfolioId}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={selectedPortfolioId === portfolio.portfolioId}
                      onClick={() => handlePortfolioClick(portfolio.portfolioId)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                        },
                      }}
                    >
                      <PortfolioIcon sx={{ mr: 2, fontSize: 24 }} />
                      <ListItemText
                        primary={
                          <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                            {portfolio.name}
                          </ResponsiveTypography>
                        }
                        secondary={
                          <Box>
                            <ResponsiveTypography variant="body2" sx={{ mt: 0.5 }}>
                              {formatCurrency(portfolio.totalAllValue || portfolio.totalValue || 0, portfolio.baseCurrency || baseCurrency)}
                            </ResponsiveTypography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < availablePortfolios.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </Box>
    </ModalWrapper>
  );
};

