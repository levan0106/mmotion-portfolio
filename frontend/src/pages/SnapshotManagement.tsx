// SnapshotManagement Page for CR-006 Asset Snapshot System

import React from 'react';
import {
  Box,
  Paper,
  useTheme,
} from '@mui/material';
import { SnapshotManagement } from '../components/Snapshot';
import { PermissionGuard } from '../components/Common/PermissionGuard';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';

const SnapshotManagementPage: React.FC = () => {
  return (
    <PermissionGuard 
      permission="financial.snapshots.manage"
    >
      <SnapshotManagementContent />
    </PermissionGuard>
  );
};

const SnapshotManagementContent: React.FC = () => {
  const theme = useTheme();
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <ResponsiveTypography variant="pageHeader" component="h1" 
              sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                filter: 'none' }}>
                Asset Snapshot Management
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle" sx={{ mb: 1 }}>
                Manage portfolio snapshots, view performance charts, and export/import data
              </ResponsiveTypography>
            </Box>
          </Box>
        </Box>

      </Box>

      {/* Main Content */}
      <Paper sx={{ p: 0, borderRadius: 2, boxShadow: 1 }}>
        <SnapshotManagement />
      </Paper>
    </Box>
  );
};

export default SnapshotManagementPage;
