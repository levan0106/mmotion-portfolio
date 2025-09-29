// SnapshotManagement Page for CR-006 Asset Snapshot System

import React from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { SnapshotManagement } from '../components/Snapshot';

const SnapshotManagementPage: React.FC = () => {

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Asset Snapshot Management
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Manage portfolio snapshots, view performance charts, and export/import data
              </Typography>
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