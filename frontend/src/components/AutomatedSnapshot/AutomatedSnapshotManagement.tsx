import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Science as TestIcon,
  PowerSettingsNew as PowerIcon,
  PowerOff as PowerOffIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { AutomatedSnapshotApi, ManualTriggerResponse, TestSnapshotResponse, ServiceToggleResponse } from '../../services/api.automated-snapshots';
import { ToastService } from '../../services/toast';
import { usePortfolios } from '../../hooks/usePortfolios';
import { useAccount } from '../../contexts/AccountContext';
import ResponsiveTypography from '../Common/ResponsiveTypography';

interface AutomatedSnapshotManagementProps {
  // Add any props if needed
}

export const AutomatedSnapshotManagement: React.FC<AutomatedSnapshotManagementProps> = () => {
  const queryClient = useQueryClient();
  const { accountId } = useAccount();
  const { portfolios } = usePortfolios(accountId);
  
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [testResult, setTestResult] = useState<TestSnapshotResponse | null>(null);

  // Fetch automated snapshot status
  const { 
    data: status, 
    isLoading: statusLoading, 
    error: statusError,
    refetch: refetchStatus 
  } = useQuery(
    ['automated-snapshot-status'],
    AutomatedSnapshotApi.getStatus,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000, // Consider data stale after 10 seconds
    }
  );

  // Fetch schedule info
  const { 
    data: scheduleInfo
  } = useQuery(
    ['automated-snapshot-schedule'],
    AutomatedSnapshotApi.getScheduleInfo
  );

  // Manual trigger mutation
  const triggerMutation = useMutation(
    AutomatedSnapshotApi.triggerManual,
    {
      onSuccess: (data: ManualTriggerResponse) => {
        ToastService.success('Manual snapshot creation triggered successfully!');
        queryClient.invalidateQueries(['automated-snapshot-status']);
        // Convert ManualTriggerResponse to TestSnapshotResponse format for display
        setTestResult({
          success: true,
          message: data.message,
          snapshotsCreated: data.stats.totalSnapshots
        });
      },
      onError: (error: any) => {
        ToastService.error(`Failed to trigger manual snapshot: ${error.message}`);
      },
    }
  );

  // Test portfolio mutation
  const testMutation = useMutation(
    (portfolioId: string) => AutomatedSnapshotApi.testPortfolio(portfolioId),
    {
      onSuccess: (data: TestSnapshotResponse) => {
        ToastService.success(`Test completed: ${data.message}`);
        setTestResult(data);
      },
      onError: (error: any) => {
        ToastService.error(`Test failed: ${error.message}`);
      },
    }
  );

  // Enable service mutation
  const enableMutation = useMutation(
    AutomatedSnapshotApi.enableService,
    {
      onSuccess: (data: ServiceToggleResponse) => {
        ToastService.success(data.message);
        queryClient.invalidateQueries(['automated-snapshot-status']);
      },
      onError: (error: any) => {
        ToastService.error(`Failed to enable service: ${error.message}`);
      },
    }
  );

  // Disable service mutation
  const disableMutation = useMutation(
    AutomatedSnapshotApi.disableService,
    {
      onSuccess: (data: ServiceToggleResponse) => {
        ToastService.success(data.message);
        queryClient.invalidateQueries(['automated-snapshot-status']);
      },
      onError: (error: any) => {
        ToastService.error(`Failed to disable service: ${error.message}`);
      },
    }
  );

  const handleManualTrigger = () => {
    if (status?.isRunning) {
      ToastService.warning('Automated snapshot service is already running');
      return;
    }
    triggerMutation.mutate();
  };

  const handleTestPortfolio = () => {
    if (!selectedPortfolioId) {
      ToastService.warning('Please select a portfolio to test');
      return;
    }
    testMutation.mutate(selectedPortfolioId);
  };

  const handleRefresh = () => {
    refetchStatus();
  };

  const handleEnableService = () => {
    enableMutation.mutate();
  };

  const handleDisableService = () => {
    disableMutation.mutate();
  };

  const getStatusColor = (isRunning: boolean, isEnabled: boolean) => {
    if (!isEnabled) return 'error';
    return isRunning ? 'warning' : 'success';
  };

  const getStatusIcon = (isRunning: boolean, isEnabled: boolean) => {
    if (!isEnabled) return <PowerOffIcon />;
    return isRunning ? <StopIcon /> : <CheckCircleIcon />;
  };

  const formatExecutionTime = (timeMs: number) => {
    if (timeMs < 1000) return `${timeMs}ms`;
    if (timeMs < 60000) return `${(timeMs / 1000).toFixed(1)}s`;
    return `${(timeMs / 60000).toFixed(1)}m`;
  };

  const formatLastExecution = (lastExecutionTime: string | null) => {
    if (!lastExecutionTime) return 'Never';
    const date = new Date(lastExecutionTime);
    return date.toLocaleString();
  };

  if (statusLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (statusError) {
    return (
      <Alert severity="error">
        Error loading automated snapshot status: {statusError instanceof Error ? statusError.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <ResponsiveTypography variant="h4" component="h1" gutterBottom>
          Automated Snapshot Management
        </ResponsiveTypography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage the automated portfolio snapshot system
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Status Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Service Status</Typography>
                <IconButton onClick={handleRefresh} size="small">
                  <RefreshIcon />
                </IconButton>
              </Box>
              
              {status && (
                <>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      icon={getStatusIcon(status.isRunning, status.isEnabled)}
                      label={
                        !status.isEnabled ? 'Disabled' : 
                        status.isRunning ? 'Running' : 'Idle'
                      }
                      color={getStatusColor(status.isRunning, status.isEnabled)}
                      variant="outlined"
                    />
                    {status.isRunning && <LinearProgress sx={{ flexGrow: 1 }} />}
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last Execution: {formatLastExecution(status.lastExecutionTime)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Next Scheduled: {status.nextScheduledTime}
                  </Typography>

                  <Box display="flex" gap={1} mt={2}>
                    {status.isEnabled ? (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<PowerOffIcon />}
                        onClick={handleDisableService}
                        disabled={disableMutation.isLoading}
                        size="small"
                      >
                        {disableMutation.isLoading ? 'Disabling...' : 'Disable Service'}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        color="success"
                        startIcon={<PowerIcon />}
                        onClick={handleEnableService}
                        disabled={enableMutation.isLoading}
                        size="small"
                      >
                        {enableMutation.isLoading ? 'Enabling...' : 'Enable Service'}
                      </Button>
                    )}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Schedule Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ScheduleIcon />
                <Typography variant="h6">Schedule</Typography>
              </Box>
              
              {scheduleInfo && (
                <>
                  <Typography variant="body2" gutterBottom>
                    <strong>Cron Expression:</strong> {scheduleInfo.cronExpression}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Timezone:</strong> {scheduleInfo.timezone}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Description:</strong> {scheduleInfo.description}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Next Execution:</strong> {scheduleInfo.nextExecution}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Execution Statistics */}
        {status && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Last Execution Statistics
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {status.executionStats.totalPortfolios}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Portfolios
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {status.executionStats.successfulPortfolios}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Successful
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error.main">
                        {status.executionStats.failedPortfolios}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Failed
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {formatExecutionTime(status.executionStats.executionTime)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Execution Time
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box textAlign="center">
                  <Typography variant="h4" color="secondary.main">
                    {status.executionStats.totalSnapshots}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Snapshots Created
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={handleManualTrigger}
                  disabled={status?.isRunning || triggerMutation.isLoading || !status?.isEnabled}
                  color="primary"
                >
                  {triggerMutation.isLoading ? 'Triggering...' : 'Trigger Manual Snapshot'}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<TestIcon />}
                  onClick={() => setTestDialogOpen(true)}
                  color="secondary"
                >
                  Test Portfolio
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  color="info"
                >
                  Refresh Status
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Results */}
        {testResult && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Test Results
                </Typography>
                
                <Alert 
                  severity={testResult.success ? 'success' : 'error'}
                  icon={testResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                >
                  <Typography variant="body1" gutterBottom>
                    {testResult.message}
                  </Typography>
                  {testResult.snapshotsCreated > 0 && (
                    <Typography variant="body2">
                      Snapshots Created: {testResult.snapshotsCreated}
                    </Typography>
                  )}
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Test Portfolio Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Test Snapshot Creation</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Portfolio</InputLabel>
              <Select
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                label="Select Portfolio"
              >
                {portfolios?.map((portfolio) => (
                  <MenuItem key={portfolio.portfolioId} value={portfolio.portfolioId}>
                    {portfolio.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleTestPortfolio}
            variant="contained"
            disabled={!selectedPortfolioId || testMutation.isLoading}
          >
            {testMutation.isLoading ? 'Testing...' : 'Test'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
