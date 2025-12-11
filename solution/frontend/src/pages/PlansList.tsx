import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  useTheme,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  Stack,
  Grid,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  HelpOutline as HelpIcon,
  AccountBalance as PortfolioIcon,
  Flag as GoalIcon,
  AccountBalanceWallet as WalletIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../components/Common/ResponsiveTypography';
import { ResponsiveButton } from '../components/Common';
import { ModalWrapper } from '../components/Common/ModalWrapper';
import { FinancialFreedomWizard } from '../components/FinancialFreedom/FinancialFreedomWizard';
import { PlanDetailModal } from '../components/FinancialFreedom/PlanDetailModal';
import { GoalPlanExplanationModal } from '../components/FinancialFreedom/GoalPlanExplanationModal';
import { useFinancialFreedomPlans, useCreateFinancialFreedomPlan, useDeleteFinancialFreedomPlan, useUpdateFinancialFreedomPlan } from '../hooks/useFinancialFreedomPlans';
import { useAccount } from '../contexts/AccountContext';
import { useTranslation } from 'react-i18next';
import { PlanData, FinancialFreedomPlan } from '../types/financialFreedom.types';
import { mapPlanDataToCreateRequest, mapPlanDataToUpdateRequest, mapPlanToPlanData } from '../utils/planDataMapper';
import { formatCurrency, formatPercentageValue } from '../utils/format';
import { useProgressTracking } from '../hooks/useProgressTracking';

// Component for each plan row with progress tracking
interface PlanRowProps {
  plan: FinancialFreedomPlan;
  hasLinkedPortfolios: boolean;
  linkedPortfolioCount: number;
  linkedGoalCount: number;
  completionYear: number | null;
  onRowClick: (plan: FinancialFreedomPlan, event: React.MouseEvent) => void;
  onActionMenuOpen: (event: React.MouseEvent<HTMLElement>, plan: FinancialFreedomPlan) => void;
  t: (key: string, options?: any) => string;
  formatCurrency: (value: number, currency: string) => string;
  formatPercentageValue: (value: number) => string;
  calculateTimeProgress: (plan: FinancialFreedomPlan) => { elapsed: number; total: number; remaining: number } | null;
}

