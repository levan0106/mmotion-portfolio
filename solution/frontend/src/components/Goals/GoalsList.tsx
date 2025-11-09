import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Alert,
  CircularProgress,
  // Fab,
  Paper,
  Stack,
  Divider,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  LinearProgress,
  Slider,
  Menu,
  MenuItem,
} from '@mui/material';
import { 
  Add as AddIcon, 
  FilterList as FilterIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  MoreVert as MoreVertIcon,
  Star as StarIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import { Goal, GoalStatus, CreateGoalRequest, UpdateGoalRequest } from '../../types/goal.types';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useSetPrimaryGoal } from '../../hooks/useGoals';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatPercentage } from '../../utils/format';

interface GoalsListProps {
  accountId: string;
  portfolioId?: string;
}

const getStatusColor = (status: GoalStatus) => {
  switch (status) {
    case GoalStatus.ACTIVE:
      return 'primary';
    case GoalStatus.ACHIEVED:
      return 'success';
    case GoalStatus.PAUSED:
      return 'warning';
    case GoalStatus.CANCELLED:
      return 'error';
    default:
      return 'default';
  }
};

const getProgressColor = (goal: any) => {
  const { achievementPercentage, isOverdue, createdAt, targetDate } = goal;
  
  // Nếu đã quá hạn
  if (isOverdue) {
    return '#f44336'; // Red for overdue
  }
  
  // Nếu đã đạt 100%
  if (achievementPercentage >= 100) {
    return '#4caf50'; // Green for achieved
  }
  
  // Nếu không có targetDate, chỉ đánh giá theo tiến độ
  if (!targetDate) {
    if (achievementPercentage >= 80) {
      return '#4caf50'; // Xanh lá - tốt
    } else if (achievementPercentage >= 50) {
      return '#2196f3'; // Xanh dương - ổn
    } else {
      return '#03a9f4'; // Xanh dương nhạt - bình thường
    }
  }
  
  // Tính thời gian còn lại
  const now = new Date();
  const start = new Date(createdAt); // Sử dụng createdAt làm ngày bắt đầu
  const target = new Date(targetDate);
  const totalDuration = target.getTime() - start.getTime();
  const remainingDuration = target.getTime() - now.getTime();
  
  // Tính tỷ lệ thời gian còn lại
  const timeRemaining = Math.max(remainingDuration / totalDuration, 0);
  
  // Tính phần trăm cần hoàn thành còn lại
  const remainingProgress = 100 - achievementPercentage;
  
  // Chỉ cảnh báo khi % thời gian còn lại < % cần hoàn thành
  const isTimeCritical = timeRemaining * 100 < remainingProgress;
  
  if (isTimeCritical) {
    // Thời gian còn lại ít hơn phần trăm cần hoàn thành
    if (remainingProgress > 50) {
      return '#f44336'; // Đỏ - rất nguy hiểm
    } else if (remainingProgress > 30) {
      return '#ff5722'; // Cam đậm - nguy hiểm
    } else {
      return '#ff9800'; // Cam - cần chú ý
    }
  } else {
    // Thời gian còn đủ, đánh giá theo tiến độ
    if (achievementPercentage >= 80) {
      return '#4caf50'; // Xanh lá - tốt
    } else if (achievementPercentage >= 50) {
      return '#2196f3'; // Xanh dương - ổn
    } else {
      return '#03a9f4'; // Xanh dương nhạt - bình thường
    }
  }
};

