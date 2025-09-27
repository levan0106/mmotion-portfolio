/**
 * Trading Management Tab Component
 * Displays trading management interface with trade list and creation functionality
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { TradeListContainer } from '../Trading/TradeList';

interface TradingManagementTabProps {
  portfolioId: string;
  isCompactMode: boolean;
  onCreateTrade: () => void;
}

const TradingManagementTab: React.FC<TradingManagementTabProps> = ({
  portfolioId,
  isCompactMode,
  onCreateTrade
}) => {
  return (
    <Box sx={{ 
      backgroundColor: 'background.paper',
      minHeight: '80vh',
      pt: 0,
      px: isCompactMode ? 1 : 2
    }}>
      {/* Trading Management Section */}
      <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
        fontWeight: 600, 
        color: '#1a1a1a', 
        mb: isCompactMode ? 1.5 : 3,
        fontSize: isCompactMode ? '0.9rem' : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        💼 Trading Management (Quản lý giao dịch)
      </Typography>
      <Box sx={{ mb: isCompactMode ? 2 : 4 }}>
        <TradeListContainer 
          portfolioId={portfolioId} 
          onCreate={onCreateTrade}
          isCompactMode={isCompactMode}
        />
      </Box>
    </Box>
  );
};

export default TradingManagementTab;
