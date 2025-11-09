import React, { useState, useMemo } from 'react';
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
  Pagination,
  Collapse,
  Switch,
  FormControlLabel,
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountTree as AccountTreeIcon,
  SubdirectoryArrowRight as SubdirectoryArrowRightIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { SnapshotTrackingApiService, SnapshotTrackingRecord } from '../../services/api.snapshot-tracking';
import { format } from 'date-fns';
import { ResponsiveButton, ActionButton } from '../Common';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface GroupedRecord {
  parentRecord: SnapshotTrackingRecord;
  childRecords: SnapshotTrackingRecord[];
}

interface GroupedRecords {
  [key: string]: GroupedRecord;
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
  const [groupByParent, setGroupByParent] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    portfolioId: '',
    startDate: '',
    endDate: '',
    limit: 50,
    offset: 0,
    page: 1,
  });
  const [pageSize, setPageSize] = useState(50);

  const queryClient = useQueryClient();

  // Fetch tracking records with filters
  const { data: trackingRecords, isLoading: recordsLoading, error: recordsError } = useQuery({
    queryKey: ['snapshot-tracking-records', filters],
    queryFn: () => SnapshotTrackingApiService.getTrackingRecords(filters),
  });

  // Grouping logic for records
  const groupedRecords = useMemo(() => {
    if (!groupByParent || !trackingRecords?.data) {
      return null;
    }

    const groups: GroupedRecords = {};
    const ungroupedRecords: SnapshotTrackingRecord[] = [];

    trackingRecords.data.forEach((record) => {
      const parentExecutionId = record.metadata?.parentExecutionId;
      
      if (parentExecutionId) {
        // This is a child record
        if (!groups[parentExecutionId]) {
          // Find the parent record
          const parentRecord = trackingRecords.data.find(r => r.executionId === parentExecutionId);
          if (parentRecord) {
            groups[parentExecutionId] = {
              parentRecord,
              childRecords: []
            };
          } else {
            // Parent not found, treat as ungrouped
            ungroupedRecords.push(record);
            return; // Skip adding to groups
          }
        }
        // Only add to childRecords if the group exists
        if (groups[parentExecutionId]) {
          groups[parentExecutionId].childRecords.push(record);
        }
      } else {
        // This is a parent record or standalone record
        if (!groups[record.executionId]) {
          groups[record.executionId] = {
            parentRecord: record,
            childRecords: []
          };
        }
      }
    });

    return { groups, ungroupedRecords };
  }, [trackingRecords?.data, groupByParent, expandedGroups]);

  // Fetch recent tracking records with pagination
  const { data: recentRecords, isLoading: recentLoading, error: recentError } = useQuery({
    queryKey: ['snapshot-tracking-recent', filters],
    queryFn: () => SnapshotTrackingApiService.getTrackingRecords({
      ...filters,
      // For recent records, we'll use a different approach - get all records and paginate
      limit: filters.limit,
      offset: filters.offset,
    }),
  });

  // Fetch failed tracking records with pagination
  const { data: failedRecords, isLoading: failedLoading, error: failedError } = useQuery({
    queryKey: ['snapshot-tracking-failed', filters],
    queryFn: () => SnapshotTrackingApiService.getTrackingRecords({
      ...filters,
      status: 'failed', // Filter for failed records only
      limit: filters.limit,
      offset: filters.offset,
    }),
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
      queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-records'] });
      queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-recent'] });
      queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-failed'] });
      queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-stats'] });
    },
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleToggleGroup = (executionId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(executionId)) {
        newSet.delete(executionId);
      } else {
        newSet.add(executionId);
      }
      return newSet;
    });
  };

  const handleToggleGrouping = () => {
    setGroupByParent(!groupByParent);
    setExpandedGroups(new Set());
  };

  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    const newOffset = (page - 1) * pageSize;
    setFilters(prev => ({ ...prev, page, offset: newOffset, limit: pageSize }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setFilters(prev => ({ 
      ...prev, 
      limit: newPageSize, 
      offset: 0, 
      page: 1 
    }));
    // Invalidate queries to refetch with new page size
    queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-records'] });
    queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-recent'] });
    queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-failed'] });
  };

  const handleApplyFilters = () => {
    setFilterDialogOpen(false);
    // Reset pagination when filters change
    setFilters(prev => ({ ...prev, page: 1, offset: 0 }));
    // Trigger refetch with new filters
    queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-records'] });
    queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-recent'] });
    queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-failed'] });
  };

  const handleRefresh = () => {
    // Invalidate all snapshot tracking related queries
    queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-records'] });
    queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-recent'] });
    queryClient.invalidateQueries({ queryKey: ['snapshot-tracking-failed'] });
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

  const renderGroupedTableRow = (record: SnapshotTrackingRecord, isChild: boolean = false) => (
    <TableRow key={record.id} sx={{ bgcolor: isChild ? 'grey.50' : 'inherit' }}>
      <TableCell>
        <Box display="flex" alignItems="center" sx={{ pl: isChild ? 4 : 0 }}>
          {isChild && (
            <>
              <SubdirectoryArrowRightIcon sx={{ mr: 1, fontSize: 16, minWidth: 16 }} />
              <Box sx={{ width: 32, mr: 1 }} />
            </>
          )}
          {!isChild && <Box sx={{ width: 48, mr: 1 }} />}
          <Typography variant="body2" fontFamily="monospace">
            {record.executionId.substring(0, 8)}...
          </Typography>
        </Box>
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
  );

  if (recordsLoading || recentLoading || failedLoading || statsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (recordsError || recentError || failedError) {
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
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={groupByParent}
                onChange={handleToggleGrouping}
                color="primary"
              />
            }
            label="Group by Parent Execution"
          />
          <ResponsiveButton
            variant="outlined"
            icon={<FilterListIcon />}
            onClick={() => setFilterDialogOpen(true)}
            mobileText="Filters"
            desktopText="Filters"
            sx={{ mr: 1 }}
          >
            Filters
          </ResponsiveButton>
          <ResponsiveButton
            variant="outlined"
            icon={<RefreshIcon />}
            onClick={handleRefresh}
            mobileText="Refresh"
            desktopText="Refresh"
            sx={{ mr: 1 }}
          >
            Refresh
          </ResponsiveButton>
          <ActionButton
            variant="outlined"
            color="warning"
            onClick={handleCleanup}
            disabled={cleanupMutation.isLoading}
            mobileText="Cleanup"
            desktopText="Cleanup Old Records"
          >
            Cleanup Old Records
          </ActionButton>
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
              {groupByParent && recentRecords?.data ? (
                // Group recent records by parent execution
                (() => {
                  const recentGroups: GroupedRecords = {};
                  const recentUngroupedRecords: SnapshotTrackingRecord[] = [];

                  recentRecords.data.forEach((record) => {
                    const parentExecutionId = record.metadata?.parentExecutionId;
                    
                    if (parentExecutionId) {
                      // This is a child record
                      if (!recentGroups[parentExecutionId]) {
                        // Find the parent record
                        const parentRecord = recentRecords.data.find(r => r.executionId === parentExecutionId);
                        if (parentRecord) {
                          recentGroups[parentExecutionId] = {
                            parentRecord,
                            childRecords: []
                          };
                        } else {
                          // Parent not found, treat as ungrouped
                          recentUngroupedRecords.push(record);
                          return;
                        }
                      }
                      // Only add to childRecords if the group exists
                      if (recentGroups[parentExecutionId]) {
                        recentGroups[parentExecutionId].childRecords.push(record);
                      }
                    } else {
                      // This is a parent record or standalone record
                      if (!recentGroups[record.executionId]) {
                        recentGroups[record.executionId] = {
                          parentRecord: record,
                          childRecords: []
                        };
                      }
                    }
                  });

                  return (
                    <>
                      {Object.entries(recentGroups).map(([executionId, group]) => (
                        <React.Fragment key={executionId}>
                          {/* Parent record */}
                          <TableRow sx={{ bgcolor: 'primary.50' }}>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleGroup(executionId)}
                                  sx={{ mr: 1, minWidth: 32 }}
                                >
                                  {expandedGroups.has(executionId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                                <AccountTreeIcon sx={{ mr: 1, fontSize: 16, color: 'primary.main', minWidth: 16 }} />
                                <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                                  {group.parentRecord.executionId.substring(0, 8)}...
                                </Typography>
                                <Chip
                                  label={`${group.childRecords.length} children`}
                                  size="small"
                                  color="primary"
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              {group.parentRecord.portfolioName || 'All Portfolios'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(group.parentRecord.status)}
                                label={group.parentRecord.status}
                                color={getStatusColor(group.parentRecord.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={group.parentRecord.type}
                                color={group.parentRecord.type === 'automated' ? 'primary' : 'secondary'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {format(new Date(group.parentRecord.startedAt), 'MMM dd, yyyy HH:mm:ss')}
                            </TableCell>
                            <TableCell>
                              {formatDuration(group.parentRecord.executionTimeMs)}
                            </TableCell>
                            <TableCell>
                              {group.parentRecord.successfulSnapshots}/{group.parentRecord.totalSnapshots}
                            </TableCell>
                            <TableCell>
                              {group.parentRecord.totalPortfolios || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Tooltip title="View Details">
                                <IconButton size="small" onClick={() => handleViewDetail(group.parentRecord)}>
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                          {/* Child records */}
                          <TableRow>
                            <TableCell colSpan={9} sx={{ p: 0 }}>
                              <Collapse in={expandedGroups.has(executionId)}>
                                <Box sx={{ bgcolor: 'grey.50' }}>
                                  {group.childRecords.map((childRecord) => 
                                    renderGroupedTableRow(childRecord, true)
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                      {/* Ungrouped records */}
                      {recentUngroupedRecords.map((record) => 
                        renderGroupedTableRow(record, false)
                      )}
                    </>
                  );
                })()
              ) : (
                // Render ungrouped recent records (original behavior)
                recentRecords?.data?.map((record: SnapshotTrackingRecord) => (
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination Controls for Recent Records */}
        {recentRecords?.pagination && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Rows per page:
              </Typography>
              <Select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                size="small"
                sx={{ minWidth: 80 }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Pagination
                count={Math.ceil(recentRecords.pagination.total / recentRecords.pagination.limit)}
                page={filters.page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                size="large"
              />
              <Typography variant="body2" color="textSecondary">
                Showing {recentRecords.pagination.offset + 1} to {Math.min(recentRecords.pagination.offset + recentRecords.pagination.limit, recentRecords.pagination.total)} of {recentRecords.pagination.total} records
              </Typography>
            </Box>
          </Box>
        )}
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
              {groupByParent && groupedRecords ? (
                // Render grouped records
                <>
                  {Object.entries(groupedRecords.groups).map(([executionId, group]) => (
                    <React.Fragment key={executionId}>
                      {/* Parent record */}
                      <TableRow sx={{ bgcolor: 'primary.50' }}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <IconButton
                              size="small"
                              onClick={() => handleToggleGroup(executionId)}
                              sx={{ mr: 1, minWidth: 32 }}
                            >
                              {expandedGroups.has(executionId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                            <AccountTreeIcon sx={{ mr: 1, fontSize: 16, color: 'primary.main', minWidth: 16 }} />
                            <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                              {group.parentRecord.executionId.substring(0, 8)}...
                            </Typography>
                            <Chip
                              label={`${group.childRecords.length} children`}
                              size="small"
                              color="primary"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          {group.parentRecord.portfolioName || 'All Portfolios'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(group.parentRecord.status)}
                            label={group.parentRecord.status}
                            color={getStatusColor(group.parentRecord.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={group.parentRecord.type}
                            color={group.parentRecord.type === 'automated' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(group.parentRecord.startedAt), 'MMM dd, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          {formatDuration(group.parentRecord.executionTimeMs)}
                        </TableCell>
                        <TableCell>
                          {group.parentRecord.successfulSnapshots}/{group.parentRecord.totalSnapshots}
                        </TableCell>
                        <TableCell>
                          {group.parentRecord.totalPortfolios || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewDetail(group.parentRecord)}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      {/* Child records */}
                      <TableRow>
                        <TableCell colSpan={9} sx={{ p: 0 }}>
                          <Collapse in={expandedGroups.has(executionId)}>
                            <Box sx={{ bgcolor: 'grey.50' }}>
                              {group.childRecords.map((childRecord) => 
                                renderGroupedTableRow(childRecord, true)
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                  {/* Ungrouped records */}
                  {groupedRecords.ungroupedRecords.map((record) => 
                    renderGroupedTableRow(record, false)
                  )}
                </>
              ) : (
                // Render ungrouped records (original behavior)
                trackingRecords?.data?.map((record: SnapshotTrackingRecord) => (
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination Controls */}
        {trackingRecords?.pagination && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Rows per page:
              </Typography>
              <Select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                size="small"
                sx={{ minWidth: 80 }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Pagination
                count={Math.ceil(trackingRecords.pagination.total / trackingRecords.pagination.limit)}
                page={filters.page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                size="large"
              />
              <Typography variant="body2" color="textSecondary">
                Showing {trackingRecords.pagination.offset + 1} to {Math.min(trackingRecords.pagination.offset + trackingRecords.pagination.limit, trackingRecords.pagination.total)} of {trackingRecords.pagination.total} records
              </Typography>
            </Box>
          </Box>
        )}
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
              {failedRecords?.data?.map((record: SnapshotTrackingRecord) => (
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
        
        {/* Pagination Controls for Failed Records */}
        {failedRecords?.pagination && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Rows per page:
              </Typography>
              <Select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                size="small"
                sx={{ minWidth: 80 }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Pagination
                count={Math.ceil(failedRecords.pagination.total / failedRecords.pagination.limit)}
                page={filters.page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                size="large"
              />
              <Typography variant="body2" color="textSecondary">
                Showing {failedRecords.pagination.offset + 1} to {Math.min(failedRecords.pagination.offset + failedRecords.pagination.limit, failedRecords.pagination.total)} of {failedRecords.pagination.total} records
              </Typography>
            </Box>
          </Box>
        )}
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
          <ResponsiveButton 
            onClick={() => setFilterDialogOpen(false)}
            variant="outlined"
            forceTextOnly={true}
            mobileText="Cancel"
            desktopText="Cancel"
          >
            Cancel
          </ResponsiveButton>
          <ResponsiveButton 
            onClick={handleApplyFilters} 
            variant="contained"
            forceTextOnly={true}
            mobileText="Apply"
            desktopText="Apply Filters"
          >
            Apply Filters
          </ResponsiveButton>
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
          <ResponsiveButton 
            onClick={handleCloseDetail}
            variant="outlined"
            forceTextOnly={true}
            mobileText="Close"
            desktopText="Close"
          >
            Close
          </ResponsiveButton>
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
          <ResponsiveButton 
            onClick={handleCancelCleanup}
            variant="outlined"
            forceTextOnly={true}
            mobileText="Cancel"
            desktopText="Cancel"
          >
            Cancel
          </ResponsiveButton>
          <ActionButton 
            onClick={handleConfirmCleanup} 
            variant="contained" 
            color={(cleanupDays === 0 || cleanupDays === '0') ? "error" : "warning"}
            disabled={cleanupMutation.isLoading}
            icon={cleanupMutation.isLoading ? undefined : undefined}
            forceTextOnly={true}
            mobileText={cleanupMutation.isLoading ? 'Cleaning...' : (cleanupDays === 0 || cleanupDays === '0') ? 'Delete ALL' : 'Clean Up'}
            desktopText={cleanupMutation.isLoading ? 'Cleaning...' : (cleanupDays === 0 || cleanupDays === '0') ? 'Delete ALL Records' : 'Clean Up'}
          >
            {cleanupMutation.isLoading ? 'Cleaning...' : (cleanupDays === 0 || cleanupDays === '0') ? 'Delete ALL Records' : 'Clean Up'}
          </ActionButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SnapshotTrackingDashboard;
