import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  IconButton,
  Chip,
  useTheme,
  alpha,
  useMediaQuery,
  Fade,
  Slide,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Close as CloseIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { useAccount } from '../../contexts/AccountContext';
import { apiService } from '../../services/api';
import { Account } from '../../types';
import ResponsiveTypography from './ResponsiveTypography';

const STORAGE_KEY = 'demoAccountSuggestionBannerDismissed';

/**
 * Demo Account Suggestion Banner Component
 * Displays a suggestion banner to new users about trying the demo account
 */
export const DemoAccountSuggestionBanner: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isDemoAccount, switchAccount } = useAccount();
  const [dismissed, setDismissed] = useState(true); // Default to dismissed
  const [demoAccount, setDemoAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if banner should be shown
  useEffect(() => {
    // Don't show if user is already using demo account
    if (isDemoAccount) {
      return;
    }

    // Check if banner was previously dismissed
    const dismissedState = localStorage.getItem(STORAGE_KEY);
    if (dismissedState === 'true') {
      setDismissed(true);
      return;
    }

    // Load accounts to check if demo account exists
    loadDemoAccount();
    
    // Show banner after a short delay for better UX
    const timer = setTimeout(() => {
      setDismissed(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isDemoAccount]);

  const loadDemoAccount = async () => {
    try {
      const accounts = await apiService.getAccounts();
      const demo = accounts.find((acc: Account) => acc.isDemoAccount);
      setDemoAccount(demo || null);
    } catch (error) {
      console.error('Error loading demo account:', error);
      setDemoAccount(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleTryDemo = async () => {
    if (!demoAccount) return;

    try {
      setLoading(true);
      await switchAccount(demoAccount.accountId);
      // Redirect to refresh all data
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to switch to demo account:', error);
      setLoading(false);
    }
  };

  // Don't render if:
  // - User is already using demo account
  // - Banner was dismissed
  // - Demo account doesn't exist
  if (isDemoAccount || dismissed || !demoAccount) {
    return null;
  }

  return (
    <Slide direction="down" in={!dismissed} timeout={500}>
      <Fade in={!dismissed} timeout={500}>
        <Alert
          severity="info"
          icon={<LightbulbIcon />}
          action={
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<PlayIcon />}
                onClick={handleTryDemo}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.5, sm: 0.75 },
                  borderRadius: 1,
                  whiteSpace: 'nowrap',
                  display: { xs: 'none', sm: 'flex' },
                }}
              >
                {t('accountSwitcher.demoAccountSuggestion.tryDemo', 'Thử Demo')}
              </Button>
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={handleDismiss}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
          sx={{
            borderRadius: 2,
            mb: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.main, 0.04)} 100%)`,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`,
            '& .MuiAlert-icon': {
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              color: theme.palette.info.main,
            },
            '& .MuiAlert-action': {
              alignItems: 'center',
              paddingTop: { xs: 0.5, sm: 'inherit' },
            },
          }}
        >
          <AlertTitle
            sx={{
              fontWeight: 700,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              mb: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
              <Chip
              label={t('accountSwitcher.demoAccountSuggestion.newFeature', 'Tính năng mới')}
              size="small"
              color="info"
              sx={{
                height: { xs: 20, sm: 24 },
                fontWeight: 700,
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                flexShrink: 0,
              }}
            />
            <Box component="span">
              {t('accountSwitcher.demoAccountSuggestion.title', 'Khám phá tài khoản Demo')}
            </Box>
          </AlertTitle>

          <Box sx={{ mt: 0.5 }}>
            <ResponsiveTypography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                lineHeight: 1.6,
                mb: { xs: 1.5, sm: 0 },
              }}
              ellipsis={false}
            >
              {t(
                'accountSwitcher.demoAccountSuggestion.message',
                'Thử nghiệm hệ thống với tài khoản Demo để xem các tính năng và dữ liệu mẫu. Tài khoản Demo cung cấp dữ liệu thực tế và cho phép bạn khám phá hệ thống một cách an toàn.'
              )}
            </ResponsiveTypography>

            {/* Mobile: Action button */}
            {isMobile && (
              <Button
                fullWidth
                size="small"
                variant="contained"
                color="primary"
                startIcon={<PlayIcon />}
                onClick={handleTryDemo}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  mt: 1.5,
                  py: 1,
                  borderRadius: 1,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {t('accountSwitcher.demoAccountSuggestion.tryDemo', 'Thử Demo')}
              </Button>
            )}
          </Box>
        </Alert>
      </Fade>
    </Slide>
  );
};

export default DemoAccountSuggestionBanner;

