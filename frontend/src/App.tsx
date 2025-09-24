/**
 * Main App component
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';

import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Portfolios from './pages/Portfolios';
import PortfolioDetail from './pages/PortfolioDetail';
import Trading from './pages/Trading';
import AssetManagement from './pages/AssetManagement';
import GlobalAssetsPage from './pages/GlobalAssetsPage';
import SnapshotManagementPage from './pages/SnapshotManagement';
import DepositManagement from './pages/DepositManagement';
import HoldingDetail from './pages/HoldingDetail';
import { customTheme } from './theme/customTheme';

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
        <Router>
          <AppLayout>
            <Box sx={{ minHeight: '100vh' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/portfolios" element={<Portfolios />} />
                <Route path="/portfolios/:portfolioId" element={<PortfolioDetail />} />
                <Route path="/portfolios/:portfolioId/trading" element={<Trading />} />
                <Route path="/holdings/:holdingId" element={<HoldingDetail />} />
                <Route path="/assets" element={<AssetManagement />} />
                <Route path="/global-assets" element={<GlobalAssetsPage />} />
                <Route path="/snapshots" element={<SnapshotManagementPage />} />
                <Route path="/deposits" element={<DepositManagement />} />
                <Route path="/analytics" element={<div>Analytics Page - Coming Soon</div>} />
                <Route path="/reports" element={<div>Reports Page - Coming Soon</div>} />
                <Route path="/settings" element={<div>Settings Page - Coming Soon</div>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
          </AppLayout>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
