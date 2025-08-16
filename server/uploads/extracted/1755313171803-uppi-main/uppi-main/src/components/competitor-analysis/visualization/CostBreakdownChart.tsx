import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';

export interface CostItem { provider: string; cost_usd: number }

interface CostBreakdownChartProps {
  items: CostItem[];
  title?: string;
  palette?: string[];
}

const DEFAULT_PALETTE = ['hsl(var(--chart-1))','hsl(var(--chart-2))','hsl(var(--chart-3))','hsl(var(--chart-4))','hsl(var(--chart-5))','hsl(var(--chart-6))','hsl(var(--chart-7))','hsl(var(--chart-8))'];

export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({ items, title = 'Cost Breakdown by Provider', palette }) => {
  const data = (items || [])
    .filter(i => typeof i.cost_usd === 'number' && i.cost_usd > 0)
    .map((i) => ({ name: i.provider, value: Number(i.cost_usd || 0) }))
    .sort((a, b) => b.value - a.value);

  const colors = palette ?? DEFAULT_PALETTE;

  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value: number) => `$${Number(value || 0).toFixed(4)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostBreakdownChart;
