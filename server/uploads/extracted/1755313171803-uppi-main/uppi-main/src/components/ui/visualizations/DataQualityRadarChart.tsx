
import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataQualityMetric {
  subject: string;
  value: number;
  fullMark: number;
}

interface DataQualityRadarChartProps {
  metrics: {
    completeness?: number;
    accuracy?: number;
    reliability?: number;
    timeliness?: number;
    consistency?: number;
    [key: string]: number | undefined;
  };
  title?: string;
  className?: string;
}

const DataQualityRadarChart: React.FC<DataQualityRadarChartProps> = ({ 
  metrics, 
  title = 'Data Quality Metrics',
  className = '' 
}) => {
  // Transform metrics object into array format for RadarChart
  const chartData: DataQualityMetric[] = Object.entries(metrics)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter
      value: value ?? 0,
      fullMark: 100 // Maximum value
    }));

  // Calculate overall score
  const overallScore = chartData.reduce((acc, metric) => acc + metric.value, 0) / chartData.length;
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center">
          <div className="text-2xl font-bold mb-2">
            {overallScore.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground mb-4">Overall Quality Score</p>
          
          {/* Radar Chart */}
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Tooltip />
                <Radar
                  name="Quality"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {chartData.map((metric) => (
              <div key={metric.subject} className="flex flex-col items-center">
                <div className="text-sm font-medium">{metric.subject}</div>
                <div className="text-sm text-muted-foreground">{metric.value}%</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataQualityRadarChart;
