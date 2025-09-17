import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Types
interface MarketDataStats {
  totalAssets: number;
  successfulUpdates: number;
  failedUpdates: number;
  successRate: number;
  averageUpdateTime: number;
  lastUpdate: string;
  nextUpdate: string;
}

interface PriceUpdateResult {
  assetId: string;
  symbol: string;
  success: boolean;
  newPrice?: number;
  error?: string;
  timestamp: string;
}

interface MarketDataProvider {
  name: string;
  baseUrl: string;
  isActive: boolean;
  rateLimit: number;
  lastCheck: string;
  status: 'connected' | 'disconnected' | 'error';
}

interface MarketDataDashboardProps {
  stats: MarketDataStats;
  providers: MarketDataProvider[];
  recentUpdates: PriceUpdateResult[];
  onRefresh: () => void;
  onUpdateAll: () => void;
  onUpdateByNation: (nation: string) => void;
  onUpdateByMarket: (marketCode: string) => void;
  onTestProvider: (providerName: string) => void;
  onUpdateConfig: (config: any) => void;
  loading?: boolean;
  error?: string;
}

// Mock data
const mockStats: MarketDataStats = {
  totalAssets: 150,
  successfulUpdates: 142,
  failedUpdates: 8,
  successRate: 94.7,
  averageUpdateTime: 1250,
  lastUpdate: '2024-01-15T10:30:00Z',
  nextUpdate: '2024-01-15T10:45:00Z',
};

const mockProviders: MarketDataProvider[] = [
  {
    name: 'MockProvider',
    baseUrl: 'https://api.mockprovider.com',
    isActive: true,
    rateLimit: 100,
    lastCheck: '2024-01-15T10:30:00Z',
    status: 'connected',
  },
  {
    name: 'AlphaVantage',
    baseUrl: 'https://www.alphavantage.co',
    isActive: false,
    rateLimit: 5,
    lastCheck: '2024-01-15T09:15:00Z',
    status: 'error',
  },
  {
    name: 'Yahoo Finance',
    baseUrl: 'https://query1.finance.yahoo.com',
    isActive: true,
    rateLimit: 2000,
    lastCheck: '2024-01-15T10:25:00Z',
    status: 'connected',
  },
];

const mockRecentUpdates: PriceUpdateResult[] = [
  {
    assetId: 'asset-1',
    symbol: 'HPG',
    success: true,
    newPrice: 150000,
    timestamp: '2024-01-15T10:30:00Z',
  },
  {
    assetId: 'asset-2',
    symbol: 'AAPL',
    success: true,
    newPrice: 185.50,
    timestamp: '2024-01-15T10:30:00Z',
  },
  {
    assetId: 'asset-3',
    symbol: 'MSFT',
    success: false,
    error: 'API rate limit exceeded',
    timestamp: '2024-01-15T10:30:00Z',
  },
  {
    assetId: 'asset-4',
    symbol: 'GOOGL',
    success: true,
    newPrice: 142.75,
    timestamp: '2024-01-15T10:30:00Z',
  },
];

