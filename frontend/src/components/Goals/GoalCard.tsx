import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
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
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
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

const getProgressStatus = (goal: any, t: any) => {
  const { achievementPercentage, isOverdue, createdAt, targetDate } = goal;
  
  if (isOverdue) {
    return t('goals.card.status.overdue');
  }
  
  if (achievementPercentage >= 100) {
    return t('goals.card.status.completed');
  }
  
  // Nếu không có targetDate, chỉ đánh giá theo tiến độ
  if (!targetDate) {
    if (achievementPercentage >= 80) {
      return t('goals.card.status.excellent');
    } else if (achievementPercentage >= 50) {
      return t('goals.card.status.okay');
    } else {
      return t('goals.card.status.good');
    }
  }
  
  // Tính thời gian còn lại và phần trăm cần hoàn thành
  const now = new Date();
  const start = new Date(createdAt); // Sử dụng createdAt làm ngày bắt đầu
  const target = new Date(targetDate);
  const totalDuration = target.getTime() - start.getTime();
  const remainingDuration = target.getTime() - now.getTime();
  console.log("start date", createdAt, "target date", targetDate);
  const timeRemaining = Math.max(remainingDuration / totalDuration, 0);
  const remainingProgress = 100 - achievementPercentage;
  console.log(timeRemaining, remainingProgress);
  // Chỉ cảnh báo khi % thời gian còn lại < % cần hoàn thành
  const isTimeCritical = timeRemaining * 100 < remainingProgress;
  
  if (isTimeCritical) {
    // Thời gian còn lại ít hơn phần trăm cần hoàn thành
    if (remainingProgress > 50) {
      return t('goals.card.status.dangerous');
    } else if (remainingProgress > 30) {
      return t('goals.card.status.urgent');
    } else {
      return t('goals.card.status.attention');
    }
  } else {
    // Thời gian còn đủ, đánh giá theo tiến độ
    if (achievementPercentage >= 80) {
      return t('goals.card.status.excellent');
    } else if (achievementPercentage >= 50) {
      return t('goals.card.status.okay');
    } else {
      return t('goals.card.status.good');
    }
  }
};

