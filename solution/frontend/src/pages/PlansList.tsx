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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  HelpOutline as HelpIcon,
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
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>{t('common.name')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {t('financialFreedom.form.investmentParameters.initialInvestment')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {t('financialFreedom.form.investmentParameters.periodicPayment')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {t('financialFreedom.step4.requiredReturnRate')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {t('financialFreedom.step4.remainingYears')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {t('financialFreedom.step4.targetValue')}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    {t('common.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.map((plan) => {
                  return (
                    <TableRow 
                      key={plan.id} 
                      hover
                      onClick={(e) => handleRowClick(plan, e)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {plan.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {plan.initialInvestment ? (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatCurrency(plan.initialInvestment, plan.baseCurrency || 'VND')}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t('common.na')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {plan.periodicPayment ? (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatCurrency(plan.periodicPayment, plan.baseCurrency || 'VND')}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t('common.na')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
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
                      <TableCell align="right">
                        {plan.investmentYears ? (
                          <Typography variant="body2">
                            {plan.investmentYears} {t('financialFreedom.scenario.years')}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t('common.na')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatCurrency(plan.futureValueRequired, plan.baseCurrency || 'VND')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title={t('common.actions')}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionMenuOpen(e, plan);
                            }}
                            aria-label={t('common.actions')}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
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

