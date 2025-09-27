/**
 * Cash Flow Tab Component
 * Displays cash flow management interface
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import CashFlowLayout from '../CashFlow/CashFlowLayout';

interface CashFlowTabProps {
  portfolioId: string;
  isCompactMode: boolean;
  getUltraSpacing: (normal: number, ultra: number) => number;
  onCashFlowUpdate: () => void;
}

const CashFlowTab: React.FC<CashFlowTabProps> = ({
  portfolioId,
  isCompactMode,
  getUltraSpacing,
  onCashFlowUpdate
}) => {
  return (
    <Box sx={{ 
      backgroundColor: 'background.paper',
      minHeight: '80vh',
      pt: 0,
      px: getUltraSpacing(2, 1)
    }}>
      {/* Cash Flow Management Section */}
      <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
        fontWeight: 600, 
        color: '#1a1a1a', 
        mb: getUltraSpacing(3, 1.5),
        fontSize: isCompactMode ? '0.9rem' : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        💸 Cash Flow Management (Quản lý dòng tiền)
      </Typography>
      <Box sx={{ mb: getUltraSpacing(4, 2) }}>
        <CashFlowLayout 
          portfolioId={portfolioId} 
          onCashFlowUpdate={onCashFlowUpdate}
        />
      </Box>
    </Box>
  );
};

export default CashFlowTab;