const getProgressTooltip = (goal: any, t: any) => {
  const { achievementPercentage, isOverdue, createdAt, targetDate } = goal;
  
  if (isOverdue) {
    return t('goals.card.tooltip.overdue');
  }
  
  if (achievementPercentage >= 100) {
    return t('goals.card.tooltip.completed');
  }
  
  // Nếu không có targetDate, hiển thị thông tin đơn giản
  if (!targetDate) {
    const remainingProgress = 100 - achievementPercentage;
    return t('goals.card.tooltip.noTargetDate', {
      progress: Math.round(achievementPercentage),
      remaining: Math.round(remainingProgress)
    });
  }
  
  // Tính toán chi tiết
  const now = new Date();
  const start = new Date(createdAt);
  const target = new Date(targetDate);
  const totalDuration = target.getTime() - start.getTime();
  const remainingDuration = target.getTime() - now.getTime();
  const timeRemaining = Math.max(remainingDuration / totalDuration, 0);
  const remainingProgress = 100 - achievementPercentage;
  const isTimeCritical = timeRemaining * 100 < remainingProgress;
  
  const timeRemainingPercent = Math.round(timeRemaining * 100);
  const daysRemaining = Math.ceil(remainingDuration / (1000 * 60 * 60 * 24));
  
  if (isTimeCritical) {
    return t('goals.card.tooltip.warning', {
      timePercent: timeRemainingPercent,
      days: daysRemaining.toLocaleString(),
      progressPercent: Math.round(remainingProgress)
    });
  } else {
    return t('goals.card.tooltip.safe', {
      timePercent: timeRemainingPercent,
      days: daysRemaining.toLocaleString(),
      progressPercent: Math.round(remainingProgress)
    });
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
      return `${goal.daysRemaining.toLocaleString()} ${t('goals.card.daysRemaining')}`;
    }
    return `${t('goals.card.overdue')} ${Math.abs(goal.daysRemaining).toLocaleString()} ${t('goals.card.daysRemaining')}`;
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
          <Stack direction="row" alignItems="center" gap={1} spacing={1} sx={{ minWidth: 0, flex: 1 }}>
            {getProgressIcon()}
            <Tooltip title={goal.name} placement="top" arrow>
              <ResponsiveTypography 
                variant="cardTitle" 
                component="div" 
                fontWeight={600}
              >
                {goal.name}
              </ResponsiveTypography>
            </Tooltip>
            {goal.isPrimary && (
              <Chip 
                icon={<StarIcon />}
                label={t('goals.card.primary')} 
                size="small" 
                color="primary" 
                variant="filled"
                sx={{ fontWeight: 500, flexShrink: 0 }}
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
          <Box sx={{ flexShrink: 0 }}>
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
        sx={{ 
          pb: 1,
          '& .MuiCardHeader-content': {
            minWidth: 0,
            overflow: 'hidden'
          },
          '& .MuiCardHeader-action': {
            flexShrink: 0,
            alignSelf: 'flex-start'
          }
        }}
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
            <ResponsiveTypography variant="cardLabel" color="text.secondary" fontWeight={500}>
              {t('goals.card.progress')}
            </ResponsiveTypography>
            <Stack direction="row" alignItems="center" gap={1}>
              <ResponsiveTypography 
                variant="cardValue" 
                fontWeight={700} 
                sx={{ 
                  color: getProgressColor(goal),
                  transition: 'color 0.3s ease'
                }}
              >
                {formatPercentage(goal.achievementPercentage,1)}
              </ResponsiveTypography>
              <Tooltip title={getProgressTooltip(goal, t)} placement="top" arrow>
                <Chip 
                  label={getProgressStatus(goal, t)}
                  size="small"
                  sx={{ 
                    backgroundColor: getProgressColor(goal),
                    color: 'white',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    height: 20,
                    cursor: 'help'
                  }}
                />
              </Tooltip>
            </Stack>
          </Stack>
          <Tooltip title={getProgressTooltip(goal, t)} placement="top" arrow>
            <LinearProgress
              variant="determinate"
              value={Math.min(goal.achievementPercentage, 100)}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'grey.200',
                cursor: 'help',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getProgressColor(goal),
                  borderRadius: 4,
                  transition: 'background-color 0.3s ease'
                }
              }}
            />
          </Tooltip>
          
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
            <ResponsiveTypography variant="caption" color="text.secondary">
              {formatCurrency(goal.currentValue)} / {formatCurrency(goal.targetValue)}
            </ResponsiveTypography>
          </Stack>
        </Paper>

        {/* Values Section */}
        <Stack spacing={{ xs: 1, sm: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <ResponsiveTypography variant="cardLabel" color="text.secondary" fontWeight={500}>
              {t('goals.card.currentValue')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="cardValue" fontWeight={600}>
              {formatCurrency(goal.currentValue)}
            </ResponsiveTypography>
          </Stack>

          {goal.targetValue && (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <ResponsiveTypography variant="cardLabel" color="text.secondary" fontWeight={500}>
                {t('goals.card.target')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" fontWeight={600}>
                {formatCurrency(goal.targetValue)}
              </ResponsiveTypography>
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
                        background: 'linear-gradient(to right, #e3f2fd 0%, #bbdefb 25%, #90caf9 50%, #64b5f6 75%, #1976d2 100%)',
                        height: 4,
                      },
                      '& .MuiSlider-thumb': {
                        backgroundColor: goal.priority === 1 ? '#e3f2fd' : 
                                       goal.priority === 2 ? '#bbdefb' : 
                                       goal.priority === 3 ? '#90caf9' : 
                                       goal.priority === 4 ? '#64b5f6' : '#1976d2',
                        width: 16,
                        height: 16,
                        border: '1px solid grey.400',
                      },
                      '& .MuiSlider-mark': {
                        backgroundColor: 'transparent',
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: '#e0e0e0',
                        height: 4,
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