const MarketDataDashboard: React.FC<MarketDataDashboardProps> = ({
  stats = mockStats,
  providers = mockProviders,
  recentUpdates = mockRecentUpdates,
  onRefresh,
  onUpdateAll,
  onUpdateByNation,
  onUpdateByMarket,
  onTestProvider,
  loading = false,
  error,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedNation, setSelectedNation] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeUntilNextUpdate = () => {
    const now = new Date();
    const nextUpdate = new Date(stats.nextUpdate);
    const diffInMinutes = Math.floor((nextUpdate.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffInMinutes <= 0) return 'Updating now...';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getProviderStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'disconnected': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getProviderStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircleIcon />;
      case 'disconnected': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  const getUpdateResultIcon = (success: boolean) => {
    return success ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />;
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUpdateAll = () => {
    onUpdateAll();
  };

  const handleUpdateByNation = () => {
    if (selectedNation) {
      onUpdateByNation(selectedNation);
    }
  };

  const handleUpdateByMarket = () => {
    if (selectedMarket) {
      onUpdateByMarket(selectedMarket);
    }
  };

  const handleTestProvider = (providerName: string) => {
    onTestProvider(providerName);
  };

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={onRefresh}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Market Data Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={handleUpdateAll}
              disabled={loading}
            >
              Update All Prices
            </Button>
            <IconButton onClick={() => setSettingsDialogOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Assets
                </Typography>
                <Typography variant="h4">
                  {stats.totalAssets}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Success Rate
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.successRate.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Update Time
                </Typography>
                <Typography variant="h4">
                  {stats.averageUpdateTime}ms
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Next Update
                </Typography>
                <Typography variant="h4">
                  {getTimeUntilNextUpdate()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Overview" />
              <Tab label="Providers" />
              <Tab label="Recent Updates" />
              <Tab label="Statistics" />
            </Tabs>
          </Box>

          <CardContent>
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Update by Nation</InputLabel>
                      <Select
                        value={selectedNation}
                        onChange={(e) => setSelectedNation(e.target.value)}
                        label="Update by Nation"
                      >
                        <MenuItem value="VN">Vietnam</MenuItem>
                        <MenuItem value="US">United States</MenuItem>
                        <MenuItem value="UK">United Kingdom</MenuItem>
                        <MenuItem value="JP">Japan</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Update by Market</InputLabel>
                      <Select
                        value={selectedMarket}
                        onChange={(e) => setSelectedMarket(e.target.value)}
                        label="Update by Market"
                      >
                        <MenuItem value="HOSE">Ho Chi Minh Stock Exchange</MenuItem>
                        <MenuItem value="NYSE">New York Stock Exchange</MenuItem>
                        <MenuItem value="NASDAQ">NASDAQ</MenuItem>
                        <MenuItem value="LSE">London Stock Exchange</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={handleUpdateByNation}
                        disabled={!selectedNation || loading}
                        fullWidth
                      >
                        Update Nation
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleUpdateByMarket}
                        disabled={!selectedMarket || loading}
                        fullWidth
                      >
                        Update Market
                      </Button>
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant="h6" gutterBottom>
                  System Status
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Last Update
                        </Typography>
                        <Typography variant="body2">
                          {formatTime(stats.lastUpdate)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Next Update
                        </Typography>
                        <Typography variant="body2">
                          {formatTime(stats.nextUpdate)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Data Providers
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Provider</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Rate Limit</TableCell>
                        <TableCell>Last Check</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {providers.map((provider) => (
                        <TableRow key={provider.name}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {provider.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {provider.baseUrl}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getProviderStatusIcon(provider.status)}
                              label={provider.status}
                              color={getProviderStatusColor(provider.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {provider.rateLimit} req/min
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatTime(provider.lastCheck)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => handleTestProvider(provider.name)}
                              disabled={loading}
                            >
                              Test Connection
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {tabValue === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Recent Updates
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Symbol</TableCell>
                        <TableCell>Result</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Error</TableCell>
                        <TableCell>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentUpdates.map((update, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {update.symbol}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getUpdateResultIcon(update.success)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {update.newPrice ? `$${update.newPrice.toFixed(2)}` : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="error">
                              {update.error || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatTime(update.timestamp)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {tabValue === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Performance Statistics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Update Success Rate
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={stats.successRate}
                            sx={{ flexGrow: 1 }}
                          />
                          <Typography variant="body2">
                            {stats.successRate.toFixed(1)}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Update Performance
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemIcon>
                              <CheckCircleIcon color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Successful Updates"
                              secondary={stats.successfulUpdates}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <ErrorIcon color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Failed Updates"
                              secondary={stats.failedUpdates}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <RefreshIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary="Average Response Time"
                              secondary={`${stats.averageUpdateTime}ms`}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Settings Dialog */}
        <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Market Data Settings</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure market data providers and update settings.
            </Typography>
            {/* Settings form would go here */}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Save Settings</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default MarketDataDashboard;
