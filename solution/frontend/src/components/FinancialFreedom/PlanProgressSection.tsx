import React from 'react';
import {
  Box,
  Stack,
  LinearProgress,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Grid,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ProgressResult } from '../../types/financialFreedom.types';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { useTranslation } from 'react-i18next';

interface PlanProgressSectionProps {
  progress: ProgressResult | null;
  isLoading?: boolean;
  baseCurrency?: string;
}

export const PlanProgressSection: React.FC<PlanProgressSectionProps> = ({
  progress,
  isLoading,
  baseCurrency = 'VND',
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!progress) {
    return null;
  }

  const progressPercentage = Math.min(100, Math.max(0, progress.progressPercentage));
  const isOnTrack = progress.gap <= 2; // Within 2% of required return
  const hasAlerts = progress.alerts && progress.alerts.length > 0;

  return (
    <Box>
      <Divider sx={{ my: 3 }} />
      {/* <ResponsiveTypography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {t('financialFreedom.planDetails.progressSection.progressTracking')}
      </ResponsiveTypography> */}

      {/* Progress Overview Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Progress Bar */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <ResponsiveTypography variant="body2" color="text.secondary">
                  {t('financialFreedom.planDetails.progressSection.progressToTarget')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                  {progressPercentage.toFixed(1)}%
                </ResponsiveTypography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercentage}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'action.disabledBackground',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    backgroundColor: progressPercentage >= 100 ? 'success.main' : 'primary.main',
                  },
                }}
              />
            </Box>

            {/* Current vs Target Value */}
            <Stack direction="row" flexWrap="wrap">
              <Box sx={{ flex: 1, minWidth: 150 }}>
                <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {t('financialFreedom.planDetails.currentValue')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {formatCurrency(progress.currentValue, baseCurrency)}
                </ResponsiveTypography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 150 }}>
                <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {t('financialFreedom.planDetails.target')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatCurrency(progress.targetValue, baseCurrency)}
                </ResponsiveTypography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 150 }}>
                <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {t('financialFreedom.step4.remainingAmount')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
                  {formatCurrency(progress.remainingAmount, baseCurrency)}
                </ResponsiveTypography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
            <CardContent>
              <Stack spacing={1}>
                <ResponsiveTypography variant="body2" color="text.secondary">
                  {t('financialFreedom.planDetails.progressSection.actualReturnRate')}
                </ResponsiveTypography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatPercentage(progress.currentReturnRate)}
                  </ResponsiveTypography>
                  {isOnTrack ? (
                    <TrendingUpIcon color="success" fontSize="small" />
                  ) : (
                    <TrendingDownIcon color="error" fontSize="small" />
                  )}
                </Box>
              </Stack>
            </CardContent>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
            <CardContent>
              <Stack spacing={1}>
                <ResponsiveTypography variant="body2" color="text.secondary">
                  {t('financialFreedom.planDetails.requiredReturnRate')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatPercentage(progress.requiredReturnRate)}
                </ResponsiveTypography>
              </Stack>
            </CardContent>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
            <CardContent>
              <Stack spacing={1}>
                <ResponsiveTypography variant="body2" color="text.secondary">
                  {t('financialFreedom.planDetails.progressSection.gap')}
                </ResponsiveTypography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ResponsiveTypography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: progress.gap > 0 ? 'error.main' : 'success.main',
                    }}
                  >
                    {progress.gap > 0 ? '+' : ''}
                    {formatPercentage(progress.gap)}
                  </ResponsiveTypography>
                </Box>
              </Stack>
            </CardContent>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
            <CardContent>
              <Stack spacing={1}>
                <ResponsiveTypography variant="body2" color="text.secondary">
                  {t('financialFreedom.planDetails.progressSection.remainingTime')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                  {Math.ceil(progress.remainingYears)} {t('financialFreedom.scenario.years')}
                </ResponsiveTypography>
              </Stack>
            </CardContent>
        </Grid>
      </Grid>

      {/* Alerts */}
      {hasAlerts && (
        <Box sx={{ mb: 3 }}>
          {progress.alerts.map((alert, index) => (
            <Alert
              key={index}
              severity={alert.severity}
              icon={
                alert.severity === 'error' ? (
                  <WarningIcon />
                ) : alert.severity === 'warning' ? (
                  <WarningIcon />
                ) : (
                  <InfoIcon />
                )
              }
              sx={{ mb: 1 }}
            >
              <AlertTitle>{alert.message}</AlertTitle>
              {alert.action && (
                <ResponsiveTypography variant="body2" sx={{ mt: 0.5 }}>
                  {alert.action}
                </ResponsiveTypography>
              )}
            </Alert>
          ))}
        </Box>
      )}

      {/* Milestones */}
      {progress.milestones && progress.milestones.length > 0 && (
        <Box>
          <ResponsiveTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
            {t('financialFreedom.planDetails.progressSection.importantMilestones')}
          </ResponsiveTypography>
          <Box sx={{ position: 'relative' }}>
            {/* Timeline line */}
            <Box
              sx={{
                position: 'absolute',
                left: { xs: 20, sm: 24 },
                top: 0,
                bottom: 0,
                width: 2,
                bgcolor: 'divider',
                zIndex: 0,
              }}
            />
            
            <Stack spacing={3}>
              {progress.milestones.map((milestone, index) => {
                const progressToMilestone = progress.targetValue > 0
                  ? Math.min(100, (progress.currentValue / milestone.targetValue) * 100)
                  : 0;
                
                return (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      gap: 2,
                      pl: { xs: 6, sm: 7 },
                    }}
                  >
                    {/* Timeline dot */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: { xs: 14, sm: 18 },
                        top: milestone.achieved ? 4 : -20,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: milestone.achieved ? 'success.main' : 'background.paper',
                        border: `3px solid ${milestone.achieved ? 'success.main' : 'divider'}`,
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: milestone.achieved ? 2 : 0,
                      }}
                    >
                      {milestone.achieved && (
                        <CheckCircleIcon sx={{ fontSize: 12, color: 'white' }} />
                      )}
                    </Box>

                    {/* Content Card */}
                    <Card
                      sx={{
                        flex: 1,
                        bgcolor: milestone.achieved ? 'success.primary' : 'background.paper',
                        border: `2px solid ${milestone.achieved ? 'success.main' : 'divider'}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {/* Header */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <ResponsiveTypography
                                  variant="h6"
                                  sx={{
                                    fontWeight: 600,
                                    color: milestone.achieved ? 'success.main' : 'text.primary',
                                  }}
                                >
                                  {t('financialFreedom.planDetails.progressSection.milestoneYear', {
                                    year: milestone.year,
                                    description: milestone.description,
                                  })}
                                </ResponsiveTypography>
                              </Box>
                              <ResponsiveTypography variant="body2" color="text.secondary">
                                {t('financialFreedom.planDetails.progressSection.milestoneTarget', {
                                  amount: formatCurrency(milestone.targetValue, baseCurrency),
                                })}
                              </ResponsiveTypography>
                            </Box>
                            {milestone.achieved && (
                              <Chip
                                label={t('financialFreedom.planDetails.progressSection.achieved')}
                                color="success"
                                size="small"
                                icon={<CheckCircleIcon />}
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                            
                          </Box>

                          {/* Progress indicator */}
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <ResponsiveTypography variant="caption" color="text.secondary">
                                  {t('financialFreedom.planDetails.progressSection.progressToMilestone')}
                                </ResponsiveTypography>
                                <ResponsiveTypography variant="caption" sx={{ fontWeight: 600 }}>
                                  {Math.min(100, progressToMilestone).toFixed(1)}%
                                </ResponsiveTypography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(100, progressToMilestone)}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: 'action.disabledBackground',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                  },
                                }}
                              />
                            </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
};

