
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface TrendDataPoint {
  name: string;
  value: number;
  date?: string;
}

export interface TrendSeries {
  name: string;
  data: TrendDataPoint[];
  color?: string;
}

interface TrendChartProps {
  series: TrendSeries[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  className?: string;
  height?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];

const TrendChart: React.FC<TrendChartProps> = ({
  series,
  title = 'Trend Analysis',
  xAxisLabel = 'Time',
  yAxisLabel = 'Value',
  className,
  height = 300
}) => {
  // Process data to match recharts format
  const processData = () => {
    if (!series || series.length === 0) {
      return [];
    }

    // Get all unique x-axis values
    const allDates = new Set<string>();
    series.forEach(s => {
      s.data.forEach(d => {
        allDates.add(d.name);
      });
    });

    // Create consolidated data points
    const sortedDates = Array.from(allDates).sort();
    return sortedDates.map(date => {
      const point: any = { name: date };
      series.forEach(s => {
        const found = s.data.find(d => d.name === date);
        point[s.name] = found ? found.value : null;
      });
      return point;
    });
  };

  const data = processData();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={{ value: xAxisLabel, position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {series.map((s, i) => (
                <Line
                  key={`line-${s.name}`}
                  type="monotone"
                  dataKey={s.name}
                  stroke={s.color || COLORS[i % COLORS.length]}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400">
            No trend data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChart;
