// PortfolioSelector Component for CR-006 Asset Snapshot System

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Grid,
  Avatar,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AccountBalance as PortfolioIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingIcon,
  Assessment as SnapshotIcon,
} from '@mui/icons-material';
import { usePortfolios } from '../../hooks/usePortfolios';
import { useAccount } from '../../contexts/AccountContext';
import { snapshotService } from '../../services/snapshot.service';
import { useTranslation } from 'react-i18next';

interface PortfolioSelectorProps {
  selectedPortfolioId?: string;
  onPortfolioChange: (portfolioId: string) => void;
  disabled?: boolean;
}

interface PortfolioWithSnapshots {
  portfolioId: string;
  name: string;
  baseCurrency: string;
  createdAt: string;
  snapshotCount: number;
  latestSnapshotDate?: string;
  oldestSnapshotDate?: string;
}

export const PortfolioSelector: React.FC<PortfolioSelectorProps> = ({
  selectedPortfolioId,
  onPortfolioChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { accountId } = useAccount();
  const theme = useTheme();
  const { portfolios, isLoading: loading, error } = usePortfolios(accountId);
  const [portfoliosWithSnapshots, setPortfoliosWithSnapshots] = useState<PortfolioWithSnapshots[]>([]);
  const [snapshotStatsLoading, setSnapshotStatsLoading] = useState(false);

  useEffect(() => {
    if (portfolios.length > 0 && accountId) {
      fetchSnapshotStats();
    }
  }, [portfolios, accountId]);

  const fetchSnapshotStats = async () => {
    setSnapshotStatsLoading(true);
    try {
      const portfoliosWithStats = await Promise.all(
        portfolios.map(async (portfolio) => {
          try {
            const snapshots = await snapshotService.getSnapshots({ 
              portfolioId: portfolio.portfolioId
            }, accountId);
            
            const snapshotCount = snapshots.length;
            const latestSnapshotDate = snapshotCount > 0 ? snapshots[0].snapshotDate : undefined;
            const oldestSnapshotDate = snapshotCount > 0 ? snapshots[snapshots.length - 1].snapshotDate : undefined;
            
            return {
              ...portfolio,
              snapshotCount,
              latestSnapshotDate,
              oldestSnapshotDate,
            };
          } catch (error) {
            // If no snapshots exist, return portfolio with zero stats
            return {
              ...portfolio,
              snapshotCount: 0,
              latestSnapshotDate: undefined,
              oldestSnapshotDate: undefined,
            };
          }
        })
      );
      setPortfoliosWithSnapshots(portfoliosWithStats);
    } catch (error) {
      console.error('Failed to fetch snapshot stats:', error);
      // Fallback to portfolios without stats
      const fallbackPortfolios = portfolios.map(p => ({
        ...p,
        snapshotCount: 0,
        latestSnapshotDate: undefined,
        oldestSnapshotDate: undefined,
      }));
      setPortfoliosWithSnapshots(fallbackPortfolios);
    } finally {
      setSnapshotStatsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const selectedPortfolio = portfoliosWithSnapshots.find(p => p.portfolioId === selectedPortfolioId);

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>

      <FormControl fullWidth size="medium" disabled={disabled || loading || snapshotStatsLoading}>
        <InputLabel>{t('snapshots.selectPortfolio')} {snapshotStatsLoading ? t('snapshots.loadingSnapshots') : ''}</InputLabel>
        <Select
          value={selectedPortfolioId || ''}
          onChange={(e) => onPortfolioChange(e.target.value)}
          label={t('snapshots.selectPortfolio')}
        >
          {(portfoliosWithSnapshots.length > 0 ? portfoliosWithSnapshots : portfolios).map((portfolio) => (
            <MenuItem key={portfolio.portfolioId} value={portfolio.portfolioId}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    width: 32,
                    height: 32,
                  }}
                >
                  <PortfolioIcon fontSize="small" />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {portfolio.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                    {portfolio.portfolioId} • {(portfolio as any).snapshotCount || 0} {t('snapshots.snapshots')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={portfolio.baseCurrency}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {(portfolio as any).latestSnapshotDate && (
                    <Chip
                      label={`${t('snapshots.latest')}: ${formatDate((portfolio as any).latestSnapshotDate)}`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {!(portfolio as any).latestSnapshotDate && (portfolio as any).snapshotCount === 0 && (
                    <Chip
                      label={t('snapshots.noSnapshots')}
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {Boolean(error) && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {t('snapshots.failedToLoadPortfolios')}
        </Typography>
      )}

      {selectedPortfolio && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            {t('snapshots.portfolioDetails')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        {t('snapshots.totalSnapshots')}
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        {(selectedPortfolio as any).snapshotCount || 0}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      }}
                    >
                      <SnapshotIcon />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        {t('snapshots.latestSnapshot')}
                      </Typography>
                      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                        {(selectedPortfolio as any).latestSnapshotDate ? formatDate((selectedPortfolio as any).latestSnapshotDate) : t('snapshots.noSnapshots')}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main,
                      }}
                    >
                      <CalendarIcon />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        {t('snapshots.oldestSnapshot')}
                      </Typography>
                      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                        {(selectedPortfolio as any).oldestSnapshotDate ? formatDate((selectedPortfolio as any).oldestSnapshotDate) : t('snapshots.noSnapshots')}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main,
                      }}
                    >
                      <TrendingIcon />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        {t('snapshots.portfolioInfo')}
                      </Typography>
                      <Typography variant="body2" component="div" sx={{ fontWeight: 'bold' }}>
                        {selectedPortfolio.name}
                      </Typography>
                      {/* <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                        {selectedPortfolio.baseCurrency}
                      </Typography> */}
                    </Box>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        color: theme.palette.warning.main,
                      }}
                    >
                      <PortfolioIcon />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};
