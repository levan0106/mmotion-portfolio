import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  LinearProgress,
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Stack,
  Divider,
  Paper,
  Slider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { Goal, GoalStatus } from '../../types/goal.types';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { useTranslation } from 'react-i18next';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  onSetPrimary?: (goal: Goal) => void;
  onViewDetails?: (goal: Goal) => void;
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

const getProgressStatusColor = (progressStatus: string) => {
  switch (progressStatus) {
    case 'ACHIEVED':
      return 'success';
    case 'ON_TRACK':
      return 'primary';
    case 'MODERATE':
      return 'warning';
    case 'NEEDS_ATTENTION':
      return 'error';
    case 'OVERDUE':
      return 'error';
    default:
      return 'default';
  }
};


export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onSetPrimary,
  onViewDetails,
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: () => void) => {
    action();
    handleClose();
  };

  const getProgressIcon = () => {
    if (goal.isAchieved) {
      return <CheckCircleIcon color="success" />;
    }
    if (goal.isOverdue) {
      return <WarningIcon color="error" />;
    }
    if (goal.achievementPercentage >= 80) {
      return <TrendingUpIcon color="primary" />;
    }
    if (goal.achievementPercentage >= 50) {
      return <ScheduleIcon color="warning" />;
    }
    return <TrendingDownIcon color="error" />;
  };

  const getDaysRemainingText = () => {
    if (!goal.daysRemaining) return null;
    if (goal.daysRemaining > 0) {
      return `${goal.daysRemaining} ${t('goals.card.daysRemaining')}`;
    }
    return `${t('goals.card.overdue')} ${Math.abs(goal.daysRemaining)} ${t('goals.card.daysRemaining')}`;
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: 1,
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" gap={1} spacing={1}>
            {getProgressIcon()}
            <Typography variant="h6" component="div" noWrap fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              {goal.name}
            </Typography>
            {goal.isPrimary && (
              <Chip 
                icon={<StarIcon />}
                label={t('goals.card.primary')} 
                size="small" 
                color="primary" 
                variant="filled"
                sx={{ fontWeight: 500 }}
              />
            )}
          </Stack>
        }
        subheader={
          <Stack direction="row" gap={1} flexWrap="wrap" mt={1} minHeight={32}>
            {getDaysRemainingText() ? (
              <Chip
                label={getDaysRemainingText()}
                size="small"
                color={goal.isOverdue ? 'error' : 'default'}
                variant={goal.isOverdue ? 'filled' : 'outlined'}
                sx={{ fontWeight: 500 }}
              />
            ) : (
              <Box sx={{ height: 24 }} /> // Placeholder để giữ chiều cao
            )}
          </Stack>
        }
        action={
          <Box>
            <Tooltip title={t('goals.options')}>
              <IconButton 
                onClick={handleClick}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'action.hover' 
                  } 
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {onViewDetails && (
                <MenuItem onClick={() => handleAction(() => onViewDetails(goal))}>
                  {t('goals.viewDetails')}
                </MenuItem>
              )}
              {onEdit && (
                <MenuItem onClick={() => handleAction(() => onEdit(goal))}>
                  {t('goals.edit')}
                </MenuItem>
              )}
              {!goal.isPrimary && onSetPrimary && (
                <MenuItem onClick={() => handleAction(() => onSetPrimary(goal))}>
                  {t('goals.setPrimary')}
                </MenuItem>
              )}
              {onDelete && (
                <MenuItem onClick={() => handleAction(() => onDelete(goal))}>
                  {t('goals.delete')}
                </MenuItem>
              )}
            </Menu>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      
      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
        {/* Progress Section - Simple Design */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            mb: { xs: 1.5, sm: 2 }, 
            backgroundColor: 'grey.50',
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {t('goals.card.progress')}
            </Typography>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              {formatPercentage(goal.achievementPercentage)}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(goal.achievementPercentage, 100)}
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getProgressStatusColor(goal.progressStatus) === 'success' ? '#4caf50' :
                               getProgressStatusColor(goal.progressStatus) === 'primary' ? '#2196f3' :
                               getProgressStatusColor(goal.progressStatus) === 'warning' ? '#ff9800' :
                               getProgressStatusColor(goal.progressStatus) === 'error' ? '#f44336' : '#9e9e9e',
                borderRadius: 4
              }
            }}
          />
          
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {formatCurrency(goal.currentValue)} / {formatCurrency(goal.targetValue)}
            </Typography>
          </Stack>
        </Paper>

        {/* Values Section */}
        <Stack spacing={{ xs: 1, sm: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {t('goals.card.currentValue')}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatCurrency(goal.currentValue)}
            </Typography>
          </Stack>

          {goal.targetValue && (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {t('goals.card.target')}
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {formatCurrency(goal.targetValue)}
              </Typography>
            </Stack>
          )}


          <Divider sx={{ my: 1 }} />

          {/* Status and Priority in one row - 50% each */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'left' }}>
              <Chip
                label={goal.status}
                size="small"
                color={getStatusColor(goal.status) as any}
                sx={{ fontWeight: 500, fontSize: '0.75rem' }}
              />
            </Box>
            
            <Box sx={{ flex: 1, px: 1 }}>
              <Tooltip 
                title={`${t('goals.form.priority')}: ${goal.priority === 5 ? t('goals.priority.highest') : 
                                       goal.priority === 4 ? t('goals.priority.high') : 
                                       goal.priority === 3 ? t('goals.priority.medium') : 
                                       goal.priority === 2 ? t('goals.priority.low') : t('goals.priority.lowest')} (${goal.priority}/5)`}
                placement="top"
                arrow
              >
                <Box>
                  <Slider
                    value={goal.priority}
                    min={1}
                    max={5}
                    step={1}
                    marks={[
                      { value: 1 },
                      { value: 2 },
                      { value: 3 },
                      { value: 4 },
                      { value: 5 }
                    ]}
                    disabled
                    size="small"
                    sx={{
                      '& .MuiSlider-track': {
                        backgroundColor: goal.priority === 1 ? '#757575' : 
                                       goal.priority === 2 ? '#1976d2' : 
                                       goal.priority === 3 ? '#388e3c' : 
                                       goal.priority === 4 ? '#f57c00' : '#d32f2f',
                      },
                      '& .MuiSlider-thumb': {
                        backgroundColor: goal.priority === 1 ? '#757575' : 
                                       goal.priority === 2 ? '#1976d2' : 
                                       goal.priority === 3 ? '#388e3c' : 
                                       goal.priority === 4 ? '#f57c00' : '#d32f2f',
                        width: 12,
                        height: 12,
                      },
                      '& .MuiSlider-mark': {
                        backgroundColor: 'transparent',
                      }
                    }}
                  />
                </Box>
              </Tooltip>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
