/**
 * NAV Holdings Tab Component
 * Displays NAV holdings management interface
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import NAVHoldingsManagement from '../NAVUnit/NAVHoldingsManagement';

interface NAVHoldingsTabProps {
  portfolio: any;
  isCompactMode: boolean;
  getUltraSpacing: (normal: number, ultra: number) => number;
  onPortfolioUpdate: () => void;
}

const NAVHoldingsTab: React.FC<NAVHoldingsTabProps> = ({
  portfolio,
  isCompactMode,
  getUltraSpacing,
  onPortfolioUpdate
}) => {
  return (
    <Box sx={{ 
      backgroundColor: 'background.paper',
      minHeight: '80vh',
      pt: 0,
      px: getUltraSpacing(2, 1)
    }}>
      {/* NAV Holdings Management Section */}
      <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
        fontWeight: 600, 
        color: '#1a1a1a', 
        mb: getUltraSpacing(3, 1.5),
        fontSize: isCompactMode ? '0.9rem' : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        🏦 NAV Holdings Management (Quản lý đơn vị quỹ)
      </Typography>
      <Box sx={{ mb: getUltraSpacing(4, 2) }}>
        <NAVHoldingsManagement 
          portfolio={portfolio}
          isCompactMode={isCompactMode}
          getUltraSpacing={getUltraSpacing}
          onPortfolioUpdate={onPortfolioUpdate}
        />
      </Box>
    </Box>
  );
};

export default NAVHoldingsTab;
