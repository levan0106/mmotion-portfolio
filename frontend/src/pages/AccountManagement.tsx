import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { AccountManagementDemo } from '../components/Account';

const AccountManagement: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Account Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage user accounts, update information, and configure account settings.
        </Typography>
      </Box>

      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        <AccountManagementDemo />
      </Paper>
    </Container>
  );
};

export default AccountManagement;
