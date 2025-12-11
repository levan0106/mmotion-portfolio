import React, { useState, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import {
  Box,
  Stack,
  Grid,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  HelpOutline as HelpIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common';
import { ModalWrapper } from '../Common/ModalWrapper';
import { FinancialFreedomPlan, AssetAllocation } from '../../types/financialFreedom.types';
import { formatCurrency, formatPercentageValue, formatPercentage } from '../../utils/format';
import { useTranslation } from 'react-i18next';
import { useAccount } from '../../contexts/AccountContext';
import { ASSET_TYPE_TEMPLATES } from '../../config/assetTypeTemplates';
import { ProgressChart } from './ProgressChart';
import { AllocationChart } from './AllocationChart';
import { GoalPlanExplanationModal } from './GoalPlanExplanationModal';
import { PlanLinksSection } from './PlanLinksSection';
import { PlanProgressSection } from './PlanProgressSection';
import { useProgressTracking } from '../../hooks/useProgressTracking';

interface PlanDetailModalProps {
  open: boolean;
  plan: FinancialFreedomPlan | null;
  onClose: () => void;
  onEdit: (plan: FinancialFreedomPlan) => void;
}

export const PlanDetailModal: React.FC<PlanDetailModalProps> = ({
  open,
  plan,
  onClose,
  onEdit,
}) => {
  const { t } = useTranslation();
  const { accountId } = useAccount();
  const [explanationModalOpen, setExplanationModalOpen] = useState(false);
  const [localPlan, setLocalPlan] = useState<FinancialFreedomPlan | null>(plan);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch progress if plan has linked portfolios
  const hasLinkedPortfolios = localPlan?.linkedPortfolioIds && localPlan.linkedPortfolioIds.length > 0;
  const { data: progress, isLoading: progressLoading } = useProgressTracking(
    localPlan?.id || '',
    accountId
  );

  // Update localPlan when plan prop changes
  useEffect(() => {
    if (plan) {
      setLocalPlan(plan);
    }
  }, [plan]);

  if (!plan || !localPlan) {
    return null;
  }

  const queryClient = useQueryClient();

  const handlePlanUpdate = (updatedPlan: FinancialFreedomPlan) => {
    setLocalPlan(updatedPlan);
    // Immediately refetch progress when plan links change
    if (updatedPlan.id) {
      queryClient.invalidateQueries({ queryKey: ['planProgress', updatedPlan.id] });
    }
  };

  const handleEdit = () => {
    onClose();
    onEdit(localPlan);
  };

  // Calculate completion year
  const calculateCompletionYear = (): number | null => {
    // if (hasLinkedPortfolios && progress && progress.remainingYears !== undefined && progress.remainingYears !== Infinity) {
    //   // Use remaining years from progress if available
    //   const currentYear = new Date().getFullYear();
    //   return currentYear + Math.ceil(progress.remainingYears);
    // } 
    if (localPlan.investmentYears) {
      // Use startDate if available, otherwise fallback to createdAt
      const startDate = localPlan.startDate || localPlan.createdAt;
      if (startDate) {
        const startYear = new Date(startDate).getFullYear();
        return startYear + Math.ceil(localPlan.investmentYears);
      }
    }
    return null;
  };

  const completionYear = calculateCompletionYear();

  return (
    <>
      <ModalWrapper
        open={open}
        onClose={onClose}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>{localPlan.name || t('financialFreedom.title')}</span>
            <Tooltip title={t('financialFreedom.planDetails.helpTooltip')}>
              <IconButton
                size="small"
                onClick={() => setExplanationModalOpen(true)}
                sx={{ color: 'primary.main' }}
              >
                <HelpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        }
        maxWidth="lg"
        fullWidth
        actions={
          <>
            <ResponsiveButton variant="outlined" onClick={onClose}>
              {t('common.close')}
            </ResponsiveButton>
            <ResponsiveButton variant="contained" onClick={handleEdit}>
              {t('common.edit')}
            </ResponsiveButton>
          </>
        }
      >
      <Stack spacing={3}>
        {/* Summary Section - Always Visible */}
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              {/* Target Value */}
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('financialFreedom.planDetails.target')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="h5" sx={{ fontWeight: 600 }}>
                    {formatCurrency(localPlan.futureValueRequired, localPlan.baseCurrency || 'VND')}
                  </ResponsiveTypography>
                  {completionYear && (
                    <ResponsiveTypography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      {t('financialFreedom.planDetails.completionYear', { year: completionYear })}
                    </ResponsiveTypography>
                  )}
                </Box>
              </Grid>

              {/* Progress (if has linked portfolios or goals) */}
              {(hasLinkedPortfolios || (localPlan.linkedGoalIds && localPlan.linkedGoalIds.length > 0)) && progress && (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('financialFreedom.planDetails.progress')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {Math.min(100, Math.max(0, progress.progressPercentage)).toFixed(1)}%
                      </ResponsiveTypography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, Math.max(0, progress.progressPercentage))}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('financialFreedom.planDetails.currentValue')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {formatCurrency(progress.currentValue, localPlan.baseCurrency || 'VND')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {t('financialFreedom.planDetails.remaining', {
                          amount: formatCurrency(progress.remainingAmount, localPlan.baseCurrency || 'VND'),
                        })}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('financialFreedom.planDetails.returnRate')}
                      </ResponsiveTypography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ResponsiveTypography variant="h5" sx={{ fontWeight: 600 }}>
                          {formatPercentage(progress.currentReturnRate)}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="caption" color="text.secondary">
                          | {formatPercentage(progress.requiredReturnRate)}
                        </ResponsiveTypography>
                      </Box>
                      <ResponsiveTypography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {t('financialFreedom.planDetails.time', { remainingYears: Math.ceil(progress.remainingYears), targetYears: localPlan.investmentYears })}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                </>
              )}

              {/* Basic Info (if no linked portfolios) */}
              {!hasLinkedPortfolios && (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('financialFreedom.planDetails.requiredReturnRate')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="h5" sx={{ fontWeight: 600 }}>
                        {localPlan.requiredReturnRate ? formatPercentageValue(localPlan.requiredReturnRate) : 'N/A'}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('financialFreedom.planDetails.investmentTime')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="h5" sx={{ fontWeight: 600 }}>
                        {localPlan.investmentYears
                          ? `${localPlan.investmentYears} ${t('financialFreedom.scenario.years')}`
                          : t('common.na')}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('financialFreedom.planDetails.initialInvestment')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="h5" sx={{ fontWeight: 600 }}>
                        {localPlan.initialInvestment
                          ? formatCurrency(localPlan.initialInvestment, localPlan.baseCurrency || 'VND')
                          : t('common.na')}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon fontSize="small" />
                  <span>{t('financialFreedom.planDetails.tabs.parametersAndProjections')}</span>
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon fontSize="small" />
                  <span>{t('financialFreedom.planDetails.tabs.progressAndLinks')}</span>
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Tab Panel 1: Investment Parameters, Allocation, Projections */}
        {activeTab === 0 && (
          <Stack spacing={3}>
            {/* Investment Parameters */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SettingsIcon color="primary" />
                  <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('financialFreedom.planDetails.investmentParameters')}
                  </ResponsiveTypography>
                </Box>
                <Grid container spacing={2}>
                  
                  {localPlan.initialInvestment !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('financialFreedom.form.investmentParameters.initialInvestment')}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                          {formatCurrency(localPlan.initialInvestment, localPlan.baseCurrency || 'VND')}
                        </ResponsiveTypography>
                      </Box>
                    </Grid>
                  )}
                  {localPlan.periodicPayment !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('financialFreedom.form.investmentParameters.periodicPayment')}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                          {formatCurrency(localPlan.periodicPayment, localPlan.baseCurrency || 'VND')}
                        </ResponsiveTypography>
                      </Box>
                    </Grid>
                  )}
                  {localPlan.requiredReturnRate !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('financialFreedom.step4.requiredReturnRate')}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                          {formatPercentageValue(localPlan.requiredReturnRate)}
                        </ResponsiveTypography>
                      </Box>
                    </Grid>
                  )}
                  {localPlan.investmentYears !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('financialFreedom.step4.remainingYears')}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                          {localPlan.investmentYears} {t('financialFreedom.scenario.years')}
                        </ResponsiveTypography>
                      </Box>
                    </Grid>
                  )}
                  {localPlan.inflationRate !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('financialFreedom.form.investmentParameters.inflationRate')}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                          {formatPercentageValue(localPlan.inflationRate)}
                        </ResponsiveTypography>
                      </Box>
                    </Grid>
                  )}
                  {localPlan.riskTolerance && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('financialFreedom.form.investmentParameters.riskTolerance')}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                          {t(`financialFreedom.form.investmentParameters.${localPlan.riskTolerance}`)}
                        </ResponsiveTypography>
                      </Box>
                    </Grid>
                  )}
                  {/* Start Date */}
                  
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('financialFreedom.plansList.startDate')}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="body1" sx={{ fontWeight: 500 }}>
                          {localPlan.startDate ? new Date(localPlan.startDate).toLocaleDateString('vi-VN') : '-'}
                        </ResponsiveTypography>
                      </Box>
                    </Grid>
                  {/* Description */}
                  {localPlan.description && (
                    <Grid item xs={12} sm={ 12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 1 }}>
                        {/* <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('financialFreedom.step3.descriptionLabel')}
                        </ResponsiveTypography> */}
                        <ResponsiveTypography variant="caption" sx={{ fontStyle: 'italic', textAlign: 'right' }}>
                          {localPlan.description}
                        </ResponsiveTypography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Asset Allocation */}
            {localPlan.suggestedAllocation && (() => {
              // Convert suggestedAllocation to AssetAllocation format and get assetTypes
              let allocationData: AssetAllocation = {};
              let assetTypes: Array<{ code: string; name: string; nameEn?: string; color?: string }> = [];

              if (Array.isArray(localPlan.suggestedAllocation) && localPlan.suggestedAllocation.length > 0) {
                // New format: AssetAllocationItem[]
                allocationData = localPlan.suggestedAllocation.reduce((acc, item) => {
                  acc[item.code] = item.allocation;
                  return acc;
                }, {} as AssetAllocation);

                // Get asset types metadata from templates
                assetTypes = localPlan.suggestedAllocation
                  .filter(item => item.allocation > 0)
                  .map(item => {
                    const template = ASSET_TYPE_TEMPLATES.find(t => t.code === item.code);
                    return {
                      code: item.code,
                      name: template?.name || item.code,
                      nameEn: template?.nameEn,
                      color: template?.color,
                    };
                  });
              } else if (!Array.isArray(localPlan.suggestedAllocation) && Object.keys(localPlan.suggestedAllocation).length > 0) {
                // Old format: AssetAllocation (object)
                allocationData = localPlan.suggestedAllocation as AssetAllocation;
                
                // Get asset types metadata from templates
                assetTypes = Object.entries(localPlan.suggestedAllocation)
                  .filter(([_, value]) => (value as number) > 0)
                  .map(([code]) => {
                    const template = ASSET_TYPE_TEMPLATES.find(t => t.code === code);
                    return {
                      code,
                      name: template?.name || code,
                      nameEn: template?.nameEn,
                      color: template?.color,
                    };
                  });
              }

              // Only render if we have allocation data
              if (Object.keys(allocationData).length > 0) {
                return (
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <PieChartIcon color="primary" />
                        <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                          {t('financialFreedom.step2.allocation')}
                        </ResponsiveTypography>
                      </Box>
                      <AllocationChart
                        allocation={allocationData}
                        assetTypes={assetTypes.length > 0 ? assetTypes : undefined}
                      />
                    </CardContent>
                  </Card>
                );
              }

              return null;
            })()}

            {/* Yearly Projections */}
            {localPlan.yearlyProjections && localPlan.yearlyProjections.length > 0 && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TimelineIcon color="primary" />
                    <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('financialFreedom.step3.yearlyProjections')}
                    </ResponsiveTypography>
                  </Box>
                  <ProgressChart
                    projections={localPlan.yearlyProjections}
                    targetValue={localPlan.futureValueRequired}
                    // title={t('financialFreedom.step3.yearlyProjections')}
                    baseCurrency={localPlan.baseCurrency || 'VND'}
                    height={350}
                    showTarget={true}
                  />
                </CardContent>
              </Card>
            )}
          </Stack>
        )}

        {/* Tab Panel 2: Progress & Links */}
        {activeTab === 1 && (
          <Stack spacing={3}>
            {/* Progress Details (if has linked portfolios or goals) */}
            {(hasLinkedPortfolios || (localPlan.linkedGoalIds && localPlan.linkedGoalIds.length > 0)) && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TrendingUpIcon color="primary" />
                    <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('financialFreedom.planDetails.progressDetails')}
                    </ResponsiveTypography>
                  </Box>
                  <PlanProgressSection
                    progress={progress || null}
                    isLoading={progressLoading}
                    baseCurrency={localPlan.baseCurrency || 'VND'}
                  />
                </CardContent>
              </Card>
            )}

            {/* Links Section */}
            <Card>
              <CardContent>
                {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LinkIcon color="primary" />
                  <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('financialFreedom.planDetails.links')}
                  </ResponsiveTypography>
                </Box> */}
                <PlanLinksSection plan={localPlan} onPlanUpdate={handlePlanUpdate} />
              </CardContent>
            </Card>
          </Stack>
        )}
      </Stack>
    </ModalWrapper>

    <GoalPlanExplanationModal
      open={explanationModalOpen}
      onClose={() => setExplanationModalOpen(false)}
    />
    </>
  );
};