const PlanRow: React.FC<PlanRowProps> = ({
  plan,
  hasLinkedPortfolios,
  linkedPortfolioCount,
  linkedGoalCount,
  completionYear,
  onRowClick,
  onActionMenuOpen,
  t,
  formatCurrency,
  formatPercentageValue,
  calculateTimeProgress,
}) => {
  const { data: progress } = useProgressTracking(plan.id);

  return (
    <TableRow 
      hover
      onClick={(e) => onRowClick(plan, e)}
      sx={{ cursor: 'pointer' }}
    >
      <TableCell sx={{ minWidth: 180 }}>
        <Box>
          <Tooltip
            title={
              <Box sx={{ p: 1.5, maxWidth: 300 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'common.white', fontSize: '0.875rem' }}>
                  {plan.name}
                </Typography>
                <Divider sx={{ mb: 1.5, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                <Stack spacing={1}>
                  {plan.initialInvestment !== undefined && plan.initialInvestment !== null && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' }}>
                        {t('financialFreedom.form.investmentParameters.initialInvestment')}:
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 500, fontSize: '0.75rem', ml: 1 }}>
                        {formatCurrency(plan.initialInvestment, plan.baseCurrency || 'VND')}
                      </Typography>
                    </Box>
                  )}
                  {plan.periodicPayment !== undefined && plan.periodicPayment !== null && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' }}>
                        {t('financialFreedom.form.investmentParameters.periodicPayment')}:
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 500, fontSize: '0.75rem', ml: 1 }}>
                        {formatCurrency(plan.periodicPayment, plan.baseCurrency || 'VND')}
                      </Typography>
                    </Box>
                  )}
                  {plan.requiredReturnRate !== undefined && plan.requiredReturnRate !== null && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' }}>
                        {t('financialFreedom.step4.requiredReturnRate')}:
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 500, fontSize: '0.75rem', ml: 1 }}>
                        {formatPercentageValue(plan.requiredReturnRate)}
                      </Typography>
                    </Box>
                  )}
                  {plan.investmentYears !== undefined && plan.investmentYears !== null && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' }}>
                        {t('financialFreedom.planDetails.investmentTime')}:
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 500, fontSize: '0.75rem', ml: 1 }}>
                        {plan.investmentYears} {t('financialFreedom.scenario.years')}
                      </Typography>
                    </Box>
                  )}
                  {plan.riskTolerance && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' }}>
                        {t('financialFreedom.form.investmentParameters.riskTolerance')}:
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 500, fontSize: '0.75rem', ml: 1 }}>
                        {t(`financialFreedom.form.investmentParameters.${plan.riskTolerance}`)}
                      </Typography>
                    </Box>
                  )}
                  {plan.startDate && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' }}>
                        {t('financialFreedom.plansList.startDate')}:
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 500, fontSize: '0.75rem', ml: 1 }}>
                        {new Date(plan.startDate).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                  )}
                  {plan.description && (
                    <>
                      <Divider sx={{ my: 0.5, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontStyle: 'italic', fontSize: '0.75rem', lineHeight: 1.4 }}>
                        {plan.description}
                      </Typography>
                    </>
                  )}
                </Stack>
              </Box>
            }
            arrow
            placement="right"
          >
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                {plan.name}
              </Typography>
              {completionYear && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {t('financialFreedom.planDetails.completionYear', { startYear: new Date(plan.startDate || plan.createdAt).getFullYear(), endYear: completionYear })}
                </Typography>
              )}
            </Box>
          </Tooltip>
        </Box>
      </TableCell>
      <TableCell align="right" sx={{ minWidth: 150 }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatCurrency(plan.futureValueRequired, plan.baseCurrency || 'VND')}
          </Typography>
          {hasLinkedPortfolios && progress && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {t('financialFreedom.planDetails.currentValue')}: {formatCurrency(progress.currentValue, plan.baseCurrency || 'VND')}
            </Typography>
          )}
        </Box>
      </TableCell>
      <TableCell align="right" sx={{ minWidth: 120 }}>
        {hasLinkedPortfolios && progress ? (
          <Box sx={{ minWidth: 100 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {Math.min(100, Math.max(0, progress.progressPercentage)).toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.max(0, progress.progressPercentage))}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'action.disabledBackground',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: progress.progressPercentage >= 100 ? 'success.main' : 'primary.main',
                },
              }}
            />
            {(() => {
              const timeProgress = calculateTimeProgress(plan);
              if (timeProgress) {
                return (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
                      {timeProgress.elapsed} / {timeProgress.total} {t('financialFreedom.scenario.years')}
                    </Typography>
                  </Box>
                );
              }
              return null;
            })()}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
            {t('common.na')}
          </Typography>
        )}
      </TableCell>
      <TableCell align="right" sx={{ minWidth: 120 }}>
        {plan.requiredReturnRate ? (
          <Typography variant="body2">
            {formatPercentageValue(plan.requiredReturnRate)}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('common.na')}
          </Typography>
        )}
      </TableCell>
      <TableCell align="right" sx={{ minWidth: 150 }}>
        {plan.investmentYears ? (
          <Box>
            <Typography variant="body2">
              {plan.investmentYears} {t('financialFreedom.scenario.years')}
            </Typography>
            {hasLinkedPortfolios && progress && progress.remainingYears !== undefined && progress.remainingYears !== Infinity && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {t('financialFreedom.plansList.remaining', { years: Math.ceil(progress.remainingYears) })}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('common.na')}
          </Typography>
        )}
      </TableCell>
      <TableCell align="center" sx={{ minWidth: 120 }} onClick={(e) => e.stopPropagation()}>
        <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
          {linkedPortfolioCount > 0 && (
            <Tooltip title={t('financialFreedom.plansList.portfoliosLinked', { count: linkedPortfolioCount })}>
              <Chip
                icon={<PortfolioIcon />}
                label={linkedPortfolioCount}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 24 }}
              />
            </Tooltip>
          )}
          {linkedGoalCount > 0 && (
            <Tooltip title={t('financialFreedom.plansList.goalsLinked', { count: linkedGoalCount })}>
              <Chip
                icon={<GoalIcon />}
                label={linkedGoalCount}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ height: 24 }}
              />
            </Tooltip>
          )}
          {linkedPortfolioCount === 0 && linkedGoalCount === 0 && (
            <Typography variant="caption" color="text.secondary">
              {t('financialFreedom.plansList.noLinks')}
            </Typography>
          )}
        </Stack>
      </TableCell>
      <TableCell align="center" sx={{ minWidth: 80 }} onClick={(e) => e.stopPropagation()}>
        <Tooltip title={t('common.actions')}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onActionMenuOpen(e, plan);
            }}
            aria-label={t('common.actions')}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

