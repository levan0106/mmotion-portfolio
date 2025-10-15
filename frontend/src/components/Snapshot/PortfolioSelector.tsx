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
  Assessment as SnapshotIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { snapshotService } from '../../services/snapshot.service';
import { PortfolioWithSnapshots } from '../../types/snapshot.types';
import { useAccount } from '../../contexts/AccountContext';

interface PortfolioSelectorProps {
  selectedPortfolioId?: string;
  onPortfolioChange: (portfolioId: string) => void;
  disabled?: boolean;
}

export const PortfolioSelector: React.FC<PortfolioSelectorProps> = ({
  selectedPortfolioId,
  onPortfolioChange,
  disabled = false,
}) => {
  const { accountId } = useAccount();
  const theme = useTheme();
  const [portfolios, setPortfolios] = useState<PortfolioWithSnapshots[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolios();
  }, [accountId]);

  const fetchPortfolios = async () => {
    if (!accountId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await snapshotService.getPortfoliosWithSnapshots(accountId);
      setPortfolios(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch portfolios');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const selectedPortfolio = portfolios.find(p => p.portfolioId === selectedPortfolioId);

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
          }}
        >
          <PortfolioIcon fontSize="large" />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Select Portfolio
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a portfolio to view its snapshots
          </Typography>
        </Box>
      </Box>

      <FormControl fullWidth size="small" disabled={disabled || loading}>
        <InputLabel>Portfolio</InputLabel>
        <Select
          value={selectedPortfolioId || ''}
          onChange={(e) => onPortfolioChange(e.target.value)}
          label="Portfolio"
        >
          {portfolios.map((portfolio) => (
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
                    {portfolio.portfolioName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                    {portfolio.portfolioId} • {portfolio.snapshotCount} snapshots
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`Latest: ${formatDate(portfolio.latestSnapshotDate)}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {selectedPortfolio && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Portfolio Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Total Snapshots
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        {selectedPortfolio.snapshotCount}
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
                        Latest Snapshot
                      </Typography>
                      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                        {formatDate(selectedPortfolio.latestSnapshotDate)}
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
                        Oldest Snapshot
                      </Typography>
                      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                        {formatDate(selectedPortfolio.oldestSnapshotDate)}
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
                        Portfolio Details
                      </Typography>
                      <Typography variant="body2" component="div" sx={{ fontWeight: 'bold' }}>
                        {selectedPortfolio.portfolioName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                        ID: {selectedPortfolio.portfolioId}
                      </Typography>
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
