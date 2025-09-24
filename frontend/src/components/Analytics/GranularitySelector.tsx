/**
 * Granularity Selector Component
 * Allows users to select between DAILY, WEEKLY, and MONTHLY granularity for timeline charts
 */

import React from 'react';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { CalendarToday, CalendarViewWeek, CalendarMonth } from '@mui/icons-material';

export type GranularityType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

interface GranularitySelectorProps {
  value: GranularityType;
  onChange: (granularity: GranularityType) => void;
  compact?: boolean;
  disabled?: boolean;
}

const GranularitySelector: React.FC<GranularitySelectorProps> = ({
  value,
  onChange,
  compact = false,
  disabled = false,
}) => {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newGranularity: GranularityType | null,
  ) => {
    if (newGranularity !== null) {
      onChange(newGranularity);
    }
  };

  const granularityOptions = [
    {
      value: 'DAILY' as GranularityType,
      label: 'Ngày',
      icon: <CalendarToday fontSize="small" />,
      tooltip: 'Xem theo ngày - chi tiết nhất',
    },
    {
      value: 'WEEKLY' as GranularityType,
      label: 'Tuần',
      icon: <CalendarViewWeek fontSize="small" />,
      tooltip: 'Xem theo tuần - cân bằng',
    },
    {
      value: 'MONTHLY' as GranularityType,
      label: 'Tháng',
      icon: <CalendarMonth fontSize="small" />,
      tooltip: 'Xem theo tháng - tổng quan',
    },
  ];

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      size="small"
      disabled={disabled}
      sx={{ 
        '& .MuiToggleButton-root': {
          fontSize: compact ? '0.5rem' : '0.6rem',
          px: compact ? 0.8 : 1.2,
          py: compact ? 0.4 : 0.6,
          minWidth: compact ? 'auto' : '50px',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }
      }}
    >
      {granularityOptions.map((option) => (
        <Tooltip key={option.value} title={option.tooltip} arrow>
          <ToggleButton value={option.value}>
            {option.icon}
            {!compact && <span>{option.label}</span>}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
};

export default GranularitySelector;
