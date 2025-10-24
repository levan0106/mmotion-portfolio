import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  // Fab,
  Paper,
  Stack,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import { Add as AddIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import { Goal, GoalStatus, CreateGoalRequest, UpdateGoalRequest } from '../../types/goal.types';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useSetPrimaryGoal } from '../../hooks/useGoals';
import { useTranslation } from 'react-i18next';

interface GoalsListProps {
  accountId: string;
  portfolioId?: string;
}

export const GoalsList: React.FC<GoalsListProps> = ({ accountId, portfolioId }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: goals, isLoading, error } = useGoals(accountId, portfolioId);
  const createGoalMutation = useCreateGoal(accountId);
  const updateGoalMutation = useUpdateGoal(accountId);
  const deleteGoalMutation = useDeleteGoal(accountId);
  const setPrimaryGoalMutation = useSetPrimaryGoal(accountId);

  const filteredGoals = goals?.filter((goal: Goal) => {
    const matchesStatus = filterStatus === 'ALL' || goal.status === filterStatus;
    const matchesSearch = goal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }).sort((a: Goal, b: Goal) => {
    // Sắp xếp theo thứ tự ưu tiên giảm dần (priority cao nhất trước)
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // Giảm dần: 5, 4, 3, 2, 1
    }
    // Nếu cùng priority, sắp xếp theo ngày tạo giảm dần
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }) || [];

  const handleCreateGoal = (data: CreateGoalRequest) => {
    createGoalMutation.mutate(data, {
      onSuccess: () => {
        setShowForm(false);
      },
    });
  };

  const handleUpdateGoal = (data: UpdateGoalRequest) => {
    if (editingGoal) {
      updateGoalMutation.mutate(
        { id: editingGoal.id, data },
        {
          onSuccess: () => {
            setEditingGoal(null);
            setShowForm(false);
          },
        }
      );
    }
  };

  const handleDeleteGoal = (goal: Goal) => {
    deleteGoalMutation.mutate(goal.id);
  };

  const handleSetPrimaryGoal = (goal: Goal) => {
    setPrimaryGoalMutation.mutate(goal.id);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  // Calculate status counts
  const statusCounts = goals?.reduce((acc, goal) => {
    const status = goal.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {t('goals.list.error')}
      </Alert>
    );
  }

  return (
    <Box>
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
              {t('goals.list.title')}
            </ResponsiveTypography>
            <ResponsiveTypography 
              variant="pageSubtitle" 
              color="text.secondary"
              sx={{
                display: { xs: 'none', md: 'block' }
              }}
            >
              {t('goals.list.subtitle')}
            </ResponsiveTypography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ResponsiveButton
              variant="contained"
              icon={<AddIcon />}
              onClick={() => setShowForm(true)}
              mobileText={t('goals.create')}
              desktopText={t('goals.create')}
              breakpoint="sm"
              sx={{ borderRadius: 2 }}
            >
              {t('goals.create')}
            </ResponsiveButton>
          </Box>
        </Box>
        
      </Box>
      <Box sx={{ px:{xs: 0, sm: 4} }}>
        {/* Filter Toggle Button */}
        <Stack direction="row" alignItems="center" gap={2} mb={2}>
          <ResponsiveButton
            variant="outlined"
            icon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            mobileText={t('goals.list.filters')}
            desktopText={t('goals.list.filters')}
            breakpoint="sm"
            sx={{
              borderColor: 'divider',
              borderRadius: 2,
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50',
              },
            }}
          >
            {t('goals.list.filters')}
          </ResponsiveButton>
          {(searchTerm || filterStatus !== 'ALL') && (
            <ResponsiveButton
              variant="text"
              size="small"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('ALL');
              }}
              mobileText={t('goals.list.clearFilters')}
              desktopText={t('goals.list.clearFilters')}
              breakpoint="sm"
              sx={{ color: 'text.secondary' }}
            >
              {t('goals.list.clearFilters')}
            </ResponsiveButton>
          )}
        </Stack>

        {/* Filters Section - Conditional */}
        {showFilters && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 2, 
              mb: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
            }}
          >
            <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
              <TextField
                label={t('goals.list.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ minWidth: 250 }}
                placeholder={t('goals.list.searchPlaceholder')}
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>{t('goals.list.status')}</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as GoalStatus | 'ALL')}
                  label={t('goals.list.status')}
                >
                  <MenuItem value="ALL">{t('goals.list.allStatuses')}</MenuItem>
                  <MenuItem value={GoalStatus.ACTIVE}>{t('goals.status.active')}</MenuItem>
                  <MenuItem value={GoalStatus.ACHIEVED}>{t('goals.status.achieved')}</MenuItem>
                  <MenuItem value={GoalStatus.PAUSED}>{t('goals.status.paused')}</MenuItem>
                  <MenuItem value={GoalStatus.CANCELLED}>{t('goals.status.cancelled')}</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>
        )}

        {/* Status Summary */}
        {Object.keys(statusCounts).length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
              <ResponsiveTypography 
                variant="body2" 
                color="text.secondary" 
                mr={1}
              >
                {t('goals.list.overview')}:
              </ResponsiveTypography>
              {Object.entries(statusCounts).map(([status, count]) => (
                <Chip
                  key={status}
                  label={`${status}: ${count}`}
                  variant={filterStatus === status ? 'filled' : 'outlined'}
                  onClick={() => setFilterStatus(status as GoalStatus | 'ALL')}
                  clickable
                  size="small"
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: filterStatus === status ? 'primary.main' : 'action.hover' 
                    }
                  }}
                />
              ))}
            </Stack>
          </>
        )}
        {/* Goals Grid Section */}
        <Box sx={{ mt: 2 }}>
          {filteredGoals.length === 0 ? (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 6, 
                textAlign: 'center', 
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
              }}
            >
              <ResponsiveTypography 
                variant="h5" 
                color="text.secondary" 
                mb={1} 
                fontWeight={500}
              >
                {searchTerm || filterStatus !== 'ALL'
                  ? t('goals.list.noGoalsFiltered')
                  : t('goals.list.noGoals')}
              </ResponsiveTypography>
              <ResponsiveTypography 
                variant="body1" 
                color="text.secondary" 
                mb={3}
              >
                {searchTerm || filterStatus !== 'ALL'
                  ? t('goals.list.noGoalsFilteredMessage')
                  : t('goals.list.noGoalsMessage')}
              </ResponsiveTypography>
              <ResponsiveButton
                variant="contained"
                icon={<AddIcon />}
                onClick={() => setShowForm(true)}
                mobileText={searchTerm || filterStatus !== 'ALL' ? t('goals.list.clearFiltersAction') : t('goals.list.createFirstAction')}
                desktopText={searchTerm || filterStatus !== 'ALL' ? t('goals.list.clearFiltersAction') : t('goals.list.createFirstAction')}
                breakpoint="sm"
                sx={{ borderRadius: 2 }}
              >
                {searchTerm || filterStatus !== 'ALL'
                  ? t('goals.list.clearFiltersAction')
                  : t('goals.list.createFirstAction')}
              </ResponsiveButton>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {filteredGoals.map((goal: Goal) => (
                <Grid item xs={12} sm={6} md={4} lg={4} xl={3} key={goal.id}>
                  <GoalCard
                    goal={goal}
                    onEdit={handleEditGoal}
                    onDelete={handleDeleteGoal}
                    onSetPrimary={handleSetPrimaryGoal}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
      {/* Floating Action Button for Mobile */}
      {/* <Fab
        color="primary"
        aria-label="add goal"
        onClick={() => setShowForm(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <AddIcon />
      </Fab> */}

      {/* Goal Form Modal */}
      <GoalForm
        open={showForm}
        onClose={handleCloseForm}
        onSubmit={(data: CreateGoalRequest | UpdateGoalRequest) => {
          if (editingGoal) {
            handleUpdateGoal(data as UpdateGoalRequest);
          } else {
            handleCreateGoal(data as CreateGoalRequest);
          }
        }}
        goal={editingGoal || undefined}
        loading={createGoalMutation.isLoading || updateGoalMutation.isLoading}
        accountId={accountId}
      />
    </Box>
  );
};