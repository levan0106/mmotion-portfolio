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
  IconButton,
  Fade,
  Slide,
  alpha,
  useTheme,
  useMediaQuery,
  Divider,
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
  Close as CloseIcon,
  Language as LanguageIcon,
  Add as AddIcon,
  ShoppingCart as TradingIcon2,
  Dashboard as DashboardIcon,
  TouchApp as TouchIcon,
  AttachMoney as CashFlowIcon,
} from '@mui/icons-material';
import { ResponsiveButton } from '../components/Common';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';

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
          
          <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ mb: 2 }}>
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
  const [showWelcome, setShowWelcome] = useState(true);
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

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    navigate('/');
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
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 6, position: 'relative' }}>
            {/* <IconButton
              onClick={handleCloseWelcome}
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <CloseIcon />
            </IconButton> */}
            
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
              
              <ResponsiveTypography variant="pageSubtitle" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                {t('welcome.subtitle')}
              </ResponsiveTypography>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
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
            </Box>
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
            <Divider sx={{ mb: 3 }} />
            <ResponsiveTypography variant="formHelper" color="text.secondary">
              {t('welcome.footer.message')}
            </ResponsiveTypography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
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
        </Container>
      </Box>
    </Fade>
  );
};

export default Welcome;

