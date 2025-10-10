/**
 * Main App component
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Typography } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Portfolios from './pages/Portfolios';
import PortfolioDetail from './pages/PortfolioDetail';
import Trading from './pages/Trading';
import GlobalAssetsPage from './pages/GlobalAssetsPage';
import SnapshotManagementPage from './pages/SnapshotManagement';
import DepositManagement from './pages/DepositManagement';
import HoldingDetail from './pages/HoldingDetail';
import Holdings from './pages/Holdings';
import Transactions from './pages/Transactions';
import Assets from './pages/Assets';
import Report from './pages/Report';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { RoleManagement } from './pages/RoleManagement';
import { customTheme } from './theme/customTheme';
import { AccountProvider, useAccount } from './contexts/AccountContext';
import { ToastProvider } from './components/Common/ToastProvider';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppContent: React.FC = () => {
  const { loading, isAuthenticated } = useAccount();
  
  // Show loading state while fetching account data
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography variant="h6">Loading account...</Typography>
      </Box>
    );
  }

  // Only redirect to login if user is not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <AppLayout>
      <Box sx={{ minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolios" element={<Portfolios />} />
          <Route path="/portfolios/new" element={<Portfolios />} />
          <Route path="/portfolios/:portfolioId" element={<PortfolioDetail />} />
          <Route path="/portfolios/:portfolioId/trading" element={<Trading />} />
          <Route path="/holdings/:holdingId" element={<HoldingDetail />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/global-assets" element={<GlobalAssetsPage />} />
          <Route path="/snapshots" element={<SnapshotManagementPage />} />
          <Route path="/deposits" element={<DepositManagement />} />
          <Route path="/holdings" element={<Holdings />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/analytics" element={<div>Analytics Page - Coming Soon</div>} />
          <Route path="/reports" element={<Report />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/role-management" element={<RoleManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </AppLayout>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Initialize WebSocket connection
    // webSocketService.connect();
    
    // Cleanup on unmount
    return () => {
      // webSocketService.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={customTheme}>
        <CssBaseline />
        <AccountProvider>
          <ToastProvider>
            <Router>
              <AppContent />
            </Router>
          </ToastProvider>
        </AccountProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
