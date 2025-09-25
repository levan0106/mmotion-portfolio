import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  AttachMoney,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { apiService } from '../services/api';
import { HoldingDetail as HoldingDetailType } from '../types';
import { 
  formatCurrency, 
  formatNumberWithSeparators, 
  formatPercentage 
} from '../utils/format';

const HoldingDetail: React.FC = () => {
  const { holdingId } = useParams<{ holdingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [holdingDetail, setHoldingDetail] = useState<HoldingDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (holdingId) {
      fetchHoldingDetail();
    }
  }, [holdingId]);

  const fetchHoldingDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getHoldingDetail(holdingId!);
      setHoldingDetail(data);
    } catch (err) {
      console.error('Error fetching holding detail:', err);
      setError('Failed to load holding details');
    } finally {
      setLoading(false);
    }
  };

  const handleBackNavigation = () => {
    // Check if we came from NAV Holdings tab
    const fromNav = new URLSearchParams(location.search).get('from') === 'nav';
    
    if (fromNav && holdingDetail?.holding?.portfolioId) {
      // Navigate back to portfolio detail with NAV Holdings tab active (tab index 5)
      navigate(`/portfolios/${holdingDetail.holding.portfolioId}?tab=5`);
    } else {
      // Fallback to previous page
      navigate(-1);
    }
  };


  const getPnLColor = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return 'default';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'default';
    return num >= 0 ? 'success' : 'error';
  };

  const getPnLIcon = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return null;
    return num >= 0 ? <TrendingUp /> : <TrendingDown />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  if (!holdingDetail) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">
          No holding details found
        </Alert>
      </Container>
    );
  }

  const { holding, transactions, summary } = holdingDetail;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handleBackNavigation}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Holding Details
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {holding.account?.name} - {holding.portfolio?.name}
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalance color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Investment</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {formatCurrency(holding.totalInvestment, 'VND')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AttachMoney color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Current Value</Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                {formatCurrency(holding.currentValue, 'VND')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                {getPnLIcon(holding.unrealizedPnL)}
                <Typography variant="h6">Unrealized P&L</Typography>
              </Box>
              <Typography variant="h4" color={getPnLColor(holding.unrealizedPnL)}>
                {formatCurrency(holding.unrealizedPnL, 'VND')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                {getPnLIcon(holding.realizedPnL)}
                <Typography variant="h6">Realized P&L</Typography>
              </Box>
              <Typography variant="h4" color={getPnLColor(holding.realizedPnL)}>
                {formatCurrency(holding.realizedPnL, 'VND')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Holding Information */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Holding Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Units
                  </Typography>
                  <Typography variant="h6">
                    {formatNumberWithSeparators(holding.totalUnits, 3)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Average Cost per Unit
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(holding.avgCostPerUnit, 'VND')}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Current NAV per Unit
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(holding.portfolio?.navPerUnit || 0, 'VND')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Return Percentage
                  </Typography>
                  <Typography variant="h6" color={getPnLColor(summary.returnPercentage)}>
                    {formatPercentage(summary.returnPercentage, 2)}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Transaction Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {summary.totalTransactions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Transactions
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {summary.totalSubscriptions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Subscriptions
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {summary.totalRedemptions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Redemptions
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {formatNumberWithSeparators(summary.totalUnitsSubscribed, 3)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Units Subscribed
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Transaction History
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Units</TableCell>
                  <TableCell align="right">NAV per Unit</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map(({ transaction, cashFlow }) => (
                  <TableRow key={transaction.transactionId}>
                    <TableCell>
                      {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.holdingType}
                        color={transaction.holdingType === 'SUBSCRIBE' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatNumberWithSeparators(transaction.units, 3)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(transaction.navPerUnit, 'VND')}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(transaction.amount, 'VND')}
                    </TableCell>
                    <TableCell>
                      {cashFlow?.description || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
};

export default HoldingDetail;
