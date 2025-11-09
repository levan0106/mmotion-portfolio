/**
 * Asset Allocation Timeline component - Wrapper for TimelineChart
 */

import React from 'react';
import { Box } from '@mui/material';
import TimelineChart, { TimelineDataPoint } from '../Charts';
import GranularitySelector, { GranularityType } from './GranularitySelector';
import ResponsiveTypography from '../Common/ResponsiveTypography';
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
    <Box sx={{
      px: { xs: 0, sm: 1 },
      mx: { xs: -3, sm: 0 } // Negative margin on mobile to extend to edges
    }}>
      {/* Custom Header with Title and GranularitySelector */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb:0,
        px: { xs: 1, sm: 0 }
      }}>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <ResponsiveTypography variant="chartTitle" gutterBottom>
            {title}
          </ResponsiveTypography>
          <ResponsiveTypography variant="chartSubtitle" color="text.secondary">
            {getSubtitle()}
          </ResponsiveTypography>
        </Box>
        
        {showGranularitySelector && onGranularityChange && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <GranularitySelector
            value={granularity}
              onChange={onGranularityChange}
              compact={compact}
            />
          </Box>
        )}
      </Box>

      <TimelineChart
        data={data}
        title="" // Empty title since we're using custom header
        subtitle="" // Empty subtitle since we're using custom header
        compact={compact}
        height={267}
        defaultChartType="bar"
        defaultBarType="stacked"
        showChartTypeToggle={false}
        showBarTypeToggle={false}
        yAxisDomain={[0, 100]}
        yAxisFormatter={(value: number) => formatPercentageValue(value, 1)}
        tooltipFormatter={(value: number) => formatPercentageValue(value, 1)}
      />
    </Box>
  );
};

export default AssetAllocationTimeline;
