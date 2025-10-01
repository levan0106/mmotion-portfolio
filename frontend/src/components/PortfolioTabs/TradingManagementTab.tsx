/**
 * Trading Management Tab Component
 * Displays trading management interface with trade list and creation functionality
 */

import React from 'react';
import { Box } from '@mui/material';
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
