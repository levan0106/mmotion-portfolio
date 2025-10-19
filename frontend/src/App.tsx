/**
 * Main App component
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Typography } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import './global.css';

import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Portfolios from './pages/Portfolios';
import PortfolioDetail from './pages/PortfolioDetail';
import Trading from './pages/Trading';
import TradingRedirect from './components/Trading/TradingRedirect';
import GlobalAssetsPage from './pages/GlobalAssetsPage';
import SnapshotManagementPage from './pages/SnapshotManagement';
import DepositManagement from './pages/DepositManagement';
import HoldingDetail from './pages/HoldingDetail';
import Holdings from './pages/Holdings';
import Transactions from './pages/Transactions';
import Assets from './pages/Assets';
import Report from './pages/Report';
import InvestorView from './pages/InvestorView';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { AdminManagement } from './pages/AdminManagement';
// import { I18nTest } from './pages/I18nTest'; // Commented out as not used
import { customTheme } from './theme/customTheme';
import { AccountProvider, useAccount } from './contexts/AccountContext';
import { ToastProvider } from './components/Common/ToastProvider';
import { NotificationProvider } from './contexts/NotificationContext';

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

  return (
    <Routes>
      {/* Public routes - no authentication required */}
      {!isAuthenticated ? (
        <>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="*" element={<Login />} />
        </>
      ) : (
        <>
          <Route path="/" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <Dashboard />
              </Box>
            </AppLayout>
          } />
          <Route path="/welcome" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <Welcome />
              </Box>
            </AppLayout>
          } />
          <Route path="/portfolios" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <Portfolios />
              </Box>
            </AppLayout>
          } />
          <Route path="/portfolios/new" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <Portfolios />
              </Box>
            </AppLayout>
          } />
          <Route path="/portfolios/:portfolioId" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <PortfolioDetail />
              </Box>
            </AppLayout>
          } />
          <Route path="/investor" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <InvestorView />
              </Box>
            </AppLayout>
          } />
          <Route path="/trading" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <TradingRedirect />
              </Box>
            </AppLayout>
          } />
          <Route path="/portfolios/:portfolioId/trading" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <Trading />
              </Box>
            </AppLayout>
          } />
          <Route path="/holdings/:holdingId" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <HoldingDetail />
              </Box>
            </AppLayout>
          } />
          <Route path="/assets" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <Assets />
              </Box>
            </AppLayout>
          } />
          <Route path="/global-assets" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <GlobalAssetsPage />
              </Box>
            </AppLayout>
          } />
          <Route path="/snapshots" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <SnapshotManagementPage />
              </Box>
            </AppLayout>
          } />
          <Route path="/deposits" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <DepositManagement />
              </Box>
            </AppLayout>
          } />
          <Route path="/holdings" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <Holdings />
              </Box>
            </AppLayout>
          } />
          <Route path="/transactions" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <Transactions />
              </Box>
            </AppLayout>
          } />
          <Route path="/analytics" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <div>Analytics Page - Coming Soon</div>
              </Box>
            </AppLayout>
          } />
          <Route path="/reports" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <Report />
              </Box>
            </AppLayout>
          } />
          <Route path="/profile" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <Profile />
              </Box>
            </AppLayout>
          } />
          <Route path="/settings" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <Settings />
              </Box>
            </AppLayout>
          } />
          <Route path="/admin-management" element={
            <AppLayout>
              <Box sx={{ minHeight: '100vh' }}>
                <AdminManagement />
              </Box>
            </AppLayout>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
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
            <NotificationProvider>
              <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AppContent />
              </Router>
            </NotificationProvider>
          </ToastProvider>
        </AccountProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