const PlansList: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accountId } = useAccount();
  const { data: plans, isLoading, refetch } = useFinancialFreedomPlans(accountId);
  const createPlanMutation = useCreateFinancialFreedomPlan(accountId);
  const updatePlanMutation = useUpdateFinancialFreedomPlan(accountId);
  const deletePlanMutation = useDeleteFinancialFreedomPlan(accountId);
  const [showWizard, setShowWizard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<FinancialFreedomPlan | null>(null);
  const [planToEdit, setPlanToEdit] = useState<FinancialFreedomPlan | null>(null);
  const [planToView, setPlanToView] = useState<FinancialFreedomPlan | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<{ element: HTMLElement; plan: FinancialFreedomPlan } | null>(null);
  const [explanationModalOpen, setExplanationModalOpen] = useState(false);

  const handleCreateNew = () => {
    setShowWizard(true);
    setError(null);
  };

  const handleWizardComplete = async (planData: PlanData) => {
    if (!accountId) {
      setError('Account ID is required');
      return;
    }

    try {
      if (planToEdit) {
        // Update existing plan
        // Use planName from step3 if available, otherwise use original plan name
        const planName = planData.step3?.planName?.trim() || planToEdit.name;
        const updateRequest = mapPlanDataToUpdateRequest(planData, planName);
        // Preserve linkedPortfolioIds and linkedGoalIds from original plan
        updateRequest.linkedPortfolioIds = planToEdit.linkedPortfolioIds;
        updateRequest.linkedGoalIds = planToEdit.linkedGoalIds;
        await updatePlanMutation.mutateAsync({
          id: planToEdit.id,
          data: updateRequest,
        });
      } else {
        // Create new plan
        const createRequest = mapPlanDataToCreateRequest(planData);
        await createPlanMutation.mutateAsync(createRequest);
      }
      
      // Close wizard and refresh plans list
      setShowWizard(false);
      setPlanToEdit(null);
      refetch();
    } catch (err: any) {
      setError(err.message || t('financialFreedom.form.error') || 'Failed to save plan');
      console.error('Error saving plan:', err);
    }
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
    setPlanToEdit(null);
    setError(null);
  };

  const handleEditClick = (plan: FinancialFreedomPlan) => {
    setPlanToEdit(plan);
    setShowWizard(true);
    setError(null);
  };

  const handleDeleteClick = (plan: FinancialFreedomPlan) => {
    setPlanToDelete(plan);
    setError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete || !accountId) {
      return;
    }

    try {
      await deletePlanMutation.mutateAsync(planToDelete.id);
      setPlanToDelete(null);
      refetch();
    } catch (err: any) {
      setError(err.message || t('financialFreedom.delete.error') || 'Failed to delete plan');
      console.error('Error deleting plan:', err);
    }
  };

  const handleDeleteCancel = () => {
    setPlanToDelete(null);
    setError(null);
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, plan: FinancialFreedomPlan) => {
    setActionMenuAnchor({ element: event.currentTarget, plan });
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  const handleRowClick = (plan: FinancialFreedomPlan, event: React.MouseEvent) => {
    // Don't open detail if clicking on action button or its children
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    setPlanToView(plan);
  };

  const handleViewClose = () => {
    setPlanToView(null);
  };

  const handleEditFromMenu = (plan: FinancialFreedomPlan) => {
    handleActionMenuClose();
    handleEditClick(plan);
  };

  const handleDeleteFromMenu = (plan: FinancialFreedomPlan) => {
    handleActionMenuClose();
    handleDeleteClick(plan);
  };

  if (showWizard) {
    return (
      <Container maxWidth="lg">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {(createPlanMutation.isLoading || updatePlanMutation.isLoading) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress />
          </Box>
        )}
        <FinancialFreedomWizard
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
          initialData={planToEdit ? mapPlanToPlanData(planToEdit) : undefined}
        />
      </Container>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {/* Header Section */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <ResponsiveTypography 
              variant="pageHeader" 
              sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              {t('financialFreedom.title')}
            </ResponsiveTypography>
            <ResponsiveTypography 
              variant="pageSubtitle" 
              color="text.secondary"
              sx={{
                display: { xs: 'none', md: 'block' }
              }}
            >
              {t('financialFreedom.subtitle')}
            </ResponsiveTypography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Tìm hiểu về Portfolio, Goal và Plan">
              <IconButton
                size="small"
                onClick={() => setExplanationModalOpen(true)}
                sx={{ color: 'primary.main' }}
              >
                <HelpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <ResponsiveButton
              variant="contained"
              icon={<AddIcon />}
              onClick={handleCreateNew}
              mobileText={t('financialFreedom.createNewPlan') || 'Create New Plan'}
              desktopText={t('financialFreedom.createNewPlan') || 'Create New Plan'}
              breakpoint="sm"
              sx={{ borderRadius: 2 }}
            >
              {t('financialFreedom.createNewPlan') || 'Create New Plan'}
            </ResponsiveButton>
          </Box>
        </Box>
      </Box>
      <Box sx={{ px: { xs: 0, sm: 4 } }}>
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <ResponsiveTypography sx={{ mt: 2 }}>Loading plans...</ResponsiveTypography>
          </Box>
        ) : plans && plans.length > 0 ? (
          <>
            {/* Financial Summary Section */}
            {(() => {
              // Calculate totals grouped by currency
              const totalsByCurrency: Record<string, { initialInvestment: number; periodicPayment: number }> = {};
              
              plans.forEach((plan) => {
                const currency = plan.baseCurrency || 'VND';
                if (!totalsByCurrency[currency]) {
                  totalsByCurrency[currency] = { initialInvestment: 0, periodicPayment: 0 };
                }
                // Add initialInvestment if it exists (including 0)
                if (plan.initialInvestment !== null && plan.initialInvestment !== undefined) {
                  totalsByCurrency[currency].initialInvestment += Number(plan.initialInvestment);
                }
                // Add periodicPayment if it exists (including 0)
                if (plan.periodicPayment !== null && plan.periodicPayment !== undefined) {
                  totalsByCurrency[currency].periodicPayment += Number(plan.periodicPayment);
                }
              });

              // Only show summary if there are plans with financial data
              const hasFinancialData = Object.values(totalsByCurrency).some(
                (totals) => totals.initialInvestment > 0 || totals.periodicPayment > 0
              );

              if (!hasFinancialData && Object.keys(totalsByCurrency).length === 0) {
                return null;
              }

              // console.log(totalsByCurrency);

              return (
                <Paper sx={{ mt: 2, mb: 2, p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('financialFreedom.plansList.financialSummary')}
                    </ResponsiveTypography>
                    <Chip 
                      label={`${plans.length} ${plans.length === 1 ? t('financialFreedom.plansList.plan') : t('financialFreedom.plansList.plans')}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <Grid container spacing={2}>
                    {Object.entries(totalsByCurrency).map(([currency, totals]) => (
                      <Grid item xs={12} md={6} key={currency}>
                          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <WalletIcon color="primary" sx={{ fontSize: { xs: 16, sm: 18 } }} />
                                    <ResponsiveTypography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                                      {t('financialFreedom.plansList.totalInitialInvestment')}
                                    </ResponsiveTypography>
                                  </Box>
                                  <ResponsiveTypography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                                    {formatCurrency(totals.initialInvestment, currency)}
                                  </ResponsiveTypography>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <PaymentIcon color="secondary" sx={{ fontSize: { xs: 16, sm: 18 } }} />
                                    <ResponsiveTypography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                                      {t('financialFreedom.plansList.totalPeriodicPayment')}
                                    </ResponsiveTypography>
                                  </Box>
                                  <ResponsiveTypography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main', fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                                    {formatCurrency(totals.periodicPayment, currency)}
                                  </ResponsiveTypography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              );
            })()}
            <TableContainer 
            component={Paper} 
            sx={{ 
              mt: 2,
              overflowX: 'auto',
            }}
          >
            <Table sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>{t('common.name')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, minWidth: 150 }}>
                    {t('financialFreedom.step4.targetValue')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, minWidth: 120 }}>
                    {t('financialFreedom.planDetails.progress')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, minWidth: 120 }}>
                    {t('financialFreedom.step4.requiredReturnRate')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, minWidth: 150 }}>
                    {t('financialFreedom.planDetails.investmentTime')}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, minWidth: 120 }}>
                    {t('financialFreedom.plansList.links')}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, minWidth: 80 }}>
                    {t('common.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.map((plan) => {
                  const hasLinkedPortfolios = (plan.linkedPortfolioIds && plan.linkedPortfolioIds.length > 0) || (plan.linkedGoalIds && plan.linkedGoalIds.length > 0);
                  const linkedPortfolioCount = plan.linkedPortfolioIds?.length || 0;
                  const linkedGoalCount = plan.linkedGoalIds?.length || 0;
                  
                  // Calculate completion year
                  const calculateCompletionYear = (): number | null => {
                    if (plan.investmentYears) {
                      // Use startDate if available, otherwise fallback to createdAt
                      const startDate = plan.startDate || plan.createdAt;
                      if (startDate) {
                        const startYear = new Date(startDate).getFullYear();
                        return startYear + Math.ceil(plan.investmentYears);
                      }
                    }
                    return null;
                  };
                  const completionYear = calculateCompletionYear();

                  // Calculate time progress based on completion year
                  const calculateTimeProgress = (plan: FinancialFreedomPlan) => {
                    if (!plan.investmentYears) {
                      return null;
                    }

                    // Get start year from startDate or createdAt
                    const startDate = plan.startDate || plan.createdAt;
                    if (!startDate) {
                      return null;
                    }

                    const startYear = new Date(startDate).getFullYear();
                    const completionYear = startYear + Math.ceil(plan.investmentYears);
                    const currentYear = new Date().getFullYear();
                    
                    // Calculate total years from start to completion
                    const totalYears = completionYear - startYear;
                    
                    // Calculate elapsed years from start to current year
                    const elapsedYears = Math.max(0, Math.min(totalYears, currentYear - startYear + 1));
                    
                    // Calculate remaining years
                    const remainingYears = Math.max(0, totalYears - elapsedYears);

                    return {
                      elapsed: elapsedYears,
                      total: totalYears,
                      remaining: remainingYears,
                    };
                  };

                  return (
                    <PlanRow
                      key={plan.id}
                      plan={plan}
                      hasLinkedPortfolios={hasLinkedPortfolios}
                      linkedPortfolioCount={linkedPortfolioCount}
                      linkedGoalCount={linkedGoalCount}
                      completionYear={completionYear}
                      onRowClick={handleRowClick}
                      onActionMenuOpen={handleActionMenuOpen}
                      t={t}
                      formatCurrency={formatCurrency}
                      formatPercentageValue={formatPercentageValue}
                      calculateTimeProgress={calculateTimeProgress}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
            <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
              {t('financialFreedom.noPlans')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('financialFreedom.noPlansDescription')}
            </ResponsiveTypography>
            <ResponsiveButton variant="contained" onClick={handleCreateNew}>
              {t('financialFreedom.createFirstPlan')}
            </ResponsiveButton>
          </Paper>
        )}
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor?.element}
        open={!!actionMenuAnchor}
        onClose={handleActionMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => actionMenuAnchor && handleEditFromMenu(actionMenuAnchor.plan)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('common.edit')}</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => actionMenuAnchor && handleDeleteFromMenu(actionMenuAnchor.plan)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>{t('common.delete')}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Plan Detail Modal */}
      <PlanDetailModal
        open={!!planToView}
        plan={planToView}
        onClose={handleViewClose}
        onEdit={handleEditClick}
      />

      {/* Delete Confirmation Modal */}
      <ModalWrapper
        open={!!planToDelete}
        onClose={handleDeleteCancel}
        title={t('financialFreedom.delete.title')}
        icon={<WarningIcon color="error" />}
        titleColor="error"
        maxWidth="sm"
        disableCloseOnBackdrop={deletePlanMutation.isLoading}
        disableCloseOnEscape={deletePlanMutation.isLoading}
        loading={deletePlanMutation.isLoading}
        actions={
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <ResponsiveButton
              variant="outlined"
              onClick={handleDeleteCancel}
              disabled={deletePlanMutation.isLoading}
              sx={{ flex: 1 }}
            >
              {t('common.cancel')}
            </ResponsiveButton>
            <ResponsiveButton
              variant="contained"
              color="error"
              onClick={handleDeleteConfirm}
              disabled={deletePlanMutation.isLoading}
              sx={{ flex: 1 }}
            >
              {deletePlanMutation.isLoading ? t('common.deleting') : t('common.delete')}
            </ResponsiveButton>
          </Box>
        }
      >
        <Box>
          <ResponsiveTypography variant="body1" sx={{ mb: 2 }} ellipsis={false}>
            {t('financialFreedom.delete.message', { name: planToDelete?.name || '' })}
          </ResponsiveTypography>
          <Box
            sx={{
              p: 2,
              bgcolor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(211, 47, 47, 0.1)' 
                : 'rgba(211, 47, 47, 0.08)',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'error.light',
            }}
          >
            <ResponsiveTypography variant="body2" color="error.dark" ellipsis={false}>
              {t('financialFreedom.delete.warning')}
            </ResponsiveTypography>
          </Box>
        </Box>
      </ModalWrapper>

      <GoalPlanExplanationModal
        open={explanationModalOpen}
        onClose={() => setExplanationModalOpen(false)}
      />
    </Box>
  );
};

export default PlansList;

