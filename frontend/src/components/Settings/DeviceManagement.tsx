import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Security as SecurityIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  DeviceHub as DeviceHubIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { deviceTrustService, TrustedDevice, DeviceStats } from '../../services/deviceTrustService';

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [stats, setStats] = useState<DeviceStats>({
    totalDevices: 0,
    activeDevices: 0,
    expiredDevices: 0,
    highTrustDevices: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeAllDialogOpen, setRevokeAllDialogOpen] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [devicesData, statsData] = await Promise.all([
        deviceTrustService.getTrustedDevices(),
        deviceTrustService.getDeviceStats()
      ]);
      
      setDevices(devicesData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load device data');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      setRevokingDeviceId(deviceId);
      await deviceTrustService.revokeDevice(deviceId);
      await loadData();
      setRevokeDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to revoke device');
    } finally {
      setRevokingDeviceId(null);
    }
  };

  const handleRevokeAllDevices = async () => {
    try {
      setRevokingDeviceId('all');
      await deviceTrustService.revokeAllDevices();
      await loadData();
      setRevokeAllDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to revoke all devices');
    } finally {
      setRevokingDeviceId(null);
    }
  };

  const getTrustLevelColor = (trustLevel: 'LOW' | 'MEDIUM' | 'HIGH') => {
    return deviceTrustService.getTrustLevelColor(trustLevel);
  };

  const getTrustLevelLabel = (trustLevel: 'LOW' | 'MEDIUM' | 'HIGH') => {
    return deviceTrustService.getTrustLevelLabel(trustLevel);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardHeader
          avatar={<SecurityIcon color="primary" />}
          title="Trusted Devices"
          subheader="Manage devices that can access your account without password"
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Statistics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <DeviceHubIcon color="primary" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{stats.totalDevices}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Devices
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{stats.activeDevices}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Devices
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <WarningIcon color="warning" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{stats.expiredDevices}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Expired Devices
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <SecurityIcon color="info" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{stats.highTrustDevices}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        High Trust
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Device List */}
          {devices.length === 0 ? (
            <Box textAlign="center" py={4}>
              <DeviceHubIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Trusted Devices
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Devices will be automatically added when you log in
              </Typography>
            </Box>
          ) : (
            <List>
              {devices.map((device, index) => (
                <React.Fragment key={device.deviceId}>
                  <ListItem>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <DeviceHubIcon />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">
                            {device.deviceName}
                          </Typography>
                          <Chip
                            label={getTrustLevelLabel(device.trustLevel)}
                            size="small"
                            sx={{
                              backgroundColor: getTrustLevelColor(device.trustLevel),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                          {!device.isActive && (
                            <Chip
                              label="Expired"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {device.browserInfo}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {device.location} • Last used: {device.timeSinceLastUsed}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Revoke Device">
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => {
                            setSelectedDeviceId(device.deviceId);
                            setRevokeDialogOpen(true);
                          }}
                          disabled={revokingDeviceId === device.deviceId}
                        >
                          {revokingDeviceId === device.deviceId ? (
                            <CircularProgress size={20} />
                          ) : (
                            <DeleteIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < devices.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {/* Actions */}
          {devices.length > 0 && (
            <Box mt={3} display="flex" gap={2}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={() => setRevokeAllDialogOpen(true)}
              >
                Revoke All Devices
              </Button>
              <Button
                variant="outlined"
                onClick={loadData}
              >
                Refresh
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Revoke Device Dialog */}
      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)}>
        <DialogTitle>Revoke Device</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to revoke this device? You will need to enter your password 
            the next time you log in from this device.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => handleRevokeDevice(selectedDeviceId || '')}
            disabled={revokingDeviceId !== null}
          >
            Revoke
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke All Devices Dialog */}
      <Dialog open={revokeAllDialogOpen} onClose={() => setRevokeAllDialogOpen(false)}>
        <DialogTitle>Revoke All Devices</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              This will revoke all trusted devices. You will need to enter your password 
              the next time you log in from any device.
            </Typography>
          </Alert>
          <Typography>
            Are you sure you want to revoke all {devices.length} devices?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeAllDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={handleRevokeAllDevices}
            disabled={revokingDeviceId !== null}
          >
            {revokingDeviceId === 'all' ? 'Revoking...' : 'Revoke All'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
