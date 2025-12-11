import React, { useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Flag as GoalIcon,
  AccountBalance as PortfolioIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { FinancialFreedomPlan } from '../../types/financialFreedom.types';
import { useGoals } from '../../hooks/useGoals';
import { usePortfolios } from '../../hooks/usePortfolios';
import { useLinkGoalToPlan, useUnlinkGoalFromPlan, useLinkPortfolioToPlan, useUnlinkPortfolioFromPlan } from '../../hooks/useFinancialFreedomPlans';
import { useAccount } from '../../contexts/AccountContext';
import { useTranslation } from 'react-i18next';

interface PlanLinksSectionProps {
  plan: FinancialFreedomPlan;
  onPlanUpdate?: (updatedPlan: FinancialFreedomPlan) => void;
}

export const PlanLinksSection: React.FC<PlanLinksSectionProps> = ({ plan, onPlanUpdate }) => {
  const { t } = useTranslation();
  const { accountId } = useAccount();
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');

  // Fetch goals and portfolios
  const { data: goals } = useGoals(accountId || '');
  const { portfolios } = usePortfolios(accountId);

  // Link/unlink mutations
  const linkGoalMutation = useLinkGoalToPlan(accountId);
  const unlinkGoalMutation = useUnlinkGoalFromPlan(accountId);
  const linkPortfolioMutation = useLinkPortfolioToPlan(accountId);
  const unlinkPortfolioMutation = useUnlinkPortfolioFromPlan(accountId);

  // Get linked goals and portfolios
  const linkedGoalIds = plan.linkedGoalIds || [];
  const linkedPortfolioIds = plan.linkedPortfolioIds || [];

  const linkedGoals = goals?.filter(g => linkedGoalIds.includes(g.id)) || [];
  const linkedPortfolios = portfolios.filter(p => linkedPortfolioIds.includes(p.portfolioId)) || [];

  // Available goals/portfolios (not yet linked)
  const availableGoals = goals?.filter(g => !linkedGoalIds.includes(g.id)) || [];
  const availablePortfolios = portfolios.filter(p => !linkedPortfolioIds.includes(p.portfolioId)) || [];

  const handleLinkGoal = async () => {
    if (!selectedGoalId) return;
    try {
      const updatedPlan = await linkGoalMutation.mutateAsync({
        planId: plan.id,
        goalId: selectedGoalId,
      });
      setSelectedGoalId('');
      onPlanUpdate?.(updatedPlan);
    } catch (error) {
      console.error('Failed to link goal:', error);
    }
  };

  const handleUnlinkGoal = async (goalId: string) => {
    try {
      const updatedPlan = await unlinkGoalMutation.mutateAsync({
        planId: plan.id,
        goalId,
      });
      onPlanUpdate?.(updatedPlan);
    } catch (error) {
      console.error('Failed to unlink goal:', error);
    }
  };

  const handleLinkPortfolio = async () => {
    if (!selectedPortfolioId) return;
    try {
      const updatedPlan = await linkPortfolioMutation.mutateAsync({
        planId: plan.id,
        portfolioId: selectedPortfolioId,
      });
      setSelectedPortfolioId('');
      onPlanUpdate?.(updatedPlan);
    } catch (error) {
      console.error('Failed to link portfolio:', error);
    }
  };

  const handleUnlinkPortfolio = async (portfolioId: string) => {
    try {
      const updatedPlan = await unlinkPortfolioMutation.mutateAsync({
        planId: plan.id,
        portfolioId,
      });
      onPlanUpdate?.(updatedPlan);
    } catch (error) {
      console.error('Failed to unlink portfolio:', error);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Left Column: Linked Portfolios Section */}
        <Grid item xs={12} md={6}>
          <Box>
            <ResponsiveTypography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PortfolioIcon fontSize="small" color="primary" />
              {t('financialFreedom.planDetails.linksSection.linkedPortfolios')}
            </ResponsiveTypography>
            
            {linkedPortfolios.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                {linkedPortfolios.map((portfolio) => (
                  <Chip
                    key={portfolio.portfolioId}
                    label={portfolio.name}
                    icon={<PortfolioIcon />}
                    onDelete={() => handleUnlinkPortfolio(portfolio.portfolioId)}
                    color="primary"
                    variant="outlined"
                    deleteIcon={
                      unlinkPortfolioMutation.isLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <CloseIcon />
                      )
                    }
                  />
                ))}
              </Box>
            ) : (
              <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('financialFreedom.planDetails.linksSection.noLinkedPortfolios')}
              </ResponsiveTypography>
            )}

            {/* Add Portfolio */}
            {availablePortfolios.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
                  <InputLabel>{t('financialFreedom.planDetails.linksSection.selectPortfolioToLink')}</InputLabel>
                  <Select
                    value={selectedPortfolioId}
                    label={t('financialFreedom.planDetails.linksSection.selectPortfolioToLink')}
                    onChange={(e) => setSelectedPortfolioId(e.target.value)}
                  >
                    {availablePortfolios.map((portfolio) => (
                      <MenuItem key={portfolio.portfolioId} value={portfolio.portfolioId}>
                        {portfolio.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton
                  color="primary"
                  onClick={handleLinkPortfolio}
                  disabled={!selectedPortfolioId || linkPortfolioMutation.isLoading}
                  size="large"
                >
                  {linkPortfolioMutation.isLoading ? <CircularProgress size={20} /> : <AddIcon />}
                </IconButton>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Right Column: Linked Goals Section */}
        <Grid item xs={12} md={6}>
          <Box>
            <ResponsiveTypography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
              <GoalIcon fontSize="small" color="warning" />
              {t('financialFreedom.planDetails.linksSection.linkedGoals')}
            </ResponsiveTypography>
            
            {linkedGoals.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                {linkedGoals.map((goal) => (
                  <Chip
                    key={goal.id}
                    label={goal.name}
                    icon={<GoalIcon />}
                    onDelete={() => handleUnlinkGoal(goal.id)}
                    color="warning"
                    variant="outlined"
                    deleteIcon={
                      unlinkGoalMutation.isLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <CloseIcon />
                      )
                    }
                  />
                ))}
              </Box>
            ) : (
              <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('financialFreedom.planDetails.linksSection.noLinkedGoals')}
              </ResponsiveTypography>
            )}

            {/* Add Goal */}
            {availableGoals.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
                  <InputLabel>{t('financialFreedom.planDetails.linksSection.selectGoalToLink')}</InputLabel>
                  <Select
                    value={selectedGoalId}
                    label={t('financialFreedom.planDetails.linksSection.selectGoalToLink')}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                  >
                    {availableGoals.map((goal) => (
                      <MenuItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton
                  color="primary"
                  onClick={handleLinkGoal}
                  disabled={!selectedGoalId || linkGoalMutation.isLoading}
                  size="large"
                >
                  {linkGoalMutation.isLoading ? <CircularProgress size={20} /> : <AddIcon />}
                </IconButton>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

