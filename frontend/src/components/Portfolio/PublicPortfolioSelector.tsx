import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Box,
  Chip,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { Portfolio } from '../../types';
import { ResponsiveButton } from '../Common';
import { ModalWrapper } from '../Common/ModalWrapper';

interface PublicPortfolioSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (portfolio: Portfolio) => void;
}

export const PublicPortfolioSelector: React.FC<PublicPortfolioSelectorProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const { t } = useTranslation();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchPublicPortfolios();
    }
  }, [open]);

  const fetchPublicPortfolios = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const publicPortfolios = await apiService.getPublicPortfolios();
      setPortfolios(publicPortfolios);
    } catch (err: any) {
      setError(err.message || t('publicPortfolioSelector.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const filteredPortfolios = portfolios.filter(portfolio =>
    portfolio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    portfolio.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    portfolio.templateName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (portfolio: Portfolio) => {
    onSelect(portfolio);
    onClose();
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={t('publicPortfolioSelector.title')}
      icon={<CopyIcon />}
      maxWidth="md"
      fullWidth
      actions={
        <ResponsiveButton onClick={onClose}>
          {t('common.cancel')}
        </ResponsiveButton>
      }
      loading={loading}
    >
      <TextField
        fullWidth
        placeholder={t('publicPortfolioSelector.searchPlaceholder')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton onClick={() => setSearchTerm('')}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2, mt: 2 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <List>
          {filteredPortfolios.map((portfolio) => (
            <ListItem
              key={portfolio.portfolioId}
              button
              onClick={() => handleSelect(portfolio)}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemText
                primary={portfolio.templateName || portfolio.name}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="span">
                      {portfolio.description || t('publicPortfolioSelector.noDescription')}
                    </Typography>
                    {portfolio.creatorName && (
                      <Typography variant="caption" color="primary" component="span" sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}>
                        {t('publicPortfolioSelector.createdBy', { name: portfolio.creatorName })}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={portfolio.baseCurrency} size="small" />
                      <Chip 
                        label={t('publicPortfolioSelector.tradesCount', { count: portfolio.trades?.length || 0 })} 
                        size="small" 
                      />
                      <Chip 
                        label={t('publicPortfolioSelector.cashFlowsCount', { count: portfolio.cashFlows?.length || 0 })} 
                        size="small" 
                      />
                      <Chip 
                        label={t('publicPortfolioSelector.depositsCount', { count: portfolio.deposits?.length || 0 })} 
                        size="small" 
                      />
                    </Box>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => handleSelect(portfolio)}>
                  <CopyIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {!loading && !error && filteredPortfolios.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="text.secondary">
            {searchTerm ? t('publicPortfolioSelector.noSearchResults') : t('publicPortfolioSelector.noPortfolios')}
          </Typography>
        </Box>
      )}
    </ModalWrapper>
  );
};
