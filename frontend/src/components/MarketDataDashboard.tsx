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
  CircularProgress,
  Stack,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { formatNumber, formatPercentage } from '@/utils/format';

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
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingByNation, setIsUpdatingByNation] = useState(false);
  const [isUpdatingByMarket, setIsUpdatingByMarket] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

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

  const handleUpdateAll = async () => {
    setIsUpdatingAll(true);
    try {
      await onUpdateAll();
    } catch (error) {
      console.error('Failed to update all prices:', error);
    } finally {
      setIsUpdatingAll(false);
    }
  };

  const handleUpdateByNation = async () => {
    if (selectedNation) {
      setIsUpdatingByNation(true);
      try {
        await onUpdateByNation(selectedNation);
      } catch (error) {
        console.error('Failed to update by nation:', error);
      } finally {
        setIsUpdatingByNation(false);
      }
    }
  };

  const handleUpdateByMarket = async () => {
    if (selectedMarket) {
      setIsUpdatingByMarket(true);
      try {
        await onUpdateByMarket(selectedMarket);
      } catch (error) {
        console.error('Failed to update by market:', error);
      } finally {
        setIsUpdatingByMarket(false);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestProvider = async (providerName: string) => {
    setTestingProvider(providerName);
    try {
      await onTestProvider(providerName);
    } catch (error) {
      console.error('Failed to test provider:', error);
    } finally {
      setTestingProvider(null);
    }
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
        {/* Enhanced Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          p: 4,
          mb: 4,
          color: 'white',
          boxShadow: '0 8px 32px rgba(102,126,234,0.3)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" component="h1" sx={{ 
                fontWeight: 700, 
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Market Data Dashboard
              </Typography>
              <Typography variant="h6" sx={{ 
                opacity: 0.9,
                fontWeight: 400
              }}>
                Real-time market data synchronization and monitoring
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={isRefreshing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.5)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                variant="contained"
                startIcon={isUpdatingAll ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
                onClick={handleUpdateAll}
                disabled={isUpdatingAll || loading}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                {isUpdatingAll ? 'Updating...' : 'Update All Prices'}
              </Button>
              <Tooltip title="Settings">
                <IconButton 
                  onClick={() => setSettingsDialogOpen(true)}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                    }
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Enhanced Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(102,126,234,0.4)',
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AssessmentIcon sx={{ fontSize: 32, mr: 1, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, opacity: 0.9 }}>
                    Total Assets
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {formatNumber(stats.totalAssets || 0,0)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Active market assets
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: stats.successRate >= 90 
                ? 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)'
                : stats.successRate >= 70
                ? 'linear-gradient(135deg, #ff9800 0%, #ffc107 100%)'
                : 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: stats.successRate >= 90 
                ? '0 8px 32px rgba(76,175,80,0.3)'
                : stats.successRate >= 70
                ? '0 8px 32px rgba(255,152,0,0.3)'
                : '0 8px 32px rgba(244,67,54,0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: stats.successRate >= 90 
                  ? '0 12px 40px rgba(76,175,80,0.4)'
                  : stats.successRate >= 70
                  ? '0 12px 40px rgba(255,152,0,0.4)'
                  : '0 12px 40px rgba(244,67,54,0.4)',
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: 32, mr: 1, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, opacity: 0.9 }}>
                    Success Rate
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {formatPercentage(stats.successRate.toFixed(1),1)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Update success rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(33,150,243,0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(33,150,243,0.4)',
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SpeedIcon sx={{ fontSize: 32, mr: 1, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, opacity: 0.9 }}>
                    Avg Response
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {stats.averageUpdateTime}ms
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Average response time
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(156,39,176,0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(156,39,176,0.4)',
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScheduleIcon sx={{ fontSize: 32, mr: 1, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, opacity: 0.9 }}>
                    Next Update
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {getTimeUntilNextUpdate()}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Scheduled update
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Enhanced Tabs */}
        <Card sx={{ 
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderBottom: '1px solid rgba(0,0,0,0.1)'
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: '1rem',
                  py: 2,
                  px: 4,
                  textTransform: 'none',
                  minHeight: 64,
                  '&.Mui-selected': {
                    color: '#667eea',
                    fontWeight: 700,
                  }
                },
                '& .MuiTabs-indicator': {
                  height: 4,
                  borderRadius: '2px 2px 0 0',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }
              }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: tabValue === 0 ? '#667eea' : '#6c757d' 
                    }} />
                    Overview
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: tabValue === 1 ? '#667eea' : '#6c757d' 
                    }} />
                    Providers
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: tabValue === 2 ? '#667eea' : '#6c757d' 
                    }} />
                    Recent Updates
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: tabValue === 3 ? '#667eea' : '#6c757d' 
                    }} />
                    Statistics
                  </Box>
                } 
              />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {tabValue === 0 && (
              <Box>
                {/* Quick Actions Header */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Quick Actions
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Selectively update market data by nation or market
                  </Typography>
                </Box>

                {/* Enhanced Quick Actions */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ 
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      }
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
                          Update by Nation
                        </Typography>
                        <FormControl fullWidth>
                          <InputLabel>Select Nation</InputLabel>
                          <Select
                            value={selectedNation}
                            onChange={(e) => setSelectedNation(e.target.value)}
                            label="Select Nation"
                            sx={{
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#667eea',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#5a6fd8',
                              },
                            }}
                          >
                            <MenuItem value="VN">🇻🇳 Vietnam</MenuItem>
                            <MenuItem value="US">🇺🇸 United States</MenuItem>
                            <MenuItem value="UK">🇬🇧 United Kingdom</MenuItem>
                            <MenuItem value="JP">🇯🇵 Japan</MenuItem>
                          </Select>
                        </FormControl>
                        <Button
                          variant="contained"
                          onClick={handleUpdateByNation}
                          disabled={!selectedNation || isUpdatingByNation || loading}
                          startIcon={isUpdatingByNation ? <CircularProgress size={20} color="inherit" /> : undefined}
                          fullWidth
                          sx={{
                            mt: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontWeight: 600,
                            py: 1.5,
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 16px rgba(102,126,234,0.3)',
                            }
                          }}
                        >
                          {isUpdatingByNation ? 'Updating...' : 'Update Nation'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ 
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      }
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
                          Update by Market
                        </Typography>
                        <FormControl fullWidth>
                          <InputLabel>Select Market</InputLabel>
                          <Select
                            value={selectedMarket}
                            onChange={(e) => setSelectedMarket(e.target.value)}
                            label="Select Market"
                            sx={{
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#667eea',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#5a6fd8',
                              },
                            }}
                          >
                            <MenuItem value="HOSE">🏛️ Ho Chi Minh Stock Exchange</MenuItem>
                            <MenuItem value="NYSE">🏢 New York Stock Exchange</MenuItem>
                            <MenuItem value="NASDAQ">💻 NASDAQ</MenuItem>
                            <MenuItem value="LSE">🏛️ London Stock Exchange</MenuItem>
                          </Select>
                        </FormControl>
                        <Button
                          variant="contained"
                          onClick={handleUpdateByMarket}
                          disabled={!selectedMarket || isUpdatingByMarket || loading}
                          startIcon={isUpdatingByMarket ? <CircularProgress size={20} color="inherit" /> : undefined}
                          fullWidth
                          sx={{
                            mt: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontWeight: 600,
                            py: 1.5,
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 16px rgba(102,126,234,0.3)',
                            }
                          }}
                        >
                          {isUpdatingByMarket ? 'Updating...' : 'Update Market'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={12} md={4}>
                    <Card sx={{ 
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    }}>
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
                          System Status
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Last Update
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {formatTime(stats.lastUpdate)}
                            </Typography>
                          </Box>
                          <Divider />
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Next Update
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {formatTime(stats.nextUpdate)}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                {/* Providers Header */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Data Providers
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Monitor and manage external data providers
                  </Typography>
                </Box>

                {/* Enhanced Providers Table */}
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                      height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#667eea',
                      borderRadius: '4px',
                      '&:hover': {
                        background: '#5a6fd8',
                      },
                    },
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'rgba(102,126,234,0.05)' }}>
                        <TableCell sx={{ fontWeight: 700, color: '#667eea', fontSize: '0.875rem' }}>
                          Provider
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#667eea', fontSize: '0.875rem' }}>
                          Status
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#667eea', fontSize: '0.875rem' }}>
                          Rate Limit
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#667eea', fontSize: '0.875rem' }}>
                          Last Check
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#667eea', fontSize: '0.875rem' }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {providers.map((provider) => (
                        <TableRow 
                          key={provider.name}
                          sx={{ 
                            '&:nth-of-type(odd)': { backgroundColor: 'rgba(0,0,0,0.02)' },
                            '&:hover': { backgroundColor: 'rgba(102,126,234,0.05)' },
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                backgroundColor: provider.status === 'connected' ? '#4caf50' : provider.status === 'error' ? '#f44336' : '#ff9800',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.875rem'
                              }}>
                                {provider.name.charAt(0)}
                              </Box>
                              <Box>
                                <Typography variant="body1" fontWeight="600">
                                  {provider.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {provider.baseUrl}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getProviderStatusIcon(provider.status)}
                              label={provider.status}
                              color={getProviderStatusColor(provider.status) as any}
                              size="small"
                              sx={{ 
                                fontWeight: 600,
                                '& .MuiChip-icon': {
                                  fontSize: '1rem'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SpeedIcon sx={{ fontSize: 16, color: '#667eea' }} />
                              <Typography variant="body2" fontWeight="500">
                                {provider.rateLimit} req/min
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatTime(provider.lastCheck)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleTestProvider(provider.name)}
                              disabled={testingProvider === provider.name || loading}
                              startIcon={testingProvider === provider.name ? <CircularProgress size={16} color="inherit" /> : undefined}
                              sx={{
                                borderColor: '#667eea',
                                color: '#667eea',
                                fontWeight: 600,
                                '&:hover': {
                                  borderColor: '#5a6fd8',
                                  backgroundColor: 'rgba(102,126,234,0.05)',
                                }
                              }}
                            >
                              {testingProvider === provider.name ? 'Testing...' : 'Test Connection'}
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
                {/* Recent Updates Header */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Recent Updates
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Latest price update results and status
                  </Typography>
                </Box>

                {/* Enhanced Recent Updates Table */}
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                      height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#667eea',
                      borderRadius: '4px',
                      '&:hover': {
                        background: '#5a6fd8',
                      },
                    },
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'rgba(102,126,234,0.05)' }}>
                        <TableCell sx={{ fontWeight: 700, color: '#667eea', fontSize: '0.875rem' }}>
                          Symbol
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#667eea', fontSize: '0.875rem' }}>
                          Result
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#667eea', fontSize: '0.875rem' }}>
                          Price
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#667eea', fontSize: '0.875rem' }}>
                          Error
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#667eea', fontSize: '0.875rem' }}>
                          Time
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentUpdates.map((update, index) => (
                        <TableRow 
                          key={index}
                          sx={{ 
                            '&:nth-of-type(odd)': { backgroundColor: 'rgba(0,0,0,0.02)' },
                            '&:hover': { backgroundColor: 'rgba(102,126,234,0.05)' },
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: '50%', 
                                backgroundColor: update.success ? '#4caf50' : '#f44336',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}>
                                {update.symbol.charAt(0)}
                              </Box>
                              <Typography variant="body1" fontWeight="600">
                                {update.symbol}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getUpdateResultIcon(update.success)}
                              <Typography variant="body2" sx={{ 
                                color: update.success ? '#4caf50' : '#f44336',
                                fontWeight: 600
                              }}>
                                {update.success ? 'Success' : 'Failed'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600,
                              color: update.newPrice ? '#2e7d32' : '#666'
                            }}>
                              {update.newPrice ? `$${update.newPrice.toFixed(2)}` : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="error" sx={{ 
                              fontSize: '0.75rem',
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {update.error || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
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
                {/* Statistics Header */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Performance Statistics
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Detailed performance metrics and analytics
                  </Typography>
                </Box>

                {/* Enhanced Statistics */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#667eea' }}>
                          Update Success Rate
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={stats.successRate}
                            sx={{ 
                              flexGrow: 1, 
                              height: 12, 
                              borderRadius: 6,
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 6,
                                background: stats.successRate >= 90 
                                  ? 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)'
                                  : stats.successRate >= 70
                                  ? 'linear-gradient(135deg, #ff9800 0%, #ffc107 100%)'
                                  : 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)',
                              }
                            }}
                          />
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
                            {stats.successRate.toFixed(1)}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Overall system performance
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card sx={{
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#667eea' }}>
                          Update Performance
                        </Typography>
                        <List dense>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon>
                              <CheckCircleIcon color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Successful Updates"
                              secondary={stats.successfulUpdates}
                              primaryTypographyProps={{ fontWeight: 600 }}
                              secondaryTypographyProps={{ color: '#4caf50', fontWeight: 600 }}
                            />
                          </ListItem>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon>
                              <ErrorIcon color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Failed Updates"
                              secondary={stats.failedUpdates}
                              primaryTypographyProps={{ fontWeight: 600 }}
                              secondaryTypographyProps={{ color: '#f44336', fontWeight: 600 }}
                            />
                          </ListItem>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon>
                              <SpeedIcon sx={{ color: '#667eea' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary="Average Response Time"
                              secondary={`${stats.averageUpdateTime}ms`}
                              primaryTypographyProps={{ fontWeight: 600 }}
                              secondaryTypographyProps={{ color: '#667eea', fontWeight: 600 }}
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

        {/* Enhanced Settings Dialog */}
        <Dialog 
          open={settingsDialogOpen} 
          onClose={() => setSettingsDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '1.5rem',
            py: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box>
              Market Data Settings
            </Box>
            <Button
              onClick={() => setSettingsDialogOpen(false)}
              sx={{
                color: 'white',
                minWidth: 'auto',
                p: 1,
                borderRadius: '50%',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <CloseIcon />
            </Button>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
              Configuration Options
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure market data providers, update intervals, and system settings.
            </Typography>
            
            {/* Settings form would go here */}
            <Box sx={{ 
              p: 3, 
              backgroundColor: 'rgba(102,126,234,0.05)', 
              borderRadius: 2,
              border: '1px solid rgba(102,126,234,0.1)',
              textAlign: 'center'
            }}>
              <SettingsIcon sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#667eea' }}>
                Settings Panel
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced configuration options will be available here
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            pt: 2,
            gap: 2,
            borderTop: '1px solid rgba(0,0,0,0.1)',
            justifyContent: 'flex-end'
          }}>
            <Button 
              onClick={() => setSettingsDialogOpen(false)}
              sx={{
                color: '#667eea',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(102,126,234,0.05)',
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontWeight: 600,
                px: 3,
                py: 1,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 16px rgba(102,126,234,0.3)',
                }
              }}
            >
              Save Settings
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default MarketDataDashboard;
