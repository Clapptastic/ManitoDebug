import React, { useState } from 'react';
import { EnhancedCostAnalysisChart } from './enhanced/EnhancedCostAnalysisChart';

interface CostAnalysisChartProps {
  data?: any[];
}

export const CostAnalysisChart: React.FC<CostAnalysisChartProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <EnhancedCostAnalysisChart 
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
    />
  );
};