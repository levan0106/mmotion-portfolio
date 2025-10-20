import { useState, useEffect, useCallback } from 'react';
import { GlobalAssetTrackingService, GlobalAssetTracking, GlobalAssetTrackingQuery, GlobalAssetStats, ApiCallDetail } from '../services/api.global-asset-tracking';
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import ResponsiveTypography from './Common/ResponsiveTypography';
import GlobalAssetCleanupModal from './GlobalAssetTrackingDashboard/GlobalAssetCleanupModal';
import GlobalAssetTrackingDetailsModal from './GlobalAssetTrackingDashboard/GlobalAssetTrackingDetailsModal';
import {
  Error as AlertCircle,
  CheckCircle,
  AccessTime as Clock,
  TrendingUp,
  TrendingDown,
  PlayArrow as Activity,
  Storage as Database,
  Warning as AlertTriangle,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';

interface GlobalAssetTrackingDashboardProps {
  className?: string;
}

export default function GlobalAssetTrackingDashboard({ className }: GlobalAssetTrackingDashboardProps) {
  const [trackingRecords, setTrackingRecords] = useState<GlobalAssetTracking[]>([]);
  const [stats, setStats] = useState<GlobalAssetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<GlobalAssetTracking | null>(null);
  const [apiCallDetails, setApiCallDetails] = useState<ApiCallDetail[]>([]);
  const [loadingApiCalls, setLoadingApiCalls] = useState(false);
  const [lastFetchedExecutionId, setLastFetchedExecutionId] = useState<string | null>(null);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const [filters, setFilters] = useState<GlobalAssetTrackingQuery>({
    status: '',
    type: '',
    source: '',
    limit: 50,
    offset: 0,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTrackingRecords();
    fetchStats();
  }, [filters]);

  const fetchTrackingRecords = async () => {
    try {
      setLoading(true);
      const response = await GlobalAssetTrackingService.getTrackingRecords(filters);
      setTrackingRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching tracking records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await GlobalAssetTrackingService.getTrackingStats(30);
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchApiCallDetails = useCallback(async (executionId: string) => {
    // Avoid fetching the same executionId multiple times
    if (lastFetchedExecutionId === executionId && apiCallDetails.length > 0) {
      console.log('API call details already fetched for executionId:', executionId);
      return;
    }

    try {
      setLoadingApiCalls(true);
      console.log('Fetching API call details for executionId:', executionId);
      const details = await GlobalAssetTrackingService.getApiCallDetails(executionId);
      console.log('API call details received:', details);
      setApiCallDetails(details || []);
      setLastFetchedExecutionId(executionId);
    } catch (error) {
      console.error('Error fetching API call details:', error);
      setApiCallDetails([]);
    } finally {
      setLoadingApiCalls(false);
    }
  }, [lastFetchedExecutionId, apiCallDetails.length]);

  const handleRecordClick = (record: GlobalAssetTracking) => {
    setSelectedRecord(record);
    setShowDetails(true);
    // Reset API call details when opening a new record
    setApiCallDetails([]);
    setLastFetchedExecutionId(null);
    fetchApiCallDetails(record.executionId);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedRecord(null);
    setApiCallDetails([]);
    setLastFetchedExecutionId(null);
  };

  const handleCleanupOldData = async (days: number) => {
    try {
      setCleanupLoading(true);
      setCleanupResult(null);
      
      // Call cleanup API
      const result = await GlobalAssetTrackingService.cleanupOldData(days);
      setCleanupResult(`Successfully cleaned up ${result.deletedRecords} records older than ${days} days.`);
      
      // Refresh data after cleanup
      await fetchTrackingRecords();
      await fetchStats();
      
      // Close modal after 2 seconds on success
      setTimeout(() => {
        setShowCleanupDialog(false);
        setCleanupResult(null);
      }, 2000);
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      setCleanupResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <AlertCircle color="error" />;
      case 'running':
        return <Activity color="primary" />;
      case 'started':
        return <Clock color="info" />;
      default:
        return <AlertTriangle color="warning" />;
    }
  };

  const getStatusChip = (status: string) => {
    const statusColors = {
      completed: 'success',
      failed: 'error',
      running: 'primary',
      started: 'info',
    } as const;

    return (
      <Chip
        label={status.toUpperCase()}
        color={statusColors[status as keyof typeof statusColors] || 'default'}
        size="small"
      />
    );
  };


  return (
    <Box className={className}>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Database color="primary" />
                <Box>
                  <ResponsiveTypography variant="h6" color="primary">
                    {stats?.totalExecutions || 0}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    Total Executions
                  </ResponsiveTypography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle color="success" />
                <Box>
                  <ResponsiveTypography variant="h6" color="success.main">
                    {stats?.successfulExecutions || 0}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    Successful
                  </ResponsiveTypography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AlertCircle color="error" />
                <Box>
                  <ResponsiveTypography variant="h6" color="error.main">
                    {stats?.failedExecutions || 0}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    Failed
                  </ResponsiveTypography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUp color="info" />
                <Box>
                  <ResponsiveTypography variant="h6" color="info.main">
                    {stats?.averageSuccessRate ? stats.averageSuccessRate.toFixed(1) : '0.0'}%
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    Success Rate
                  </ResponsiveTypography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toggle */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1} sx={{ mb: 1 }}>
        <Tooltip title={showFilters ? 'Hide filters' : 'Show filters'}>
          <IconButton size="medium" onClick={() => setShowFilters(prev => !prev)}>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<DeleteIcon />}
          onClick={() => setShowCleanupDialog(true)}
        >
          Cleanup Old Data
        </Button>
      </Box>

      {/* Filters & Actions */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <ResponsiveTypography variant="h6">
                Filters
              </ResponsiveTypography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="">All statuses</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="running">Running</MenuItem>
                    <MenuItem value="started">Started</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    label="Type"
                  >
                    <MenuItem value="">All types</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="manual">Manual</MenuItem>
                    <MenuItem value="triggered">Triggered</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Source</InputLabel>
                  <Select
                    value={filters.source}
                    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                    label="Source"
                  >
                    <MenuItem value="">All sources</MenuItem>
                    <MenuItem value="cron_job">Cron Job</MenuItem>
                    <MenuItem value="api_trigger">API Trigger</MenuItem>
                    <MenuItem value="manual_trigger">Manual Trigger</MenuItem>
                    <MenuItem value="system_recovery">System Recovery</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Limit</InputLabel>
                  <Select
                    value={filters.limit?.toString() || '50'}
                    onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
                    label="Limit"
                  >
                    <MenuItem value="10">10</MenuItem>
                    <MenuItem value="25">25</MenuItem>
                    <MenuItem value="50">50</MenuItem>
                    <MenuItem value="100">100</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tracking Records Table */}
      <Card>
        <CardContent>
          <ResponsiveTypography variant="h6" gutterBottom>
            Tracking Records
          </ResponsiveTypography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Execution ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Started At</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Success Rate</TableCell>
                  <TableCell>Total/Success/Fail</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trackingRecords && trackingRecords.length > 0 ? (
                  trackingRecords.map((record) => (
                    <TableRow 
                      key={record.id} 
                      hover 
                      onClick={() => handleRecordClick(record)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        <ResponsiveTypography variant="body2">
                        {record.executionId}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusIcon(record.successRate === 100 ? 'completed' : 'failed')}
                          {getStatusChip(record.successRate === 100 ? 'completed' : 'failed')}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={record.type.toUpperCase()} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={record.source.replace('_', ' ').toUpperCase()} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>
                        <ResponsiveTypography variant="body2">
                        {formatDateTime(record.startedAt)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell>
                        <ResponsiveTypography variant="body2">
                        {formatDuration(record.executionTimeMs)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {record.successRate === 100 ? (
                            <TrendingUp color="success" />
                          ) : (
                            <TrendingDown color="error" />
                          )}
                          <ResponsiveTypography 
                            variant="body2" 
                            fontWeight="medium"
                            color={record.successRate === 100 ? 'success.main' : 'error.main'}
                          >
                            {record?.successRate ? record.successRate.toFixed(1) : '0.0'}%
                          </ResponsiveTypography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {record.totalSymbols}/{record.successfulUpdates}/{record.failedUpdates}
                        </ResponsiveTypography>
                      </TableCell>
                    
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      {loading ? (
                        <Box display="flex" alignItems="center" gap={2}>
                          <CircularProgress size={20} />
                          <ResponsiveTypography variant="body2">Loading tracking records...</ResponsiveTypography>
                        </Box>
                      ) : (
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          No tracking records found
                        </ResponsiveTypography>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <GlobalAssetTrackingDetailsModal
        open={showDetails} 
        onClose={handleCloseDetails}
        selectedRecord={selectedRecord}
        apiCallDetails={apiCallDetails}
        loadingApiCalls={loadingApiCalls}
        onFetchApiCallDetails={fetchApiCallDetails}
      />

      {/* Cleanup Modal */}
      <GlobalAssetCleanupModal
        open={showCleanupDialog}
        onClose={() => setShowCleanupDialog(false)}
        onCleanup={handleCleanupOldData}
        loading={cleanupLoading}
        result={cleanupResult}
      />
    </Box>
  );
}