export const GoalsList: React.FC<GoalsListProps> = ({ accountId, portfolioId }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tableMenuAnchor, setTableMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});

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

  // Pagination for table view
  const paginatedGoals = viewMode === 'table' 
    ? filteredGoals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : filteredGoals;

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

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTableMenuClick = (event: React.MouseEvent<HTMLElement>, goalId: string) => {
    setTableMenuAnchor(prev => ({
      ...prev,
      [goalId]: event.currentTarget
    }));
  };

  const handleTableMenuClose = (goalId: string) => {
    setTableMenuAnchor(prev => ({
      ...prev,
      [goalId]: null
    }));
  };

  const handleTableAction = (action: () => void, goalId: string) => {
    action();
    handleTableMenuClose(goalId);
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
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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

        {/* Status Summary and View Mode Toggle */}
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center" justifyContent="space-between">
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            <ResponsiveTypography 
              variant="body2" 
              color="text.secondary" 
              mr={1}
            >
              {t('goals.list.overview')}:
            </ResponsiveTypography>
            {Object.keys(statusCounts).length > 0 && Object.entries(statusCounts).map(([status, count]) => (
              <Chip
                key={status}
                label={`${t(`goals.status.${status.toLowerCase()}`, status)}: ${count}`}
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
          
          {/* View Mode Toggle */}
          <Paper 
            elevation={0} 
            sx={{ 
              display: 'flex', 
              border: '1px solid', 
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Tooltip title={t('goals.list.gridView', 'Xem dạng lưới')}>
              <IconButton
                onClick={() => setViewMode('grid')}
                sx={{
                  backgroundColor: viewMode === 'grid' ? 'primary.main' : 'transparent',
                  color: viewMode === 'grid' ? 'primary.contrastText' : 'text.secondary',
                  borderRadius: 0,
                  '&:hover': {
                    backgroundColor: viewMode === 'grid' ? 'primary.dark' : 'action.hover',
                  }
                }}
                size="small"
              >
                <GridViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('goals.list.tableView', 'Xem dạng bảng')}>
              <IconButton
                onClick={() => setViewMode('table')}
                sx={{
                  backgroundColor: viewMode === 'table' ? 'primary.main' : 'transparent',
                  color: viewMode === 'table' ? 'primary.contrastText' : 'text.secondary',
                  borderRadius: 0,
                  '&:hover': {
                    backgroundColor: viewMode === 'table' ? 'primary.dark' : 'action.hover',
                  }
                }}
                size="small"
              >
                <ListViewIcon />
              </IconButton>
            </Tooltip>
          </Paper>
        </Stack>
        {/* Goals Display Section */}
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
          ) : viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {filteredGoals.map((goal: Goal) => (
                <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={goal.id}>
                  <GoalCard
                    goal={goal}
                    onEdit={handleEditGoal}
                    onDelete={handleDeleteGoal}
                    onSetPrimary={handleSetPrimaryGoal}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{ 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{t('goals.card.name', 'Tên mục tiêu') || 'Tên mục tiêu'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('goals.form.status', 'Trạng thái') || 'Trạng thái'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('goals.card.progress', 'Tiến độ') || 'Tiến độ'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('goals.card.currentValue', 'Giá trị hiện tại') || 'Giá trị hiện tại'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('goals.card.target', 'Mục tiêu') || 'Mục tiêu'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('goals.form.priority', 'Độ ưu tiên') || 'Độ ưu tiên'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('goals.card.date', 'Thời gian') || 'Thời gian'}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{t('common.actions', 'Thao tác') || 'Thao tác'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedGoals.map((goal: Goal) => (
                    <TableRow 
                      key={goal.id}
                      hover
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {goal.isPrimary && (
                            <Chip 
                              icon={<StarIcon />}
                              label={t('goals.card.primary')} 
                              size="small" 
                              color="primary" 
                              variant="filled"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                          <ResponsiveTypography variant="body2" fontWeight={500}>
                            {goal.name}
                          </ResponsiveTypography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t(`goals.status.${goal.status.toLowerCase()}`, goal.status)}
                          size="small"
                          color={getStatusColor(goal.status) as any}
                          sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 60 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(goal.achievementPercentage, 100)}
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getProgressColor(goal),
                                  borderRadius: 3,
                                }
                              }}
                            />
                          </Box>
                          <ResponsiveTypography variant="body2" fontWeight={600}>
                            {formatPercentage(goal.achievementPercentage, 1) || '0%'}
                          </ResponsiveTypography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <ResponsiveTypography variant="body2" fontWeight={500}>
                          {formatCurrency(goal.currentValue) || '0 VND'}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell>
                        <ResponsiveTypography variant="body2" fontWeight={500}>
                          {goal.targetValue ? (formatCurrency(goal.targetValue) || '0 VND') : '-'}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 40 }}>
                            <Slider
                              value={goal.priority}
                              min={1}
                              max={5}
                              step={1}
                              disabled
                              size="small"
                              sx={{
                                '& .MuiSlider-track': {
                                  background: 'linear-gradient(to right, #e3f2fd 0%, #bbdefb 25%, #90caf9 50%, #64b5f6 75%, #1976d2 100%)',
                                  height: 3,
                                },
                                '& .MuiSlider-thumb': {
                                  backgroundColor: goal.priority === 1 ? '#e3f2fd' : 
                                                 goal.priority === 2 ? '#bbdefb' : 
                                                 goal.priority === 3 ? '#90caf9' : 
                                                 goal.priority === 4 ? '#64b5f6' : '#1976d2',
                                  width: 12,
                                  height: 12,
                                },
                                '& .MuiSlider-rail': {
                                  backgroundColor: '#e0e0e0',
                                  height: 3,
                                }
                              }}
                            />
                          </Box>
                          <ResponsiveTypography variant="body2" fontWeight={500}>
                            {goal.priority}/5
                          </ResponsiveTypography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {goal.daysRemaining ? (
                          <Chip
                            label={goal.daysRemaining > 0 
                              ? `${goal.daysRemaining.toLocaleString()} ${t('goals.card.daysRemaining')}`
                              : `${t('goals.card.overdue')} ${Math.abs(goal.daysRemaining).toLocaleString()} ${t('goals.card.daysRemaining')}`
                            }
                            size="small"
                            color={goal.isOverdue ? 'error' : 'default'}
                            variant={goal.isOverdue ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                          />
                        ) : (
                          <ResponsiveTypography variant="body2" color="text.secondary">
                            -
                          </ResponsiveTypography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title={t('goals.options')}>
                            <IconButton 
                              onClick={(event) => handleTableMenuClick(event, goal.id)}
                              size="small"
                              sx={{ color: 'text.secondary' }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                          <Menu
                            anchorEl={tableMenuAnchor[goal.id]}
                            open={Boolean(tableMenuAnchor[goal.id])}
                            onClose={() => handleTableMenuClose(goal.id)}
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'right',
                            }}
                            transformOrigin={{
                              vertical: 'top',
                              horizontal: 'right',
                            }}
                          >
                            <MenuItem onClick={() => handleTableAction(() => handleEditGoal(goal), goal.id)}>
                              {t('goals.edit')}
                            </MenuItem>
                            {!goal.isPrimary && (
                              <MenuItem onClick={() => handleTableAction(() => handleSetPrimaryGoal(goal), goal.id)}>
                                {t('goals.setPrimary')}
                              </MenuItem>
                            )}
                            <MenuItem 
                              onClick={() => handleTableAction(() => handleDeleteGoal(goal), goal.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon sx={{ mr: 1, fontSize: '1rem' }} />
                              {t('goals.delete')}
                            </MenuItem>
                          </Menu>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredGoals.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage={t('goals.list.rowsPerPage', 'Số dòng')}
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} ${t('goals.list.of', 'của') || 'của'} ${count}`
                }
                size="small"
              />
            </TableContainer>
          )}
        </Box>
      </Box>

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