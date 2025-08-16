
import React from 'react';
import { Progress } from "@/components/ui/progress";

interface MetricItemProps {
  label: string;
  value: string | number;
  percentage?: number;
  showProgress?: boolean;
  max?: number;
}

const MetricItem = ({ 
  label, 
  value, 
  percentage, 
  showProgress = true, 
  max = 100 
}: MetricItemProps) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      {showProgress && typeof percentage === 'number' && (
        <Progress value={percentage} max={max} className="h-2" />
      )}
    </div>
  );
};

export default MetricItem;
