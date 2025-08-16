
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SwotItem {
  title: string;
  description?: string;
}

interface SwotAnalysisChartProps {
  strengths: string[] | SwotItem[];
  weaknesses: string[] | SwotItem[];
  opportunities?: string[] | SwotItem[];
  threats?: string[] | SwotItem[];
  className?: string;
}

/**
 * Visual representation of SWOT analysis
 */
const SwotAnalysisChart: React.FC<SwotAnalysisChartProps> = ({
  strengths,
  weaknesses,
  opportunities = [],
  threats = [],
  className
}) => {
  // Convert string arrays to SwotItem arrays if needed
  const formatItems = (items: string[] | SwotItem[]): React.ReactNode[] => {
    return items.map((item, index) => {
      if (typeof item === 'string') {
        return <li key={index} className="mb-1">{item}</li>;
      } else {
        return (
          <li key={index} className="mb-1">
            <span className="font-medium">{item.title}</span>
            {item.description && <span className="text-sm text-muted-foreground"> - {item.description}</span>}
          </li>
        );
      }
    });
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* Strengths */}
      <Card className="border-green-500 border-t-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-green-600">Strengths</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside">
            {strengths.length > 0 ? formatItems(strengths) : <li className="text-muted-foreground">No data available</li>}
          </ul>
        </CardContent>
      </Card>

      {/* Weaknesses */}
      <Card className="border-red-500 border-t-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-600">Weaknesses</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside">
            {weaknesses.length > 0 ? formatItems(weaknesses) : <li className="text-muted-foreground">No data available</li>}
          </ul>
        </CardContent>
      </Card>

      {/* Opportunities */}
      <Card className="border-blue-500 border-t-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-600">Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside">
            {opportunities.length > 0 ? formatItems(opportunities) : <li className="text-muted-foreground">No data available</li>}
          </ul>
        </CardContent>
      </Card>

      {/* Threats */}
      <Card className="border-amber-500 border-t-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-600">Threats</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside">
            {threats.length > 0 ? formatItems(threats) : <li className="text-muted-foreground">No data available</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SwotAnalysisChart;
