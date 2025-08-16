
import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface MarketShareItem {
  name: string;
  value: number;
  color?: string;
}

interface MarketShareChartProps {
  data: MarketShareItem[];
  title?: string;
  className?: string;
  height?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#45B39D', '#F5B041', '#EC7063'];

const MarketShareChart: React.FC<MarketShareChartProps> = ({
  data,
  title = 'Market Share Distribution',
  className,
  height = 300
}) => {
  // Filter out items with zero value and ensure we have proper data
  const filteredData = data
    .filter(item => item.value > 0)
    .map((item, index) => ({
      ...item,
      color: item.color || COLORS[index % COLORS.length]
    }));
  
  // Calculate total to add an "Others" segment if needed
  const total = filteredData.reduce((sum, item) => sum + item.value, 0);
  
  // If we have more than 5 items, group smaller ones as "Others"
  const processedData = filteredData.length > 5
    ? [
        ...filteredData.slice(0, 4),
        {
          name: 'Others',
          value: filteredData.slice(4).reduce((sum, item) => sum + item.value, 0),
          color: '#CCCCCC'
        }
      ]
    : filteredData;
  
  // Format percentages for labels
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  
  // Format value for tooltip
  const formatTooltip = (value: number) => {
    if (value >= 0.01) {
      return formatPercent(value);
    }
    return '< 1%';
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {processedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={processedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                labelLine={false}
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatTooltip(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400">
            No market share data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketShareChart;
