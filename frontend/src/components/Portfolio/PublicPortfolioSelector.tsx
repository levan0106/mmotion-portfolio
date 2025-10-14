import React, { useState, useEffect } from 'react';
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
      setError(err.message || 'Failed to load public portfolios');
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
      title="Select Portfolio Template"
      icon={<CopyIcon />}
      maxWidth="md"
      fullWidth
      actions={
        <ResponsiveButton onClick={onClose}>
          Cancel
        </ResponsiveButton>
      }
      loading={loading}
    >
      <TextField
        fullWidth
        placeholder="Search portfolio templates..."
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
                    <Typography variant="body2" color="text.secondary">
                      {portfolio.description || 'No description available'}
                    </Typography>
                    {portfolio.creatorName && (
                      <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}>
                        Created by: {portfolio.creatorName}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={portfolio.baseCurrency} size="small" />
                      <Chip 
                        label={`${portfolio.trades?.length || 0} trades`} 
                        size="small" 
                      />
                      <Chip 
                        label={`${portfolio.cashFlows?.length || 0} cash flows`} 
                        size="small" 
                      />
                      <Chip 
                        label={`${portfolio.deposits?.length || 0} deposits`} 
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
            {searchTerm ? 'No portfolios match your search' : 'No public portfolios available'}
          </Typography>
        </Box>
      )}
    </ModalWrapper>
  );
};
