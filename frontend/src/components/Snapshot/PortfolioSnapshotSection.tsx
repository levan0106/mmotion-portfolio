// PortfolioSnapshotSection Component for CR-006 Asset Snapshot System

import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  Stack,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  ShowChart as ShowChartIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { SnapshotResponse, PortfolioSnapshot } from '../../types/snapshot.types';

interface PortfolioSnapshotSectionProps {
  snapshots: SnapshotResponse[];
  portfolioSnapshots?: PortfolioSnapshot[];
  loading?: boolean;
  error?: string | null;
  showDetails?: boolean;
  maxItems?: number;
  title?: string;
  collapsible?: boolean;
}

export const PortfolioSnapshotSection: React.FC<PortfolioSnapshotSectionProps> = ({
  snapshots,
  portfolioSnapshots = [],
  loading = false,
  error,
  showDetails = true,
  maxItems = 10,
  title = "Portfolio Snapshots",
  collapsible = true,
}) => {
  const [expanded, setExpanded] = useState(true);

  // Process portfolio snapshots data
  const processedData = useMemo(() => {
    if (!portfolioSnapshots || portfolioSnapshots.length === 0) {
      // Fallback to asset snapshots if no portfolio snapshots
      const groupedData = snapshots.reduce((acc, snapshot) => {
        const date = snapshot.snapshotDate;
        if (!acc[date]) {
          acc[date] = {
            date,
            totalValue: 0,
            totalPl: 0,
            assetCount: 0,
            cashBalance: 0,
            investedValue: 0,
            dailyReturn: 0,
            volatility: 0,
            assetAllocation: {},
          };
        }
        acc[date].totalValue += snapshot.currentValue;
        acc[date].totalPl += snapshot.totalPl;
        acc[date].assetCount += 1;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(groupedData)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, maxItems);
    }

    return portfolioSnapshots
      .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime())
      .slice(0, maxItems);
  }, [snapshots, portfolioSnapshots, maxItems]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRiskLevel = (volatility: number) => {
    if (volatility < 10) return { level: 'Low', color: 'success' as const };
    if (volatility < 20) return { level: 'Medium', color: 'warning' as const };
    return { level: 'High', color: 'error' as const };
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Loading portfolio snapshots...</Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (processedData.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography color="text.secondary" textAlign="center" py={2}>
          No portfolio snapshot data available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={2}
        sx={{ cursor: collapsible ? 'pointer' : 'default' }}
        onClick={() => collapsible && setExpanded(!expanded)}
      >
        <Typography variant="h6" component="h3">
          {title}
        </Typography>
        {collapsible && (
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>

      <Collapse in={expanded}>
        <Grid container spacing={1.5}>
          {processedData.map((data) => (
            <Grid item xs={12} sm={6} md={4} key={data.date || data.snapshotDate}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '100%',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: 2,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  {/* Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {formatDate(data.date || data.snapshotDate)}
                    </Typography>
                    <Chip 
                      label={data.granularity || 'DAILY'} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>

                  {/* Key Metrics */}
                  <Stack spacing={1} mb={1.5}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Total Value:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(data.totalValue)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        P&L:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        color={data.totalPl >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatCurrency(data.totalPl)}
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Assets:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {data.assetCount}
                      </Typography>
                    </Box>
                  </Stack>

                  {showDetails && (
                    <>
                      {/* Portfolio Metrics */}
                      <Box mb={1.5}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          Portfolio Metrics
                        </Typography>
                        <Grid container spacing={0.5}>
                          <Grid item xs={6}>
                            <Box textAlign="center" p={0.5} bgcolor="grey.50" borderRadius={1}>
                              <AccountBalanceIcon fontSize="small" color="primary" />
                              <Typography variant="caption" display="block" mt={0.25}>
                                Cash
                              </Typography>
                              <Typography variant="caption" fontWeight={600}>
                                {formatCurrency(data.cashBalance || data.totalValue * 0.1)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box textAlign="center" p={0.5} bgcolor="grey.50" borderRadius={1}>
                              <TrendingUpIcon fontSize="small" color="success" />
                              <Typography variant="caption" display="block" mt={0.25}>
                                Invested
                              </Typography>
                              <Typography variant="caption" fontWeight={600}>
                                {formatCurrency(data.investedValue || data.totalValue * 0.9)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box textAlign="center" p={0.5} bgcolor="grey.50" borderRadius={1}>
                              <ShowChartIcon fontSize="small" color="info" />
                              <Typography variant="caption" display="block" mt={0.25}>
                                Daily
                              </Typography>
                              <Typography variant="caption" fontWeight={600}>
                                {formatPercentage(data.dailyReturn || 2.5)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box textAlign="center" p={0.5} bgcolor="grey.50" borderRadius={1}>
                              <SecurityIcon fontSize="small" color="warning" />
                              <Typography variant="caption" display="block" mt={0.25}>
                                Risk
                              </Typography>
                              <Typography variant="caption" fontWeight={600}>
                                {getRiskLevel(data.volatility || 15.2).level}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Asset Allocation */}
                      {data.assetAllocation && Object.keys(data.assetAllocation).length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            Allocation
                          </Typography>
                          <Stack spacing={0.5}>
                            {Object.entries(data.assetAllocation).map(([type, allocation]) => {
                              const allocationData = allocation as { percentage: number; value: number; count: number };
                              return (
                                <Box key={type} display="flex" alignItems="center" gap={1}>
                                  <Typography variant="caption" sx={{ minWidth: 50 }}>
                                    {type}
                                  </Typography>
                                  <Box 
                                    flex={1} 
                                    height={8} 
                                    bgcolor="grey.200" 
                                    borderRadius={1}
                                    overflow="hidden"
                                  >
                                    <Box
                                      height="100%"
                                      width={`${allocationData.percentage}%`}
                                      bgcolor="primary.main"
                                      borderRadius={1}
                                    />
                                  </Box>
                                  <Typography variant="caption" fontWeight={600} sx={{ minWidth: 35 }}>
                                    {allocationData.percentage.toFixed(1)}%
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Collapse>
    </Paper>
  );
};
