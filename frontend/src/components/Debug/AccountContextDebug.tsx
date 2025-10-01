import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Chip } from '@mui/material';
import { useAccount } from '../../contexts/AccountContext';

export const AccountContextDebug: React.FC = () => {
  const { currentAccount, loading, accountId } = useAccount();
  const [isVisible, setIsVisible] = useState(false);
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, [currentAccount, loading, accountId]);

  if (!isVisible) {
    return (
      <Button
        variant="outlined"
        size="small"
        onClick={() => setIsVisible(true)}
        sx={{ position: 'fixed', bottom: 10, left: 10, zIndex: 9999 }}
      >
        Account Debug
      </Button>
    );
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 10,
        left: 10,
        p: 2,
        maxWidth: 400,
        maxHeight: '80vh',
        overflow: 'auto',
        zIndex: 9999,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Account Context Debug</Typography>
        <Button size="small" onClick={() => setIsVisible(false)}>
          ×
        </Button>
      </Box>
      
      <Typography variant="body2" color="text.secondary" mb={1}>
        Render Count: <Chip label={renderCount} size="small" color="primary" />
      </Typography>
      
      <Typography variant="body2" color="text.secondary" mb={1}>
        Loading: <Chip label={loading ? 'Yes' : 'No'} size="small" color={loading ? 'warning' : 'success'} />
      </Typography>
      
      <Typography variant="body2" color="text.secondary" mb={1}>
        Account ID: <Chip label={accountId || 'None'} size="small" color="secondary" />
      </Typography>
      
      <Typography variant="body2" color="text.secondary" mb={1}>
        Account Name: <Chip label={currentAccount?.name || 'None'} size="small" color="default" />
      </Typography>
      
      <Typography variant="body2" color="text.secondary" mb={1}>
        Base Currency: <Chip label={currentAccount?.baseCurrency || 'None'} size="small" color="default" />
      </Typography>
      
      <Typography variant="body2" color="text.secondary" mb={1}>
        Is Main Account: <Chip label={currentAccount?.isMainAccount ? 'Yes' : 'No'} size="small" color={currentAccount?.isMainAccount ? 'primary' : 'default'} />
      </Typography>
    </Paper>
  );
};
