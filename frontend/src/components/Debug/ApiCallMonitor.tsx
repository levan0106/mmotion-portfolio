import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Chip } from '@mui/material';
import { getApiCallStats, resetApiCallStats } from '../../utils/apiLogger';

export const ApiCallMonitor: React.FC = () => {
  const [stats, setStats] = useState(getApiCallStats());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getApiCallStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    resetApiCallStats();
    setStats(getApiCallStats());
  };

  if (!isVisible) {
    return (
      <Button
        variant="outlined"
        size="small"
        onClick={() => setIsVisible(true)}
        sx={{ position: 'fixed', bottom: 10, right: 10, zIndex: 9999 }}
      >
        API Monitor
      </Button>
    );
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 10,
        right: 10,
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
        <Typography variant="h6">API Call Monitor</Typography>
        <Button size="small" onClick={() => setIsVisible(false)}>
          ×
        </Button>
      </Box>
      
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Typography variant="body2" color="text.secondary">
          Total API Calls:
        </Typography>
        <Chip label={stats.totalCalls} size="small" color="primary" />
      </Box>
      
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Typography variant="body2" color="text.secondary">
          Unique Endpoints:
        </Typography>
        <Chip label={stats.callsByUrl.length} size="small" color="secondary" />
      </Box>
      
      <Box mb={2}>
        <Typography variant="subtitle2" gutterBottom>
          Calls by Endpoint:
        </Typography>
        {stats.callsByUrl.map((call, index) => (
          <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="caption" sx={{ flex: 1, mr: 1, wordBreak: 'break-all' }}>
              {call.url}
            </Typography>
            <Chip 
              label={call.count} 
              size="small" 
              color={call.count > 5 ? 'error' : call.count > 2 ? 'warning' : 'default'}
            />
          </Box>
        ))}
      </Box>
      
      <Button variant="outlined" size="small" onClick={handleReset} fullWidth>
        Reset Stats
      </Button>
    </Paper>
  );
};
