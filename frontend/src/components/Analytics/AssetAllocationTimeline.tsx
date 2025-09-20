/**
 * Asset Allocation Timeline component - Wrapper for TimelineChart
 */

import React from 'react';
import TimelineChart, { TimelineDataPoint } from '../Charts';

interface AssetAllocationTimelineProps {
  data: TimelineDataPoint[];
  baseCurrency?: string;
  title?: string;
  compact?: boolean;
}

const AssetAllocationTimeline: React.FC<AssetAllocationTimelineProps> = ({
  data,
  title = 'Asset Allocation Timeline',
  compact = false,
}) => {
  return (
    <TimelineChart
      data={data}
      title={title}
      subtitle="Historical allocation changes over time"
      compact={compact}
      height={267}
      defaultChartType="bar"
      defaultBarType="stacked"
      yAxisDomain={[0, 100]}
      yAxisFormatter={(value: number) => `${value}%`}
      tooltipFormatter={(value: number) => `${value.toFixed(1)}%`}
    />
  );
};

export default AssetAllocationTimeline;