import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { SnapshotTrackingApiService, SnapshotTrackingRecord } from '../../services/api.snapshot-tracking';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tracking-tabpanel-${index}`}
      aria-labelledby={`tracking-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SnapshotTrackingDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SnapshotTrackingRecord | null>(null);
  const [cleanupDays, setCleanupDays] = useState<number | string>(30);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    portfolioId: '',
    startDate: '',
    endDate: '',
    limit: 20,
    offset: 0,
  });

  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['snapshot-tracking-dashboard'],
    queryFn: () => SnapshotTrackingApiService.getDashboardData(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch tracking records with filters
  const { data: trackingRecords, isLoading: recordsLoading, error: recordsError } = useQuery({
    queryKey: ['snapshot-tracking-records', filters],
    queryFn: () => SnapshotTrackingApiService.getTrackingRecords(filters),
  });

  // Fetch statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['snapshot-tracking-stats'],
    queryFn: () => SnapshotTrackingApiService.getTrackingStats(),
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: (daysToKeep: number) => SnapshotTrackingApiService.cleanupOldRecords(daysToKeep),
    onSuccess: () => {
      // Invalidate all snapshot tracking related queries
      queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-records'] });
      queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-stats'] });
    },
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setFilterDialogOpen(false);
    // Trigger refetch with new filters
    queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-records'] });
  };

  const handleRefresh = () => {
    // Invalidate all snapshot tracking related queries
    queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-records'] });
    queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-stats'] });
  };

  const handleViewDetail = (record: SnapshotTrackingRecord) => {
    setSelectedRecord(record);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedRecord(null);
  };

  const handleCleanup = () => {
    setCleanupDialogOpen(true);
  };

  const handleConfirmCleanup = () => {
    // Handle empty input - use default value
    const daysToKeep = cleanupDays === '' ? 30 : Number(cleanupDays);
    
    // Validate input before submitting
    if (isNaN(daysToKeep)) {
      alert('Please enter a valid number for days to keep.');
      return;
    }
    
    if (daysToKeep < 0) {
      alert('Days to keep cannot be negative. Please enter a valid number.');
      return;
    }
    
    if (daysToKeep > 365) {
      alert('Days to keep cannot be more than 365. Please enter a valid number.');
      return;
    }
    
    cleanupMutation.mutate(daysToKeep);
    setCleanupDialogOpen(false);
  };

  const handleCancelCleanup = () => {
    setCleanupDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'in_progress':
        return 'warning';
      case 'started':
        return 'info';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'failed':
        return <ErrorIcon />;
      case 'in_progress':
        return <ScheduleIcon />;
      case 'started':
        return <ScheduleIcon />;
      case 'cancelled':
        return <ErrorIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (dashboardLoading || recordsLoading || statsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (dashboardError || recordsError) {
    return (
      <Alert severity="error">
        Failed to load tracking data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Snapshot Tracking Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Filters
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleCleanup}
            disabled={cleanupMutation.isLoading}
          >
            Cleanup Old Records
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {statsData?.data && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Executions
                    </Typography>
                    <Typography variant="h4">
                      {statsData.data.totalExecutions}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Success Rate
                    </Typography>
                    <Typography variant="h4">
                      {statsData.data.successRate.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Snapshots
                    </Typography>
                    <Typography variant="h4">
                      {statsData.data.totalSnapshots}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Avg Execution Time
                    </Typography>
                    <Typography variant="h4">
                      {formatDuration(statsData.data.averageExecutionTime)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Recent Executions" />
          <Tab label="All Records" />
          <Tab label="Failed Executions" />
          <Tab label="Statistics" />
        </Tabs>
      </Box>

      {/* Recent Executions Tab */}
      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Execution ID</TableCell>
                <TableCell>Portfolio</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Started At</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Snapshots</TableCell>
                <TableCell>Total Portfolios</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboardData?.data?.recentRecords?.map((record: SnapshotTrackingRecord) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {record.executionId.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {record.portfolioName || 'All Portfolios'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(record.status)}
                      label={record.status}
                      color={getStatusColor(record.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={record.type}
                      color={record.type === 'automated' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.startedAt), 'MMM dd, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    {formatDuration(record.executionTimeMs)}
                  </TableCell>
                  <TableCell>
                    {record.successfulSnapshots}/{record.totalSnapshots}
                  </TableCell>
                  <TableCell>
                    {record.totalPortfolios || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleViewDetail(record)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* All Records Tab */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Execution ID</TableCell>
                <TableCell>Portfolio</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Started At</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Snapshots</TableCell>
                <TableCell>Total Portfolios</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trackingRecords?.data?.map((record: SnapshotTrackingRecord) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {record.executionId.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {record.portfolioName || 'All Portfolios'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(record.status)}
                      label={record.status}
                      color={getStatusColor(record.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={record.type}
                      color={record.type === 'automated' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.startedAt), 'MMM dd, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    {formatDuration(record.executionTimeMs)}
                  </TableCell>
                  <TableCell>
                    {record.successfulSnapshots}/{record.totalSnapshots}
                  </TableCell>
                  <TableCell>
                    {record.totalPortfolios || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleViewDetail(record)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Failed Executions Tab */}
      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Execution ID</TableCell>
                <TableCell>Portfolio</TableCell>
                <TableCell>Error Message</TableCell>
                <TableCell>Started At</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Total Portfolios</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboardData?.data?.failedRecords?.map((record: SnapshotTrackingRecord) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {record.executionId.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {record.portfolioName || 'All Portfolios'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="error">
                      {record.errorMessage || 'Unknown error'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.startedAt), 'MMM dd, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    {formatDuration(record.executionTimeMs)}
                  </TableCell>
                  <TableCell>
                    {record.totalPortfolios || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleViewDetail(record)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Statistics Tab */}
      <TabPanel value={tabValue} index={3}>
        {statsData?.data && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Execution Statistics
                  </Typography>
                  <Box>
                    <Typography variant="body1">
                      <strong>Total Executions:</strong> {statsData.data.totalExecutions}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Successful:</strong> {statsData.data.successfulExecutions}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Failed:</strong> {statsData.data.failedExecutions}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Success Rate:</strong> {statsData.data.successRate.toFixed(2)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Statistics
                  </Typography>
                  <Box>
                    <Typography variant="body1">
                      <strong>Total Snapshots:</strong> {statsData.data.totalSnapshots}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Average Execution Time:</strong> {formatDuration(statsData.data.averageExecutionTime)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Tracking Records</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="started">Started</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="automated">Automated</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="test">Test</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Portfolio ID"
                value={filters.portfolioId}
                onChange={(e) => handleFilterChange('portfolioId', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApplyFilters} variant="contained">Apply Filters</Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle>
          Snapshot Tracking Details
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Execution ID</Typography>
                  <Typography variant="body1">{selectedRecord.executionId}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Portfolio ID</Typography>
                  <Typography variant="body1">{selectedRecord.portfolioId || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Portfolio Name</Typography>
                  <Typography variant="body1">{selectedRecord.portfolioName || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                  <Chip 
                    label={selectedRecord.status} 
                    color={getStatusColor(selectedRecord.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Type</Typography>
                  <Typography variant="body1">{selectedRecord.type}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Created By</Typography>
                  <Typography variant="body1">{selectedRecord.createdBy || 'System'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Started At</Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedRecord.startedAt), 'yyyy-MM-dd HH:mm:ss')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Completed At</Typography>
                  <Typography variant="body1">
                    {selectedRecord.completedAt ? format(new Date(selectedRecord.completedAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Total Snapshots</Typography>
                  <Typography variant="body1">{selectedRecord.totalSnapshots}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Successful Snapshots</Typography>
                  <Typography variant="body1">{selectedRecord.successfulSnapshots}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Failed Snapshots</Typography>
                  <Typography variant="body1">{selectedRecord.failedSnapshots}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Execution Time</Typography>
                  <Typography variant="body1">{formatDuration(selectedRecord.executionTimeMs)}</Typography>
                </Grid>
                {selectedRecord.cronExpression && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Cron Expression</Typography>
                    <Typography variant="body1">{selectedRecord.cronExpression}</Typography>
                  </Grid>
                )}
                {selectedRecord.timezone && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Timezone</Typography>
                    <Typography variant="body1">{selectedRecord.timezone}</Typography>
                  </Grid>
                )}
                {selectedRecord.errorMessage && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Error Message</Typography>
                    <Typography variant="body1" color="error" sx={{ wordBreak: 'break-word' }}>
                      {selectedRecord.errorMessage}
                    </Typography>
                  </Grid>
                )}
                {selectedRecord.metadata && Object.keys(selectedRecord.metadata).length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Metadata</Typography>
                    <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                      <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                        {JSON.stringify(selectedRecord.metadata, null, 2)}
                      </pre>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Cleanup Dialog */}
      <Dialog open={cleanupDialogOpen} onClose={handleCancelCleanup} maxWidth="sm" fullWidth>
        <DialogTitle>
          Clean Up Old Records
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              {cleanupDays === 0 || cleanupDays === '0'
                ? 'This action will permanently delete ALL tracking records.'
                : 'This action will permanently delete tracking records older than the specified number of days.'
              }
            </Typography>
            {(cleanupDays === 0 || cleanupDays === '0') && (
              <Typography variant="body1" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
                ⚠️ WARNING: This will delete ALL tracking records!
              </Typography>
            )}
            <Typography variant="body2" color="textSecondary" gutterBottom>
              This action cannot be undone.
            </Typography>
            <TextField
              fullWidth
              label="Days to Keep"
              type="number"
              value={cleanupDays}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setCleanupDays('' as any); // Allow empty input
                } else {
                  const numValue = parseInt(value, 10);
                  setCleanupDays(isNaN(numValue) ? '' : numValue);
                }
              }}
              helperText="Records older than this number of days will be deleted (0 = delete all records)"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCleanup}>Cancel</Button>
          <Button 
            onClick={handleConfirmCleanup} 
            variant="contained" 
            color={(cleanupDays === 0 || cleanupDays === '0') ? "error" : "warning"}
            disabled={cleanupMutation.isLoading}
          >
            {cleanupMutation.isLoading ? 'Cleaning...' : (cleanupDays === 0 || cleanupDays === '0') ? 'Delete ALL Records' : 'Clean Up'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SnapshotTrackingDashboard;
