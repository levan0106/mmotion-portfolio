/**
 * Home Page - Trang chủ hiển thị tóm tắt thông tin hệ thống
 * Thu hút người dùng mới với thông tin về các tính năng và dữ liệu thị trường
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Chip,
  Avatar,
  CircularProgress,
  Button,
  alpha,
  useTheme,
  useMediaQuery,
  Grid,
  Paper,
  Fade,
  Grow,
  Slide,
  Zoom,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  AppBar,
  Toolbar,
  Typography,
  MenuItem,
  Menu,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AssetIcon,
  PieChart as FundIcon,
  ShowChart as StockIcon,
  Login as LoginIcon,
  ArrowForward as ArrowForwardIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  HowToReg as HowToRegIcon,
  Assessment as AssessmentIcon,
  AccountBalanceWallet as WalletIcon,
  Menu as MenuIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';
import { marketDataService, FundData, StockData } from '../services/api.market-data';
import { formatCurrency } from '../utils/format';
import { AssetType } from '../types/asset.types';
import { useAccount } from '../contexts/AccountContext';

interface AssetTypeInfo {
  type: AssetType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const Home: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, loading: accountLoading } = useAccount();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTabletOrLarger = useMediaQuery(theme.breakpoints.up('sm'));

  // State
  const [loading, setLoading] = useState(true);
  const [stockFunds, setStockFunds] = useState<FundData[]>([]);
  const [bondFunds, setBondFunds] = useState<FundData[]>([]);
  const [topStocks, setTopStocks] = useState<StockData[]>([]);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  
  // Menu state
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [featuresMenuAnchor, setFeaturesMenuAnchor] = useState<null | HTMLElement>(null);
  
  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };
  
  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };
  
  const handleFeaturesMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFeaturesMenuAnchor(event.currentTarget);
  };
  
  const handleFeaturesMenuClose = () => {
    setFeaturesMenuAnchor(null);
  };

  // Redirect to Dashboard if user is already authenticated
  useEffect(() => {
    if (!accountLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, accountLoading, navigate]);

  // Intersection Observer for scroll animations
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Initialize Intersection Observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { 
        threshold: 0.1, 
        rootMargin: '0px 0px -50px 0px' 
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Observe sections when loading changes or component updates
  useEffect(() => {
    if (!observerRef.current) return;

    const observeSections = () => {
      const sections = document.querySelectorAll('[data-animate-section]');
      sections.forEach((section) => {
        if (section.id && observerRef.current) {
          const alwaysVisible = section.getAttribute('data-always-visible') === 'true';
          
          if (alwaysVisible) {
            // For alwaysVisible sections, set visibility immediately without observing
            setIsVisible((prev) => ({ ...prev, [section.id]: true }));
          } else {
            // For scroll-triggered sections, observe them
            observerRef.current.observe(section);
          }
        }
      });
    };

    // Use requestAnimationFrame for better timing
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(observeSections);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        const sections = document.querySelectorAll('[data-animate-section]');
        sections.forEach((section) => {
          observerRef.current?.unobserve(section);
        });
      }
    };
  }, [loading]); // Re-observe when loading changes

  // Animation wrapper component - Always show on initial load, animate on scroll
  const AnimatedSection = ({ 
    id, 
    children, 
    delay = 0,
    direction = 'up',
    alwaysVisible = false
  }: { 
    id: string; 
    children: React.ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    alwaysVisible?: boolean;
  }) => {
    // If alwaysVisible, show immediately; otherwise check isVisible state from IntersectionObserver
    const isSectionVisible = alwaysVisible ? true : (isVisible[id] ?? false);
    
    // Transform values based on direction
    const getTransform = (visible: boolean) => {
      if (visible) return 'translateY(0)';
      switch (direction) {
        case 'up': return 'translateY(30px)';
        case 'down': return 'translateY(-30px)';
        case 'left': return 'translateX(30px)';
        case 'right': return 'translateX(-30px)';
        default: return 'translateY(30px)';
      }
    };
    
    return (
      <Box
        id={id}
        data-animate-section
        data-always-visible={alwaysVisible ? 'true' : 'false'}
        sx={{
          opacity: isSectionVisible ? 1 : 0,
          transform: getTransform(isSectionVisible),
          transition: isSectionVisible
            ? `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`
            : 'opacity 0.2s ease-out, transform 0.2s ease-out',
          visibility: isSectionVisible ? 'visible' : 'hidden',
        }}
      >
        {children}
      </Box>
    );
  };

  // Trust features
  const trustFeatures = [
    {
      title: t('home.trust.safe.title', 'An toàn tuyệt đối'),
      description: t('home.trust.safe.description', 'Tiền và tài sản được quản lý và giám sát chặt chẽ'),
      icon: <SecurityIcon />,
    },
    {
      title: t('home.trust.transparent.title', 'Minh bạch'),
      description: t('home.trust.transparent.description', 'Theo dõi và quản lý tài sản một cách minh bạch'),
      icon: <VerifiedIcon />,
    },
    {
      title: t('home.trust.professional.title', 'Chuyên nghiệp'),
      description: t('home.trust.professional.description', 'Hệ thống quản lý danh mục đầu tư chuyên nghiệp'),
      icon: <AssessmentIcon />,
    },
  ];

  // 3 Steps to start
  const stepsToStart = [
    {
      step: '1',
      title: t('home.steps.register.title', 'Đăng nhập'),
      description: t('home.steps.register.description', 'Đăng nhập vào hệ thống để bắt đầu sử dụng'),
      icon: <HowToRegIcon />,
    },
    {
      step: '2',
      title: t('home.steps.invest.title', 'Tạo mục tiêu đầu tư'),
      description: t('home.steps.invest.description', 'Tạo mục tiêu đầu tư theo mục tiêu đầu tư của bạn'),
      icon: <TrendingUpIcon />,
    },
    {
      step: '3',
      title: t('home.steps.manage.title', 'Quản lý tài sản'),
      description: t('home.steps.manage.description', 'Theo dõi tài sản thuận tiện và giao dịch dễ dàng'),
      icon: <WalletIcon />,
    },
  ];

  // Asset types supported
  const assetTypes: AssetTypeInfo[] = [
    {
      type: AssetType.STOCK,
      label: t('home.assetTypes.stock', 'Cổ phiếu'),
      icon: <StockIcon />,
      color: 'primary',
      description: t('home.assetTypes.stockDesc', 'Đầu tư vào cổ phiếu trên các sàn giao dịch'),
    },
    {
      type: AssetType.BOND,
      label: t('home.assetTypes.bond', 'Trái phiếu'),
      icon: <AssetIcon />,
      color: 'success',
      description: t('home.assetTypes.bondDesc', 'Đầu tư vào trái phiếu chính phủ và doanh nghiệp'),
    },
    {
      type: AssetType.GOLD,
      label: t('home.assetTypes.gold', 'Vàng'),
      icon: <TrendingUpIcon />,
      color: 'warning',
      description: t('home.assetTypes.goldDesc', 'Đầu tư vào vàng và kim loại quý'),
    },
    {
      type: AssetType.CRYPTO,
      label: t('home.assetTypes.crypto', 'Tiền điện tử'),
      icon: <TrendingUpIcon />,
      color: 'error',
      description: t('home.assetTypes.cryptoDesc', 'Đầu tư vào tiền điện tử và tài sản số'),
    },
    {
      type: AssetType.OTHER,
      label: t('home.assetTypes.other', 'Khác'),
      icon: <AssetIcon />,
      color: 'default',
      description: t('home.assetTypes.otherDesc', 'Các loại tài sản khác'),
    },
  ];

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [stockFundsData, bondFundsData, topStocksData] = await Promise.all([
          marketDataService.getStockFunds(5),
          marketDataService.getBondFunds(5),
          marketDataService.getTopStocks(10),
        ]);

        setStockFunds(stockFundsData.slice(0, 10)); // Limit to 10
        setBondFunds(bondFundsData.slice(0, 10)); // Limit to 10
        setTopStocks(topStocksData);
        // console.log('Market data loaded:', {
        //   stockFunds: stockFundsData.length,
        //   bondFunds: bondFundsData.length,
        //   topStocks: topStocksData.length
        // });
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPaletteColor = (color: string, variant: 'main' | 'dark' = 'main') => {
    const paletteColor = theme.palette[color as keyof typeof theme.palette];
    if (paletteColor && typeof paletteColor === 'object' && 'main' in paletteColor) {
      return variant === 'main' ? paletteColor.main : paletteColor.dark || paletteColor.main;
    }
    return variant === 'main' ? theme.palette.primary.main : theme.palette.primary.dark;
  };

  // Menu items type definition
  type MenuItemType = 
    | { label: string; path: string; action?: () => void; hasSubmenu?: false }
    | { label: string; hasSubmenu: true; items: Array<{ label: string; path: string }> };

  const menuItems: MenuItemType[] = [
    { label: t('home.menu.home', 'Trang chủ'), path: '/home', action: () => navigate('/home') },
    { 
      label: t('home.menu.features', 'Tính năng'), 
      hasSubmenu: true,
      items: [
        { label: t('home.menu.features.portfolio', 'Quản lý danh mục'), path: '#features-section' },
        { label: t('home.menu.features.tracking', 'Theo dõi hàng ngày'), path: '#features-section' },
        { label: t('home.menu.features.security', 'Bảo mật'), path: '#trust-section' },
      ]
    },
    // { label: t('home.menu.about', 'Về chúng tôi'), path: '#about', action: () => {
    //   const element = document.querySelector('#about');
    //   if (element) element.scrollIntoView({ behavior: 'smooth' });
    // }},
    { label: t('home.menu.contact', 'Liên hệ'), path: '#contact', action: () => {
      const element = document.querySelector('#contact');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }},
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
        pb: { xs: 12, md: 10 }, // Add bottom padding to prevent content from being hidden behind fixed button
      }}
    >
      {/* Header Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            sx={{
              justifyContent: 'space-between',
              px: { xs: 0, sm: 2 },
              py: { xs: 1, sm: 1.5 },
              minHeight: { xs: 56, sm: 64 },
            }}
          >
            {/* Left: Project Name + Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 3, md: 4 } }}>
              {/* Project Name */}
              <Typography
                onClick={() => navigate('/home')}
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                  transition: 'opacity 0.2s',
                }}
              >
                {t('home.projectName', 'MMO')}
              </Typography>

              {/* Desktop Menu */}
              {!isMobile && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { sm: 1, md: 2 } }}>
                  {menuItems.map((item, index) => (
                    item.hasSubmenu ? (
                      <Box key={index}>
                        <Button
                          onClick={handleFeaturesMenuOpen}
                          endIcon={<KeyboardArrowDownIcon />}
                          sx={{
                            color: 'text.primary',
                            textTransform: 'none',
                            fontSize: { sm: '0.875rem', md: '0.95rem' },
                            fontWeight: 500,
                            '&:hover': {
                              color: 'primary.main',
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                            },
                          }}
                        >
                          {item.label}
                        </Button>
                        <Menu
                          anchorEl={featuresMenuAnchor}
                          open={Boolean(featuresMenuAnchor)}
                          onClose={handleFeaturesMenuClose}
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                          }}
                          transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                          }}
                        >
                          {item.items?.map((subItem, subIndex) => (
                            <MenuItem
                              key={subIndex}
                              onClick={() => {
                                handleFeaturesMenuClose();
                                if (subItem.path.startsWith('#')) {
                                  const element = document.querySelector(subItem.path);
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth' });
                                  }
                                } else {
                                  navigate(subItem.path);
                                }
                              }}
                            >
                              {subItem.label}
                            </MenuItem>
                          ))}
                        </Menu>
                      </Box>
                    ) : (
                      <Button
                        key={index}
                        onClick={() => {
                          if (item.path?.startsWith('#')) {
                            const element = document.querySelector(item.path);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth' });
                            }
                          } else if (item.action) {
                            item.action();
                          } else if (!item.hasSubmenu && item.path) {
                            navigate(item.path);
                          }
                        }}
                        sx={{
                          color: 'text.primary',
                          textTransform: 'none',
                          fontSize: { sm: '0.875rem', md: '0.95rem' },
                          fontWeight: 500,
                          '&:hover': {
                            color: 'primary.main',
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        {item.label}
                      </Button>
                    )
                  ))}
                </Box>
              )}

              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton
                  onClick={handleMobileMenuOpen}
                  sx={{
                    color: 'text.primary',
                    ml: 1,
                  }}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </Box>

            {/* Right: Login + Register Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
              {/* <Button
                variant="outlined"
                onClick={() => navigate('/register')}
                startIcon={<PersonAddIcon />}
                sx={{
                  textTransform: 'none',
                  fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.9rem' },
                  fontWeight: 500,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                {isMobile ? t('home.register.short', 'Đăng ký') : t('home.register.full', 'Đăng ký')}
              </Button> */}
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                startIcon={<LoginIcon />}
                sx={{
                  textTransform: 'none',
                  fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.9rem' },
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                {isMobile ? t('home.login.short', 'Bắt đầu') : t('home.login.full', 'Bắt đầu ngay')}
              </Button>
            </Box>
          </Toolbar>
        </Container>

        {/* Mobile Menu */}
        <Menu
          anchorEl={mobileMenuAnchor}
          open={Boolean(mobileMenuAnchor)}
          onClose={handleMobileMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          sx={{
            mt: 1,
            '& .MuiPaper-root': {
              minWidth: 200,
              borderRadius: 2,
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
            },
          }}
        >
          {menuItems.map((item, index) => (
            item.hasSubmenu ? (
              <Box key={index}>
                <MenuItem
                  onClick={handleFeaturesMenuOpen}
                  sx={{
                    fontSize: '0.95rem',
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                  <KeyboardArrowDownIcon sx={{ ml: 'auto' }} />
                </MenuItem>
                <Menu
                  anchorEl={featuresMenuAnchor}
                  open={Boolean(featuresMenuAnchor)}
                  onClose={() => {
                    handleFeaturesMenuClose();
                    handleMobileMenuClose();
                  }}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  {item.items?.map((subItem, subIndex) => (
                    <MenuItem
                      key={subIndex}
                      onClick={() => {
                        handleFeaturesMenuClose();
                        handleMobileMenuClose();
                        if (subItem.path.startsWith('#')) {
                          const element = document.querySelector(subItem.path);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        } else {
                          navigate(subItem.path);
                        }
                      }}
                    >
                      {subItem.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            ) : (
              <MenuItem
                key={index}
                onClick={() => {
                  handleMobileMenuClose();
                  if (item.path?.startsWith('#')) {
                    const element = document.querySelector(item.path);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  } else if (item.action) {
                    item.action();
                  } else if (!item.hasSubmenu && item.path) {
                    navigate(item.path);
                  }
                }}
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
              >
                {item.label}
              </MenuItem>
            )
          ))}
        </Menu>
      </AppBar>

      <Container maxWidth="lg">
        {/* Header Section */}
        <Fade in timeout={800}>
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            {/* <ResponsiveTypography
              variant="pageTitle"
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                animation: 'fadeInUp 0.8s ease-out',
                '@keyframes fadeInUp': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(20px)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              {t('home.title', 'Hệ Thống Quản Lý Danh Mục Đầu Tư')}
            </ResponsiveTypography> */}
            {/* <ResponsiveTypography 
              variant="pageSubtitle" 
              sx={{ 
                mb: 4, 
                maxWidth: 600, 
                mx: 'auto',
                animation: 'fadeInUp 0.8s ease-out 0.2s both',
                '@keyframes fadeInUp': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(20px)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }} 
              ellipsis={false}
            >
              {t('home.subtitle', 'Theo dõi và quản lý danh mục đầu tư của bạn một cách chuyên nghiệp')}
            </ResponsiveTypography> */}
          </Box>
        </Fade>

        {/* Special CTA Section - "Biến mục tiêu của bạn thành hiện thực" */}
        <Zoom in timeout={1000}>
          <Box
            sx={{
            mb: { xs: 4, md: 6 },
            mt: { xs: 3, md: 4 },
            position: 'relative',
            overflow: 'hidden',
            borderRadius: { xs: 2, md: 3 },
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(theme.palette.common.white, 0.1)} 0%, transparent 70%)`,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(theme.palette.common.white, 0.08)} 0%, transparent 70%)`,
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              p: { xs: 3, md: 5 },
              textAlign: 'center',
              color: 'white',
            }}
          >
            <ResponsiveTypography
              variant="pageTitle"
              sx={{
                fontWeight: 700,
                mb: { xs: 2, md: 3 },
                fontSize: { xs: '1.5rem', md: '2.25rem' },
                color: 'white',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                background: 'none',
                backgroundClip: 'unset',
                WebkitBackgroundClip: 'unset',
                WebkitTextFillColor: 'white',
              }}
              ellipsis={false}
            >
              {t('home.vision.title', 'Biến mục tiêu của bạn thành hiện thực')}
            </ResponsiveTypography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: { xs: 1, sm: 2, md: 4 },
                mt: { xs: 2, md: 3 },
                flexWrap: 'nowrap',
                width: '100%',
              }}
            >
              {/* Feature 1: Quản lý dễ dàng */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 0.75, sm: 1.5 },
                  px: { xs: 1, sm: 2, md: 3 },
                  py: { xs: 0.75, sm: 1.5, md: 2 },
                  background: alpha(theme.palette.common.white, 0.15),
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
                  transition: 'all 0.3s ease-in-out',
                  flex: { xs: '1 1 0', sm: '0 0 auto' },
                  minWidth: 0,
                  maxWidth: { xs: '50%', sm: 'none' },
                  overflow: 'hidden',
                  '&:hover': {
                    background: alpha(theme.palette.common.white, 0.25),
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.2)}`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 28, sm: 40, md: 48 },
                    height: { xs: 28, sm: 40, md: 48 },
                    borderRadius: '50%',
                    background: alpha(theme.palette.common.white, 0.2),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: { xs: '0.9rem', sm: '1.2rem', md: '1.5rem' },
                    flexShrink: 0,
                    border: `2px solid ${alpha(theme.palette.common.white, 0.4)}`,
                  }}
                >
                  ✨
                </Box>
                <ResponsiveTypography
                  variant="cardTitle"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '0.75rem', sm: '1rem', md: '1.2rem' },
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t('home.vision.easyManagement', 'Quản lý dễ dàng')}
                </ResponsiveTypography>
              </Box>

              {/* Feature 2: Hoàn toàn miễn phí */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 0.75, sm: 1.5 },
                  px: { xs: 1, sm: 2, md: 3 },
                  py: { xs: 0.75, sm: 1.5, md: 2 },
                  background: alpha(theme.palette.common.white, 0.15),
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
                  transition: 'all 0.3s ease-in-out',
                  flex: { xs: '1 1 0', sm: '0 0 auto' },
                  minWidth: 0,
                  maxWidth: { xs: '50%', sm: 'none' },
                  overflow: 'hidden',
                  '&:hover': {
                    background: alpha(theme.palette.common.white, 0.25),
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.2)}`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 28, sm: 40, md: 48 },
                    height: { xs: 28, sm: 40, md: 48 },
                    borderRadius: '50%',
                    background: alpha(theme.palette.common.white, 0.2),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: { xs: '0.9rem', sm: '1.2rem', md: '1.5rem' },
                    flexShrink: 0,
                    border: `2px solid ${alpha(theme.palette.common.white, 0.4)}`,
                  }}
                >
                  🎁
                </Box>
                <ResponsiveTypography
                  variant="cardTitle"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '0.75rem', sm: '1rem', md: '1.2rem' },
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t('home.vision.free', 'Hoàn toàn miễn phí')}
                </ResponsiveTypography>
              </Box>
            </Box>
          </Box>
          </Box>
        </Zoom>

        {/* Features Section */}
        <AnimatedSection id="features-section" delay={0.2} alwaysVisible={true}>
          <Box sx={{ mb: { xs: 5, md: 6 } }}>
            <Box sx={{ mb: { xs: 2, md: 3 }, textAlign: 'center' }}>
              <ResponsiveTypography
                variant="cardTitle"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  mb: 1,
                }}
              >
                {t('home.features.title', 'Tính năng nổi bật')}
              </ResponsiveTypography>
              <ResponsiveTypography
                variant="cardLabel"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.85rem', md: '0.95rem' },
                }}
              >
                {t('home.features.subtitle', 'Công cụ mạnh mẽ cho quản lý đầu tư hiệu quả')}
              </ResponsiveTypography>
            </Box>
            <Grid container spacing={2}>
              {/* Feature 1: Multi-Account Management */}
              <Grid item xs={12} sm={6} md={3}>
                <Grow
                  in={isVisible['features-section'] || false}
                  timeout={500}
                  style={{ transitionDelay: '0ms' }}
                >
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 1.5, 
                      borderLeft: '3px solid', 
                      borderLeftColor: 'primary.main', 
                      height: '100%',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                      },
                    }}
                  >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    👥
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <ResponsiveTypography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 0.5 }}>
                      Quản lý đa tài khoản
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="caption" color="text.primary" sx={{ fontSize: '0.65rem' }} ellipsis={false}>
                      Tạo và quản lý nhiều tài khoản khách hàng
                    </ResponsiveTypography>
                  </Box>
                </Box>
                </Paper>
                </Grow>
              </Grid>

              {/* Feature 2: Portfolio Management */}
              <Grid item xs={12} sm={6} md={3}>
                <Grow
                  in={isVisible['features-section'] || false}
                  timeout={500}
                  style={{ transitionDelay: '100ms' }}
                >
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 1.5, 
                      borderLeft: '3px solid', 
                      borderLeftColor: 'success.main', 
                      height: '100%',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                      },
                    }}
                  >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    bgcolor: 'success.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    📊
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <ResponsiveTypography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 600, mb: 0.5 }}>
                      Quản lý đa danh mục
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="caption" color="text.primary" sx={{ fontSize: '0.65rem' }} ellipsis={false}>
                      Tạo đa danh mục theo mục tiêu đầu tư
                    </ResponsiveTypography>
                  </Box>
                </Box>
                </Paper>
                </Grow>
              </Grid>

              {/* Feature 3: Daily Tracking */}
              <Grid item xs={12} sm={6} md={3}>
                <Grow
                  in={isVisible['features-section'] || false}
                  timeout={500}
                  style={{ transitionDelay: '200ms' }}
                >
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 1.5, 
                      borderLeft: '3px solid', 
                      borderLeftColor: 'warning.main', 
                      height: '100%',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                      },
                    }}
                  >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    bgcolor: 'warning.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    ⚡
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <ResponsiveTypography variant="subtitle2" sx={{ color: 'warning.main', fontWeight: 600, mb: 0.5 }}>
                      Theo dõi hiệu suất đầu tư
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="caption" color="text.primary" sx={{ fontSize: '0.65rem' }} ellipsis={false}>
                      Cập nhật dữ liệu và hiệu suất hàng ngày
                    </ResponsiveTypography>
                  </Box>
                </Box>
                </Paper>
                </Grow>
              </Grid>

              {/* Feature 4: Secure Sharing */}
              <Grid item xs={12} sm={6} md={3}>
                <Grow
                  in={isVisible['features-section'] || false}
                  timeout={500}
                  style={{ transitionDelay: '300ms' }}
                >
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 1.5, 
                      borderLeft: '3px solid', 
                      borderLeftColor: 'info.main', 
                      height: '100%',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                      },
                    }}
                  >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    bgcolor: 'info.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    🔒
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <ResponsiveTypography variant="subtitle2" sx={{ color: 'info.main', fontWeight: 600, mb: 0.5 }}>
                      Chia sẻ danh mục đầu tư
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="caption" color="text.primary" sx={{ fontSize: '0.65rem' }} ellipsis={false}>
                      Chia sẻ dữ liệu với quyền truy cập linh hoạt
                    </ResponsiveTypography>
                  </Box>
                </Box>
                </Paper>
                </Grow>
              </Grid>
            </Grid>
          </Box>
        </AnimatedSection>

        
        {/* Trust & Safety Section - Move before market data */}
        <AnimatedSection id="trust-section" delay={0.1}>
            <Box
            sx={{
                mb: { xs: 5, md: 6 },
                py: { xs: 4, md: 5 },
                px: { xs: 2, md: 4 },
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
            >
            <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
                <ResponsiveTypography
                variant="cardTitle"
                sx={{
                    fontWeight: 600,
                    mb: 1,
                    fontSize: { xs: '1.2rem', sm: '1.5rem' },
                }}
                >
                {t('home.trust.title', 'Đầu tư an toàn và minh bạch')}
                </ResponsiveTypography>
                <ResponsiveTypography
                variant="cardLabel"
                color="text.secondary"
                sx={{
                    maxWidth: 700,
                    mx: 'auto',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                }}
                ellipsis={false}
                >
                {t('home.trust.subtitle', 'Hệ thống quản lý danh mục đầu tư chuyên nghiệp với độ bảo mật cao')}
                </ResponsiveTypography>
            </Box>

            <Box
                sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: { xs: 2, md: 3 },
                }}
            >
                {trustFeatures.map((feature, index) => (
                <Grow
                    key={index}
                    in={isVisible['trust-section'] || false}
                    timeout={600}
                    style={{ transitionDelay: `${index * 100}ms` }}
                >
                    <Card
                    sx={{
                        p: { xs: 2, sm: 3 },
                        textAlign: 'center',
                        background: theme.palette.background.paper,
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        borderRadius: 2,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                        },
                    }}
                    >
                    <Avatar
                        sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        width: { xs: 56, sm: 64 },
                        height: { xs: 56, md: 64 },
                        mx: 'auto',
                        mb: 2,
                        }}
                    >
                        {feature.icon}
                    </Avatar>
                    <ResponsiveTypography
                        variant="cardTitle"
                        sx={{
                        fontWeight: 600,
                        mb: 1,
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        }}
                    >
                        {feature.title}
                    </ResponsiveTypography>
                    <ResponsiveTypography
                        variant="cardLabel"
                        color="text.secondary"
                        sx={{
                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        lineHeight: 1.6,
                        }}
                        ellipsis={false}
                    >
                        {feature.description}
                    </ResponsiveTypography>
                    </Card>
                </Grow>
                ))}
            </Box>
            </Box>
        </AnimatedSection>

        {/* Asset Types Section */}
        <AnimatedSection id="asset-types-section" delay={0.1} alwaysVisible={true}>
            <Box sx={{ mb: { xs: 5, md: 6 } }}>
            <Box sx={{ mb: { xs: 2, md: 3 }, textAlign: 'center' }}>
                <ResponsiveTypography
                variant="cardTitle"
                sx={{
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', sm: '1.3rem' },
                    mb: 0.5,
                }}
                >
                {t('home.sections.assetTypes.title', 'Các Loại Tài Sản Đang Hỗ Trợ')}
                </ResponsiveTypography>
                <ResponsiveTypography
                variant="cardLabel"
                color="text.secondary"
                sx={{
                    fontSize: { xs: '0.85rem', sm: '0.95rem' },
                }}
                >
                {t('home.sections.assetTypes.subtitle', 'Đa dạng các loại tài sản để đa dạng hóa danh mục đầu tư')}
                </ResponsiveTypography>
            </Box>

            {/* Horizontal Scrollable Container */}
            <Box
            sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                overflowY: 'hidden',
                pb: 1,
                scrollbarWidth: 'thin',
                scrollbarColor: `${alpha(theme.palette.primary.main, 0.3)} transparent`,
                '&::-webkit-scrollbar': {
                height: 8,
                },
                '&::-webkit-scrollbar-track': {
                background: alpha(theme.palette.grey[300], 0.1),
                borderRadius: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                background: alpha(theme.palette.primary.main, 0.3),
                borderRadius: 4,
                '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.5),
                },
                },
                // Smooth scrolling
                scrollBehavior: 'smooth',
                // Hide scrollbar on mobile but keep functionality
                [theme.breakpoints.down('sm')]: {
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                    display: 'none',
                },
                msOverflowStyle: 'none',
                },
            }}
            >
            {assetTypes.map((assetType, index) => {
                const shouldShow = isVisible['asset-types-section'];
                return (
                <Zoom
                    key={assetType.type}
                    in={shouldShow}
                    timeout={400}
                    style={{ transitionDelay: shouldShow ? `${index * 50}ms` : '0ms' }}
                >
                <Card
                    sx={{
                    minWidth: isMobile ? 150 : 200,
                    maxWidth: isMobile ? 150 : 200,
                    height: '100%',
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${alpha(getPaletteColor(assetType.color), 0.05)} 0%, ${alpha(getPaletteColor(assetType.color), 0.02)} 100%)`,
                    border: `1px solid ${alpha(getPaletteColor(assetType.color), 0.1)}`,
                    borderRadius: 2,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${alpha(getPaletteColor(assetType.color), 0.15)}`,
                    },
                    }}
                >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Avatar
                    sx={{
                        bgcolor: getPaletteColor(assetType.color),
                        width: 56,
                        height: 56,
                        mx: 'auto',
                        mb: 2,
                    }}
                    >
                    {assetType.icon}
                    </Avatar>
                    <ResponsiveTypography variant="cardTitle">
                    {assetType.label}
                    </ResponsiveTypography>
                    {/* <ResponsiveTypography variant="cardLabel" color="text.secondary" 
                            ellipsis={false}>
                    {assetType.description}
                    </ResponsiveTypography> */}
                </CardContent>
                </Card>
                </Zoom>
                );
            })}
            </Box>
        </Box>
        </AnimatedSection>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Stock Funds Section */}
            <AnimatedSection id="stock-funds-section" delay={0.1} alwaysVisible={!loading}>
              <Box sx={{ mb: { xs: 5, md: 6 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 3 } }}>
                  <FundIcon sx={{ mr: 2, color: 'primary.main', fontSize: { xs: 28, md: 32 } }} />
                  <Box>
                    <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                      {t('home.sections.stockFunds.title', 'Danh Sách Chứng Chỉ Quỹ Cổ Phiếu')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' }, mt: 0.5 }}>
                      {t('home.sections.stockFunds.subtitle', 'Các quỹ đầu tư vào cổ phiếu với hiệu suất tốt nhất')}
                    </ResponsiveTypography>
                  </Box>
                </Box>

              {stockFunds.length > 0 ? (
                <>
                  {/* Mobile: Card Layout */}
                  <Box
                    sx={{
                      display: { xs: 'flex', sm: 'none' },
                      gap: 1.5,
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      pb: 1,
                      scrollbarWidth: 'thin',
                      scrollbarColor: `${alpha(theme.palette.primary.main, 0.3)} transparent`,
                      '&::-webkit-scrollbar': {
                        height: 8,
                      },
                      '&::-webkit-scrollbar-track': {
                        background: alpha(theme.palette.grey[300], 0.1),
                        borderRadius: 4,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: alpha(theme.palette.primary.main, 0.3),
                        borderRadius: 4,
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.5),
                        },
                      },
                      scrollBehavior: 'smooth',
                      [theme.breakpoints.down('sm')]: {
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': {
                          display: 'none',
                        },
                        msOverflowStyle: 'none',
                      },
                    }}
                  >
                    {stockFunds.map((fund, index) => {
                      const borderColor = alpha(theme.palette.primary.main, 0.15 + (index % 3) * 0.05);
                      const isPositive = (fund.changePercent ?? 0) >= 0;
                      const shouldShow = isVisible['stock-funds-section'] || !loading;
                      
                      return (
                        <Slide
                          key={index}
                          direction="up"
                          in={shouldShow}
                          timeout={400}
                          style={{ transitionDelay: shouldShow ? `${index * 80}ms` : '0ms' }}
                        >
                          <Card
                            sx={{
                              minWidth: 160,
                              maxWidth: 160,
                              flexShrink: 0,
                              borderRadius: 2,
                              border: `1.5px solid ${borderColor}`,
                              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                              transition: 'all 0.2s ease-in-out',
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '3px',
                                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                              },
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
                                borderColor: alpha(theme.palette.primary.main, 0.4),
                              },
                            }}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ mb: 1.5 }}>
                                <ResponsiveTypography 
                                  variant="cardTitle" 
                                  sx={{ 
                                    fontSize: '0.85rem!important', 
                                  }}
                                >
                                  {fund.symbol}
                                </ResponsiveTypography>
                                {fund.name && (
                                  <ResponsiveTypography 
                                    variant="cardLabel" 
                                    color="text.secondary" 
                                    sx={{ 
                                      fontSize: '0.6rem!important'
                                    }}
                                  >
                                    {fund.name}
                                  </ResponsiveTypography>
                                )}
                              </Box>
                              <Box>
                                <ResponsiveTypography 
                                  variant="formHelper" 
                                  color="text.secondary" 
                                  sx={{ 
                                    fontSize: '0.65rem!important',
                                    mb: 0.5,
                                    textTransform: 'none',
                                  }}
                                >
                                  {t('home.table.price', 'Giá NAV')}
                                </ResponsiveTypography>
                                <ResponsiveTypography 
                                  variant="cardValue" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    fontSize: '0.8rem!important',
                                    color: isPositive ? theme.palette.primary.main : theme.palette.error.main,
                                    textTransform: 'none',
                                  }}
                                >
                                  {formatCurrency(fund.buyPrice || fund.sellPrice || 0, 'VND')}
                                </ResponsiveTypography>
                              </Box>
                              {fund.changePercent !== undefined && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                                  <Chip
                                    label={`${fund.changePercent >= 0 ? '+' : ''}${fund.changePercent.toFixed(2)}%`}
                                    size="small"
                                    color={fund.changePercent >= 0 ? 'success' : 'error'}
                                    sx={{ 
                                      fontWeight: 600, 
                                      height: 20, 
                                      fontSize: '0.7rem!important', 
                                      textTransform: 'none',
                                      background: fund.changePercent >= 0 
                                        ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                                        : `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                                      color: 'white',
                                      '& .MuiChip-label': { 
                                        padding: '0 6px',
                                        textTransform: 'none',
                                      },
                                    }}
                                  />
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Slide>
                      );
                    })}
                  </Box>

                  {/* Desktop/Tablet: Table Layout */}
                  <TableContainer
                    component={Paper}
                    sx={{
                      display: { xs: 'none', sm: 'block' },
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.08)}`,
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow
                          sx={{
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {t('home.table.symbol', 'Mã')}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {t('home.table.name', 'Tên')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {t('home.table.price', 'Giá NAV')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {t('home.table.change', 'Thay đổi')}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stockFunds.map((fund, index) => {
                          const isPositive = (fund.changePercent ?? 0) >= 0;
                          return (
                            <TableRow
                              key={index}
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                },
                                transition: 'background-color 0.2s ease-in-out',
                              }}
                            >
                              <TableCell>
                                <ResponsiveTypography
                                  variant="tableCell"
                                  sx={{
                                    fontWeight: 600,
                                  }}
                                >
                                {fund.symbol}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell sx={{ maxWidth: 300 }}>
                                <ResponsiveTypography
                                  variant="tableCell"
                                >
                                  {fund.name || '-'}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  color: isPositive ? theme.palette.primary.main : theme.palette.error.main,
                                }}
                              >
                                {formatCurrency(fund.buyPrice || fund.sellPrice || 0, 'VND')}
                              </TableCell>
                              <TableCell align="right">
                                {fund.changePercent !== undefined ? (
                                  <Chip
                                    label={`${fund.changePercent >= 0 ? '+' : ''}${fund.changePercent.toFixed(2)}%`}
                                    size="small"
                                    color={fund.changePercent >= 0 ? 'success' : 'error'}
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: '0.75rem',
                                      textTransform: 'none',
                                      background: fund.changePercent >= 0
                                        ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                                        : `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                                      color: 'white',
                                    }}
                                  />
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ResponsiveTypography variant="cardLabel" color="text.secondary">
                    {t('home.noData', 'Không có dữ liệu')}
                  </ResponsiveTypography>
                </Box>
              )}
              </Box>
            </AnimatedSection>

            {/* Bond Funds Section */}
            <AnimatedSection id="bond-funds-section" delay={0.1} alwaysVisible={true}>
              <Box sx={{ mb: { xs: 5, md: 6 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 3 } }}>
                  <FundIcon sx={{ mr: 2, color: 'success.main', fontSize: { xs: 28, md: 32 } }} />
                  <Box>
                    <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                      {t('home.sections.bondFunds.title', 'Danh Sách Chứng Chỉ Quỹ Trái Phiếu')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' }, mt: 0.5 }}>
                      {t('home.sections.bondFunds.subtitle', 'Các quỹ đầu tư vào trái phiếu an toàn và ổn định')}
                    </ResponsiveTypography>
                  </Box>
                </Box>

              {bondFunds.length > 0 ? (
                <>
                  {/* Mobile: Card Layout */}
                  <Box
                    sx={{
                      display: { xs: 'flex', sm: 'none' },
                      gap: 1.5,
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      pb: 1,
                      scrollbarWidth: 'thin',
                      scrollbarColor: `${alpha(theme.palette.success.main, 0.3)} transparent`,
                      '&::-webkit-scrollbar': {
                        height: 8,
                      },
                      '&::-webkit-scrollbar-track': {
                        background: alpha(theme.palette.grey[300], 0.1),
                        borderRadius: 4,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: alpha(theme.palette.success.main, 0.3),
                        borderRadius: 4,
                        '&:hover': {
                          background: alpha(theme.palette.success.main, 0.5),
                        },
                      },
                      scrollBehavior: 'smooth',
                      [theme.breakpoints.down('sm')]: {
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': {
                          display: 'none',
                        },
                        msOverflowStyle: 'none',
                      },
                    }}
                  >
                    {bondFunds.map((fund, index) => {
                      const borderColor = alpha(theme.palette.success.main, 0.15 + (index % 3) * 0.05);
                      const isPositive = (fund.changePercent ?? 0) >= 0;
                      const shouldShow = isVisible['bond-funds-section'] || !loading;
                      
                      return (
                        <Slide
                          key={index}
                          direction="up"
                          in={shouldShow}
                          timeout={400}
                          style={{ transitionDelay: shouldShow ? `${index * 80}ms` : '0ms' }}
                        >
                          <Card
                            sx={{
                              minWidth: 160,
                              maxWidth: 160,
                              flexShrink: 0,
                              borderRadius: 2,
                              border: `1.5px solid ${borderColor}`,
                              boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.15)}`,
                              transition: 'all 0.2s ease-in-out',
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '3px',
                                background: `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                              },
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 6px 20px ${alpha(theme.palette.success.main, 0.25)}`,
                                borderColor: alpha(theme.palette.success.main, 0.4),
                              },
                            }}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ mb: 1.5 }}>
                                <ResponsiveTypography 
                                  variant="cardTitle" 
                                  sx={{ 
                                    fontSize: '0.85rem!important', 
                                  }}
                                >
                                  {fund.symbol}
                                </ResponsiveTypography>
                                {fund.name && (
                                  <ResponsiveTypography 
                                    variant="cardLabel" 
                                    color="text.secondary" 
                                    sx={{ 
                                      fontSize: '0.6rem!important',
                                      textTransform: 'none',
                                    }}
                                  >
                                    {fund.name}
                                  </ResponsiveTypography>
                                )}
                              </Box>
                              <Box>
                                <ResponsiveTypography 
                                  variant="formHelper" 
                                  color="text.secondary" 
                                  sx={{ 
                                    fontSize: '0.65rem!important',
                                    mb: 0.5,
                                    textTransform: 'none',
                                  }}
                                >
                                  {t('home.table.price', 'Giá NAV')}
                                </ResponsiveTypography>
                                <ResponsiveTypography 
                                  variant="cardValue" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    fontSize: '0.8rem!important',
                                    color: isPositive ? theme.palette.success.main : theme.palette.error.main,
                                    textTransform: 'none',
                                  }}
                                >
                                  {formatCurrency(fund.buyPrice || fund.sellPrice || 0, 'VND')}
                                </ResponsiveTypography>
                              </Box>
                              {fund.changePercent !== undefined && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                                  <Chip
                                    label={`${fund.changePercent >= 0 ? '+' : ''}${fund.changePercent.toFixed(2)}%`}
                                    size="small"
                                    color={fund.changePercent >= 0 ? 'success' : 'error'}
                                    sx={{ 
                                      fontWeight: 600, 
                                      height: 20, 
                                      fontSize: '0.7rem!important', 
                                      textTransform: 'none',
                                      background: fund.changePercent >= 0 
                                        ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                                        : `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                                      color: 'white',
                                      '& .MuiChip-label': { 
                                        padding: '0 6px',
                                        textTransform: 'none',
                                      },
                                    }}
                                  />
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Slide>
                      );
                    })}
                  </Box>

                  {/* Desktop/Tablet: Table Layout */}
                  <TableContainer
                    component={Paper}
                    sx={{
                      display: { xs: 'none', sm: 'block' },
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.08)}`,
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow
                          sx={{
                            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {t('home.table.symbol', 'Mã')}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {t('home.table.name', 'Tên')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {t('home.table.price', 'Giá NAV')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {t('home.table.change', 'Thay đổi')}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bondFunds.map((fund, index) => {
                          const isPositive = (fund.changePercent ?? 0) >= 0;
                          return (
                            <TableRow
                              key={index}
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.success.main, 0.04),
                                },
                                transition: 'background-color 0.2s ease-in-out',
                              }}
                            >
                              <TableCell>
                                <ResponsiveTypography
                                  variant="tableCell"
                                  sx={{
                                    fontWeight: 600,
                                  }}
                                >
                                {fund.symbol}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell sx={{ maxWidth: 300 }}>
                                <ResponsiveTypography
                                  variant="tableCell"
                                  
                                >
                                  {fund.name || '-'}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  color: isPositive ? theme.palette.success.main : theme.palette.error.main,
                                }}
                              >
                                {formatCurrency(fund.buyPrice || fund.sellPrice || 0, 'VND')}
                              </TableCell>
                              <TableCell align="right">
                                {fund.changePercent !== undefined ? (
                                  <Chip
                                    label={`${fund.changePercent >= 0 ? '+' : ''}${fund.changePercent.toFixed(2)}%`}
                                    size="small"
                                    color={fund.changePercent >= 0 ? 'success' : 'error'}
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: '0.75rem',
                                      textTransform: 'none',
                                      background: fund.changePercent >= 0
                                        ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                                        : `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                                      color: 'white',
                                    }}
                                  />
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ResponsiveTypography variant="cardLabel" color="text.secondary">
                    {t('home.noData', 'Không có dữ liệu')}
                  </ResponsiveTypography>
                </Box>
              )}
              </Box>
            </AnimatedSection>

            {/* Top Stocks Section */}
            <AnimatedSection id="top-stocks-section" delay={0.1} alwaysVisible={!loading}>
              <Box sx={{ mb: { xs: 5, md: 6 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 3 } }}>
                  <StockIcon sx={{ mr: 2, color: 'info.main', fontSize: { xs: 28, md: 32 } }} />
                  <Box>
                    <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                      {t('home.sections.topStocks.title', 'Top Cổ Phiếu')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' }, mt: 0.5 }}>
                      {t('home.sections.topStocks.subtitle', 'Những cổ phiếu có khối lượng giao dịch và biến động giá cao nhất')}
                    </ResponsiveTypography>
                  </Box>
                </Box>

              {topStocks.length > 0 ? (
                <>
                  {/* Mobile: Card Layout */}
                  <Box
                    sx={{
                      display: { xs: 'flex', sm: 'none' },
                      gap: 1.5,
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      pb: 1,
                      scrollbarWidth: 'thin',
                      scrollbarColor: `${alpha(theme.palette.info.main, 0.3)} transparent`,
                      '&::-webkit-scrollbar': {
                        height: 8,
                      },
                      '&::-webkit-scrollbar-track': {
                        background: alpha(theme.palette.grey[300], 0.1),
                        borderRadius: 4,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: alpha(theme.palette.info.main, 0.3),
                        borderRadius: 4,
                        '&:hover': {
                          background: alpha(theme.palette.info.main, 0.5),
                        },
                      },
                      scrollBehavior: 'smooth',
                      [theme.breakpoints.down('sm')]: {
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': {
                          display: 'none',
                        },
                        msOverflowStyle: 'none',
                      },
                    }}
                  >
                    {topStocks.map((stock, index) => {
                      const borderColor = alpha(theme.palette.info.main, 0.15 + (index % 3) * 0.05);
                      const isPositive = (stock.changePercent ?? 0) >= 0;
                      const rankColors = [
                        theme.palette.warning.main,
                        theme.palette.info.main,
                        theme.palette.secondary.main,
                      ];
                      const rankColor = rankColors[index % rankColors.length] || theme.palette.info.main;
                      const shouldShow = isVisible['top-stocks-section'] || !loading;
                      
                      return (
                        <Slide
                          key={index}
                          direction="up"
                          in={shouldShow}
                          timeout={400}
                          style={{ transitionDelay: shouldShow ? `${index * 100}ms` : '0ms' }}
                        >
                          <Card
                            sx={{
                              minWidth: isMobile ? 160 : 200,
                              maxWidth: isMobile ? 160 : 200,
                              flexShrink: 0,
                              borderRadius: 2,
                              border: `1.5px solid ${borderColor}`,
                              boxShadow: `0 2px 8px ${alpha(rankColor, 0.15)}`,
                              transition: 'all 0.2s ease-in-out',
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '3px',
                                background: `linear-gradient(90deg, ${rankColor} 0%, ${alpha(rankColor, 0.6)} 100%)`,
                              },
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 6px 20px ${alpha(rankColor, 0.25)}`,
                                borderColor: alpha(rankColor, 0.4),
                              },
                            }}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <ResponsiveTypography 
                                  variant="cardTitle" 
                                  sx={{ 
                                    fontSize: '0.85rem!important', 
                                  }}
                                >
                                  {stock.symbol}
                                </ResponsiveTypography>
                                {stock.exchange && (
                                  <Chip
                                    label={stock.exchange}
                                    size="small"
                                    variant="outlined"
                                    sx={{ 
                                      fontSize: '0.65rem!important', 
                                      height: 18, 
                                      textTransform: 'none',
                                      borderColor: alpha(rankColor, 0.5),
                                      color: rankColor,
                                      '& .MuiChip-label': { 
                                        padding: '0 5px',
                                        textTransform: 'none',
                                      },
                                    }}
                                  />
                                )}
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                                <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                                  <ResponsiveTypography 
                                    variant="formHelper" 
                                    color="text.secondary"
                                    sx={{ 
                                      fontSize: '0.65rem!important',
                                      mb: 0.5,
                                      textTransform: 'none',
                                    }}
                                  >
                                    {t('home.table.price', 'Giá')}
                                  </ResponsiveTypography>
                                  <ResponsiveTypography 
                                    variant="cardValue" 
                                    sx={{ 
                                      fontWeight: 600, 
                                      fontSize: '0.8rem!important',
                                      color: isPositive ? rankColor : theme.palette.error.main,
                                      textTransform: 'none',
                                    }}
                                  >
                                    {formatCurrency(stock.buyPrice || stock.sellPrice || 0, 'VND')}
                                  </ResponsiveTypography>
                                </Box>
                                {stock.changePercent !== undefined && (
                                  <Box sx={{ display: 'flex', alignItems: 'flex-end', flexShrink: 0 }}>
                                    <Chip
                                      label={`${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`}
                                      size="small"
                                      color={stock.changePercent >= 0 ? 'success' : 'error'}
                                      sx={{ 
                                        fontWeight: 600, 
                                        height: 20, 
                                        fontSize: '0.7rem!important', 
                                        textTransform: 'none',
                                        background: stock.changePercent >= 0 
                                          ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                                          : `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                                        color: 'white',
                                        '& .MuiChip-label': { 
                                          padding: '0 6px',
                                          textTransform: 'none',
                                        },
                                      }}
                                    />
                                  </Box>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Slide>
                      );
                    })}
                  </Box>

                  {/* Desktop/Tablet: Table Layout */}
                  <TableContainer
                    component={Paper}
                    sx={{
                      display: { xs: 'none', sm: 'block' },
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.08)}`,
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {t('home.table.symbol', 'Mã')}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {t('home.table.name', 'Tên')}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {t('home.table.exchange', 'Sàn')}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {t('home.table.price', 'Giá')}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {t('home.table.change', 'Thay đổi')}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topStocks.map((stock, index) => {
                          const isPositive = (stock.changePercent ?? 0) >= 0;
                          const rankColors = [
                            theme.palette.warning.main,
                            theme.palette.info.main,
                            theme.palette.secondary.main,
                          ];
                          const rankColor = rankColors[index % rankColors.length] || theme.palette.info.main;
                          
                          return (
                            <TableRow
                              key={index}
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.info.main, 0.04),
                                },
                                transition: 'background-color 0.2s ease-in-out',
                              }}
                            >
                              <TableCell>
                                <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 600 }}>
                                  {stock.symbol}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                <ResponsiveTypography variant="cardLabel" color="text.secondary">
                                  {stock.name || stock.symbol}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                {stock.exchange ? (
                                  <Chip
                                    label={stock.exchange}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      fontSize: '0.75rem',
                                      textTransform: 'none',
                                      borderColor: alpha(rankColor, 0.3),
                                    //   color: rankColor,
                                    }}
                                  />
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell>
                                <ResponsiveTypography
                                  variant="tableCell"
                                  sx={{
                                    fontSize: '0.875rem',
                                  fontWeight: 600,
                                    color: isPositive ? theme.palette.success.main : theme.palette.error.main,
                                  }}
                                >
                                  {formatCurrency(stock.buyPrice || stock.sellPrice || 0, 'VND')}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                {stock.changePercent !== undefined ? (
                                  <Chip
                                    label={`${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`}
                                    size="small"
                                    color={stock.changePercent >= 0 ? 'success' : 'error'}
                                    sx={{
                                      textTransform: 'none',
                                      background: stock.changePercent >= 0
                                        ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                                        : `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                                      color: 'white',
                                      '& .MuiChip-label': {
                                        textTransform: 'none',
                                      },
                                    }}
                                  />
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ResponsiveTypography variant="cardLabel" color="text.secondary">
                    {t('home.noData', 'Không có dữ liệu')}
                  </ResponsiveTypography>
                </Box>
              )}
              </Box>
            </AnimatedSection>

            </>
        )}
            {/* 3 Steps to Start Section */}
            <AnimatedSection id="steps-section" delay={0.1} alwaysVisible={true}>
              <Box
                sx={{
                  mb: { xs: 5, md: 6 },
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Background with gradient and decorative elements */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 50%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                    borderRadius: { xs: 2, md: 4 },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -100,
                      right: -100,
                      width: 300,
                      height: 300,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`,
                      zIndex: 0,
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -80,
                      left: -80,
                      width: 250,
                      height: 250,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.06)} 0%, transparent 70%)`,
                      zIndex: 0,
                    },
                  }}
                />
                
                <Box sx={{ position: 'relative', zIndex: 1, py: { xs: 5, md: 7 }, px: { xs: 2, md: 4 } }}>
                  {/* Header */}
                  <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 2,
                        py: 0.5,
                        mb: 2,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                      }}
                    >
                      <ResponsiveTypography
                        variant="caption"
                        sx={{
                          fontSize: { xs: '0.7rem', md: '0.75rem' },
                          fontWeight: 600,
                          color: theme.palette.primary.main,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}
                      >
                        {t('home.steps.badge', 'Hướng dẫn')}
                      </ResponsiveTypography>
                    </Box>
                    <ResponsiveTypography
                      variant="cardTitle"
                      sx={{
                        fontWeight: 700,
                        mb: 1.5,
                        fontSize: { xs: '1.5rem', md: '2rem' },
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {t('home.steps.title', 'Bắt đầu ngay chỉ với 3 bước')}
                    </ResponsiveTypography>
                    <ResponsiveTypography
                      variant="cardLabel"
                      color="text.secondary"
                      sx={{
                        maxWidth: 650,
                        mx: 'auto',
                        fontSize: { xs: '0.9rem', md: '1.05rem' },
                        lineHeight: 1.7,
                      }}
                      ellipsis={true}
                    >
                      {t('home.steps.subtitle', 'Đầu tư chưa bao giờ dễ dàng hơn. Bắt đầu hành trình đầu tư của bạn ngay hôm nay')}
                    </ResponsiveTypography>
                  </Box>

                  {/* Steps Grid */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { 
                        xs: '1fr', 
                        sm: 'repeat(3, 1fr)', 
                        md: 'repeat(3, 1fr)' 
                      },
                      gap: { xs: 2.5, sm: 2.5, md: 3, lg: 4 },
                      position: 'relative',
                      maxWidth: { xs: '100%', sm: '100%', md: 1000 },
                      mx: 'auto',
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    {stepsToStart.map((step, index) => (
                      <Grow
                        key={index}
                        in={isVisible['steps-section'] || !loading}
                        timeout={700}
                        style={{ transitionDelay: `${index * 200}ms` }}
                      >
                        <Box 
                          className="step-card-container"
                          sx={{ 
                            position: 'relative', 
                            height: '100%', 
                            width: '100%',
                            maxWidth: { 
                              xs: '100%', 
                              sm: '100%', 
                              md: '280px',
                              lg: '320px' 
                            },
                            mx: { sm: 0, md: 'auto' },
                          }}
                        >
                          {/* Connection line from icon to next icon (desktop/tablet) */}
                          {index < stepsToStart.length - 1 && isTabletOrLarger && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: { sm: '68px', md: '84px' }, // Position at icon center: padding-top + (icon height / 2)
                                left: '100%',
                                width: { 
                                  sm: 'calc((100% - 40px) / 3)', // Dynamic width based on grid gap
                                  md: 'calc((100% - 48px) / 3)',
                                  lg: 'calc((100% - 64px) / 3)'
                                },
                                height: '4px',
                                zIndex: 0,
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                [theme.breakpoints.down('sm')]: {
                                  display: 'none',
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  width: '100%',
                                  height: '4px',
                                  background: `linear-gradient(90deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.main, 0.7)} 50%, ${alpha(theme.palette.warning.main, 0.3)} 100%)`,
                                  borderRadius: '2px',
                                  position: 'relative',
                                  boxShadow: `0 0 8px ${alpha(theme.palette.warning.main, 0.3)}`,
                                }}
                              />
                              {/* Arrow head pointing to next icon */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  right: -8,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: 0,
                                  height: 0,
                                  borderLeft: `8px solid ${theme.palette.warning.main}`,
                                  borderTop: '5px solid transparent',
                                  borderBottom: '5px solid transparent',
                                }}
                              />
                            </Box>
                          )}
                          
                          {/* Mobile: Vertical connector - Only show on true mobile (xs) */}
                          {index < stepsToStart.length - 1 && isMobile && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: -24,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '4px',
                                height: 40,
                                background: `linear-gradient(180deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.main, 0.3)} 100%)`,
                                zIndex: 0,
                                borderRadius: '2px',
                                boxShadow: `0 0 8px ${alpha(theme.palette.warning.main, 0.3)}`,
                                '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  bottom: -8,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: 0,
                                  height: 0,
                                  borderTop: `8px solid ${theme.palette.warning.main}`,
                                  borderLeft: '5px solid transparent',
                                  borderRight: '5px solid transparent',
                                },
                              }}
                            />
                          )}
                          
                          <Box
                            sx={{
                              height: '100%',
                              width: '100%',
                              maxWidth: '100%',
                              p: { xs: 2, sm: 2, lg: 3 },
                              textAlign: 'center',
                              position: 'relative',
                              zIndex: 1,
                              background: 'transparent',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              overflow: 'visible',
                              '&:hover': {
                                '& .step-icon': {
                                  transform: 'scale(1.1)',
                                  boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.4)}`,
                                },
                              },
                            }}
                          >
                            {/* Icon */}
                            <Box sx={{ position: 'relative', mb: { xs: 2, sm: 2.5, md: 3 } }}>
                              <Avatar
                                className="step-icon"
                                sx={{
                                  bgcolor: alpha(theme.palette.warning.main, 0.15),
                                  color: theme.palette.warning.main,
                                  width: { xs: 80, sm: 96, md: 120 },
                                  height: { xs: 80, sm: 96, md: 120 },
                                  mx: 'auto',
                                  border: `3px solid ${theme.palette.warning.main}`,
                                  boxShadow: `0 4px 16px ${alpha(theme.palette.warning.main, 0.3)}`,
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  position: 'relative',
                                  zIndex: 1,
                                  '& svg': {
                                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                                  },
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    inset: -4,
                                    borderRadius: '50%',
                                    background: `radial-gradient(circle, ${alpha(theme.palette.warning.main, 0.2)} 0%, transparent 70%)`,
                                    zIndex: -1,
                                  },
                                }}
                              >
                                {step.icon}
                              </Avatar>
                            </Box>
                            
                            {/* Title */}
                            <ResponsiveTypography
                              variant="cardTitle"
                              sx={{
                                fontWeight: 700,
                                mb: { xs: 1, sm: 1.25, md: 1.5 },
                                fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.4rem' },
                                color: theme.palette.text.primary,
                              }}
                            >
                              {step.title}
                            </ResponsiveTypography>
                            
                            {/* Description */}
                            <ResponsiveTypography
                              variant="cardLabel"
                              color="text.secondary"
                              sx={{
                                fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.95rem' },
                                lineHeight: { xs: 1.5, sm: 1.6, md: 1.7 },
                              }}
                              ellipsis={false}
                            >
                              {step.description}
                            </ResponsiveTypography>
                          </Box>
                        </Box>
                      </Grow>
                    ))}
                  </Box>
                </Box>
              </Box>
            </AnimatedSection>

      </Container>

      {/* Fixed Login Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          px: { xs: 0, md: 4 },
          py: { xs: 1, md: 2.5 },
          background: `linear-gradient(180deg, transparent 0%, ${alpha(theme.palette.background.paper, 0.95)} 10%, ${theme.palette.background.paper} 100%)`,
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          boxShadow: `0 -4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
        }}
      >
        <Container maxWidth="xs">
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<LoginIcon />}
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/login')}
            sx={{
              py: { xs: 1.5, md: 1.75 },
              fontSize: { xs: '0.95rem', md: '1rem' },
              fontWeight: 600,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
              textTransform: 'none',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                boxShadow: `0 6px 24px ${alpha(theme.palette.primary.main, 0.5)}`,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {t('home.cta.button', 'Đăng Nhập miễn phí')}
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;

