/**
 * Asset Analytics Component
 * Displays analytics and charts for assets
 */

import React from 'react';
import { Asset, AssetType } from '../../types/asset.types';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { useAccount } from '../../contexts/AccountContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { ResponsiveButton } from '../Common';

export interface AssetAnalyticsProps {
  assets: Asset[];
  statistics: {
    totalAssets: number;
    totalValue: number;
    averageValue: number;
    assetsByType: Record<AssetType, number>;
  };
  onClose?: () => void;
  className?: string;
}

export const AssetAnalytics: React.FC<AssetAnalyticsProps> = ({
  assets,
  statistics,
  onClose,
}) => {
  const { baseCurrency } = useAccount();
  // Calculate performance metrics
  const performanceMetrics = React.useMemo(() => {
    const totalDailyReturn = assets.reduce((sum, asset) => sum + (Number(asset.performance?.daily) || 0), 0);
    const totalWeeklyReturn = assets.reduce((sum, asset) => sum + (Number(asset.performance?.weekly) || 0), 0);
    const totalMonthlyReturn = assets.reduce((sum, asset) => sum + (Number(asset.performance?.monthly) || 0), 0);
    const totalYearlyReturn = assets.reduce((sum, asset) => sum + (Number(asset.performance?.yearly) || 0), 0);

    return {
      averageDailyReturn: assets.length > 0 ? totalDailyReturn / assets.length : 0,
      averageWeeklyReturn: assets.length > 0 ? totalWeeklyReturn / assets.length : 0,
      averageMonthlyReturn: assets.length > 0 ? totalMonthlyReturn / assets.length : 0,
      averageYearlyReturn: assets.length > 0 ? totalYearlyReturn / assets.length : 0,
    };
  }, [assets]);

  // Calculate value distribution
  const valueDistribution = React.useMemo(() => {
    const ranges = [
      { label: 'Under 1M', min: 0, max: 1000000, count: 0 },
      { label: '1M - 5M', min: 1000000, max: 5000000, count: 0 },
      { label: '5M - 10M', min: 5000000, max: 10000000, count: 0 },
      { label: '10M - 50M', min: 10000000, max: 50000000, count: 0 },
      { label: 'Over 50M', min: 50000000, max: Infinity, count: 0 },
    ];

    assets.forEach(asset => {
      const value = Number(asset.totalValue) || 0;
      const range = ranges.find(r => value >= r.min && value < r.max);
      if (range) {
        range.count++;
      }
    });

    return ranges;
  }, [assets]);

  // Calculate top performers
  const topPerformers = React.useMemo(() => {
    return [...assets]
      .filter(asset => asset.performance?.yearly !== undefined)
      .sort((a, b) => (b.performance?.yearly || 0) - (a.performance?.yearly || 0))
      .slice(0, 5);
  }, [assets]);

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h3" gutterBottom>
            Asset Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive portfolio insights and performance metrics
          </Typography>
        </Box>
        {onClose && (
          <ResponsiveButton
            onClick={onClose}
            icon={<CloseIcon />}
            mobileText="Close"
            desktopText="Close"
            variant="outlined"
            size="small"
          >
            ×
          </ResponsiveButton>
        )}
      </Box>

      <Box>
        {/* Performance Overview */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Performance Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average returns across different time periods
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color={performanceMetrics.averageDailyReturn >= 0 ? 'success.main' : 'error.main'}>
                      {performanceMetrics.averageDailyReturn.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Daily Return
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {performanceMetrics.averageDailyReturn >= 0 ? (
                        <TrendingUpIcon color="success" />
                      ) : (
                        <TrendingDownIcon color="error" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color={performanceMetrics.averageWeeklyReturn >= 0 ? 'success.main' : 'error.main'}>
                      {performanceMetrics.averageWeeklyReturn.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Weekly Return
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {performanceMetrics.averageWeeklyReturn >= 0 ? (
                        <TrendingUpIcon color="success" />
                      ) : (
                        <TrendingDownIcon color="error" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color={performanceMetrics.averageMonthlyReturn >= 0 ? 'success.main' : 'error.main'}>
                      {performanceMetrics.averageMonthlyReturn.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monthly Return
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {performanceMetrics.averageMonthlyReturn >= 0 ? (
                        <TrendingUpIcon color="success" />
                      ) : (
                        <TrendingDownIcon color="error" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color={performanceMetrics.averageYearlyReturn >= 0 ? 'success.main' : 'error.main'}>
                      {performanceMetrics.averageYearlyReturn.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Yearly Return
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {performanceMetrics.averageYearlyReturn >= 0 ? (
                        <TrendingUpIcon color="success" />
                      ) : (
                        <TrendingDownIcon color="error" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Asset Type Distribution */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Asset Type Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Portfolio allocation across different asset types
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Object.entries(statistics.assetsByType).map(([type, count]) => {
                const percentage = statistics.totalAssets > 0 ? (count / statistics.totalAssets) * 100 : 0;
                return (
                  <Box key={type}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {type}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {count} assets
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {percentage.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* Value Distribution */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Value Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Asset distribution across value ranges
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {valueDistribution.map((range, index) => {
                const percentage = statistics.totalAssets > 0 ? (range.count / statistics.totalAssets) * 100 : 0;
                return (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {range.label}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {range.count} assets
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {percentage.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Top Performers
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Best performing assets based on yearly returns
              </Typography>
            </Box>
            {topPerformers.length > 0 ? (
              <List>
                {topPerformers.map((asset, index) => (
                  <ListItem key={asset.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={asset.name}
                      secondary={asset.symbol}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography 
                        variant="body2" 
                        color={(asset.performance?.yearly || 0) >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="medium"
                      >
                        {formatPercentage(asset.performance?.yearly || 0, 2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(Number(asset.totalValue) || 0, baseCurrency)}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No performance data available
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Paper>
  );
};

export default AssetAnalytics;
