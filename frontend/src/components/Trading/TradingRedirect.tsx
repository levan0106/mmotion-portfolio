/**
 * TradingRedirect component - Redirects to portfolio detail when accessing /trading
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useAccount } from '../../contexts/AccountContext';
import { usePortfolios } from '../../hooks/usePortfolios';
import { ResponsiveButton } from '../Common';

const TradingRedirect: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accountId } = useAccount();
  const { portfolios, isLoading, error } = usePortfolios(accountId);
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    if (!isLoading && portfolios && !redirectAttempted) {
      setRedirectAttempted(true);
      
      if (portfolios.length === 0) {
        // No portfolios exist, redirect to create portfolio
        navigate('/portfolios/new');
        return;
      }
      
      if (portfolios.length === 1) {
        // Get tab parameter from querystring, default to 'trading'
        const tabParam = searchParams.get('tab') || 'trading';
        navigate(`/portfolios/${portfolios[0].portfolioId}?tab=${tabParam}`);
        return;
      }
      
      // Multiple portfolios, redirect to portfolios page to let user choose
      navigate('/portfolios');
    }
  }, [portfolios, isLoading, navigate, redirectAttempted, searchParams]);

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '50vh',
        gap: 2
      }}>
        <CircularProgress size={48} />
        <Typography variant="h6" color="text.secondary">
          Loading portfolios...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load portfolios. Please try again.
        </Alert>
        <ResponsiveButton
          variant="contained"
          onClick={() => navigate('/portfolios')}
        >
          Go to Portfolios
        </ResponsiveButton>
      </Box>
    );
  }

  if (portfolios.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          No portfolios found. Create your first portfolio to start trading.
        </Alert>
        <ResponsiveButton
          variant="contained"
          onClick={() => navigate('/portfolios/new')}
        >
          Create Portfolio
        </ResponsiveButton>
      </Box>
    );
  }

  if (portfolios.length > 1) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Multiple portfolios found. Please select a portfolio to view trading.
        </Alert>
        <ResponsiveButton
          variant="contained"
          onClick={() => navigate('/portfolios')}
        >
          Select Portfolio
        </ResponsiveButton>
      </Box>
    );
  }

  // This should not be reached due to useEffect, but just in case
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '50vh',
      gap: 2
    }}>
      <CircularProgress size={48} />
      <Typography variant="h6" color="text.secondary">
        Redirecting to trading...
      </Typography>
    </Box>
  );
};

export default TradingRedirect;
