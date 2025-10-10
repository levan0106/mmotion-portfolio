import React, { useState, useEffect } from 'react';
import { Switch, FormControlLabel, Box, Typography, Chip, Tooltip } from '@mui/material';
import { Sync, SyncDisabled, Settings } from '@mui/icons-material';
import { useAutoSync } from '../../hooks/useGlobalAssets';

interface AutoSyncToggleProps {
  onToggle?: (enabled: boolean) => void;
  disabled?: boolean;
}

export const AutoSyncToggle: React.FC<AutoSyncToggleProps> = ({ 
  onToggle, 
  disabled = false 
}) => {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toggleAutoSync, getAutoSyncStatus } = useAutoSync();

  // Load current auto sync status on component mount
  useEffect(() => {
    const loadAutoSyncStatus = async () => {
      try {
        const status = await getAutoSyncStatus();
        setAutoSyncEnabled(status.enabled);
      } catch (error) {
        console.error('Failed to load auto sync status:', error);
      }
    };

    loadAutoSyncStatus();
  }, [getAutoSyncStatus]);

  const handleToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setIsLoading(true);

    try {
      await toggleAutoSync(enabled);
      setAutoSyncEnabled(enabled);
      onToggle?.(enabled);
      
      // Show success message
    } catch (error) {
      console.error('Failed to toggle auto sync:', error);
      // Revert the toggle state on error
      setAutoSyncEnabled(!enabled);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={autoSyncEnabled}
            onChange={handleToggle}
            disabled={disabled || isLoading}
            color="primary"
            size="medium"
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {autoSyncEnabled ? (
              <Sync color="primary" fontSize="small" />
            ) : (
              <SyncDisabled color="disabled" fontSize="small" />
            )}
            <Typography variant="body2" color="text.secondary">
              Auto Sync Market Price
            </Typography>
          </Box>
        }
      />
      
      <Chip
        icon={<Settings fontSize="small" />}
        label={autoSyncEnabled ? 'Enabled' : 'Disabled'}
        color={autoSyncEnabled ? 'success' : 'default'}
        size="small"
        variant={autoSyncEnabled ? 'filled' : 'outlined'}
      />
      
      {isLoading && (
        <Chip
          label="Updating..."
          size="small"
          color="info"
          variant="outlined"
        />
      )}
      
      <Tooltip title={
        autoSyncEnabled 
          ? "Market prices will be automatically synced from external sources every 15 minutes"
          : "Market prices will only be updated manually"
      }>
        <Typography variant="caption" color="text.secondary" sx={{ cursor: 'help' }}>
          ℹ️
        </Typography>
      </Tooltip>
    </Box>
  );
};

export default AutoSyncToggle;
