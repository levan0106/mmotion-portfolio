import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
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
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
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
  const { t } = useTranslation();
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
      setError(err.message || t('deviceManagement.errors.loadFailed'));
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
      setError(err.message || t('deviceManagement.errors.revokeFailed'));
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
      setError(err.message || t('deviceManagement.errors.revokeAllFailed'));
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
          title={t('deviceManagement.title')}
          subheader={t('deviceManagement.subtitle')}
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
                      <ResponsiveTypography variant="cardValue">{stats.totalDevices}</ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" color="text.secondary">
                        {t('deviceManagement.stats.totalDevices')}
                      </ResponsiveTypography>
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
                      <ResponsiveTypography variant="cardValue">{stats.activeDevices}</ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" color="text.secondary">
                        {t('deviceManagement.stats.activeDevices')}
                      </ResponsiveTypography>
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
                      <ResponsiveTypography variant="cardValue">{stats.expiredDevices}</ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" color="text.secondary">
                        {t('deviceManagement.stats.expiredDevices')}
                      </ResponsiveTypography>
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
                      <ResponsiveTypography variant="cardValue">{stats.highTrustDevices}</ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" color="text.secondary">
                        {t('deviceManagement.stats.highTrust')}
                      </ResponsiveTypography>
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
                    <ResponsiveTypography variant="cardTitle" color="text.secondary">
                      {t('deviceManagement.noDevices.title')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardSubtitle" color="text.secondary">
                      {t('deviceManagement.noDevices.subtitle')}
                    </ResponsiveTypography>
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
                            <ResponsiveTypography variant="cardTitle">
                              {device.deviceName}
                            </ResponsiveTypography>
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
                              label={t('deviceManagement.device.expired')}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                            <ResponsiveTypography variant="cardSubtitle" color="text.secondary">
                              {device.browserInfo}
                            </ResponsiveTypography>
                            <ResponsiveTypography variant="cardSubtitle" color="text.secondary">
                              {device.location} • {t('deviceManagement.device.lastUsed')}: {device.timeSinceLastUsed}
                            </ResponsiveTypography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title={t('deviceManagement.device.revoke')}>
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
                    <ResponsiveButton
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteSweepIcon />}
                      onClick={() => setRevokeAllDialogOpen(true)}
                    >
                      {t('deviceManagement.device.revokeAll')}
                    </ResponsiveButton>
                    <ResponsiveButton
                      variant="outlined"
                      onClick={loadData}
                    >
                      {t('deviceManagement.device.refresh')}
                    </ResponsiveButton>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Revoke Device Dialog */}
      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{t('deviceManagement.dialogs.revokeDevice.title')}</DialogTitle>
        <DialogContent>
          <ResponsiveTypography variant="body2" ellipsis={false}>
            {t('deviceManagement.dialogs.revokeDevice.message')}
          </ResponsiveTypography>
        </DialogContent>
        <DialogActions>
                <ResponsiveButton onClick={() => setRevokeDialogOpen(false)}>
                  {t('deviceManagement.dialogs.revokeDevice.cancel')}
                </ResponsiveButton>
                <ResponsiveButton
                  variant="contained"
                  color="error"
                  onClick={() => handleRevokeDevice(selectedDeviceId || '')}
                  disabled={revokingDeviceId !== null}
                >
                  {t('deviceManagement.dialogs.revokeDevice.confirm')}
                </ResponsiveButton>
        </DialogActions>
      </Dialog>

      {/* Revoke All Devices Dialog */}
      <Dialog open={revokeAllDialogOpen} onClose={() => setRevokeAllDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{t('deviceManagement.dialogs.revokeAll.title')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <ResponsiveTypography variant="body2" ellipsis={false}>
              {t('deviceManagement.dialogs.revokeAll.warning')}
            </ResponsiveTypography>
          </Alert>
          <ResponsiveTypography variant="body2" ellipsis={false}>
            {t('deviceManagement.dialogs.revokeAll.message', { count: devices.length })}
          </ResponsiveTypography>
        </DialogContent>
        <DialogActions>
                <ResponsiveButton onClick={() => setRevokeAllDialogOpen(false)}>
                  {t('deviceManagement.dialogs.revokeAll.cancel')}
                </ResponsiveButton>
                <ResponsiveButton
                  variant="contained"
                  color="error"
                  onClick={handleRevokeAllDevices}
                  disabled={revokingDeviceId !== null}
                >
                  {revokingDeviceId === 'all' ? t('deviceManagement.dialogs.revokeAll.revoking') : t('deviceManagement.dialogs.revokeAll.confirm')}
                </ResponsiveButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
