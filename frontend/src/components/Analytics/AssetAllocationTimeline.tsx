/**
 * Asset Allocation Timeline component - Wrapper for TimelineChart
 */

import React from 'react';
import { Box } from '@mui/material';
import TimelineChart, { TimelineDataPoint } from '../Charts';
import GranularitySelector, { GranularityType } from './GranularitySelector';
import { formatPercentageValue } from '../../utils/format';

interface AssetAllocationTimelineProps {
  data: TimelineDataPoint[];
  baseCurrency?: string;
  title?: string;
  compact?: boolean;
  granularity?: GranularityType;
  onGranularityChange?: (granularity: GranularityType) => void;
  showGranularitySelector?: boolean;
}

const AssetAllocationTimeline: React.FC<AssetAllocationTimelineProps> = ({
  data,
  title = '',
  compact = false,
  granularity = 'DAILY',
  onGranularityChange,
  showGranularitySelector = true,
}) => {
  const getSubtitle = () => {
    const granularityLabels = {
      DAILY: 'Thay đổi phân bổ theo ngày',
      WEEKLY: 'Thay đổi phân bổ theo tuần', 
      MONTHLY: 'Thay đổi phân bổ theo tháng'
    };
    return granularityLabels[granularity] || 'Historical allocation changes over time';
  };

  return (
    <Box>
      {showGranularitySelector && onGranularityChange && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: compact ? 0.5 : 0.8 }}>
          <GranularitySelector
            value={granularity}
            onChange={onGranularityChange}
            compact={compact}
          />
        </Box>
      )}
      <TimelineChart
        data={data}
        title={title}
        subtitle={getSubtitle()}
        compact={compact}
        height={267}
        defaultChartType="bar"
        defaultBarType="stacked"
        yAxisDomain={[0, 100]}
        yAxisFormatter={(value: number) => formatPercentageValue(value, 1)}
        tooltipFormatter={(value: number) => formatPercentageValue(value, 1)}
      />
    </Box>
  );
};

export default AssetAllocationTimeline;