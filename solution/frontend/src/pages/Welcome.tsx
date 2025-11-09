/**
 * Welcome Page - Hướng dẫn sử dụng hệ thống Portfolio Management
 * Thiết kế đơn giản và trực quan cho người dùng mới
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../contexts/AccountContext';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Avatar,
  Fade,
  Slide,
  alpha,
  useTheme,
  useMediaQuery,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  AccountBalance as PortfolioIcon,
  TrendingUp as AnalyticsIcon,
  Assessment as TradingIcon,
  AccountBalanceWallet as AssetIcon,
  MonetizationOn as DepositIcon,
  PieChart as FundIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
  Language as LanguageIcon,
  Add as AddIcon,
  ShoppingCart as TradingIcon2,
  Dashboard as DashboardIcon,
  TouchApp as TouchIcon,
  AttachMoney as CashFlowIcon,
  TableChart as TableIcon,
  ShowChart as ChartIcon,
} from '@mui/icons-material';
import { ResponsiveButton } from '../components/Common';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';
import DemoAccountSuggestionBanner from '../components/Common/DemoAccountSuggestionBanner';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/format';
import { getAssetTypeColor } from '../config/chartColors';

// Helper function to safely get palette colors
const getPaletteColor = (theme: any, color: string, variant: 'main' | 'dark' = 'main') => {
  const paletteColor = theme.palette[color as keyof typeof theme.palette];
  if (paletteColor && typeof paletteColor === 'object' && 'main' in paletteColor) {
    return variant === 'main' ? paletteColor.main : paletteColor.dark || paletteColor.main;
  }
  return variant === 'main' ? theme.palette.primary.main : theme.palette.primary.dark;
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  color: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description, 
  features, 
  color, 
  delay 
}) => {
  const theme = useTheme();
  
  return (
    <Slide direction="up" in timeout={600 + delay}>
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(getPaletteColor(theme, color), 0.05)} 0%, ${alpha(getPaletteColor(theme, color), 0.02)} 100%)`,
          border: `1px solid ${alpha(getPaletteColor(theme, color), 0.1)}`,
          borderRadius: 3,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 24px ${alpha(getPaletteColor(theme, color), 0.15)}`,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: getPaletteColor(theme, color),
                width: 48,
                height: 48,
                mr: 2,
              }}
            >
              {icon}
            </Avatar>
            <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 600 }}>
              {title}
            </ResponsiveTypography>
          </Box>
          
          <ResponsiveTypography variant="labelXSmall" color="text.secondary" sx={{ mb: 2 }} ellipsis={false}>
            {description}
          </ResponsiveTypography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {features.map((feature, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckIcon sx={{ fontSize: 16, color: getPaletteColor(theme, color) }} />
                <ResponsiveTypography variant="formHelper" sx={{ fontSize: '0.875rem' }}>
                  {feature}
                </ResponsiveTypography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Slide>
  );
};

interface QuickStartStepProps {
  title: string;
  description: string;
  action: string;
  onAction: () => void;
  icon: React.ReactNode;
  color: string;
  isCompleted?: boolean;
  isActive?: boolean;
}

const QuickStartStep: React.FC<QuickStartStepProps> = ({
  title,
  description,
  action,
  onAction,
  icon,
  color,
  isCompleted = false,
  isActive = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  return (
    <Step completed={isCompleted} active={isActive}>
      <StepLabel
        StepIconComponent={({ completed, active }) => (
          <Avatar
            sx={{
              bgcolor: completed 
                ? 'success.main' 
                : active 
                  ? getPaletteColor(theme, color)
                  : 'grey.300',
              width: 40,
              height: 40,
              transition: 'all 0.3s ease',
              transform: active ? 'scale(1.1)' : 'scale(1)',
              boxShadow: active 
                ? `0 4px 12px ${alpha(getPaletteColor(theme, color), 0.3)}`
                : 'none',
            }}
          >
            {completed ? <CheckIcon /> : icon}
          </Avatar>
        )}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <ResponsiveTypography 
            variant="cardTitle" 
            sx={{ 
              color: isActive ? getPaletteColor(theme, color) : 'text.primary',
              fontWeight: isActive ? 600 : 500,
            }}
          >
            {title}
          </ResponsiveTypography>
          {isActive && (
            <Chip
              label={t('welcome.quickStartGuide.steps.currentStep')}
              size="small"
              color={color as any}
              variant="filled"
              sx={{ fontSize: '0.75rem' }}
            />
          )}
        </Box>
      </StepLabel>
      <StepContent>
        <Box sx={{ 
          p: 3, 
          borderRadius: 2, 
          bgcolor: isActive 
            ? alpha(getPaletteColor(theme, color), 0.05)
            : 'transparent',
          border: isActive 
            ? `1px solid ${alpha(getPaletteColor(theme, color), 0.2)}`
            : 'none',
          transition: 'all 0.3s ease',
        }}>
          <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ mb: 3 }}>
            {description}
          </ResponsiveTypography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ResponsiveButton
              variant="contained"
              onClick={onAction}
              endIcon={<ArrowIcon />}
              sx={{ 
                borderRadius: 2,
                background: `linear-gradient(135deg, ${getPaletteColor(theme, color)} 0%, ${getPaletteColor(theme, color, 'dark')} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${getPaletteColor(theme, color, 'dark')} 0%, ${getPaletteColor(theme, color)} 100%)`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 16px ${alpha(getPaletteColor(theme, color), 0.3)}`,
                },
                transition: 'all 0.3s ease',
              }}
            >
              {action}
            </ResponsiveButton>
            
            {isActive && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TouchIcon sx={{ fontSize: 16, color: getPaletteColor(theme, color) }} />
                <ResponsiveTypography variant="formHelper" sx={{ color: getPaletteColor(theme, color) }}>
                  {t('welcome.quickStartGuide.steps.clickToContinue')}
                </ResponsiveTypography>
              </Box>
            )}
          </Box>
        </Box>
      </StepContent>
    </Step>
  );
};

const Welcome: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAccount();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showWelcome] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/portfolios/new');
    } else {
      // Redirect to login page, then to portfolios/new after login
      navigate('/login?redirect=/portfolios/new');
    }
  };

  const handleViewDashboard = () => {
    if (isAuthenticated) {
      navigate('/');
    } else {
      // Redirect to login page, then to dashboard after login
      navigate('/login?redirect=/');
    }
  };

  const handleViewPortfolios = () => {
    if (isAuthenticated) {
      navigate('/portfolios');
    } else {
      // Redirect to login page, then to portfolios after login
      navigate('/login?redirect=/portfolios');
    }
  };

  const handleViewTrading = () => {
    if (isAuthenticated) {
      navigate('/trading');
    } else {
      // Redirect to login page, then to trading after login
      navigate('/login?redirect=/trading');
    }
  };

  const handleViewAssets = () => {
    if (isAuthenticated) {
      navigate('/assets');
    } else {
      // Redirect to login page, then to assets after login
      navigate('/login?redirect=/assets');
    }
  };

  const handleViewCashFlow = () => {
    if (isAuthenticated) {
      navigate('/trading?tab=cash-flow');
    } else {
      // Redirect to login page, then to trading with cash-flow tab after login
      navigate('/login?redirect=/trading?tab=cash-flow');
    }
  };


  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex);
  };

  const handleStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
    // Auto-advance to next step if not the last step
    if (stepIndex < 4) {
      setActiveStep(stepIndex + 1);
    }
  };

  const handleNextStep = () => {
    if (activeStep < 4) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const features = [
    {
      icon: <PortfolioIcon />,
      title: t('welcome.features.portfolio.title'),
      description: t('welcome.features.portfolio.description'),
      features: [
        t('welcome.features.portfolio.feature1'),
        t('welcome.features.portfolio.feature2'),
        t('welcome.features.portfolio.feature3'),
        t('welcome.features.portfolio.feature4'),
      ],
      color: 'primary',
      delay: 0,
    },
    {
      icon: <TradingIcon />,
      title: t('welcome.features.trading.title'),
      description: t('welcome.features.trading.description'),
      features: [
        t('welcome.features.trading.feature1'),
        t('welcome.features.trading.feature2'),
        t('welcome.features.trading.feature3'),
        t('welcome.features.trading.feature4'),
      ],
      color: 'success',
      delay: 100,
    },
    {
      icon: <AnalyticsIcon />,
      title: t('welcome.features.analytics.title'),
      description: t('welcome.features.analytics.description'),
      features: [
        t('welcome.features.analytics.feature1'),
        t('welcome.features.analytics.feature2'),
        t('welcome.features.analytics.feature3'),
        t('welcome.features.analytics.feature4'),
      ],
      color: 'info',
      delay: 200,
    },
    {
      icon: <AssetIcon />,
      title: t('welcome.features.assets.title'),
      description: t('welcome.features.assets.description'),
      features: [
        t('welcome.features.assets.feature1'),
        t('welcome.features.assets.feature2'),
        t('welcome.features.assets.feature3'),
        t('welcome.features.assets.feature4'),
      ],
      color: 'warning',
      delay: 300,
    },
    {
      icon: <DepositIcon />,
      title: t('welcome.features.deposits.title'),
      description: t('welcome.features.deposits.description'),
      features: [
        t('welcome.features.deposits.feature1'),
        t('welcome.features.deposits.feature2'),
        t('welcome.features.deposits.feature3'),
        t('welcome.features.deposits.feature4'),
      ],
      color: 'secondary',
      delay: 400,
    },
    {
      icon: <FundIcon />,
      title: t('welcome.features.funds.title'),
      description: t('welcome.features.funds.description'),
      features: [
        t('welcome.features.funds.feature1'),
        t('welcome.features.funds.feature2'),
        t('welcome.features.funds.feature3'),
        t('welcome.features.funds.feature4'),
      ],
      color: 'error',
      delay: 500,
    },
  ];

  if (!showWelcome) {
    return null;
  }

  return (
    <Fade in timeout={800}>
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          {/* Demo Account Suggestion Banner */}
          {isAuthenticated && <DemoAccountSuggestionBanner />}

          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 6, position: 'relative' }}>
            
            <Box sx={{ mb: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                }}
              >
                <PortfolioIcon sx={{ fontSize: 40, color: 'white' }} />
              </Avatar>
              
              <ResponsiveTypography
                variant="pageTitle"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                }}
                ellipsis={false}
              >
               {t('welcome.title')}
              </ResponsiveTypography>
              
              <ResponsiveTypography variant="pageSubtitle" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }} ellipsis={false}>
                {t('welcome.subtitle')}
              </ResponsiveTypography>
            </Box>
          </Box>

          {/* Example Data Section */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <ResponsiveTypography variant="pageTitle" sx={{ mb: 2 }}>
                {t('welcome.examples.title')}
              </ResponsiveTypography>
              {/* <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
                {t('welcome.examples.subtitle')}
              </ResponsiveTypography> */}
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Example Portfolio Table */}
              <Grid item xs={12} lg={6}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <TableIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 600 }}>
                        {t('welcome.examples.portfolioTable.title')}
                      </ResponsiveTypography>
                    </Box>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ mb: 2 }}>
                      {t('welcome.examples.portfolioTable.description')}
                    </ResponsiveTypography>
                    
                    <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'primary.50' }}>
                            <TableCell><ResponsiveTypography variant="tableHeader" sx={{ fontWeight: 600 }}>{t('welcome.examples.portfolioTable.columns.name')}</ResponsiveTypography></TableCell>
                            {/* <TableCell><ResponsiveTypography variant="tableHeader" sx={{ fontWeight: 600 }}>{t('welcome.examples.portfolioTable.columns.currency')}</ResponsiveTypography></TableCell> */}
                            <TableCell align="right"><ResponsiveTypography variant="tableHeader" sx={{ fontWeight: 600 }}>{t('welcome.examples.portfolioTable.columns.totalValue')}</ResponsiveTypography></TableCell>
                            <TableCell align="right"><ResponsiveTypography variant="tableHeader" sx={{ fontWeight: 600 }}>{t('welcome.examples.portfolioTable.columns.return')}</ResponsiveTypography></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[
                            { name: 'Danh mục Cổ phiếu', currency: 'VND', totalValue: 2500000000, return: 15.5 },
                            { name: 'Danh mục Trái phiếu', currency: 'VND', totalValue: 1500000000, return: 8.2 },
                            { name: 'Danh mục Đa dạng', currency: 'USD', totalValue: 50000, return: 12.8 },
                          ].map((portfolio, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PortfolioIcon sx={{ fontSize: 18, color: 'primary.main', mr: 1 }} />
                                  <ResponsiveTypography variant="tableCell">{portfolio.name}</ResponsiveTypography>
                                </Box>
                              </TableCell>
                              {/* <TableCell>
                                <Chip label={portfolio.currency} size="small" variant="outlined" />
                              </TableCell> */}
                              <TableCell align="right">
                                <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                                  {formatCurrency(portfolio.totalValue, portfolio.currency)}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`+${portfolio.return.toFixed(1)}%`}
                                  size="small"
                                  color={portfolio.return >= 10 ? 'success' : 'default'}
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Example Trading Table */}
              <Grid item xs={12} lg={6}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.15)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <TradingIcon2 sx={{ mr: 2, color: 'success.main' }} />
                      <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 600 }}>
                        {t('welcome.examples.tradingTable.title')}
                      </ResponsiveTypography>
                    </Box>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ mb: 2 }}>
                      {t('welcome.examples.tradingTable.description')}
                    </ResponsiveTypography>
                    
                    <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'success.50' }}>
                            <TableCell><ResponsiveTypography variant="tableHeader" sx={{ fontWeight: 600 }}>{t('welcome.examples.tradingTable.columns.symbol')}</ResponsiveTypography> </TableCell>
                            <TableCell><ResponsiveTypography variant="tableHeader" sx={{ fontWeight: 600 }}>{t('welcome.examples.tradingTable.columns.side')}</ResponsiveTypography></TableCell>
                            <TableCell align="right"><ResponsiveTypography variant="tableHeader" sx={{ fontWeight: 600 }}>{t('welcome.examples.tradingTable.columns.quantity')}</ResponsiveTypography></TableCell>
                            <TableCell align="right"><ResponsiveTypography variant="tableHeader" sx={{ fontWeight: 600 }}>{t('welcome.examples.tradingTable.columns.price')}</ResponsiveTypography></TableCell>
                            <TableCell align="right"><ResponsiveTypography variant="tableHeader" sx={{ fontWeight: 600 }}>{t('welcome.examples.tradingTable.columns.total')}</ResponsiveTypography></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[
                            { symbol: 'VIC', side: 'BUY', quantity: 1000, price: 75000, total: 75000000 },
                            { symbol: 'VNM', side: 'BUY', quantity: 500, price: 82000, total: 41000000 },
                            { symbol: 'VCB', side: 'SELL', quantity: 200, price: 95000, total: 19000000 },
                          ].map((trade, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 600 }}>
                                  {trade.symbol}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={trade.side}
                                  size="small"
                                  color={trade.side === 'BUY' ? 'success' : 'error'}
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                {formatNumber(trade.quantity)}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(trade.price, 'VND')}
                              </TableCell>
                              <TableCell align="right">
                                <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                                  {formatCurrency(trade.total, 'VND')}
                                </ResponsiveTypography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Example Charts Section */}
            <Grid container spacing={3}>
              {/* Asset Allocation Chart */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.15)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <ChartIcon sx={{ mr: 2, color: 'info.main' }} />
                      <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 600 }}>
                        {t('welcome.examples.allocationChart.title')}
                      </ResponsiveTypography>
                    </Box>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ mb: 3 }}>
                      {t('welcome.examples.allocationChart.description')}
                    </ResponsiveTypography>
                    
                    <Box sx={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'STOCK', value: 45, marketValue: 1125000000 },
                              { name: 'BOND', value: 30, marketValue: 750000000 },
                              { name: 'CASH', value: 15, marketValue: 375000000 },
                              { name: 'OTHER', value: 10, marketValue: 250000000 },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'STOCK', value: 45 },
                              { name: 'BOND', value: 30 },
                              { name: 'CASH', value: 15 },
                              { name: 'OTHER', value: 10 },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getAssetTypeColor(entry.name.toLowerCase())} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any, name: any) => {
                              const marketValueMap: Record<string, number> = {
                                'STOCK': 1125000000,
                                'BOND': 750000000,
                                'CASH': 375000000,
                                'OTHER': 250000000,
                              };
                              const marketValue = marketValueMap[name] || 0;
                              return [
                                `${formatPercentage(value)} (${formatCurrency(marketValue, 'VND')})`,
                                t('welcome.examples.allocationChart.allocation')
                              ];
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Performance Chart */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.15)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <AnalyticsIcon sx={{ mr: 2, color: 'warning.main' }} />
                      <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 600 }}>
                        {t('welcome.examples.performanceChart.title')}
                      </ResponsiveTypography>
                    </Box>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ mb: 3 }}>
                      {t('welcome.examples.performanceChart.description')}
                    </ResponsiveTypography>
                    
                    <Box sx={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { month: 'T1', return: 5.2, unrealizedPl: 130000000 },
                            { month: 'T2', return: 8.5, unrealizedPl: 212500000 },
                            { month: 'T3', return: 12.1, unrealizedPl: 302500000 },
                            { month: 'T4', return: 15.5, unrealizedPl: 387500000 },
                            { month: 'T5', return: 18.2, unrealizedPl: 455000000 },
                            { month: 'T6', return: 22.3, unrealizedPl: 557500000 },
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(value) => `${value}%`} hide={isMobile} />
                          <Tooltip
                            formatter={(value: any) => [
                              `${value}%`,
                              t('welcome.examples.performanceChart.return')
                            ]}
                          />
                          {/* <Legend /> */}
                          <Bar 
                            dataKey="return" 
                            fill={theme.palette.primary.main}
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Features Section */}
          <Box sx={{ mb: 8 }}>
            <ResponsiveTypography variant="pageTitle" sx={{ textAlign: 'center', mb: 4 }}>
              {t('welcome.features.title')}
            </ResponsiveTypography>
            
            <Grid container spacing={3}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} lg={4} key={index}>
                  <FeatureCard {...feature} />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Quick Start Guide */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <ResponsiveTypography variant="pageTitle" sx={{ mb: 2 }}>
                {t('welcome.quickStart.title')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle" color="text.secondary" sx={{ mb: 3 }}>
                {t('welcome.quickStartGuide.subtitle')}
              </ResponsiveTypography>
              
              {/* Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <ResponsiveTypography variant="formHelper" color="text.secondary">
                    {t('welcome.quickStartGuide.progress.step', { current: activeStep + 1, total: 5 })}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="formHelper" color="text.secondary">
                    {t('welcome.quickStartGuide.progress.complete', { percentage: Math.round(((activeStep + 1) / 5) * 100) })}
                  </ResponsiveTypography>
                </Box>
                <Box sx={{ 
                  width: '100%', 
                  height: 8, 
                  bgcolor: 'grey.200', 
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  <Box sx={{
                    width: `${((activeStep + 1) / 5) * 100}%`,
                    height: '100%',
                    bgcolor: 'primary.main',
                    borderRadius: 4,
                    transition: 'width 0.5s ease-in-out',
                  }} />
                </Box>
              </Box>
              
              {/* Progress Indicator */}
               {!isMobile && ( <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {[0, 1, 2, 3, 4].map((step) => (
                    <Box key={step} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        onClick={() => handleStepClick(step)}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: step === activeStep 
                            ? 'primary.main' 
                            : completedSteps.includes(step)
                              ? 'success.main'
                              : 'grey.300',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          transform: step === activeStep ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: step === activeStep 
                            ? '0 4px 12px rgba(25, 118, 210, 0.3)'
                            : 'none',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                          },
                        }}
                      >
                        {completedSteps.includes(step) ? <CheckIcon /> : step + 1}
                      </Avatar>
                      {step < 4 && (
                        <Box
                          sx={{
                            width: 50,
                            height: 3,
                            bgcolor: step < activeStep || completedSteps.includes(step) ? 'primary.main' : 'grey.300',
                            mx: 1,
                            borderRadius: 1.5,
                            transition: 'all 0.3s ease',
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
              )}

              {/* Navigation Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                <ResponsiveButton
                  variant="outlined"
                  onClick={handlePrevStep}
                  disabled={activeStep === 0}
                  icon={<ArrowIcon sx={{ transform: 'rotate(180deg)' }} />}
                  sx={{ borderRadius: 2 }}
                >
                  {t('welcome.quickStartGuide.navigation.previous')}
                </ResponsiveButton>
                <ResponsiveButton
                  variant="contained"
                  onClick={handleNextStep}
                  disabled={activeStep === 4}
                  endIcon={<ArrowIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  {t('welcome.quickStartGuide.navigation.next')}
                </ResponsiveButton>
              </Box>

              {/* Completion Message */}
              {completedSteps.length === 5 && (
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 3, 
                  bgcolor: 'success.light', 
                  borderRadius: 2, 
                  mb: 3,
                  border: '1px solid',
                  borderColor: 'success.main',
                }}>
                  <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <ResponsiveTypography variant="cardTitle" sx={{ color: 'success.dark', mb: 1 }}>
                    {t('welcome.quickStartGuide.completion.title')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardLabel" color="text.secondary">
                    {t('welcome.quickStartGuide.completion.message')}
                  </ResponsiveTypography>
                </Box>
              )}
            </Box>
            
            <Card sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}>
              <CardContent sx={{ p: 4 }}>
                <Stepper 
                  orientation="vertical" 
                  activeStep={activeStep}
                  sx={{ 
                    '& .MuiStepLabel-root': { alignItems: 'flex-start' },
                    '& .MuiStepConnector-root': {
                      '& .MuiStepConnector-line': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        borderWidth: 2,
                      }
                    }
                  }}
                >
                  <QuickStartStep
                    title={t('welcome.quickStartGuide.steps.createPortfolio.title')}
                    description={t('welcome.quickStartGuide.steps.createPortfolio.description')}
                    action={t('welcome.quickStartGuide.steps.createPortfolio.action')}
                    onAction={() => {
                      handleStepComplete(0);
                      handleGetStarted();
                    }}
                    icon={<AddIcon />}
                    color="primary"
                    isActive={activeStep === 0}
                    isCompleted={completedSteps.includes(0)}
                  />
                  <QuickStartStep
                    title={t('welcome.quickStartGuide.steps.addCashFlow.title')}
                    description={t('welcome.quickStartGuide.steps.addCashFlow.description')}
                    action={t('welcome.quickStartGuide.steps.addCashFlow.action')}
                    onAction={() => {
                      handleStepComplete(1);
                      handleViewCashFlow();
                    }}
                    icon={<CashFlowIcon />}
                    color="secondary"
                    isActive={activeStep === 1}
                    isCompleted={completedSteps.includes(1)}
                  />
                  <QuickStartStep
                    title={t('welcome.quickStartGuide.steps.addTrade.title')}
                    description={t('welcome.quickStartGuide.steps.addTrade.description')}
                    action={t('welcome.quickStartGuide.steps.addTrade.action')}
                    onAction={() => {
                      handleStepComplete(2);
                      handleViewTrading();
                    }}
                    icon={<TradingIcon2 />}
                    color="success"
                    isActive={activeStep === 2}
                    isCompleted={completedSteps.includes(2)}
                  />
                  <QuickStartStep
                    title={t('welcome.quickStartGuide.steps.manageAssets.title')}
                    description={t('welcome.quickStartGuide.steps.manageAssets.description')}
                    action={t('welcome.quickStartGuide.steps.manageAssets.action')}
                    onAction={() => {
                      handleStepComplete(3);
                      handleViewAssets();
                    }}
                    icon={<AssetIcon />}
                    color="warning"
                    isActive={activeStep === 3}
                    isCompleted={completedSteps.includes(3)}
                  />
                  <QuickStartStep
                    title={t('welcome.quickStartGuide.steps.viewDashboard.title')}
                    description={t('welcome.quickStartGuide.steps.viewDashboard.description')}
                    action={t('welcome.quickStartGuide.steps.viewDashboard.action')}
                    onAction={() => {
                      handleStepComplete(4);
                      handleViewDashboard();
                    }}
                    icon={<DashboardIcon />}
                    color="info"
                    isActive={activeStep === 4}
                    isCompleted={completedSteps.includes(4)}
                  />
                </Stepper>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Divider sx={{ mb: 3 }} />
          {/* System Capabilities */}
          <Box sx={{ mb: 6 }}>
            <ResponsiveTypography variant="pageTitle" sx={{ textAlign: 'center', mb: 4 }}>
              {t('welcome.capabilities.title')}
            </ResponsiveTypography>
            
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {[
                t('welcome.capabilities.realTime'),
                t('welcome.capabilities.analytics'),
                t('welcome.capabilities.multiAccount'),
                t('welcome.capabilities.mobile'),
                t('welcome.capabilities.secure'),
                t('welcome.capabilities.scalable'),
              ].map((capability, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Chip
                    label={capability}
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      width: '100%', 
                      py: 2, 
                      fontSize: '0.9rem',
                      borderRadius: 2,
                      '& .MuiChip-label': { fontWeight: 500 }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Divider sx={{ mb: 4 }} />
            <ResponsiveTypography variant="formHelper" color="text.secondary" sx={{ mb: 4 }}>
              {t('welcome.footer.message')}
            </ResponsiveTypography>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 4 }}>
              <ResponsiveButton
                variant="contained"
                size="large"
                onClick={handleGetStarted}
                startIcon={<PlayIcon />}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  },
                }}
                forceTextOnly
              >
                {t('welcome.buttons.getStarted')}
              </ResponsiveButton>
              
              <ResponsiveButton
                variant="outlined"
                size="large"
                onClick={handleViewDashboard}
                startIcon={<LanguageIcon />}
                sx={{ borderRadius: 3, px: 4, py: 1.5 }}
                forceTextOnly
              >
                {t('welcome.buttons.viewDashboard')}
              </ResponsiveButton>
            </Box>

            {/* Footer Links */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <ResponsiveButton
                variant="text"
                onClick={handleViewDashboard}
                sx={{ textTransform: 'none' }}
              >
                {t('welcome.footer.dashboard')}
              </ResponsiveButton>
              <ResponsiveButton
                variant="text"
                onClick={handleViewPortfolios}
                sx={{ textTransform: 'none' }}
              >
                {t('welcome.footer.portfolios')}
              </ResponsiveButton>
            </Box>
          </Box>
          </Box>
        </Container>
      </Box>
    </Fade>
  );
};

export default Welcome;

