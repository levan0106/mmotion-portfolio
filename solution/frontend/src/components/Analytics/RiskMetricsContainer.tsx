import React from 'react';
import { Box, Alert } from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import RiskMetricsDashboard from './RiskMetricsDashboard';
import { isValidUUID } from '../../utils/validation';

interface RiskMetricsContainerProps {
  portfolioId: string;
  title?: string;
  compact?: boolean;
}

/**
 * Container component for Risk Metrics Dashboard with real data integration
 */
const RiskMetricsContainer: React.FC<RiskMetricsContainerProps> = ({
  portfolioId,
  title = 'Risk Metrics Dashboard',
  compact = false,
}) => {
  // const { t } = useTranslation();

  // Validate portfolio ID
  if (!isValidUUID(portfolioId)) {
    return (
      <Alert severity="error">
        Invalid portfolio ID format
      </Alert>
    );
  }

  return (
    <Box>
      <ResponsiveTypography 
        variant="pageTitle" 
        component="h1" 
        gutterBottom
      >
        {title}
      </ResponsiveTypography>
      
      <RiskMetricsDashboard 
        portfolioId={portfolioId}
        title={title}
        compact={compact}
      />
    </Box>
  );
};

export default RiskMetricsContainer;
