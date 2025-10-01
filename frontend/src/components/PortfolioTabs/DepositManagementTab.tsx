/**
 * Deposit Management Tab Component
 * Displays deposit management interface
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import DepositManagementTab from '../Deposit/DepositManagementTab';

interface DepositManagementTabProps {
  portfolioId: string;
  isCompactMode: boolean;
  getUltraSpacing: (normal: number, ultra: number) => number;
}

const DepositManagementTabComponent: React.FC<DepositManagementTabProps> = ({
  portfolioId,
  isCompactMode,
  getUltraSpacing
}) => {
  return (
    <Box sx={{ 
      backgroundColor: 'background.paper',
      minHeight: '80vh',
      pt: 0,
      px: getUltraSpacing(2, 1)
    }}>
      {/* Deposit Management Section */}
      <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
        fontWeight: 600, 
        color: '#4a5568', 
        mb: getUltraSpacing(3, 1.5),
        fontSize: isCompactMode ? '0.9rem' : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
      </Typography>
      <Box sx={{ mb: getUltraSpacing(4, 2) }}>
        <DepositManagementTab portfolioId={portfolioId} />
      </Box>
    </Box>
  );
};

export default DepositManagementTabComponent;
