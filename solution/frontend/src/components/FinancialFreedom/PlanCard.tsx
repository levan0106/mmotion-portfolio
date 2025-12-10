import React from 'react';
import { Card, CardContent, CardActions, Box, LinearProgress, Chip, IconButton, Tooltip } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import { FinancialFreedomPlan } from '../../types/financialFreedom.types';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatPercentageValue } from '../../utils/format';

interface PlanCardProps {
  plan: FinancialFreedomPlan;
  onEdit?: (plan: FinancialFreedomPlan) => void;
  onDelete?: (plan: FinancialFreedomPlan) => void;
  onView?: (plan: FinancialFreedomPlan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onEdit, onDelete, onView }) => {
  const { t } = useTranslation();

  const currentValue = plan.currentValue || plan.currentPortfolioValue || 0;
  const progressPercentage = currentValue
    ? Math.min((currentValue / plan.futureValueRequired) * 100, 100)
    : plan.currentProgressPercentage || 0;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <ResponsiveTypography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
              {plan.name}
            </ResponsiveTypography>
            {plan.status && (
              <Chip
                label={plan.status}
                size="small"
                color={getStatusColor(plan.status) as any}
                sx={{ mt: 0.5 }}
              />
            )}
            {!plan.status && plan.isActive !== undefined && (
              <Chip
                label={plan.isActive ? 'active' : 'inactive'}
                size="small"
                color={plan.isActive ? 'success' : 'default'}
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {onView && (
              <Tooltip title={t('common.view')}>
                <IconButton size="small" onClick={() => onView(plan)}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onEdit && (
              <Tooltip title={t('common.edit')}>
                <IconButton size="small" onClick={() => onEdit(plan)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title={t('common.delete')}>
                <IconButton size="small" color="error" onClick={() => onDelete(plan)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <ResponsiveTypography variant="body2" color="text.secondary">
              {t('financialFreedom.step4.targetValue')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="body1" sx={{ fontWeight: 600 }}>
              {formatCurrency(plan.futureValueRequired, plan.baseCurrency || 'VND', { compact: true })}
            </ResponsiveTypography>
          </Box>
          {currentValue > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <ResponsiveTypography variant="body2" color="text.secondary">
                {t('financialFreedom.step4.currentValue')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="body1" sx={{ fontWeight: 600 }}>
                {formatCurrency(currentValue, plan.baseCurrency || 'VND', { compact: true })}
              </ResponsiveTypography>
            </Box>
          )}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <ResponsiveTypography variant="body2" color="text.secondary">
                Progress
              </ResponsiveTypography>
              <ResponsiveTypography variant="body2" sx={{ fontWeight: 600 }}>
                {formatPercentageValue(progressPercentage)}
              </ResponsiveTypography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        </Box>

        {plan.requiredReturnRate && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUpIcon fontSize="small" color="primary" />
            <ResponsiveTypography variant="body2" color="text.secondary">
              {t('financialFreedom.step4.requiredReturnRate')}:{' '}
              {formatPercentageValue(plan.requiredReturnRate)}
            </ResponsiveTypography>
          </Box>
        )}

        {plan.investmentYears && (
          <ResponsiveTypography variant="body2" color="text.secondary">
            {t('financialFreedom.step4.remainingYears')}: {plan.investmentYears}{' '}
            {t('financialFreedom.scenario.years')}
          </ResponsiveTypography>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        {onView && (
          <ResponsiveButton size="small" onClick={() => onView(plan)}>
            {t('common.viewDetails')}
          </ResponsiveButton>
        )}
      </CardActions>
    </Card>
  );
};

