import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Activity } from 'lucide-react';

interface APIUsageChartProps {
  data?: any[];
}

export const APIUsageChart: React.FC<APIUsageChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>API Usage</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p>API usage chart will be displayed here</p>
            <p className="text-sm">Integration with chart library needed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};