import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import PerformanceSnapshotDashboard from './PerformanceSnapshotDashboard';

const PerformanceSnapshotDemo: React.FC = () => {
  // Demo portfolio ID - replace with actual portfolio ID
  const demoPortfolioId = 'demo-portfolio-id';

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Fund Manager Snapshot System - Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This is a demonstration of the Fund Manager Snapshot System with comprehensive performance analysis,
          risk metrics, and benchmark comparison capabilities.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Features:</strong>
        </Typography>
        <ul>
          <li>Portfolio Performance Analysis (TWR, MWR, IRR)</li>
          <li>Risk Metrics (Volatility, Sharpe Ratio, Max Drawdown)</li>
          <li>Alpha/Beta Analysis vs Benchmark</li>
          <li>Asset Group Performance</li>
          <li>Performance Attribution</li>
          <li>Real-time Data Visualization</li>
        </ul>
      </Paper>

      <PerformanceSnapshotDashboard portfolioId={demoPortfolioId} />
    </Box>
  );
};

export default PerformanceSnapshotDemo;
